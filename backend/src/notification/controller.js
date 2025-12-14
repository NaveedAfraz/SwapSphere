const pool = require('../database/connection');
const { 
  createNotification: createNotificationModel,
  getNotificationsByUser,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification
} = require('./model');

const createNotification = async (req, res) => {
  try {
    const { user_id, type, payload } = req.body;
    
    const notification = await createNotificationModel(user_id, {
      type,
      payload,
      actor_id: req.user.id
    });
    
    res.status(201).json(notification);
  } catch (error) {
    console.error('Error creating notification:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const { unread_only, page = 1, limit = 20 } = req.query;
    
    const filters = {};
    if (unread_only === 'true') {
      filters.unread_only = true;
    }
    
    const options = {
      page: parseInt(page),
      limit: parseInt(limit)
    };
    
    const result = await getNotificationsByUser(userId, filters, options);
    
    res.json(result);
  } catch (error) {
    console.error('Error getting notifications:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const markAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    
    const notification = await markNotificationAsRead(userId, id);
    
    res.json(notification);
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const result = await markAllNotificationsAsRead(userId);
    
    res.json(result);
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const deleteNotificationController = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    
    await deleteNotification(userId, id);
    
    res.json({ message: 'Notification deleted successfully' });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const query = `
      SELECT COUNT(*) as unread_count
      FROM notifications
      WHERE user_id = $1 AND is_read = false
    `;
    
    const result = await pool.query(query, [userId]);
    
    res.json({ unread_count: parseInt(result.rows[0].unread_count) });
  } catch (error) {
    console.error('Error getting unread count:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  createNotification,
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification: deleteNotificationController,
  getUnreadCount
};
