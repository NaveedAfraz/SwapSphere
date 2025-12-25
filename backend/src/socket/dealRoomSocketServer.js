const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const pool = require('../database/db');
const { createDealEvent, createMessageEvent } = require('../dealEvents/model');

// Socket.IO server setup for deal rooms
// Global IO instance for external access
let globalIO = null;

const setupDealRoomSocketIO = (server) => {
  // Create and store the global IO instance for external access
  globalIO = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || "*", // Allow all origins for development
      methods: ["GET", "POST"],
      credentials: true
    }
  });

  const io = globalIO;

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

    // Join user to their personal room for direct messages
    socket.join(`user:${socket.userId}`);

    // Handle joining deal rooms
    socket.on('join_deal_room', async (dealRoomId) => {
      try {
        // Verify user is participant in this deal room
        const participantQuery = `
          SELECT dr.id FROM deal_rooms dr
          LEFT JOIN sellers s ON dr.seller_id = s.id
          WHERE dr.id = $1 AND (dr.buyer_id = $2 OR s.user_id = $2)
        `;
        const result = await pool.query(participantQuery, [dealRoomId, socket.userId]);
        
        if (result.rows.length > 0) {
          socket.join(`deal_room:${dealRoomId}`);
          socket.emit('joined_deal_room', { dealRoomId });
        } else {
          socket.emit('error', { message: 'Not authorized to join this deal room' });
        }
      } catch (error) {
        socket.emit('error', { message: 'Failed to join deal room' });
      }
    });

    // Handle leaving deal rooms
    socket.on('leave_deal_room', (dealRoomId) => {
      socket.leave(`deal_room:${dealRoomId}`);
      socket.emit('left_deal_room', { dealRoomId });
    });

    // Handle sending messages
    socket.on('send_message', async (data) => {
      try {
        const { dealRoomId, body, attachments = [] } = data;

        // Verify user is participant in this deal room
        const participantQuery = `
          SELECT dr.id, dr.buyer_id, s.user_id as seller_user_id
          FROM deal_rooms dr
          LEFT JOIN sellers s ON dr.seller_id = s.id
          WHERE dr.id = $1 AND (dr.buyer_id = $2 OR s.user_id = $2)
        `;
        const participantResult = await pool.query(participantQuery, [dealRoomId, socket.userId]);
        
        if (participantResult.rows.length === 0) {
          socket.emit('error', { message: 'Not authorized to send messages in this deal room' });
          return;
        }

        // Create message
        const messageQuery = `
          INSERT INTO messages (deal_room_id, sender_id, body, attachments, is_read, is_system, created_at)
          VALUES ($1, $2, $3, $4, false, false, NOW())
          RETURNING *
        `;
        const messageResult = await pool.query(messageQuery, [dealRoomId, socket.userId, body, JSON.stringify(attachments)]);
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

        // Create deal event for message
        await createMessageEvent(dealRoomId, socket.userId, newMessage.id, false);

        // Broadcast message to all participants in the deal room
        io.to(`deal_room:${dealRoomId}`).emit('new_message', newMessage);

      } catch (error) {
        console.error('Error sending message:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Handle typing indicators
    socket.on('typing_start', (dealRoomId) => {
      socket.to(`deal_room:${dealRoomId}`).emit('user_typing', {
        userId: socket.userId,
        dealRoomId,
        isTyping: true
      });
    });

    socket.on('typing_stop', (dealRoomId) => {
      socket.to(`deal_room:${dealRoomId}`).emit('user_typing', {
        userId: socket.userId,
        dealRoomId,
        isTyping: false
      });
    });

    // Handle marking messages as read
    socket.on('mark_read', async (data) => {
      try {
        const { dealRoomId, messageIds } = data;

        // Verify user is participant in this deal room
        const participantQuery = `
          SELECT dr.id FROM deal_rooms dr
          LEFT JOIN sellers s ON dr.seller_id = s.id
          WHERE dr.id = $1 AND (dr.buyer_id = $2 OR s.user_id = $2)
        `;
        const participantResult = await pool.query(participantQuery, [dealRoomId, socket.userId]);
        
        if (participantResult.rows.length === 0) {
          socket.emit('error', { message: 'Not authorized to mark messages in this deal room' });
          return;
        }

        // Update messages as read for this user
        const updateQuery = `
          UPDATE messages 
          SET is_read = true
          WHERE deal_room_id = $1 AND id = ANY($2) AND sender_id != $3
        `;
        await pool.query(updateQuery, [dealRoomId, messageIds, socket.userId]);

        // Notify other participants
        socket.to(`deal_room:${dealRoomId}`).emit('messages_read', {
          userId: socket.userId,
          dealRoomId,
          messageIds
        });

      } catch (error) {
        console.error('Error marking messages as read:', error);
        socket.emit('error', { message: 'Failed to mark messages as read' });
      }
    });

    // Handle deal room state changes
    socket.on('update_deal_state', async (data) => {
      try {
        const { dealRoomId, newState, metadata } = data;

        // Verify user is participant in this deal room
        const participantQuery = `
          SELECT dr.id, dr.current_state, dr.buyer_id, s.user_id as seller_user_id
          FROM deal_rooms dr
          LEFT JOIN sellers s ON dr.seller_id = s.id
          WHERE dr.id = $1 AND (dr.buyer_id = $2 OR s.user_id = $2)
        `;
        const participantResult = await pool.query(participantQuery, [dealRoomId, socket.userId]);
        
        if (participantResult.rows.length === 0) {
          socket.emit('error', { message: 'Not authorized to update this deal room' });
          return;
        }

        const dealRoom = participantResult.rows[0];
        const oldState = dealRoom.current_state;

        // Update deal room state
        const updateQuery = `
          UPDATE deal_rooms 
          SET current_state = $1, metadata = metadata || $2, updated_at = NOW()
          WHERE id = $3
          RETURNING *
        `;
        const updateResult = await pool.query(updateQuery, [newState, metadata || {}, dealRoomId]);
        const updatedDealRoom = updateResult.rows[0];

        // Create deal event for state change
        await createDealEvent(dealRoomId, socket.userId, 'state_changed', {
          old_state: oldState,
          new_state: newState,
          metadata: metadata || {}
        });

        // Broadcast state change to all participants
        io.to(`deal_room:${dealRoomId}`).emit('deal_state_changed', {
          dealRoomId,
          oldState,
          newState,
          updatedBy: socket.userId,
          metadata: metadata || {}
        });


      } catch (error) {
        console.error('Error updating deal state:', error);
        socket.emit('error', { message: 'Failed to update deal state' });
      }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
    });

    // Handle errors
    socket.on('error', (error) => {
      console.error(`Socket error for user ${socket.userId}:`, error);
    });
  });

  return io;
};

// Function to emit events to deal rooms from outside the socket handler
const emitToDealRoom = (dealRoomId, event, data) => {
  if (globalIO) {
    globalIO.to(`deal_room:${dealRoomId}`).emit(event, data);
  } else {
    console.warn('[SOCKET] Global IO instance not available for emitting to deal room');
  }
};

module.exports = setupDealRoomSocketIO;
module.exports.emitToDealRoom = emitToDealRoom;
