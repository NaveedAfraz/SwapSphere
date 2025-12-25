const { inngest } = require('../services/inngest');
const { pool } = require('../database/db');
const { addBusinessDays } = require('../utils/businessDays');

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
    console.warn('[PAYMENT-AUTOMATION] PayPal credentials not configured');
    paypal = null;
  }
} catch (error) {
  console.warn('[PAYMENT-AUTOMATION] PayPal not available:', error.message);
  paypal = null;
}

// Constants for delivery waiting period (in business days)
const DELIVERY_WAIT_BUSINESS_DAYS = 7; // Wait 7 business days for delivery before auto-capture
const DISPUTE_WINDOW_DAYS = 2; // 2-day window for disputes after delivery confirmation

// Workflow to auto-capture payment after delivery period
const autoCapturePayment = inngest.createFunction(
  { id: 'auto-capture-payment' },
  { event: 'payment/authorized' },
  async ({ event, step }) => {
    const { payment_id, order_id, deal_room_id, amount } = event.data;


    // Wait for delivery period using business days
    const captureDate = addBusinessDays(new Date(), DELIVERY_WAIT_BUSINESS_DAYS);
    const delayMs = captureDate.getTime() - Date.now();
    
    if (delayMs > 0) {
      await step.sleep('wait-for-delivery', delayMs);
    }

    // Check if payment is still authorized and not disputed
    const { payment, order, dealRoom } = await step.run('check-payment-status', async () => {
      const query = `
        SELECT p.*, o.status as order_status, dr.current_state as deal_room_state
        FROM payments p
        JOIN orders o ON p.order_id = o.id
        LEFT JOIN deal_rooms dr ON o.metadata->>'offer_id' IN (
          SELECT id FROM offers WHERE deal_room_id = dr.id
        )
        WHERE p.id = $1
      `;
      
      const result = await pool.query(query, [payment_id]);
      
      if (result.rows.length === 0) {
        throw new Error('Payment not found');
      }
      
      return result.rows[0];
    });

    // Verify payment is still authorized and no disputes exist
    if (payment.status !== 'succeeded' || order.status !== 'paid') {
        payment_status: payment.status,
        order_status: order.status
      });
      return { status: 'skipped', reason: 'Payment status changed' };
    }

    // Check for any active disputes
    const hasDisputes = await step.run('check-disputes', async () => {
      const query = `
        SELECT 1 FROM deal_events 
        WHERE deal_room_id = $1 
        AND type IN ('dispute.opened', 'dispute.created')
        AND created_at > NOW() - INTERVAL '${DISPUTE_WINDOW_DAYS} days'
        LIMIT 1
      `;
      
      const result = await pool.query(query, [deal_room_id]);
      return result.rows.length > 0;
    });

    if (hasDisputes) {
      return { status: 'skipped', reason: 'Active dispute' };
    }

    // Capture the payment via PayPal
    const captureResult = await step.run('capture-paypal-payment', async () => {
      try {
        // Get PayPal payment ID from payment metadata
        const paymentQuery = 'SELECT provider_payment_id FROM payments WHERE id = $1';
        const paymentResult = await pool.query(paymentQuery, [payment_id]);
        
        if (paymentResult.rows.length === 0) {
          throw new Error('Payment not found');
        }
        
        const paypalPaymentId = paymentResult.rows[0].provider_payment_id;
        
        if (!paypalPaymentId) {
          throw new Error('PayPal payment ID not found');
        }
        
        if (!paypal) {
          throw new Error('PayPal SDK not available');
        }
        
        // Capture payment using PayPal
        const paypalSDK = require('@paypal/checkout-server-sdk');
        const request = new paypalSDK.payments.CapturesCaptureRequest(paypalPaymentId);
        
        const capture = await paypal.execute(request);
        return capture.result;
      } catch (error) {
        console.error('[AUTO-CAPTURE] Failed to capture PayPal payment:', error);
        throw new Error(`PayPal capture failed: ${error.message}`);
      }
    });

    // Update database records
    await step.run('update-database', async () => {
      await pool.query('BEGIN');

      try {
        // Update payment status to captured
        await pool.query(
          'UPDATE payments SET status = $1, metadata = metadata || $2 WHERE id = $3',
          [
            'captured',
            JSON.stringify({
              captured_at: new Date().toISOString(),
              captured_by: 'automation',
              paypal_capture_id: captureResult.id
            }),
            payment_id
          ]
        );

        // Update order status to completed
        await pool.query(
          'UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2',
          ['completed', order_id]
        );

        // Update deal room state to completed
        if (deal_room_id) {
          await pool.query(
            'UPDATE deal_rooms SET current_state = $1, updated_at = NOW() WHERE id = $2',
            ['completed', deal_room_id]
          );

          // Create deal event for payment capture
          const { createDealEvent } = require('../dealEvents/model');
          await createDealEvent(deal_room_id, 'payment.captured', {
            payment_id,
            order_id,
            amount,
            captured_at: new Date().toISOString(),
            captured_by: 'automation'
          }, null); // System event, no user actor
        }

        await pool.query('COMMIT');

      } catch (error) {
        await pool.query('ROLLBACK');
        throw error;
      }
    });

    // Send notifications
    await step.run('send-notifications', async () => {
      const { sendEvent } = require('../services/inngest');
      
      // Notify seller that payment has been captured
      await sendEvent({
        name: 'notification/send',
        data: {
          type: 'payment_captured',
          recipient_type: 'seller',
          order_id,
          payment_id,
          amount,
          captured_at: new Date().toISOString()
        }
      });

      // Notify buyer that payment has been released to seller
      await sendEvent({
        name: 'notification/send',
        data: {
          type: 'payment_released',
          recipient_type: 'buyer',
          order_id,
          payment_id,
          amount,
          released_at: new Date().toISOString()
        }
      });
    });

    return {
      status: 'completed',
      payment_id,
      order_id,
      captured_at: new Date().toISOString()
    };
  }
);

