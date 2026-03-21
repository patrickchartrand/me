<script setup lang="ts">
import { ref, onMounted } from 'vue'

const stats = [
  { value: 8, display: '08', suffix: '', label: 'Years Experience' },
  { value: 1458, display: '1,458+', suffix: '+', label: 'Projects Contributed To' },
  { value: 100, display: '100%', suffix: '%', label: 'Semantic HTML' },
  { value: 404, display: '404', suffix: '', label: 'Bugs fixed (and counting)' },
]

const displayed = ref(stats.map(() => '0'))
const hasAnimated = ref(false)

const formatNumber = (val: number, index: number) => {
  if (index === 0) return val.toString().padStart(2, '0')
  if (index === 1) return val.toLocaleString('en-US') + '+'
  if (index === 2) return val + '%'
  return val.toString()
}

const animateCounters = () => {
  if (hasAnimated.value) return
  hasAnimated.value = true

  stats.forEach((stat, index) => {
    const duration = 1800
    const steps = 60
    const increment = stat.value / steps
    let current = 0
    let step = 0

    const timer = setInterval(() => {
      step++
      current = Math.min(Math.round(increment * step), stat.value)
      displayed.value[index] = formatNumber(current, index)
      if (current >= stat.value) clearInterval(timer)
    }, duration / steps)
  })
}

onMounted(() => {
  const section = document.getElementById('stats')
  if (!section) return

  const observer = new IntersectionObserver(
    (entries) => {
      if (entries[0]?.isIntersecting) {
        animateCounters()
        observer.disconnect()
      }
    },
    { threshold: 0.3 },
  )
  observer.observe(section)
})
</script>

<template>
  <section id="stats" class="px-6 md:px-12 lg:px-24 mb-40">
    <div
      class="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-16 pb-16 stagger-children"
    >
      <div
        v-for="(stat, index) in stats"
        :key="stat.label"
        class="flex flex-col gap-2 group cursor-default"
      >
        <span
          class="stat-number text-5xl md:text-7xl font-serif transition-colors duration-500 group-hover:text-primary"
        >
          {{ displayed[index] }}
        </span>
        <span class="text-xs uppercase tracking-[0.15em] text-secondary mt-3">
          {{ stat.label }}
        </span>
      </div>
    </div>
  </section>
</template>

<style scoped>
.stat-number {
  position: relative;
  display: inline-block;
  color: #1a1a1a;
}

.stat-number::after {
  content: '';
  position: absolute;
  bottom: 4px;
  left: 0;
  width: 0%;
  height: 40%;
  background-color: var(--color-lavender);
  z-index: -1;
  transition: width 0.4s ease;
  transform-origin: left center;
}

.group:hover .stat-number::after {
  width: 95%;
}
</style>
