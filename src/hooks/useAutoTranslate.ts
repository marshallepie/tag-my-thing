import { supabase } from './supabase';
import { ensureTranslation } from './newsApi';

/**
 * Hook to automatically translate articles when they are published
 */
export const useAutoTranslate = () => {
  
  // Trigger translation for a specific article
  const translateArticle = async (articleId: string): Promise<boolean> => {
    try {
      await ensureTranslation(articleId);
      return true;
    } catch (error) {
      console.error('Failed to translate article:', error);
      return false;
    }
  };

  // Trigger translation for all articles missing translations
  const translateAllMissing = async (): Promise<number> => {
    try {
      // Get all published English articles without French translations
      const { data: articles, error } = await supabase
        .from('news_articles')
        .select('id, original_language, title_fr, content_fr')
        .eq('is_published', true)
        .eq('original_language', 'en')
        .or('title_fr.is.null,content_fr.is.null');

      if (error) throw error;

      let translated = 0;
      for (const article of articles || []) {
        if (!article.title_fr || !article.content_fr) {
          const success = await translateArticle(article.id);
          if (success) translated++;
          
          // Add small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      return translated;
    } catch (error) {
      console.error('Failed to translate missing articles:', error);
      return 0;
    }
  };

  return {
    translateArticle,
    translateAllMissing
  };
};