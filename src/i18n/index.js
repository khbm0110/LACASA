import i18n from "i18next"
import { initReactI18next } from "react-i18next"
import fr from "./locales/fr.json"
import ar from "./locales/ar.json"
import es from "./locales/es.json"
import en from "./locales/en.json"

// Le francais est la langue par defaut du restaurant.
// Les fichiers ar/es/en peuvent etre remplaces depuis le panneau
// dadministration (Admin > Traductions) sans toucher au code.
i18n.use(initReactI18next).init({
  resources: {
    fr: { translation: fr },
    ar: { translation: ar },
    es: { translation: es },
    en: { translation: en }
  },
  lng: "fr",
  fallbackLng: "fr",
  interpolation: { escapeValue: false }
})

export default i18n
