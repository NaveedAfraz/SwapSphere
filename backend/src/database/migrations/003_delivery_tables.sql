-- Table for shipping records
CREATE TABLE IF NOT EXISTS shipping_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_room_id UUID NOT NULL REFERENCES deal_rooms(id),
  shipped_by UUID NOT NULL REFERENCES users(id),
  tracking_number VARCHAR(255),
  carrier VARCHAR(100),
  estimated_delivery DATE,
  shipped_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Table for delivery confirmations
CREATE TABLE IF NOT EXISTS delivery_confirmations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_room_id UUID NOT NULL REFERENCES deal_rooms(id),
  confirmed_by UUID NOT NULL REFERENCES users(id),
  tracking_info JSONB DEFAULT '{}',
  delivery_photos JSONB DEFAULT '[]',
  confirmed_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_shipping_records_deal_room_id ON shipping_records(deal_room_id);
CREATE INDEX IF NOT EXISTS idx_shipping_records_tracking_number ON shipping_records(tracking_number);
CREATE INDEX IF NOT EXISTS idx_delivery_confirmations_deal_room_id ON delivery_confirmations(deal_room_id);
