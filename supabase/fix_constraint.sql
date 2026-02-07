-- ==================================================
-- FIX: Market Analysis Unique Constraint for Upsert
-- ==================================================

-- 1. Tabloyu temizle (Duplicate veriler varsa constraint oluşturulamaz)
-- Not: Veriler zaten scraping/mock olduğu için silinmesinde sakınca yoktur.
TRUNCATE TABLE market_analysis;

-- 2. Eğer varsa eski constraintleri temizle (çakışma olmasın)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'market_analysis_upsert_key') THEN
        ALTER TABLE market_analysis DROP CONSTRAINT market_analysis_upsert_key;
    END IF;
    
    -- Default isimlendirme ile oluşmuş olabilir, onu da kontrol et
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'market_analysis_city_district_listing_type_rooms_age_range_key') THEN
        ALTER TABLE market_analysis DROP CONSTRAINT market_analysis_city_district_listing_type_rooms_age_range_key;
    END IF;
END $$;

-- 3. Unique Constraint oluştur
-- Bu constraint, upsert işlemi için gereklidir (ON CONFLICT)
ALTER TABLE market_analysis 
ADD CONSTRAINT market_analysis_upsert_key 
UNIQUE (city, district, listing_type, rooms, age_range);

-- Kontrol
SELECT 
    schemaname, tablename, indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'market_analysis';
