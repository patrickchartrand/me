<script setup lang="ts">
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

// The rows only light up on hover, which a touch screen never delivers; below
// md the highlight follows the scroll instead.
const experienceList = ref<HTMLElement | null>(null)
const educationList = ref<HTMLElement | null>(null)
const { spotlit: spotlitExperience } = useScrollSpotlight(experienceList, experiences)
const { spotlit: spotlitEducation } = useScrollSpotlight(educationList, education)
</script>

<template>
  <section
    id="experience"
    class="relative mb-40 bg-charcoal text-cream py-28 px-6 md:px-12 lg:px-24"
  >
    <div class="max-w-7xl mx-auto">
      <div class="grid grid-cols-1 md:grid-cols-12 gap-y-16 gap-x-8 lg:gap-x-16">
        <!-- Experience Column -->
        <div class="md:col-span-7 fade-in-up">
          <h2 class="text-3xl font-serif mb-14">
            <span class="highlight-offset-dark">{{ t('experience.experienceTitle') }}</span>
          </h2>
          <div ref="experienceList" class="space-y-0 stagger-children">
            <div
              v-for="(item, i) in experiences"
              :key="item.company"
              class="exp-row py-5 transition-colors duration-300 -mx-4 px-4 rounded-lg"
              :class="{ 'bg-cream/5': i === spotlitExperience }"
            >
              <div class="flex flex-col md:flex-row md:items-baseline justify-between gap-2 mb-2">
                <h3
                  class="shrink-0 text-lg font-medium transition-colors duration-300"
                  :class="{ 'text-accent': i === spotlitExperience }"
                >
                  {{ item.company }}
                </h3>
                <span class="text-sm text-cream/60 font-mono">{{ item.period }}</span>
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
          <div ref="educationList" class="space-y-0 stagger-children">
            <div
              v-for="(item, i) in education"
              :key="item.degree"
              class="exp-row py-5 transition-colors duration-300 -mx-4 px-4 rounded-lg"
              :class="{ 'bg-cream/5': i === spotlitEducation }"
            >
              <div class="flex flex-col gap-1">
                <h3
                  class="text-lg font-medium transition-colors duration-300"
                  :class="{ 'text-accent': i === spotlitEducation }"
                >
                  {{ item.degree }}
                </h3>
                <p class="text-sm text-cream/60">{{ item.school }}</p>
                <span class="text-xs text-cream/50 font-mono mt-1">{{ item.period }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
/*
 * Scoped rather than Tailwind's hover: utilities, because the project
 * deliberately keeps the ungated v3 variant (see style.css) and these rows are
 * the one place that cannot have it. A tap leaves :hover stuck, and since the
 * row under the midline already lights up, that left two rows lit at once.
 * Behind @media (hover: hover) the scroll is the only thing that marks a row
 * on a touch screen, and a pointer still works as before everywhere else.
 */
@media (hover: hover) {
  .exp-row:hover {
    background-color: color-mix(in srgb, var(--color-cream) 5%, transparent);
  }
  .exp-row:hover h3 {
    color: var(--color-accent);
  }
}

.highlight-offset-dark {
  position: relative;
  display: inline-block;
  z-index: 1;
}
.highlight-offset-dark::before {
  /* lh, not %: a percentage is a share of the whole box, so a heading that
     wrapped to two lines got a bar 48px tall against a 40px line and swallowed
     the second one. One line's worth, however many lines there are. */
  content: '';
  display: block;
  width: 100%;
  height: 0.6lh;
  position: absolute;
  bottom: -4px;
  left: 12px;
  z-index: -1;
  background-color: color-mix(in srgb, var(--lavender) 25%, transparent);
  transition: all 0.3s ease;
}
.highlight-offset-dark:hover::before {
  height: 0.4lh;
}
</style>
