const { pool } = require("../database/db");
// User model methods
const User = {
  // Find user by email or phone
  async findByEmailOrPhone(email, phone = null) {
    const result = await pool.query(
      "SELECT * FROM users WHERE email = $1 OR phone = $2",
      [email, phone]
    );
    return result.rows[0];
  },

  // Find user by ID
  async findById(id) {
    const result = await pool.query(
      "SELECT * FROM users WHERE id = $1 AND is_active = true",
      [id]
    );
    return result.rows[0];
  },

  // Create new user
  async create(userData) {
    const { email, phone, password_hash } = userData;
    const result = await pool.query(
      `INSERT INTO users (email, phone, password_hash) 
       VALUES ($1, $2, $3) 
       RETURNING id, email, phone, created_at`,
      [email, phone || null, password_hash]
    );
    return result.rows[0];
  },

  // Update user
  async update(id, updates) {
    const fields = Object.keys(updates);
    const values = Object.values(updates);
    const setClause = fields
      .map((field, index) => `${field} = $${index + 2}`)
      .join(", ");

    const result = await pool.query(
      `UPDATE users SET ${setClause}, updated_at = NOW() 
       WHERE id = $1 RETURNING *`,
      [id, ...values]
    );
    return result.rows[0];
  },
};

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

  // Create profile
  async create(profileData) {
    const { user_id, name, bio, seller_mode, location } = profileData;
    const result = await pool.query(
      `INSERT INTO profiles (user_id, name, bio, seller_mode, location) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING *`,
      [
        user_id,
        name || null,
        bio || null,
        seller_mode || false,
        location || null,
      ]
    );
    return result.rows[0];
  },

  // Update profile
  async update(id, updates) {
    const fields = Object.keys(updates);
    const values = Object.values(updates);
    const setClause = fields
      .map((field, index) => `${field} = $${index + 2}`)
      .join(", ");

    const result = await pool.query(
      `UPDATE profiles SET ${setClause} 
       WHERE id = $1 RETURNING *`,
      [id, ...values]
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
};

// Seller model methods
const Seller = {
  // Find seller by user ID
  async findByUserId(userId) {
    const result = await pool.query(
      "SELECT * FROM sellers WHERE user_id = $1",
      [userId]
    );
    return result.rows[0];
  },

  // Create seller profile
  async create(sellerData) {
    const { user_id, store_name, bio } = sellerData;
    const result = await pool.query(
      `INSERT INTO sellers (user_id, store_name, bio) 
       VALUES ($1, $2, $3) 
       RETURNING *`,
      [user_id, store_name || null, bio || null]
    );
    return result.rows[0];
  },

  // Update seller profile
  async update(id, updates) {
    const fields = Object.keys(updates);
    const values = Object.values(updates);
    const setClause = fields
      .map((field, index) => `${field} = $${index + 2}`)
      .join(", ");

    const result = await pool.query(
      `UPDATE sellers SET ${setClause} 
       WHERE id = $1 RETURNING *`,
      [id, ...values]
    );
    return result.rows[0];
  },
};

module.exports = {
  User,
  Profile,
  Seller,
  pool,
};
