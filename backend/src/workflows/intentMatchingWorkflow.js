const { inngest } = require("../services/inngest");
const { pool } = require("../database/db");
const NotificationService = require("../services/notificationService");

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
    console.log("[WORKFLOW] Intent matching workflow triggered!");
    console.log("[WORKFLOW] Event data:", JSON.stringify(event, null, 2));
    
    const { intentId } = event.data;

    // Step 1: Fetch intent details 
    const intent = await step.run("fetch-intent", async () => {
      console.log(`[WORKFLOW] Fetching intent details for: ${intentId}`);
      
      const query = `
        SELECT i.id, i.buyer_id, i.title, i.description, i.category, 
               i.max_price, 
               i.location as location_json,
               i.location->>'city' as buyer_city, i.location->>'state' as buyer_state
        FROM intents i
        WHERE i.id = $1 AND i.status = 'open'
      `;
      
      const result = await pool.query(query, [intentId]);
      if (result.rows.length === 0) {
        console.log(`[WORKFLOW] Intent ${intentId} not found or not open`);
        throw new Error(`Intent ${intentId} not found or not open`);
      }
      
      const intentData = result.rows[0];
      console.log(`[WORKFLOW] Raw location JSON: ${JSON.stringify(intentData.location_json)}`);
      console.log(`[WORKFLOW] Extracted buyer_city: "${intentData.buyer_city}", buyer_state: "${intentData.buyer_state}"`);
      console.log(`[WORKFLOW] Intent found: ${intentData.title}, category: ${intentData.category}, max_price: ${intentData.max_price}`);
      return intentData;
    });

    // Step 2: Find matching listings
    const matchedListings = await step.run("find-matching-listings", async () => {
      console.log(`[WORKFLOW] Finding matching listings for intent: ${intentId}`);
      
      // Debug: Check what listings exist before running the main query
      const debugQuery = `
        SELECT 
          l.id,
          l.title,
          l.category,
          l.price,
          l.intent_eligible,
          l.is_published,
          l.deleted_at,
          l.location->>'city' as listing_city,
          l.location->>'state' as listing_state,
          s.user_id as seller_user_id
        FROM listings l
        JOIN sellers s ON s.id = l.seller_id
        WHERE l.category = $1
        ORDER BY l.created_at DESC
        LIMIT 10
      `;
      
      const debugResult = await pool.query(debugQuery, [intent.category]);
      
      debugResult.rows.forEach(listing => {
        // Extract key city name from intent (e.g., "new york" from "new york usa")
        const cityKeywords = intent.buyer_city.split(' ').slice(0, 2).join(' ');
        
        const checks = {
          eligible: listing.intent_eligible,
          published: listing.is_published,
          notDeleted: listing.deleted_at === null,
          priceOk: parseFloat(listing.price) <= (parseFloat(intent.max_price) * 1.20),
          notOwn: listing.seller_user_id !== intent.buyer_id,
          cityMatch: listing.listing_city && new RegExp(cityKeywords, 'i').test(listing.listing_city)
        };
        
      });

      // Extract key city name from intent (e.g., "new york" from "new york usa")
      const cityKeywords = intent.buyer_city.split(' ').slice(0, 2).join(' '); // Take first 2 words
      
      // Handle state matching in JavaScript to avoid SQL parameter type issues
      const queryParams = [
        intent.category,
        intent.max_price,
        intent.buyer_id,
        cityKeywords
      ];
      
      // Always include city matching first
      let locationFilter = `
        -- Location filter: same city (case-insensitive with regex) - always included
        AND (
          l.location->>'city' IS NOT NULL 
          AND l.location->>'city' ~* $4
        `;
      
      // Add state filter as additional option only if buyer_state is not null
      if (intent.buyer_state) {
        locationFilter += `
          OR (l.location->>'state' IS NOT NULL AND LOWER(l.location->>'state') = LOWER($5))
        `;
        queryParams.push(intent.buyer_state);
      }
      
      locationFilter += `)`;

      const matchingQuery = `
        SELECT DISTINCT 
          l.id as listing_id,
          l.title as listing_title,
          l.price as listing_price,
          l.category as listing_category,
          l.seller_id,
          s.user_id as seller_user_id,
          l.location->>'city' as listing_city,
          l.location->>'state' as listing_state,
          l.created_at
        FROM listings l
        JOIN sellers s ON s.id = l.seller_id
        WHERE l.intent_eligible = true
          AND l.is_published = true
          AND l.deleted_at IS NULL
          AND l.category = $1
          AND l.price <= ($2 * 1.20)
          AND s.user_id != $3
          ${locationFilter}
        ORDER BY 
          l.created_at DESC
        LIMIT 100
      `;

      const result = await pool.query(matchingQuery, queryParams);

      console.log(`[WORKFLOW] Query parameters: intentId=${intentId}, category=${intent.category}, maxPrice=${intent.max_price}, buyerId=${intent.buyer_id}`);
      console.log(`[WORKFLOW] Location parameters: buyer_city="${intent.buyer_city}", buyer_state="${intent.buyer_state}"`);
      console.log(`[WORKFLOW] Found ${result.rows.length} matching listings`);
      result.rows.forEach(listing => {
        console.log(`[WORKFLOW] - Listing: ${listing.listing_title}, Price: ${listing.listing_price}, City: "${listing.listing_city}", State: "${listing.listing_state}"`);
        console.log(`[WORKFLOW]   Seller ID: ${listing.seller_id}, Seller User ID: ${listing.seller_user_id}`);
      });

      return result.rows;
    });

    // Step 3: Create notifications for sellers (with deduplication)
    const notifications = await step.run("create-notifications", async () => {
      console.log(`[WORKFLOW] Creating notifications for ${matchedListings.length} matched listings`);
      
      if (matchedListings.length === 0) {
        console.log(`[WORKFLOW] No matched listings, skipping notifications`);
        return { created: 0, notifications: [] };
      }

      // Prepare notification data for each matched listing
      const notificationData = matchedListings.map(listing => {
        if (!listing.seller_user_id) {
          console.log(`[WORKFLOW] WARNING: Skipping notification for listing ${listing.listing_id} - seller_user_id is null, seller_id: ${listing.seller_id}`);
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
              listing_id: listing.listing_id
            }
          }
        };
      }).filter(Boolean); // Remove null entries

      console.log(`[WORKFLOW] Prepared ${notificationData.length} notifications for insertion`);
      
      if (notificationData.length === 0) {
        console.log(`[WORKFLOW] No valid notifications to create (all had null seller_user_id)`);
        return { created: 0, notifications: [] };
      }

      // Log first notification for debugging
      console.log(`[WORKFLOW] Sample notification data:`, JSON.stringify(notificationData[0], null, 2));

      // Use INSERT ... ON CONFLICT for deduplication
      const valuesClauses = notificationData.map((notif, index) => 
        `($${index * 6 + 1}, $${index * 6 + 2}, $${index * 6 + 3}, $${index * 6 + 4}, $${index * 6 + 5}, $${index * 6 + 6})`
      ).join(', ');

      const params = notificationData.flatMap(notif => [
        notif.user_id,
        notif.actor_id,
        notif.type,
        JSON.stringify(notif.payload),
        intentId,
        notif.payload.listing_id
      ]);

      const insertQuery = `
        INSERT INTO notifications (user_id, actor_id, type, payload, intent_id, listing_id)
        VALUES ${valuesClauses}
        ON CONFLICT (intent_id, listing_id, user_id) 
        WHERE intent_id IS NOT NULL AND listing_id IS NOT NULL
        DO NOTHING
        RETURNING id, user_id, actor_id, type, payload, intent_id, listing_id, created_at
      `;
      
      console.log(`[WORKFLOW] Executing insert query with ${params.length} parameters`);
      console.log(`[WORKFLOW] SQL: ${insertQuery.substring(0, 200)}...`);
      
      const result = await pool.query(insertQuery, params);
      
      console.log(`[WORKFLOW] Successfully created ${result.rows.length} notifications (deduplication applied)`);
      result.rows.forEach(notification => {
        console.log(`[WORKFLOW] - Notification for seller: ${notification.user_id}, listing: ${notification.listing_id}`);
      });
      
      return {
        created: result.rows.length,
        notifications: result.rows
      };
    });

    // Step 4: Emit Socket.IO notifications to online sellers
    const socketResults = await step.run("emit-socket-notifications", async () => {
      console.log(`[WORKFLOW] Emitting Socket.IO notifications for ${notifications.created} notifications`);
      
      if (notifications.created === 0) {
        console.log(`[WORKFLOW] No notifications to emit via Socket.IO`);
        return { emitted: 0, rate_limited: 0 };
      }

      try {
        // Get Socket.IO instance from global or context
        const io = global.io || null;
        if (!io) {
          console.log(`[WORKFLOW] Socket.IO instance not available, skipping socket notifications`);
          return { emitted: 0, rate_limited: 0 };
        }

        console.log(`[WORKFLOW] Socket.IO instance found, processing notifications`);
        
        // Initialize notification service with actual Socket.IO instance
        const notificationService = new NotificationService(io, null);

        // Process socket notifications with rate limiting
        const results = await notificationService.processSocketNotifications(notifications.notifications);
        
        console.log(`[WORKFLOW] Socket.IO results: emitted=${results.processed || 0}, rate_limited=${results.rate_limited || 0}`);
        
        return {
          emitted: results.processed || 0,
          rate_limited: results.rate_limited || 0
        };
      } catch (error) {
        console.error(`[WORKFLOW] Socket notification error:`, error);
        return { emitted: 0, rate_limited: 0 };
      }
    });

    // Step 5: Enqueue push notification batch job
    const pushResults = await step.run("enqueue-push-batch", async () => {
      console.log(`[WORKFLOW] Enqueuing push notification batch for ${notifications.created} notifications`);
      
      if (notifications.created === 0) {
        console.log(`[WORKFLOW] No notifications to enqueue for push notifications`);
        return { enqueued: 0 };
      }

      // Create a push batch job event
      const pushBatchData = {
        notification_ids: notifications.notifications.map(n => n.id),
        batch_size: notifications.created,
        created_at: new Date().toISOString()
      };

      console.log(`[WORKFLOW] Creating push batch with ${pushBatchData.batch_size} notifications`);
      console.log(`[WORKFLOW] Notification IDs: ${pushBatchData.notification_ids.join(', ')}`);

      // Send event to trigger push notification worker using step.sendEvent
      await step.sendEvent({ name: "push.batch.process", data: pushBatchData });
      
      console.log(`[WORKFLOW] Push batch event sent successfully`);

      return { 
        enqueued: notifications.created,
        batch_data: pushBatchData
      };
    });

    // Final workflow summary
    console.log(`[WORKFLOW] Intent matching workflow completed for intent: ${intentId}`);
    console.log(`[WORKFLOW] Summary: ${matchedListings.length} listings matched, ${notifications.created} notifications created, ${socketResults.emitted} socket notifications emitted, ${pushResults.enqueued} push notifications enqueued`);

    return {
      success: true,
      intent_id: intentId,
      matched_listings: matchedListings.length,
      notifications_created: notifications.created,
      socket_notifications_emitted: socketResults.emitted || 0,
      socket_rate_limited: socketResults.rate_limited || 0,
      push_batch_enqueued: pushResults.enqueued
    };
  }
);

module.exports = { intentMatchingWorkflow };
