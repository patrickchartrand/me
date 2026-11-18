export function useLocale() {
  const { locale } = useI18n()

  function toggle() {
    locale.value = locale.value === 'fr' ? 'en' : 'fr'
    localStorage.setItem('locale', locale.value)
    // The lang attribute belongs to unhead (src/App.vue); writing it here too
    // just raced it.
  }

  return { locale, toggle }
}
