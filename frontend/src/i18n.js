import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import en from "./locales/en/translation.json";
import tl from "./locales/tl/translation.json";

i18n
  .use(LanguageDetector) // Auto detects browser language
  .use(initReactI18next)
  .init({
    fallbackLng: "en",
    resources: {
      en: { translation: en },
      tl: { translation: tl },
    },
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
