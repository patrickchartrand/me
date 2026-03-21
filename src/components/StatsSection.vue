<script setup lang="ts">
const stats = [
  { value: '08', label: 'Years Experience' },
  { value: '1,458+', label: 'Projects Contributed To' },
  { value: '100%', label: 'Semantic HTML' },
  { value: '404', label: 'Bugs fixed (and counting)' },
]
</script>

<template>
  <section id="stats" class="px-6 md:px-12 lg:px-24 mb-40">
    <div
      class="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-16 pb-16 stagger-children"
    >
      <div v-for="stat in stats" :key="stat.label" class="flex flex-col gap-2 group cursor-default">
        <span
          class="text-5xl md:text-7xl font-serif group-hover:text-primary transition-all duration-500"
        >
          {{ stat.value }}
        </span>
        <span class="text-xs uppercase tracking-[0.15em] text-secondary mt-3">
          {{ stat.label }}
        </span>
      </div>
    </div>
  </section>
</template>
