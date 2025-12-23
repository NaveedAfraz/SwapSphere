const { inngest } = require("../services/inngest");
const NotificationService = require("../services/notificationService");

/**
 * Delivery Notification Workflow
 * 
 * This workflow sends notifications to buyers when their orders are marked as delivered.
 */
const deliveryNotificationWorkflow = inngest.createFunction(
  { id: "delivery-notification-workflow", name: "Delivery Notification Workflow" },
  { event: "order.delivered" },
  async ({ event, step }) => {
    const { orderId, buyerId, sellerId, orderData } = event.data;

    console.log(`[DELIVERY NOTIFICATION] Processing delivery notification for order: ${orderId}`);

    // Step 1: Fetch buyer and seller details
    const userDetails = await step.run("fetch-user-details", async () => {
      const { pool } = require("../database/db");
      
      // Get buyer details
      const buyerQuery = `
        SELECT u.id, u.email, u.username, p.avatar_key, p.notification_preferences
        FROM users u
        LEFT JOIN profiles p ON u.id = p.user_id
        WHERE u.id = $1
      `;
      
      const buyerResult = await pool.query(buyerQuery, [buyerId]);
      
      if (buyerResult.rows.length === 0) {
        throw new Error(`Buyer not found: ${buyerId}`);
      }
      
      // Get seller details
      const sellerQuery = `
        SELECT u.id, u.email, u.username, p.avatar_key
        FROM users u
        LEFT JOIN sellers s ON u.id = s.user_id
        LEFT JOIN profiles p ON u.id = p.user_id
        WHERE s.id = $1
      `;
      
      const sellerResult = await pool.query(sellerQuery, [sellerId]);
      
      if (sellerResult.rows.length === 0) {
        throw new Error(`Seller not found: ${sellerId}`);
      }
      
      return {
        buyer: buyerResult.rows[0],
        seller: sellerResult.rows[0]
      };
    });

    // Step 2: Create notification record
    const notificationRecord = await step.run("create-notification", async () => {
      const { pool } = require("../database/db");
      
      const notificationQuery = `
        INSERT INTO notifications (
          user_id, 
          type, 
          title, 
          message, 
          data, 
          is_read, 
          created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `;
      
      const notificationData = {
        orderId,
        sellerName: userDetails.seller.username,
        orderData
      };
      
      const result = await pool.query(notificationQuery, [
        buyerId,
        'order_delivered',
        'Order Delivered',
        `Your order has been marked as delivered by ${userDetails.seller.username}`,
        JSON.stringify(notificationData),
        false,
        new Date()
      ]);
      
      return result.rows[0];
    });

    // Step 3: Send push notification
    const pushResult = await step.run("send-push-notification", async () => {
      try {
        const notificationService = new NotificationService(
          global.io, // Socket.IO instance
          null // Push service - add your push service here
        );
        
        await notificationService.sendNotification(userDetails.buyer.id, {
          type: 'order_delivered',
          title: 'Order Delivered',
          message: `Your order has been marked as delivered by ${userDetails.seller.username}`,
          data: {
            orderId,
            notificationId: notificationRecord.id
          }
        });
        
        console.log(`[DELIVERY NOTIFICATION] Push notification sent to buyer: ${buyerId}`);
        
        return { success: true, sentAt: new Date() };
      } catch (error) {
        console.error('[DELIVERY NOTIFICATION] Failed to send push notification:', error);
        return { success: false, error: error.message };
      }
    });

    // Step 4: Update notification status
    await step.run("update-notification-status", async () => {
      const { pool } = require("../database/db");
      
      const updateQuery = `
        UPDATE notifications 
        SET delivered_at = $1, delivery_status = $2
        WHERE id = $3
      `;
      
      await pool.query(updateQuery, [
        new Date(),
        pushResult.success ? 'delivered' : 'failed',
        notificationRecord.id
      ]);
      
      return { notificationId: notificationRecord.id, status: pushResult.success ? 'delivered' : 'failed' };
    });

    return {
      success: true,
      orderId,
      buyerId,
      notificationId: notificationRecord.id,
      pushNotificationSent: pushResult.success,
      processedAt: new Date()
    };
  }
);

module.exports = {
  deliveryNotificationWorkflow
};
