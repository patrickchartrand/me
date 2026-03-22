export async function useDownload({ filename, filepath }: { filename: string; filepath: string }) {
  const html2pdf = (await import('html2pdf.js')).default

  // Overlay avec loader
  document.documentElement.style.overflow = 'hidden'
  const overlay = document.createElement('div')
  overlay.style.cssText =
    'position:fixed;inset:0;z-index:9999;background:#3d405b;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1.5rem;'
  overlay.innerHTML = `
    <style>
      @keyframes spin { to { transform: rotate(360deg); } }
      @keyframes fade-in { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
      .pdf-spinner {
        width: 48px;
        height: 48px;
        border: 3px solid rgba(245,243,239,0.15);
        border-top-color: #F5F3EF;
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
      }
      .pdf-label {
        font-family: 'Inter', sans-serif;
        font-size: 0.75rem;
        letter-spacing: 0.2em;
        text-transform: uppercase;
        color: rgba(245,243,239,0.6);
        animation: fade-in 0.4s ease forwards;
      }
      .pdf-dot {
        display: inline-block;
        animation: fade-in 0.4s ease infinite alternate;
      }
      .pdf-dot:nth-child(2) { animation-delay: 0.2s; }
      .pdf-dot:nth-child(3) { animation-delay: 0.4s; }
    </style>
    <div class="pdf-spinner"></div>
    <div class="pdf-label">
      Generating PDF
      <span class="pdf-dot">.</span><span class="pdf-dot">.</span><span class="pdf-dot">.</span>
    </div>
  `
  document.body.appendChild(overlay)

  const response = await fetch(filepath)
  const html = await response.text()

  const container = document.createElement('div')
  container.style.cssText = 'position:fixed;top:0;left:-9999px;width:210mm;'
  container.innerHTML = html
  document.body.appendChild(container)

  const dateEl = container.querySelector('#letter-date') as HTMLElement
  if (dateEl) {
    const mois = [
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
    dateEl.textContent = `Granby, le ${today.getDate()} ${mois[today.getMonth()]} ${today.getFullYear()}`
  }

  await new Promise((resolve) => setTimeout(resolve, 800))

  const firstPage = container.querySelector('.page') as HTMLElement
  const worker = html2pdf()
    .set({
      margin: 0,
      filename,
      image: { type: 'jpeg', quality: 0.98 },
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

  document.body.removeChild(container)

  // Fade out overlay
  overlay.style.transition = 'opacity 0.4s ease'
  overlay.style.opacity = '0'
  await new Promise((resolve) => setTimeout(resolve, 400))
  document.body.removeChild(overlay)
  document.documentElement.style.overflow = ''
}
