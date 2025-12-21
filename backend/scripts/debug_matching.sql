-- Debug why no matches are found - check each condition step by step

-- 1. Check if listings exist and are eligible
SELECT 
    COUNT(*) as total_listings,
    COUNT(CASE WHEN l.intent_eligible = true THEN 1 END) as eligible,
    COUNT(CASE WHEN l.is_published = true THEN 1 END) as published,
    COUNT(CASE WHEN l.deleted_at IS NULL THEN 1 END) as not_deleted,
    COUNT(CASE WHEN l.category = 'electronics' THEN 1 END) as electronics,
    COUNT(CASE WHEN l.price <= 525 THEN 1 END) as under_525
FROM listings l;

-- 2. Check seller IDs to see if exclusion is working
SELECT DISTINCT 
    l.seller_id,
    s.user_id as seller_user_id,
    COUNT(*) as listing_count
FROM listings l
JOIN sellers s ON s.id = l.seller_id
WHERE l.category = 'electronics'
GROUP BY l.seller_id, s.user_id;

-- 3. Check intent buyer_id
SELECT 
    i.id,
    i.buyer_id,
    i.title,
    i.max_price,
    i.status
FROM intents i
WHERE i.status = 'open';

-- 4. Test basic matching without location
SELECT 
    l.id as listing_id,
    l.title as listing_title,
    l.price as listing_price,
    l.category,
    l.seller_id,
    s.user_id as seller_user_id,
    i.id as intent_id,
    i.buyer_id,
    i.title as intent_title,
    i.max_price
FROM listings l
JOIN sellers s ON s.id = l.seller_id
CROSS JOIN intents i
WHERE l.intent_eligible = true
  AND l.is_published = true
  AND l.deleted_at IS NULL
  AND l.category = 'electronics'
  AND l.price <= (500 * 1.05)
  AND s.user_id != 'ea65c116-e605-432a-8d5c-873d27ad48c2'
  AND i.status = 'open';

-- 5. Check cities in both tables
SELECT 
    'listings' as table_name,
    l.location->>'city' as city,
    COUNT(*) as count
FROM listings l
WHERE l.location->>'city' IS NOT NULL
GROUP BY l.location->>'city'

UNION ALL

SELECT 
    'intents' as table_name,
    i.location->>'city' as city,
    COUNT(*) as count
FROM intents i
WHERE i.location->>'city' IS NOT NULL
GROUP BY i.location->>'city'
ORDER BY table_name, city;
