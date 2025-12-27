const { pool } = require('../../database/db');
const { canUserPerformAction } = require('../../dealRooms/stateTransitions');

// Middleware to check if user owns the resource
const checkResourceOwnership = (resourceType, userIdField = 'user_id') => {
  return async (req, res, next) => {
    try {
      const userId = req.user.id;
      const resourceId = req.params.id || req.params.orderId || req.params.paymentId;
      
      
      if (!resourceId) {
        return res.status(400).json({ error: 'Resource ID required' });
      }

      let query;
      switch (resourceType) {
        case 'order':
          query = `SELECT 1 FROM orders WHERE id = $1 AND (buyer_id = $2 OR seller_id = (SELECT id FROM sellers WHERE user_id = $2))`;
          break;
        case 'payment':
          query = `SELECT 1 FROM payments p JOIN orders o ON p.order_id = o.id WHERE p.id = $1 AND (o.buyer_id = $2 OR o.seller_id = (SELECT id FROM sellers WHERE user_id = $2))`;
          break;
        case 'offer':
          query = `SELECT 1 FROM offers o LEFT JOIN sellers s ON o.seller_id = s.id WHERE o.id = $1 AND (o.buyer_id = $2 OR s.user_id = $2)`;
          break;
        case 'deal_room':
          query = `SELECT 1 FROM deal_rooms dr LEFT JOIN sellers s ON dr.seller_id = s.id WHERE dr.id = $1 AND (dr.buyer_id = $2 OR s.user_id = $2)`;
          break;
        default:
          return res.status(400).json({ error: 'Invalid resource type' });
      }

      const result = await pool.query(query, [resourceId, userId]);
      
      if (result.rows.length === 0) {
        return res.status(403).json({ error: 'Access denied: You do not own this resource' });
      }

      next();
    } catch (error) {
      console.error('[SECURITY] Resource ownership check failed:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
};

// Middleware to check if user can perform specific action on deal room
const checkDealRoomAction = (action) => {
  return async (req, res, next) => {
    try {
      const userId = req.user.id;
      // For offer actions, we need to get the deal room ID from the offer
      let dealRoomId = null;
       
      // First check if deal room ID is in request body
      if (req.body && req.body.deal_room_id) {
        dealRoomId = req.body.deal_room_id;
      } else if (req.params.id) {
        // This is an offer action, get deal room ID from offer
        const offerQuery = `
          SELECT deal_room_id 
          FROM offers 
          WHERE id = $1
        `;
        const offerResult = await pool.query(offerQuery, [req.params.id]);
        
        if (offerResult.rows.length > 0) {
          dealRoomId = offerResult.rows[0].deal_room_id;
        } else {
        }
      }
      
      
      if (!dealRoomId) {
        return res.status(400).json({ error: 'Deal room ID required' });
      }

      const canPerform = await canUserPerformAction(dealRoomId, userId, action);
      
      if (!canPerform) {
        return res.status(403).json({ 
          error: 'Access denied: You cannot perform this action',
          action,
          deal_room_id: dealRoomId
        });
      }

      next();
    } catch (error) {
      console.error('[SECURITY] Deal room action check failed:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
};

// Middleware to ensure only buyer can perform action
const checkBuyerOnly = () => {
  return async (req, res, next) => {
    try {
      const userId = req.user.id;
      const orderId = req.params.id || req.params.orderId || req.body.order_id;
      
      
      if (!orderId) {
        return res.status(400).json({ error: 'Order ID required' });
      }

      const query = 'SELECT 1 FROM orders WHERE id = $1 AND buyer_id = $2';
      const result = await pool.query(query, [orderId, userId]);
      
      
      if (result.rows.length === 0) {
        return res.status(403).json({ error: 'Access denied: Only buyer can perform this action' });
      }

      next();
    } catch (error) {
      console.error('[SECURITY] Buyer check failed:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
};

// Middleware to ensure only seller can perform action
const checkSellerOnly = () => {
  return async (req, res, next) => {
    try {
      const userId = req.user.id;
      const orderId = req.params.id || req.params.orderId || req.body.order_id;
      
      if (!orderId) {
        return res.status(400).json({ error: 'Order ID required' });
      }

      const query = `
        SELECT 1 FROM orders o 
        JOIN sellers s ON o.seller_id = s.id 
        WHERE o.id = $1 AND s.user_id = $2
      `;
      const result = await pool.query(query, [orderId, userId]);
      
      if (result.rows.length === 0) {
        return res.status(403).json({ error: 'Access denied: Only seller can perform this action' });
      }

      next();
    } catch (error) {
      console.error('[SECURITY] Seller check failed:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
};

// Middleware to prevent duplicate orders for same offer
const checkNoDuplicateOrder = async (req, res, next) => {
  try {
    const offerId = req.params.id || req.body.offer_id;
    
    
    if (!offerId) {
      return res.status(400).json({ error: 'Offer ID required' });
    }

    const query = 'SELECT 1 FROM orders WHERE metadata->>\'offer_id\' = $1';
    const result = await pool.query(query, [offerId]);
    
    if (result.rows.length > 0) {
      return res.status(400).json({ error: 'Order already exists for this offer' });
    }

    next();
  } catch (error) {
    console.error('[SECURITY] Duplicate order check failed:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Middleware to prevent duplicate payments for same order
const checkNoDuplicatePayment = async (req, res, next) => {
  try {
    const orderId = req.body.order_id;
    
    
    if (!orderId) {
      return res.status(400).json({ error: 'Order ID required' });
    }

    const query = 'SELECT 1 FROM payments WHERE order_id = $1 AND status NOT IN (\'failed\', \'canceled\')';
    const result = await pool.query(query, [orderId]);
    
    
    if (result.rows.length > 0) {
      return res.status(400).json({ error: 'Payment already exists for this order' });
    }

    next();
  } catch (error) {
    console.error('[SECURITY] Duplicate payment check failed:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Middleware to validate offer status before acceptance
const checkOfferStatusForAcceptance = async (req, res, next) => {
  try {
    const offerId = req.params.id;
    
    
    if (!offerId) {
      return res.status(400).json({ error: 'Offer ID required' });
    }

    const query = 'SELECT status FROM offers WHERE id = $1';
    const result = await pool.query(query, [offerId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Offer not found' });
    }
    
    const offer = result.rows[0];
    
    if (offer.status !== 'pending' && offer.status !== 'countered') {
      return res.status(400).json({ 
        error: 'Offer cannot be accepted',
        current_status: offer.status,
        allowed_statuses: ['pending', 'countered']
      });
    }

    next();
  } catch (error) {
    console.error('[SECURITY] Offer status check failed:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Middleware to validate payment amount matches order total
const validatePaymentAmount = async (req, res, next) => {
  try {
    const orderId = req.body.order_id;
    const paymentAmount = req.body.amount;
    
    
    if (!orderId || !paymentAmount) {
      return res.status(400).json({ error: 'Order ID and payment amount required' });
    }

    const query = 'SELECT total_amount FROM orders WHERE id = $1';
    const result = await pool.query(query, [orderId]);
    
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    const order = result.rows[0];
    
    if (Math.abs(paymentAmount - order.total_amount) > 0.01) { // Allow small rounding differences
      return res.status(400).json({ 
        error: 'Payment amount does not match order total',
        expected_amount: order.total_amount,
        provided_amount: paymentAmount
      });
    }

    next();
  } catch (error) {
    console.error('[SECURITY] Payment amount validation failed:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Rate limiting middleware for sensitive operations
const rateLimitSensitive = (maxRequests = 5, windowMs = 60000) => {
  const requests = new Map();
  
  return (req, res, next) => {
    const userId = req.user.id;
    const key = `${userId}:${req.path}`;
    const now = Date.now();
    
    if (!requests.has(key)) {
      requests.set(key, { count: 1, resetTime: now + windowMs });
      return next();
    }
    
    const userRequests = requests.get(key);
    
    if (now > userRequests.resetTime) {
      requests.set(key, { count: 1, resetTime: now + windowMs });
      return next();
    }
    
    if (userRequests.count >= maxRequests) {
      return res.status(429).json({ 
        error: 'Too many requests',
        retryAfter: Math.ceil((userRequests.resetTime - now) / 1000)
      });
    }
    
    userRequests.count++;
    next();
  };
};

// Middleware to log security events
const logSecurityEvent = (eventType) => {
  return (req, res, next) => {
    const originalSend = res.send;
    
    res.send = function(data) {
      // Log security-relevant events
      // if (res.statusCode >= 400) {
      //     type: eventType,
      //     user_id: req.user?.id,
      //     ip: req.ip,
      //     path: req.path,
      //     method: req.method,
      //     status_code: res.statusCode,
      //     timestamp: new Date().toISOString()
      //   });
      // }
      
      originalSend.call(this, data);
    };
    
    next();
  };
};

module.exports = {
  checkResourceOwnership,
  checkDealRoomAction,
  checkBuyerOnly,
  checkSellerOnly,
  checkNoDuplicateOrder,
  checkNoDuplicatePayment,
  checkOfferStatusForAcceptance,
  validatePaymentAmount,
  rateLimitSensitive,
  logSecurityEvent
};
