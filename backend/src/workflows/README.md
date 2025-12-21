# Intent Matching & Notification System

This directory contains the Inngest workflows and services for the SwapSphere intent matching and notification system.

## Overview

When a buyer creates an intent, the system automatically:
1. Matches the intent to eligible listings based on category, location, and price
2. Creates notifications for sellers (with deduplication)
3. Emits real-time Socket.IO notifications to online sellers
4. Enqueues push notifications in batches with rate limiting

## Files

### Core Workflows
- `intentMatchingWorkflow.js` - Main workflow that processes intent.created events
- `pushNotificationWorker.js` - Handles batch processing of push notifications
- `index.js` - Registry for all workflows

### Services
- `../services/notificationService.js` - Handles Socket.IO and push notifications with rate limiting
- `../services/inngest.js` - Inngest client configuration

## Setup Instructions

### 1. Environment Variables

Add these to your `.env` file:

```bash
# Inngest Configuration
INNGEST_EVENT_KEY=your_inngest_event_key
INNGEST_SIGNING_KEY=your_inngest_signing_key

# Push Notification Service (if using FCM/APNs)
PUSH_SERVICE_API_KEY=your_push_service_key
PUSH_SERVICE_URL=https://your-push-service.com
```

### 2. Database Schema

The system uses the existing database schema with these key tables:

- `intents` - Buyer intents with location and category
- `listings` - Seller listings with intent_eligible flag
- `notifications` - User notifications with deduplication constraints
- `users` - User accounts
- `profiles` - User profiles with push tokens

The notifications table already includes:
- `intent_id` and `listing_id` foreign keys
- Unique constraint for deduplication: `(intent_id, listing_id, user_id)`

### 3. Socket.IO Integration

In your main server file, integrate the notification service:

```javascript
const { Server } = require("socket.io");
const NotificationService = require("./services/notificationService");

// Initialize Socket.IO
const io = new Server(server, {
  cors: { origin: process.env.FRONTEND_URL }
});

// Initialize notification service
const notificationService = new NotificationService(io, pushService);

// User authentication middleware for Socket.IO
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    const user = await verifySocketToken(token);
    socket.userId = user.id;
    socket.join(`user:${user.id}`);
    next();
  } catch (error) {
    next(new Error("Authentication error"));
  }
});
```

### 4. Inngest Registration

Register the workflows with Inngest in your server startup:

```javascript
const { workflows } = require("./workflows");
const inngest = require("./services/inngest");

// Register all workflows
workflows.forEach(workflow => {
  inngest.register(workflow);
});

// Start Inngest listener
inngest.listen();
```

### 5. Push Service Integration

Create your push service adapter:

```javascript
class PushService {
  async send(payload) {
    // Implement your push notification logic
    // Supports FCM, APNs, or unified push service
    console.log("Sending push notification:", payload);
  }
}

const pushService = new PushService();
```

## Matching Rules

The intent matching follows these rules:

### Eligibility Criteria
- `listings.intent_eligible = true`
- `listings.is_published = true`
- `listings.category = intents.category`
- `listings.price <= intents.max_price * 1.05` (5% tolerance)
- Location within 50km radius or same city/state
- Excludes intent creator's own listings

### Location Matching
- Primary: Distance calculation using Haversine formula (50km radius)
- Fallback: Same city or state matching
- Handles missing coordinates gracefully

### Limits
- Maximum 200 matches per intent
- Rate limited: Max 10 notifications per user per hour
- Deduplicated: One notification per (intent, listing, seller) combination

## Notification Types

### Intent Match Notifications
```json
{
  "type": "intent_match",
  "payload": {
    "intent_id": "uuid",
    "listing_id": "uuid",
    "intent_title": "Looking for iPhone 13",
    "listing_title": "iPhone 13 Pro - Excellent Condition",
    "buyer_max_price": 800,
    "listing_price": 750,
    "distance_km": 12.5,
    "category": "electronics",
    "cta_text": "Send Offer",
    "cta_action": "create_offer",
    "cta_data": {
      "intent_id": "uuid",
      "listing_id": "uuid"
    }
  }
}
```

## Rate Limiting

### Socket.IO Notifications
- Max 10 notifications per user per hour
- In-memory tracking with automatic cleanup
- Users exceeding limits are skipped temporarily

### Push Notifications
- Same limits as Socket.IO
- Batch processing to avoid overwhelming push services
- Automatic retry logic for failed deliveries

## Monitoring & Debugging

### Workflow Logs
All workflows include detailed logging:
- Intent matching results
- Notification creation counts
- Rate limiting statistics
- Error details with context

### Metrics Tracking
The system tracks:
- Match success rate
- Notification delivery rate
- Rate limiting frequency
- Processing time per batch

### Error Handling
- Graceful degradation for missing data
- Retry logic for transient failures
- Comprehensive error logging
- No workflow failures stop the overall process

## Testing

### Unit Testing
```javascript
// Test intent matching
const { intentMatchingWorkflow } = require("./workflows");

// Mock event data
const mockEvent = {
  data: { intentId: "test-intent-id" }
};

// Run workflow
const result = await intentMatchingWorkflow.handler(mockEvent);
```

### Integration Testing
- Create test intents and listings
- Verify notification creation
- Test rate limiting behavior
- Validate Socket.IO emissions

## Performance Considerations

### Database Optimization
- Indexes on location, category, and price
- Efficient JSONB queries for location data
- Batch operations for notifications

### Memory Management
- Automatic cleanup of rate limit store
- Batch processing to limit memory usage
- Efficient SQL queries with proper limits

### Scalability
- Horizontal scaling with Inngest
- Distributed rate limiting (Redis for production)
- Push notification batching for high volume

## Production Deployment

### Required Services
1. **Inngest** - Workflow orchestration
2. **Redis** - Distributed rate limiting (optional for single server)
3. **Push Service** - FCM/APNs or unified service
4. **Socket.IO** - Real-time notifications

### Configuration
- Set appropriate rate limits based on user volume
- Configure push service quotas and batching
- Monitor workflow execution times
- Set up alerts for high failure rates

### Security
- Validate all input data
- Rate limit per user, not per IP
- Secure Socket.IO authentication
- Encrypt push notification payloads

## Troubleshooting

### Common Issues

1. **No matches found**
   - Check listing eligibility flags
   - Verify category matching
   - Review location data format

2. **Duplicate notifications**
   - Verify unique constraint exists
   - Check intent_id/listing_id values
   - Review ON CONFLICT logic

3. **Rate limiting too aggressive**
   - Adjust MAX_NOTIFICATIONS_PER_HOUR
   - Check rate limit store cleanup
   - Verify user identification

4. **Socket.IO not working**
   - Confirm user authentication
   - Check room joining logic
   - Verify client-side event listeners

### Debug Mode
Enable debug logging by setting:
```bash
DEBUG=inngest:*
NODE_ENV=development
```

This will provide detailed workflow execution logs for troubleshooting.
