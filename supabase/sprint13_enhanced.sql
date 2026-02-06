-- Sprint 13 Enhanced: Scraping Logs + Comprehensive Market Data Seeding
-- Run this in Supabase SQL Editor

-- 1. Create scraping_logs table
CREATE TABLE IF NOT EXISTS scraping_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    city TEXT,
    district TEXT,
    listing_type TEXT,
    rooms TEXT,
    properties_found INTEGER,
    average_price NUMERIC,
    price_range_min NUMERIC,
    price_range_max NUMERIC,
    scraped_at TIMESTAMPTZ DEFAULT NOW(),
    data_source TEXT DEFAULT 'sahibinden.com',
    status TEXT DEFAULT 'success'
);

-- 2. Add indexes
CREATE INDEX IF NOT EXISTS idx_scraping_logs_timestamp ON scraping_logs(scraped_at);

-- 3. Ensure market_analysis has all columns (add if missing)
ALTER TABLE market_analysis ADD COLUMN IF NOT EXISTS neighborhood TEXT;
ALTER TABLE market_analysis ADD COLUMN IF NOT EXISTS age_range TEXT;
ALTER TABLE market_analysis ADD COLUMN IF NOT EXISTS sample_size INTEGER DEFAULT 1;
ALTER TABLE market_analysis ADD COLUMN IF NOT EXISTS data_source TEXT DEFAULT 'manual';
ALTER TABLE market_analysis ADD COLUMN IF NOT EXISTS last_updated TIMESTAMPTZ DEFAULT NOW();

-- 4. Clear old seed data (optional, comment out if you want to keep existing)
DELETE FROM market_analysis WHERE data_source IN ('manual', 'seed');

-- 5. COMPREHENSIVE SEED DATA (10+ Cities, 50+ Districts/Types)
-- ================================================================

-- İSTANBUL - Avrupa Yakası
INSERT INTO market_analysis (city, district, listing_type, rooms, average_price, min_price, max_price, median_price, price_per_sqm, sample_size, data_source) VALUES
('İstanbul', 'Beşiktaş', 'apartment', '2+1', 4500000, 3800000, 5500000, 4300000, 55000, 42, 'seed'),
('İstanbul', 'Beşiktaş', 'apartment', '3+1', 6200000, 5200000, 7800000, 6000000, 58000, 35, 'seed'),
('İstanbul', 'Beşiktaş', 'apartment', '4+1', 9500000, 8000000, 12000000, 9200000, 62000, 18, 'seed'),
('İstanbul', 'Şişli', 'apartment', '2+1', 3800000, 3200000, 4800000, 3700000, 48000, 55, 'seed'),
('İstanbul', 'Şişli', 'apartment', '3+1', 5200000, 4400000, 6500000, 5000000, 52000, 42, 'seed'),
('İstanbul', 'Bakırköy', 'apartment', '2+1', 3200000, 2700000, 4000000, 3100000, 42000, 48, 'seed'),
('İstanbul', 'Bakırköy', 'apartment', '3+1', 4500000, 3800000, 5500000, 4300000, 45000, 38, 'seed'),
('İstanbul', 'Beylikdüzü', 'apartment', '2+1', 2100000, 1800000, 2600000, 2000000, 28000, 65, 'seed'),
('İstanbul', 'Beylikdüzü', 'apartment', '3+1', 2800000, 2400000, 3500000, 2700000, 30000, 58, 'seed'),
('İstanbul', 'Esenyurt', 'apartment', '2+1', 1500000, 1200000, 1900000, 1450000, 18000, 85, 'seed'),
('İstanbul', 'Esenyurt', 'apartment', '3+1', 2000000, 1700000, 2500000, 1950000, 20000, 72, 'seed'),
('İstanbul', 'Sarıyer', 'apartment', '3+1', 7500000, 6200000, 9500000, 7200000, 65000, 28, 'seed'),
('İstanbul', 'Sarıyer', 'villa', '4+1', 18000000, 14000000, 25000000, 17000000, 85000, 12, 'seed'),

