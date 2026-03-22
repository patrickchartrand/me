<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { t, tm } = useI18n()

interface ExperienceItem {
  company: string
  role: string
  period: string
}

interface EducationItem {
  degree: string
  school: string
  period: string
}

const experiences = computed(() => tm('experience.items') as ExperienceItem[])
const education = computed(() => tm('experience.education') as EducationItem[])
</script>

<template>
  <section
    id="experience"
    class="relative w-screen left-1/2 -translate-x-1/2 mb-40 bg-charcoal text-cream py-28"
  >
    <div class="max-w-7xl mx-auto px-6 md:px-12 lg:px-24">
      <div class="grid grid-cols-1 md:grid-cols-12 gap-16">
        <!-- Experience Column -->
        <div class="md:col-span-7 fade-in-up">
          <h2 class="text-3xl font-serif mb-14">
            <span class="highlight-offset-dark">{{ t('experience.experienceTitle') }}</span>
          </h2>
          <div class="space-y-0 stagger-children">
            <div
              v-for="item in experiences"
              :key="item.company"
              class="group py-5 hover:bg-cream/5 transition-colors duration-300 -mx-4 px-4 rounded-lg"
            >
              <div class="flex flex-col md:flex-row md:items-baseline justify-between gap-2 mb-2">
                <h3 class="text-lg font-medium group-hover:text-accent transition-colors">
                  {{ item.company }}
                </h3>
                <span class="text-sm text-cream/40 font-mono">{{ item.period }}</span>
              </div>
              <p class="text-cream/50 text-sm">{{ item.role }}</p>
            </div>
          </div>
        </div>

        <!-- Education Column -->
        <div class="md:col-span-5 fade-in-up">
          <h2 class="text-3xl font-serif mb-14">
            <span class="highlight-offset-dark">{{ t('experience.educationTitle') }}</span>
          </h2>
          <div class="space-y-0 stagger-children">
            <div
              v-for="item in education"
              :key="item.degree"
              class="group py-5 hover:bg-cream/5 transition-colors duration-300 -mx-4 px-4 rounded-lg"
            >
              <div class="flex flex-col gap-1">
                <h3 class="text-lg font-medium group-hover:text-accent transition-colors">
                  {{ item.degree }}
                </h3>
                <p class="text-sm text-cream/60">{{ item.school }}</p>
                <span class="text-xs text-cream/30 font-mono mt-1">{{ item.period }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.highlight-offset-dark {
  position: relative;
  display: inline-block;
  z-index: 1;
}
.highlight-offset-dark::before {
  content: '';
  display: block;
  width: 100%;
  height: 80%;
  position: absolute;
  bottom: -4px;
  left: 8px;
  z-index: -1;
  background-color: color-mix(in srgb, var(--color-lavender) 25%, transparent);
  transition: all 0.3s ease;
}
.highlight-offset-dark:hover::before {
  height: 60%;
}
</style>
