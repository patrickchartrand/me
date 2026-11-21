export function useMobileMenu() {
  const mobileMenuOpen = ref(false)
  const menuToggle = ref<HTMLElement | null>(null)

  let desktop: MediaQueryList | null = null

  const background = () => document.querySelectorAll('main, #footer')

  const lockBackground = (locked: boolean) => {
    document.body.style.overflow = locked ? 'hidden' : ''
    background().forEach((element) =>
      locked ? element.setAttribute('inert', '') : element.removeAttribute('inert'),
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

  const toggleMobileMenu = () => (mobileMenuOpen.value ? closeMobileMenu() : openMobileMenu())

  const onBreakpoint = (event: MediaQueryListEvent) => {
    if (!event.matches) return
    const cameFromInside = document.activeElement?.closest('#mobile-menu') != null
    mobileMenuOpen.value = false
    lockBackground(false)
    if (cameFromInside) {
      document.querySelector<HTMLElement>('#header nav a')?.focus()
    }
  }

  onMounted(() => {
    desktop = window.matchMedia('(min-width: 768px)')
    desktop.addEventListener('change', onBreakpoint)
  })

  onUnmounted(() => {
    desktop?.removeEventListener('change', onBreakpoint)
    lockBackground(false)
  })

  return { mobileMenuOpen, menuToggle, toggleMobileMenu, closeMobileMenu }
}
