const { pool } = require("../database/db");

const getUserById = async (userId) => {
  const query = `
    SELECT u.id, u.email, u.phone, u.created_at, u.is_active,
           p.id as profile_id, p.name, p.avatar_key, p.bio, 
           p.seller_mode, p.rating_avg, p.rating_count, p.location,
           s.id as seller_id, s.store_name, s.seller_rating, s.total_sales
    FROM users u
    LEFT JOIN profiles p ON u.id = p.user_id
    LEFT JOIN sellers s ON u.id = s.user_id
    WHERE u.id = $1
  `;
  
  const result = await pool.query(query, [userId]);
  
  if (result.rows.length === 0) {
    return null;
  }
  
  const user = result.rows[0];
  return {
    id: user.id,
    email: user.email,
    phone: user.phone,
    created_at: user.created_at,
    is_active: user.is_active,
    profile: {
      id: user.profile_id,
      name: user.name,
      avatar_key: user.avatar_key,
      bio: user.bio,
      seller_mode: user.seller_mode,
      rating_avg: user.rating_avg,
      rating_count: user.rating_count,
      location: user.location
    },
    seller: user.seller_id ? {
      id: user.seller_id,
      store_name: user.store_name,
      seller_rating: user.seller_rating,
      total_sales: user.total_sales
    } : null
  };
};

const updateUserProfile = async (userId, profileData) => {
  const { name, bio, location, seller_mode } = profileData;
  
  const query = `
    INSERT INTO profiles (user_id, name, bio, location, seller_mode)
    VALUES ($1, $2, $3, $4, $5)
    ON CONFLICT (user_id)
    DO UPDATE SET 
      name = EXCLUDED.name,
      bio = EXCLUDED.bio,
      location = EXCLUDED.location,
      seller_mode = EXCLUDED.seller_mode,
      updated_at = NOW()
    RETURNING *
  `;
  
  const result = await pool.query(query, [userId, name, bio, location, seller_mode]);
  return result.rows[0];
};

const createSellerProfile = async (userId, sellerData) => {
  const { store_name, bio, payout_info } = sellerData;
  
  const query = `
    INSERT INTO sellers (user_id, store_name, bio, payout_info)
    VALUES ($1, $2, $3, $4)
    ON CONFLICT (user_id)
    DO UPDATE SET 
      store_name = EXCLUDED.store_name,
      bio = EXCLUDED.bio,
      payout_info = EXCLUDED.payout_info,
      updated_at = NOW()
    RETURNING *
  `;
  
  const result = await pool.query(query, [userId, store_name, bio, payout_info]);
  return result.rows[0];
};

const getSellerById = async (sellerId) => {
  const query = `
    SELECT s.id, s.store_name, s.bio, s.seller_rating, s.total_sales, s.created_at,
           p.name, p.avatar_key, p.rating_avg, p.rating_count
    FROM sellers s
    JOIN users u ON s.user_id = u.id
    LEFT JOIN profiles p ON u.id = p.user_id
    WHERE s.id = $1 AND u.is_active = true
  `;
  
  const result = await pool.query(query, [sellerId]);
  return result.rows[0] || null;
};

const updateUserAvatar = async (userId, avatarKey) => {
  const query = `
    INSERT INTO profiles (user_id, avatar_key)
    VALUES ($1, $2)
    ON CONFLICT (user_id)
    DO UPDATE SET 
      avatar_key = EXCLUDED.avatar_key,
      updated_at = NOW()
    RETURNING avatar_key
  `;
  
  const result = await pool.query(query, [userId, avatarKey]);
  return result.rows[0];
};

const deactivateUser = async (userId) => {
  const query = 'UPDATE users SET is_active = false WHERE id = $1';
  await pool.query(query, [userId]);
};

module.exports = {
  getUserById,
  updateUserProfile,
  createSellerProfile,
  getSellerById,
  updateUserAvatar,
  deactivateUser
};
