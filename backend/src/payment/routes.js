const express = require("express");
const router = express.Router();
const { 
  createPayPalPaymentIntent,
  capturePayPalPayment,
  getPaymentsByOrder,
  getPaymentById,
  confirmPayment,
  refundPayment,
  getTransactions,
  moveToEscrow,
  releaseEscrow,
  updatePaymentTimeline
} = require('./controller');
const { handlePayPalWebhook } = require("./paypalWebhooks");
const { authenticate } = require("../../src/common/middleware/auth");
const {
  checkResourceOwnership,
  checkBuyerOnly,
  checkNoDuplicatePayment,
  validatePaymentAmount,
  rateLimitSensitive,
  logSecurityEvent,
} = require("../../src/common/middleware/securityGuards");

// Create a new PayPal payment order
router.post(
  "/order",
  authenticate,
  checkBuyerOnly(),
  checkNoDuplicatePayment,
  validatePaymentAmount,
  rateLimitSensitive(5, 60000),
  logSecurityEvent("payment_order_create"),
  createPayPalPaymentIntent
);

// Capture PayPal payment
router.post(
  "/capture",
  authenticate,
  rateLimitSensitive(5, 60000),
  logSecurityEvent("paypal_payment_capture"),
  capturePayPalPayment
);

// Get payments for a specific order
router.get("/order/:orderId", authenticate, getPaymentsByOrder);

// Get user's transactions
router.get("/transactions", authenticate, getTransactions);

// Get a specific payment by ID
router.get("/:id", authenticate, getPaymentById);

// PayPal webhook endpoint (no authentication required)
router.post("/webhook", handlePayPalWebhook);

// Confirm payment (webhook endpoint)
router.post("/:id/confirm", confirmPayment);

// Refund payment
router.post(
  "/:id/refund",
  authenticate,
  rateLimitSensitive(3, 60000),
  logSecurityEvent("payment_refund"),
  refundPayment
);

// Move payment to escrow
router.post(
  "/:id/escrow",
  authenticate,
  rateLimitSensitive(3, 60000),
  logSecurityEvent("payment_escrow"),
  moveToEscrow
);

// Release escrow funds
router.post(
  "/:id/release",
  authenticate,
  rateLimitSensitive(3, 60000),
  logSecurityEvent("payment_release"),
  releaseEscrow
);

// Update payment timeline
router.patch(
  "/:id/timeline",
  authenticate,
  rateLimitSensitive(5, 60000),
  logSecurityEvent("payment_timeline_update"),
  updatePaymentTimeline
);

module.exports = router;
