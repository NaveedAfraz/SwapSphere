const express = require('express');
const router = express.Router();
const { 
  getProfile, 
  updateProfile, 
  updateSettings, 
  uploadAvatar, 
  getSellerProfile, 
  createSellerProfile, 
  deleteAccount 
} = require('./controller');
const { authenticate } = require('../middleware/auth');

// Get current user profile
router.get('/profile', authenticateToken, getProfile);

// Update user profile
router.put('/profile', authenticateToken, updateProfile);

// Update user settings (email, phone, active status)
router.put('/settings', authenticateToken, updateSettings);

// Upload avatar
router.post('/avatar', authenticateToken, uploadAvatar);

// Get seller profile by ID (public)
router.get('/seller/:sellerId', getSellerProfile);

// Create/update seller profile
router.post('/seller', authenticateToken, createSellerProfile);

// Delete/deactivate account
router.delete('/account', authenticateToken, deleteAccount);

module.exports = router;
