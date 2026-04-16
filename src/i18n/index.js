import { createI18n } from 'vue-i18n'
import zh from './locales/zh.json'
import en from './locales/en.json'

const messages = {
  zh,
  en,
}

const savedLang = localStorage.getItem('app-lang') || 'zh'

const i18n = createI18n({
  locale: savedLang,
  fallbackLocale: 'zh',
  messages,
  legacy: false,
})

export default i18n

export function setLocale(lang) {
  i18n.global.locale.value = lang
  localStorage.setItem('app-lang', lang)
}
