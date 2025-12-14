const express = require('express');
const router = express.Router();
const { 
  createNotification,
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getUnreadCount
} = require('./controller');
const { authenticateToken } = require('../middleware/auth');

// Create a new notification (system/admin use)
router.post('/', authenticateToken, createNotification);

// Get notifications for current user
router.get('/', authenticateToken, getNotifications);

// Get unread count for current user
router.get('/unread-count', authenticateToken, getUnreadCount);

// Mark a notification as read
router.post('/:id/read', authenticateToken, markAsRead);

// Mark all notifications as read
router.post('/mark-all-read', authenticateToken, markAllAsRead);

// Delete a notification
router.delete('/:id', authenticateToken, deleteNotification);

module.exports = router;
