# Phase-2 Edge Case Audit

## Critical Missing Edge Cases

### 1. Payment Lifecycle Edge Cases

#### **Stripe Capture Failure After 7-Day Wait**
**Issue**: Auto-capture workflow fails if Stripe API is down or payment becomes uncapturable
**Why Matters**: Funds stuck in limbo, seller never paid, buyer charged
**Fix**: Add retry logic with exponential backoff and manual capture fallback

#### **Partial Capture Scenarios**
**Issue**: Stripe allows partial captures but system assumes full amount
**Why Matters**: Buyer charged full amount, seller receives partial payment
**Fix**: Validate capture amount equals order total before processing

#### **Payment Intent Expiration**
**Issue**: PaymentIntents expire after 30 days but workflow waits 7 days
**Why Matters**: Auto-capture fails on expired PaymentIntent
**Fix**: Check PaymentIntent status before capture attempt

#### **Refund Before Capture**
**Issue**: System allows refunds before payment capture
**Why Matters**: Refunding uncaptured funds causes Stripe errors
**Fix**: Validate payment status is 'captured' before allowing refunds

### 2. Ghosting Scenarios

#### **Seller Ghosts After Payment Authorized**
**Issue**: No mechanism to handle seller not shipping item
**Why Matters**: Buyer charged, no delivery, no recourse
**Fix**: Add "delivery_confirmation_required" state with timeout to auto-cancel

#### **Buyer Ghosts After Delivery**
**Issue**: No buyer confirmation flow for received items
**Why Matters**: Seller ships, buyer claims never received, payment held indefinitely
**Fix**: Implement delivery confirmation with photo proof and tracking

#### **Both Parties Ghost During Negotiation**
**Issue**: No cleanup for abandoned negotiations
**Why Matters**: Database bloat, stale deal rooms
**Fix**: Add cleanup job for inactive deal rooms after 30 days

### 3. Dispute Handling Gaps

#### **Dispute During Payment Processing**
**Issue**: Can't dispute while payment in 'created' or 'processing' state
**Why Matters**: Buyer sees fraudulent charge but can't dispute
**Fix**: Allow disputes from 'payment_pending' state onward

#### **Dispute Resolution Workflow Missing**
**Issue**: State machine has 'dispute_opened' but no resolution path
**Why Matters**: Disputes never resolve, funds stuck forever
**Fix**: Add 'dispute_resolved' state and admin resolution workflow

#### **Partial Refund Disputes**
**Issue**: No mechanism for partial refunds in disputes
**Why Matters**: Complex disputes require partial settlements
**Fix**: Add partial refund capability with admin approval

### 4. Webhook Failure Scenarios

#### **Duplicate Webhook Events**
**Issue**: Stripe may send duplicate webhooks, no idempotency key
**Why Matters**: Duplicate payment processing, double state updates
**Fix**: Add webhook event ID tracking with deduplication

#### **Webhook Processing Mid-Transaction**
**Issue**: Webhook fails if database transaction in progress
**Why Matters**: Payment succeeds but state doesn't update
**Fix**: Add retry queue for failed webhook processing

#### **Webhook Timeout Issues**
**Issue**: Stripe expects 200ms response, complex processing may timeout
**Why Matters**: Stripe retries webhook, causing duplicate processing
**Fix**: Immediate 200 response, async processing queue

### 5. Race Conditions

#### **Concurrent Payment Creation**
**Issue**: Two payment intents created simultaneously for same order
**Why Matters**: Duplicate charges, payment confusion
**Fix**: Add database lock on order during payment creation

#### **State Update Race Conditions**
**Issue**: State machine updates not atomic across tables
**Why Matters**: Payments succeed but deal room state inconsistent
**Fix**: Use database transactions for all state changes

#### **Offer Acceptance Race**
**Issue**: Seller accepts offer while buyer cancels simultaneously
**Why Matters**: Order created but offer status inconsistent
**Fix**: Add offer status lock during acceptance process

### 6. State Machine Loopholes

#### **Missing 'payment_failed' → 'payment_pending' Transition**
**Issue**: Failed payments can't be retried without new order
**Why Matters**: Buyer must create new order for payment retry
**Fix**: Add retry path from 'payment_failed' to 'payment_pending'

#### **No 'in_delivery' → 'payment_failed' Path**
**Issue**: Can't handle payment failures during delivery
**Why Matters**: Shipping costs incurred but payment fails
**Fix**: Add emergency reverse flow for payment issues

#### **Terminal State Bypass**
**Issue**: No protection against modifying completed/canceled orders
**Why Matters**: Historical data corruption, audit trail broken
**Fix**: Add immutable state check for terminal states

### 7. Automation Timing Issues

#### **Weekend/Holiday Delays**
**Issue**: 7-day capture doesn't account for business days
**Why Matters**: Seller expects payment on business day, gets weekend delay
**Fix**: Use business day calculation or fixed calendar days

#### **Time Zone Inconsistencies**
**Issue**: Workflow uses server timezone, users in different zones
**Why Matters**: Payment capture at unexpected times for users
**Fix**: Store all timestamps in UTC, display in user timezone

#### **Database Connection Timeouts**
**Issue**: Long-running workflows may lose database connection
**Why Matters**: Auto-capture fails silently, funds stuck
**Fix**: Add connection health checks and retry logic

### 8. Critical Missing Features

#### **Payment Method Validation**
**Issue**: No validation of payment method types
**Why Matters**: Unsupported payment methods cause failures
**Fix**: Add allowed payment method whitelist

#### **Currency Conversion Handling**
**Issue**: No currency conversion rate management
**Why Matters**: Cross-border payments have rate fluctuations
**Fix**: Add rate locking at payment creation time

#### **Fraud Detection Integration**
**Issue**: No fraud checks on payment creation
**Why Matters**: High-risk transactions proceed without review
**Fix**: Add basic fraud scoring and manual review triggers

#### **Audit Trail Completeness**
**Issue**: Some state changes not logged to deal_events
**Why Matters**: Incomplete audit trail for disputes
**Fix**: Ensure all state transitions create deal events

## Priority Fixes (High to Low)

### Critical (Fix Immediately)
1. Add webhook event deduplication
2. Implement dispute resolution workflow
3. Add payment status validation before refunds
4. Fix concurrent payment creation race condition

### High (Fix Within Sprint)
1. Add delivery confirmation flow
2. Implement partial refund capability
3. Add business day calculation for capture timing
4. Create cleanup job for abandoned deal rooms

### Medium (Fix Next Sprint)
1. Add fraud detection integration
2. Implement currency conversion handling
3. Add payment method validation
4. Create admin dashboard for dispute resolution

### Low (Future Enhancement)
1. Add timezone handling improvements
2. Implement advanced analytics
3. Add multi-currency support
4. Create automated dispute resolution AI

## Testing Recommendations

### Edge Case Tests Required
1. Duplicate webhook processing
2. Concurrent payment creation
3. Payment capture failure scenarios
4. Dispute during payment processing
5. State transition race conditions

### Load Testing Scenarios
1. High-volume payment processing
2. Concurrent offer acceptances
3. Webhook spike handling
4. Database connection pooling under load

### Security Tests
1. Webhook signature manipulation
2. Unauthorized state transitions
3. Payment amount tampering
4. Cross-user data access attempts
