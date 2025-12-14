const pool = require('../database/connection');
const { 
  createChat,
  getChatsByUser,
  getChatById,
  sendMessage,
  getMessages,
  markMessagesAsRead,
  deleteMessage
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
    
    res.json(chat);
  } catch (error) {
    console.error('Error getting chat:', error);
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
  sendMessage: sendMessageController,
  getChatMessages,
  markAsRead,
  deleteMessage: deleteMessageController
};
