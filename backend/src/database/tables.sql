-- Users table
CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  email text UNIQUE,
  phone text UNIQUE,
  password_hash text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  is_active boolean NOT NULL DEFAULT true,
  metadata jsonb DEFAULT '{}'
);

-- Profiles table
CREATE TABLE profiles (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name text,
  avatar_key text,
  bio text,
  seller_mode boolean NOT NULL DEFAULT false,
  rating_avg numeric(3,2) DEFAULT 0,
  rating_count int DEFAULT 0,
  location geometry(Point,4326),
  metadata jsonb DEFAULT '{}'
);

-- Index for location queries
CREATE INDEX idx_profiles_location ON profiles USING GIST(location);
-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto"; -- for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "pg_trgm";   -- useful for trigram indexes
CREATE EXTENSION IF NOT EXISTS "btree_gin"; -- for mixed GIN indexing (optional)

BEGIN;

-- SELLER PROFILE (optional extra seller details)
CREATE TABLE sellers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  store_name TEXT,
  bio TEXT,
  payout_info JSONB,      -- bank details / payout method metadata (encrypted at rest outside DB)
  seller_rating NUMERIC(3,2) DEFAULT 0.00,
  total_sales BIGINT DEFAULT 0,
  settings JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE UNIQUE INDEX ux_sellers_user ON sellers(user_id);
CREATE INDEX idx_sellers_store_name ON sellers (store_name);

-- LISTINGS
CREATE TABLE listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  price NUMERIC(12,2) NOT NULL CHECK (price >= 0),
  currency CHAR(3) DEFAULT 'USD',
  quantity INTEGER DEFAULT 1 CHECK (quantity >= 0),
  condition TEXT,            -- e.g., "new", "used", freeform
  category TEXT,
  location JSONB,            -- { "city":"", "lat":..., "lng":... }
  tags TEXT[],
  is_published BOOLEAN DEFAULT TRUE,
  visibility TEXT DEFAULT 'public', -- 'public' | 'private' etc.
  metadata JSONB DEFAULT '{}'::jsonb,
  view_count BIGINT DEFAULT 0,
  favorites_count BIGINT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

-- Full-text search tsvector column for listings
ALTER TABLE listings ADD COLUMN search_vector tsvector;
-- Populate search_vector upon insert/update via trigger defined below.

CREATE INDEX idx_listings_seller ON listings (seller_id);
CREATE INDEX idx_listings_price ON listings (price);
CREATE INDEX idx_listings_category ON listings (category);
CREATE INDEX idx_listings_tags ON listings USING GIN (tags);
CREATE INDEX idx_listings_search_trgm ON listings USING gin (title gin_trgm_ops, description gin_trgm_ops);

-- LISTING IMAGES / MEDIA
CREATE TABLE listing_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  width INTEGER,
  height INTEGER,
  size_bytes BIGINT,
  mime_type TEXT,
  blurhash TEXT,
  is_primary BOOLEAN DEFAULT FALSE,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_listing_images_listing ON listing_images (listing_id);

-- MEDIA Table (centralized media references)
CREATE TABLE media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  listing_id UUID REFERENCES listings(id) ON DELETE SET NULL,
  url TEXT NOT NULL,
  key TEXT,                   -- S3 key
  mime_type TEXT,
  width INTEGER,
  height INTEGER,
  size_bytes BIGINT,
  blurhash TEXT,
  processed BOOLEAN DEFAULT FALSE,
  variants JSONB DEFAULT '{}'::jsonb, -- { "thumb": "...", "medium": "..." }
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_media_owner ON media (owner_user_id);
CREATE INDEX idx_media_listing ON media (listing_id);

-- OFFERS / NEGOTIATION
CREATE TYPE offer_status AS ENUM ('pending','countered','accepted','declined','expired','cancelled');

CREATE TABLE offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  offered_price NUMERIC(12,2) NOT NULL CHECK (offered_price >= 0),
  offered_quantity INTEGER DEFAULT 1 CHECK (offered_quantity >= 1),
  expires_at TIMESTAMPTZ,
  status offer_status DEFAULT 'pending',
  counter_for UUID REFERENCES offers(id),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_offers_listing ON offers (listing_id);
CREATE INDEX idx_offers_buyer ON offers (buyer_id);
CREATE INDEX idx_offers_seller ON offers (seller_id);
CREATE INDEX idx_offers_status_expires ON offers (status, expires_at);

-- ORDERS & ORDER ITEMS
CREATE TYPE order_status AS ENUM ('pending','reserved','paid','shipped','delivered','cancelled','refunded','disputed','completed');

CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  seller_id UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  total_amount NUMERIC(12,2) NOT NULL CHECK (total_amount >= 0),
  currency CHAR(3) DEFAULT 'USD',
  status order_status DEFAULT 'pending',
  shipping_address JSONB,    -- structured shipping address
  billing_info JSONB,
  escrow_info JSONB,         -- stripe hold / PaymentIntent info
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_orders_buyer ON orders (buyer_id);
CREATE INDEX idx_orders_seller ON orders (seller_id);
CREATE INDEX idx_orders_status ON orders (status);

CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE SET NULL,
  price NUMERIC(12,2) NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_order_items_order ON order_items (order_id);

-- PAYMENT RECORDS / IDP (Stripe)
CREATE TYPE payment_status AS ENUM ('created','requires_action','succeeded','failed','refunded','canceled');

CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  provider TEXT NOT NULL,            -- 'stripe', etc.
  provider_payment_id TEXT,          -- stripe paymentIntent / charge id
  status payment_status,
  amount NUMERIC(12,2),
  currency CHAR(3) DEFAULT 'USD',
  capture_method TEXT,               -- 'automatic'|'manual'
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_payments_provider_id ON payments (provider_payment_id);
CREATE INDEX idx_payments_order ON payments (order_id);

-- CHAT & MESSAGES
CREATE TABLE chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID REFERENCES listings(id) ON DELETE SET NULL,
  last_message_id UUID REFERENCES messages(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_chats_listing ON chats (listing_id);

CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body TEXT,
  attachments JSONB,      -- array of media ids or urls
  is_read BOOLEAN DEFAULT FALSE,
  is_system BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_messages_chat ON messages (chat_id);
CREATE INDEX idx_messages_sender ON messages (sender_id);
CREATE INDEX idx_messages_recipient_unread ON messages (recipient_id) WHERE (is_read = false);

-- REVIEWS / RATINGS
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reviewer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reviewee_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE, -- usually seller
  order_id UUID REFERENCES orders(id),
  rating SMALLINT CHECK (rating >= 1 AND rating <= 5),
  title TEXT,
  body TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_reviews_reviewee ON reviews (reviewee_id);
CREATE INDEX idx_reviews_order ON reviews (order_id);

-- DISPUTES & EVIDENCE
CREATE TYPE dispute_status AS ENUM ('open','under_review','resolved','closed','rejected');

CREATE TABLE disputes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  reporter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  respondent_id UUID REFERENCES users(id),
  reason TEXT,
  status dispute_status DEFAULT 'open',
  resolution JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE dispute_evidence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dispute_id UUID NOT NULL REFERENCES disputes(id) ON DELETE CASCADE,
  media_id UUID REFERENCES media(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_disputes_order ON disputes (order_id);

-- NOTIFICATIONS
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  actor_id UUID,            -- who caused the notification (user)
  type TEXT NOT NULL,       -- e.g., 'message','offer','order_update'
  payload JSONB,            -- arbitrary event payload
  is_read BOOLEAN DEFAULT FALSE,
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_notifications_user ON notifications (user_id);
CREATE INDEX idx_notifications_unread ON notifications (user_id) WHERE (is_read = false);

-- ANALYTICS / AUDIT (simple event log)
CREATE TABLE events_log (
  id BIGSERIAL PRIMARY KEY,
  event_name TEXT NOT NULL,
  payload JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_events_log_name_time ON events_log (event_name, created_at);

-- TRIGGERS: maintain updated_at timestamps
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach the trigger to tables that have updated_at
CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();
CREATE TRIGGER trg_sellers_updated_at BEFORE UPDATE ON sellers FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();
CREATE TRIGGER trg_listings_updated_at BEFORE UPDATE ON listings FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();
CREATE TRIGGER trg_offers_updated_at BEFORE UPDATE ON offers FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();
CREATE TRIGGER trg_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();
CREATE TRIGGER trg_payments_updated_at BEFORE UPDATE ON payments FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();
CREATE TRIGGER trg_disputes_updated_at BEFORE UPDATE ON disputes FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();

-- LISTINGS full-text search vector trigger
CREATE OR REPLACE FUNCTION listings_search_vector_trigger() RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', coalesce(NEW.title,'')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.description,'')), 'B');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_listings_search_vector BEFORE INSERT OR UPDATE
ON listings FOR EACH ROW EXECUTE PROCEDURE listings_search_vector_trigger();

-- Add GIN index on the tsvector
CREATE INDEX idx_listings_search_vector ON listings USING GIN (search_vector);

COMMIT;
