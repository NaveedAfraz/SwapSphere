const express = require('express');
const { authenticate } = require('../common/middleware/auth');
const {
  startAuction,
  placeBid,
  getAuction,
  getAuctionByDealRoom,
  cancelAuction,
} = require('./controller');

const router = express.Router();

// POST /api/auction/deals/:directDealId/start-auction - Start auction from direct deal
router.post('/deals/:directDealId/start-auction', authenticate, startAuction);

// POST /api/auction/:id/bid - Place bid
router.post('/:id/bid', authenticate, placeBid);

// GET /api/auction/:id - Get auction state
router.get('/:id', authenticate, getAuction);

// GET /api/auction/deal-room/:dealRoomId - Get auction by deal room ID
router.get('/deal-room/:dealRoomId', authenticate, getAuctionByDealRoom);

// POST /api/auction/:id/cancel - Cancel auction (seller only)
router.post('/:id/cancel', authenticate, cancelAuction);

module.exports = router;