// Workflow to handle payment failures and retries
const handlePaymentFailure = inngest.createFunction(
  { id: 'handle-payment-failure' },
  { event: 'payment/failed' },
  async ({ event, step }) => {
    const { payment_id, order_id, deal_room_id, failure_reason } = event.data;


    // Wait a short delay before processing
    await step.sleep('processing-delay', '5m');

    // Update order status back to pending
    await step.run('update-order-status', async () => {
      await pool.query('BEGIN');

      try {
        // Update order status to pending (allow retry)
        await pool.query(
          'UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2',
          ['pending', order_id]
        );

        // Update deal room state back to payment_pending
        if (deal_room_id) {
          await pool.query(
            'UPDATE deal_rooms SET current_state = $1, updated_at = NOW() WHERE id = $2',
            ['payment_pending', deal_room_id]
          );

          // Create deal event for payment failure
          const { createDealEvent } = require('../dealEvents/model');
          await createDealEvent(deal_room_id, 'payment.failed.retry', {
            payment_id,
            order_id,
            failure_reason,
            retry_available: true
          }, null);
        }

        await pool.query('COMMIT');

      } catch (error) {
        await pool.query('ROLLBACK');
        throw error;
      }
    });

    // Send notification to buyer about payment failure
    await step.run('notify-buyer', async () => {
      const { sendEvent } = require('../services/inngest');
      
      await sendEvent({
        name: 'notification/send',
        data: {
          type: 'payment_failed',
          recipient_type: 'buyer',
          order_id,
          payment_id,
          failure_reason,
          can_retry: true
        }
      });
    });

    return {
      status: 'processed',
      payment_id,
      order_id,
      retry_available: true
    };
  }
);

// Workflow to handle order completion and reviews
const handleOrderCompletion = inngest.createFunction(
  { id: 'handle-order-completion' },
  { event: 'payment/captured' },
  async ({ event, step }) => {
    const { payment_id, order_id, deal_room_id, amount } = event.data;


    // Wait a brief period before triggering review requests
    await step.sleep('review-delay', '1h');

    // Get order details for notifications
    const orderDetails = await step.run('get-order-details', async () => {
      const query = `
        SELECT o.*, u_buyer.email as buyer_email, u_seller.email as seller_email,
               l.title as listing_title
        FROM orders o
        JOIN users u_buyer ON o.buyer_id = u_buyer.id
        JOIN sellers s ON o.seller_id = s.id
        JOIN users u_seller ON s.user_id = u_seller.id
        LEFT JOIN listings l ON o.metadata->>'listing_id' = l.id
        WHERE o.id = $1
      `;
      
      const result = await pool.query(query, [order_id]);
      return result.rows[0];
    });

    // Send review requests to both buyer and seller
    await step.run('request-reviews', async () => {
      const { sendEvent } = require('../services/inngest');
      
      // Request review from buyer
      await sendEvent({
        name: 'notification/send',
        data: {
          type: 'review_request',
          recipient_type: 'buyer',
          order_id,
          payment_id,
          listing_title: orderDetails.listing_title,
          seller_email: orderDetails.seller_email
        }
      });

      // Request review from seller
      await sendEvent({
        name: 'notification/send',
        data: {
          type: 'review_request',
          recipient_type: 'seller',
          order_id,
          payment_id,
          listing_title: orderDetails.listing_title,
          buyer_email: orderDetails.buyer_email
        }
      });
    });

    return {
      status: 'completed',
      order_id,
      reviews_requested: true
    };
  }
);

module.exports = {
  autoCapturePayment,
  handlePaymentFailure,
  handleOrderCompletion
};
