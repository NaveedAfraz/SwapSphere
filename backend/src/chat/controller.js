const { pool } = require("../database/db");
const { 
  createChat,
  getChatsByUser,
  getChatById,
  sendMessage,
  getMessages,
  markMessagesAsRead,
  deleteMessage,
  findChatByUsers
} = require('./model');

const createChatController = async (req, res) => {
  try {
    const userId = req.user.id;
    const { listing_id, participant_id } = req.body;
    
    const chat = await createChat(userId, { listing_id, participant_id });
    
    res.status(201).json(chat);
  } catch (error) {
    console.error('Error creating chat:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getChats = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20 } = req.query;
    
    const options = {
      page: parseInt(page),
      limit: parseInt(limit)
    };
    
    const result = await getChatsByUser(userId, options);
    
    res.json(result);
  } catch (error) {
    console.error('Error getting chats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getChat = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    
    const chat = await getChatById(userId, id);
    
    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }
    
    // Fetch listing price and user's latest offer for this listing
    let listingPrice = null;
    let userOffer = null;
    
    if (chat.listing_id) {
      // Fetch listing price and user's latest offer for this listing
      
      const offerQuery = `
        SELECT 
          l.price as listing_price,
          o.id as offer_id,
          o.offered_price as user_offered_price,
          o.status as offer_status,
          o.created_at as offer_created_at,
          o.buyer_id,
          o.seller_id,
          s.user_id as seller_user_id
        FROM listings l
        LEFT JOIN offers o ON l.id = o.listing_id AND (
          o.buyer_id = $1 OR 
          (SELECT s2.user_id FROM sellers s2 WHERE s2.id = o.seller_id) = $1
        )
        LEFT JOIN sellers s ON o.seller_id = s.id
        WHERE l.id = $2
        ORDER BY o.created_at DESC
        LIMIT 1
      `;
      
      const offerResult = await pool.query(offerQuery, [userId, chat.listing_id]);
      
            
      if (offerResult.rows.length > 0) {
        const row = offerResult.rows[0];
        listingPrice = row.listing_price;
        if (row.user_offered_price) {
          userOffer = {
            id: row.offer_id,
            price: row.user_offered_price,
            status: row.offer_status,
            created_at: row.offer_created_at,
            buyer_id: row.buyer_id,
            seller_id: row.seller_id,
            seller_user_id: row.seller_user_id
          };
        }
      }
    }
    
    // Also fetch messages for this chat
    const messages = await getMessages(userId, id, { page: 1, limit: 50 });
    
    // Return chat with listing price, user offer, and messages
    res.json({
      ...chat,
      listing_price: listingPrice,
      user_offer: userOffer,
      messages: messages.messages || []
    });
  } catch (error) {
    console.error('Error getting chat:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const findChatByUsersController = async (req, res) => {
  try {
    console.log("=== FIND CHAT BY USERS CONTROLLER ===");
    console.log("Query params:", req.query);
    console.log("User from auth middleware:", req.user);
    
    const { participant1_id, participant2_id, listing_id } = req.query;
    
    // Support both old format (participant_id) and new format (participant1_id & participant2_id)
    const participant1 = participant1_id || req.user.id;
    const participant2 = participant2_id || req.query.participant_id;
    
    console.log("Final participant1:", participant1);
    console.log("Final participant2:", participant2);
    console.log("Listing ID:", listing_id);
    
    if (!participant1 || !participant2) {
      console.log("Missing participant IDs");
      return res.status(400).json({ error: 'Both participant IDs are required' });
    }
    
    if (participant1 === participant2) {
      console.log("Same participant IDs provided");
      return res.status(400).json({ error: 'Participants must be different users' });
    }
    
    console.log("Calling findChatByUsers model function...");
    const chat = await findChatByUsers(participant1, participant2, listing_id);
    
    console.log("Find chat result:", chat);
    
    if (!chat) {
      console.log("No chat found");
      return res.status(404).json({ error: 'Chat not found' });
    }
    
    // Fetch offer data for this chat like in getChat
    let userOffer = null;
    if (chat.listing_id) {
      const offerQuery = `
        SELECT 
          o.id as offer_id,
          o.offered_price as user_offered_price,
          o.status as offer_status,
          o.created_at as offer_created_at,
          o.buyer_id,
          o.seller_id
        FROM offers o
        WHERE o.listing_id = $1 AND (
          o.buyer_id = $2 OR 
          (SELECT s.user_id FROM sellers s WHERE s.id = o.seller_id) = $2
        )
        ORDER BY o.created_at DESC
        LIMIT 1
      `;
      
      const offerResult = await pool.query(offerQuery, [chat.listing_id, participant1]);
      
      if (offerResult.rows.length > 0) {
        const row = offerResult.rows[0];
        if (row.user_offered_price) {
          userOffer = {
            id: row.offer_id,
            price: row.user_offered_price,
            status: row.offer_status,
            created_at: row.offer_created_at,
            buyer_id: row.buyer_id
          };
        }
      }
    }
    
    // Add offer data to chat response
    const enrichedChat = {
      ...chat,
      user_offer: userOffer
    };
    
        res.json(enrichedChat);
  } catch (error) {
    console.error('Error finding chat by users:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const sendMessageController = async (req, res) => {
  try {
    const senderId = req.user.id;
    const { id } = req.params;
    const { body, attachments } = req.body;
    
    // Verify user is participant in chat
    const chat = await getChatById(senderId, id);
    
    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }
    
    const message = await sendMessage(senderId, id, { body, attachments });
    
    res.status(201).json(message);
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getChatMessages = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { page = 1, limit = 50 } = req.query;
    
    // Verify user is participant in chat
    const chat = await getChatById(userId, id);
    
    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }
    
    const options = {
      page: parseInt(page),
      limit: parseInt(limit)
    };
    
    const result = await getMessages(userId, id, options);
    
    res.json(result);
  } catch (error) {
    console.error('Error getting messages:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const markAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { messageIds } = req.body;
    
    // Verify user is participant in chat
    const chat = await getChatById(userId, id);
    
    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }
    
    await markMessagesAsRead(userId, messageIds);
    
    res.json({ message: 'Messages marked as read' });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const deleteMessageController = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id, messageId } = req.params;
    
    // Verify user is participant in chat
    const chat = await getChatById(userId, id);
    
    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }
    
    await deleteMessage(userId, messageId);
    
    res.json({ message: 'Message deleted successfully' });
  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  createChat: createChatController,
  getChats,
  getChat,
  findChatByUsers: findChatByUsersController,
  sendMessage: sendMessageController,
  getChatMessages,
  markAsRead,
  deleteMessage: deleteMessageController,
};
