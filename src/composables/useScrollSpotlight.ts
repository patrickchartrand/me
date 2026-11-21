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
