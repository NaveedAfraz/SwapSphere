const { pool } = require('../database/db');

// Store processed webhook events to prevent duplicates
const checkWebhookEventProcessed = async (eventId) => {
  const query = 'SELECT 1 FROM processed_webhook_events WHERE event_id = $1';
  const result = await pool.query(query, [eventId]);
  return result.rows.length > 0;
};

const markWebhookEventProcessed = async (eventId) => {
  const query = `
    INSERT INTO processed_webhook_events (event_id, processed_at)
    VALUES ($1, NOW())
    ON CONFLICT (event_id) DO NOTHING
  `;
  await pool.query(query, [eventId]);
};

// Clean up old webhook events (keep last 7 days)
const cleanupOldWebhookEvents = async () => {
  const query = 'DELETE FROM processed_webhook_events WHERE processed_at < NOW() - INTERVAL \'7 days\'';
  await pool.query(query);
};

module.exports = {
  checkWebhookEventProcessed,
  markWebhookEventProcessed,
  cleanupOldWebhookEvents
};
