const { inngest } = require('../services/inngest');
const { pool } = require('../database/db');

// Cleanup job for abandoned deal rooms
const cleanupAbandonedDealRooms = inngest.createFunction(
  { id: 'cleanup-abandoned-deal-rooms' },
  { cron: '0 2 * * *' }, // Run daily at 2 AM
  async ({ step }) => {
    console.log('[CLEANUP] Starting abandoned deal rooms cleanup');
    
    // Find deal rooms that have been inactive for 30 days
    const abandonedDealRooms = await step.run('find-abandoned-deal-rooms', async () => {
      const query = `
        UPDATE deal_rooms 
        SET current_state = 'canceled', 
            updated_at = NOW(),
            metadata = metadata || $1
        WHERE current_state IN ('negotiation', 'offer_accepted')
        AND updated_at < NOW() - INTERVAL '30 days'
        AND id NOT IN (
          SELECT DISTINCT deal_room_id 
          FROM deal_events 
          WHERE created_at > NOW() - INTERVAL '30 days'
        )
        RETURNING id, current_state, metadata
      `;
      
      const result = await pool.query(query, [
        JSON.stringify({
          cleanup_reason: 'abandoned_after_30_days',
          cleanup_date: new Date().toISOString()
        })
      ]);
      
      return result.rows;
    });
    
    if (abandonedDealRooms.length > 0) {
      console.log(`[CLEANUP] Canceled ${abandonedDealRooms.length} abandoned deal rooms`);
      
      // Create deal events for cleanup
      await step.run('create-cleanup-events', async () => {
        for (const dealRoom of abandonedDealRooms) {
          await pool.query(
            `INSERT INTO deal_events (deal_room_id, type, payload, created_at)
             VALUES ($1, 'deal_room.canceled', $2, NOW())`,
            [
              dealRoom.id,
              JSON.stringify({
                reason: 'abandoned_after_30_days',
                previous_state: dealRoom.current_state,
                cleanup_date: new Date().toISOString()
              })
            ]
          );
        }
      });
    }
    
    return { cleaned_deal_rooms: abandonedDealRooms.length };
  }
);

// Cleanup job for old webhook events
const cleanupOldWebhookEvents = inngest.createFunction(
  { id: 'cleanup-old-webhook-events' },
  { cron: '0 3 * * *' }, // Run daily at 3 AM
  async ({ step }) => {
    console.log('[CLEANUP] Starting old webhook events cleanup');
    
    const deletedCount = await step.run('delete-old-webhook-events', async () => {
      const query = 'DELETE FROM processed_webhook_events WHERE processed_at < NOW() - INTERVAL \'7 days\'';
      const result = await pool.query(query);
      return result.rowCount;
    });
    
    console.log(`[CLEANUP] Deleted ${deletedCount} old webhook events`);
    
    return { deleted_webhook_events: deletedCount };
  }
);

// Cleanup job for expired payment intents
const cleanupExpiredPayments = inngest.createFunction(
  { id: 'cleanup-expired-payments' },
  { cron: '0 4 * * *' }, // Run daily at 4 AM
  async ({ step }) => {
    console.log('[CLEANUP] Starting expired payments cleanup');
    
    const expiredPayments = await step.run('find-expired-payments', async () => {
      const query = `
        UPDATE payments 
        SET status = 'expired', 
            updated_at = NOW(),
            metadata = metadata || $1
        WHERE status IN ('created', 'pending')
        AND created_at < NOW() - INTERVAL '30 days'
        RETURNING id, order_id, status
      `;
      
      const result = await pool.query(query, [
        JSON.stringify({
          cleanup_reason: 'expired_after_30_days',
          cleanup_date: new Date().toISOString()
        })
      ]);
      
      return result.rows;
    });
    
    if (expiredPayments.length > 0) {
      console.log(`[CLEANUP] Marked ${expiredPayments.length} payments as expired`);
      
      // Update corresponding orders
      await step.run('update-orders', async () => {
        for (const payment of expiredPayments) {
          await pool.query(
            'UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2',
            ['expired', payment.order_id]
          );
        }
      });
    }
    
    return { expired_payments: expiredPayments.length };
  }
);

module.exports = {
  cleanupAbandonedDealRooms,
  cleanupOldWebhookEvents,
  cleanupExpiredPayments
};
