-- Marmaris Villa 3+1 verisini kontrol et
SELECT 
    city, 
    district, 
    listing_type, 
    rooms, 
    average_price, 
    sample_size, 
    updated_at 
FROM market_analysis 
WHERE 
    district ILIKE 'marmaris' 
    AND listing_type ILIKE 'villa' 
    AND rooms = '3+1';
