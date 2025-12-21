const { pool } = require("../database/db");

const createChat = async (userId, chatData) => {
  const { listing_id, participant_id } = chatData;

  // Check if chat already exists between these users for this listing
  const existingChatQuery = `
    SELECT c.id FROM chats c
    JOIN chat_participants cp ON c.id = cp.chat_id
    WHERE ((cp.participant1_id = $1 AND cp.participant2_id = $2) 
        OR (cp.participant1_id = $2 AND cp.participant2_id = $1))
    AND c.listing_id = $3
  `;

  const existingResult = await pool.query(existingChatQuery, [
    userId,
    participant_id,
    listing_id,
  ]);

  if (existingResult.rows.length > 0) {
    return await getChatById(userId, existingResult.rows[0].id);
  }

  await pool.query("BEGIN");

  try {
    // Create chat
    const chatQuery = `
      INSERT INTO chats (listing_id)
      VALUES ($1)
      RETURNING *
    `;

    const chatResult = await pool.query(chatQuery, [listing_id]);
    const chat = chatResult.rows[0];

    // Add participants with new participant1_id and participant2_id columns - single row approach
    const participantsQuery = `
      INSERT INTO chat_participants (chat_id, user_id, role, participant1_id, participant2_id)
      VALUES ($1, $2, 'participant', $2, $3)
      RETURNING *
    `;

    await pool.query(participantsQuery, [chat.id, userId, participant_id]);

    await pool.query("COMMIT");

    return await getChatById(userId, chat.id);
  } catch (error) {
    await pool.query("ROLLBACK");
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
    WHERE cp.participant1_id = $1 OR cp.participant2_id = $1
  `;

  const dataQuery = `
        SELECT c.id, c.listing_id, c.created_at,
          l.title as listing_title, li.url as listing_image,
          cp.last_read_at,
          (SELECT COUNT(*) FROM messages m WHERE m.chat_id = c.id AND m.is_read = false AND m.sender_id != $1) as unread_count,
          (SELECT m.body FROM messages m WHERE m.id = c.last_message_id) as last_message,
          (SELECT m.created_at FROM messages m WHERE m.id = c.last_message_id) as last_message_at,
          (SELECT p.name FROM users u JOIN messages m ON u.id = m.sender_id LEFT JOIN profiles p ON u.id = p.user_id WHERE m.id = c.last_message_id LIMIT 1) as last_message_sender,
          -- Determine other participant id from participant1/participant2 columns when stored in same row
          (CASE
            WHEN cp.participant1_id IS NOT NULL AND cp.participant1_id <> $1 THEN cp.participant1_id
            WHEN cp.participant2_id IS NOT NULL AND cp.participant2_id <> $1 THEN cp.participant2_id
            ELSE NULL
          END) as other_user_id,
          p2.name as other_user_name,
          p2.profile_picture_url as other_user_avatar
    FROM chat_participants cp
    JOIN chats c ON cp.chat_id = c.id
    -- Join users/profiles on computed other_user_id
    LEFT JOIN users u2 ON u2.id = (CASE WHEN cp.participant1_id IS NOT NULL AND cp.participant1_id <> $1 THEN cp.participant1_id WHEN cp.participant2_id IS NOT NULL AND cp.participant2_id <> $1 THEN cp.participant2_id ELSE NULL END)
    LEFT JOIN profiles p2 ON u2.id = p2.user_id
    LEFT JOIN listings l ON c.listing_id = l.id
    LEFT JOIN listing_images li ON l.id = li.listing_id AND li.is_primary = true
    WHERE cp.participant1_id = $1 OR cp.participant2_id = $1
    GROUP BY c.id, c.listing_id, c.created_at, l.title, li.url, cp.last_read_at, other_user_id, p2.name, p2.profile_picture_url
    ORDER BY COALESCE((SELECT m.created_at FROM messages m WHERE m.id = c.last_message_id), c.created_at) DESC
    LIMIT $2 OFFSET $3
  `;

  const [countResult, dataResult] = await Promise.all([
    pool.query(countQuery, [userId]),
    pool.query(dataQuery, [userId, limit, offset]),
  ]);

  console.log("Count query result:", countResult.rows[0]);
  console.log("Data query result rows:", dataResult.rows.length);
  console.log("Sample chat data:", dataResult.rows || "No chats found");

  const total = parseInt(countResult.rows[0].total);
  const totalPages = Math.ceil(total / limit);

  console.log("Final total:", total);
  console.log("Total pages:", totalPages);
  console.log("Returning chats:", dataResult.rows.length);

  return {
    chats: dataResult.rows,
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

const getChatById = async (userId, chatId) => {
  const query = `
        SELECT c.id, c.listing_id, c.created_at,
          l.title as listing_title, l.description as listing_description,
          li.url as listing_image, l.price as listing_price,
          cp.last_read_at,
          (SELECT COUNT(*) FROM messages m WHERE m.chat_id = c.id AND m.is_read = false AND m.sender_id != $1) as unread_count,
          (CASE
            WHEN cp.participant1_id IS NOT NULL AND cp.participant1_id <> $1 THEN cp.participant1_id
            WHEN cp.participant2_id IS NOT NULL AND cp.participant2_id <> $1 THEN cp.participant2_id
            ELSE NULL
          END) as other_user_id,
          p2.name as other_user_name,
          p2.profile_picture_url as other_user_avatar
    FROM chat_participants cp
    JOIN chats c ON cp.chat_id = c.id
    LEFT JOIN users u2 ON u2.id = (CASE WHEN cp.participant1_id IS NOT NULL AND cp.participant1_id <> $1 THEN cp.participant1_id WHEN cp.participant2_id IS NOT NULL AND cp.participant2_id <> $1 THEN cp.participant2_id ELSE NULL END)
    LEFT JOIN profiles p2 ON u2.id = p2.user_id
    LEFT JOIN listings l ON c.listing_id = l.id
    LEFT JOIN listing_images li ON l.id = li.listing_id AND li.is_primary = true
    WHERE (cp.participant1_id = $1 OR cp.participant2_id = $1) AND c.id = $2
  `;

  const result = await pool.query(query, [userId, chatId]);
  return result.rows[0] || null;
};

const sendMessage = async (senderId, chatId, messageData) => {
  const { body, attachments } = messageData;

  await pool.query("BEGIN");

  try {
    // Insert message
    const messageQuery = `
      INSERT INTO messages (chat_id, sender_id, body, attachments)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;

    const messageResult = await pool.query(messageQuery, [
      chatId,
      senderId,
      body,
      attachments,
    ]);
    const message = messageResult.rows[0];

    // Update chat's last message
    const updateChatQuery = `
      UPDATE chats 
      SET last_message_id = $1
      WHERE id = $2
    `;

    await pool.query(updateChatQuery, [message.id, chatId]);

    await pool.query("COMMIT");

    return message;
  } catch (error) {
    await pool.query("ROLLBACK");
    throw error;
  }
};

