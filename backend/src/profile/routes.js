const express = require("express");
const router = express.Router();
const {
  getMyProfile,
  getPublicProfile,
  updateProfile,
  updateSellerInfo,
  uploadAvatar,
  uploadCoverImage,
  submitVerification,
  toggleSellerMode,
  deactivateProfile,
  checkUsernameAvailability,
} = require("./controller");
const { authenticate } = require("../common/middleware/auth");

// Get current user's profile
router.get("/me", authenticate, getMyProfile);

// Get public profile by username
router.get("/public/:username", getPublicProfile);

// Update profile
router.put("/", authenticate, updateProfile);

// Update seller info
router.put("/seller-info", authenticate, updateSellerInfo);

// Upload avatar
router.post("/upload-avatar", authenticate, uploadAvatar);

// Upload cover image
router.post("/upload-cover", authenticate, uploadCoverImage);

// Submit verification
router.post("/verify", authenticate, submitVerification);

// Toggle seller mode
router.post("/toggle-seller", authenticate, toggleSellerMode);

// Deactivate profile
router.post("/deactivate", authenticate, deactivateProfile);

// Check username availability
router.get("/check-username/:username", checkUsernameAvailability);

module.exports = router;
