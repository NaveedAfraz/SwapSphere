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
        profile_picture_url: profile.profile_picture_url,
        avatar_key: profile.avatar_key,
        profile_picture_mime_type: profile.profile_picture_mime_type,
        profile_picture_size_bytes: profile.profile_picture_size_bytes,
        cover_image_url: profile.cover_image_url,
        location: profile.location,
        website: profile.website,
        social_links: profile.social_links || {},
        verification_status: profile.verification_status || "not_verified",
        verification_documents: profile.verification_documents || [],
        is_seller: profile.seller_mode,
        seller_info: seller
          ? {
              business_name: seller.store_name,
              business_description: seller.bio,
              business_hours: seller.business_hours,
              response_rate: seller.response_rate,
              response_time: seller.response_time,
              total_sales: seller.total_sales,
              average_rating: seller.seller_rating,
              total_reviews: seller.rating_count,
            }
          : null,
        preferences: profile.preferences || {
          visibility: "public",
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
      verification_status: profile.verification_status || "not_verified",
      is_seller: profile.seller_mode,
      seller_info: seller
        ? {
            business_name: seller.store_name,
            business_description: seller.bio,
            response_rate: seller.response_rate,
            total_sales: seller.total_sales,
            average_rating: seller.seller_rating,
            total_reviews: seller.rating_count,
          }
        : null,
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

    const updatedProfile = await Profile.update(profile.id, {
      cover_image_url,
    });

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
      verification_status: "pending",
      verification_documents: [document_url],
    });

    res.status(200).json({
      status: "pending",
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

    // Get listings stats
    const listingsResult = await pool.query(
      "SELECT COUNT(*) as count, COUNT(CASE WHEN is_published = true THEN 1 END) as active_count FROM listings WHERE seller_id = (SELECT id FROM sellers WHERE user_id = $1) AND deleted_at IS NULL",
      [userId]
    );

    // Get reviews stats
    const reviewsResult = await pool.query(
      "SELECT COUNT(*) as count, COALESCE(AVG(rating), 0) as avg_rating FROM reviews WHERE reviewee_id = $1",
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

// Get seller's sales
const getMySales = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20, status } = req.query;
    const offset = (page - 1) * limit;

    const pool = require("../auth/model").pool;

    // Build WHERE clause for status filtering
    let statusClause = "";
    let queryParams = [userId, limit, offset];
    
    if (status && status !== 'all') {
      statusClause = "AND o.status = $4";
      queryParams.splice(2, 0, status); // Insert status at position 3 (before limit and offset)
    }

    // Get seller's sales with order and payment information
    const salesQuery = `
      SELECT 
        o.id as order_id,
        o.total_amount,
        o.currency,
        o.status as order_status,
        o.created_at as order_created_at,
        o.updated_at as order_updated_at,
        l.title as listing_title,
        COALESCE(
          JSON_AGG(
            JSON_BUILD_OBJECT(
              'url', m.url,
              'id', m.id
            ) ORDER BY m.created_at ASC
          ) FILTER (WHERE m.id IS NOT NULL), 
          '[]'::json
        ) as listing_images,
        l.price as listing_price,
        l.category as listing_category,
        bp.name as buyer_username,
        bp.avatar_key as buyer_avatar,
        p.status as payment_status,
        p.provider_payment_id,
        dr.id as deal_room_id,
        dr.current_state as deal_room_state
      FROM orders o
      JOIN sellers s ON o.seller_id = s.id
      JOIN listings l ON o.metadata->>'listing_id'::text = l.id::text
      JOIN users b ON o.buyer_id = b.id
      LEFT JOIN profiles bp ON b.id = bp.user_id
      LEFT JOIN payments p ON o.id = p.order_id
      LEFT JOIN deal_rooms dr ON o.metadata->>'offer_id'::text IN (
        SELECT id::text FROM offers WHERE deal_room_id = dr.id
      )
      LEFT JOIN LATERAL (
        SELECT id, url, created_at 
        FROM media 
        WHERE listing_id = l.id 
        ORDER BY created_at ASC 
        LIMIT 5
      ) m ON true
      WHERE s.user_id = $1
        ${statusClause}
      GROUP BY o.id, o.total_amount, o.currency, o.status, o.created_at, o.updated_at,
               l.title, l.price, l.category, bp.name, bp.avatar_key,
               p.status, p.provider_payment_id, dr.id, dr.current_state
      ORDER BY o.created_at DESC
      LIMIT $${queryParams.length - 1} OFFSET $${queryParams.length}
    `;

    const salesResult = await pool.query(salesQuery, queryParams);

    // Get total count for pagination
    const countQuery = `
      SELECT COUNT(*) as total
      FROM orders o
      JOIN sellers s ON o.seller_id = s.id
      WHERE s.user_id = $1
        ${statusClause.replace('o.status = $4', 'o.status = $2')}
    `;
    
    const countParams = status ? [userId, status] : [userId];
    const countResult = await pool.query(countQuery, countParams);

    const total = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(total / limit);

    res.status(200).json({
      sales: salesResult.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
      stats: {
        total_sales: total,
        total_revenue: salesResult.rows.reduce((sum, sale) => sum + parseFloat(sale.total_amount || 0), 0),
        pending_orders: salesResult.rows.filter(sale => sale.order_status === 'pending').length,
        completed_orders: salesResult.rows.filter(sale => sale.order_status === 'completed').length,
      }
    });
  } catch (error) {
    console.error("Get my sales error:", error);
    res.status(500).json({
      error: "Internal server error",
    });
  }
};

