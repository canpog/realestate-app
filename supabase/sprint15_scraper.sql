-- =============================================
-- Sprint 15: Sahibinden Scraper Database Schema
-- Günlük pazar verisi toplama sistemi
-- =============================================

-- Mevcut tabloyu kontrol et ve güncelle veya yeniden oluştur
DO $$
BEGIN
    -- Eğer market_analysis tablosu varsa ve updated_at yok, ekle
    IF EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'market_analysis'
    ) AND NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'market_analysis' 
        AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE market_analysis ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
END $$;

-- Market Analysis (Güncel veriler)
CREATE TABLE IF NOT EXISTS market_analysis (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Lokasyon
    city TEXT NOT NULL,
    district TEXT NOT NULL,
    
    -- Emlak Tipi
    listing_type TEXT NOT NULL, -- 'villa', 'apartment'
    rooms TEXT NOT NULL, -- '2+1', '3+1', '4+1', '5+1'
    age_range TEXT, -- 'new', '0-5_years', '5-10_years', '10+_years'
    
    -- Pazar Verileri
    average_price NUMERIC NOT NULL,
    min_price NUMERIC,
    max_price NUMERIC,
    median_price NUMERIC,
    price_per_sqm NUMERIC,
    
    -- İstatistikler
    sample_size INTEGER DEFAULT 1,
    data_source TEXT DEFAULT 'sahibinden.com',
    last_scraped TIMESTAMPTZ DEFAULT NOW(),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Unique constraint for upsert
    UNIQUE(city, district, listing_type, rooms, age_range)
);

-- Market Analysis History (Eski verileri sakla)
CREATE TABLE IF NOT EXISTS market_analysis_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    city TEXT NOT NULL,
    district TEXT NOT NULL,
    listing_type TEXT NOT NULL,
    rooms TEXT NOT NULL,
    age_range TEXT,
    
    -- Veriler (o gün ne vardı?)
    average_price NUMERIC,
    min_price NUMERIC,
    max_price NUMERIC,
    median_price NUMERIC,
    price_per_sqm NUMERIC,
    sample_size INTEGER,
    
    -- Meta
    snapshot_date TIMESTAMPTZ NOT NULL, -- Hangi gün bu veri?
    data_source TEXT DEFAULT 'sahibinden.com',
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Scraping Logs (Her çalıştırmanın logu)
CREATE TABLE IF NOT EXISTS scraping_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Bilgi
    city TEXT,
    district TEXT,
    listing_type TEXT,
    rooms TEXT,
    
    -- Sonuç
    status TEXT, -- 'success', 'failed', 'rate_limited', 'no_data'
    properties_found INTEGER,
    average_price NUMERIC,
    error_message TEXT,
    
    -- Meta
    scraped_at TIMESTAMPTZ DEFAULT NOW(),
    execution_time_ms INTEGER -- Kaç ms sürdü?
);

-- İndeksler (sadece sütun varsa oluştur)
CREATE INDEX IF NOT EXISTS idx_market_analysis_location ON market_analysis(city, district);
CREATE INDEX IF NOT EXISTS idx_market_analysis_type ON market_analysis(listing_type, rooms);
CREATE INDEX IF NOT EXISTS idx_market_analysis_updated ON market_analysis(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_history_snapshot ON market_analysis_history(snapshot_date DESC);
CREATE INDEX IF NOT EXISTS idx_history_location ON market_analysis_history(city, district);
CREATE INDEX IF NOT EXISTS idx_scraping_logs_timestamp ON scraping_logs(scraped_at DESC);
CREATE INDEX IF NOT EXISTS idx_scraping_logs_status ON scraping_logs(status);

-- RLS Policies
ALTER TABLE market_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_analysis_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE scraping_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist, then recreate
DROP POLICY IF EXISTS "Market data is viewable by authenticated users" ON market_analysis;
DROP POLICY IF EXISTS "Market history is viewable by authenticated users" ON market_analysis_history;
DROP POLICY IF EXISTS "Scraping logs viewable by authenticated users" ON scraping_logs;
DROP POLICY IF EXISTS "Service role can manage market_analysis" ON market_analysis;
DROP POLICY IF EXISTS "Service role can manage market_analysis_history" ON market_analysis_history;
DROP POLICY IF EXISTS "Service role can manage scraping_logs" ON scraping_logs;

-- Everyone can read market data (public data)
CREATE POLICY "Market data is viewable by authenticated users" ON market_analysis
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Market history is viewable by authenticated users" ON market_analysis_history
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Scraping logs viewable by authenticated users" ON scraping_logs
    FOR SELECT TO authenticated USING (true);

-- Service role can insert/update (for cron job)
CREATE POLICY "Service role can manage market_analysis" ON market_analysis
    FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role can manage market_analysis_history" ON market_analysis_history
    FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role can manage scraping_logs" ON scraping_logs
    FOR ALL TO service_role USING (true) WITH CHECK (true);
