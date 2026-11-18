<script setup lang="ts">
const { locale } = useI18n()

useHead({
  htmlAttrs: {
    lang: () => (locale.value === 'fr' ? 'fr-CA' : 'en-CA'),
  },
})
</script>

<template>
  <div
    class="bg-cream text-charcoal font-sans antialiased selection:bg-charcoal selection:text-cream"
  >
    <RouterView />
  </div>
</template>
