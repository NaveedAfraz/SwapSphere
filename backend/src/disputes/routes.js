const express = require('express');
const router = express.Router();
const { 
  createDispute,
  resolveDispute,
  getDealRoomDisputes
} = require('./controller');
const { authenticate } = require('../common/middleware/auth');
const { 
  checkResourceOwnership,
  rateLimitSensitive,
  logSecurityEvent
} = require('../common/middleware/securityGuards');

// Create a new dispute
router.post('/', 
  authenticate, 
  rateLimitSensitive(3, 60000), // 3 disputes per minute
  logSecurityEvent('dispute_create'),
  createDispute
);

// Resolve a dispute (admin only)
router.post('/:id/resolve', 
  authenticate, 
  rateLimitSensitive(5, 60000),
  logSecurityEvent('dispute_resolve'),
  resolveDispute
);

// Get disputes for a deal room
router.get('/deal-room/:deal_room_id', 
  authenticate, 
  checkResourceOwnership('deal_room'),
  getDealRoomDisputes
);

module.exports = router;
