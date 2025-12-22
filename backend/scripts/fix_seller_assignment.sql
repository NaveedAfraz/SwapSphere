-- Fix seller ID assignment for offer 30b20dcc-2bde-4893-90e3-4c420bbac3f6
-- Current seller (bf17ff6f-cdb7-42f5-b7f4-841433293a3b) should be replaced with actual seller (12f7cbbb-5fde-4024-800d-edfbd1895729)

UPDATE offers 
SET seller_id = '12f7cbbb-5fde-4024-800d-edfbd1895729' 
WHERE id = '30b20dcc-2bde-4893-90e3-4c420bbac3f6';

-- Also update deal room if it has wrong seller assignment
UPDATE deal_rooms 
SET seller_id = '12f7cbbb-5fde-4024-800d-edfbd1895729' 
WHERE id = (SELECT deal_room_id FROM offers WHERE id = '30b20dcc-2bde-4893-90e3-4c420bbac3f6');
