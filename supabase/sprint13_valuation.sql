-- Sprint 13: Fiyat Analizi Modülü Schema

-- 1. Market Analizi Verileri (Bölge Bazlı İstatistikler)
CREATE TABLE IF NOT EXISTS market_analysis (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID REFERENCES agents(id) ON DELETE SET NULL, -- Can be null for system data
    
    -- Konum Bilgileri
    city TEXT NOT NULL,
    district TEXT,
    neighborhood TEXT,
    
    -- Portfolio Özelliği Grubu
    listing_type TEXT NOT NULL, -- 'apartment', 'villa', 'land', 'commercial'
    rooms TEXT, -- '1+1', '2+1', '3+1', '4+1' etc.
    
    -- Pazar Verisi
    average_price NUMERIC,
    min_price NUMERIC,
    max_price NUMERIC,
    median_price NUMERIC,
    price_per_sqm NUMERIC,
    
    -- İstatistikler
    sample_size INTEGER DEFAULT 1,
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Uniqueness to prevent duplicates for same criteria
    UNIQUE(city, district, neighborhood, listing_type, rooms)
);

-- 2. Portfolio Fiyat Analiz Raporu
CREATE TABLE IF NOT EXISTS price_analysis_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    
    -- Analiz Parametreleri
    analysis_params JSONB, -- { rooms, age, condition, sqm, floor, features }
    
    -- Sonuçlar (AI)
    estimated_price NUMERIC,
    price_range_min NUMERIC,
    price_range_max NUMERIC,
    price_score FLOAT, -- 0-10
    market_comparison TEXT,
    recommendations TEXT,
    rental_yield NUMERIC, -- % yield
    
    -- Meta
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE market_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_analysis_reports ENABLE ROW LEVEL SECURITY;

-- Market Analysis: Read public, Write agents (or just seed)
CREATE POLICY "Market data is viewable by everyone" ON market_analysis FOR SELECT USING (true);
-- Only authenticated agents can insert relevant market data (if we allow crowdsourcing later)
CREATE POLICY "Agents can insert market data" ON market_analysis FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Reports: Agents see own reports
CREATE POLICY "Agents can view own reports" ON price_analysis_reports FOR SELECT USING (auth.uid() = (SELECT auth_user_id FROM agents WHERE id = agent_id));
CREATE POLICY "Agents can insert own reports" ON price_analysis_reports FOR INSERT WITH CHECK (auth.uid() = (SELECT auth_user_id FROM agents WHERE id = agent_id));

-- SEED DATA (Mock Data for Demo)
INSERT INTO market_analysis (city, district, listing_type, rooms, average_price, min_price, max_price, median_price, price_per_sqm, sample_size)
VALUES
-- Maltepe Apartment 3+1
('Muğla', 'Marmaris', 'apartment', '3+1', 6500000, 5000000, 8500000, 6200000, 55000, 42),
-- Maltepe Apartment 2+1
('Muğla', 'Marmaris', 'apartment', '2+1', 4500000, 3500000, 5500000, 4200000, 52000, 35),
-- Kadıköy Apartment 3+1
('İstanbul', 'Kadıköy', 'apartment', '3+1', 12500000, 9000000, 18000000, 11500000, 105000, 120),
-- Beşiktaş Villa
('İstanbul', 'Beşiktaş', 'villa', '5+1', 45000000, 30000000, 80000000, 42000000, 180000, 15)
ON CONFLICT (city, district, neighborhood, listing_type, rooms) DO NOTHING;
