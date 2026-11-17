<script lang="ts" setup>
const router = useRouter()
</script>

<template>
  <input
    type="button"
    class="absolute z-50 h-10 w-10 top-0 left-0"
    @dblclick="router.push({ name: 'codex' })"
  />
</template>
