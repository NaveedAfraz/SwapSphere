const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require("../database/db");
const { getUserById, updateUserProfile, createSellerProfile: createSellerProfileModel } = require('./model');

const getProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const user = await getUserById(userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    console.error('Error getting profile:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, bio, location, seller_mode } = req.body;
    
    const updatedProfile = await updateUserProfile(userId, { name, bio, location, seller_mode });
    
    res.json(updatedProfile);
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

  const updateSettings = async (req, res) => {
  try {
    const userId = req.user.id;
    const { email, phone, is_active } = req.body;
    
    const updates = [];
    const values = [];
    let paramIndex = 1;
    
    if (email !== undefined) {
      updates.push(`email = $${paramIndex++}`);
      values.push(email);
    }
    
    if (phone !== undefined) {
      updates.push(`phone = $${paramIndex++}`);
      values.push(phone);
    }
    
    if (is_active !== undefined) {
      updates.push(`is_active = $${paramIndex++}`);
      values.push(is_active);
    }
    
    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }
    
    values.push(userId);
    
    const query = `
      UPDATE users 
      SET ${updates.join(', ')}, updated_at = NOW()
      WHERE id = $${paramIndex}
      RETURNING id, email, phone, is_active, updated_at
    `;
    
    const result = await pool.query(query, values);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const uploadAvatar = async (req, res) => {
  try {
    const userId = req.user.id;
    const { avatar_key } = req.body;
    
    const query = `
      INSERT INTO profiles (user_id, avatar_key)
      VALUES ($1, $2)
      ON CONFLICT (user_id)
      DO UPDATE SET 
        avatar_key = EXCLUDED.avatar_key,
        updated_at = NOW()
      RETURNING avatar_key
    `;
    
    const result = await pool.query(query, [userId, avatar_key]);
    
    res.json({ avatar_key: result.rows[0].avatar_key });
  } catch (error) {
    console.error('Error uploading avatar:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getSellerProfile = async (req, res) => {
  try {
    const { sellerId } = req.params;
    
    const query = `
      SELECT s.id, s.store_name, s.bio, s.seller_rating, s.total_sales, s.created_at,
             p.name, p.avatar_key, p.rating_avg, p.rating_count
      FROM sellers s
      JOIN users u ON s.user_id = u.id
      LEFT JOIN profiles p ON u.id = p.user_id
      WHERE s.id = $1 AND u.is_active = true
    `;
    
    const result = await pool.query(query, [sellerId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Seller not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error getting seller profile:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const createSellerProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { store_name, bio, payout_info } = req.body;
    
    const seller = await createSellerProfileModel(userId, { store_name, bio, payout_info });
    
    const profileQuery = `
      UPDATE profiles 
      SET seller_mode = true, updated_at = NOW()
      WHERE user_id = $1
    `;
    
    await pool.query(profileQuery, [userId]);
    
    res.json(seller);
  } catch (error) {
    console.error('Error creating seller profile:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const deleteAccount = async (req, res) => {
  try {
    const userId = req.user.id;
    
    await pool.query('BEGIN');
    
    await pool.query('UPDATE users SET is_active = false WHERE id = $1', [userId]);
    
    await pool.query('COMMIT');
    
    res.json({ message: 'Account deactivated successfully' });
  } catch (error) {
    await pool.query('ROLLBACK');
    console.error('Error deleting account:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  updateSettings,
  uploadAvatar,
  getSellerProfile,
  createSellerProfile,
  deleteAccount
};
