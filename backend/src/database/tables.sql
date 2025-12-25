-- Cleaned & Neon-ready SQL schema for Marketplace
-- Uses pgcrypto::gen_random_uuid(), consistent seller FK (sellers.id), nullable historical FKs where appropriate
-- NOTE: If you want PostGIS geometry for profiles.location, enable_postgis and change location type accordingly.

-- Enable required extensions (run as superuser-equivalent; Neon supports pgcrypto and pg_trgm)
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS btree_gin;
-- CREATE EXTENSION IF NOT EXISTS postgis; -- uncomment if you want geometry types

-- USERS
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE,
  phone text UNIQUE,
  password_hash text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  is_active boolean NOT NULL DEFAULT true,
  metadata jsonb DEFAULT '{}'
);

-- PROFILES (keep location as jsonb to avoid requiring PostGIS; change to geometry if you enable postgis)
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name text,
  avatar_key text,
  bio text,
  seller_mode boolean NOT NULL DEFAULT false,
  rating_avg numeric(3,2) DEFAULT 0,
  rating_count int DEFAULT 0,
  location jsonb,
  metadata jsonb DEFAULT '{}'
);

-- GIN index on JSONB location for fast lookups (use PostGIS/GIST if using geometry)
CREATE INDEX IF NOT EXISTS idx_profiles_location ON profiles USING GIN (location);

-- SELLERS (canonical seller record referencing users)
CREATE TABLE IF NOT EXISTS sellers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  store_name TEXT,
  bio TEXT,
  payout_info JSONB,
  seller_rating NUMERIC(3,2) DEFAULT 0.00,
  total_sales BIGINT DEFAULT 0,
  settings JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS ux_sellers_user ON sellers(user_id);
CREATE INDEX IF NOT EXISTS idx_sellers_store_name ON sellers (store_name);

-- LISTINGS
CREATE TABLE IF NOT EXISTS listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  price NUMERIC(12,2) NOT NULL CHECK (price >= 0),
  currency CHAR(3) DEFAULT 'USD',
  quantity INTEGER DEFAULT 1 CHECK (quantity >= 0),
  condition TEXT,
  category TEXT,
  location JSONB,
  tags TEXT[],
  is_published BOOLEAN DEFAULT TRUE,
  visibility TEXT DEFAULT 'public',
  metadata JSONB DEFAULT '{}'::jsonb,
  view_count BIGINT DEFAULT 0,
  favorites_count BIGINT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

-- tsvector search column
ALTER TABLE listings ADD COLUMN IF NOT EXISTS search_vector tsvector;

CREATE INDEX IF NOT EXISTS idx_listings_seller ON listings (seller_id);
CREATE INDEX IF NOT EXISTS idx_listings_price ON listings (price);
CREATE INDEX IF NOT EXISTS idx_listings_category ON listings (category);
CREATE INDEX IF NOT EXISTS idx_listings_tags ON listings USING GIN (tags);
CREATE INDEX IF NOT EXISTS idx_listings_search_trgm ON listings USING gin (title gin_trgm_ops, description gin_trgm_ops);

-- LISTING IMAGES
CREATE TABLE IF NOT EXISTS listing_images (
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
CREATE INDEX IF NOT EXISTS idx_listing_images_listing ON listing_images (listing_id);

-- MEDIA
CREATE TABLE IF NOT EXISTS media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  listing_id UUID REFERENCES listings(id) ON DELETE SET NULL,
  url TEXT NOT NULL,
  key TEXT,
  mime_type TEXT,
  width INTEGER,
  height INTEGER,
  size_bytes BIGINT,
  blurhash TEXT,
  processed BOOLEAN DEFAULT FALSE,
  variants JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_media_owner ON media (owner_user_id);
CREATE INDEX IF NOT EXISTS idx_media_listing ON media (listing_id);

-- OFFERS
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'offer_status') THEN
    CREATE TYPE offer_status AS ENUM ('pending','countered','accepted','declined','expired','cancelled');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
  offered_price NUMERIC(12,2) NOT NULL CHECK (offered_price >= 0),
  offered_quantity INTEGER DEFAULT 1 CHECK (offered_quantity >= 1),
  expires_at TIMESTAMPTZ,
  status offer_status DEFAULT 'pending',
  counter_for UUID REFERENCES offers(id),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_offers_listing ON offers (listing_id);
