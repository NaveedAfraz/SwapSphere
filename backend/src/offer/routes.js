const express = require('express');
const router = express.Router();
const { 
  createOffer,
  getBuyerOffers,
  getSellerOffers,
  getListingOffers,
  getOffer,
  acceptOffer,
  declineOffer,
  counterOffer,
  cancelOffer
} = require('./controller');
const { authenticateToken } = require('../middleware/auth');

// Create a new offer
router.post('/', authenticateToken, createOffer);

// Get current user's buyer offers
router.get('/buyer', authenticateToken, getBuyerOffers);

// Get current user's seller offers
router.get('/seller', authenticateToken, getSellerOffers);

// Get offers for a specific listing
router.get('/listing/:listingId', getListingOffers);

// Get a specific offer by ID
router.get('/:id', authenticateToken, getOffer);

// Accept an offer (seller only)
router.post('/:id/accept', authenticateToken, acceptOffer);

// Decline an offer (seller only)
router.post('/:id/decline', authenticateToken, declineOffer);

// Create a counter offer (seller only)
router.post('/:id/counter', authenticateToken, counterOffer);

// Cancel an offer (buyer only)
router.post('/:id/cancel', authenticateToken, cancelOffer);

module.exports = router;
