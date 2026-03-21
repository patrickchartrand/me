import { onMounted, onUnmounted } from 'vue'

export function useHeaderScroll() {
  let scrollHandler: (() => void) | null = null

  onMounted(() => {
    const header = document.getElementById('header')

    scrollHandler = () => {
      if (!header) return
      if (window.scrollY > 60) {
        header.classList.add('py-3', 'shadow-sm')
        header.classList.remove('py-6')
      } else {
        header.classList.remove('py-3', 'shadow-sm')
        header.classList.add('py-6')
      }
    }

    window.addEventListener('scroll', scrollHandler)
  })

  onUnmounted(() => {
    if (scrollHandler) window.removeEventListener('scroll', scrollHandler)
  })
}
