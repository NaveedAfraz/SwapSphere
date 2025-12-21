const express = require('express');
const router = express.Router();
const { 
  createNotification,
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getUnreadCount,
  updateNotification
} = require('./controller');
const { authenticate } = require('../../src/common/middleware/auth');

// Create a new notification (system/admin use)
router.post('/', authenticate, createNotification);

// Get notifications for current user
router.get('/', authenticate, getNotifications);

// Get unread count for current user
router.get('/unread-count', authenticate, getUnreadCount);

// Mark a notification as read
router.post('/:id/read', authenticate, markAsRead);

// Mark all notifications as read
router.post('/mark-all-read', authenticate, markAllAsRead);

// Update a notification
router.put('/:id', authenticate, updateNotification);

// Delete a notification
router.delete('/:id', authenticate, deleteNotification);

module.exports = router;
