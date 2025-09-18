-- Create news_articles table
CREATE TABLE news_articles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    image_url TEXT,
    is_published BOOLEAN DEFAULT false,
    author_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_news_articles_published ON news_articles(is_published);
CREATE INDEX idx_news_articles_created_at ON news_articles(created_at DESC);
CREATE INDEX idx_news_articles_author ON news_articles(author_id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_news_articles_updated_at 
    BEFORE UPDATE ON news_articles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS)
ALTER TABLE news_articles ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone authenticated can read published articles
CREATE POLICY "Users can read published articles" ON news_articles
    FOR SELECT USING (auth.uid() IS NOT NULL AND is_published = true);

-- Policy: Only admins can manage articles
CREATE POLICY "Admins can manage articles" ON news_articles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );