<script setup lang="ts">
const { locale } = useI18n()
</script>

<template>
  <input
    type="button"
    class="absolute z-50 h-10 w-10 top-0 left-0"
    @dblclick="
      useDownload(locale, { filename: 'pchartrand-letter.pdf', filepath: '/site/letter.html' })
    "
  />
</template>
