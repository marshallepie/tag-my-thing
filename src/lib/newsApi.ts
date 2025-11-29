import { supabase } from './supabase';
import { getTranslationService } from './translationService';

export interface NewsArticle {
  id: string;
  title: string;
  content: string;
  news_category: string;
  original_language: 'en' | 'fr';
  title_fr?: string;
  content_fr?: string;
  image_url?: string;
  is_published: boolean;
  author_id: string;
  created_at: string;
  updated_at: string;
  author?: {
    full_name: string;
    email: string;
  };
}

export interface CreateArticleData {
  title: string;
  content: string;
  news_category: string;
  original_language: 'en' | 'fr';
  image_url?: string;
  is_published: boolean;
  author_id: string;
}

// Get published articles for users
export const getPublishedArticles = async (): Promise<NewsArticle[]> => {
  const { data, error } = await supabase
    .from('news_articles')
    .select(`
      *,
      author:user_profiles!author_id(full_name, email)
    `)
    .eq('is_published', true)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

// Get single article by ID
export const getArticleById = async (id: string): Promise<NewsArticle> => {
  const { data, error } = await supabase
    .from('news_articles')
    .select(`
      *,
      author:user_profiles!author_id(full_name, email)
    `)
    .eq('id', id)
    .eq('is_published', true)
    .single();

  if (error) throw error;
  return data;
};

// Admin functions
export const getAllArticles = async (): Promise<NewsArticle[]> => {
  const { data, error } = await supabase
    .from('news_articles')
    .select(`
      *,
      author:user_profiles!author_id(full_name, email)
    `)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

export const createArticle = async (article: CreateArticleData): Promise<NewsArticle> => {
  const { data, error } = await supabase
    .from('news_articles')
    .insert(article)
    .select(`
      *,
      author:user_profiles!author_id(full_name, email)
    `)
    .single();

  if (error) throw error;
  return data;
};

export const updateArticle = async (id: string, updates: Partial<CreateArticleData>): Promise<NewsArticle> => {
  const { data, error } = await supabase
    .from('news_articles')
    .update(updates)
    .eq('id', id)
    .select(`
      *,
      author:user_profiles!author_id(full_name, email)
    `)
    .single();

  if (error) throw error;
  return data;
};

export const deleteArticle = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('news_articles')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

export const getArticlesByCategory = async (category: string): Promise<NewsArticle[]> => {
  const { data, error } = await supabase
    .from('news_articles')
    .select(`
      *,
      author:user_profiles!author_id(full_name, email)
    `)
    .eq('is_published', true)
    .eq('news_category', category)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

export const getNewsCategories = async (): Promise<string[]> => {
  const { data, error } = await supabase
    .from('news_articles')
    .select('news_category')
    .eq('is_published', true);

  if (error) throw error;
  
  const categories = Array.from(new Set(data?.map(item => item.news_category) || []));
  return categories.sort();
};

// Localization helper functions
function getLocalizedTitle(article: NewsArticle, userLang: 'en' | 'fr'): string {
  if (userLang === 'fr') {
    // If user wants French
    if (article.original_language === 'fr') {
      return article.title; // Article is originally in French
    } else {
      return article.title_fr || article.title; // Use translation or fallback to English
    }
  } else {
    // If user wants English
    if (article.original_language === 'en') {
      return article.title; // Article is originally in English
    } else {
      return article.title; // For now, return original (would need title_en field for French->English)
    }
  }
}

function getLocalizedContent(article: NewsArticle, userLang: 'en' | 'fr'): string {
  if (userLang === 'fr') {
    // If user wants French
    if (article.original_language === 'fr') {
      return article.content; // Article is originally in French
    } else {
      return article.content_fr || article.content; // Use translation or fallback to English
    }
  } else {
    // If user wants English
    if (article.original_language === 'en') {
      return article.content; // Article is originally in English
    } else {
      return article.content; // For now, return original (would need content_en field for French->English)
    }
  }
}

// Get articles in user's preferred language
export const getLocalizedArticles = async (userLanguage: 'en' | 'fr'): Promise<NewsArticle[]> => {
  const { data, error } = await supabase
    .from('news_articles')
    .select(`
      *,
      author:user_profiles!author_id(full_name, email)
    `)
    .eq('is_published', true)
    .order('created_at', { ascending: false });

  if (error) throw error;
  
  return data?.map(article => ({
    ...article,
    title: getLocalizedTitle(article, userLanguage),
    content: getLocalizedContent(article, userLanguage),
  })) || [];
};

// Auto-translate missing translations
export const ensureTranslation = async (articleId: string): Promise<void> => {
  try {
    const translationService = getTranslationService();
    
    const { data: article, error } = await supabase
      .from('news_articles')
      .select('*')
      .eq('id', articleId)
      .single();

    if (error || !article) {
      console.error('Error fetching article for translation:', error);
      return;
    }

    // Check if translation is missing (only translate EN->FR for now)
    const needsTranslation = article.original_language === 'en' && (!article.title_fr || !article.content_fr);
    
    if (needsTranslation) {
      console.log('Translating article:', articleId);
      const translations = await translationService.translateArticle(article);
      
      if (translations.title_fr || translations.content_fr) {
        const { error: updateError } = await supabase
          .from('news_articles')
          .update(translations)
          .eq('id', articleId);

        if (updateError) {
          console.error('Error updating article translations:', updateError);
        } else {
          console.log('Successfully translated article:', articleId);
        }
      }
    }
  } catch (error) {
    console.error('Error in ensureTranslation:', error);
  }
};

// Check if article has translation for given language
export const hasTranslation = (article: NewsArticle, language: 'en' | 'fr'): boolean => {
  if (language === article.original_language) {
    return true; // Original language is always available
  }
  
  if (language === 'fr') {
    return !!(article.title_fr && article.content_fr);
  }
  
  // For English translations of French articles, we'd need title_en/content_en fields
  return article.original_language === 'en';
};