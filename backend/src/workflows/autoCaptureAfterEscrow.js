const { inngest } = require("../services/inngest");

/**
 * Auto Capture After Escrow Workflow
 * 
 * This workflow automatically captures escrowed payments after N days
 * if the order status is still 'paid' and there are no disputes.
 */
const autoCaptureAfterEscrow = inngest.createFunction(
  { 
    id: "auto-capture-after-escrow", 
    name: "Auto Capture After Escrow" 
  },
  { 
    event: "deal.payment.authorized" 
  },
  async ({ event, step }) => {
    const { dealRoomId, orderId, paymentIntentId } = event.data;
    const WAIT_DAYS = 3; // Configurable: can be 3-5 days


    // Step 1: Wait for N days to allow for disputes and delivery confirmation
    await step.sleep("wait-period", `${WAIT_DAYS}d`);

    // Step 2: Fetch order from DB to check current status
    const orderCheck = await step.run("check-order-status", async () => {
      const { pool } = require("../database/db");
      
      const orderQuery = `
        SELECT o.*, dr.current_state as deal_room_state
        FROM orders o
        LEFT JOIN deal_rooms dr ON o.metadata->>'intent_id' = dr.intent_id
        WHERE o.id = $1
      `;
      
      const result = await pool.query(orderQuery, [orderId]);
      
      if (result.rows.length === 0) {
        throw new Error(`Order not found: ${orderId}`);
      }
      
      return result.rows[0];
    });

    // Step 3: Check if order is still in a state that allows auto-capture
    const eligibilityCheck = await step.run("check-eligibility", async () => {
      const { pool } = require("../database/db");
      
      // Check if order status is still 'paid' (not completed/cancelled)
      if (orderCheck.status !== 'paid') {
        return { 
          eligible: false, 
          reason: 'order_not_paid',
          currentStatus: orderCheck.status 
        };
      }
      
      // Check for active disputes
      const disputeQuery = `
        SELECT id, status, created_at
        FROM disputes
        WHERE order_id = $1 AND status NOT IN ('resolved', 'dismissed')
        ORDER BY created_at DESC
        LIMIT 1
      `;
      
      const disputeResult = await pool.query(disputeQuery, [orderId]);
      
      if (disputeResult.rows.length > 0) {
        return { 
          eligible: false, 
          reason: 'active_dispute',
          dispute: disputeResult.rows[0] 
        };
      }
      
      // Check if payment is still escrowed
      const paymentQuery = `
        SELECT id, status, provider_payment_id, amount, currency
        FROM payments
        WHERE order_id = $1 AND status = 'escrowed'
        ORDER BY created_at DESC
        LIMIT 1
      `;
      
      const paymentResult = await pool.query(paymentQuery, [orderId]);
      
      if (paymentResult.rows.length === 0) {
        return { 
          eligible: false, 
          reason: 'no_escrowed_payment' 
        };
      }
      
      return { 
        eligible: true, 
        payment: paymentResult.rows[0] 
      };
    });

    // If not eligible, exit gracefully
    if (!eligibilityCheck.eligible) {
      return {
        success: true,
        action: "skipped",
        reason: eligibilityCheck.reason,
        orderId,
        processedAt: new Date()
      };
    }

    // Step 4: Capture Stripe PaymentIntent
    const captureResult = await step.run("capture-payment", async () => {
      try {
        const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
        
        const capture = await stripe.paymentIntents.capture(
          eligibilityCheck.payment.provider_payment_id
        );
        
        
        return { 
          success: true, 
          captureId: capture.id,
          amount: capture.amount,
          currency: capture.currency
        };
      } catch (error) {
        console.error(`[AUTO CAPTURE] Failed to capture payment for order: ${orderId}`, error);
        throw new Error(`Payment capture failed: ${error.message}`);
      }
    });

    // Step 5: Update database records atomically
    const updateResult = await step.run("update-database", async () => {
      const { pool } = require("../database/db");
      
      await pool.query('BEGIN');
      
      try {
        // Update payments status to 'captured'
        const paymentUpdate = await pool.query(`
          UPDATE payments 
          SET status = 'captured', updated_at = NOW()
          WHERE id = $1
          RETURNING *
        `, [eligibilityCheck.payment.id]);
        
        // Update orders status to 'completed'
        const orderUpdate = await pool.query(`
          UPDATE orders 
          SET status = 'completed', updated_at = NOW()
          WHERE id = $1
          RETURNING *
        `, [orderId]);
        
        // Update deal_rooms status to 'completed'
        const dealRoomUpdate = await pool.query(`
          UPDATE deal_rooms 
          SET current_state = 'completed', updated_at = NOW()
          WHERE id = $1
          RETURNING *
        `, [dealRoomId]);
        
        // Insert payment.captured event
        const paymentEvent = await pool.query(`
          INSERT INTO deal_events (event_type, actor_id, payload, created_at)
          VALUES ('payment.captured', $1, $2, NOW())
          RETURNING *
        `, [
          orderCheck.seller_id,
          JSON.stringify({
            orderId,
            paymentIntentId: eligibilityCheck.payment.provider_payment_id,
            amount: eligibilityCheck.payment.amount,
            capturedBy: 'auto_capture',
            waitDays: WAIT_DAYS
          })
        ]);
        
        // Insert order.completed event
        const orderEvent = await pool.query(`
          INSERT INTO deal_events (event_type, actor_id, payload, created_at)
          VALUES ('order.completed', $1, $2, NOW())
          RETURNING *
        `, [
          orderCheck.seller_id,
          JSON.stringify({
            orderId,
            completedBy: 'auto_capture',
            autoCapture: true,
            waitDays: WAIT_DAYS
          })
        ]);
        
        await pool.query('COMMIT');
        
        
        return {
          paymentUpdated: paymentUpdate.rows[0],
          orderUpdated: orderUpdate.rows[0],
          dealRoomUpdated: dealRoomUpdate.rows[0],
          paymentEvent: paymentEvent.rows[0],
          orderEvent: orderEvent.rows[0]
        };
        
      } catch (error) {
        await pool.query('ROLLBACK');
        throw error;
      }
    });

    // Step 6: Send notifications
    await step.run("send-notifications", async () => {
      const NotificationService = require("../services/notificationService");
      
      try {
        const notificationService = new NotificationService(
          global.io, // Socket.IO instance
          null // Push service - add your push service here
        );
        
        // Notify seller that payment was captured
        await notificationService.sendNotification(orderCheck.seller_id, {
          type: 'payment_captured',
          title: 'Payment Captured Automatically',
          message: 'Payment for your order has been automatically captured and released to your account.',
          data: {
            orderId,
            amount: eligibilityCheck.payment.amount,
            autoCapture: true
          }
        });
        
        // Notify buyer that order was completed
        await notificationService.sendNotification(orderCheck.buyer_id, {
          type: 'order_completed',
          title: 'Order Automatically Completed',
          message: 'Your order has been automatically completed after the escrow period.',
          data: {
            orderId,
            autoCapture: true,
            waitDays: WAIT_DAYS
          }
        });
        
        
        return { success: true };
      } catch (error) {
        console.error(`[AUTO CAPTURE] Failed to send notifications for order: ${orderId}`, error);
        return { success: false, error: error.message };
      }
    });

    return {
      success: true,
      action: "captured",
      orderId,
      paymentIntentId: eligibilityCheck.payment.provider_payment_id,
      amount: eligibilityCheck.payment.amount,
      processedAt: new Date(),
      waitDays: WAIT_DAYS,
      autoCapture: true
    };
  }
);

module.exports = {
  autoCaptureAfterEscrow
};
