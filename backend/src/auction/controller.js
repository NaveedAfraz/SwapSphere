const { query, transaction } = require('../database/db');
const {
  getHighestBid,
  insertDealEvent,
  isSellerInDealRoom,
  isUserInvitedToAuction,
  getAuctionWithDetails,
  getAuctionParticipants,
  placeBidAtomic,
} = require('./model');
const { sendEvent } = require('../services/inngest');

// Start Auction from Direct Deal Room
const startAuction = async (req, res) => {
  const { directDealId } = req.params;
  const { startPrice, minIncrement, durationMinutes, inviteeIds } = req.body;
  const sellerId = req.user.id;


  try {
    // Validate input
    if (!startPrice || !minIncrement || !durationMinutes || !inviteeIds?.length) {
      return res.status(400).json({
        error: 'Missing required fields: startPrice, minIncrement, durationMinutes, inviteeIds'
      });
    }

    // Use transaction for atomic auction creation
    const result = await transaction(async (client) => {
      // 1. Verify seller is the seller in direct deal room
      const dealRoomInfo = await query(
        `SELECT dr.id, dr.listing_id, s.id as seller_record_id
         FROM deal_rooms dr
         JOIN listings l ON dr.listing_id = l.id
         JOIN sellers s ON l.seller_id = s.id
         WHERE dr.id = $1 AND dr.room_type = 'direct' AND s.user_id = $2`,
        [directDealId, sellerId]
      );

      if (dealRoomInfo.rows.length === 0) {
        throw new Error('You must be the seller to start an auction');
      }

      const { listing_id, seller_record_id } = dealRoomInfo.rows[0];

      // 2. Create new auction deal room
      const auctionRoomResult = await client.query(
        `INSERT INTO deal_rooms (listing_id, seller_id, buyer_id, room_type, current_state, created_at, updated_at)
         VALUES ($1, $2, $3, 'auction', 'negotiation', NOW(), NOW())
         RETURNING id`,
        [listing_id, seller_record_id, sellerId]
      );
      const auctionDealRoomId = auctionRoomResult.rows[0].id;

      // 3. Insert seller + invitees into deal_room_participants
      const allParticipants = [...new Set([sellerId, ...inviteeIds])]; // Use Set to ensure uniqueness
      for (const userId of allParticipants) {
        await client.query(
          `INSERT INTO deal_room_participants (deal_room_id, user_id, role, joined_at)
           VALUES ($1, $2, $3, NOW())
           ON CONFLICT (deal_room_id, user_id) DO NOTHING`,
          [auctionDealRoomId, userId, userId === sellerId ? 'seller' : 'buyer']
        );
      }

      // 4. Create auction
      const endAt = new Date(Date.now() + durationMinutes * 60 * 1000);
      const auctionResult = await client.query(
        `INSERT INTO auctions 
         (deal_room_id, listing_id, seller_id, start_price, min_increment, state, start_at, end_at, created_at)
         VALUES ($1, $2, $3, $4, $5, 'setup', NOW(), $6, NOW())
         RETURNING id`,
        [auctionDealRoomId, listing_id, seller_record_id, startPrice, minIncrement, endAt]
      );
      const auctionId = auctionResult.rows[0].id;

      // 5. Update deal room metadata with auction_id
      await client.query(
        `UPDATE deal_rooms 
         SET metadata = COALESCE(metadata, '{}') || $1
         WHERE id = $2`,
        [JSON.stringify({ auction_id: auctionId }), auctionDealRoomId]
      );

      // 6. Insert auction invites (include seller)
      const allInvitees = [...new Set([sellerId, ...inviteeIds])]; // Use Set to ensure uniqueness
      for (const inviteeId of allInvitees) {
        await client.query(
          `INSERT INTO auction_invites (auction_id, user_id)
           VALUES ($1, $2)
           ON CONFLICT (auction_id, user_id) DO NOTHING`,
          [auctionId, inviteeId]
        );
      }

      // 6. Update old direct deal rooms for same listing
      await client.query(
        `UPDATE deal_rooms 
         SET superseded_by_auction_id = $1, updated_at = NOW()
         WHERE listing_id = $2 AND room_type = 'direct' AND id != $3`,
        [auctionId, listing_id, directDealId]
      );

      // 7. Insert deal event: auction.started
      await insertDealEvent(
        client,
        auctionDealRoomId,
        sellerId,
        'auction.started',
        { auctionId, startPrice, minIncrement, durationMinutes, inviteeIds }
      );

      return { auctionDealRoomId, auctionId, endAt };
    });

    // 8. Emit socket events (after transaction commits)
    const { emitToDealRoom } = require('../socket/dealRoomSocketServer');
    if (result.auctionDealRoomId) {
      emitToDealRoom(result.auctionDealRoomId, 'auction:started', {
        auctionId: result.auctionId,
        dealRoomId: result.auctionDealRoomId,
        startPrice,
        minIncrement,
        endAt: result.endAt
      });
    }

    // Emit to old direct deal rooms
    emitToDealRoom(directDealId, 'room:superseded', {
      auctionId: result.auctionId,
      auctionDealId: result.auctionDealRoomId
    });

    // 9. Send Inngest event for auto-close
    await sendEvent({
      name: 'auction.started',
      data: {
        auctionId: result.auctionId,
        dealRoomId: result.auctionDealRoomId,
        endAt: result.endAt.toISOString()
      }
    });

    res.json({
      auctionRoomId: result.auctionDealRoomId,
      auctionId: result.auctionId
    });

  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Place Bid
const placeBid = async (req, res) => {
  const { id: auctionId } = req.params;
  const { amount } = req.body;
  const bidderId = req.user.id;


  try {
    // Validate input
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Bid amount must be greater than 0' });
    }

    // Use transaction for atomic bid placement
    const result = await transaction(async (client) => {
      // 1. Verify user is invited and auction is active
      const inviteCheck = await client.query(
        `SELECT ai.*, a.state, a.min_increment, a.start_price, a.deal_room_id
         FROM auction_invites ai
         JOIN auctions a ON ai.auction_id = a.id
         WHERE ai.auction_id = $1 AND ai.user_id = $2`,
        [auctionId, bidderId]
      );

      if (inviteCheck.rows.length === 0) {
        throw new Error('You are not invited to this auction');
      }

      const auction = inviteCheck.rows[0];
      if (auction.state !== 'active' && auction.state !== 'setup') {
        throw new Error('Auction is not active');
      }

      // 2. Place bid atomically with validation
      const bid = await placeBidAtomic(client, auctionId, bidderId, amount);

      // 3. Insert deal event
      await insertDealEvent(
        client,
        auction.deal_room_id,
        bidderId,
        'auction.bid',
        { auctionId, bidId: bid.id, amount }
      );

      return { bid, dealRoomId: auction.deal_room_id };
    });

    // 4. Emit socket event
    const { emitToDealRoom } = require('../socket/dealRoomSocketServer');
    
    try {
      // Get bidder profile info for socket emission
      const { query } = require('../database/db');
      const bidderProfile = await query(
        `SELECT p.name, p.profile_picture_url 
         FROM profiles p 
         WHERE p.user_id = $1`,
        [bidderId]
      );
      
      
      const bidWithProfile = {
        ...result.bid,
        bidder_name: bidderProfile.rows[0]?.name,
        bidder_avatar: bidderProfile.rows[0]?.profile_picture_url
      };
      
      
      emitToDealRoom(result.dealRoomId, 'auction:bid:update', {
        auctionId,
        bid: bidWithProfile,
        highestBid: amount
      });
      
    } catch (socketError) {
      // Continue without failing the bid placement
    }

    res.json({
      bid: result.bid,
      highestBid: amount
    });

  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Get Auction by Deal Room ID
const getAuctionByDealRoom = async (req, res) => {
  const { dealRoomId } = req.params;
  const userId = req.user?.id;

  try {
    // First get the auction ID from deal room metadata
    const dealRoomQuery = `
      SELECT metadata FROM deal_rooms 
      WHERE id = $1 AND room_type = 'auction'
    `;
    const dealRoomResult = await query(dealRoomQuery, [dealRoomId]);
    
    if (dealRoomResult.rows.length === 0) {
      return res.status(404).json({ error: 'Auction deal room not found' });
    }
    
    const metadata = dealRoomResult.rows[0].metadata;
    const auctionId = metadata?.auction_id;
    
    if (!auctionId) {
      return res.status(404).json({ error: 'Auction ID not found in deal room metadata' });
    }
    
    
    // Now get the auction details
    const auction = await getAuctionWithDetails(auctionId);
    if (!auction) {
      return res.status(404).json({ error: 'Auction not found' });
    }

    // Get highest bid
    const highestBid = await getHighestBid(auctionId);

    // Get participants (always return for now for debugging)
    let participants = [];
    // TODO: Remove this debug code and fix authentication
    console.log('Fetching participants for deal room:', auction.deal_room_id);
    participants = await getAuctionParticipants(auction.deal_room_id);
    console.log('Participants found:', participants.length, participants);

    // Calculate remaining time
    const remainingSeconds = Math.max(0, Math.floor(auction.remaining_seconds));

    res.json({
      auction: {
        id: auction.id,
        dealRoomId: auction.deal_room_id,
        listingId: auction.listing_id,
        listingTitle: auction.listing_title,
        startPrice: auction.start_price,
        minIncrement: auction.min_increment,
        currentHighestBid: auction.current_highest_bid,
        state: auction.state,
        startAt: auction.start_at,
        endAt: auction.end_at,
        sellerId: auction.seller_id,
        seller_user_id: auction.seller_user_id,
        remainingSeconds,
        bids: auction.bids || [], // Include bids from getAuctionWithDetails
      },
      highestBid: highestBid ? {
        id: highestBid.id,
        amount: highestBid.amount,
        bidderId: highestBid.bidder_id,
        createdAt: highestBid.created_at
      } : null,
      participants: participants.map(p => ({
        userId: p.user_id,
        name: p.name,
        avatarUrl: p.avatar_url,
        role: p.role,
        joinedAt: p.created_at
      }))
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get Auction State
const getAuction = async (req, res) => {
  const { id: auctionId } = req.params;
  const userId = req.user?.id;

  try {
    // Get auction details
    const auction = await getAuctionWithDetails(auctionId);
    if (!auction) {
      return res.status(404).json({ error: 'Auction not found' });
    }

    // Get highest bid
    const highestBid = await getHighestBid(auctionId);

    // Get participants (always return for now for debugging)
    let participants = [];
    // TODO: Remove this debug code and fix authentication
    console.log('Fetching participants for deal room:', auction.deal_room_id);
    participants = await getAuctionParticipants(auction.deal_room_id);
    console.log('Participants found:', participants.length, participants);
    
    // Original logic (commented out for debugging)
    // if (userId) {
    //   const isInvited = await isUserInvitedToAuction(auctionId, userId);
    //   if (isInvited) {
    //     participants = await getAuctionParticipants(auction.deal_room_id);
    //   }
    // }

    // Calculate remaining time
    const remainingSeconds = Math.max(0, Math.floor(auction.remaining_seconds));

    res.json({
      auction: {
        id: auction.id,
        dealRoomId: auction.deal_room_id,
        listingId: auction.listing_id,
        listingTitle: auction.listing_title,
        sellerId: auction.seller_id,
        startPrice: parseFloat(auction.start_price),
        minIncrement: parseFloat(auction.min_increment),
        state: auction.state,
        startAt: auction.start_at,
        endAt: auction.end_at,
        remainingSeconds
      },
      highestBid: highestBid ? {
        id: highestBid.id,
        amount: parseFloat(highestBid.amount),
        bidderId: highestBid.bidder_id,
        createdAt: highestBid.created_at
      } : null,
      participants: participants.map(p => ({
        userId: p.user_id,
        name: p.name,
        avatarUrl: p.avatar_url,
        role: p.role,
        joinedAt: p.created_at
      }))
    });

  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch auction' });
  }
};

// Cancel Auction (Seller only)
const cancelAuction = async (req, res) => {
  const { id: auctionId } = req.params;
  const sellerId = req.user.id;

  try {
    const result = await transaction(async (client) => {
      // Verify seller owns this auction
      const auctionCheck = await client.query(
        `SELECT a.*, s.user_id as seller_user_id
         FROM auctions a
         JOIN sellers s ON a.seller_id = s.id
         WHERE a.id = $1`,
        [auctionId]
      );

      if (auctionCheck.rows.length === 0) {
        throw new Error('Auction not found');
      }

      const auction = auctionCheck.rows[0];
      if (auction.seller_user_id !== sellerId) {
        throw new Error('Only the seller can cancel this auction');
      }

      if (auction.state === 'ended' || auction.state === 'cancelled') {
        throw new Error('Auction cannot be cancelled');
      }

      // Update auction state
      await client.query(
        `UPDATE auctions 
         SET state = 'cancelled', updated_at = NOW()
         WHERE id = $1`,
        [auctionId]
      );

      // Insert deal event
      await insertDealEvent(
        client,
        auction.deal_room_id,
        sellerId,
        'auction.cancelled',
        { auctionId }
      );

      return auction;
    });

    // Emit socket event
    const { emitToDealRoom } = require('../socket/dealRoomSocketServer');
    emitToDealRoom(result.deal_room_id, 'auction:cancelled', {
      auctionId,
      dealRoomId: result.deal_room_id
    });

    res.json({ message: 'Auction cancelled successfully' });

  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

module.exports = {
  startAuction,
  placeBid,
  getAuction,
  getAuctionByDealRoom,
  cancelAuction,
};
