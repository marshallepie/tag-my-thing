import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { detectUserCountry } from './geoDetection';

// Import translation files
import enCommon from '../locales/en/common.json';
import frCommon from '../locales/fr/common.json';

// Initialize i18next with standard detectors
i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        common: enCommon
      },
      fr: {
        common: frCommon
      }
    },
    fallbackLng: {
      // Map French-speaking locales to 'fr'
      'fr-FR': ['fr'],
      'fr-BE': ['fr'], // Belgium
      'fr-CA': ['fr'], // Canada
      'fr-CH': ['fr'], // Switzerland
      'fr-CM': ['fr'], // Cameroon
      'fr-CI': ['fr'], // Côte d'Ivoire
      'fr-SN': ['fr'], // Senegal
      'fr-ML': ['fr'], // Mali
      'fr-MG': ['fr'], // Madagascar
      'fr-DZ': ['fr'], // Algeria
      'fr-MA': ['fr'], // Morocco
      'fr-TN': ['fr'], // Tunisia
      'en-GB': ['en'],
      'en-US': ['en'],
      'default': ['en']
    },
    defaultNS: 'common',
    detection: {
      // Priority order: URL param → localStorage → browser language → HTML tag
      order: ['querystring', 'localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
      lookupQuerystring: 'lang', // Check for ?lang=fr or ?lang=en
      lookupLocalStorage: 'tagmything-language',
      // Convert browser locales to our supported languages
      convertDetectedLanguage: (lng: string) => {
        // Extract base language code (e.g., 'fr-FR' → 'fr')
        const baseLanguage = lng.split('-')[0];
        // Only return if it's a supported language
        return ['en', 'fr'].includes(baseLanguage) ? baseLanguage : 'en';
      }
    },
    interpolation: {
      escapeValue: false // React already does escaping
    },
    // Debug mode for development
    debug: import.meta.env.DEV
  });

// Perform geo-IP detection on first load if no language preference is set
// This runs after i18n initialization to avoid blocking
(async () => {
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const langParam = urlParams.get('lang');
    const storedLanguage = localStorage.getItem('tagmything-language');

    // Only run geo-detection if:
    // 1. No URL parameter is present
    // 2. No language preference is stored
    if (!langParam && !storedLanguage) {
      console.log('No language preference found, running geo-detection...');

      const geoResult = await detectUserCountry();

      if (geoResult && geoResult.isFrenchSpeaking) {
        console.log(`Detected French-speaking country: ${geoResult.countryCode}, switching to French`);
        await i18n.changeLanguage('fr');
      } else {
        console.log(`Detected country: ${geoResult?.countryCode || 'unknown'}, keeping English`);
      }
    }
  } catch (error) {
    console.error('Error in geo-detection:', error);
    // Fail silently to not disrupt the app
  }
})();

export default i18n;