-- İSTANBUL - Anadolu Yakası
('İstanbul', 'Kadıköy', 'apartment', '2+1', 4200000, 3500000, 5200000, 4000000, 52000, 48, 'seed'),
('İstanbul', 'Kadıköy', 'apartment', '3+1', 5800000, 4800000, 7200000, 5600000, 55000, 40, 'seed'),
('İstanbul', 'Kadıköy', 'apartment', '4+1', 8500000, 7200000, 10500000, 8200000, 58000, 22, 'seed'),
('İstanbul', 'Ataşehir', 'apartment', '2+1', 3500000, 2900000, 4300000, 3400000, 45000, 55, 'seed'),
('İstanbul', 'Ataşehir', 'apartment', '3+1', 4800000, 4000000, 6000000, 4600000, 48000, 45, 'seed'),
('İstanbul', 'Maltepe', 'apartment', '2+1', 2800000, 2300000, 3500000, 2700000, 35000, 52, 'seed'),
('İstanbul', 'Maltepe', 'apartment', '3+1', 3800000, 3200000, 4800000, 3650000, 38000, 45, 'seed'),
('İstanbul', 'Maltepe', 'villa', '4+1', 8500000, 7000000, 11000000, 8200000, 55000, 15, 'seed'),
('İstanbul', 'Pendik', 'apartment', '2+1', 2200000, 1800000, 2800000, 2100000, 28000, 62, 'seed'),
('İstanbul', 'Pendik', 'apartment', '3+1', 3000000, 2500000, 3800000, 2900000, 30000, 55, 'seed'),
('İstanbul', 'Üsküdar', 'apartment', '2+1', 3800000, 3200000, 4800000, 3700000, 48000, 45, 'seed'),
('İstanbul', 'Üsküdar', 'apartment', '3+1', 5200000, 4400000, 6500000, 5000000, 52000, 38, 'seed'),
('İstanbul', 'Kartal', 'apartment', '2+1', 2500000, 2000000, 3200000, 2400000, 32000, 58, 'seed'),
('İstanbul', 'Kartal', 'apartment', '3+1', 3400000, 2800000, 4200000, 3300000, 35000, 48, 'seed'),

-- ANKARA
('Ankara', 'Çankaya', 'apartment', '2+1', 2800000, 2300000, 3500000, 2700000, 28000, 55, 'seed'),
('Ankara', 'Çankaya', 'apartment', '3+1', 3800000, 3200000, 4800000, 3650000, 32000, 48, 'seed'),
('Ankara', 'Çankaya', 'apartment', '4+1', 5500000, 4500000, 7000000, 5300000, 38000, 25, 'seed'),
('Ankara', 'Keçiören', 'apartment', '2+1', 1800000, 1500000, 2300000, 1750000, 22000, 65, 'seed'),
('Ankara', 'Keçiören', 'apartment', '3+1', 2500000, 2100000, 3100000, 2400000, 25000, 55, 'seed'),
('Ankara', 'Yenimahalle', 'apartment', '2+1', 2000000, 1700000, 2500000, 1950000, 24000, 58, 'seed'),
('Ankara', 'Yenimahalle', 'apartment', '3+1', 2800000, 2400000, 3500000, 2700000, 28000, 48, 'seed'),
('Ankara', 'Etimesgut', 'apartment', '2+1', 1600000, 1300000, 2000000, 1550000, 20000, 62, 'seed'),
('Ankara', 'Etimesgut', 'apartment', '3+1', 2200000, 1800000, 2800000, 2100000, 22000, 52, 'seed'),

-- İZMİR
('İzmir', 'Konak', 'apartment', '2+1', 2500000, 2100000, 3100000, 2400000, 32000, 52, 'seed'),
('İzmir', 'Konak', 'apartment', '3+1', 3400000, 2800000, 4200000, 3300000, 35000, 42, 'seed'),
('İzmir', 'Karşıyaka', 'apartment', '2+1', 2800000, 2400000, 3500000, 2700000, 35000, 48, 'seed'),
('İzmir', 'Karşıyaka', 'apartment', '3+1', 3800000, 3200000, 4800000, 3650000, 38000, 38, 'seed'),
('İzmir', 'Bornova', 'apartment', '2+1', 2200000, 1800000, 2800000, 2100000, 28000, 55, 'seed'),
('İzmir', 'Bornova', 'apartment', '3+1', 3000000, 2500000, 3800000, 2900000, 30000, 45, 'seed'),
('İzmir', 'Alsancak', 'apartment', '2+1', 3200000, 2700000, 4000000, 3100000, 40000, 42, 'seed'),
('İzmir', 'Alsancak', 'apartment', '3+1', 4500000, 3800000, 5500000, 4300000, 45000, 35, 'seed'),
('İzmir', 'Çeşme', 'villa', '3+1', 8500000, 7000000, 11000000, 8200000, 55000, 22, 'seed'),
('İzmir', 'Çeşme', 'villa', '4+1', 12000000, 10000000, 15000000, 11500000, 62000, 15, 'seed'),

-- ANTALYA
('Antalya', 'Konyaaltı', 'apartment', '2+1', 2500000, 2100000, 3100000, 2400000, 32000, 55, 'seed'),
('Antalya', 'Konyaaltı', 'apartment', '3+1', 3500000, 2900000, 4300000, 3400000, 35000, 45, 'seed'),
('Antalya', 'Konyaaltı', 'villa', '3+1', 6500000, 5500000, 8000000, 6300000, 45000, 25, 'seed'),
('Antalya', 'Lara', 'apartment', '2+1', 2800000, 2400000, 3500000, 2700000, 35000, 48, 'seed'),
('Antalya', 'Lara', 'apartment', '3+1', 3800000, 3200000, 4800000, 3650000, 38000, 38, 'seed'),
('Antalya', 'Lara', 'villa', '4+1', 9000000, 7500000, 12000000, 8700000, 55000, 18, 'seed'),
('Antalya', 'Muratpaşa', 'apartment', '2+1', 2200000, 1800000, 2800000, 2100000, 28000, 52, 'seed'),
('Antalya', 'Muratpaşa', 'apartment', '3+1', 3000000, 2500000, 3800000, 2900000, 30000, 42, 'seed'),
('Antalya', 'Alanya', 'apartment', '2+1', 2000000, 1700000, 2500000, 1950000, 25000, 62, 'seed'),
('Antalya', 'Alanya', 'apartment', '3+1', 2800000, 2400000, 3500000, 2700000, 28000, 52, 'seed'),
('Antalya', 'Alanya', 'villa', '3+1', 5500000, 4500000, 7000000, 5300000, 42000, 28, 'seed'),

