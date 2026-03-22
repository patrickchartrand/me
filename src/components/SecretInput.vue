<script setup lang="ts">
import { useFileDownload } from '@/composables/useFileDownload'
</script>

<template>
  <input
    type="button"
    class="absolute z-50 h-10 w-10 top-0 left-0"
    @dblclick="
      useFileDownload({ filename: 'pchartrand-letter.pdf', filepath: '/site/letter.html' })
    "
  />
</template>
