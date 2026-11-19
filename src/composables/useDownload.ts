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

/**
 * A frame, or 50 ms, whichever comes first.
 *
 * requestAnimationFrame does not fire in a backgrounded tab. Awaiting a bare
 * one inside the teardown meant a visitor who clicked download and switched
 * tabs could leave the finally parked indefinitely — overlay up, #app inert,
 * `running` still true, the buttons dead until they came back. The timeout is
 * the floor that keeps every exit path moving.
 */
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

export async function useDownload(
  locale: string,
  { filename, filepath }: { filename: string; filepath: string },
) {
  if (running) return
  running = true

  /*
   * The export injects the fetched page into THIS document, stylesheet link and
   * all, and both PDF stylesheets open with a `*` rule. For the second or so
   * that the link is live, every margin and padding on the portfolio is wiped,
   * the page collapses, and the browser clamps the scroll offset to the new
   * height. The collapse is invisible behind the overlay; the lost scroll
   * position is not, so it is captured here and put back in the finally.
   */
  const scrollTop = window.scrollY
  /*
   * Which page that offset belongs to. Nothing cancels this function on
   * unmount — it is called straight from a template handler — and inert does
   * not reach the browser's own Back button, so a visitor who navigates during
   * the several seconds of opaque overlay would otherwise have the teardown
   * force the portfolio's offset onto whatever page is showing by then.
   */
  const scrollOrigin = window.location.pathname
  document.documentElement.style.overflow = 'hidden'

  /*
   * The overlay covers the page but lives outside #app, so the app behind it
   * keeps its place in the tab order and in the accessibility tree. `inert`
   * takes it out of both for the duration — overflow:hidden above only stops
   * the page scrolling, it does nothing for focus.
   */
  const appRoot = document.getElementById('app')
  /*
   * inert blurs whatever had focus, and the browser drops it on <body> — which
   * sends a keyboard visitor back to the top of the document, the very thing
   * useMobileMenu was fixed for. Remember the trigger and hand it back.
   */
  const trigger = document.activeElement
  const returnFocusTo = trigger instanceof HTMLElement && trigger !== document.body ? trigger : null
  appRoot?.setAttribute('inert', '')

  const overlay = document.createElement('div')
  overlay.style.cssText =
    'position:fixed;inset:0;z-index:9999;background:#3d405b;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1.5rem;'
  /*
   * The dots carry `both` for the backwards half: without it a delayed element
   * keeps its normal style — opacity 1 — for the whole animation-delay and only
   * snaps to the first keyframe once that delay elapses. The two trailing dots
   * therefore sat lit at full brightness and blinked out 234 ms and 410 ms after
   * the overlay appeared. They pulse on opacity alone, too: the fade they used
   * to share with the label bobbed each dot 8px, which is not what a pulsing
   * ellipsis should do.
   *
   * Comments belong here and not in the literal below — that string is injected
   * into the live document, so anything written inside it ships to the visitor.
   */
  overlay.innerHTML = `
    <style>
      @keyframes pdf-spin { to { transform: rotate(360deg); } }
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
        text-align: center;
      }
      .pdf-dot {
        display: inline-block;
        animation: pdf-pulse 0.6s ease-in-out infinite alternate both;
      }
      .pdf-dot + .pdf-dot { animation-delay: 0.2s; }
      .pdf-dot + .pdf-dot + .pdf-dot { animation-delay: 0.4s; }
      .pdf-status {
        position: absolute;
        width: 1px;
        height: 1px;
        margin: -1px;
        padding: 0;
        border: 0;
        overflow: hidden;
        clip-path: inset(50%);
        white-space: nowrap;
      }
    </style>
    <div class="pdf-spinner" aria-hidden="true"></div>
    <div class="pdf-label">${locale === 'en' ? 'Generating PDF' : 'Génération du PDF'}<span
      class="pdf-dot" aria-hidden="true">.</span><span class="pdf-dot" aria-hidden="true">.</span><span
      class="pdf-dot" aria-hidden="true">.</span></div>
    <div class="pdf-status" role="status"></div>
  `
  document.body.appendChild(overlay)

  /*
   * The label is not animated. It used to fade in over 400ms, and the overlay's
   * background and spinner do not — so on the first export the dark panel
   * appeared with no text in it. Measured: opacity still 0 at 107ms across
   * three frames while the 976 kB chunk was being fetched, then a fade whose
   * middle lost 218ms to compiling it, jumping 0.41 to 0.96 in one step. The
   * animation is also pending at insert (startTime null), so its start waits on
   * the same busy main thread that delays the first paint. Nothing about that
   * is fixable from inside a 400ms fade; the text simply arrives with the panel
   * it belongs to.
   *
   * The announcement is deferred, the visible text is not. A live region
   * inserted with its message already inside counts as initial content and is
   * not announced, so the message has to arrive after the region does — but
   * doing that to the on-screen label meant the text popped in a frame late,
   * which read as a flash on the first export, when the main thread is busiest
   * fetching and compiling html2pdf. The hidden region carries the delay now
   * and the label is painted complete.
   */
  let settled = false
  const announce = (message: string, final = false) => {
    // A fast failure — a 404 on the page, an import that rejects at once — can
    // reach the catch before the deferred progress message has landed, and the
    // late one would then bury the only thing worth hearing.
    if (settled) return
    settled = final
    const status = overlay.querySelector('.pdf-status')
    if (status) status.textContent = message
  }
  void nextFrame().then(() => announce(locale === 'en' ? 'Generating PDF' : 'Génération du PDF'))

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
        locale === 'en'
          ? 'Download failed — please try again'
          : 'Échec du téléchargement — veuillez réessayer'
      announce(label.textContent, true)
    }
    await new Promise((resolve) => setTimeout(resolve, 1800))
  } finally {
    container?.remove()
    appRoot?.removeAttribute('inert')
    returnFocusTo?.focus()

    /*
     * html2pdf appends an overlay of its own to <body> — fixed, inset 0,
     * z-index 1000, opacity 0, no pointer-events — and removes it only inside
     * the .then() that follows html2canvas. Any render rejection skips that
     * removal, and because opacity 0 is still hit-tested the visitor is left
     * with a page that looks untouched and swallows every click, including the
     * retry the error message just asked for. Only a reload would recover.
     * Clearing it here is what makes the docblock's promise above true.
     */
    document.querySelectorAll('.html2pdf__overlay').forEach((el) => el.remove())

    /*
     * Scroll before the fade, not after: fading out first would reveal the page
     * at the offset the collapse clamped it to for the whole 400 ms and then
     * snap. Unlocking while the overlay is still fully opaque also hides the
     * scrollbar coming back.
     *
     * The offset is re-asserted rather than set once. Dropping the injected
     * stylesheet invalidates styles, but the page's real height comes back a
     * frame or more later — forcing a reflow is not enough (measured 10984px
     * against a true 11680px) — and a scrollTo issued before that lands clamped
     * short of the target. Bounded at ten frames, every one of them behind the
     * still-opaque overlay; a visitor who never scrolled exits on the first test.
     */
    document.documentElement.style.overflow = ''
    if (window.location.pathname === scrollOrigin) {
      /*
       * Hold the offset until it stops moving, rather than until it first
       * matches. Exiting on the first match let the loop finish before the
       * height had finished coming back, and scroll anchoring then nudged the
       * page 12px once it did — measured against a control that showed no
       * drift at all over ten seconds without an export.
       */
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
