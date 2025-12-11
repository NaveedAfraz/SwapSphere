const express = require("express");
const {
  registerBasic,
  setupProfile,
  login,
  googleAuth,
} = require("./controller");

const router = express.Router();

// Register basic user details
router.post("/register", registerBasic);

// Google OAuth login/register
router.post("/google", googleAuth);

// Update profile (for logged-in users)
router.post("/profile/:userId", setupProfile);

// Login user
router.post("/login", login);

module.exports = router;
