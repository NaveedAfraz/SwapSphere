-- Fix the corrupted offer record where buyer_id is set to seller's user ID
-- This should be run to fix offer ID: 30b20dcc-2bde-4893-90e3-4c420bbac3f6

UPDATE offers 
SET buyer_id = 'ea65c116-e605-432a-8d5c-873d27ad48c2'
WHERE id = '30b20dcc-2bde-4893-90e3-4c420bbac3f6'
AND buyer_id = '12f7cbbb-5fde-4024-800d-edfbd1895729';

-- Verify the fix
SELECT 
    o.id,
    o.buyer_id,
    o.seller_id,
    s.user_id as seller_user_id,
    o.offered_price,
    o.status
FROM offers o
LEFT JOIN sellers s ON o.seller_id = s.id
WHERE o.id = '30b20dcc-2bde-4893-90e3-4c420bbac3f6';
