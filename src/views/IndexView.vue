<script setup lang="ts">
import { useHead } from '@unhead/vue'

const { t } = useI18n()

useHead({
  title: () => t('app.title'),
  meta: [
    {
      name: 'description',
      content: () => t('app.description'),
    },
  ],
})

useScrollAnimations()
onMounted(() =>
  window.location.hash ? window.history.replaceState(null, '', window.location.pathname) : null,
)
</script>

<template>
  <div>
    <TheHeader />
    <main class="pt-32 md:pt-40">
      <HeroSection />
      <StatsSection />
      <WorkSection />
      <ExperienceSection />
      <StackSection />
      <TestimonialsSection />
      <SecretInput />
    </main>
    <TheFooter />
  </div>
</template>
