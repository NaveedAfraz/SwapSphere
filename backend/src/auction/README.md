# Auction Module

Backend implementation for micro-auctions in SwapSphere P2P marketplace.

## Overview

The auction system allows sellers to start private micro-auctions from existing 1-to-1 deal rooms, inviting multiple buyers to bid in real-time. The highest bidder wins and the auction automatically creates an order that flows into the existing payment system.

## Architecture

### Database Schema
- `auctions` - Main auction records
- `auction_invites` - User invitations to auctions  
- `auction_bids` - Bid records
- `deal_rooms` - Auction deal rooms (room_type = 'auction')
- `deal_room_participants` - Auction participants
- `deal_events` - Auction event tracking

### Components

#### 1. REST APIs (`routes.js`, `controller.js`)

**Start Auction**
```
POST /api/deals/:directDealId/start-auction
{
  "startPrice": 10000,
  "minIncrement": 500, 
  "durationMinutes": 30,
  "inviteeIds": ["uuid1", "uuid2"]
}
```

**Place Bid**
```
POST /api/auctions/:id/bid
{ "amount": 12500 }
```

**Get Auction State**
```
GET /api/auctions/:id
```

**Cancel Auction**
```
POST /api/auctions/:id/cancel
```

#### 2. Socket.IO Handlers (`socketHandler.js`)

Real-time events:
- `auction:join` - Join auction room
- `auction:bid` - Place bid via socket
- `auction:leave` - Leave auction room

Broadcast events:
- `auction:started` - Auction begins
- `auction:bid:update` - New bid placed
- `auction:closed` - Auction ends
- `auction:cancelled` - Auction cancelled
- `auction:error` - Error events

#### 3. Inngest Workflow (`auctionWorkflow.js`)

**Auto-Close Auction**
- Trigger: `auction.started`
- Sleeps until end time
- Determines winner (highest bid)
- Creates order for winner
- Triggers existing payment flow
- Handles no-bid scenario

#### 4. Services (`services/auctionService.js`)

Utility functions:
- `getHighestBid()` - Fetch highest bid
- `insertDealEvent()` - Log deal events
- `isSellerInDealRoom()` - Permission checks
- `isUserInvitedToAuction()` - Invitation validation
- `placeBidAtomic()` - Atomic bid placement

## Flow

### 1. Start Auction
1. Seller initiates auction from direct deal room
2. System creates new auction deal room
3. Seller + invitees added as participants
4. Auction record created with invites
5. Old direct rooms marked as superseded
6. Socket events emitted
7. Inngest workflow triggered for auto-close

### 2. Bidding Phase
1. Invited users join auction room via socket
2. Real-time bid validation (minimum increments)
3. Atomic bid placement with concurrent safety
4. Live updates to all participants
5. Deal events logged for audit

### 3. Auction End
1. Inngest workflow wakes at end time
2. Highest bid determined (if any)
3. Winner scenario:
   - Auction marked closed
   - Order created for winner
   - Payment flow triggered
   - Winner notified
4. No-bid scenario:
   - Auction marked closed
   - All participants notified

## Key Features

### Security & Permissions
- JWT authentication required
- Seller-only auction creation/cancellation
- Invitation-only participation
- Role-based access control

### Data Integrity
- Database transactions for atomic operations
- Concurrent bid safety with row-level validation
- Comprehensive audit logging via deal_events

### Real-time Updates
- Socket.IO for live bidding
- Instant bid notifications
- Room-based event broadcasting

### Scalability
- Efficient database queries with indexes
- Background workflow processing
- Minimal memory footprint

## Error Handling

### Common Errors
- `You must be the seller to start an auction`
- `You are not invited to this auction`
- `Auction is not active`
- `Bid must be at least $X`

### Socket Errors
- Authentication required
- Permission denied
- Invalid bid amount
- Auction not found

## Testing

### Example API Calls

```bash
# Start auction
curl -X POST http://localhost:5000/api/deals/uuid/start-auction \
  -H "Authorization: Bearer token" \
  -H "Content-Type: application/json" \
  -d '{
    "startPrice": 10000,
    "minIncrement": 500,
    "durationMinutes": 30,
    "inviteeIds": ["uuid1", "uuid2"]
  }'

# Place bid
curl -X POST http://localhost:5000/api/auctions/uuid/bid \
  -H "Authorization: Bearer token" \
  -H "Content-Type: application/json" \
  -d '{"amount": 12500}'

# Get auction
curl -X GET http://localhost:5000/api/auctions/uuid \
  -H "Authorization: Bearer token"
```

### Socket Events

```javascript
// Join auction
socket.emit('auction:join', { auctionDealRoomId: 'uuid' });

// Place bid
socket.emit('auction:bid', { auctionId: 'uuid', amount: 12500 });

// Listen for updates
socket.on('auction:bid:update', (data) => {
  console.log('New bid:', data);
});
```

## Integration Points

### Existing Systems
- **Deal Rooms**: Creates auction rooms, supersedes direct rooms
- **Orders**: Creates order for auction winner
- **Payments**: Triggers existing payment flow
- **Notifications**: Uses existing notification system
- **Auth**: Uses existing JWT middleware

### Database Dependencies
- `deal_rooms` - Room management
- `listings` - Product information
- `sellers` - Seller information
- `users` - User accounts
- `orders` - Order creation

## Performance Considerations

### Database Optimization
- Indexed queries on auction_bids (amount DESC)
- Efficient participant lookups
- Minimal transaction scopes

### Socket Optimization
- Room-based broadcasting
- Connection pooling
- Error recovery

### Workflow Optimization
- Idempotent processing
- Retry mechanisms
- Graceful failure handling

## Monitoring

### Key Metrics
- Auction creation rate
- Bid frequency
- Auction completion rate
- Error rates

### Logging
- Comprehensive console logging
- Deal event audit trail
- Error tracking

## Future Enhancements

### Potential Features
- Reserve prices
- Buy-it-now options
- Auction extensions
- Bid history analytics
- Seller reputation integration

### Performance
- Redis caching for hot auctions
- Database sharding for scale
- CDN for static assets
