const { pool } = require("../database/db");
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

const updateNotification = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { is_read } = req.body;
    
    // Handle different body structures
    const { status, payload, updates } = req.body;
    
    let updateData = {};
    if (updates) {
      // Frontend might send { updates: { status, payload } }
      updateData = updates;
    } else {
      // Direct { status, payload }
      updateData = { status, payload };
    }
    
    
    // Verify notification belongs to user
    const verifyQuery = `
      SELECT id FROM notifications 
      WHERE id = $1 AND user_id = $2
    `;
    const verifyResult = await pool.query(verifyQuery, [id, userId]);
    
    if (verifyResult.rows.length === 0) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    
    // Build update query dynamically based on provided fields
    const updateFields = [];
    const updateValues = [];
    let paramIndex = 1;
    
    if (updateData.status !== undefined) {
      updateFields.push(`status = $${paramIndex++}`);
      updateValues.push(updateData.status);
    }
    
    if (updateData.payload !== undefined) {
      updateFields.push(`payload = $${paramIndex++}`);
      updateValues.push(JSON.stringify(updateData.payload));
    }
    
    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }
    
    const updateQuery = `
      UPDATE notifications 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;
    
    updateValues.push(id);
    
    const result = await pool.query(updateQuery, updateValues);
    
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating notification:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  createNotification,
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification: deleteNotificationController,
  getUnreadCount,
  updateNotification
};
