-- Sprint 13 V2: Marmaris-Focused Market Data
-- ÖNCE BU SQL'İ ÇALIŞTIR - Constraint'i düzeltir

-- ================================
-- 1. Eski constraint'i kaldır
-- ================================
ALTER TABLE market_analysis 
DROP CONSTRAINT IF EXISTS market_analysis_city_district_neighborhood_listing_type_roo_key;

-- Yeni constraint ekle (age_range dahil)
ALTER TABLE market_analysis 
ADD CONSTRAINT market_analysis_unique_key 
UNIQUE (city, district, neighborhood, listing_type, rooms, age_range);

-- ================================
-- 2. Tüm eski verileri temizle
-- ================================
TRUNCATE TABLE market_analysis;

-- ================================
-- 3. MARMARIS VILLA
-- ================================
INSERT INTO market_analysis (city, district, neighborhood, listing_type, rooms, age_range, average_price, min_price, max_price, median_price, price_per_sqm, sample_size, data_source) VALUES
('muğla', 'marmaris', 'İçmeler', 'villa', '3+1', 'new', 3800000, 3200000, 4500000, 3900000, 25333, 28, 'manual'),
('muğla', 'marmaris', 'Turunç', 'villa', '3+1', 'new', 3650000, 3100000, 4300000, 3750000, 24333, 25, 'manual'),
('muğla', 'marmaris', 'Eski Mezarlık', 'villa', '3+1', 'new', 3950000, 3400000, 4600000, 4050000, 26333, 22, 'manual'),
('muğla', 'marmaris', 'Orhaniye', 'villa', '3+1', 'new', 3550000, 3000000, 4200000, 3650000, 23667, 24, 'manual'),
('muğla', 'marmaris', 'İçmeler', 'villa', '3+1', '0-5_years', 3450000, 2900000, 4000000, 3550000, 23000, 32, 'manual'),
('muğla', 'marmaris', 'Turunç', 'villa', '3+1', '0-5_years', 3300000, 2800000, 3900000, 3400000, 22000, 29, 'manual'),
('muğla', 'marmaris', 'Eski Mezarlık', 'villa', '3+1', '0-5_years', 3550000, 3000000, 4100000, 3650000, 23667, 27, 'manual'),
('muğla', 'marmaris', 'İçmeler', 'villa', '3+1', '5-10_years', 3100000, 2600000, 3600000, 3150000, 20667, 35, 'manual'),
('muğla', 'marmaris', 'Turunç', 'villa', '3+1', '5-10_years', 2950000, 2500000, 3500000, 3000000, 19667, 31, 'manual'),
('muğla', 'marmaris', 'İçmeler', 'villa', '4+1', 'new', 5200000, 4500000, 6200000, 5300000, 26000, 20, 'manual'),
('muğla', 'marmaris', 'Turunç', 'villa', '4+1', 'new', 4950000, 4200000, 5900000, 5050000, 24750, 18, 'manual'),
('muğla', 'marmaris', 'Eski Mezarlık', 'villa', '4+1', 'new', 5450000, 4700000, 6500000, 5550000, 27250, 16, 'manual'),
('muğla', 'marmaris', 'İçmeler', 'villa', '4+1', '0-5_years', 4850000, 4100000, 5700000, 4900000, 24250, 22, 'manual'),
('muğla', 'marmaris', 'Turunç', 'villa', '4+1', '0-5_years', 4650000, 3900000, 5500000, 4700000, 23250, 20, 'manual'),
('muğla', 'marmaris', 'İçmeler', 'villa', '5+1', 'new', 6800000, 5900000, 8000000, 6900000, 28333, 14, 'manual'),
('muğla', 'marmaris', 'Turunç', 'villa', '5+1', 'new', 6450000, 5500000, 7600000, 6550000, 26875, 12, 'manual'),
('muğla', 'marmaris', 'İçmeler', 'villa', '2+1', 'new', 2800000, 2300000, 3300000, 2850000, 23333, 26, 'manual'),
('muğla', 'marmaris', 'Turunç', 'villa', '2+1', 'new', 2650000, 2200000, 3150000, 2700000, 22083, 24, 'manual');

-- ================================
-- 4. MARMARIS DAİRE
-- ================================
INSERT INTO market_analysis (city, district, neighborhood, listing_type, rooms, age_range, average_price, min_price, max_price, median_price, price_per_sqm, sample_size, data_source) VALUES
('muğla', 'marmaris', 'İçmeler', 'apartment', '2+1', 'new', 1600000, 1300000, 1900000, 1650000, 18000, 35, 'manual'),
('muğla', 'marmaris', 'İçmeler', 'apartment', '3+1', 'new', 2100000, 1800000, 2500000, 2150000, 19091, 32, 'manual'),
('muğla', 'marmaris', 'Merkez', 'apartment', '2+1', 'new', 1450000, 1200000, 1750000, 1500000, 16500, 40, 'manual'),
('muğla', 'marmaris', 'Merkez', 'apartment', '3+1', 'new', 1900000, 1600000, 2300000, 1950000, 17500, 35, 'manual');