const getMessages = async (userId, chatId, options = {}) => {
  const { page = 1, limit = 50 } = options;
  const offset = (page - 1) * limit;

  // Verify user is participant
  const participantCheck = await pool.query(
    "SELECT 1 FROM chat_participants WHERE participant1_id = $1 OR participant2_id = $1 AND chat_id = $2",
    [userId, chatId]
  );

  if (participantCheck.rows.length === 0) {
    throw new Error("User is not a participant in this chat");
  }

  const countQuery = `
    SELECT COUNT(*) as total
    FROM messages m
    WHERE m.chat_id = $1
  `;

  const dataQuery = `
    SELECT m.id, m.body, m.attachments, m.is_read, m.is_system, m.created_at,
           u.id as sender_id, p.name as sender_name, p.avatar_key as sender_avatar
    FROM messages m
    JOIN users u ON m.sender_id = u.id
    LEFT JOIN profiles p ON u.id = p.user_id
    WHERE m.chat_id = $1
    ORDER BY m.created_at DESC
    LIMIT $2 OFFSET $3
  `;

  const [countResult, dataResult] = await Promise.all([
    pool.query(countQuery, [chatId]),
    pool.query(dataQuery, [chatId, limit, offset]),
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

const markMessagesAsRead = async (userId, messageIds) => {
  const placeholders = messageIds.map((_, index) => `$${index + 2}`).join(", ");

  const query = `
    UPDATE messages 
    SET is_read = true 
    WHERE id IN (${placeholders}) 
    AND chat_id IN (
      SELECT chat_id FROM chat_participants WHERE participant1_id = $1 OR participant2_id = $1
    )
  `;

  await pool.query(query, [userId, ...messageIds]);

  // Update participant's last_read_at
  const updateLastReadQuery = `
    UPDATE chat_participants 
    SET last_read_at = NOW()
    WHERE participant1_id = $1 OR participant2_id = $1
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
      SELECT chat_id FROM chat_participants WHERE participant1_id = $2 OR participant2_id = $2
    )
    RETURNING *
  `;

  const result = await pool.query(query, [messageId, userId]);

  if (result.rows.length === 0) {
    throw new Error("Message not found or not authorized to delete");
  }

  return result.rows[0];
};

const findChatByUsers = async (
  currentUserId,
  participantId,
  listingId = null
) => {

  // First, let's check what chats exist for these users without listing constraint
  const debugQuery = `
    SELECT c.id, c.listing_id, cp.participant1_id, cp.participant2_id
    FROM chats c
    JOIN chat_participants cp ON c.id = cp.chat_id
    WHERE (cp.participant1_id = $1 AND cp.participant2_id = $2) 
       OR (cp.participant1_id = $2 AND cp.participant2_id = $1)
  `;

  const debugResult = await pool.query(debugQuery, [
    currentUserId,
    participantId,
  ]);

  // Now the main query with listing constraint
  let query = `
    SELECT c.id FROM chats c
    JOIN chat_participants cp ON c.id = cp.chat_id
    WHERE ((cp.participant1_id = $1 AND cp.participant2_id = $2) 
       OR (cp.participant1_id = $2 AND cp.participant2_id = $1))
  `;

  const params = [currentUserId, participantId];

  if (listingId) {
    query += ` AND c.listing_id = $3`;
    params.push(listingId);
  }

  query += ` ORDER BY c.created_at DESC LIMIT 1`;

  console.log("Final query:", query);
  console.log("Query params:", params);

  const result = await pool.query(query, params);

  console.log("Query result rows:", result.rows);
  console.log("Query result row count:", result.rows.length);

  if (result.rows.length > 0) {
    console.log("Found chat ID:", result.rows[0].id);
    const chat = await getChatById(currentUserId, result.rows[0].id);
    console.log("Full chat data:", chat);
    return chat;
  }

  console.log("No chat found, returning null");
  return null;
};

module.exports = {
  createChat,
  getChatsByUser,
  getChatById,
  sendMessage,
  getMessages,
  markMessagesAsRead,
  deleteMessage,
  findChatByUsers,
};
