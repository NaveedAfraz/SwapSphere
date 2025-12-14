const { Profile, Seller } = require("../auth/model");

// Get current user's profile
const getMyProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get profile
    const profile = await Profile.findByUserId(userId);
    
    if (!profile) {
      return res.status(404).json({
        error: "Profile not found",
      });
    }

    // Get seller info if applicable
    let seller = null;
    if (profile.seller_mode) {
      seller = await Seller.findByUserId(userId);
    }

    // Get profile stats (placeholder for now - would need to implement actual stats queries)
    const stats = await getProfileStats(userId);

    res.status(200).json({
      profile: {
        id: profile.id,
        user_id: profile.user_id,
        username: profile.username || `user_${profile.id}`,
        display_name: profile.name,
        bio: profile.bio,
        avatar_url: profile.avatar_url,
        cover_image_url: profile.cover_image_url,
        location: profile.location,
        website: profile.website,
        social_links: profile.social_links || {},
        verification_status: profile.verification_status || 'not_verified',
        verification_documents: profile.verification_documents || [],
        is_seller: profile.seller_mode,
        seller_info: seller ? {
          business_name: seller.store_name,
          business_description: seller.bio,
          business_hours: seller.business_hours,
          response_rate: seller.response_rate,
          response_time: seller.response_time,
          total_sales: seller.total_sales,
          average_rating: seller.seller_rating,
          total_reviews: seller.rating_count,
        } : null,
        preferences: profile.preferences || {
          visibility: 'public',
          show_email: false,
          show_phone: false,
          allow_messages: true,
          allow_offers: true,
          notification_settings: {
            email: true,
            push: true,
            sms: false,
          },
        },
        stats: stats,
        created_at: profile.created_at,
        updated_at: profile.updated_at,
      },
    });
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({
      error: "Internal server error",
    });
  }
};

// Get public profile by username
const getPublicProfile = async (req, res) => {
  try {
    const { username } = req.params;

    // Find profile by username (would need to add username field to profiles table)
    const result = await require("../auth/model").pool.query(
      "SELECT p.*, u.email FROM profiles p JOIN users u ON p.user_id = u.id WHERE p.username = $1 OR p.name = $1",
      [username]
    );

    const profile = result.rows[0];

    if (!profile) {
      return res.status(404).json({
        error: "Profile not found",
      });
    }

    // Get seller info if applicable
    let seller = null;
    if (profile.seller_mode) {
      seller = await Seller.findByUserId(profile.user_id);
    }

    // Get public stats
    const stats = await getProfileStats(profile.user_id);

    // Filter sensitive information for public view
    const publicProfile = {
      id: profile.id,
      user_id: profile.user_id,
      username: profile.username || `user_${profile.id}`,
      display_name: profile.name,
      bio: profile.bio,
      avatar_url: profile.avatar_url,
      cover_image_url: profile.cover_image_url,
      location: profile.location,
      website: profile.website,
      verification_status: profile.verification_status || 'not_verified',
      is_seller: profile.seller_mode,
      seller_info: seller ? {
        business_name: seller.store_name,
        business_description: seller.bio,
        response_rate: seller.response_rate,
        total_sales: seller.total_sales,
        average_rating: seller.seller_rating,
        total_reviews: seller.rating_count,
      } : null,
      stats: stats,
      created_at: profile.created_at,
    };

    res.status(200).json({
      profile: publicProfile,
    });
  } catch (error) {
    console.error("Get public profile error:", error);
    res.status(500).json({
      error: "Internal server error",
    });
  }
};

// Update profile
const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const updates = req.body;

    // Get existing profile
    const existingProfile = await Profile.findByUserId(userId);
    
    if (!existingProfile) {
      return res.status(404).json({
        error: "Profile not found",
      });
    }

    // Update profile
    const updatedProfile = await Profile.update(existingProfile.id, updates);

    res.status(200).json({
      message: "Profile updated successfully",
      profile: updatedProfile,
    });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({
      error: "Internal server error",
    });
  }
};

// Update seller info
const updateSellerInfo = async (req, res) => {
  try {
    const userId = req.user.id;
    const sellerUpdates = req.body;

    // Get existing profile
    const profile = await Profile.findByUserId(userId);
    
    if (!profile || !profile.seller_mode) {
      return res.status(404).json({
        error: "Seller profile not found",
      });
    }

    // Get existing seller info
    let seller = await Seller.findByUserId(userId);
    
    if (seller) {
      // Update existing seller
      seller = await Seller.update(seller.id, sellerUpdates);
    } else {
      // Create new seller profile
      seller = await Seller.create({
        user_id: userId,
        ...sellerUpdates,
      });
    }

    res.status(200).json({
      message: "Seller info updated successfully",
      seller: seller,
    });
  } catch (error) {
    console.error("Update seller info error:", error);
    res.status(500).json({
      error: "Internal server error",
    });
  }
};

// Upload avatar (placeholder - would need file upload handling)
const uploadAvatar = async (req, res) => {
  try {
    const userId = req.user.id;
    const { avatar_url } = req.body;

    const profile = await Profile.findByUserId(userId);
    
    if (!profile) {
      return res.status(404).json({
        error: "Profile not found",
      });
    }

    const updatedProfile = await Profile.update(profile.id, { avatar_url });

    res.status(200).json({
      message: "Avatar uploaded successfully",
      profile: updatedProfile,
    });
  } catch (error) {
    console.error("Upload avatar error:", error);
    res.status(500).json({
      error: "Internal server error",
    });
  }
};

