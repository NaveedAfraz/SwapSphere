const { pool } = require("../database/db");

const sendMessage = async (senderId, dealRoomId, messageData) => {
  const { body, attachments, is_system = false } = messageData;

  // Verify user has access to this deal room
  const dealRoomCheck = await pool.query(`
    SELECT dr.id, dr.buyer_id, s.user_id as seller_user_id
    FROM deal_rooms dr
    LEFT JOIN sellers s ON dr.seller_id = s.id
    WHERE dr.id = $1 AND (dr.buyer_id = $2 OR s.user_id = $2)
  `, [dealRoomId, senderId]);

  if (dealRoomCheck.rows.length === 0) {
    throw new Error("User is not a participant in this deal room");
  }

  await pool.query("BEGIN");

  try {
    // Insert message with deal_room_id and null chat_id for deal room messages
    const messageQuery = `
      INSERT INTO messages (deal_room_id, chat_id, sender_id, body, attachments, is_system)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;

    const messageResult = await pool.query(messageQuery, [
      dealRoomId,
      null, // chat_id is null for deal room messages
      senderId,
      body,
      attachments,
      is_system,
    ]);
    const message = messageResult.rows[0];

    await pool.query("COMMIT");

    return message;
  } catch (error) {
    await pool.query("ROLLBACK");
    throw error;
  }
};

const getMessages = async (userId, dealRoomId, options = {}) => {
  const { page = 1, limit = 50 } = options;
  const offset = (page - 1) * limit;

  // Verify user has access to this deal room
  const dealRoomCheck = await pool.query(`
    SELECT dr.id, dr.buyer_id, s.user_id as seller_user_id
    FROM deal_rooms dr
    LEFT JOIN sellers s ON dr.seller_id = s.id
    WHERE dr.id = $1 AND (dr.buyer_id = $2 OR s.user_id = $2)
  `, [dealRoomId, userId]);

  if (dealRoomCheck.rows.length === 0) {
    throw new Error("User is not a participant in this deal room");
  }

  const countQuery = `
    SELECT COUNT(*) as total
    FROM messages m
    WHERE m.deal_room_id = $1
  `;

  const dataQuery = `
    SELECT DISTINCT m.id, m.deal_room_id, m.body, m.attachments, m.is_read, m.is_system, m.created_at,
           u.id as sender_id, p.name as sender_name, p.profile_picture_url as sender_avatar
    FROM messages m
    JOIN users u ON m.sender_id = u.id
    LEFT JOIN profiles p ON u.id = p.user_id
    WHERE m.deal_room_id = $1
    ORDER BY m.created_at DESC
    LIMIT $2 OFFSET $3
  `;

  const [countResult, dataResult] = await Promise.all([
    pool.query(countQuery, [dealRoomId]),
    pool.query(dataQuery, [dealRoomId, limit, offset]),
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
      hasPrev: page > 1,
    },
  };
};

const markMessagesAsRead = async (userId, messageIds, dealRoomId) => {
  // Verify user has access to this deal room
  const dealRoomCheck = await pool.query(`
    SELECT dr.id, dr.buyer_id, s.user_id as seller_user_id
    FROM deal_rooms dr
    LEFT JOIN sellers s ON dr.seller_id = s.id
    WHERE dr.id = $1 AND (dr.buyer_id = $2 OR s.user_id = $2)
  `, [dealRoomId, userId]);

  if (dealRoomCheck.rows.length === 0) {
    throw new Error("User is not a participant in this deal room");
  }

  const placeholders = messageIds.map((_, index) => `$${index + 3}`).join(", ");

  const query = `
    UPDATE messages 
    SET is_read = true 
    WHERE id IN (${placeholders}) 
    AND deal_room_id = $1
    AND sender_id != $2
  `;

  await pool.query(query, [dealRoomId, userId, ...messageIds]);
};

const deleteMessage = async (userId, messageId) => {
  const query = `
    DELETE FROM messages 
    WHERE id = $1 
    AND sender_id = $2
    AND deal_room_id IN (
      SELECT dr.id FROM deal_rooms dr
      LEFT JOIN sellers s ON dr.seller_id = s.id
      WHERE dr.id = messages.deal_room_id AND (dr.buyer_id = $2 OR s.user_id = $2)
    )
    RETURNING *
  `;

  const result = await pool.query(query, [messageId, userId]);

  if (result.rows.length === 0) {
    throw new Error("Message not found or not authorized to delete");
  }

  return result.rows[0];
};

const getUnreadMessageCount = async (userId, dealRoomId = null) => {
  let query = `
    SELECT COUNT(*) as unread_count
    FROM messages m
    JOIN deal_rooms dr ON m.deal_room_id = dr.id
    LEFT JOIN sellers s ON dr.seller_id = s.id
    WHERE m.is_read = false 
    AND m.sender_id != $1
    AND (dr.buyer_id = $1 OR s.user_id = $1)
  `;

  const params = [userId];

  if (dealRoomId) {
    query += ` AND m.deal_room_id = $2`;
    params.push(dealRoomId);
  }

  const result = await pool.query(query, params);
  return parseInt(result.rows[0].unread_count);
};

module.exports = {
  sendMessage,
  getMessages,
  markMessagesAsRead,
  deleteMessage,
  getUnreadMessageCount,
};
