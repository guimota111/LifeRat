import { getLocales } from 'expo-localization';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from '@/locales/en.json';
import ptBR from '@/locales/pt-BR.json';

export const SUPPORTED_LOCALES = ['pt-BR', 'en'] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];

export function deviceLocale(): Locale {
  const tag = getLocales()[0]?.languageTag ?? 'en';
  return tag.toLowerCase().startsWith('pt') ? 'pt-BR' : 'en';
}

// eslint-disable-next-line import/no-named-as-default-member -- uso oficial do i18next
i18n.use(initReactI18next).init({
  resources: {
    'pt-BR': { translation: ptBR },
    en: { translation: en },
  },
  lng: deviceLocale(),
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

export default i18n;
