export function useLocale() {
  const { locale } = useI18n()

  function toggle() {
    locale.value = locale.value === 'fr' ? 'en' : 'fr'
    try {
      localStorage.setItem('locale', locale.value)
    } catch {
      // Blocked site data: the toggle still works, it just will not be remembered.
    }
    // The lang attribute belongs to unhead (src/App.vue); writing it here too
    // just raced it.
  }

  return { locale, toggle }
}
