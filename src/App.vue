<script setup lang="ts">
const { locale } = useI18n()

useHead({
  htmlAttrs: {
    lang: locale,
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
