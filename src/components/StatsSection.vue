<script setup lang="ts">
const { tm, locale } = useI18n()

interface StatItem {
  label: string
}

const statItems = computed(() => tm('stats.items') as StatItem[])

const CAREER_START_YEAR = 2017
const yearsOfExperience = new Date().getFullYear() - CAREER_START_YEAR

const rawValues = [yearsOfExperience, 1453, 100, 404]
const current = ref(rawValues.map(() => 0))
const hasAnimated = ref(false)

const formatNumber = (value: number, index: number) => {
  if (index === 0) return value.toString().padStart(2, '0')
  if (index === 1) return value.toLocaleString(locale.value === 'fr' ? 'fr-CA' : 'en-CA') + '+'
  if (index === 2) return value + '%'
  return value.toString()
}

const displayed = computed(() => current.value.map((value, index) => formatNumber(value, index)))

const timers: ReturnType<typeof setInterval>[] = []

const animateCounters = () => {
  if (hasAnimated.value) return
  hasAnimated.value = true

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    current.value = [...rawValues]
    return
  }

  rawValues.forEach((value, index) => {
    const duration = 1800
    const steps = 60
    const increment = value / steps
    let step = 0

    const timer = setInterval(() => {
      step++
      const next = Math.min(Math.round(increment * step), value)
      current.value[index] = next
      if (next >= value) clearInterval(timer)
    }, duration / steps)
    timers.push(timer)
  })
}

let observer: IntersectionObserver | null = null

onMounted(() => {
  const section = document.getElementById('stats')
  if (!section) return

  observer = new IntersectionObserver(
    (entries) => {
      if (entries[0]?.isIntersecting) {
        animateCounters()
        observer?.disconnect()
      }
    },
    { threshold: 0.3 },
  )
  observer.observe(section)
})

onUnmounted(() => {
  observer?.disconnect()
  timers.forEach(clearInterval)
})
</script>

<template>
  <section id="stats" class="px-6 md:px-12 lg:px-24 mb-40">
    <div class="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 xl:gap-16 stagger-children">
      <div
        v-for="(item, index) in statItems"
        :key="item.label"
        class="flex flex-col gap-2 group cursor-default"
      >
        <span
          class="stat-number text-charcoal text-5xl md:text-6xl xl:text-7xl font-serif transition-colors duration-500 group-hover:text-primary"
        >
          {{ displayed[index] }}
        </span>
        <span class="text-xs uppercase tracking-[0.15em] text-secondary mt-3">
          {{ item.label }}
        </span>
      </div>
    </div>
  </section>
</template>

<style scoped>
.stat-number {
  position: relative;
  display: inline-block;
}

.stat-number::after {
  content: '';
  position: absolute;
  bottom: 4px;
  left: 0;
  width: 0%;
  height: 40%;
  background-color: var(--lavender);
  z-index: -1;
  transition: width 0.4s ease;
  transform-origin: left center;
}

.group:hover .stat-number::after {
  width: 95%;
}
</style>
