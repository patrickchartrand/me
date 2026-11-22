const NAV_SECTIONS = ['work', 'experience', 'footer'] as const

export function useActiveSection() {
  const activeSection = ref('')
  let navObserver: IntersectionObserver | null = null

  onMounted(() => {
    const banded = new Set<string>()
    navObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) banded.add(entry.target.id)
          else banded.delete(entry.target.id)
        }
        activeSection.value = NAV_SECTIONS.find((id) => banded.has(id)) ?? ''
      },
      { threshold: 0, rootMargin: '-50% 0px -50% 0px' },
    )

    for (const id of NAV_SECTIONS) {
      const element = document.getElementById(id)
      if (element) navObserver.observe(element)
    }
  })

  onUnmounted(() => {
    navObserver?.disconnect()
  })

  return { activeSection }
}
