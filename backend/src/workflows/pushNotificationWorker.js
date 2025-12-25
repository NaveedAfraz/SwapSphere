const { inngest } = require("../services/inngest");
const NotificationService = require("../services/notificationService");

/**
 * Push Notification Batch Worker
 * 
 * This workflow processes undelivered notifications in batches,
 * applies rate limiting, and sends push notifications.
 */
const pushNotificationWorker = inngest.createFunction(
  { id: "push-notification-worker", name: "Push Notification Worker" },
  { event: "push.batch.process" },
  async ({ event, step }) => {
    const { notification_ids, batch_size, created_at } = event.data;

    // Initialize notification service (you'll need to inject your instances)
    // TODO: Replace with your actual Socket.IO and push service instances
    const notificationService = new NotificationService(
      null, // Socket.IO instance - replace with actual io
      null  // Push service - replace with actual push service
    );

    // Step 1: Validate batch data
    const validatedBatch = await step.run("validate-batch", async () => {
      if (!notification_ids || !Array.isArray(notification_ids) || notification_ids.length === 0) {
        throw new Error("Invalid notification IDs provided");
      }

      if (notification_ids.length !== batch_size) {
        console.warn(`Batch size mismatch: expected ${batch_size}, got ${notification_ids.length}`);
      }

      // Check if batch is too old (process within 5 minutes)
      const batchAge = Date.now() - new Date(created_at).getTime();
      if (batchAge > 5 * 60 * 1000) {
        console.warn(`Batch is ${Math.round(batchAge / 1000)}s old, processing anyway`);
      }

      return {
        notification_ids,
        batch_size: notification_ids.length,
        created_at
      };
    });

    // Step 2: Process push notifications with rate limiting
    const pushResults = await step.run("process-push-batch", async () => {
      try {
        const results = await notificationService.processPushBatch(validatedBatch.notification_ids);
        return results;
      } catch (error) {
        console.error("Push batch processing failed:", error);
        throw error;
      }
    });

    // Step 3: Log results and metrics
    await step.run("log-metrics", async () => {
      const metrics = {
        batch_id: `${validatedBatch.created_at}-${validatedBatch.batch_size}`,
        total_notifications: pushResults.total,
        eligible_for_push: pushResults.eligible,
        successfully_sent: pushResults.processed,
        skipped_rate_limited: pushResults.rate_limited,
        skipped_errors: pushResults.errors.length,
        error_rate: pushResults.errors.length / pushResults.total,
        processing_time_ms: Date.now() - new Date(created_at).getTime()
      };


      // TODO: You might want to store these metrics in your analytics system
      // await analytics.track("push_batch_processed", metrics);

      return metrics;
    });

    // Step 4: Handle failed notifications (retry logic)
    if (pushResults.errors.length > 0) {
      await step.run("handle-failures", async () => {
        const failedNotifications = pushResults.errors.map(error => ({
          notification_id: error.notification_id,
          user_id: error.user_id,
          error: error.error,
          retry_count: 0
        }));

        // TODO: You could implement retry logic here
        // For critical failures, you might want to:
        // 1. Store failed notifications in a retry queue
        // 2. Implement exponential backoff
        // 3. Alert on persistent failures

        return { failed_count: failedNotifications.length, failures: failedNotifications };
      });
    }

    return {
      success: true,
      batch_id: `${validatedBatch.created_at}-${validatedBatch.batch_size}`,
      processed: pushResults.processed,
      skipped: pushResults.skipped,
      rate_limited: pushResults.rate_limited,
      errors: pushResults.errors.length,
      metrics: {
        total_time_ms: Date.now() - new Date(created_at).getTime(),
        success_rate: pushResults.processed / pushResults.total
      }
    };
  }
);

/**
 * Cleanup Rate Limit Store (Scheduled Job)
 * 
 * This scheduled job runs periodically to clean up old rate limit entries
 * and prevent memory leaks.
 */
const cleanupRateLimits = inngest.createFunction(
  { id: "cleanup-rate-limits", name: "Cleanup Rate Limits" },
  { cron: "0 */6 * * *" }, // Every 6 hours
  async ({ step }) => {
    return await step.run("cleanup-rate-limit-store", async () => {
      const notificationService = new NotificationService(null, null);
      
      // Clean up old rate limit entries
      notificationService.cleanupRateLimitStore();
      
      
      return {
        cleaned_at: new Date().toISOString(),
        next_cleanup: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString()
      };
    });
  }
);

module.exports = { 
  pushNotificationWorker,
  cleanupRateLimits
};
