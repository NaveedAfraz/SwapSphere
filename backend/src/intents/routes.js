const express = require("express");
const {
  authenticate: authenticateToken,
} = require("../common/middleware/auth");
const {
  createIntent,
  getIntents,
  getIntent,
  updateIntent,
  deleteIntent,
  searchIntents,
} = require("./controller");

const router = express.Router();

// Create a new intent
router.post("/", authenticateToken, createIntent);

// Get all intents for the authenticated user
router.get("/", authenticateToken, getIntents);

// Search intents (public endpoint for sellers to find buyer requests)
router.get("/search", searchIntents);

// Get a specific intent by ID
router.get("/:id", authenticateToken, getIntent);

// Update a specific intent
router.put("/:id", authenticateToken, updateIntent);

// Delete a specific intent
router.delete("/:id", authenticateToken, deleteIntent);

module.exports = router;
