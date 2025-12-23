-- Find rows that have latitude/longitude keys with invalid values
SELECT 
    id,
    location,
    location->>'latitude' as latitude_value,
    location->>'longitude' as longitude_value,
    CASE 
        WHEN location ? 'latitude' AND location->>'latitude' !~ '^-?[0-9]+(\.[0-9]+)?$' THEN 'Invalid latitude string'
        WHEN location ? 'longitude' AND location->>'longitude' !~ '^-?[0-9]+(\.[0-9]+)?$' THEN 'Invalid longitude string'
        WHEN location ? 'latitude' AND location->>'latitude' ~ '^-?[0-9]+(\.[0-9]+)?$' THEN 'Valid latitude'
        WHEN location ? 'longitude' AND location->>'longitude' ~ '^-?[0-9]+(\.[0-9]+)?$' THEN 'Valid longitude'
        ELSE 'No coordinates'
    END as status
FROM listings
WHERE 
    location ? 'latitude' OR location ? 'longitude'
ORDER BY id;

-- Also check intents table
SELECT 
    id,
    location,
    location->>'latitude' as latitude_value,
    location->>'longitude' as longitude_value,
    CASE 
        WHEN location ? 'latitude' AND location->>'latitude' !~ '^-?[0-9]+(\.[0-9]+)?$' THEN 'Invalid latitude string'
        WHEN location ? 'longitude' AND location->>'longitude' !~ '^-?[0-9]+(\.[0-9]+)?$' THEN 'Invalid longitude string'
        WHEN location ? 'latitude' AND location->>'latitude' ~ '^-?[0-9]+(\.[0-9]+)?$' THEN 'Valid latitude'
        WHEN location ? 'longitude' AND location->>'longitude' ~ '^-?[0-9]+(\.[0-9]+)?$' THEN 'Valid longitude'
        ELSE 'No coordinates'
    END as status
FROM intents
WHERE 
    location ? 'latitude' OR location ? 'longitude'
ORDER BY id;
