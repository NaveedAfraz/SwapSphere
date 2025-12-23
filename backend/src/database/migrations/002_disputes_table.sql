-- Table for dispute management
CREATE TABLE IF NOT EXISTS disputes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_room_id UUID NOT NULL REFERENCES deal_rooms(id),
  created_by UUID NOT NULL REFERENCES users(id),
  reason TEXT NOT NULL,
  description TEXT,
  evidence JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'opened' CHECK (status IN ('opened', 'resolved', 'closed')),
  resolution TEXT,
  resolved_by UUID REFERENCES users(id),
  resolved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_disputes_deal_room_id ON disputes(deal_room_id);
CREATE INDEX IF NOT EXISTS idx_disputes_status ON disputes(status);
CREATE INDEX IF NOT EXISTS idx_disputes_created_by ON disputes(created_by);
