const express = require('express');
const router = express.Router();
const { pool } = require('../database/db');
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
  updateOffer: updateOfferController
} = require('./controller');
const { authenticate } = require('../../src/common/middleware/auth');
const { 
  checkResourceOwnership, 
  checkDealRoomAction, 
  checkNoDuplicateOrder,
  checkOfferStatusForAcceptance,
  rateLimitSensitive,
  logSecurityEvent
} = require('../common/middleware/securityGuards');

// Create a new offer
router.post('/', authenticate, createOffer);

// Get offers for current user (buyer)
router.get('/buyer', authenticate, getBuyerOffers);

// Get offers for current user (seller)
router.get('/seller', authenticate, getSellerOffers);

// Get offers for a specific listing
router.get('/listing/:listingId', authenticate, getListingOffers);

// Get a specific offer by ID
router.get('/:id', authenticate, checkResourceOwnership('offer'), getOffer);

// Accept an offer (buyer or seller, with security checks)
router.post('/:id/accept', 
  authenticate, 
  checkResourceOwnership('offer'),
  checkDealRoomAction('accept_offer'),
  checkNoDuplicateOrder,
  checkOfferStatusForAcceptance,
  rateLimitSensitive(3, 60000), // 3 accept attempts per minute
  logSecurityEvent('offer_accept'),
  acceptOffer
);

// Decline an offer (seller only)
router.post('/:id/decline', 
  authenticate, 
  checkResourceOwnership('offer'),
  checkDealRoomAction('decline_offer'),
  rateLimitSensitive(5, 60000),
  logSecurityEvent('offer_decline'),
  declineOffer
);

// Counter an offer
router.post('/:id/counter', 
  authenticate, 
  checkResourceOwnership('offer'),
  checkDealRoomAction('counter_offer'),
  rateLimitSensitive(10, 60000),
  logSecurityEvent('offer_counter'),
  counterOffer
);

// Cancel an offer (buyer only)
router.post('/:id/cancel', 
  authenticate, 
  checkResourceOwnership('offer'),
  checkDealRoomAction('cancel_offer'),
  rateLimitSensitive(5, 60000),
  logSecurityEvent('offer_cancel'),
  cancelOffer
);

// Update an offer
router.put('/:id', 
  authenticate, 
  checkResourceOwnership('offer'),
  rateLimitSensitive(10, 60000),
  logSecurityEvent('offer_update'),
  updateOfferController
);

module.exports = router;
