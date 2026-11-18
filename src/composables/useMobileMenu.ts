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

  const lockScroll = (locked: boolean) => {
    document.body.style.overflow = locked ? 'hidden' : ''
  }

  const closeMobileMenu = () => {
    if (!mobileMenuOpen.value) return
    mobileMenuOpen.value = false
    lockScroll(false)
    menuToggle.value?.focus()
  }

  const openMobileMenu = () => {
    mobileMenuOpen.value = true
    lockScroll(true)
  }

  // Delegating matters: closing with the hamburger used to set the flag here and
  // skip closeMobileMenu entirely, so focus was never handed back — the exact
  // bug the docblock above claims to fix.
  const toggleMobileMenu = () => (mobileMenuOpen.value ? closeMobileMenu() : openMobileMenu())

  const onBreakpoint = (event: MediaQueryListEvent) => {
    if (event.matches) {
      mobileMenuOpen.value = false
      lockScroll(false)
    }
  }

  onMounted(() => {
    // Matches Tailwind's md:, which is what hides the toggle button.
    desktop = window.matchMedia('(min-width: 768px)')
    desktop.addEventListener('change', onBreakpoint)
  })

  onUnmounted(() => {
    desktop?.removeEventListener('change', onBreakpoint)
    lockScroll(false)
  })

  return { mobileMenuOpen, menuToggle, toggleMobileMenu, closeMobileMenu }
}