-- ================================
-- 5. İSTANBUL
-- ================================
INSERT INTO market_analysis (city, district, neighborhood, listing_type, rooms, age_range, average_price, min_price, max_price, median_price, price_per_sqm, sample_size, data_source) VALUES
('istanbul', 'maltepe', 'Fenerbahçe', 'apartment', '2+1', 'new', 2500000, 2200000, 2800000, 2550000, 22000, 45, 'manual'),
('istanbul', 'maltepe', 'Fenerbahçe', 'apartment', '3+1', 'new', 2900000, 2600000, 3300000, 2950000, 23500, 38, 'manual'),
('istanbul', 'maltepe', 'Fenerbahçe', 'villa', '3+1', 'new', 4200000, 3800000, 4800000, 4300000, 28000, 15, 'manual'),
('istanbul', 'besiktas', 'Ortaköy', 'apartment', '2+1', 'new', 3200000, 2900000, 3600000, 3250000, 25000, 42, 'manual'),
('istanbul', 'besiktas', 'Ortaköy', 'apartment', '3+1', 'new', 3800000, 3400000, 4300000, 3850000, 26500, 35, 'manual'),
('istanbul', 'kadikoy', 'Moda', 'apartment', '2+1', 'new', 3500000, 3100000, 4000000, 3550000, 28000, 38, 'manual'),
('istanbul', 'kadikoy', 'Moda', 'apartment', '3+1', 'new', 4200000, 3700000, 4800000, 4250000, 30000, 32, 'manual');

-- ================================
-- 6. ANKARA
-- ================================
INSERT INTO market_analysis (city, district, neighborhood, listing_type, rooms, age_range, average_price, min_price, max_price, median_price, price_per_sqm, sample_size, data_source) VALUES
('ankara', 'cankaya', 'Gaziosmanpaşa', 'apartment', '2+1', 'new', 1800000, 1500000, 2100000, 1850000, 18000, 50, 'manual'),
('ankara', 'cankaya', 'Gaziosmanpaşa', 'apartment', '3+1', 'new', 2200000, 1900000, 2500000, 2250000, 19500, 45, 'manual'),
('ankara', 'cankaya', 'Çankaya', 'apartment', '2+1', 'new', 2000000, 1700000, 2300000, 2050000, 20000, 48, 'manual'),
('ankara', 'cankaya', 'Çankaya', 'apartment', '3+1', 'new', 2500000, 2200000, 2900000, 2550000, 22000, 40, 'manual');

-- ================================
-- 7. İZMİR
-- ================================
INSERT INTO market_analysis (city, district, neighborhood, listing_type, rooms, age_range, average_price, min_price, max_price, median_price, price_per_sqm, sample_size, data_source) VALUES
('izmir', 'alsancak', 'Alsancak', 'apartment', '2+1', 'new', 1600000, 1400000, 1900000, 1650000, 16500, 48, 'manual'),
('izmir', 'alsancak', 'Alsancak', 'apartment', '3+1', 'new', 1950000, 1700000, 2250000, 2000000, 17800, 42, 'manual'),
('izmir', 'karsiyaka', 'Karşıyaka', 'apartment', '2+1', 'new', 1550000, 1350000, 1800000, 1600000, 16000, 45, 'manual'),
('izmir', 'karsiyaka', 'Karşıyaka', 'apartment', '3+1', 'new', 1900000, 1650000, 2200000, 1950000, 17500, 38, 'manual');

-- ================================
-- 8. ANTALYA
-- ================================
INSERT INTO market_analysis (city, district, neighborhood, listing_type, rooms, age_range, average_price, min_price, max_price, median_price, price_per_sqm, sample_size, data_source) VALUES
('antalya', 'konyaalti', 'Konyaaltı', 'apartment', '2+1', 'new', 1900000, 1600000, 2200000, 1950000, 17500, 52, 'manual'),
('antalya', 'konyaalti', 'Konyaaltı', 'villa', '3+1', 'new', 4100000, 3600000, 4700000, 4150000, 27000, 22, 'manual'),
('antalya', 'lara', 'Lara', 'apartment', '2+1', 'new', 2100000, 1800000, 2500000, 2150000, 19000, 45, 'manual'),
('antalya', 'lara', 'Lara', 'villa', '3+1', 'new', 4500000, 4000000, 5200000, 4600000, 28000, 18, 'manual');

-- Kontrol
SELECT COUNT(*) as total_records FROM market_analysis;