// Upload cover image (placeholder - would need file upload handling)
const uploadCoverImage = async (req, res) => {
  try {
    const userId = req.user.id;
    const { cover_image_url } = req.body;

    const profile = await Profile.findByUserId(userId);
    
    if (!profile) {
      return res.status(404).json({
        error: "Profile not found",
      });
    }

    const updatedProfile = await Profile.update(profile.id, { cover_image_url });

    res.status(200).json({
      message: "Cover image uploaded successfully",
      profile: updatedProfile,
    });
  } catch (error) {
    console.error("Upload cover image error:", error);
    res.status(500).json({
      error: "Internal server error",
    });
  }
};

// Submit verification
const submitVerification = async (req, res) => {
  try {
    const userId = req.user.id;
    const { document_type, document_url } = req.body;

    const profile = await Profile.findByUserId(userId);
    
    if (!profile) {
      return res.status(404).json({
        error: "Profile not found",
      });
    }

    const updatedProfile = await Profile.update(profile.id, {
      verification_status: 'pending',
      verification_documents: [document_url],
    });

    res.status(200).json({
      status: 'pending',
      message: "Verification submitted successfully",
    });
  } catch (error) {
    console.error("Submit verification error:", error);
    res.status(500).json({
      error: "Internal server error",
    });
  }
};

// Get profile stats
const getProfileStats = async (userId) => {
  try {
    // Placeholder stats - would need actual queries to listings, reviews, etc.
    const pool = require("../auth/model").pool;
    
    // Get listings count
    const listingsResult = await pool.query(
      "SELECT COUNT(*) as count, COUNT(CASE WHEN status = 'active' THEN 1 END) as active_count FROM listings WHERE user_id = $1",
      [userId]
    );
    
    // Get reviews stats
    const reviewsResult = await pool.query(
      "SELECT COUNT(*) as count, COALESCE(AVG(rating), 0) as avg_rating FROM reviews WHERE seller_id = $1",
      [userId]
    );

    const listings = listingsResult.rows[0];
    const reviews = reviewsResult.rows[0];

    return {
      total_listings: parseInt(listings.count) || 0,
      active_listings: parseInt(listings.active_count) || 0,
      sold_items: 0, // Would need orders table
      total_reviews: parseInt(reviews.count) || 0,
      average_rating: parseFloat(reviews.avg_rating) || 0,
      member_since: new Date().getFullYear().toString(), // Would use actual created_at
      last_active: new Date().toISOString(),
    };
  } catch (error) {
    console.error("Get profile stats error:", error);
    return {
      total_listings: 0,
      active_listings: 0,
      sold_items: 0,
      total_reviews: 0,
      average_rating: 0,
      member_since: new Date().getFullYear().toString(),
      last_active: new Date().toISOString(),
    };
  }
};

// Toggle seller mode
const toggleSellerMode = async (req, res) => {
  try {
    const userId = req.user.id;

    const profile = await Profile.findByUserId(userId);
    
    if (!profile) {
      return res.status(404).json({
        error: "Profile not found",
      });
    }

    const newSellerMode = !profile.seller_mode;
    
    const updatedProfile = await Profile.update(profile.id, {
      seller_mode: newSellerMode,
    });

    // If becoming seller, create basic seller profile
    if (newSellerMode && !await Seller.findByUserId(userId)) {
      await Seller.create({
        user_id: userId,
        store_name: profile.name || 'Store',
        bio: profile.bio,
      });
    }

    res.status(200).json({
      message: `Seller mode ${newSellerMode ? 'enabled' : 'disabled'}`,
      profile: updatedProfile,
    });
  } catch (error) {
    console.error("Toggle seller mode error:", error);
    res.status(500).json({
      error: "Internal server error",
    });
  }
};

// Deactivate profile
const deactivateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { reason } = req.body;

    // Deactivate user account
    await require("../auth/model").User.update(userId, { is_active: false });

    res.status(200).json({
      message: "Profile deactivated successfully",
    });
  } catch (error) {
    console.error("Deactivate profile error:", error);
    res.status(500).json({
      error: "Internal server error",
    });
  }
};

// Check username availability
const checkUsernameAvailability = async (req, res) => {
  try {
    const { username } = req.params;

    const result = await require("../auth/model").pool.query(
      "SELECT COUNT(*) as count FROM profiles WHERE username = $1",
      [username]
    );

    const isAvailable = parseInt(result.rows[0].count) === 0;

    res.status(200).json({
      available: isAvailable,
    });
  } catch (error) {
    console.error("Check username error:", error);
    res.status(500).json({
      error: "Internal server error",
    });
  }
};

module.exports = {
  getMyProfile,
  getPublicProfile,
  updateProfile,
  updateSellerInfo,
  uploadAvatar,
  uploadCoverImage,
  submitVerification,
  getProfileStats,
  toggleSellerMode,
  deactivateProfile,
  checkUsernameAvailability,
};
