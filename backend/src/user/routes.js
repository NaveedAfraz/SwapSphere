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
const { authenticate } = require('../../src/common/middleware/auth');

// Get current user profile
router.get('/profile', authenticate, getProfile);

// Update user profile
router.put('/profile', authenticate, updateProfile);

// Update user settings (email, phone, active status)
router.put('/settings', authenticate, updateSettings);

// Upload avatar
router.post('/avatar', authenticate, uploadAvatar);

// Get seller profile by ID (public)
router.get('/seller/:sellerId', getSellerProfile);

// Create/update seller profile
router.post('/seller', authenticate, createSellerProfile);

// Delete/deactivate account
router.delete('/account', authenticate, deleteAccount);

module.exports = router;