-- MUĞLA
('Muğla', 'Bodrum', 'apartment', '2+1', 4500000, 3800000, 5500000, 4300000, 55000, 38, 'seed'),
('Muğla', 'Bodrum', 'apartment', '3+1', 6500000, 5500000, 8000000, 6300000, 60000, 28, 'seed'),
('Muğla', 'Bodrum', 'villa', '3+1', 12000000, 10000000, 15000000, 11500000, 75000, 22, 'seed'),
('Muğla', 'Bodrum', 'villa', '4+1', 18000000, 14000000, 24000000, 17000000, 85000, 15, 'seed'),
('Muğla', 'Marmaris', 'apartment', '2+1', 3200000, 2700000, 4000000, 3100000, 40000, 42, 'seed'),
('Muğla', 'Marmaris', 'apartment', '3+1', 4500000, 3800000, 5500000, 4300000, 45000, 35, 'seed'),
('Muğla', 'Marmaris', 'villa', '3+1', 8500000, 7000000, 11000000, 8200000, 55000, 25, 'seed'),
('Muğla', 'Marmaris', 'villa', '4+1', 12000000, 10000000, 15000000, 11500000, 65000, 18, 'seed'),
('Muğla', 'Fethiye', 'apartment', '2+1', 2800000, 2400000, 3500000, 2700000, 35000, 45, 'seed'),
('Muğla', 'Fethiye', 'villa', '3+1', 7500000, 6200000, 9500000, 7200000, 52000, 22, 'seed'),
('Muğla', 'Datça', 'villa', '3+1', 9000000, 7500000, 12000000, 8700000, 58000, 18, 'seed'),

-- BURSA
('Bursa', 'Nilüfer', 'apartment', '2+1', 2200000, 1800000, 2800000, 2100000, 28000, 55, 'seed'),
('Bursa', 'Nilüfer', 'apartment', '3+1', 3000000, 2500000, 3800000, 2900000, 30000, 45, 'seed'),
('Bursa', 'Osmangazi', 'apartment', '2+1', 1800000, 1500000, 2300000, 1750000, 22000, 62, 'seed'),
('Bursa', 'Osmangazi', 'apartment', '3+1', 2500000, 2100000, 3100000, 2400000, 25000, 52, 'seed'),

-- MERSİN
('Mersin', 'Yenişehir', 'apartment', '2+1', 1600000, 1300000, 2000000, 1550000, 20000, 55, 'seed'),
('Mersin', 'Yenişehir', 'apartment', '3+1', 2200000, 1800000, 2800000, 2100000, 22000, 45, 'seed'),
('Mersin', 'Mezitli', 'apartment', '2+1', 1800000, 1500000, 2300000, 1750000, 22000, 52, 'seed'),
('Mersin', 'Mezitli', 'apartment', '3+1', 2500000, 2100000, 3100000, 2400000, 25000, 42, 'seed'),

-- TRABZON
('Trabzon', 'Ortahisar', 'apartment', '2+1', 1500000, 1200000, 1900000, 1450000, 18000, 48, 'seed'),
('Trabzon', 'Ortahisar', 'apartment', '3+1', 2100000, 1800000, 2600000, 2000000, 22000, 38, 'seed'),

-- KOCAELİ
('Kocaeli', 'İzmit', 'apartment', '2+1', 1800000, 1500000, 2300000, 1750000, 22000, 55, 'seed'),
('Kocaeli', 'İzmit', 'apartment', '3+1', 2500000, 2100000, 3100000, 2400000, 25000, 45, 'seed'),
('Kocaeli', 'Gebze', 'apartment', '2+1', 1600000, 1300000, 2000000, 1550000, 20000, 52, 'seed'),
('Kocaeli', 'Gebze', 'apartment', '3+1', 2200000, 1800000, 2800000, 2100000, 22000, 42, 'seed'),

-- ESKİŞEHİR
('Eskişehir', 'Tepebaşı', 'apartment', '2+1', 1400000, 1100000, 1800000, 1350000, 17000, 52, 'seed'),
('Eskişehir', 'Tepebaşı', 'apartment', '3+1', 1900000, 1600000, 2400000, 1850000, 20000, 42, 'seed'),

-- GAZİANTEP
('Gaziantep', 'Şehitkamil', 'apartment', '2+1', 1300000, 1000000, 1700000, 1250000, 16000, 58, 'seed'),
('Gaziantep', 'Şehitkamil', 'apartment', '3+1', 1800000, 1500000, 2300000, 1750000, 18000, 48, 'seed');

-- Done!
-- Total: 85+ market_analysis records covering 12 cities
