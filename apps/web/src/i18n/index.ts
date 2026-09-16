import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { en } from './locales/en.ts';
import { es } from './locales/es.ts';
import { pt } from './locales/pt.ts';

export const LANGUAGE_STORAGE_KEY = 'lca-compare-language';
export const fallbackLanguage = 'es';

export const supportedLanguages = [
  { code: 'es', labelKey: 'language.es' },
  { code: 'en', labelKey: 'language.en' },
  { code: 'pt', labelKey: 'language.pt' },
] as const;

export type SupportedLanguage = (typeof supportedLanguages)[number]['code'];

const resources = {
  es: { translation: es },
  en: { translation: en },
  pt: { translation: pt },
} satisfies Record<SupportedLanguage, { translation: LocaleResource }>;

type LocaleResource = WidenLocaleStrings<typeof es>;
type WidenLocaleStrings<T> = {
  [Key in keyof T]: T[Key] extends string ? string : WidenLocaleStrings<T[Key]>;
};

export const isSupportedLanguage = (language: string | null): language is SupportedLanguage =>
  supportedLanguages.some(({ code }) => code === language);

const getInitialLanguage = (): SupportedLanguage => {
  const savedLanguage = localStorage.getItem(LANGUAGE_STORAGE_KEY);
  return isSupportedLanguage(savedLanguage) ? savedLanguage : fallbackLanguage;
};

void i18n.use(initReactI18next).init({
  resources,
  lng: getInitialLanguage(),
  fallbackLng: fallbackLanguage,
  interpolation: {
    escapeValue: false,
  },
});

i18n.on('languageChanged', (language) => {
  if (isSupportedLanguage(language)) {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  }
});

export { i18n };
