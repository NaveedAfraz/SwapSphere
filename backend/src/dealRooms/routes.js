const express = require("express");
const {
  authenticate: authenticateToken,
} = require("../common/middleware/auth");
const {
  createDealRoom,
  getDealRooms,
  getDealRoom,
  findDealRoom,
  updateDealRoomState,
} = require("./controller");

const router = express.Router();

console.log('Deal room routes loaded');

// Create a new deal room
router.post("/", authenticateToken, createDealRoom);

// Get all deal rooms for the authenticated user
router.get("/", authenticateToken, getDealRooms);

// Find a deal room by seller and listing
router.get("/find", authenticateToken, findDealRoom);

// Get a specific deal room by ID
router.get("/:id", authenticateToken, (req, res, next) => {
  console.log('Deal room route called for ID:', req.params.id);
  next();
}, getDealRoom);

// Update deal room state
router.patch("/:id/state", authenticateToken, updateDealRoomState);

module.exports = router;
