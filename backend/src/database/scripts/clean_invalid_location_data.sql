-- ============================================
-- CLEAN INVALID LATITUDE/LONGITUDE VALUES SAFELY
-- ============================================

-- IMPORTANT: Run detection queries first to understand the scope
-- BACKUP your data before running these updates!

-- 1. Clean listings table - Set invalid coordinates to NULL
UPDATE listings 
SET location = location - 'latitude'
WHERE 
    location->>'latitude' IS NOT NULL 
    AND location->>'latitude' !~ '^-?[0-9]+(\.[0-9]+)?$';

UPDATE listings 
SET location = location - 'longitude' 
WHERE 
    location->>'longitude' IS NOT NULL 
    AND location->>'longitude' !~ '^-?[0-9]+(\.[0-9]+)?$';

-- 2. Clean out-of-range coordinates in listings
UPDATE listings 
SET location = location - 'latitude'
WHERE 
    location->>'latitude' IS NOT NULL 
    AND (location->>'latitude')::numeric NOT BETWEEN -90 AND 90;

UPDATE listings 
SET location = location - 'longitude'
WHERE 
    location->>'longitude' IS NOT NULL 
    AND (location->>'longitude')::numeric NOT BETWEEN -180 AND 180;

-- 3. Clean intents table - Set invalid coordinates to NULL
UPDATE intents 
SET location = location - 'latitude'
WHERE 
    location->>'latitude' IS NOT NULL 
    AND location->>'latitude' !~ '^-?[0-9]+(\.[0-9]+)?$';

UPDATE intents 
SET location = location - 'longitude'
WHERE 
    location->>'longitude' IS NOT NULL 
    AND location->>'longitude' !~ '^-?[0-9]+(\.[0-9]+)?$';

-- 4. Clean out-of-range coordinates in intents
UPDATE intents 
SET location = location - 'latitude'
WHERE 
    location->>'latitude' IS NOT NULL 
    AND (location->>'latitude')::numeric NOT BETWEEN -90 AND 90;

UPDATE intents 
SET location = location - 'longitude'
WHERE 
    location->>'longitude' IS NOT NULL 
    AND (location->>'longitude')::numeric NOT BETWEEN -180 AND 180;

-- 5. Alternative: Set to NULL instead of removing keys (safer)
-- Uncomment these if you prefer NULL values over removing keys

-- UPDATE listings 
-- SET location = jsonb_set(
--     location, 
--     '{latitude}', 
--     NULL::jsonb
-- )
-- WHERE 
--     location->>'latitude' IS NOT NULL 
--     AND location->>'latitude' !~ '^-?[0-9]+(\.[0-9]+)?$';

-- UPDATE listings 
-- SET location = jsonb_set(
--     location, 
--     '{longitude}', 
--     NULL::jsonb
-- )
-- WHERE 
--     location->>'longitude' IS NOT NULL 
--     AND location->>'longitude' !~ '^-?[0-9]+(\.[0-9]+)?$';

-- 6. Verification query - Run after cleaning
SELECT 
    'listings' as table_name,
    COUNT(*) as total_rows,
    COUNT(CASE WHEN location->>'latitude' ~ '^-?[0-9]+(\.[0-9]+)?$' THEN 1 END) as valid_latitude,
    COUNT(CASE WHEN location->>'longitude' ~ '^-?[0-9]+(\.[0-9]+)?$' THEN 1 END) as valid_longitude,
    COUNT(CASE WHEN location->>'latitude' IS NOT NULL AND location->>'latitude' !~ '^-?[0-9]+(\.[0-9]+)?$' THEN 1 END) as invalid_latitude,
    COUNT(CASE WHEN location->>'longitude' IS NOT NULL AND location->>'longitude' !~ '^-?[0-9]+(\.[0-9]+)?$' THEN 1 END) as invalid_longitude
FROM listings

UNION ALL

SELECT 
    'intents' as table_name,
    COUNT(*) as total_rows,
    COUNT(CASE WHEN location->>'latitude' ~ '^-?[0-9]+(\.[0-9]+)?$' THEN 1 END) as valid_latitude,
    COUNT(CASE WHEN location->>'longitude' ~ '^-?[0-9]+(\.[0-9]+)?$' THEN 1 END) as valid_longitude,
    COUNT(CASE WHEN location->>'latitude' IS NOT NULL AND location->>'latitude' !~ '^-?[0-9]+(\.[0-9]+)?$' THEN 1 END) as invalid_latitude,
    COUNT(CASE WHEN location->>'longitude' IS NOT NULL AND location->>'longitude' !~ '^-?[0-9]+(\.[0-9]+)?$' THEN 1 END) as invalid_longitude
FROM intents

ORDER BY table_name;
