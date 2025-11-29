interface TranslationResponse {
  data: {
    translations: Array<{
      translatedText: string;
    }>;
  };
}

export class NewsTranslationService {
  private apiKey: string;
  private apiUrl = 'https://translation.googleapis.com/language/translate/v2';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async translateText(text: string, fromLang: 'en' | 'fr', toLang: 'en' | 'fr'): Promise<string> {
    if (!this.apiKey) {
      throw new Error('Google Translate API key not configured');
    }

    try {
      const response = await fetch(`${this.apiUrl}?key=${this.apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          q: text,
          source: fromLang,
          target: toLang,
          format: 'text'
        })
      });

      if (!response.ok) {
        throw new Error(`Translation API error: ${response.status}`);
      }

      const data: TranslationResponse = await response.json();
      return data.data.translations[0].translatedText;
    } catch (error) {
      console.error('Translation error:', error);
      throw error;
    }
  }

  async translateArticle(article: any): Promise<{ title_fr?: string; content_fr?: string }> {
    try {
      if (article.original_language === 'fr') {
        // Article is in French, no need for title_fr/content_fr
        return {};
      }

      // Article is in English, translate to French
      const [translatedTitle, translatedContent] = await Promise.all([
        this.translateText(article.title, 'en', 'fr'),
        this.translateText(article.content, 'en', 'fr')
      ]);

      return {
        title_fr: translatedTitle,
        content_fr: translatedContent
      };
    } catch (error) {
      console.error('Article translation error:', error);
      return {};
    }
  }
}

// Create singleton instance
let translationService: NewsTranslationService | null = null;

export const getTranslationService = (): NewsTranslationService => {
  if (!translationService) {
    const apiKey = import.meta.env.VITE_GOOGLE_TRANSLATE_API_KEY;
    if (!apiKey) {
      throw new Error('Google Translate API key not configured in environment variables');
    }
    translationService = new NewsTranslationService(apiKey);
  }
  return translationService;
};