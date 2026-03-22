import { ref, onMounted, onUnmounted } from 'vue'

export function useActiveSection() {
  const activeSection = ref('hero')
  let navObserver: IntersectionObserver | null = null

  onMounted(() => {
    const sections = document.querySelectorAll('section[id], footer')

    navObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            activeSection.value = entry.target.id
          }
        })
      },
      { threshold: 0.3 },
    )

    sections.forEach((section) => navObserver!.observe(section))
  })

  onUnmounted(() => {
    navObserver?.disconnect()
  })

  return { activeSection }
}
