const express = require("express");
const {
  authenticate: authenticateToken,
} = require("../common/middleware/auth");
const { 
  sendMessage,
  getDealRoomMessages,
  markAsRead,
  deleteMessage,
  getUnreadCount,
} = require("./controller");

const router = express.Router();

// Send a message to a deal room
router.post("/:dealRoomId", authenticateToken, sendMessage);

// Get messages for a deal room
router.get("/:dealRoomId", authenticateToken, getDealRoomMessages);

// Mark messages as read
router.patch("/:dealRoomId/read", authenticateToken, markAsRead);

// Delete a message
router.delete("/message/:messageId", authenticateToken, deleteMessage);

// Get unread message count
router.get("/unread/count", authenticateToken, getUnreadCount);

module.exports = router;
