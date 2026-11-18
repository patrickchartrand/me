/**
 * Renders one of the static pages in public/site/ to a PDF and saves it.
 *
 * The whole run sits behind an opaque overlay with the page scroll locked, so
 * every exit path has to be guaranteed: without the finally below, any failure
 * — a network blip, html2canvas choking on a CSS property — would leave the
 * visitor staring at a frozen screen with no way back but a reload.
 *
 * The overlay goes up before the dynamic import, not after: that import pulls
 * roughly 976 kB, and until it resolves the button would otherwise look inert
 * and invite a second click.
 */

/** Shared across both buttons on purpose: one export at a time. */
let running = false

export async function useDownload(
  locale: string,
  { filename, filepath }: { filename: string; filepath: string },
) {
  if (running) return
  running = true

  document.documentElement.style.overflow = 'hidden'
  const overlay = document.createElement('div')
  overlay.style.cssText =
    'position:fixed;inset:0;z-index:9999;background:#3d405b;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1.5rem;'
  overlay.innerHTML = `
    <style>
      @keyframes pdf-spin { to { transform: rotate(360deg); } }
      @keyframes pdf-fade-in { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
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
        animation: pdf-fade-in 0.4s ease infinite alternate;
      }
      .pdf-dot:nth-child(2) { animation-delay: 0.2s; }
      .pdf-dot:nth-child(3) { animation-delay: 0.4s; }
    </style>
    <div class="pdf-spinner"></div>
    <div class="pdf-label">
      ${locale === 'en' ? 'Generating PDF' : 'Génération du PDF'}
      <span class="pdf-dot">.</span><span class="pdf-dot">.</span><span class="pdf-dot">.</span>
    </div>
  `
  document.body.appendChild(overlay)

  let container: HTMLDivElement | null = null

  try {
    const html2pdf = (await import('html2pdf.js')).default

    const response = await fetch(filepath)
    if (!response.ok) throw new Error(`${filepath} answered ${response.status}`)
    const html = await response.text()

    container = document.createElement('div')
    container.style.cssText = 'position:fixed;top:0;left:-9999px;width:210mm;'
    container.innerHTML = html
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
      // The first of the month is "1er" in French; every other day is bare.
      const day = today.getDate()
      dateEl.textContent = `Granby, le ${day === 1 ? '1er' : day} ${monthNames[today.getMonth()]} ${today.getFullYear()}`
    }

    // Let the injected stylesheets and webfonts settle before rasterising.
    await new Promise((resolve) => setTimeout(resolve, 800))

    const firstPage = container.querySelector<HTMLElement>('.page')
    if (!firstPage) throw new Error(`no .page element found in ${filepath}`)

    const worker = html2pdf()
      .set({
        margin: 0,
        filename,
        // 0.98 put ~149 kB of JPEG artefact budget into a page that is mostly text.
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
    // Say so on screen rather than fail silently behind the overlay.
    overlay.querySelector('.pdf-spinner')?.remove()
    const label = overlay.querySelector('.pdf-label')
    if (label) {
      label.textContent =
        locale === 'en' ? 'Download failed — please try again' : 'Échec du téléchargement'
    }
    await new Promise((resolve) => setTimeout(resolve, 1800))
  } finally {
    container?.remove()
    overlay.style.transition = 'opacity 0.4s ease'
    overlay.style.opacity = '0'
    await new Promise((resolve) => setTimeout(resolve, 400))
    overlay.remove()
    document.documentElement.style.overflow = ''
    running = false
  }
}
