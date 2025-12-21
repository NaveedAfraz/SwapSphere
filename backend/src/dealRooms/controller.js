const { pool } = require("../database/db");
const {
  createDealRoom,
  getDealRoomsByUser,
  getDealRoomById,
  updateDealRoomState,
  findDealRoomByUsersAndListing,
} = require('./model');

const createDealRoomController = async (req, res) => {
  try {
    const userId = req.user.id;
    const { intent_id, listing_id, seller_id } = req.body;
    
    // Verify seller exists and get seller details
    const sellerQuery = `
      SELECT s.id, s.user_id FROM sellers s 
      WHERE s.id = $1
    `;
    const sellerResult = await pool.query(sellerQuery, [seller_id]);
    
    if (sellerResult.rows.length === 0) {
      return res.status(404).json({ error: 'Seller not found' });
    }
    
    // Verify listing exists and belongs to the seller
    const listingQuery = `
      SELECT l.id, l.seller_id FROM listings l 
      WHERE l.id = $1 AND l.seller_id = $2
    `;
    const listingResult = await pool.query(listingQuery, [listing_id, seller_id]);
    
    if (listingResult.rows.length === 0) {
      return res.status(404).json({ error: 'Listing not found or does not belong to seller' });
    }
    
    // Determine buyer_id based on whether this is an intent response
    let actualBuyerId = userId;
    
    if (intent_id) {
      // This is for an intent, get the original intent buyer
      const intentQuery = `
        SELECT buyer_id FROM intents WHERE id = $1
      `;
      const intentResult = await pool.query(intentQuery, [intent_id]);
      
      if (intentResult.rows.length === 0) {
        return res.status(404).json({ error: 'Intent not found' });
      }
      
      actualBuyerId = intentResult.rows[0].buyer_id;
    }
    
    const dealRoom = await createDealRoom({
      intent_id,
      listing_id,
      buyer_id: actualBuyerId,
      seller_id,
    });
    
    res.status(201).json(dealRoom);
  } catch (error) {
    console.error('Error creating deal room:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getDealRooms = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20, state } = req.query;
    
    
    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      state,
    };
    
    const result = await getDealRoomsByUser(userId, options);
    
    res.json(result);
  } catch (error) {
    console.error('Error getting deal rooms:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getDealRoom = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    
    const dealRoom = await getDealRoomById(id);
    
    if (!dealRoom) {
      return res.status(404).json({ error: 'Deal room not found' });
    }
    
    // Verify user is participant (buyer or seller)
    const isBuyer = dealRoom.buyer_id === userId;
    const isSeller = dealRoom.seller_user_id === userId;
    
    if (!isBuyer && !isSeller) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // Fetch latest offer for this deal room
    let latestOffer = null;
    const offerQuery = `
      SELECT o.id, o.offered_price, o.status, o.created_at, o.buyer_id, o.seller_id
      FROM offers o
      WHERE o.deal_room_id = $1
      ORDER BY o.created_at DESC
      LIMIT 1
    `;
    
    const offerResult = await pool.query(offerQuery, [id]);
    if (offerResult.rows.length > 0) {
      latestOffer = offerResult.rows[0];
    }
    
    // Fetch messages for this deal room
    const messagesQuery = `
      SELECT m.id, m.body, m.attachments, m.is_read, m.is_system, m.created_at,
             u.id as sender_id, p.name as sender_name, p.profile_picture_url as sender_avatar
      FROM messages m
      JOIN users u ON m.sender_id = u.id
      LEFT JOIN profiles p ON u.id = p.user_id
      WHERE m.deal_room_id = $1
      ORDER BY m.created_at ASC
      LIMIT 50
    `;
    
    const messagesResult = await pool.query(messagesQuery, [id]);
    
    // Fetch deal events for this deal room
    const eventsQuery = `
      SELECT de.id, de.event_type, de.payload, de.created_at,
             u.id as actor_id, p.name as actor_name
      FROM deal_events de
      LEFT JOIN users u ON de.actor_id = u.id
      LEFT JOIN profiles p ON u.id = p.user_id
      WHERE de.deal_room_id = $1
      ORDER BY de.created_at DESC
      LIMIT 20
    `;
    
    const eventsResult = await pool.query(eventsQuery, [id]);
    
    res.json({
      ...dealRoom,
      latest_offer: latestOffer,
      messages: messagesResult.rows,
      events: eventsResult.rows,
    });
  } catch (error) {
    console.error('Error getting deal room:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const findDealRoomController = async (req, res) => {
  try {
    const userId = req.user.id;
    const { seller_id, listing_id } = req.query;
    
    if (!seller_id || !listing_id) {
      return res.status(400).json({ error: 'seller_id and listing_id are required' });
    }
    
    // Verify listing exists and belongs to seller
    const listingQuery = `
      SELECT l.id, l.seller_id FROM listings l 
      WHERE l.id = $1 AND l.seller_id = $2
    `;
    const listingResult = await pool.query(listingQuery, [listing_id, seller_id]);
    
    if (listingResult.rows.length === 0) {
      return res.status(404).json({ error: 'Listing not found or does not belong to seller' });
    }
    
    const dealRoom = await findDealRoomByUsersAndListing(userId, seller_id, listing_id);
    
    if (!dealRoom) {
      return res.status(404).json({ error: 'Deal room not found' });
    }
    
    res.json(dealRoom);
  } catch (error) {
    console.error('Error finding deal room:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const updateDealRoomStateController = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { state, metadata } = req.body;
    
    // Verify deal room exists and user is participant
    const dealRoom = await getDealRoomById(id);
    
    if (!dealRoom) {
      return res.status(404).json({ error: 'Deal room not found' });
    }
    
    const isBuyer = dealRoom.buyer_id === userId;
    const isSeller = dealRoom.seller_user_id === userId;
    
    if (!isBuyer && !isSeller) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const updatedDealRoom = await updateDealRoomState(id, state, metadata || {});
    
    res.json(updatedDealRoom);
  } catch (error) {
    console.error('Error updating deal room state:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  createDealRoom: createDealRoomController,
  getDealRooms,
  getDealRoom,
  findDealRoom: findDealRoomController,
  updateDealRoomState: updateDealRoomStateController,
};
