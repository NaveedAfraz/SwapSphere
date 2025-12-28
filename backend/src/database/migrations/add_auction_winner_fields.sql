-- Migration: Add winner fields to auctions table
-- This migration adds the fields needed to track auction winners

-- Add winner-related fields to auctions table
ALTER TABLE auctions 
ADD COLUMN IF NOT EXISTS winner_id uuid REFERENCES users(id),
ADD COLUMN IF NOT EXISTS winning_bid_id uuid REFERENCES auction_bids(id),
ADD COLUMN IF NOT EXISTS winning_amount NUMERIC,
ADD COLUMN IF NOT EXISTS ended_at timestamptz,
ADD COLUMN IF NOT EXISTS ended_reason VARCHAR(20) CHECK (ended_reason IN ('time_expired', 'manual_end', 'canceled'));

-- Create index for winner queries
CREATE INDEX IF NOT EXISTS idx_auctions_winner ON auctions(winner_id);

-- Update auction state to include 'ended'
ALTER TABLE auctions 
DROP CONSTRAINT IF EXISTS auctions_state_check,
ADD CONSTRAINT auctions_state_check 
CHECK (state IN ('setup', 'active', 'closed', 'ended', 'canceled'));

-- Add comments for documentation
COMMENT ON COLUMN auctions.winner_id IS 'User ID of the auction winner';
COMMENT ON COLUMN auctions.winning_bid_id IS 'ID of the winning bid';
COMMENT ON COLUMN auctions.winning_amount IS 'Amount of the winning bid';
COMMENT ON COLUMN auctions.ended_at IS 'When the auction actually ended';
COMMENT ON COLUMN auctions.ended_reason IS 'Why the auction ended (time_expired, manual_end, canceled)';