CREATE INDEX IF NOT EXISTS idx_offers_buyer ON offers (buyer_id);
CREATE INDEX IF NOT EXISTS idx_offers_seller ON offers (seller_id);
CREATE INDEX IF NOT EXISTS idx_offers_status_expires ON offers (status, expires_at);

-- ORDERS & ITEMS
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'order_status') THEN
    CREATE TYPE order_status AS ENUM ('pending','reserved','paid','shipped','delivered','cancelled','refunded','disputed','completed');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id UUID REFERENCES users(id) ON DELETE SET NULL,
  seller_id UUID REFERENCES sellers(id) ON DELETE SET NULL,
  total_amount NUMERIC(12,2) NOT NULL CHECK (total_amount >= 0),
  currency CHAR(3) DEFAULT 'USD',
  status order_status DEFAULT 'pending',
  shipping_address JSONB,
  billing_info JSONB,
  escrow_info JSONB,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_orders_buyer ON orders (buyer_id);
CREATE INDEX IF NOT EXISTS idx_orders_seller ON orders (seller_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders (status);

CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  listing_id UUID REFERENCES listings(id) ON DELETE SET NULL,
  price NUMERIC(12,2) NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  metadata JSONB DEFAULT '{}'::jsonb
);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items (order_id);

-- PAYMENTS
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_status') THEN
    CREATE TYPE payment_status AS ENUM ('created','requires_action','succeeded','failed','refunded','canceled');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  provider TEXT NOT NULL,
  provider_payment_id TEXT,
  status payment_status,
  amount NUMERIC(12,2),
  currency CHAR(3) DEFAULT 'USD',
  capture_method TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb
);
CREATE INDEX IF NOT EXISTS idx_payments_provider_id ON payments (provider_payment_id);
CREATE INDEX IF NOT EXISTS idx_payments_order ON payments (order_id);

-- CHATS & MESSAGES
CREATE TABLE IF NOT EXISTS chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID REFERENCES listings(id) ON DELETE SET NULL,
  last_message_id UUID REFERENCES messages(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_chats_listing ON chats (listing_id);

CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recipient_id UUID REFERENCES users(id) ON DELETE SET NULL,
  body TEXT,
  attachments JSONB,
  is_read BOOLEAN DEFAULT FALSE,
  is_system BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_messages_chat ON messages (chat_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages (sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_recipient_unread ON messages (recipient_id) WHERE (is_read = false);

-- Chat participants table
CREATE TABLE IF NOT EXISTS chat_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'participant',
  last_read_at TIMESTAMPTZ,
  muted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now(),
  participant1_id UUID,
  participant2_id UUID,
  UNIQUE (chat_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_chat_participants_chat ON chat_participants (chat_id);

-- REVIEWS
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reviewer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reviewee_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id),
  rating SMALLINT CHECK (rating >= 1 AND rating <= 5),
  title TEXT,
  body TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewee ON reviews (reviewee_id);
CREATE INDEX IF NOT EXISTS idx_reviews_order ON reviews (order_id);

-- DISPUTES
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'dispute_status') THEN
    CREATE TYPE dispute_status AS ENUM ('open','under_review','resolved','closed','rejected');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS disputes (
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

CREATE TABLE IF NOT EXISTS dispute_evidence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dispute_id UUID NOT NULL REFERENCES disputes(id) ON DELETE CASCADE,
  media_id UUID REFERENCES media(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_disputes_order ON disputes (order_id);

-- NOTIFICATIONS
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  actor_id UUID,
  type TEXT NOT NULL,
  payload JSONB,
  is_read BOOLEAN DEFAULT FALSE,
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications (user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications (user_id) WHERE (is_read = false);

-- EVENTS LOG
CREATE TABLE IF NOT EXISTS events_log (
  id BIGSERIAL PRIMARY KEY,
  event_name TEXT NOT NULL,
  payload JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_events_log_name_time ON events_log (event_name, created_at);
-- 1) Ensure trigger function exists (should already exist; harmless if re-run)
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2) Ensure updated_at column exists on important tables (idempotent)
ALTER TABLE IF EXISTS users       ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();
ALTER TABLE IF EXISTS sellers     ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();
ALTER TABLE IF EXISTS listings    ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();
ALTER TABLE IF EXISTS offers      ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();
ALTER TABLE IF EXISTS orders      ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();
ALTER TABLE IF EXISTS payments    ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();
ALTER TABLE IF EXISTS disputes    ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();
-- add more tables here if you want automatic updated_at

-- 3) Create triggers safely only if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_users_updated_at'
  ) THEN
    EXECUTE 'CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp()';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_sellers_updated_at'
  ) THEN
    EXECUTE 'CREATE TRIGGER trg_sellers_updated_at BEFORE UPDATE ON sellers FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp()';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_listings_updated_at'
  ) THEN
    EXECUTE 'CREATE TRIGGER trg_listings_updated_at BEFORE UPDATE ON listings FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp()';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_offers_updated_at'
  ) THEN
    EXECUTE 'CREATE TRIGGER trg_offers_updated_at BEFORE UPDATE ON offers FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp()';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_orders_updated_at'
  ) THEN
    EXECUTE 'CREATE TRIGGER trg_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp()';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_payments_updated_at'
  ) THEN
    EXECUTE 'CREATE TRIGGER trg_payments_updated_at BEFORE UPDATE ON payments FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp()';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_disputes_updated_at'
  ) THEN
    EXECUTE 'CREATE TRIGGER trg_disputes_updated_at BEFORE UPDATE ON disputes FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp()';
  END IF;
