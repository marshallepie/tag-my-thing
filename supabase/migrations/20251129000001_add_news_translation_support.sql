-- Add missing news_category field and translation support
ALTER TABLE news_articles 
ADD COLUMN IF NOT EXISTS news_category TEXT NOT NULL DEFAULT 'Company News';

-- Add translation fields
ALTER TABLE news_articles
ADD COLUMN IF NOT EXISTS original_language TEXT NOT NULL DEFAULT 'en',
ADD COLUMN IF NOT EXISTS title_fr TEXT,
ADD COLUMN IF NOT EXISTS content_fr TEXT;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_news_articles_language ON news_articles(original_language);
CREATE INDEX IF NOT EXISTS idx_news_articles_category ON news_articles(news_category);

-- Update existing articles to have proper categories
UPDATE news_articles 
SET news_category = 'Company News' 
WHERE news_category IS NULL OR news_category = '';

-- Add check constraint for languages
ALTER TABLE news_articles 
ADD CONSTRAINT check_original_language 
CHECK (original_language IN ('en', 'fr'));