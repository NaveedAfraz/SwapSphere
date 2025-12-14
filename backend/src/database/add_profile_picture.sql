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
