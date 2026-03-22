import { useI18n } from 'vue-i18n'

export function useLocale() {
  const { locale } = useI18n()

  function toggle() {
    locale.value = locale.value === 'fr' ? 'en' : 'fr'
    localStorage.setItem('locale', locale.value)
    document.documentElement.lang = locale.value
  }

  return { locale, toggle }
}
