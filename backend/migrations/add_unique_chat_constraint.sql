-- Add uniqueness constraint to prevent duplicate chats with same participants and listing
-- This ensures that the same pair of users cannot have multiple chats for the same listing

-- First, clean up existing duplicates by keeping only the most recent chat for each participant-listing combination
WITH ranked_chats AS (
  SELECT 
    c.id,
    cp.participant1_id,
    cp.participant2_id,
    c.listing_id,
    c.created_at,
    ROW_NUMBER() OVER (
      PARTITION BY 
        LEAST(cp.participant1_id, cp.participant2_id),
        GREATEST(cp.participant1_id, cp.participant2_id),
        c.listing_id
      ORDER BY c.created_at DESC
    ) as rn
  FROM chats c
  JOIN chat_participants cp ON c.id = cp.chat_id
  WHERE cp.participant1_id IS NOT NULL 
    AND cp.participant2_id IS NOT NULL
),
duplicates_to_delete AS (
  SELECT id FROM ranked_chats WHERE rn > 1
)
DELETE FROM chats WHERE id IN (SELECT id FROM duplicates_to_delete);

-- Now add the uniqueness constraint
ALTER TABLE chat_participants 
ADD CONSTRAINT unique_chat_participants_listing 
UNIQUE (participant1_id, participant2_id, chat_id);

-- Add a separate constraint on chats table for listing uniqueness with participants
CREATE UNIQUE INDEX unique_chat_participant_listing 
ON chats (listing_id) 
WHERE listing_id IS NOT NULL;

-- Add check constraint to ensure participants are different
ALTER TABLE chat_participants 
ADD CONSTRAINT check_different_participants 
CHECK (participant1_id != participant2_id);