// Get sales details
const getSaleDetails = async (req, res) => {
  try {
    const userId = req.user.id;
    const { orderId } = req.params;

    const pool = require("../auth/model").pool;

    // Get sale details with full information
    const saleQuery = `
      SELECT 
        o.id as order_id,
        o.total_amount,
        o.currency,
        o.status as order_status,
        o.metadata as order_metadata,
        o.created_at as order_created_at,
        o.updated_at as order_updated_at,
        l.id as listing_id,
        l.title as listing_title,
        l.description as listing_description,
        COALESCE(
          JSON_AGG(
            JSON_BUILD_OBJECT(
              'url', m.url,
              'id', m.id
            ) ORDER BY m.created_at ASC
          ) FILTER (WHERE m.id IS NOT NULL), 
          '[]'::json
        ) as listing_images,
        l.price as listing_price,
        l.category as listing_category,
        l.condition as listing_condition,
        b.id as buyer_id,
        bp.name as buyer_username,
        b.email as buyer_email,
        bp.avatar_key as buyer_avatar,
        p.id as payment_id,
        p.status as payment_status,
        p.amount as payment_amount,
        p.provider,
        p.provider_payment_id,
        p.metadata as payment_metadata,
        p.created_at as payment_created_at,
        dr.id as deal_room_id,
        dr.current_state as deal_room_state,
        dr.metadata as deal_room_metadata,
        off.offered_price,
        off.status as offer_status,
        off.created_at as offer_created_at
      FROM orders o
      JOIN sellers s ON o.seller_id = s.id
      JOIN listings l ON o.metadata->>'listing_id'::text = l.id::text
      JOIN users b ON o.buyer_id = b.id
      LEFT JOIN profiles bp ON b.id = bp.user_id
      LEFT JOIN payments p ON o.id = p.order_id
      LEFT JOIN deal_rooms dr ON o.metadata->>'offer_id'::text IN (
        SELECT id::text FROM offers WHERE deal_room_id = dr.id
      )
      LEFT JOIN offers off ON o.metadata->>'offer_id'::text = off.id::text
      LEFT JOIN LATERAL (
        SELECT id, url, created_at 
        FROM media 
        WHERE listing_id = l.id 
        ORDER BY created_at ASC 
        LIMIT 5
      ) m ON true
      WHERE o.id = $1 AND s.user_id = $2
      GROUP BY o.id, o.total_amount, o.currency, o.status, o.metadata, o.created_at, o.updated_at,
               l.id, l.title, l.description, l.price, l.category, l.condition,
               b.id, bp.name, b.email, bp.avatar_key,
               p.id, p.status, p.amount, p.provider, p.provider_payment_id, p.metadata, p.created_at,
               dr.id, dr.current_state, dr.metadata,
               off.offered_price, off.status, off.created_at
    `;

    const saleResult = await pool.query(saleQuery, [orderId, userId]);

    if (saleResult.rows.length === 0) {
      return res.status(404).json({
        error: "Sale not found",
      });
    }

    const sale = saleResult.rows[0];

    // Get deal events for this order
    const eventsQuery = `
      SELECT de.event_type, de.payload, de.created_at, 
             u.username as actor_name, p.profile_picture_url as actor_avatar
      FROM deal_events de
      LEFT JOIN users u ON de.actor_id = u.id
      LEFT JOIN profiles p ON u.id = p.user_id
      WHERE de.deal_room_id = $1
      ORDER BY de.created_at DESC
    `;

    const eventsResult = await pool.query(eventsQuery, [sale.deal_room_id]);

    res.status(200).json({
      sale: {
        ...sale,
        events: eventsResult.rows,
      },
    });
  } catch (error) {
    console.error("Get sale details error:", error);
    res.status(500).json({
      error: "Internal server error",
    });
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
    if (newSellerMode && !(await Seller.findByUserId(userId))) {
      await Seller.create({
        user_id: userId,
        store_name: profile.name || "Store",
        bio: profile.bio,
      });
    }

    res.status(200).json({
      message: `Seller mode ${newSellerMode ? "enabled" : "disabled"}`,
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
  getMySales,
  getSaleDetails,
  toggleSellerMode,
  deactivateProfile,
  checkUsernameAvailability,
};
