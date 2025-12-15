const express = require('express');
const router = express.Router();
const { 
  createChat,
  getChats,
  getChat,
  sendMessage,
  getChatMessages,
  markAsRead,
  deleteMessage,
  findChatByUsers
} = require('./controller');
const { authenticate } = require('../../src/common/middleware/auth');

// Create a new chat
router.post('/', authenticate, createChat);

// Get all chats for current user
router.get('/', authenticate, getChats);

// Find chat by users and optionally listing ID
router.get('/find-by-users', authenticate, findChatByUsers);

// Get a specific chat by ID
router.get('/:id', authenticate, getChat);

// Send a message in a chat
router.post('/:id/messages', authenticate, sendMessage);

// Get messages in a chat
router.get('/:id/messages', authenticate, getChatMessages);

// Mark messages as read
router.post('/:id/messages/read', authenticate, markAsRead);

// Delete a message
router.delete('/:id/messages/:messageId', authenticate, deleteMessage);

module.exports = router;
