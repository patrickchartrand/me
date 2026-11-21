export function useLocale() {
  const { locale } = useI18n()

  function toggle() {
    locale.value = locale.value === 'fr' ? 'en' : 'fr'
    try {
      localStorage.setItem('locale', locale.value)
    } catch (e) {
      console.error(e)
    }
  }

  return { locale, toggle }
}
