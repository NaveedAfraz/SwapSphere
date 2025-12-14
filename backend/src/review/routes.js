const express = require('express');
const router = express.Router();
const { 
  createReview,
  getMyReviews,
  getReviewsForMe,
  getReview,
  updateReview,
  deleteReview
} = require('./controller');
const { authenticateToken } = require('../middleware/auth');

// Create a new review
router.post('/', authenticateToken, createReview);

// Get reviews written by current user
router.get('/my', authenticateToken, getMyReviews);

// Get reviews about current user
router.get('/for-me', authenticateToken, getReviewsForMe);

// Get a specific review by ID
router.get('/:id', authenticateToken, getReview);

// Update a review
router.put('/:id', authenticateToken, updateReview);

// Delete a review
router.delete('/:id', authenticateToken, deleteReview);

module.exports = router;