END
$$;

-- 4) Create listings search-vector trigger (only if missing)
CREATE OR REPLACE FUNCTION listings_search_vector_trigger() RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', coalesce(NEW.title,'')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.description,'')), 'B');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_listings_search_vector'
  ) THEN
    EXECUTE 'CREATE TRIGGER trg_listings_search_vector BEFORE INSERT OR UPDATE ON listings FOR EACH ROW EXECUTE PROCEDURE listings_search_vector_trigger()';
  END IF;
END$$;

-- 5) Ensure the GIN index on search_vector exists (idempotent)
CREATE INDEX IF NOT EXISTS idx_listings_search_vector ON listings USING GIN (search_vector); ERROR:  relation "messages" does not exist 

SQL state: 42P01  using pgadin and neon   

-- Add profile picture support to profiles table
-- This query adds a profile_picture_url column to store the full URL of the profile picture
-- The existing avatar_key column can be used for S3 key storage

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS profile_picture_url TEXT,
ADD COLUMN IF NOT EXISTS profile_picture_mime_type TEXT,
ADD COLUMN IF NOT EXISTS profile_picture_size_bytes BIGINT;

-- Add index for faster profile picture lookups
CREATE INDEX IF NOT EXISTS idx_profiles_avatar_key ON profiles (avatar_key);
CREATE INDEX IF NOT EXISTS idx_profiles_picture_url ON profiles (profile_picture_url);

-- Add comment to document the columns
COMMENT ON COLUMN profiles.avatar_key IS 'S3 storage key for profile picture image';
COMMENT ON COLUMN profiles.profile_picture_url IS 'Full URL of the profile picture image';
COMMENT ON COLUMN profiles.profile_picture_mime_type IS 'MIME type of profile picture (e.g., image/jpeg, image/png)';
COMMENT ON COLUMN profiles.profile_picture_size_bytes IS 'Size of profile picture in bytes';

-- Add status column to notifications table
-- This will help track the current status of offers within notifications
-- Note: is_read field already exists for read/unread state

DO $$ BEGIN
  -- Check if the status column already exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'notifications' 
    AND column_name = 'status'
  ) THEN
    -- Add the status column for offer status tracking
    ALTER TABLE notifications 
    ADD COLUMN status TEXT;
    
    -- Create index for better performance on status queries
    CREATE INDEX IF NOT EXISTS idx_notifications_status 
    ON notifications (status);
    
    -- Add comment to explain the purpose
    COMMENT ON COLUMN notifications.status IS 'Current status of the related entity (e.g., offer status: pending, accepted, declined, etc.)';
    
    -- Add comment for is_read field for clarity
    COMMENT ON COLUMN notifications.is_read IS 'Whether the notification has been read by the user (true/false)';
    
  END IF;
