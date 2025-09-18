import { supabase } from './supabase';

export interface NewsArticle {
  id: string;
  title: string;
  content: string;
  news_category: string;
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