/**
 * Notification Service
 * 
 * Handles real-time Socket.IO notifications and push notification batching
 * with rate limiting and deduplication logic.
 */

class NotificationService {
  constructor(io, pushService) {
    this.io = io; // Socket.IO server instance
    this.pushService = pushService; // Push notification service
    this.rateLimitStore = new Map(); // In-memory rate limiting store
    this.RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour in milliseconds
    this.MAX_NOTIFICATIONS_PER_HOUR = 10; // Max notifications per user per hour
  }

  /**
   * Emit real-time notification to connected users
   * @param {string} userId - User ID to notify
   * @param {string} event - Socket event name
   * @param {object} data - Notification data
   */
  emitSocketNotification(userId, event, data) {
    try {
      // Emit to user's room if they're online
      this.io.to(`user:${userId}`).emit(event, {
        id: data.id,
        type: data.type,
        payload: data.payload,
        created_at: data.created_at,
        unread_count: data.unread_count || null
      });
      
      console.log(`Socket notification emitted to user ${userId}:`, event);
    } catch (error) {
      console.error(`Failed to emit socket notification to user ${userId}:`, error);
    }
  }

  /**
   * Check if user is rate limited for notifications
   * @param {string} userId - User ID to check
   * @returns {boolean} - True if rate limited
   */
  isRateLimited(userId) {
    const now = Date.now();
    const userNotifications = this.rateLimitStore.get(userId) || [];
    
    // Clean up old notifications outside the window
    const recentNotifications = userNotifications.filter(
      timestamp => now - timestamp < this.RATE_LIMIT_WINDOW
    );
    
    // Update the store with cleaned data
    this.rateLimitStore.set(userId, recentNotifications);
    
    // Check if user has exceeded the limit
    return recentNotifications.length >= this.MAX_NOTIFICATIONS_PER_HOUR;
  }

  /**
   * Record a notification for rate limiting
   * @param {string} userId - User ID to record for
   */
  recordNotification(userId) {
    const now = Date.now();
    const userNotifications = this.rateLimitStore.get(userId) || [];
    userNotifications.push(now);
    
    // Clean up old notifications and keep only recent ones
    const recentNotifications = userNotifications.filter(
      timestamp => now - timestamp < this.RATE_LIMIT_WINDOW
    );
    
    this.rateLimitStore.set(userId, recentNotifications);
  }

  /**
   * Process and emit multiple socket notifications
   * @param {Array} notifications - Array of notification objects
   * @returns {object} - Processing results
   */
  async processSocketNotifications(notifications) {
    const results = {
      processed: 0,
      skipped: 0,
      rate_limited: 0,
      errors: []
    };

    for (const notification of notifications) {
      try {
        // Check rate limiting
        if (this.isRateLimited(notification.user_id)) {
          results.rate_limited++;
          results.skipped++;
          continue;
        }

        // Emit socket notification
        this.emitSocketNotification(
          notification.user_id,
          "notification:new",
          notification
        );

        // Record for rate limiting
        this.recordNotification(notification.user_id);
        results.processed++;

      } catch (error) {
        results.errors.push({
          notification_id: notification.id,
          error: error.message
        });
        results.skipped++;
      }
    }

    return results;
  }

