const { query, transaction } = require('../database/db');

// Helper function to get highest bid for an auction
const getHighestBid = async (auctionId) => {
  const result = await query(
    `SELECT * FROM auction_bids 
     WHERE auction_id = $1 
     ORDER BY amount DESC 
     LIMIT 1`,
    [auctionId]
  );
  return result.rows[0] || null;
};

// Helper function to insert deal events
const insertDealEvent = async (client, dealRoomId, actorId, eventType, payload) => {
  await client.query(
    `INSERT INTO deal_events (deal_room_id, actor_id, event_type, payload, created_at)
     VALUES ($1, $2, $3, $4, NOW())`,
    [dealRoomId, actorId, eventType, JSON.stringify(payload)]
  );
};

// Helper function to check if user is seller in deal room
const isSellerInDealRoom = async (dealRoomId, userId) => {
  const result = await query(
    `SELECT dr.id, dr.listing_id, s.user_id as seller_user_id
     FROM deal_rooms dr 
     JOIN listings l ON dr.listing_id = l.id
     JOIN sellers s ON l.seller_id = s.id
     WHERE dr.id = $1 AND dr.room_type = 'direct' AND s.user_id = $2`,
    [dealRoomId, userId]
  );
  return result.rows[0] || null;
};

// Helper function to check if user is invited to auction
const isUserInvitedToAuction = async (auctionId, userId) => {
  const result = await query(
    `SELECT ai.*, drp.role
     FROM auction_invites ai
     JOIN deal_room_participants drp ON ai.auction_id = drp.deal_room_id AND ai.user_id = drp.user_id
     WHERE ai.auction_id = $1 AND ai.user_id = $2`,
    [auctionId, userId]
  );
  return result.rows[0] || null;
};

// Helper function to get auction with details
const getAuctionWithDetails = async (auctionId) => {
  // Get auction details
  const auctionResult = await query(
    `SELECT a.*, dr.id as deal_room_id, l.title as listing_title, s.user_id as seller_user_id,
              EXTRACT(EPOCH FROM (a.end_at - NOW())) as remaining_seconds
     FROM auctions a
     JOIN deal_rooms dr ON a.deal_room_id = dr.id
     JOIN listings l ON a.listing_id = l.id
     JOIN sellers s ON a.seller_id = s.id
     WHERE a.id = $1`,
    [auctionId]
  );
  
  if (auctionResult.rows.length === 0) {
    return null;
  }
  
  const auction = auctionResult.rows[0];
  
  // Get bids for this auction
  const bidsResult = await query(
    `SELECT ab.*, p.name as bidder_name, p.profile_picture_url as bidder_avatar
     FROM auction_bids ab
     LEFT JOIN profiles p ON ab.bidder_id = p.user_id
     WHERE ab.auction_id = $1
     ORDER BY ab.amount DESC, ab.created_at ASC`,
    [auctionId]
  );
  
  auction.bids = bidsResult.rows;
  
  // Calculate current highest bid
  if (bidsResult.rows.length > 0) {
    auction.current_highest_bid = Number(bidsResult.rows[0].amount);
  } else {
    auction.current_highest_bid = Number(auction.start_price);
  }
  
  return auction;
};

// Helper function to get auction participants
const getAuctionParticipants = async (dealRoomId) => {
  const result = await query(
    `SELECT DISTINCT ON (drp.user_id) drp.user_id, p.name, p.profile_picture_url as avatar_url, drp.role, drp.joined_at
     FROM deal_room_participants drp
     LEFT JOIN profiles p ON drp.user_id = p.user_id
     WHERE drp.deal_room_id = $1
     ORDER BY drp.user_id, drp.joined_at DESC`,
    [dealRoomId]
  );
  return result.rows;
};

// Atomic bid insertion with validation
const placeBidAtomic = async (client, auctionId, bidderId, amount) => {
  // First check current highest bid and auction state
  const auctionResult = await client.query(
    `SELECT a.state, a.min_increment, a.start_price,
            COALESCE(MAX(ab.amount), a.start_price) as current_highest_bid
     FROM auctions a
     LEFT JOIN auction_bids ab ON a.id = ab.auction_id
     WHERE a.id = $1 AND (a.state = 'active' OR a.state = 'setup')
     GROUP BY a.id, a.state, a.min_increment, a.start_price`,
    [auctionId]
  );

  if (auctionResult.rows.length === 0) {
    throw new Error('Auction not found or not active');
  }

  const auction = auctionResult.rows[0];
  const startPrice = Number(auction.start_price);
  const minIncrement = Number(auction.min_increment);
  const currentHighestBid = Number(auction.current_highest_bid);


  const minRequiredBid = Math.max(startPrice, currentHighestBid + minIncrement);

  if (amount < minRequiredBid) {
    throw new Error(`Bid must be at least $${minRequiredBid}`);
  }

  // Insert the bid
  const bidResult = await client.query(
    `INSERT INTO auction_bids (auction_id, bidder_id, amount, created_at)
     VALUES ($1, $2, $3, NOW())
     RETURNING *`,
    [auctionId, bidderId, amount]
  );

  return bidResult.rows[0];
};

module.exports = {
  getHighestBid,
  insertDealEvent,
  isSellerInDealRoom,
  isUserInvitedToAuction,
  getAuctionWithDetails,
  getAuctionParticipants,
  placeBidAtomic,
};