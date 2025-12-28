const { inngest } = require("../services/inngest");
const { query, transaction } = require("../database/db");
const { setupSocketIO } = require("../socket/socketServer");

/**
 * Helper function to close auction and select winner
 * @param {string} auctionId - The auction ID to close
 * @returns {Promise<Object>} - Result with winner info or null
 */
const closeAuctionAndPickWinner = async (auctionId) => {
  console.log(`[AuctionClose] Starting auction close process for auction: ${auctionId}`);
  
  return await transaction(async (client) => {
    try {
      // Step 1: Lock the auction row and validate
      console.log(`[AuctionClose] Locking auction row: ${auctionId}`);
      const lockQuery = `
        SELECT * FROM auctions 
        WHERE id = $1 
        FOR UPDATE
      `;
      const auctionResult = await client.query(lockQuery, [auctionId]);
      
      if (auctionResult.rows.length === 0) {
        console.log(`[AuctionClose] Auction not found: ${auctionId}`);
        return { success: false, reason: 'auction_not_found' };
      }
      
      const auction = auctionResult.rows[0];
      console.log(`[AuctionClose] Auction found: state=${auction.state}, end_at=${auction.end_at}`);
      
      // Step 2: Ensure auction is still active and time has passed
      if (auction.state !== 'active') {
        console.log(`[AuctionClose] Auction already closed or not active: ${auction.state}`);
        return { success: false, reason: 'auction_not_active', state: auction.state };
      }
      
      const currentTime = new Date();
      const endTime = new Date(auction.end_at);
      
      if (currentTime < endTime) {
        console.log(`[AuctionClose] Auction time not yet expired: current=${currentTime}, end=${endTime}`);
        return { success: false, reason: 'auction_not_expired', endTime };
      }
      
      // Step 3: Fetch highest bid (winner selection)
      console.log(`[AuctionClose] Fetching highest bid for auction: ${auctionId}`);
      const bidQuery = `
        SELECT *
        FROM auction_bids
        WHERE auction_id = $1
        ORDER BY amount DESC, created_at ASC
        LIMIT 1
      `;
      const bidResult = await client.query(bidQuery, [auctionId]);
      
      // Step 4: Update auction state to closed
      console.log(`[AuctionClose] Updating auction state to closed: ${auctionId}`);
      
      // Try to update with winner fields first (if migration has been applied)
      try {
        const updateAuctionQueryWithWinner = `
          UPDATE auctions 
          SET state = 'closed', 
              ended_at = NOW(),
              ended_reason = 'time_expired'
          WHERE id = $1
        `;
        await client.query(updateAuctionQueryWithWinner, [auctionId]);
        console.log(`[AuctionClose] Updated auction with extended fields`);
      } catch (error) {
        // Fallback to basic update if winner fields don't exist
        const updateAuctionQuery = `
          UPDATE auctions 
          SET state = 'closed'
          WHERE id = $1
        `;
        await client.query(updateAuctionQuery, [auctionId]);
        console.log(`[AuctionClose] Updated auction with basic fields (migration not applied)`);
      }
      
      // Step 5: Handle no bids scenario
      if (bidResult.rows.length === 0) {
        console.log(`[AuctionClose] No bids found for auction: ${auctionId}`);
        
        // Insert deal event for auction closed without winner
        const eventQuery = `
          INSERT INTO deal_events
          (deal_room_id, actor_id, event_type, payload, created_at)
          VALUES ($1, $2, $3, $4, NOW())
        `;
        await client.query(eventQuery, [
          auction.deal_room_id,
          auction.seller_id,
          'auction.closed',
          JSON.stringify({ auctionId, reason: 'no_bids' })
        ]);
        
        return {
          success: true,
          hasWinner: false,
          auctionId,
          dealRoomId: auction.deal_room_id,
          sellerId: auction.seller_id
        };
      }
      
      // Step 6: Handle winner scenario
      const winningBid = bidResult.rows[0];
      console.log(`[AuctionClose] Winning bid found: bidder=${winningBid.bidder_id}, amount=${winningBid.amount}`);
      
      // Create order for winner
      const orderQuery = `
        INSERT INTO orders
        (buyer_id, seller_id, total_amount, status, created_at, metadata)
        VALUES ($1, $2, $3, 'pending', NOW(), $4)
        RETURNING *
      `;
      const orderResult = await client.query(orderQuery, [
        winningBid.bidder_id,
        auction.seller_id,
        winningBid.amount,
        JSON.stringify({
          listing_id: auction.listing_id,
          listing_title: auction.listing_title,
          auction_id: auctionId,
          winning_bid_id: winningBid.id,
          order_type: 'auction'
        })
      ]);
      
      const order = orderResult.rows[0];
      console.log(`[AuctionClose] Order created: ${order.id} with listing_id: ${auction.listing_id}`);
      
      // Try to update auction with winner info (if migration has been applied)
      try {
        const updateWinnerQuery = `
          UPDATE auctions 
          SET winner_id = $1,
              winning_bid_id = $2,
              winning_amount = $3
          WHERE id = $4
        `;
        await client.query(updateWinnerQuery, [
          winningBid.bidder_id,
          winningBid.id,
          winningBid.amount,
          auctionId
        ]);
        console.log(`[AuctionClose] Updated auction with winner info`);
      } catch (error) {
        console.log(`[AuctionClose] Winner fields not available, skipping winner update`);
      }
      
      // Insert deal event for auction winner
      const eventQuery = `
        INSERT INTO deal_events
        (deal_room_id, actor_id, event_type, payload, created_at)
        VALUES ($1, $2, $3, $4, NOW())
      `;
      await client.query(eventQuery, [
        auction.deal_room_id,
        winningBid.bidder_id,
        'auction.winner',
        JSON.stringify({
          auctionId,
          amount: winningBid.amount,
          winningBidId: winningBid.id,
          orderId: order.id
        })
      ]);
      
      return {
        success: true,
        hasWinner: true,
        auctionId,
        dealRoomId: auction.deal_room_id,
        sellerId: auction.seller_id,
        winner: {
          id: winningBid.bidder_id,
          amount: winningBid.amount,
          bidId: winningBid.id,
          orderId: order.id
        }
      };
      
    } catch (error) {
      console.error(`[AuctionClose] Error in transaction:`, error);
      throw error;
    }
  });
};

