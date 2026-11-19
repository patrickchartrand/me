<script setup lang="ts">
import { projects as projectsMeta } from '@/utils/projects'

const { t, tm } = useI18n()

interface ProjectTranslation {
  title: string
  category: string
  imageAlt: string
}

const isMobile = ref(false)
let mql: MediaQueryList | null = null

function onMQLChange(e: MediaQueryListEvent) {
  isMobile.value = e.matches
}

onMounted(() => {
  mql = window.matchMedia('(max-width: 767px)')
  isMobile.value = mql.matches
  mql.addEventListener('change', onMQLChange)
})

onUnmounted(() => {
  mql?.removeEventListener('change', onMQLChange)
})

const projects = computed(() => {
  const translations = tm('work.projects') as ProjectTranslation[]
  const mapped = projectsMeta.map((p, i) => ({
    ...p,
    title: translations[i]?.title ?? p.title,
    category: translations[i]?.category ?? p.category,
    // These were the only user-facing strings left in English on the fr page:
    // a screen reader read them out with French phonetics.
    imageAlt: translations[i]?.imageAlt ?? p.imageAlt,
  }))
  return isMobile.value ? [...mapped].sort((a, b) => Number(b.year) - Number(a.year)) : mapped
})
</script>

<template>
  <section id="work" class="px-6 md:px-12 lg:px-24 mb-40">
    <div class="max-w-7xl mx-auto">
      <div class="flex justify-between items-end mb-16 fade-in-up">
        <div>
          <p class="text-xs uppercase tracking-[0.3em] text-secondary mb-4">
            {{ t('work.tagline') }}
          </p>
          <h2 class="text-4xl md:text-6xl font-serif">
            <span class="highlight-offset-md">{{ t('work.title') }}</span>
          </h2>
        </div>
      </div>

      <div class="masonry-grid">
        <article
          v-for="project in projects"
          :key="project.link"
          class="masonry-item group fade-in-up mb-20 last:mb-0"
        >
          <a
            :href="project.link"
            target="_blank"
            rel="noopener noreferrer"
            class="block cursor-pointer rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
          >
            <div
              class="w-full overflow-hidden rounded-lg mb-6 relative"
              :class="project.imageHeight"
            >
              <div
                class="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10"
              />
              <img
                class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                :src="project.image"
                :alt="project.imageAlt"
                loading="lazy"
                decoding="async"
              />
            </div>
            <div class="flex justify-between items-start gap-4 pt-4">
              <!-- min-w-0 lets the title column shrink: without it an
                   unbreakable title at a larger root font size pushed the year
                   pill outside the card. -->
              <div class="min-w-0">
                <h3
                  class="text-2xl md:text-3xl font-serif mb-1 group-hover:text-primary transition-all duration-300"
                >
                  {{ project.title }}
                </h3>
                <p class="text-sm text-secondary">{{ project.category }}</p>
              </div>
              <span
                class="shrink-0 text-xs bg-accent text-cream rounded-full px-4 py-1.5 mt-1 font-mono"
              >
                {{ project.year }}
              </span>
            </div>
          </a>
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
  width: calc(100% - 30px);
  height: 60%;
  position: absolute;
  bottom: -10px;
  left: 30px;
  z-index: -1;
  background-color: var(--lavender);
  transition: all 0.3s ease;
}
.highlight-offset-md:hover::before {
  height: 40%;
}
</style>
