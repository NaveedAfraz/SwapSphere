-- Insert users data
INSERT INTO users (id, email, password_hash, created_at, updated_at, is_active, metadata) VALUES
('12f7cbbb-5fde-4024-800d-edfbd1895729', 'naveedafraz123@gmail.com', '$2b$12$330xgRq76T6tcXXLRGmoQOOhWoYqcRwmHuLUkuTGl40h4dnTO7Kwe', '2025-12-11 16:39:21.972239+00', '2025-12-11 16:39:21.972239+00', true, '{}'),
('689cfce5-1436-44a1-bb3f-6f670b3daa59', 'naveed1@gamil.com', '$2b$12$jsULO17Ml/.iT56dxSB5wO3ceEG2jWrc9Q7hW31poQhq9zIikkSJK', '2025-12-11 17:28:13.723093+00', '2025-12-11 17:28:13.723093+00', true, '{}'),
('a1c09f07-6e26-44b6-aa66-461f57c0e519', 'naveed1@gmail.com', '$2b$12$A1oSY6tF2i/AzHwChumpDux2O7gZI0pS1ZyU3Di4qJw/uVYlo3.1u', '2025-12-11 17:32:27.226568+00', '2025-12-11 17:32:27.226568+00', true, '{}')
ON CONFLICT (id) DO NOTHING;

-- Create profiles for these users
INSERT INTO profiles (user_id, name, bio, seller_mode, location, rating_avg, rating_count, metadata) VALUES
('12f7cbbb-5fde-4024-800d-edfbd1895729', 'Naveed Afraz', 'Tech enthusiast and seller', true, '{"city": "New York", "state": "NY"}', 0.0, 0, '{}'),
('689cfce5-1436-44a1-bb3f-6f670b3daa59', 'Naveed', 'Electronics seller', true, '{"city": "Los Angeles", "state": "CA"}', 0.0, 0, '{}'),
('a1c09f07-6e26-44b6-aa66-461f57c0e519', 'Naveed', 'General marketplace seller', true, '{"city": "Chicago", "state": "IL"}', 0.0, 0, '{}')
ON CONFLICT (user_id) DO UPDATE SET
  name = EXCLUDED.name,
  bio = EXCLUDED.bio,
  seller_mode = EXCLUDED.seller_mode,
  location = EXCLUDED.location,
  updated_at = now();

-- Create seller profiles for these users
INSERT INTO sellers (user_id, store_name, bio, seller_rating, total_sales, settings, created_at, updated_at) VALUES
('12f7cbbb-5fde-4024-800d-edfbd1895729', 'Naveed''s Tech Store', 'Specializing in electronics and gadgets', 0.00, 0, '{}', now(), now()),
('689cfce5-1436-44a1-bb3f-6f670b3daa59', 'Naveed''s Electronics', 'Quality electronics at great prices', 0.00, 0, '{}', now(), now()),
('a1c09f07-6e26-44b6-aa66-461f57c0e519', 'Naveed''s Marketplace', 'Various items for sale', 0.00, 0, '{}', now(), now())
ON CONFLICT (user_id) DO UPDATE SET
  store_name = EXCLUDED.store_name,
  bio = EXCLUDED.bio,
  updated_at = now();
