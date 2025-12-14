const pool = require('../database/connection');

const createChat = async (userId, chatData) => {
  const { listing_id, participant_id } = chatData;
  
  // Check if chat already exists between these users for this listing
  const existingChatQuery = `
    SELECT c.id FROM chats c
    JOIN chat_participants cp1 ON c.id = cp1.chat_id
    JOIN chat_participants cp2 ON c.id = cp2.chat_id
    WHERE cp1.user_id = $1 AND cp2.user_id = $2 AND c.listing_id = $3
    AND cp1.user_id != cp2.user_id
  `;
  
  const existingResult = await pool.query(existingChatQuery, [userId, participant_id, listing_id]);
  
  if (existingResult.rows.length > 0) {
    return await getChatById(userId, existingResult.rows[0].id);
  }
  
  await pool.query('BEGIN');
  
  try {
    // Create chat
    const chatQuery = `
      INSERT INTO chats (listing_id)
      VALUES ($1)
      RETURNING *
    `;
    
    const chatResult = await pool.query(chatQuery, [listing_id]);
    const chat = chatResult.rows[0];
    
    // Add participants
    const participantsQuery = `
      INSERT INTO chat_participants (chat_id, user_id, role)
      VALUES ($1, $2, 'participant'), ($1, $3, 'participant')
      RETURNING *
    `;
    
    await pool.query(participantsQuery, [chat.id, userId, participant_id]);
    
    await pool.query('COMMIT');
    
    return await getChatById(userId, chat.id);
  } catch (error) {
    await pool.query('ROLLBACK');
    throw error;
  }
};

const getChatsByUser = async (userId, options = {}) => {
  const { page = 1, limit = 20 } = options;
  const offset = (page - 1) * limit;
  
  const countQuery = `
    SELECT COUNT(*) as total
    FROM chat_participants cp
    JOIN chats c ON cp.chat_id = c.id
    WHERE cp.user_id = $1
  `;
  
  const dataQuery = `
    SELECT c.id, c.listing_id, c.created_at,
           l.title as listing_title, li.url as listing_image,
           cp.last_read_at,
           (SELECT COUNT(*) FROM messages m WHERE m.chat_id = c.id AND m.is_read = false AND m.sender_id != $1) as unread_count,
           (SELECT m.body FROM messages m WHERE m.id = c.last_message_id) as last_message,
           (SELECT m.created_at FROM messages m WHERE m.id = c.last_message_id) as last_message_at,
           (SELECT u.name FROM users u JOIN messages m ON u.id = m.sender_id WHERE m.id = c.last_message_id) as last_message_sender
    FROM chat_participants cp
    JOIN chats c ON cp.chat_id = c.id
    LEFT JOIN listings l ON c.listing_id = l.id
    LEFT JOIN listing_images li ON l.id = li.listing_id AND li.is_primary = true
    WHERE cp.user_id = $1
    ORDER BY COALESCE(c.last_message_id, c.created_at) DESC
    LIMIT $2 OFFSET $3
  `;
  
  const [countResult, dataResult] = await Promise.all([
    pool.query(countQuery, [userId]),
    pool.query(dataQuery, [userId, limit, offset])
  ]);
  
  const total = parseInt(countResult.rows[0].total);
  const totalPages = Math.ceil(total / limit);
  
  return {
    chats: dataResult.rows,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1
    }
  };
};

const getChatById = async (userId, chatId) => {
  const query = `
    SELECT c.id, c.listing_id, c.created_at,
           l.title as listing_title, l.description as listing_description,
           li.url as listing_image, l.price as listing_price,
           cp.last_read_at,
           (SELECT COUNT(*) FROM messages m WHERE m.chat_id = c.id AND m.is_read = false AND m.sender_id != $1) as unread_count
    FROM chat_participants cp
    JOIN chats c ON cp.chat_id = c.id
    LEFT JOIN listings l ON c.listing_id = l.id
    LEFT JOIN listing_images li ON l.id = li.listing_id AND li.is_primary = true
    WHERE cp.user_id = $1 AND c.id = $2
  `;
  
  const result = await pool.query(query, [userId, chatId]);
  return result.rows[0] || null;
};

