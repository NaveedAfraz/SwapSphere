-- Add winner field to auctions table
ALTER TABLE auctions 
ADD COLUMN winner_id uuid REFERENCES users(id),
ADD COLUMN winning_bid_id uuid REFERENCES auction_bids(id),
ADD COLUMN winning_amount NUMERIC,
ADD COLUMN ended_at timestamptz,
ADD COLUMN ended_reason VARCHAR(20) CHECK (ended_reason IN ('time_expired', 'manual_end', 'canceled'));

-- Create index for winner queries
CREATE INDEX idx_auctions_winner ON auctions(winner_id);

-- Update auction state to include 'ended'
ALTER TABLE auctions 
DROP CONSTRAINT IF EXISTS auctions_state_check,
ADD CONSTRAINT auctions_state_check 
CHECK (state IN ('setup', 'active', 'ended', 'canceled'));

-- Function to automatically end auction and determine winner
CREATE OR REPLACE FUNCTION end_auction(auction_uuid uuid, reason VARCHAR DEFAULT 'time_expired')
RETURNS TABLE(
  winner_id uuid,
  winning_bid_id uuid, 
  winning_amount numeric,
  auction_state varchar
) AS $$
DECLARE
  highest_bid_record RECORD;
  auction_record RECORD;
BEGIN
  -- Get auction details
  SELECT * INTO auction_record 
  FROM auctions 
  WHERE id = auction_uuid AND state IN ('active', 'setup');
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Auction not found or already ended';
  END IF;
  
  -- Get highest bid if any
  SELECT * INTO highest_bid_record
  FROM auction_bids 
  WHERE auction_id = auction_uuid 
  ORDER BY amount DESC, created_at ASC 
  LIMIT 1;
  
  -- Update auction with end details
  UPDATE auctions SET
    state = 'ended',
    winner_id = highest_bid_record.bidder_id,
    winning_bid_id = highest_bid_record.id,
    winning_amount = highest_bid_record.amount,
    ended_at = NOW(),
    ended_reason = reason,
    end_at = CASE 
      WHEN reason = 'time_expired' THEN end_at 
      ELSE NOW() 
    END
  WHERE id = auction_uuid;
  
  -- Return winner information
  RETURN QUERY SELECT 
    highest_bid_record.bidder_id,
    highest_bid_record.id,
    highest_bid_record.amount,
    'ended'::varchar;
  
  RETURN;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically end auctions when time expires
CREATE OR REPLACE FUNCTION check_auction_expiry()
RETURNS TRIGGER AS $$
BEGIN
  -- Auto-end auction if end_at time has passed and still active
  IF NEW.end_at <= NOW() AND NEW.state IN ('active', 'setup') THEN
    PERFORM end_auction(NEW.id, 'time_expired');
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger (this would need to be run periodically or via cron)
-- CREATE TRIGGER trigger_auction_expiry
-- BEFORE UPDATE ON auctions
-- FOR EACH ROW
-- EXECUTE FUNCTION check_auction_expiry();
