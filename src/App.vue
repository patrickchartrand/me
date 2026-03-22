<script setup lang="ts">
import { useScrollAnimations } from '@/composables/useScrollAnimations'
import TheHeader from '@/components/TheHeader.vue'
import HeroSection from '@/components/HeroSection.vue'
import StatsSection from '@/components/StatsSection.vue'
import WorkSection from '@/components/WorkSection.vue'
import ExperienceSection from '@/components/ExperienceSection.vue'
import StackSection from '@/components/StackSection.vue'
import TheFooter from '@/components/TheFooter.vue'
import SecretInput from '@/components/SecretInput.vue'
import { onMounted } from 'vue'

useScrollAnimations()

onMounted(() => {
  if (window.location.hash) {
    window.history.replaceState(null, '', window.location.pathname)
  }
})
</script>

<template>
  <div
    class="bg-cream text-charcoal font-sans antialiased selection:bg-charcoal selection:text-cream"
  >
    <TheHeader />
    <main class="pt-32 md:pt-40">
      <HeroSection />
      <StatsSection />
      <WorkSection />
      <ExperienceSection />
      <StackSection />
      <SecretInput />
    </main>
    <TheFooter />
  </div>
</template>
