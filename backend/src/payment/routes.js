const express = require('express');
const router = express.Router();
const { 
  createPayment,
  getOrderPayments,
  getPayment,
  confirmPayment,
  refundPayment
} = require('./controller');
const { authenticateToken } = require('../middleware/auth');

// Create a new payment
router.post('/', authenticateToken, createPayment);

// Get payments for a specific order
router.get('/order/:orderId', authenticateToken, getOrderPayments);

// Get a specific payment by ID
router.get('/:id', authenticateToken, getPayment);

// Confirm payment (webhook endpoint)
router.post('/:id/confirm', confirmPayment);

// Refund payment
router.post('/:id/refund', authenticateToken, refundPayment);

module.exports = router;
