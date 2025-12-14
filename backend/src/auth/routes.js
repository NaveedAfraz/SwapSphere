const express = require("express");
const {
  registerBasic,
  setupProfile,
  login,
  googleAuth,
  logout,
  updateProfilePicture,
} = require("./controller");
const { authenticate } = require('../../src/common/middleware/auth');

const router = express.Router();

// Register basic user details
router.post("/register", registerBasic);

// Google OAuth login/register
router.post("/google", googleAuth);

// Update profile (for logged-in users)
router.post("/profile/:userId", setupProfile);

// Login user
router.post("/login", login);

// Logout user
router.post("/logout", logout);

// Update profile picture (requires authentication)
router.post("/update-profile-picture", authenticate ,updateProfilePicture);

module.exports = router;
