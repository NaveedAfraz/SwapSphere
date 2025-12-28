# Auction Auto-Close Workflow

This document describes the auction auto-close workflow implementation for SwapSphere.

## Overview

The auction auto-close workflow automatically closes auctions when their end time is reached and selects the winner based on the highest bid.

## Architecture

- **Trigger**: `auction.started` event sent when an auction begins
- **Orchestration**: Inngest workflow that sleeps until auction end time
- **Database**: PostgreSQL with row-level locking for atomicity
- **Real-time**: Socket.IO events for live notifications
- **Payment**: Triggers existing payment flow for winners

## Files

- `auctionCloseWorkflow.js` - Main workflow implementation
- `testAuctionWorkflow.js` - Test script for the workflow
- `add_auction_winner_fields.sql` - Database migration for winner tracking

## Workflow Steps

### 1. Event Trigger
When an auction starts, the `startAuction` controller sends an `auction.started` event:
```javascript
await sendEvent({
  name: 'auction.started',
  data: {
    auctionId: result.auctionId,
    dealRoomId: result.auctionDealRoomId,
    endAt: result.endAt.toISOString()
  }
});
```

### 2. Inngest Workflow
The workflow listens for `auction.started` events and:
- Sleeps until the auction's `end_at` time
- Calls `closeAuctionAndPickWinner` helper function
- Emits Socket.IO events
- Triggers payment flow for winners

### 3. Auction Closing Logic
The `closeAuctionAndPickWinner` function:

1. **Locks the auction row** using `SELECT ... FOR UPDATE`
2. **Validates** auction exists, is active, and time has expired
3. **Finds highest bid** using `ORDER BY amount DESC, created_at ASC`
4. **Updates auction state** to 'closed'
5. **Handles two scenarios**:
   - **No bids**: Logs auction.closed event
   - **Has winner**: Creates order, logs auction.winner event

### 4. Database Transaction
All operations are wrapped in a transaction:
```javascript
return await transaction(async (client) => {
  // All database operations here
  // Automatic COMMIT on success, ROLLBACK on error
});
```

### 5. Socket.IO Events
Real-time notifications are sent to:
- `deal:{dealRoomId}` - All participants in deal room
- `user:{winnerId}` - Winner notification
- `user:{sellerId}` - Seller notification

Event payload:
```javascript
{
  type: 'auction.closed',
  auctionId: 'uuid',
  timestamp: 'ISO string',
  winnerId: 'uuid', // if winner exists
  amount: 15000,    // if winner exists
  orderId: 'uuid'   // if winner exists
}
```

### 6. Payment Flow
If there's a winner, triggers `payment.initiated` event:
```javascript
await sendEvent({
  name: 'payment.initiated',
  data: {
    orderId: winner.orderId,
    dealRoomId: result.dealRoomId,
    buyerId: result.winner.id,
    sellerId: result.sellerId,
    amount: result.winner.amount,
    source: 'auction_winner'
  }
});
```

## Winner Selection Rules

1. **Highest bid amount** wins
2. **Tiebreaker**: Earliest bid wins (created_at ASC)
3. **No bids**: Auction closes without winner

## Database Schema

### Core Tables
- `auctions` - Auction details
- `auction_bids` - All bids placed
- `deal_events` - Event log
- `orders` - Payment orders

### Migration (Optional)
The `add_auction_winner_fields.sql` migration adds:
- `winner_id` - User ID of winner
- `winning_bid_id` - ID of winning bid  
- `winning_amount` - Winning bid amount
- `ended_at` - Actual end time
- `ended_reason` - Why auction ended

The workflow works with or without these fields.

## Idempotency

The workflow is idempotent:
- If auction already closed → exits safely
- If workflow retries → no duplicate orders created
- Database locks prevent race conditions

## Error Handling

- **Auction not found**: Logs and exits
- **Auction not active**: Logs and exits  
- **Auction not expired**: Logs and exits
- **Database errors**: Transaction rollback, workflow retry
- **Socket.IO unavailable**: Continues without notifications

## Testing

### Manual Test
```bash
cd backend/src/workflows
node testAuctionWorkflow.js
```

### Direct Function Test
```javascript
const { testCloseAuctionFunction } = require('./testAuctionWorkflow');
await testCloseAuctionFunction('auction-uuid');
```

### Integration Test
1. Create an auction via API
2. Wait for end time or set short duration
3. Check workflow logs in Inngest dashboard
4. Verify database state
5. Check Socket.IO events

## Monitoring

### Logs
All steps are logged with `[AuctionClose]` prefix:
```
[AuctionClose] Starting auction close process for auction: uuid
[AuctionClose] Locking auction row: uuid
[AuctionClose] Auction found: state=active, end_at=2024-01-01T12:00:00Z
[AuctionClose] Fetching highest bid for auction: uuid
[AuctionClose] Winning bid found: bidder=uuid, amount=15000
[AuctionClose] Order created: uuid
[AuctionClose] Socket events emitted successfully
```

### Metrics to Track
- Auction close success rate
- Average time from end_at to close
- Winner selection accuracy
- Payment flow trigger rate

## Troubleshooting

### Common Issues

1. **Workflow not triggering**
   - Check Inngest event key configuration
   - Verify `auction.started` event is sent
   - Check workflow registration

2. **Auction not closing**
   - Verify auction state is 'active'
   - Check current time vs end_at
   - Look for database lock issues

3. **No Socket.IO events**
   - Verify global.socketIO is set in server.js
   - Check client room subscriptions
   - Verify Socket.IO authentication

4. **Payment not triggered**
   - Check winner selection logic
   - Verify payment.initiated event handling
   - Check order creation

### Debug Mode
Enable debug logging:
```bash
DEBUG=inngest:*
NODE_ENV=development
```

## Production Considerations

### Performance
- Database indexes on auction_bids(amount, created_at)
- Row-level locking prevents contention
- Socket.IO events are non-blocking

### Scalability
- Horizontal scaling with Inngest
- Database connection pooling
- Socket.IO Redis adapter for multi-server

### Reliability
- Workflow retries with exponential backoff
- Transaction rollback on errors
- Graceful degradation without Socket.IO

## Future Enhancements

1. **Auction extensions** - Auto-extend on last-minute bids
2. **Reserve prices** - Don't sell below minimum
3. **Bid verification** - Validate buyer funds
4. **Auction analytics** - Track bidding patterns
5. **Multi-item auctions** - Support for multiple winners
