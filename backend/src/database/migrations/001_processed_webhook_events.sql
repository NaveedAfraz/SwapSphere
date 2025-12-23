-- Table to track processed webhook events for deduplication
CREATE TABLE IF NOT EXISTS processed_webhook_events (
  event_id VARCHAR(255) PRIMARY KEY,
  processed_at TIMESTAMP DEFAULT NOW(),
  INDEX idx_processed_at (processed_at)
);

-- Add index for cleanup performance
CREATE INDEX IF NOT EXISTS idx_processed_webhook_events_cleanup 
ON processed_webhook_events (processed_at);
