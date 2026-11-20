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
  const activeSection = ref('')
  let navObserver: IntersectionObserver | null = null

  onMounted(() => {
    // Both edges matter. Acting only on `isIntersecting` left the last section
    // crossed highlighted for ever, including back at the top of the page where
    // the hero has no nav entry at all.
    const banded = new Set<string>()
    navObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) banded.add(entry.target.id)
          else banded.delete(entry.target.id)
        }
        activeSection.value = NAV_SECTIONS.find((id) => banded.has(id)) ?? ''
      },
      // A 1px band at the vertical middle of the viewport.
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
