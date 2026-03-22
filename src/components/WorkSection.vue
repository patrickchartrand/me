<script setup lang="ts">
import { projects } from '@/utils/projects'

function navigateTo(url: string) {
  window.open(url, '_blank')
}
</script>

<template>
  <section id="work" class="px-6 md:px-12 lg:px-24 mb-40">
    <div class="max-w-7xl mx-auto">
      <div class="flex justify-between items-end mb-20 fade-in-up">
        <div>
          <p class="text-xs uppercase tracking-[0.3em] text-secondary mb-4">Portfolio</p>
          <h2 class="text-4xl md:text-6xl font-serif">
            <span class="highlight-offset-md">Selected Work</span>
          </h2>
        </div>
      </div>

      <div class="masonry-grid">
        <article
          v-for="project in projects"
          :key="project.title"
          class="masonry-item group cursor-pointer fade-in-up mb-20"
          @click="navigateTo(project.link)"
        >
          <div class="w-full overflow-hidden rounded-lg mb-6 relative" :class="project.imageHeight">
            <div
              class="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10"
            />
            <img
              class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              :src="project.image"
              :alt="project.imageAlt"
            />
          </div>
          <div class="flex justify-between items-start pt-4">
            <div>
              <h3
                class="text-2xl md:text-3xl font-serif mb-1 group-hover:text-primary transition-all duration-300"
                v-html="project.title"
              />
              <p class="text-sm text-secondary">{{ project.category }}</p>
            </div>
            <span class="text-xs bg-[#81b29a] text-white rounded-full px-4 py-1.5 mt-1 font-mono">
              {{ project.year }}
            </span>
          </div>
        </article>
      </div>
    </div>
  </section>
</template>

<style scoped>
.masonry-grid {
  columns: 1;
  column-gap: 3rem;
}

@media (min-width: 768px) {
  .masonry-grid {
    columns: 2;
  }
}

.masonry-item {
  break-inside: avoid;
}

.highlight-offset-md {
  position: relative;
  display: inline-block;
  z-index: 1;
}
.highlight-offset-md::before {
  content: '';
  display: block;
  width: 100%;
  height: 80%;
  position: absolute;
  bottom: -6px;
  left: 12px;
  z-index: -1;
  background-color: var(--color-lavender);
  transition: all 0.3s ease;
}
.highlight-offset-md:hover::before {
  height: 60%;
}
</style>
