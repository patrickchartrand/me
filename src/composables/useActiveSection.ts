/**
 * Which section the nav should mark as current.
 *
 * A 0.3 threshold made this height-dependent: a section taller than a third of
 * the viewport could never reach it, so Work never lit up on short screens,
 * while a long section that scrolled past its own threshold turned the
 * indicator off entirely. A zero-height band across the middle of the viewport
 * asks a different question — "what is under the midline" — which no section
 * height can defeat.
 *
 * Only the three sections the nav actually links to are observed; everything
 * else was noise, including the two id-less <footer> elements inside the
 * testimonial cards, which used to blank the indicator.
 */
const NAV_SECTIONS = ['work', 'experience', 'footer'] as const

export function useActiveSection() {
  const activeSection = ref('hero')
  let navObserver: IntersectionObserver | null = null

  onMounted(() => {
    navObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) activeSection.value = entry.target.id
        }
      },
      // A 1px band at the vertical middle of the viewport.
      { threshold: 0, rootMargin: '-50% 0px -50% 0px' },
    )

    for (const id of NAV_SECTIONS) {
      const el = document.getElementById(id)
      if (el) navObserver.observe(el)
    }
  })

  onUnmounted(() => {
    navObserver?.disconnect()
  })

  return { activeSection }
}
