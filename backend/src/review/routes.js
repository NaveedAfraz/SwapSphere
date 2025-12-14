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
const { authenticate } = require('../../src/common/middleware/auth');

// Create a new review
router.post('/', authenticate, createReview);

// Get reviews written by current user
router.get('/my', authenticate, getMyReviews);

// Get reviews about current user
router.get('/for-me', authenticate, getReviewsForMe);

// Get a specific review by ID
router.get('/:id', authenticate, getReview);

// Update a review
router.put('/:id', authenticate, updateReview);

// Delete a review
router.delete('/:id', authenticate, deleteReview);

module.exports = router;