/**
 * Socket.IO emitter for auction events
 * @param {Object} io - Socket.IO instance
 * @param {Object} result - Auction close result
 */
const emitAuctionEvents = async (io, result) => {
  const { dealRoomId, hasWinner, winner, auctionId, sellerId } = result;
  
  console.log(`[AuctionClose] Emitting socket events for deal room: ${dealRoomId}`);
  
  // Emit to deal room
  const payload = {
    type: 'auction.closed',
    auctionId,
    timestamp: new Date().toISOString()
  };
  
  if (hasWinner) {
    payload.winnerId = winner.id;
    payload.amount = winner.amount;
    payload.orderId = winner.orderId;
    console.log(`[AuctionClose] Auction closed with winner: ${winner.id}, amount: ${winner.amount}`);
  } else {
    payload.reason = 'no_bids';
    console.log(`[AuctionClose] Auction closed without bids`);
  }
  
  // Emit to deal room
  io.to(`deal:${dealRoomId}`).emit('auction.closed', payload);
  
  // Also emit to individual user rooms for direct notifications
  if (hasWinner) {
    io.to(`user:${winner.id}`).emit('auction.winner', payload);
  }
  io.to(`user:${sellerId}`).emit('auction.closed', payload);
  
  console.log(`[AuctionClose] Socket events emitted successfully`);
};

/**
 * Inngest workflow for auction auto-close
 */
const auctionCloseWorkflow = inngest.createFunction(
  {
    id: "auction-close-workflow",
    name: "Auction Auto-Close Workflow",
    retries: 3
  },
  {
    event: "auction.started"
  },
  async ({ event, step }) => {
    const { data: { auctionId, dealRoomId, endAt } } = event;
    
    console.log(`[AuctionClose] Workflow started for auction: ${auctionId}, ends at: ${endAt}`);
    
    // Sleep until auction end time
    await step.sleepUntil("wait-for-auction-end", new Date(endAt));
    
    console.log(`[AuctionClose] Auction time expired, processing: ${auctionId}`);
    
    // Close auction and select winner
    const result = await step.run("close-auction-and-pick-winner", async () => {
      return await closeAuctionAndPickWinner(auctionId);
    });
    
    // Handle idempotency - if auction already closed, exit safely
    if (!result.success) {
      console.log(`[AuctionClose] Auction close skipped: ${result.reason}`);
      return { 
        success: false, 
        reason: result.reason,
        auctionId 
      };
    }
    
    // Emit socket events directly (since Inngest workflow context doesn't have access to global socket)
    await step.run("emit-socket-events", async () => {
      console.log(`[AuctionClose] Socket.IO not available in workflow context, skipping socket emissions`);
      // Socket events will be emitted by the auction controller when state is checked
    });
    
    // Trigger payment flow if winner exists (same as offer.accepted)
    if (result.hasWinner) {
      await step.run("trigger-payment-flow", async () => {
        console.log(`[AuctionClose] Triggering payment flow for order: ${result.winner.orderId}`);
        
        // Send payment initiation event (same as offer.accepted)
        const { sendEvent } = require("../services/inngest");
        await sendEvent({
          name: "payment.initiated",
          data: {
            orderId: result.winner.orderId,
            dealRoomId: result.dealRoomId,
            buyerId: result.winner.id,
            sellerId: result.sellerId,
            amount: result.winner.amount,
            source: 'auction_winner'
          }
        });
      });
    }
    
    console.log(`[AuctionClose] Workflow completed for auction: ${auctionId}`);
    
    return {
      success: true,
      auctionId,
      hasWinner: result.hasWinner,
      winner: result.winner,
      dealRoomId: result.dealRoomId
    };
  }
);

module.exports = {
  auctionCloseWorkflow,
  closeAuctionAndPickWinner
};
