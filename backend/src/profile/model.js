const { pool } = require("../database/db");

// Profile model methods
const Profile = {
  // Find profile by user ID
  async findByUserId(userId) {
    const result = await pool.query(
      "SELECT * FROM profiles WHERE user_id = $1",
      [userId]
    );
    return result.rows[0];
  },

  // Find profile by ID
  async findById(id) {
    const result = await pool.query(
      "SELECT * FROM profiles WHERE id = $1",
      [id]
    );
    return result.rows[0];
  },

  // Find profile by username
  async findByUsername(username) {
    const result = await pool.query(
      "SELECT * FROM profiles WHERE username = $1",
      [username]
    );
    return result.rows[0];
  },

  // Create profile
  async create(profileData) {
    const { 
      user_id, 
      username, 
      display_name, 
      bio, 
      avatar_url, 
      cover_image_url, 
      location, 
      website, 
      social_links, 
      verification_status, 
      is_seller,
      preferences 
    } = profileData;
    
    const result = await pool.query(
      `INSERT INTO profiles (
        user_id, username, display_name, bio, avatar_url, cover_image_url, 
        location, website, social_links, verification_status, is_seller, preferences
      ) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) 
      RETURNING *`,
      [
        user_id,
        username || null,
        display_name || null,
        bio || null,
        avatar_url || null,
        cover_image_url || null,
        location || null,
        website || null,
        social_links ? JSON.stringify(social_links) : null,
        verification_status || 'not_verified',
        is_seller || false,
        preferences ? JSON.stringify(preferences) : null,
      ]
    );
    return result.rows[0];
  },

  // Update profile
  async update(id, updates) {
    const fields = Object.keys(updates);
    const values = Object.values(updates);
    
    // Handle JSON fields
    const processedValues = values.map(value => {
      if (typeof value === 'object' && value !== null) {
        return JSON.stringify(value);
      }
      return value;
    });
    
    const setClause = fields
      .map((field, index) => `${field} = $${index + 2}`)
      .join(", ");

    const result = await pool.query(
      `UPDATE profiles SET ${setClause}, updated_at = NOW() 
       WHERE id = $1 RETURNING *`,
      [id, ...processedValues]
    );
    return result.rows[0];
  },

  // Update profile by user ID
  async updateByUserId(userId, updates) {
    const fields = Object.keys(updates);
    const values = Object.values(updates);
    
    // Handle JSON fields
    const processedValues = values.map(value => {
      if (typeof value === 'object' && value !== null) {
        return JSON.stringify(value);
      }
      return value;
    });
    
    const setClause = fields
      .map((field, index) => `${field} = $${index + 2}`)
      .join(", ");

    const result = await pool.query(
      `UPDATE profiles SET ${setClause}, updated_at = NOW() 
       WHERE user_id = $1 RETURNING *`,
      [userId, ...processedValues]
    );
    return result.rows[0];
  },

  // Get profile with user info
  async getWithUser(userId) {
    const result = await pool.query(
      `SELECT p.*, u.email, u.phone 
       FROM profiles p 
       JOIN users u ON p.user_id = u.id 
       WHERE p.user_id = $1`,
      [userId]
    );
    return result.rows[0];
  },

  // Get public profile data
  async getPublicProfile(username) {
    const result = await pool.query(
      `SELECT p.id, p.user_id, p.username, p.display_name, p.bio, p.avatar_url, 
              p.cover_image_url, p.location, p.website, p.verification_status, 
              p.is_seller, p.created_at
       FROM profiles p 
       WHERE p.username = $1 OR p.display_name = $1`,
      [username]
    );
    return result.rows[0];
  },

  // Delete profile
  async delete(id) {
    const result = await pool.query(
      "DELETE FROM profiles WHERE id = $1 RETURNING *",
      [id]
    );
    return result.rows[0];
  },

  // Get profile stats
  async getStats(userId) {
    const result = await pool.query(
      "SELECT stats FROM profiles WHERE user_id = $1",
      [userId]
    );
    return result.rows[0]?.stats;
  },

  // Update profile stats
  async updateStats(userId, stats) {
    const result = await pool.query(
      "UPDATE profiles SET stats = $1, updated_at = NOW() WHERE user_id = $2 RETURNING *",
      [JSON.stringify(stats), userId]
    );
    return result.rows[0];
  },

  // Search profiles
  async search(query, limit = 20, offset = 0) {
    const result = await pool.query(
      `SELECT p.id, p.username, p.display_name, p.avatar_url, p.bio, p.location
       FROM profiles p 
       WHERE p.display_name ILIKE $1 OR p.username ILIKE $1
       ORDER BY p.display_name
       LIMIT $2 OFFSET $3`,
      [`%${query}%`, limit, offset]
    );
    return result.rows;
  },

  // Get seller profiles
  async getSellers(limit = 20, offset = 0) {
    const result = await pool.query(
      `SELECT p.id, p.username, p.display_name, p.avatar_url, p.bio, p.location
       FROM profiles p 
       WHERE p.is_seller = true
       ORDER BY p.created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    return result.rows;
  },
};

module.exports = {
  Profile,
  pool,
};