<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const technologies = [
  { name: 'Figma', slug: 'figma' },
  { name: 'TypeScript', slug: 'typescript' },
  { name: 'Tailwind', slug: 'tailwindcss' },
  { name: 'Vue.js', slug: 'vuedotjs' },
  { name: 'Nuxt', slug: 'nuxt' },
  { name: 'PHP', slug: 'php' },
  { name: 'Node.js', slug: 'nodedotjs' },
  { name: 'Prisma', slug: 'prisma' },
  { name: 'WordPress', slug: 'wordpress' },
  { name: 'Git', slug: 'git' },
  { name: 'Markdown', slug: 'markdown' },
  { name: 'XML', slug: 'xml' },
]

interface TechSvg {
  gray: string
  colored: string
}

const svgCache = ref<Record<string, TechSvg>>({})

onMounted(async () => {
  await Promise.all(
    technologies.map(async (tech) => {
      try {
        const res = await fetch(`https://cdn.simpleicons.org/${tech.slug}`)
        const original = await res.text()
        const gray = original.replace(/fill="[^"]*"/g, 'fill="currentColor"')
        svgCache.value[tech.slug] = { gray, colored: original }
      } catch {
        svgCache.value[tech.slug] = { gray: '', colored: '' }
      }
    }),
  )
})

const hovered = ref<string | null>(null)
</script>

<template>
  <section id="stack" class="px-6 md:px-12 lg:px-24 mb-40 fade-in-up">
    <div class="max-w-7xl mx-auto">
      <div class="mb-16">
        <p class="text-xs uppercase tracking-[0.3em] text-secondary mb-4">
          {{ t('stack.tagline') }}
        </p>
        <h2 class="text-4xl md:text-6xl font-serif">
          <span class="highlight-offset-md">{{ t('stack.title') }}</span>
        </h2>
      </div>

      <div class="grid justify-items-center grid-cols-3 md:grid-cols-6 gap-x-12 gap-y-10">
        <div
          v-for="tech in technologies"
          :key="tech.name"
          class="flex flex-col items-center gap-3 cursor-default"
          @mouseenter="hovered = tech.slug"
          @mouseleave="hovered = null"
        >
          <div
            class="tech-icon w-10 h-10 transition-opacity duration-300"
            :class="hovered === tech.slug ? 'opacity-100' : 'opacity-90'"
            v-html="
              hovered === tech.slug ? svgCache[tech.slug]?.colored : svgCache[tech.slug]?.gray
            "
          />
          <span
            class="text-xs uppercase tracking-[0.15em] transition-colors duration-300"
            :class="hovered === tech.slug ? 'text-charcoal' : 'text-secondary'"
          >
            {{ tech.name }}
          </span>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.tech-icon {
  color: #8a8a8a;
}

.tech-icon :deep(svg) {
  width: 100%;
  height: 100%;
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
