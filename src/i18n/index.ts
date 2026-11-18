import { createI18n } from 'vue-i18n'
import en from './locales/en'
import fr from './locales/fr'

// Reading localStorage can throw outright — Safari in private browsing, or a
// browser set to block site data. At module scope that would stop main.ts from
// ever mounting, so the whole site would be blank rather than merely in the
// wrong language.
const savedLocale = (() => {
  try {
    return localStorage.getItem('locale') ?? 'en'
  } catch {
    return 'en'
  }
})()

export const i18n = createI18n({
  legacy: false,
  locale: savedLocale,
  fallbackLocale: 'fr',
  messages: { en, fr },
})
