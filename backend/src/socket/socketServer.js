const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const pool = require('../database/db');

// Socket.IO server setup
const setupSocketIO = (server) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || "http://localhost:3000",
      methods: ["GET", "POST"],
      credentials: true
    }
  });

  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication error'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const userQuery = 'SELECT id, email FROM users WHERE id = $1 AND is_active = true';
      const result = await pool.query(userQuery, [decoded.userId]);
      
      if (result.rows.length === 0) {
        return next(new Error('User not found'));
      }

      socket.userId = decoded.userId;
      socket.userEmail = result.rows[0].email;
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  // Connection handler
  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.userId} (${socket.userEmail})`);

    // Join user to their personal room for direct messages
    socket.join(`user:${socket.userId}`);

    // Handle joining chat rooms
    socket.on('join_chat', async (chatId) => {
      try {
        // Verify user is participant in this chat
        const participantQuery = `
          SELECT cp.id FROM chat_participants cp 
          WHERE cp.chat_id = $1 AND cp.user_id = $2
        `;
        const result = await pool.query(participantQuery, [chatId, socket.userId]);
        
        if (result.rows.length > 0) {
          socket.join(`chat:${chatId}`);
          socket.emit('joined_chat', { chatId });
          console.log(`User ${socket.userId} joined chat ${chatId}`);
        } else {
          socket.emit('error', { message: 'Not authorized to join this chat' });
        }
      } catch (error) {
        socket.emit('error', { message: 'Failed to join chat' });
      }
    });

    // Handle leaving chat rooms
    socket.on('leave_chat', (chatId) => {
      socket.leave(`chat:${chatId}`);
      socket.emit('left_chat', { chatId });
      console.log(`User ${socket.userId} left chat ${chatId}`);
    });

    // Handle sending messages
    socket.on('send_message', async (data) => {
      try {
        const { chatId, body, attachments = [] } = data;

        // Verify user is participant in this chat
        const participantQuery = `
          SELECT cp.id FROM chat_participants cp 
          WHERE cp.chat_id = $1 AND cp.user_id = $2
        `;
        const participantResult = await pool.query(participantQuery, [chatId, socket.userId]);
        
        if (participantResult.rows.length === 0) {
          socket.emit('error', { message: 'Not authorized to send messages in this chat' });
          return;
        }

        // Create message
        const messageQuery = `
          INSERT INTO messages (chat_id, sender_id, body, attachments, is_read, is_system, created_at)
          VALUES ($1, $2, $3, $4, false, false, NOW())
          RETURNING *
        `;
        const messageResult = await pool.query(messageQuery, [chatId, socket.userId, body, JSON.stringify(attachments)]);
        const newMessage = messageResult.rows[0];

        // Get sender info
        const senderQuery = `
          SELECT u.id, u.email, p.name, p.profile_picture_url
          FROM users u
          LEFT JOIN profiles p ON u.id = p.user_id
          WHERE u.id = $1
        `;
        const senderResult = await pool.query(senderQuery, [socket.userId]);
        newMessage.sender = senderResult.rows[0];

        // Update chat's last_message_id
        const updateChatQuery = `
          UPDATE chats SET last_message_id = $1 WHERE id = $2
        `;
        await pool.query(updateChatQuery, [newMessage.id, chatId]);

        // Broadcast message to all participants in the chat
        io.to(`chat:${chatId}`).emit('new_message', newMessage);
        console.log(`Message sent in chat ${chatId} by ${socket.userId}`);

      } catch (error) {
        console.error('Error sending message:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Handle typing indicators
    socket.on('typing_start', (chatId) => {
      socket.to(`chat:${chatId}`).emit('user_typing', {
        userId: socket.userId,
        chatId,
        isTyping: true
      });
    });

    socket.on('typing_stop', (chatId) => {
      socket.to(`chat:${chatId}`).emit('user_typing', {
        userId: socket.userId,
        chatId,
        isTyping: false
      });
    });

    // Handle marking messages as read
    socket.on('mark_read', async (data) => {
      try {
        const { chatId, messageIds } = data;

        // Update messages as read for this user
        const updateQuery = `
          UPDATE messages 
          SET is_read = true, read_at = NOW()
          WHERE chat_id = $1 AND id = ANY($2) AND sender_id != $3
        `;
        await pool.query(updateQuery, [chatId, messageIds, socket.userId]);

        // Notify other participants
        socket.to(`chat:${chatId}`).emit('messages_read', {
          userId: socket.userId,
          chatId,
          messageIds
        });

      } catch (error) {
        console.error('Error marking messages as read:', error);
        socket.emit('error', { message: 'Failed to mark messages as read' });
      }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.userId} (${socket.userEmail})`);
    });

    // Handle errors
    socket.on('error', (error) => {
      console.error(`Socket error for user ${socket.userId}:`, error);
    });
  });

  return io;
};

module.exports = setupSocketIO;
