const express = require('express');
const router = express.Router();
const { 
  createChat,
  getChats,
  getChat,
  sendMessage,
  getChatMessages,
  markAsRead,
  deleteMessage
} = require('./controller');
const { authenticateToken } = require('../middleware/auth');

// Create a new chat
router.post('/', authenticateToken, createChat);

// Get all chats for current user
router.get('/', authenticateToken, getChats);

// Get a specific chat by ID
router.get('/:id', authenticateToken, getChat);

// Send a message in a chat
router.post('/:id/messages', authenticateToken, sendMessage);

// Get messages in a chat
router.get('/:id/messages', authenticateToken, getChatMessages);

// Mark messages as read
router.post('/:id/messages/read', authenticateToken, markAsRead);

// Delete a message
router.delete('/:id/messages/:messageId', authenticateToken, deleteMessage);

module.exports = router;
