<script setup lang="ts">
import { useScrollAnimations } from '@/composables/useScrollAnimations'
import TheHeader from '@/components/TheHeader.vue'
import HeroSection from '@/components/HeroSection.vue'
import StatsSection from '@/components/StatsSection.vue'
import WorkSection from '@/components/WorkSection.vue'
import ExperienceSection from '@/components/ExperienceSection.vue'
import RecognitionSection from '@/components/RecognitionSection.vue'
import TheFooter from '@/components/TheFooter.vue'

useScrollAnimations()
</script>

<template>
  <div class="bg-cream text-charcoal font-sans antialiased selection:bg-charcoal selection:text-cream">
    <TheHeader />
    <main class="pt-32 md:pt-40">
      <HeroSection />
      <StatsSection />
      <WorkSection />
      <ExperienceSection />
      <RecognitionSection />
    </main>
    <TheFooter />
  </div>
</template>

<style>
:root {
  --color-lavender: #9d9fbd;
  --color-available: #81b29a;
}

/* Scroll animations */
.fade-in-up {
  opacity: 0;
  transform: translateY(32px);
  transition: opacity 0.7s ease, transform 0.7s ease;
}
.fade-in-up.visible {
  opacity: 1;
  transform: translateY(0);
}

.stagger-children {
  opacity: 0;
  transform: translateY(24px);
  transition: opacity 0.6s ease, transform 0.6s ease;
}
.stagger-children.visible {
  opacity: 1;
  transform: translateY(0);
}
.stagger-children.visible > *:nth-child(1) { transition-delay: 0.05s; }
.stagger-children.visible > *:nth-child(2) { transition-delay: 0.15s; }
.stagger-children.visible > *:nth-child(3) { transition-delay: 0.25s; }
.stagger-children.visible > *:nth-child(4) { transition-delay: 0.35s; }
.stagger-children.visible > *:nth-child(5) { transition-delay: 0.45s; }

/* Reveal text (hero) */
.reveal-text {
  animation: reveal 1s cubic-bezier(0.77, 0, 0.175, 1) forwards;
  opacity: 0;
  transform: translateY(20px);
}
@keyframes reveal {
  to { opacity: 1; transform: translateY(0); }
}

/* Smooth image loading */
img {
  opacity: 0;
  transition: opacity 0.6s ease;
}
img[src] {
  opacity: 1;
}
</style>
