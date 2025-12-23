# Phase-2 Implementation: Transactional Flow

## Overview

Phase-2 implements the complete transactional flow for SwapSphere, integrating offer acceptance with order creation, Stripe escrow payments, and Inngest automation. This enables real marketplace transactions with proper payment processing and state management.

## Architecture

### Core Components
- **Backend**: Node.js + Express with PostgreSQL
- **Payments**: Stripe PaymentIntent with manual capture (escrow)
- **Automation**: Inngest workflows for payment processing
- **Security**: Middleware guards and validation
- **Real-time**: Socket.IO for live updates

### State Flow
```
negotiation → offer_accepted → payment_pending → payment_authorized → in_delivery → completed
```

## Implementation Details

### 1. Offer → Order Flow

**Files Modified:**
- `backend/src/offer/controller.js`
- `backend/src/dealRooms/stateTransitions.js`

**Process:**
1. When seller accepts offer:
   - Update offer status to 'accepted'
   - Create order with offer details
   - Update deal room state to 'offer_accepted'
   - Create deal event for order creation
   - Emit socket event for real-time updates

**Security:**
- Only sellers can accept offers
- Prevent duplicate orders for same offer
- Validate offer status before acceptance

### 2. Stripe Escrow Payment Integration

**Files Created:**
- `backend/src/payment/controller.js` - Payment intent creation
- `backend/src/payment/webhooks.js` - Stripe webhook handlers
- `frontend/src/features/payment/components/PayNowButton.tsx` - Payment UI

**Process:**
1. Buyer clicks "Pay Now" → Creates Stripe PaymentIntent (manual capture)
2. Payment stored in database with 'created' status
3. Deal room state updated to 'payment_pending'
4. Frontend uses Stripe SDK for payment confirmation
5. Webhook updates payment to 'succeeded' and state to 'payment_authorized'

**Key Features:**
- Manual capture for escrow protection
- Idempotent payment creation
- Real-time payment status updates
- Secure webhook signature verification

### 3. Frontend Pay Now UI

**Files Modified:**
- `frontend/app/_layout.tsx` - Added StripeProvider
- `frontend/src/features/dealRooms/components/DealRoomChat.tsx` - Payment button integration

**Features:**
- Conditional payment button display (only buyers, accepted offers)
- Stripe Payment Sheet integration
- Loading states and error handling
- Real-time UI updates after payment

### 4. Stripe Webhook Handlers

**Events Handled:**
- `payment_intent.succeeded` → Authorize payment, trigger automation
- `payment_intent.payment_failed` → Handle failure, allow retry
- `payment_intent.canceled` → Cancel payment, update state

**Security:**
- Webhook signature verification
- Idempotent event processing
- Proper error handling and logging

### 5. Inngest Automation Workflows

**Files Created:**
- `backend/src/workflows/paymentAutomation.js`

**Workflows:**

#### Auto-Capture Payment
- **Trigger**: `payment/authorized` event
- **Wait**: 7 days for delivery
- **Actions**: 
  - Check for disputes
  - Capture Stripe payment
  - Update order to 'completed'
  - Update deal room to 'completed'
  - Send notifications

#### Handle Payment Failure
- **Trigger**: `payment/failed` event
- **Actions**: Reset order to 'pending', allow retry

#### Handle Order Completion
- **Trigger**: `payment/captured` event
- **Actions**: Send review requests to both parties

### 6. Deal Room State Transitions

**Files Created:**
- `backend/src/dealRooms/stateTransitions.js`

**Valid Transitions:**
```javascript
{
  'negotiation': ['offer_accepted', 'canceled'],
  'offer_accepted': ['payment_pending', 'canceled'],
  'payment_pending': ['payment_authorized', 'payment_failed', 'canceled'],
  'payment_authorized': ['in_delivery', 'dispute_opened', 'canceled'],
  'in_delivery': ['completed', 'dispute_opened', 'canceled'],
  'dispute_opened': ['resolved', 'canceled'],
  'completed': [],
  'canceled': []
}
```

**Features:**
- State validation
- User permission checks
- Deal event logging
- Metadata tracking

### 7. Security Guards & Validation

**Files Created:**
- `backend/src/middleware/securityGuards.js`

**Security Features:**
- Resource ownership validation
- User role-based permissions
- Rate limiting on sensitive operations
- Payment amount validation
- Duplicate prevention
- Security event logging

**Applied To:**
- Offer acceptance (3 attempts/minute)
- Payment creation (5 attempts/minute)
- Payment refunds (3 attempts/minute)

## API Endpoints

### Payment Endpoints
- `POST /api/payment/intent` - Create payment intent (buyer only)
- `GET /api/payment/order/:orderId` - Get order payments
- `GET /api/payment/:id` - Get payment details
- `POST /api/payment/webhook` - Stripe webhook (no auth)
- `POST /api/payment/:id/refund` - Refund payment

### Offer Endpoints (Enhanced)
- `POST /api/offer/:id/accept` - Accept offer with security guards
- All endpoints now include proper validation and rate limiting

## Database Schema Changes

### Orders Table
- Links offers to payments
- Tracks order status and metadata
- Contains buyer/seller relationships

### Payments Table
- Stores payment provider information
- Tracks payment status and metadata
- Links to orders for escrow management

### Deal Events Table
- Logs all state transitions
- Tracks payment events
- Provides audit trail

## Environment Variables

**Required for Phase-2:**
```bash
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Frontend
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
```

## Testing Flow

### End-to-End Test
1. Create offer negotiation
2. Seller accepts offer → Order created
3. Buyer sees "Pay Now" button
4. Buyer completes payment → Payment authorized
5. Inngest workflow starts → 7-day wait
6. Auto-capture payment → Order completed
7. Review requests sent

### Error Handling
- Payment failures → Order reset to pending
- Dispute handling → Payment held
- Webhook failures → Retry logic
- State validation → Prevent invalid transitions

## Deployment Notes

### Stripe Setup
1. Create Stripe account and test keys
2. Configure webhook endpoint
3. Enable manual capture for escrow
4. Set up webhook events in Stripe dashboard

### Inngest Setup
1. Configure Inngest client
2. Register workflows
3. Set up webhook endpoint
4. Configure event triggers

### Security Considerations
- All payment endpoints require authentication
- Webhook signature verification mandatory
- Rate limiting on sensitive operations
- Audit logging for all transactions
- Proper error handling without data leakage

## Future Enhancements

### Phase-3 Potential Features
- Dispute resolution workflow
- Multi-item orders
- Shipping integration
- Escrow release conditions
- Review system integration
- Analytics dashboard

### Performance Optimizations
- Database indexing for payment queries
- Caching for payment status
- Optimized webhook processing
- Background job queuing

## Troubleshooting

### Common Issues
1. **Stripe key not configured** → Check environment variables
2. **Payment webhook failing** → Verify webhook secret
3. **State transition errors** → Check state machine logic
4. **Socket updates not working** → Verify socket connection
5. **Inngest workflow not triggering** → Check event registration

### Debug Tips
- Check server logs for Stripe initialization
- Verify webhook event logs in Stripe dashboard
- Test state transitions manually
- Monitor Inngest workflow execution
- Check frontend Stripe SDK configuration

## Conclusion

Phase-2 successfully implements a complete transactional flow with proper payment processing, state management, and automation. The system is production-ready with comprehensive security measures and error handling.
