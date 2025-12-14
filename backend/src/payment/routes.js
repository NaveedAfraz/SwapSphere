const express = require('express');
const router = express.Router();
const { 
  createPayment,
  getOrderPayments,
  getPayment,
  confirmPayment,
  refundPayment
} = require('./controller');
const { authenticate } = require('../../src/common/middleware/auth');

// Create a new payment
router.post('/', authenticate, createPayment);

// Get payments for a specific order
router.get('/order/:orderId', authenticate, getOrderPayments);

// Get a specific payment by ID
router.get('/:id', authenticate, getPayment);

// Confirm payment (webhook endpoint)
router.post('/:id/confirm', confirmPayment);

// Refund payment
router.post('/:id/refund', authenticate, refundPayment);

module.exports = router;
