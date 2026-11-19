/**
 * The mobile menu is a modal: it covers the page, locks scrolling behind it, and
 * is the only way back out.
 *
 * Two things it used to get wrong. The toggle button is `md:hidden`, but the
 * overlay was not — open it at 375px, widen past 768px, and the button vanished
 * while the overlay stayed, with nothing left to close it. And closing dropped
 * focus to <body>, sending a keyboard visitor back to the top of the document.
 */
export function useMobileMenu() {
  const mobileMenuOpen = ref(false)
  /** The hamburger, so focus can return to where it came from. */
  const menuToggle = ref<HTMLElement | null>(null)

  let desktop: MediaQueryList | null = null

  /*
   * Scrolling was locked but the tab order was not, so tabbing past the last
   * menu item walked into the thirteen links sitting invisible behind the
   * overlay. aria-modal tells a screen reader to ignore them; it does nothing
   * about focus. The overlay is z-40 and the header z-50, so only what sits
   * below it goes inert — the hamburger and the wordmark stay reachable,
   * which is how the menu gets closed again.
   */
  // #footer, not footer: the testimonial cards each close with their own
  // id-less <footer>, which main already covers.
  const background = () => document.querySelectorAll('main, #footer')

  const lockBackground = (locked: boolean) => {
    document.body.style.overflow = locked ? 'hidden' : ''
    background().forEach((el) =>
      locked ? el.setAttribute('inert', '') : el.removeAttribute('inert'),
    )
  }

  const closeMobileMenu = () => {
    if (!mobileMenuOpen.value) return
    mobileMenuOpen.value = false
    lockBackground(false)
    menuToggle.value?.focus()
  }

  const openMobileMenu = () => {
    mobileMenuOpen.value = true
    lockBackground(true)
  }

  // Delegating matters: closing with the hamburger used to set the flag here and
  // skip closeMobileMenu entirely, so focus was never handed back — the exact
  // bug the docblock above claims to fix.
  const toggleMobileMenu = () => (mobileMenuOpen.value ? closeMobileMenu() : openMobileMenu())

  const onBreakpoint = (event: MediaQueryListEvent) => {
    if (!event.matches) return
    /*
     * Widening past md pulls the overlay out from under the keyboard, and
     * closeMobileMenu is no help here: the hamburger it hands focus back to is
     * md:hidden by now, so focus would land on <body>. Send it to the nav that
     * just replaced the overlay instead — but only if it was inside, or this
     * would steal focus from wherever the visitor actually was.
     */
    const cameFromInside = document.activeElement?.closest('#mobile-menu') != null
    mobileMenuOpen.value = false
    lockBackground(false)
    if (cameFromInside) {
      document.querySelector<HTMLElement>('#header nav a')?.focus()
    }
  }

  onMounted(() => {
    // Matches Tailwind's md:, which is what hides the toggle button.
    desktop = window.matchMedia('(min-width: 768px)')
    desktop.addEventListener('change', onBreakpoint)
  })

  onUnmounted(() => {
    desktop?.removeEventListener('change', onBreakpoint)
    lockBackground(false)
  })

  return { mobileMenuOpen, menuToggle, toggleMobileMenu, closeMobileMenu }
}
