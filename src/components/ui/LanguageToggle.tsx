import React from 'react';
import { useTranslation } from 'react-i18next';

export const LanguageToggle: React.FC = () => {
  const { i18n, t, ready } = useTranslation();

  // Safety check for i18n initialization
  if (!i18n || !i18n.language) {
    return (
      <button className="px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm text-gray-400 rounded-lg" disabled>
        <span className="font-medium uppercase">EN</span>
      </button>
    );
  }

  const toggleLanguage = () => {
    const newLang = i18n.language.startsWith('fr') ? 'en' : 'fr';
    i18n.changeLanguage(newLang);
  };

  const currentLang = i18n.language.startsWith('fr') ? 'fr' : 'en';
  const nextLang = currentLang === 'fr' ? 'english' : 'french';

  return (
    <button
      onClick={toggleLanguage}
      className="px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors uppercase"
      title={ready && t ? t('language.switchTo', { language: t(`language.${nextLang}`) }) : `Switch to ${nextLang}`}
    >
      {currentLang === 'fr' ? 'EN' : 'FR'}
    </button>
  );
};