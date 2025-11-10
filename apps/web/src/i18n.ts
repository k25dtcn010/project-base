import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import enTranslation from "./locales/en/translation.json";
import viTranslation from "./locales/vi/translation.json";

const resources = {
  en: {
    translation: enTranslation,
  },
  vi: {
    translation: viTranslation,
  },
};

i18n.use(initReactI18next).init({
  resources,
  lng: "vi", // Always Vietnamese
  fallbackLng: "vi",
  supportedLngs: ["en", "vi"],
  interpolation: {
    escapeValue: false, // React already escapes values
  },
});

export default i18n;
