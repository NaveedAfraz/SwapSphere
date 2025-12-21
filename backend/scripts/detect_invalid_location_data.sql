-- ============================================
-- DETECT INVALID LATITUDE/LONGITUDE VALUES
-- ============================================

-- 1. Find rows with invalid latitude values
SELECT 
    id,
    location,
    location->>'latitude' as latitude_value,
    'Invalid latitude' as issue
FROM listings 
WHERE 
    location->>'latitude' IS NOT NULL 
    AND location->>'latitude' !~ '^-?[0-9]+(\.[0-9]+)?$'

UNION ALL

-- 2. Find rows with invalid longitude values  
SELECT 
    id,
    location,
    location->>'longitude' as longitude_value,
    'Invalid longitude' as issue
FROM listings 
WHERE 
    location->>'longitude' IS NOT NULL 
    AND location->>'longitude' !~ '^-?[0-9]+(\.[0-9]+)?$'

UNION ALL

-- 3. Find rows with out-of-range coordinates
SELECT 
    id,
    location,
    (location->>'latitude' || ',' || location->>'longitude') as coord_value,
    'Out of range' as issue
FROM listings 
WHERE 
    (location->>'latitude')::numeric NOT BETWEEN -90 AND 90
    OR (location->>'longitude')::numeric NOT BETWEEN -180 AND 180

ORDER BY id;

-- 4. Summary statistics
SELECT 
    COUNT(*) as total_listings,
    COUNT(CASE WHEN location->>'latitude' IS NOT NULL THEN 1 END) as has_latitude,
    COUNT(CASE WHEN location->>'longitude' IS NOT NULL THEN 1 END) as has_longitude,
    COUNT(CASE WHEN location->>'latitude' ~ '^-?[0-9]+(\.[0-9]+)?$' THEN 1 END) as valid_latitude,
    COUNT(CASE WHEN location->>'longitude' ~ '^-?[0-9]+(\.[0-9]+)?$' THEN 1 END) as valid_longitude,
    COUNT(CASE WHEN location->>'latitude' IS NOT NULL AND location->>'latitude' !~ '^-?[0-9]+(\.[0-9]+)?$' THEN 1 END) as invalid_latitude,
    COUNT(CASE WHEN location->>'longitude' IS NOT NULL AND location->>'longitude' !~ '^-?[0-9]+(\.[0-9]+)?$' THEN 1 END) as invalid_longitude
FROM listings;

-- 5. Same queries for intents table
SELECT 
    id,
    location,
    location->>'latitude' as latitude_value,
    location->>'longitude' as longitude_value,
    CASE 
        WHEN location->>'latitude' IS NOT NULL AND location->>'latitude' !~ '^-?[0-9]+(\.[0-9]+)?$' THEN 'Invalid latitude'
        WHEN location->>'longitude' IS NOT NULL AND location->>'longitude' !~ '^-?[0-9]+(\.[0-9]+)?$' THEN 'Invalid longitude'
        WHEN (location->>'latitude')::numeric NOT BETWEEN -90 AND 90 OR (location->>'longitude')::numeric NOT BETWEEN -180 AND 180 THEN 'Out of range'
        ELSE 'Valid'
    END as issue
FROM intents 
WHERE 
    location IS NOT NULL
    AND (
        location->>'latitude' IS NOT NULL AND location->>'latitude' !~ '^-?[0-9]+(\.[0-9]+)?$'
        OR location->>'longitude' IS NOT NULL AND location->>'longitude' !~ '^-?[0-9]+(\.[0-9]+)?$'
        OR (location->>'latitude')::numeric NOT BETWEEN -90 AND 90 
        OR (location->>'longitude')::numeric NOT BETWEEN -180 AND 180
    )
ORDER BY id;