END $$;


CREATE TABLE IF NOT EXISTS intents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  category text,
  max_price numeric(12,2),
  location jsonb,
  status text DEFAULT 'open', -- open | matched | closed
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_intents_buyer ON intents(buyer_id);
CREATE INDEX IF NOT EXISTS idx_intents_status ON intents(status);

CREATE TABLE IF NOT EXISTS deal_rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  intent_id uuid REFERENCES intents(id) ON DELETE SET NULL,
  listing_id uuid REFERENCES listings(id) ON DELETE SET NULL,
  buyer_id uuid NOT NULL REFERENCES users(id),
  seller_id uuid NOT NULL REFERENCES sellers(id),
  current_state text NOT NULL DEFAULT 'negotiation',
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_deal_rooms_buyer ON deal_rooms(buyer_id);
CREATE INDEX IF NOT EXISTS idx_deal_rooms_seller ON deal_rooms(seller_id);
CREATE INDEX IF NOT EXISTS idx_deal_rooms_state ON deal_rooms(current_state);

CREATE TABLE IF NOT EXISTS deal_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_room_id uuid NOT NULL REFERENCES deal_rooms(id) ON DELETE CASCADE,
  actor_id uuid REFERENCES users(id),
  event_type text NOT NULL,
  payload jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_deal_events_room ON deal_events(deal_room_id);
CREATE INDEX IF NOT EXISTS idx_deal_events_type ON deal_events(event_type);

ALTER TABLE offers
ADD COLUMN IF NOT EXISTS deal_room_id uuid REFERENCES deal_rooms(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_offers_deal_room ON offers(deal_room_id);

ALTER TABLE orders
ADD COLUMN IF NOT EXISTS deal_room_id uuid REFERENCES deal_rooms(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_orders_deal_room ON orders(deal_room_id);

ALTER TABLE messages
ADD COLUMN IF NOT EXISTS deal_room_id uuid REFERENCES deal_rooms(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_messages_deal_room ON messages(deal_room_id);

ALTER TABLE listings
ADD COLUMN IF NOT EXISTS allow_offers boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS intent_eligible boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS accept_swaps boolean DEFAULT false;
CREATE INDEX IF NOT EXISTS idx_listings_intent_eligible ON listings(intent_eligible);
ALTER TABLE notifications
ADD COLUMN IF NOT EXISTS intent_id uuid REFERENCES intents(id),
ADD COLUMN IF NOT EXISTS listing_id uuid REFERENCES listings(id);

-- Unique constraint for dedupe: only one notification per (intent, listing, seller)
-- Use a partial unique index so existing other notifications are unaffected.
CREATE UNIQUE INDEX IF NOT EXISTS ux_notifications_intent_listing_seller
ON notifications (intent_id, listing_id, user_id)
WHERE intent_id IS NOT NULL AND listing_id IS NOT NULL;

ALTER TABLE orders
ADD COLUMN IF NOT EXISTS order_type TEXT NOT NULL DEFAULT 'cash';

ALTER TABLE orders
ADD COLUMN IF NOT EXISTS swap_items JSONB NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE orders
ADD CONSTRAINT orders_order_type_check
CHECK (order_type IN ('cash', 'swap', 'hybrid'));

-- Offer type: cash | swap | hybrid
ALTER TABLE offers
ADD COLUMN IF NOT EXISTS offer_type TEXT NOT NULL DEFAULT 'cash';

-- Cash amount for the offer (0 for swap-only)
ALTER TABLE offers
ADD COLUMN IF NOT EXISTS cash_amount NUMERIC(12,2) NOT NULL DEFAULT 0;

-- Swap items (lightweight, inline JSON)
-- Each item: { listing_id, title, image }
ALTER TABLE offers
ADD COLUMN IF NOT EXISTS swap_items JSONB NOT NULL DEFAULT '[]'::jsonb;

-- Ensure valid offer types
ALTER TABLE offers
ADD CONSTRAINT offers_offer_type_check
CHECK (offer_type IN ('cash', 'swap', 'hybrid'));

-- Cash must be >= 0
ALTER TABLE offers
ADD CONSTRAINT offers_cash_amount_check
CHECK (cash_amount >= 0);
