const { inngest } = require("../services/inngest");
const { pool } = require("../database/db");
const NotificationService = require("../services/notificationService");
const matchIntentService = require("../intents/matchIntentService");

/**
 * Intent Matching Workflow
 *
 * This workflow runs when an intent is created and:
 * 1. Matches the intent to eligible listings
 * 2. Creates notifications for sellers (deduplicated)
 * 3. Emits real-time Socket.IO events
 * 4. Enqueues push notifications in batches
 */
const intentMatchingWorkflow = inngest.createFunction(
  { id: "intent-matching-workflow", name: "Intent Matching Workflow" },
  { event: "intent.created" },
  async ({ event, step }) => {
    const { intentId } = event.data;

    // Step 1: Fetch intent details (including embedding and lat/lng)
    const intent = await step.run("fetch-intent", async () => {
      const query = `
        SELECT i.id,
               i.buyer_id,
               i.title,
               i.description,
               i.category,
               i.max_price,
               i.location as location_json,
               i.location->>'city'  as buyer_city,
               i.location->>'state' as buyer_state,
               i.latitude,
               i.longitude,
               i.embedding
        FROM intents i
        WHERE i.id = $1 AND i.status = 'open'
      `;

      const result = await pool.query(query, [intentId]);
      if (result.rows.length === 0) {
        throw new Error(`Intent ${intentId} not found or not open`);
      }

      const intentData = result.rows[0];

      // Fix: Parse embedding if it's a string
      let parsedEmbedding = intentData.embedding;
      if (
        typeof intentData.embedding === "string" &&
        intentData.embedding.startsWith("[")
      ) {
        try {
          parsedEmbedding = JSON.parse(intentData.embedding);
        } catch (parseError) {
          console.warn(
            "[WORKFLOW] Failed to parse embedding string:",
            parseError
          );
          parsedEmbedding = null;
        }
      }

      return {
        ...intentData,
        embedding: parsedEmbedding,
      };
    });
    

    // Step 2: Match listings using semantic + location + commitment scoring
    const matchedListings = await step.run("match-intent", async () => {
      try {
        const matches = await matchIntentService.matchIntent({
          intentId,
          intentEmbedding: intent.embedding,
          buyerId: intent.buyer_id,
          buyerLocation: {
            city: intent.buyer_city,
            state: intent.buyer_state,
            latitude: intent.latitude,
            longitude: intent.longitude,
          },
          maxPrice: intent.max_price,
          category: intent.category,
        });

        return matches;
      } catch (err) {
        console.error(
          `[WORKFLOW] matchIntentService failed for intent ${intentId}:`,
          err
        );
        return [];
      }
    });

    // Step 3: Create notifications for sellers (with deduplication)
    const notifications = await step.run("create-notifications", async () => {
      if (matchedListings.length === 0) {
        return { created: 0, notifications: [] };
      }

      // Prepare notification data for each matched listing
      const notificationData = matchedListings
        .map((listing) => {
          if (!listing.seller_user_id) {
            return null;
          }

          return {
            user_id: listing.seller_user_id,
            actor_id: intent.buyer_id,
            type: "intent_match",
            payload: {
              intent_id: intentId,
              listing_id: listing.listing_id,
              intent_title: intent.title,
              listing_title: listing.listing_title,
              buyer_max_price: intent.max_price,
              listing_price: listing.listing_price,
              category: intent.category,
              cta_text: "Send Offer",
              cta_action: "create_offer",
              cta_data: {
                intent_id: intentId,
                listing_id: listing.listing_id,
              },
            },
          };
        })
        .filter(Boolean); // Remove null entries

      if (notificationData.length === 0) {
        return { created: 0, notifications: [] };
      }

      // Log first notification for debugging

      // Use INSERT ... ON CONFLICT for deduplication
      const valuesClauses = notificationData
        .map(
          (notif, index) =>
            `($${index * 6 + 1}, $${index * 6 + 2}, $${index * 6 + 3}, $${
              index * 6 + 4
            }, $${index * 6 + 5}, $${index * 6 + 6})`
        )
        .join(", ");

      const params = notificationData.flatMap((notif) => [
        notif.user_id,
        notif.actor_id,
        notif.type,
        JSON.stringify(notif.payload),
        intentId,
        notif.payload.listing_id,
      ]);

      const insertQuery = `
        INSERT INTO notifications (user_id, actor_id, type, payload, intent_id, listing_id)
        VALUES ${valuesClauses}
        ON CONFLICT (intent_id, listing_id, user_id) 
        WHERE intent_id IS NOT NULL AND listing_id IS NOT NULL
        DO NOTHING
        RETURNING id, user_id, actor_id, type, payload, intent_id, listing_id, created_at
      `;

      const result = await pool.query(insertQuery, params);

      result.rows.forEach((notification) => {});

      return {
        created: result.rows.length,
        notifications: result.rows,
      };
    });

    // Step 4: Emit Socket.IO notifications to online sellers
    const socketResults = await step.run(
      "emit-socket-notifications",
      async () => {
        if (notifications.created === 0) {
          return { emitted: 0, rate_limited: 0 };
        }

        try {
          // Get Socket.IO instance from global or context
          const io = global.io || null;
          if (!io) {
            return { emitted: 0, rate_limited: 0 };
          }

          // Initialize notification service with actual Socket.IO instance
          const notificationService = new NotificationService(io, null);

          // Process socket notifications with rate limiting
          const results = await notificationService.processSocketNotifications(
            notifications.notifications
          );

          return {
            emitted: results.processed || 0,
            rate_limited: results.rate_limited || 0,
          };
        } catch (error) {
          console.error(`[WORKFLOW] Socket notification error:`, error);
          return { emitted: 0, rate_limited: 0 };
        }
      }
    );

    // Step 5: Enqueue push notification batch job
    const pushResults = await step.run("enqueue-push-batch", async () => {
      if (notifications.created === 0) {
        return { enqueued: 0 };
      }

      // Create a push batch job event
      const pushBatchData = {
        notification_ids: notifications.notifications.map((n) => n.id),
        batch_size: notifications.created,
        created_at: new Date().toISOString(),
      };

      // Send event to trigger push notification worker using step.sendEvent
      await step.sendEvent({ name: "push.batch.process", data: pushBatchData });

      return {
        enqueued: notifications.created,
        batch_data: pushBatchData,
      };
    });

    // Final workflow summary

    return {
      success: true,
      intent_id: intentId,
      matched_listings: matchedListings.length,
      notifications_created: notifications.created,
      socket_notifications_emitted: socketResults.emitted || 0,
      socket_rate_limited: socketResults.rate_limited || 0,
      push_batch_enqueued: pushResults.enqueued,
    };
  }
);

module.exports = { intentMatchingWorkflow };
