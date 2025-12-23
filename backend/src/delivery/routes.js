const express = require('express');
const router = express.Router();
const { 
  confirmDelivery,
  markAsShipped,
  getDeliveryStatus
} = require('./controller');
const { authenticate } = require('../common/middleware/auth');
const { 
  checkResourceOwnership,
  rateLimitSensitive,
  logSecurityEvent
} = require('../common/middleware/securityGuards');


// Confirm delivery (buyer only)
router.post('/confirm', 
  authenticate, 
  rateLimitSensitive(5, 60000),
  logSecurityEvent('delivery_confirm'),
  confirmDelivery
);

// Mark item as shipped (seller only)
router.post('/ship', 
  authenticate, 
  rateLimitSensitive(5, 60000),
  logSecurityEvent('delivery_ship'),
  markAsShipped
);

// Get delivery status for deal room
router.get('/deal-room/:deal_room_id', 
  authenticate, 
  checkResourceOwnership('deal_room'),
  getDeliveryStatus
);

module.exports = router;
