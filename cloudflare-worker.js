/**
 * Cloudflare Worker for Dynamic Language-Based OG Tags
 *
 * This worker intercepts HTML requests and injects language-specific
 * Open Graph meta tags based on:
 * 1. URL parameter (?lang=fr or ?lang=en) - highest priority
 * 2. Cloudflare geo-IP detection (CF-IPCountry header)
 * 3. Fallback to English
 *
 * Deploy: wrangler deploy
 * Test: https://tagmything.com?lang=fr
 */

// French-speaking countries (ISO 3166-1 alpha-2 codes)
const FRENCH_SPEAKING_COUNTRIES = new Set([
  "FR", "BE", "CH", "CA", "LU", "MC",
  // Africa
  "CM", "CI", "CD", "CG", "BJ", "BF", "BI", "CF", "TD", "KM", "DJ", "GQ",
  "GA", "GN", "MG", "ML", "NE", "RW", "SN", "SC", "TG", "DZ", "MA", "TN",
  // Caribbean & Americas
  "HT", "GF", "GP", "MQ", "PM", "BL", "MF",
  // Pacific & Indian Ocean
  "PF", "NC", "WF", "VU", "RE", "YT",
  // Middle East
  "LB"
]);

// Language-specific meta tag content
const META_CONTENT = {
  en: {
    title: "TagMyThing - Secure Asset Management",
    description: "Tag, manage, and secure your physical and digital assets with blockchain technology. Get 50 TMT tokens free when you sign up!",
    ogTitle: "TagMyThing - Secure Asset Management",
    ogDescription: "Tag, manage, and secure your physical and digital assets with blockchain technology. Get 50 TMT tokens free when you sign up!",
    ogImage: "https://imagedelivery.net/Ioy7cFzJfvHRkNH1rxgjqw/8aa274fd-5bcf-4c99-f952-ba0f44576b00/public",
    twitterTitle: "TagMyThing - Secure Asset Management",
    twitterDescription: "Tag, manage, and secure your physical and digital assets with blockchain technology. Get 50 TMT tokens free when you sign up!",
    twitterImage: "https://imagedelivery.net/Ioy7cFzJfvHRkNH1rxgjqw/8aa274fd-5bcf-4c99-f952-ba0f44576b00/public",
    keywords: "asset management, blockchain, digital assets, physical assets, security, tagging, inventory, legacy planning",
    locale: "en_US",
    localeAlternate: "fr_FR",
    language: "English"
  },
  fr: {
    title: "TagMyThing - Gestion Sécurisée des Actifs",
    description: "Étiquetez, gérez et sécurisez vos actifs physiques et numériques avec la technologie blockchain. Recevez 50 jetons TMT gratuits à l'inscription!",
    ogTitle: "TagMyThing - Gestion Sécurisée des Actifs",
    ogDescription: "Étiquetez, gérez et sécurisez vos actifs physiques et numériques avec la technologie blockchain. Recevez 50 jetons TMT gratuits à l'inscription!",
    ogImage: "https://imagedelivery.net/Ioy7cFzJfvHRkNH1rxgjqw/8aa274fd-5bcf-4c99-f952-ba0f44576b00/public",
    twitterTitle: "TagMyThing - Gestion Sécurisée des Actifs",
    twitterDescription: "Étiquetez, gérez et sécurisez vos actifs physiques et numériques avec la technologie blockchain. Recevez 50 jetons TMT gratuits à l'inscription!",
    twitterImage: "https://imagedelivery.net/Ioy7cFzJfvHRkNH1rxgjqw/8aa274fd-5bcf-4c99-f952-ba0f44576b00/public",
    keywords: "gestion des actifs, blockchain, actifs numériques, actifs physiques, sécurité, étiquetage, inventaire, planification successorale",
    locale: "fr_FR",
    localeAlternate: "en_US",
    language: "French"
  }
};

/**
 * Detect language from request
 * Priority: URL param > Geo-IP > Fallback to English
 */