const sendMessage = async (senderId, chatId, messageData) => {
  const { body, attachments } = messageData;
  
  await pool.query('BEGIN');
  
  try {
    // Insert message
    const messageQuery = `
      INSERT INTO messages (chat_id, sender_id, body, attachments)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    
    const messageResult = await pool.query(messageQuery, [chatId, senderId, body, attachments]);
    const message = messageResult.rows[0];
    
    // Update chat's last message
    const updateChatQuery = `
      UPDATE chats 
      SET last_message_id = $1
      WHERE id = $2
    `;
    
    await pool.query(updateChatQuery, [message.id, chatId]);
    
    await pool.query('COMMIT');
    
    return message;
  } catch (error) {
    await pool.query('ROLLBACK');
    throw error;
  }
};

const getMessages = async (userId, chatId, options = {}) => {
  const { page = 1, limit = 50 } = options;
  const offset = (page - 1) * limit;
  
  // Verify user is participant
  const participantCheck = await pool.query(
    'SELECT 1 FROM chat_participants WHERE user_id = $1 AND chat_id = $2',
    [userId, chatId]
  );
  
  if (participantCheck.rows.length === 0) {
    throw new Error('User is not a participant in this chat');
  }
  
  const countQuery = `
    SELECT COUNT(*) as total
    FROM messages m
    WHERE m.chat_id = $1
  `;
  
  const dataQuery = `
    SELECT m.id, m.body, m.attachments, m.is_read, m.is_system, m.created_at,
           u.name as sender_name, u.id as sender_id, p.avatar_key as sender_avatar
    FROM messages m
    JOIN users u ON m.sender_id = u.id
    LEFT JOIN profiles p ON u.id = p.user_id
    WHERE m.chat_id = $1
    ORDER BY m.created_at DESC
    LIMIT $2 OFFSET $3
  `;
  
  const [countResult, dataResult] = await Promise.all([
    pool.query(countQuery, [chatId]),
    pool.query(dataQuery, [chatId, limit, offset])
  ]);
  
  const total = parseInt(countResult.rows[0].total);
  const totalPages = Math.ceil(total / limit);
  
  return {
    messages: dataResult.rows.reverse(), // Reverse to show oldest first
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1
    }
  };
};

const markMessagesAsRead = async (userId, messageIds) => {
  const placeholders = messageIds.map((_, index) => `$${index + 2}`).join(', ');
  
  const query = `
    UPDATE messages 
    SET is_read = true 
    WHERE id IN (${placeholders}) 
    AND chat_id IN (
      SELECT chat_id FROM chat_participants WHERE user_id = $1
    )
  `;
  
  await pool.query(query, [userId, ...messageIds]);
  
  // Update participant's last_read_at
  const updateLastReadQuery = `
    UPDATE chat_participants 
    SET last_read_at = NOW()
    WHERE user_id = $1
    AND chat_id = (
      SELECT chat_id FROM messages WHERE id = ANY($2::uuid[]) LIMIT 1
    )
  `;
  
  await pool.query(updateLastReadQuery, [userId, messageIds]);
};

const deleteMessage = async (userId, messageId) => {
  const query = `
    DELETE FROM messages 
    WHERE id = $1 
    AND sender_id = $2
    AND chat_id IN (
      SELECT chat_id FROM chat_participants WHERE user_id = $2
    )
    RETURNING *
  `;
  
  const result = await pool.query(query, [messageId, userId]);
  
  if (result.rows.length === 0) {
    throw new Error('Message not found or not authorized to delete');
  }
  
  return result.rows[0];
};

module.exports = {
  createChat,
  getChatsByUser,
  getChatById,
  sendMessage,
  getMessages,
  markMessagesAsRead,
  deleteMessage
};
