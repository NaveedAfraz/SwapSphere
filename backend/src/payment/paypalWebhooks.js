const { pool } = require('../database/db');
const { checkWebhookEventProcessed, markWebhookEventProcessed } = require('./webhookDeduplication');

// Initialize PayPal - check if available
let paypal;
try {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
  
  if (clientId && clientSecret) {
    const paypalSDK = require('@paypal/checkout-server-sdk');
    const environment = new paypalSDK.core.SandboxEnvironment(clientId, clientSecret);
    paypal = new paypalSDK.core.PayPalHttpClient(environment);
  } else {
    console.warn('[PAYPAL-WEBHOOKS] PayPal credentials not configured');
    paypal = null;
  }
} catch (error) {
  console.error('[PAYPAL-WEBHOOKS] Failed to initialize PayPal:', error.message);
  paypal = null;
}

// Verify PayPal webhook signature
const verifyPayPalWebhook = (req, res, next) => {
  // PayPal webhook verification - for now, just pass through
  // In production, you should implement proper webhook verification
  req.paypalEvent = req.body;
  next();
};

const handlePaymentCompleted = async (event) => {
  const payment = event.resource;

  // Check if this webhook event has already been processed
  const isProcessed = await checkWebhookEventProcessed(event.id);
  if (isProcessed) {
    return;
  }

  await pool.query('BEGIN');
  
  try {
    // Find payment record by PayPal payment ID
    const paymentQuery = `
      SELECT p.*, o.buyer_id, o.seller_id, o.metadata->>'offer_id' as offer_id,
             dr.id as deal_room_id
      FROM payments p
      JOIN orders o ON p.order_id = o.id
      LEFT JOIN deal_rooms dr ON o.metadata->>'offer_id' IN (
        SELECT id FROM offers WHERE deal_room_id = dr.id
      )
      WHERE p.provider_payment_id = $1
    `;
    
    const paymentResult = await pool.query(paymentQuery, [payment.id]);
    
    if (paymentResult.rows.length === 0) {
      throw new Error('Payment record not found for PayPal payment');
    }
    
    const dbPayment = paymentResult.rows[0];
    
    // Update payment status to completed
    const updatePaymentQuery = `
      UPDATE payments 
      SET status = 'completed', metadata = metadata || $2
      WHERE id = $1
    `;
    
    await pool.query(updatePaymentQuery, [
      dbPayment.id,
      JSON.stringify({
        paypal_payment_id: payment.id,
        paypal_order_id: payment.purchase_units[0]?.reference_id,
        paypal_event_id: event.id,
        received_at: new Date().toISOString()
      })
    ]);
    
    // Update order status to paid
    const updateOrderQuery = `
      UPDATE orders 
      SET status = 'paid', updated_at = NOW()
      WHERE id = $1
    `;
    
    await pool.query(updateOrderQuery, [dbPayment.order_id]);
    
    // Update deal room state to payment_completed
    if (dbPayment.deal_room_id) {
      const { handlePaymentAuthorized } = require('../dealRooms/stateTransitions');
      await handlePaymentAuthorized(dbPayment.deal_room_id, dbPayment.id);
      
      // Create deal event for payment completion
      const { createDealEvent } = require('../dealEvents/model');
      await createDealEvent(dbPayment.deal_room_id, 'payment.completed', {
        payment_id: dbPayment.id,
        paypal_payment_id: payment.id,
        paypal_order_id: payment.purchase_units[0]?.reference_id,
        order_id: dbPayment.order_id,
        offer_id: dbPayment.offer_id,
        amount: parseFloat(payment.purchase_units[0]?.amount?.value || 0)
      }, dbPayment.buyer_id);
      
      // Trigger Inngest automation workflow
      const { sendEvent } = require('../services/inngest');
      await sendEvent({
        name: 'payment/authorized',
        data: {
          payment_id: dbPayment.id,
          order_id: dbPayment.order_id,
          deal_room_id: dbPayment.deal_room_id,
          amount: parseFloat(payment.purchase_units[0]?.amount?.value || 0)
        }
      });
    }
    
    // Mark this webhook event as processed
    await markWebhookEventProcessed(event.id);
    
    await pool.query('COMMIT');
  
  } catch (error) {
    await pool.query('ROLLBACK');
    console.error('Error processing PayPal payment completion:', error);
    throw error;
  }
};

const handlePaymentFailed = async (event) => {
  const payment = event.resource;

  // Check if this webhook event has already been processed
  const isProcessed = await checkWebhookEventProcessed(event.id);
  if (isProcessed) {
    return;
  }

  await pool.query('BEGIN');
  
  try {
    // Find payment record
    const paymentQuery = `
      SELECT p.*, o.buyer_id, dr.id as deal_room_id
      FROM payments p
      JOIN orders o ON p.order_id = o.id
      LEFT JOIN deal_rooms dr ON o.metadata->>'offer_id' IN (
        SELECT id FROM offers WHERE deal_room_id = dr.id
      )
      WHERE p.provider_payment_id = $1
    `;
    
    const paymentResult = await pool.query(paymentQuery, [payment.id]);
    
    if (paymentResult.rows.length === 0) {
      throw new Error('Payment record not found for PayPal payment');
    }
    
    const dbPayment = paymentResult.rows[0];
    
    // Update payment status to failed
    const updatePaymentQuery = `
      UPDATE payments 
      SET status = 'failed', metadata = metadata || $2
      WHERE id = $1
    `;
    
    await pool.query(updatePaymentQuery, [
      dbPayment.id,
      JSON.stringify({
        paypal_payment_id: payment.id,
        paypal_order_id: payment.purchase_units[0]?.reference_id,
        paypal_event_id: event.id,
        failure_reason: payment.status_details || 'Unknown error',
        received_at: new Date().toISOString()
      })
    ]);
    
    // Update deal room state to payment_failed
    if (dbPayment.deal_room_id) {
      const { createDealEvent } = require('../dealEvents/model');
      await createDealEvent(dbPayment.deal_room_id, 'payment.failed', {
        payment_id: dbPayment.id,
        paypal_payment_id: payment.id,
        paypal_order_id: payment.purchase_units[0]?.reference_id,
        failure_reason: payment.status_details || 'Unknown error'
      }, dbPayment.buyer_id);
      
      // Update deal room state
      const { updateDealRoomState } = require('../dealRooms/stateTransitions');
      await updateDealRoomState(dbPayment.deal_room_id, 'payment_failed', dbPayment.buyer_id, {
        payment_id: dbPayment.id,
        failure_reason: payment.status_details
      });
    }
    
    // Mark this webhook event as processed
    await markWebhookEventProcessed(event.id);
    
    await pool.query('COMMIT');
    
 
  } catch (error) {
    await pool.query('ROLLBACK');
    console.error('Error processing PayPal payment failure:', error);
    throw error;
  }
};

// Main webhook handler
const handlePayPalWebhook = async (req, res) => {
  try {
    const event = req.paypalEvent;

    switch (event.event_type) {
      case 'PAYMENT.CAPTURE.COMPLETED':
        await handlePaymentCompleted(event);
        break;
      case 'PAYMENT.CAPTURE.DENIED':
        await handlePaymentFailed(event);
        break;
      default:
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Error handling PayPal webhook:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
};

module.exports = {
  verifyPayPalWebhook,
  handlePayPalWebhook,
  handlePaymentCompleted,
  handlePaymentFailed
};
