const { pool } = require("../database/db");
const {
  sendMessage,
  getMessages,
  markMessagesAsRead,
  deleteMessage,
  getUnreadMessageCount,
} = require('./model');

const sendMessageController = async (req, res) => {
  try {
    const senderId = req.user.id;
    const { dealRoomId } = req.params;
    const { body, attachments, is_system = false } = req.body;
    
    const message = await sendMessage(senderId, dealRoomId, { 
      body, 
      attachments, 
      is_system 
    });
    
    // Return response in expected format with data property
    res.status(201).json({ 
      success: true,
      data: message 
    });
  } catch (error) {
    console.error('Error sending message:', error);
    if (error.message.includes("not a participant")) {
      return res.status(403).json({ error: error.message });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getDealRoomMessages = async (req, res) => {
  try {
    const userId = req.user.id;
    const { dealRoomId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    
    const options = {
      page: parseInt(page),
      limit: parseInt(limit)
    };
    
    const result = await getMessages(userId, dealRoomId, options);
    
    res.json(result);
  } catch (error) {
    console.error('Error getting messages:', error);
    if (error.message.includes("not a participant")) {
      return res.status(403).json({ error: error.message });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};

const markAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    const { dealRoomId } = req.params;
    const { message_ids } = req.body;
    
    if (!message_ids || !Array.isArray(message_ids)) {
      return res.status(400).json({ error: 'message_ids array is required' });
    }
    
    await markMessagesAsRead(userId, message_ids, dealRoomId);
    
    res.json({ message: 'Messages marked as read' });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    if (error.message.includes("not a participant")) {
      return res.status(403).json({ error: error.message });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};

const deleteMessageController = async (req, res) => {
  try {
    const userId = req.user.id;
    const { messageId } = req.params;
    
    const deletedMessage = await deleteMessage(userId, messageId);
    
    res.json({ message: 'Message deleted successfully', deletedMessage });
  } catch (error) {
    console.error('Error deleting message:', error);
    if (error.message.includes("not authorized")) {
      return res.status(403).json({ error: error.message });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.id;
    const { dealRoomId } = req.query;
    
    const unreadCount = await getUnreadMessageCount(userId, dealRoomId);
    
    res.json({ unread_count: unreadCount });
  } catch (error) {
    console.error('Error getting unread count:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  sendMessage: sendMessageController,
  getDealRoomMessages,
  markAsRead,
  deleteMessage: deleteMessageController,
  getUnreadCount,
};
