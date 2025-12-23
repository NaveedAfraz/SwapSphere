const { inngest } = require("../services/inngest");

/**
 * Auto Escrow Capture Workflow
 * 
 * This workflow automatically captures payment and completes orders
 * if the buyer doesn't confirm delivery within N days (3-5 days).
 */
const autoEscrowCaptureWorkflow = inngest.createFunction(
  { 
    id: "auto-escrow-capture-workflow", 
    name: "Auto Escrow Capture Workflow" 
  },
  { 
    event: "order.delivered" 
  },
  async ({ event, step }) => {
    const { orderId, buyerId, sellerId, orderData } = event.data;
    const WAIT_DAYS = 3; // Configurable: can be 3-5 days

    console.log(`[AUTO ESCROW] Starting auto-capture workflow for order: ${orderId}`);

    // Step 1: Wait for N days to give buyer time to confirm delivery
    const waitResult = await step.waitForEvent(
      "wait-for-delivery-confirmation",
      {
        event: "order.delivery_confirmed",
        timeout: `${WAIT_DAYS}d`, // Wait for N days
        if: `event.data.orderId == "${orderId}"`
      }
    );

    // If buyer confirmed delivery, cancel auto-capture
    if (waitResult) {
      console.log(`[AUTO ESCROW] Buyer confirmed delivery for order: ${orderId}, cancelling auto-capture`);
      return {
        success: true,
        action: "cancelled",
        reason: "buyer_confirmed_delivery",
        orderId,
        processedAt: new Date()
      };
    }

    // Step 2: Check if there are any disputes before capturing
    const disputeCheck = await step.run("check-for-disputes", async () => {
      const { pool } = require("../database/db");
      
      const disputeQuery = `
        SELECT id, status, created_at
        FROM disputes
        WHERE order_id = $1 AND status NOT IN ('resolved', 'dismissed')
        ORDER BY created_at DESC
        LIMIT 1
      `;
      
      const result = await pool.query(disputeQuery, [orderId]);
      
      if (result.rows.length > 0) {
        console.log(`[AUTO ESCROW] Active dispute found for order: ${orderId}, cancelling auto-capture`);
        return { 
          hasDispute: true, 
          dispute: result.rows[0] 
        };
      }
      
      return { hasDispute: false };
    });

    // If there's an active dispute, don't capture
    if (disputeCheck.hasDispute) {
      return {
        success: true,
        action: "cancelled",
        reason: "active_dispute",
        orderId,
        dispute: disputeCheck.dispute,
        processedAt: new Date()
      };
    }

    // Step 3: Get payment intent details
    const paymentDetails = await step.run("get-payment-details", async () => {
      const { pool } = require("../database/db");
      
      const paymentQuery = `
        SELECT payment_intent_id, provider_payment_id, amount, currency
        FROM payments
        WHERE order_id = $1 AND status = 'escrowed'
        ORDER BY created_at DESC
        LIMIT 1
      `;
      
      const result = await pool.query(paymentQuery, [orderId]);
      
      if (result.rows.length === 0) {
        throw new Error(`No escrowed payment found for order: ${orderId}`);
      }
      
      return result.rows[0];
    });

    // Step 4: Capture payment via Stripe
    const captureResult = await step.run("capture-payment", async () => {
      try {
        const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
        
        const capture = await stripe.paymentIntents.capture(
          paymentDetails.payment_intent_id
        );
        
        console.log(`[AUTO ESCROW] Payment captured for order: ${orderId}, Intent: ${paymentDetails.payment_intent_id}`);
        
        return { 
          success: true, 
          captureId: capture.id,
          amount: capture.amount,
          currency: capture.currency
        };
      } catch (error) {
        console.error(`[AUTO ESCROW] Failed to capture payment for order: ${orderId}`, error);
        throw new Error(`Payment capture failed: ${error.message}`);
      }
    });

    // Step 5: Update database records
    const updateResult = await step.run("update-database", async () => {
      const { pool } = require("../database/db");
      
      await pool.query('BEGIN');
      
      try {
        // Update payments status
        const paymentUpdate = await pool.query(`
          UPDATE payments 
          SET status = 'captured', updated_at = NOW()
          WHERE order_id = $1 AND payment_intent_id = $2
          RETURNING *
        `, [orderId, paymentDetails.payment_intent_id]);
        
        // Update orders status
        const orderUpdate = await pool.query(`
          UPDATE orders 
          SET status = 'completed', updated_at = NOW()
          WHERE id = $1
          RETURNING *
        `, [orderId]);
        
        // Update deal_rooms status
        const dealRoomUpdate = await pool.query(`
          UPDATE deal_rooms 
          SET current_state = 'completed', updated_at = NOW()
          WHERE id = (
            SELECT id FROM deal_rooms 
            WHERE intent_id = (
              SELECT intent_id FROM orders WHERE id = $1
            )
          )
          RETURNING *
        `, [orderId]);
        
        // Insert payment.captured event
        const paymentEvent = await pool.query(`
          INSERT INTO deal_events (event_type, actor_id, payload, created_at)
          VALUES ('payment.captured', $1, $2, NOW())
          RETURNING *
        `, [
          sellerId,
          JSON.stringify({
            orderId,
            paymentIntentId: paymentDetails.payment_intent_id,
            amount: paymentDetails.amount,
            capturedBy: 'auto_escrow'
          })
        ]);
        
        // Insert order.completed event
        const orderEvent = await pool.query(`
          INSERT INTO deal_events (event_type, actor_id, payload, created_at)
          VALUES ('order.completed', $1, $2, NOW())
          RETURNING *
        `, [
          sellerId,
          JSON.stringify({
            orderId,
            completedBy: 'auto_escrow',
            autoCapture: true,
            waitDays: WAIT_DAYS
          })
        ]);
        
        await pool.query('COMMIT');
        
        console.log(`[AUTO ESCROW] Database updated for order: ${orderId}`);
        
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
        await notificationService.sendNotification(sellerId, {
          type: 'payment_captured',
          title: 'Payment Captured Automatically',
          message: 'Payment for your order has been automatically captured and released to your account.',
          data: {
            orderId,
            amount: paymentDetails.amount,
            autoCapture: true
          }
        });
        
        // Notify buyer that order was completed
        await notificationService.sendNotification(buyerId, {
          type: 'order_completed',
          title: 'Order Automatically Completed',
          message: 'Your order has been automatically completed since delivery was not confirmed within the timeframe.',
          data: {
            orderId,
            autoCapture: true,
            waitDays: WAIT_DAYS
          }
        });
        
        console.log(`[AUTO ESCROW] Notifications sent for order: ${orderId}`);
        
        return { success: true };
      } catch (error) {
        console.error(`[AUTO ESCROW] Failed to send notifications for order: ${orderId}`, error);
        return { success: false, error: error.message };
      }
    });

    return {
      success: true,
      action: "captured",
      orderId,
      paymentIntentId: paymentDetails.payment_intent_id,
      amount: paymentDetails.amount,
      processedAt: new Date(),
      waitDays: WAIT_DAYS,
      autoCapture: true
    };
  }
);

module.exports = {
  autoEscrowCaptureWorkflow
};
