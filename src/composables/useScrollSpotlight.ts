/**
 * Gives a hover-only highlight back to touch screens.
 *
 * The experience and education rows light up on :hover — a background wash and
 * the title turning accent — which on a phone never happens at all, so the
 * whole effect is dead weight there. This follows the scroll instead: whichever
 * row sits under the middle of the viewport is the one marked.
 *
 * The same zero-height midline band useActiveSection uses, for the same reason.
 * A threshold would be height-dependent — a row taller than the fraction asked
 * for could never reach it — whereas "what is under the midline" cannot be
 * defeated by a row being tall or short.
 *
 * Below md only. Above it the pointer already does this job, and two sources
 * driving one highlight would fight each other.
 */
export function useScrollSpotlight(
  container: Ref<HTMLElement | null>,
  rows: Ref<readonly unknown[]>,
) {
  const spotlit = ref(-1)

  let observer: IntersectionObserver | null = null
  let desktop: MediaQueryList | null = null
  const banded = new Set<Element>()

  function connect() {
    if (observer || !container.value) return
    const items = [...container.value.children]
    observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) banded.add(entry.target)
          else banded.delete(entry.target)
        }
        // Both edges matter: acting only on isIntersecting would leave the last
        // row crossed lit for ever, including well past the section.
        spotlit.value = items.findIndex((row) => banded.has(row))
      },
      { threshold: 0, rootMargin: '-50% 0px -50% 0px' },
    )
    items.forEach((row) => observer?.observe(row))
  }

  function disconnect() {
    observer?.disconnect()
    observer = null
    banded.clear()
    spotlit.value = -1
  }

  const onBreakpoint = (event: MediaQueryList | MediaQueryListEvent) =>
    event.matches ? disconnect() : connect()

  onMounted(() => {
    desktop = window.matchMedia('(min-width: 768px)')
    desktop.addEventListener('change', onBreakpoint)
    onBreakpoint(desktop)
  })

  // Switching language re-renders the list, which would leave the observer
  // holding elements that are no longer in the document.
  watch(rows, async () => {
    if (desktop?.matches) return
    disconnect()
    await nextTick()
    connect()
  })

  onUnmounted(() => {
    desktop?.removeEventListener('change', onBreakpoint)
    disconnect()
  })

  return { spotlit }
}
