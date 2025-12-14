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
const { authenticate } = require('../../src/common/middleware/auth');

// Create a new listing
router.post('/', authenticate, createListing);

// Get all listings with filters and pagination
router.get('/', getListings);

// Search listings
router.get('/search', searchListings);

// Get a specific listing by ID
router.get('/:id', getListing);

// Update a listing
router.put('/:id', authenticate, updateListing);

// Delete a listing
router.delete('/:id', authenticate, deleteListing);

// Toggle favorite status
router.post('/:id/favorite', authenticate, toggleFavorite);

// Get user's favorites
router.get('/favorites/my', authenticate, getFavorites);

// Upload images for a listing
router.post('/:id/images', authenticate, uploadImages);

// Set primary image for a listing
router.put('/:id/images/:imageId/primary', authenticate, setPrimaryImage);

module.exports = router;
