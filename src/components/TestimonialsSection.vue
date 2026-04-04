<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { t, tm } = useI18n()

interface Testimonial {
  name: string
  title: string
  date: string
  quote: string
}

const testimonials = computed(() => tm('testimonials.items') as Testimonial[])
</script>

<template>
  <section id="testimonials" class="px-6 md:px-12 lg:px-24 mb-40">
    <div class="max-w-7xl mx-auto">
      <div class="mb-16 fade-in-up">
        <p class="text-xs uppercase tracking-[0.3em] text-secondary mb-4">
          {{ t('testimonials.tagline') }}
        </p>
        <h2 class="text-4xl md:text-6xl font-serif">
          <span class="highlight-offset">{{ t('testimonials.title') }}</span>
        </h2>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-8 stagger-children">
        <blockquote
          v-for="item in testimonials"
          :key="item.name"
          class="group relative bg-white/60 border border-charcoal/8 rounded-2xl p-8 md:p-10 flex flex-col gap-6 hover:shadow-lg hover:shadow-charcoal/5 transition-all duration-300"
        >
          <!-- Quote mark -->
          <span
            class="quote-mark absolute top-8 right-10 text-7xl font-serif leading-none select-none"
            aria-hidden="true"
          >
            "
          </span>

          <p
            class="mt-8 md:mt-6 text-lg md:text-xl font-light leading-relaxed text-charcoal/80 relative z-10"
          >
            {{ item.quote }}
          </p>

          <footer class="mt-auto flex items-center gap-4 pt-4 border-t border-charcoal/8">
            <div>
              <p class="font-medium text-charcoal text-sm">{{ item.name }}</p>
              <p class="text-xs text-secondary mt-0.5">{{ item.title }}</p>
              <p class="text-xs text-secondary/60 font-mono mt-1">{{ item.date }}</p>
            </div>
          </footer>
        </blockquote>
      </div>
    </div>
  </section>
</template>

<style scoped>
.highlight-offset {
  position: relative;
  display: inline-block;
  z-index: 1;
}
.highlight-offset::before {
  content: '';
  display: block;
  width: 100%;
  height: 80%;
  position: absolute;
  bottom: -10px;
  left: 18px;
  z-index: -1;
  background-color: var(--color-lavender);
  transition: all 0.3s ease;
}
.highlight-offset:hover::before {
  height: 60%;
}

.quote-mark {
  color: color-mix(in srgb, var(--color-lavender) 50%, transparent);
}
</style>
