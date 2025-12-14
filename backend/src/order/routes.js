const express = require('express');
const router = express.Router();
const { 
  createOrder,
  getBuyerOrders,
  getSellerOrders,
  getOrder,
  updateStatus,
  getOrderItems,
  cancelOrder
} = require('./controller');
const { authenticate } = require('../../src/common/middleware/auth');

// Create a new order
router.post('/', authenticate, createOrder);

// Get current user's buyer orders
router.get('/buyer', authenticate, getBuyerOrders);

// Get current user's seller orders
router.get('/seller', authenticate, getSellerOrders);

// Get a specific order by ID
router.get('/:id', authenticate, getOrder);

// Update order status
router.put('/:id/status', authenticate, updateStatus);

// Get order items
router.get('/:id/items', authenticate, getOrderItems);

// Cancel order
router.post('/:id/cancel', authenticate, cancelOrder);

module.exports = router;
