import { i18n } from '@/i18n'

let running = false

function nextFrame(): Promise<void> {
  return new Promise((resolve) => {
    let settled = false
    const finish = () => {
      if (settled) return
      settled = true
      resolve()
    }
    requestAnimationFrame(finish)
    setTimeout(finish, 50)
  })
}

function decodeCloudflareEmail(encoded: string): string {
  if (encoded.length < 4) return ''
  const key = parseInt(encoded.slice(0, 2), 16)
  let address = ''
  for (let i = 2; i < encoded.length; i += 2) {
    address += String.fromCharCode(parseInt(encoded.slice(i, i + 2), 16) ^ key)
  }
  return address
}

function restoreProtectedEmails(root: HTMLElement) {
  root
    .querySelectorAll<HTMLAnchorElement>('a[href*="/cdn-cgi/l/email-protection"]')
    .forEach((link) => {
      const address = decodeCloudflareEmail(link.getAttribute('href')?.split('#')[1] ?? '')
      if (address) link.setAttribute('href', `mailto:${address}`)
    })
  root.querySelectorAll<HTMLElement>('.__cf_email__').forEach((placeholder) => {
    const address = decodeCloudflareEmail(placeholder.dataset.cfemail ?? '')
    if (address) placeholder.replaceWith(document.createTextNode(address))
  })
}

export async function useDownload({ filename, filepath }: { filename: string; filepath: string }) {
  if (running) return
  running = true

  const scrollTop = window.scrollY
  const scrollOrigin = window.location.pathname
  document.documentElement.style.overflow = 'hidden'

  const appRoot = document.getElementById('app')
  const trigger = document.activeElement
  const returnFocusTo = trigger instanceof HTMLElement && trigger !== document.body ? trigger : null
  appRoot?.setAttribute('inert', '')

  const overlay = document.createElement('div')
  overlay.style.cssText =
    'position:fixed;inset:0;z-index:9999;background:#3d405b;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1.5rem;'
  overlay.innerHTML = `
    <style>
      @keyframes pdf-spin { to { transform: rotate(360deg); } }
      @keyframes pdf-fade-in { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
      @keyframes pdf-pulse { from { opacity: 0.25; } to { opacity: 1; } }
      .pdf-spinner {
        width: 48px;
        height: 48px;
        border: 3px solid rgba(245,243,239,0.15);
        border-top-color: #F5F3EF;
        border-radius: 50%;
        animation: pdf-spin 0.8s linear infinite;
      }
      .pdf-label {
        font-family: 'Inter', sans-serif;
        font-size: 0.75rem;
        letter-spacing: 0.2em;
        text-transform: uppercase;
        color: rgba(245,243,239,0.6);
        animation: pdf-fade-in 0.4s ease forwards;
        text-align: center;
      }
      .pdf-dot {
        display: inline-block;
        animation: pdf-pulse 0.6s ease-in-out infinite alternate both;
      }
      .pdf-dot + .pdf-dot { animation-delay: 0.2s; }
      .pdf-dot + .pdf-dot + .pdf-dot { animation-delay: 0.4s; }
    </style>
    <div class="pdf-spinner" aria-hidden="true"></div>
    <div class="pdf-label" role="status"><span class="pdf-text"></span><span
      class="pdf-dot" aria-hidden="true">.</span><span class="pdf-dot" aria-hidden="true">.</span><span
      class="pdf-dot" aria-hidden="true">.</span></div>
  `
  document.body.appendChild(overlay)

  void nextFrame().then(() => {
    const text = overlay.querySelector('.pdf-text')
    if (text) text.textContent = i18n.global.t('download.generating')
  })

  let container: HTMLDivElement | null = null

  try {
    const html2pdf = (await import('html2pdf.js')).default

    const response = await fetch(filepath)
    if (!response.ok) throw new Error(`${filepath} answered ${response.status}`)
    const html = await response.text()

    container = document.createElement('div')
    container.style.cssText = 'position:fixed;top:0;left:-9999px;width:210mm;'
    container.innerHTML = html
    restoreProtectedEmails(container)
    document.body.appendChild(container)

    const dateEl = container.querySelector<HTMLElement>('#letter-date')
    if (dateEl) {
      const monthNames = [
        'janvier',
        'février',
        'mars',
        'avril',
        'mai',
        'juin',
        'juillet',
        'août',
        'septembre',
        'octobre',
        'novembre',
        'décembre',
      ]
      const today = new Date()
      const day = today.getDate()
      dateEl.textContent = `Granby, le ${day === 1 ? '1er' : day} ${monthNames[today.getMonth()]} ${today.getFullYear()}`
    }

    await new Promise((resolve) => setTimeout(resolve, 800))

    const firstPage = container.querySelector<HTMLElement>('.page')
    if (!firstPage) throw new Error(`no .page element found in ${filepath}`)

    const worker = html2pdf()
      .set({
        margin: 0,
        filename,
        image: { type: 'jpeg', quality: 0.92 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      })
      .from(firstPage)

    await worker
      .toPdf()
      .get('pdf')
      .then((pdf) => {
        while (pdf.internal.getNumberOfPages() > 1) pdf.deletePage(2)
      })

    await worker.save()
  } catch (e) {
    console.error('[useDownload]', e)
    overlay.querySelector('.pdf-spinner')?.remove()
    const label = overlay.querySelector('.pdf-label')
    if (label) label.textContent = i18n.global.t('download.failed')
    await new Promise((resolve) => setTimeout(resolve, 1800))
  } finally {
    container?.remove()
    appRoot?.removeAttribute('inert')
    returnFocusTo?.focus()

    document.querySelectorAll('.html2pdf__overlay').forEach((stranded) => stranded.remove())
    document.documentElement.style.overflow = ''
    if (window.location.pathname === scrollOrigin) {
      let stable = 0
      for (let frame = 0; frame < 10 && stable < 3; frame++) {
        await nextFrame()
        if (window.scrollY === scrollTop) {
          stable++
        } else {
          stable = 0
          window.scrollTo({ top: scrollTop, behavior: 'instant' as ScrollBehavior })
        }
      }
    }

    overlay.style.transition = 'opacity 0.4s ease'
    overlay.style.opacity = '0'
    await new Promise((resolve) => setTimeout(resolve, 400))
    overlay.remove()
    running = false
  }
}
