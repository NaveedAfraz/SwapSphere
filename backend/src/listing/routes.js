const express = require('express');
const router = express.Router();
const { 
  createListing,
  getListings,
  getListing,
  updateListing,
  deleteListing,
  searchListings,
  toggleFavorite,
  getFavorites,
  uploadImages,
  setPrimaryImage
} = require('./controller');
const { authenticateToken } = require('../middleware/auth');

// Create a new listing
router.post('/', authenticateToken, createListing);

// Get all listings with filters and pagination
router.get('/', getListings);

// Search listings
router.get('/search', searchListings);

// Get a specific listing by ID
router.get('/:id', getListing);

// Update a listing
router.put('/:id', authenticateToken, updateListing);

// Delete a listing
router.delete('/:id', authenticateToken, deleteListing);

// Toggle favorite status
router.post('/:id/favorite', authenticateToken, toggleFavorite);

// Get user's favorites
router.get('/favorites/my', authenticateToken, getFavorites);

// Upload images for a listing
router.post('/:id/images', authenticateToken, uploadImages);

// Set primary image for a listing
router.put('/:id/images/:imageId/primary', authenticateToken, setPrimaryImage);

module.exports = router;
