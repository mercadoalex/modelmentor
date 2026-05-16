import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import es from './locales/es.json';

export const STORAGE_KEY = 'modelmentor-language';

export function detectLanguage(): string {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === 'en' || stored === 'es') return stored;
  const browserLang = navigator.language;
  return browserLang.startsWith('es') ? 'es' : 'en';
}

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    es: { translation: es },
  },
  lng: detectLanguage(),
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

// Persist language changes
i18n.on('languageChanged', (lng: string) => {
  localStorage.setItem(STORAGE_KEY, lng);
});

export default i18n;
