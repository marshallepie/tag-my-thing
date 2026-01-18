import React, { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';

interface MetaTagsContent {
  title: string;
  description: string;
  ogTitle: string;
  ogDescription: string;
  keywords: string;
  locale: string;
}

const metaContent: Record<string, MetaTagsContent> = {
  en: {
    title: 'TagMyThing - Secure Asset Management',
    description: 'Tag, manage, and secure your physical and digital assets with blockchain technology. Get 50 TMT tokens free when you sign up!',
    ogTitle: 'TagMyThing - Secure Asset Management',
    ogDescription: 'Tag, manage, and secure your physical and digital assets with blockchain technology. Get 50 TMT tokens free when you sign up!',
    keywords: 'asset management, blockchain, digital assets, physical assets, security, tagging, inventory, legacy planning',
    locale: 'en_US'
  },
  fr: {
    title: 'TagMyThing - Gestion Sécurisée des Actifs',
    description: 'Étiquetez, gérez et sécurisez vos actifs physiques et numériques avec la technologie blockchain. Recevez 50 jetons TMT gratuits à l\'inscription!',
    ogTitle: 'TagMyThing - Gestion Sécurisée des Actifs',
    ogDescription: 'Étiquetez, gérez et sécurisez vos actifs physiques et numériques avec la technologie blockchain. Recevez 50 jetons TMT gratuits à l\'inscription!',
    keywords: 'gestion des actifs, blockchain, actifs numériques, actifs physiques, sécurité, étiquetage, inventaire, planification successorale',
    locale: 'fr_FR'
  }
};

export const LanguageMetaTags: React.FC = () => {
  const { i18n } = useTranslation();
  const currentLanguage = i18n.language.split('-')[0]; // Get base language (en or fr)
  const content = metaContent[currentLanguage] || metaContent.en;

  // Update HTML lang attribute
  useEffect(() => {
    document.documentElement.lang = currentLanguage;
  }, [currentLanguage]);

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{content.title}</title>
      <meta name="description" content={content.description} />
      <meta name="keywords" content={content.keywords} />
      <meta name="language" content={currentLanguage === 'fr' ? 'French' : 'English'} />

      {/* Open Graph Meta Tags */}
      <meta property="og:title" content={content.ogTitle} />
      <meta property="og:description" content={content.ogDescription} />
      <meta property="og:locale" content={content.locale} />
      {currentLanguage === 'en' && <meta property="og:locale:alternate" content="fr_FR" />}
      {currentLanguage === 'fr' && <meta property="og:locale:alternate" content="en_US" />}

      {/* Twitter Card Meta Tags */}
      <meta name="twitter:title" content={content.ogTitle} />
      <meta name="twitter:description" content={content.ogDescription} />
    </Helmet>
  );
};
