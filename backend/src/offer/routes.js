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
  cancelOffer,
  updateOffer
} = require('./controller');
const { authenticate } = require('../../src/common/middleware/auth');

// Create a new offer
router.post('/', authenticate, createOffer);

// Get current user's buyer offers
router.get('/buyer', authenticate, getBuyerOffers);

// Get current user's seller offers
router.get('/seller', authenticate, getSellerOffers);

// Get offers for a specific listing
router.get('/listing/:listingId', getListingOffers);

// Get a specific offer by ID
router.get('/:id', authenticate, getOffer);

// Accept an offer (seller only)
router.post('/:id/accept', authenticate, acceptOffer);

// Decline an offer (seller only)
router.post('/:id/decline', authenticate, declineOffer);

// Create a counter offer (seller only)
router.post('/:id/counter', authenticate, counterOffer);

// Cancel an offer (buyer only)
router.post('/:id/cancel', authenticate, cancelOffer);

// Update an offer (buyer or seller depending on ownership)
router.put('/:id', authenticate, updateOffer);

module.exports = router;
