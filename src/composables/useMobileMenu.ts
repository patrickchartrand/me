import { ref, onUnmounted } from 'vue'

export function useMobileMenu() {
  const mobileMenuOpen = ref(false)

  const toggleMobileMenu = () => {
    mobileMenuOpen.value = !mobileMenuOpen.value
    document.body.style.overflow = mobileMenuOpen.value ? 'hidden' : ''
  }

  const closeMobileMenu = () => {
    mobileMenuOpen.value = false
    document.body.style.overflow = ''
  }

  onUnmounted(() => {
    document.body.style.overflow = ''
  })

  return { mobileMenuOpen, toggleMobileMenu, closeMobileMenu }
}
