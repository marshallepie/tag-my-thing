import React from 'react';
import { useTranslation } from 'react-i18next';
import { Languages } from 'lucide-react';

export const LanguageToggle: React.FC = () => {
  const { i18n, t, ready } = useTranslation();

  // Safety check for i18n initialization
  if (!i18n || !i18n.language) {
    return (
      <button className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-400 rounded-lg" disabled>
        <Languages className="h-4 w-4" />
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
      className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
      title={ready && t ? t('language.switchTo', { language: t(`language.${nextLang}`) }) : `Switch to ${nextLang}`}
    >
      <Languages className="h-4 w-4" />
      <span className="font-medium uppercase">
        {currentLang === 'fr' ? 'EN' : 'FR'}
      </span>
    </button>
  );
};