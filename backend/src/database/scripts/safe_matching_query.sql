-- ============================================
-- SAFE MATCHING QUERY WITH REGEX VALIDATION
-- ============================================

-- 1. Safe intent fetching query (replaces line 27-33 in workflow)
SELECT 
    i.id, i.buyer_id, i.title, i.description, i.category, 
    i.max_price, 
    CASE 
        WHEN i.location->>'latitude' ~ '^-?[0-9]+(\.[0-9]+)?$' 
             AND (i.location->>'latitude')::numeric BETWEEN -90 AND 90
        THEN (i.location->>'latitude')::numeric 
        ELSE NULL 
    END as lat,
    CASE 
        WHEN i.location->>'longitude' ~ '^-?[0-9]+(\.[0-9]+)?$' 
             AND (i.location->>'longitude')::numeric BETWEEN -180 AND 180
        THEN (i.location->>'longitude')::numeric 
        ELSE NULL 
    END as lng,
    i.location->>'city' as buyer_city, 
    i.location->>'state' as buyer_state
FROM intents i
WHERE i.id = $1 AND i.status = 'open';

-- 2. Safe listing matching query (replaces lines 50-93 in workflow)
SELECT DISTINCT 
  l.id as listing_id,
  l.title as listing_title,
  l.price as listing_price,
  l.category as listing_category,
  l.seller_id,
  CASE 
    WHEN l.location->>'latitude' ~ '^-?[0-9]+(\.[0-9]+)?$' 
         AND (l.location->>'latitude')::numeric BETWEEN -90 AND 90
    THEN (l.location->>'latitude')::numeric 
    ELSE NULL 
  END as listing_lat,
  CASE 
    WHEN l.location->>'longitude' ~ '^-?[0-9]+(\.[0-9]+)?$' 
         AND (l.location->>'longitude')::numeric BETWEEN -180 AND 180
    THEN (l.location->>'longitude')::numeric 
    ELSE NULL 
  END as listing_lng,
  l.location->>'city' as listing_city,
  l.location->>'state' as listing_state,
  -- Calculate distance using Haversine formula (only if coordinates are valid)
  CASE 
    WHEN l.location->>'latitude' ~ '^-?[0-9]+(\.[0-9]+)?$' 
         AND l.location->>'longitude' ~ '^-?[0-9]+(\.[0-9]+)?$'
         AND (l.location->>'latitude')::numeric BETWEEN -90 AND 90
         AND (l.location->>'longitude')::numeric BETWEEN -180 AND 180
         AND $2::numeric IS NOT NULL
         AND $3::numeric IS NOT NULL
    THEN (6371 * acos(
      cos(radians($2::numeric)) * 
      cos(radians((l.location->>'latitude')::numeric)) * 
      cos(radians((l.location->>'longitude')::numeric) - radians($3::numeric)) + 
      sin(radians($2::numeric)) * 
      sin(radians((l.location->>'latitude')::numeric))
    ))
    ELSE NULL 
  END as distance_km
FROM listings l
JOIN sellers s ON s.id = l.seller_id
WHERE l.intent_eligible = true
  AND l.is_published = true
  AND l.deleted_at IS NULL
  AND l.category = $4
  AND l.price <= ($5 * 1.05) -- 5% price tolerance
  AND s.user_id != $6 -- Exclude intent creator's own listings
  -- Location filter: within 50km or same city/state as fallback
  AND (
    -- Only use distance calculation if both intent and listing have valid coordinates
    (l.location->>'latitude' ~ '^-?[0-9]+(\.[0-9]+)?$' 
     AND l.location->>'longitude' ~ '^-?[0-9]+(\.[0-9]+)?$'
     AND (l.location->>'latitude')::numeric BETWEEN -90 AND 90
     AND (l.location->>'longitude')::numeric BETWEEN -180 AND 180
     AND $2::numeric IS NOT NULL
     AND $3::numeric IS NOT NULL
     AND (6371 * acos(
        cos(radians($2::numeric)) * 
        cos(radians((l.location->>'latitude')::numeric)) * 
        cos(radians((l.location->>'longitude')::numeric) - radians($3::numeric)) + 
        sin(radians($2::numeric)) * 
        sin(radians((l.location->>'latitude')::numeric))
      )) <= 50)
    OR (l.location->>'city' = $7) -- City fallback
    OR (l.location->>'state' = $8) -- State fallback
  )
ORDER BY 
  CASE WHEN distance_km IS NOT NULL THEN distance_km ELSE 999999 END ASC, 
  l.created_at DESC
LIMIT 100;

-- 3. Alternative approach: Create a helper function for repeated use
CREATE OR REPLACE FUNCTION safe_numeric_cast(jsonb_value text, min_range numeric DEFAULT NULL, max_range numeric DEFAULT NULL)
RETURNS numeric AS $$
BEGIN
  -- Return NULL if value is NULL or doesn't match numeric pattern
  IF jsonb_value IS NULL OR jsonb_value !~ '^-?[0-9]+(\.[0-9]+)?$' THEN
    RETURN NULL;
  END IF;
  
  -- Cast to numeric and check range if specified
  IF min_range IS NOT NULL AND max_range IS NOT NULL THEN
    IF jsonb_value::numeric BETWEEN min_range AND max_range THEN
      RETURN jsonb_value::numeric;
    ELSE
      RETURN NULL;
    END IF;
  END IF;
  
  -- Return numeric value if no range check needed
  RETURN jsonb_value::numeric;
END;
$$ LANGUAGE plpgsql;

-- 4. Simplified query using the helper function
SELECT 
  l.id,
  l.title,
  l.price,
  safe_numeric_cast(l.location->>'latitude', -90, 90) as listing_lat,
  safe_numeric_cast(l.location->>'longitude', -180, 180) as listing_lng,
  l.location->>'city' as city,
  l.location->>'state' as state
FROM listings l
WHERE safe_numeric_cast(l.location->>'latitude', -90, 90) IS NOT NULL
  AND safe_numeric_cast(l.location->>'longitude', -180, 180) IS NOT NULL;

-- 5. WHERE clause to filter out invalid coordinates before processing
-- Add this to your existing queries to skip bad rows:
WHERE 
  (l.location->>'latitude' IS NULL OR l.location->>'latitude' ~ '^-?[0-9]+(\.[0-9]+)?$')
  AND (l.location->>'longitude' IS NULL OR l.location->>'longitude' ~ '^-?[0-9]+(\.[0-9]+)?$')
  AND (
    l.location->>'latitude' IS NULL 
    OR (l.location->>'latitude')::numeric BETWEEN -90 AND 90
  )
  AND (
    l.location->>'longitude' IS NULL 
    OR (l.location->>'longitude')::numeric BETWEEN -180 AND 180
  )
