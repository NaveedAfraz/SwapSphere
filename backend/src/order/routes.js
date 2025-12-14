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
const { authenticateToken } = require('../middleware/auth');

// Create a new order
router.post('/', authenticateToken, createOrder);

// Get current user's buyer orders
router.get('/buyer', authenticateToken, getBuyerOrders);

// Get current user's seller orders
router.get('/seller', authenticateToken, getSellerOrders);

// Get a specific order by ID
router.get('/:id', authenticateToken, getOrder);

// Update order status
router.put('/:id/status', authenticateToken, updateStatus);

// Get order items
router.get('/:id/items', authenticateToken, getOrderItems);

// Cancel order
router.post('/:id/cancel', authenticateToken, cancelOrder);

module.exports = router;
