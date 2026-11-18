export function useActiveSection() {
  const activeSection = ref('hero')
  let navObserver: IntersectionObserver | null = null

  onMounted(() => {
    // `footer` alone also matched the two id-less <footer> elements inside the
    // testimonial cards, which set activeSection to '' and put the nav indicator out.
    const sections = document.querySelectorAll('section[id], footer[id]')

    navObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.target.id) {
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