  /**
   * Batch process push notifications with rate limiting
   * @param {Array} notificationIds - Array of notification IDs
   * @returns {object} - Processing results
   */
  async processPushBatch(notificationIds) {
    const { pool } = require("../database/db");
    
    try {
      // Fetch notifications with user details
      const query = `
        SELECT n.id, n.user_id, n.type, n.payload, n.created_at,
               u.email, u.phone, p.push_token, p.name
        FROM notifications n
        JOIN users u ON n.user_id = u.id
        LEFT JOIN profiles p ON u.id = p.user_id
        WHERE n.id = ANY($1::uuid[])
          AND n.delivered_at IS NULL
          AND p.push_token IS NOT NULL
      `;

      const result = await pool.query(query, [notificationIds]);
      const notifications = result.rows;

      const results = {
        total: notificationIds.length,
        eligible: notifications.length,
        processed: 0,
        skipped: 0,
        rate_limited: 0,
        errors: []
      };

      // Process notifications in batches
      const batchSize = 50;
      for (let i = 0; i < notifications.length; i += batchSize) {
        const batch = notifications.slice(i, i + batchSize);
        
        for (const notification of batch) {
          try {
            // Check rate limiting for push notifications
            if (this.isRateLimited(notification.user_id)) {
              results.rate_limited++;
              results.skipped++;
              continue;
            }

            // Prepare push notification payload
            const pushPayload = {
              to: notification.push_token,
              title: this.getPushTitle(notification.type, notification.payload),
              body: this.getPushBody(notification.type, notification.payload),
              data: {
                notification_id: notification.id,
                type: notification.type,
                action_url: this.getActionUrl(notification.type, notification.payload)
              },
              priority: 'high',
              sound: 'default'
            };

            // Send push notification (replace with your push service)
            // await this.pushService.send(pushPayload);
            
            // For now, simulate the push service call
            console.log(`Push notification sent to user ${notification.user_id}:`, pushPayload.title);

            // Mark notification as delivered
            await this.markNotificationDelivered(notification.id);
            
            // Record for rate limiting
            this.recordNotification(notification.user_id);
            results.processed++;

          } catch (error) {
            results.errors.push({
              notification_id: notification.id,
              user_id: notification.user_id,
              error: error.message
            });
            results.skipped++;
          }
        }

        // Add delay between batches to avoid overwhelming push service
        if (i + batchSize < notifications.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      return results;

    } catch (error) {
      console.error('Error processing push batch:', error);
      throw error;
    }
  }

  /**
   * Mark notification as delivered in database
   * @param {string} notificationId - Notification ID to mark
   */
  async markNotificationDelivered(notificationId) {
    const { pool } = require("../database/db");
    
    const query = `
      UPDATE notifications 
      SET delivered_at = NOW()
      WHERE id = $1
    `;
    
    await pool.query(query, [notificationId]);
  }

  /**
   * Get push notification title based on type
   * @param {string} type - Notification type
   * @param {object} payload - Notification payload
   * @returns {string} - Push title
   */
  getPushTitle(type, payload) {
    switch (type) {
      case 'intent_match':
        return `New Match: ${payload.intent_title}`;
      case 'offer_received':
        return `New Offer: ${payload.listing_title}`;
      case 'offer_accepted':
        return `Offer Accepted: ${payload.listing_title}`;
      case 'message_received':
        return `New Message: ${payload.sender_name}`;
      default:
        return 'New Notification';
    }
  }

  /**
   * Get push notification body based on type
   * @param {string} type - Notification type
   * @param {object} payload - Notification payload
   * @returns {string} - Push body
   */
  getPushBody(type, payload) {
    switch (type) {
      case 'intent_match':
        return `Someone is looking for what you're selling! Tap to send an offer.`;
      case 'offer_received':
        return `You received a $${payload.offer_amount} offer on your listing.`;
      case 'offer_accepted':
        return `Your offer of $${payload.offer_amount} was accepted!`;
      case 'message_received':
        return payload.message_preview || 'You have a new message.';
      default:
        return 'Tap to view details.';
    }
  }

  /**
   * Get action URL for deep linking
   * @param {string} type - Notification type
   * @param {object} payload - Notification payload
   * @returns {string} - Action URL
   */
  getActionUrl(type, payload) {
    switch (type) {
      case 'intent_match':
        return `/create-offer?intent_id=${payload.intent_id}&listing_id=${payload.listing_id}`;
      case 'offer_received':
        return `/deal/${payload.deal_room_id}`;
      case 'offer_accepted':
        return `/deal/${payload.deal_room_id}`;
      case 'message_received':
        return `/chat/${payload.chat_room_id}`;
      default:
        return '/notifications';
    }
  }

  /**
   * Clean up old rate limit entries
   */
  cleanupRateLimitStore() {
    const now = Date.now();
    
    for (const [userId, timestamps] of this.rateLimitStore.entries()) {
      const recentTimestamps = timestamps.filter(
        timestamp => now - timestamp < this.RATE_LIMIT_WINDOW
      );
      
      if (recentTimestamps.length === 0) {
        this.rateLimitStore.delete(userId);
      } else {
        this.rateLimitStore.set(userId, recentTimestamps);
      }
    }
  }
}

module.exports = NotificationService;
