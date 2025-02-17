import * as Localization from 'expo-localization';
import { I18n } from 'i18n-js';
import en from '../locales/en.json';
import ur from '../locales/ur.json';

// Set up the translations
let translations = {
  en,
  ur
};

// Create i18n instance
const i18n = new I18n(translations);

// Set the locale once at the beginning of your app
i18n.locale = Localization.locale.slice(0, 2); // Get first two chars of locale ('en', 'es', etc)
i18n.enableFallback = true; // Use 'en' if a translation is missing

export default i18n;