function detectLanguage(request) {
  const url = new URL(request.url);

  // 1. Check URL parameter (highest priority)
  const langParam = url.searchParams.get('lang');
  if (langParam === 'fr' || langParam === 'en') {
    console.log(`Language from URL param: ${langParam}`);
    return langParam;
  }

  // 2. Check Cloudflare geo-IP header
  const countryCode = request.headers.get('CF-IPCountry');
  if (countryCode && FRENCH_SPEAKING_COUNTRIES.has(countryCode)) {
    console.log(`Language from geo-IP (${countryCode}): fr`);
    return 'fr';
  }

  // 3. Fallback to English
  console.log(`Language fallback: en`);
  return 'en';
}

/**
 * Inject language-specific meta tags into HTML
 */
function injectMetaTags(html, lang) {
  const content = META_CONTENT[lang];

  // Replace title
  html = html.replace(
    /<title>.*?<\/title>/,
    `<title>${content.title}</title>`
  );

  // Replace or inject meta description
  html = html.replace(
    /<meta name="description" content=".*?" \/>/,
    `<meta name="description" content="${content.description}" />`
  );

  // Replace keywords
  html = html.replace(
    /<meta name="keywords" content=".*?" \/>/,
    `<meta name="keywords" content="${content.keywords}" />`
  );

  // Replace language
  html = html.replace(
    /<meta name="language" content=".*?" \/>/,
    `<meta name="language" content="${content.language}" />`
  );

  // Replace Open Graph tags
  html = html.replace(
    /<meta property="og:title" content=".*?" \/>/,
    `<meta property="og:title" content="${content.ogTitle}" />`
  );

  html = html.replace(
    /<meta property="og:description" content=".*?" \/>/,
    `<meta property="og:description" content="${content.ogDescription}" />`
  );

  html = html.replace(
    /<meta property="og:locale" content=".*?" \/>/,
    `<meta property="og:locale" content="${content.locale}" />`
  );

  // Replace Twitter Card tags
  html = html.replace(
    /<meta name="twitter:title" content=".*?" \/>/,
    `<meta name="twitter:title" content="${content.twitterTitle}" />`
  );

  html = html.replace(
    /<meta name="twitter:description" content=".*?" \/>/,
    `<meta name="twitter:description" content="${content.twitterDescription}" />`
  );

  // Replace OG image
  html = html.replace(
    /<meta property="og:image" content=".*?" \/>/,
    `<meta property="og:image" content="${content.ogImage}" />`
  );

  // Replace Twitter image
  html = html.replace(
    /<meta name="twitter:image" content=".*?" \/>/,
    `<meta name="twitter:image" content="${content.twitterImage}" />`
  );

  // Update HTML lang attribute
  html = html.replace(
    /<html lang=".*?">/,
    `<html lang="${lang}">`
  );

  return html;
}

/**
 * Main worker handler
 */
export default {
  async fetch(request, env, ctx) {
    // Only process HTML requests (GET)
    if (request.method !== 'GET') {
      return fetch(request);
    }

    const url = new URL(request.url);

    // Only process HTML pages (not API calls, assets, etc.)
    const isHtmlPage =
      url.pathname === '/' ||
      url.pathname.startsWith('/signup') ||
      url.pathname.startsWith('/auth') ||
      url.pathname.startsWith('/launch') ||
      url.pathname.startsWith('/general-tagging') ||
      url.pathname.startsWith('/nft-tagging') ||
      url.pathname.startsWith('/mywill-tagging') ||
      url.pathname.startsWith('/business-tagging') ||
      url.pathname.startsWith('/dao') ||
      url.pathname.startsWith('/about') ||
      url.pathname.startsWith('/faq');

    // Pass through non-HTML requests
    if (!isHtmlPage) {
      return fetch(request);
    }

    // Fetch the original response from origin
    const response = await fetch(request);

    // Only process HTML responses
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('text/html')) {
      return response;
    }

    // Detect language
    const language = detectLanguage(request);

    // Get HTML content
    let html = await response.text();

    // Inject language-specific meta tags
    html = injectMetaTags(html, language);

    // Return modified HTML
    return new Response(html, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers
    });
  }
};
