const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { User, Profile, Seller } = require("./model");
const { uploadImage } = require("../services/s3Service");
const { pool } = require("../database/db");
const crypto = require('crypto');

// Helper function to upload profile picture to S3
const uploadProfilePicture = async (userId, profilePictureData) => {
  try {
    const { profile_picture_url, profile_picture_mime_type, profile_picture_size_bytes } = profilePictureData;
    
    // Convert base64 or data URL to buffer
    let buffer;
    if (profile_picture_url.startsWith('data:')) {
      // Handle data URL (base64)
      const base64Data = profile_picture_url.split(',')[1];
      buffer = Buffer.from(base64Data, 'base64');
    } else if (profile_picture_url.startsWith('file://')) {
      // Handle file URI - this won't work in Node.js server environment
      throw new Error('File URIs are not supported on server. Please use base64 data URLs from frontend.');
    } else {
      throw new Error('Unsupported image format. Please use base64 data URLs.');
    }

    // Generate unique filename
    const fileExtension = profile_picture_mime_type.split('/')[1];
    const uniqueFileName = `profile-pictures/${userId}/${Date.now()}-${crypto.randomBytes(8).toString('hex')}.${fileExtension}`;

    // Upload to S3
    const s3Url = await uploadImage(buffer, uniqueFileName, profile_picture_mime_type);

    return {
      avatar_key: uniqueFileName,
      profile_picture_url: s3Url,
      profile_picture_mime_type: profile_picture_mime_type,
      profile_picture_size_bytes: profile_picture_size_bytes,
    };
  } catch (error) {
    throw new Error('Failed to upload profile picture: ' + error.message);
  }
};

// Register basic user details
const registerBasic = async (req, res) => {
  try {
    const { email, phone, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        error: "Email and password are required",
      });
    }

    // Check if user already exists
    const existingUser = await User.findByEmailOrPhone(email, phone);

    if (existingUser) {
      return res.status(409).json({
        error: "User with this email or phone already exists",
      });
    }

    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create user
    const user = await User.create({
      email,
      phone,
      password_hash: passwordHash,
    });

    res.status(201).json({
      message: "User registered successfully. Please complete your profile setup.",
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        created_at: user.created_at,
      },
      requiresProfileSetup: true,
      nextStep: "profile_setup"
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({
      error: "Internal server error",
    });
  }
};

// Complete profile setup and issue JWT
const setupProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    const { name, bio, seller_mode, location, password, avatar_key, profile_picture_url, profile_picture_mime_type, profile_picture_size_bytes } = req.body;

    // Validate user exists
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        error: "User not found or inactive",
      });
    }

    // Handle password setup for OAuth users (optional)
    let updatedUser = user;
    if (password) {
      // Validate password strength
      if (password.length < 8) {
        return res.status(400).json({
          error: "Password must be at least 8 characters long",
        });
      }

      // Check if user already has a password
      if (user.password_hash) {
        return res.status(400).json({
          error: "User already has a password set",
        });
      }

      // Hash and set password
      const saltRounds = 12;
      const passwordHash = await bcrypt.hash(password, saltRounds);

      updatedUser = await User.update(userId, {
        password_hash: passwordHash,
      });
    }

    // Handle profile picture upload to S3
    let profilePictureData = {};
    if (profile_picture_url && profile_picture_mime_type && profile_picture_size_bytes) {
      try {
        profilePictureData = await uploadProfilePicture(userId, {
          profile_picture_url,
          profile_picture_mime_type,
          profile_picture_size_bytes,
        });
      } catch (uploadError) {
        // Continue with profile setup even if picture upload fails
        // But don't include picture data
      }
    }

    // Create profile with picture support
    const profile = await Profile.create({
      user_id: userId,
      name,
      bio,
      seller_mode,
      location,
      avatar_key: profilePictureData.avatar_key || null,
      profile_picture_url: profilePictureData.profile_picture_url || null,
      profile_picture_mime_type: profilePictureData.profile_picture_mime_type || null,
      profile_picture_size_bytes: profilePictureData.profile_picture_size_bytes || null,
    });

    // Create seller profile (always create for listing functionality)
    let seller = await Seller.findByUserId(userId);
    if (!seller) {
      seller = await Seller.create({
        user_id: userId,
        store_name: name || `${name || "User"}'s Store`, // Use profile name as store name
        bio: bio || '',
      });
    }

    // Generate JWT token
    const token = generateJWT(updatedUser);

    res.status(201).json({
      message: password 
        ? "Profile setup completed successfully with password"
        : "Profile setup completed successfully",
      token: token,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        phone: updatedUser.phone,
        profile: {
          id: profile.id,
          name: profile.name,
          bio: profile.bio,
          seller_mode: profile.seller_mode,
          rating_avg: profile.rating_avg,
          rating_count: profile.rating_count,
          avatar_key: profile.avatar_key,
          profile_picture_url: profile.profile_picture_url,
          profile_picture_mime_type: profile.profile_picture_mime_type,
          profile_picture_size_bytes: profile.profile_picture_size_bytes,
        },
        seller: seller ? {
          id: seller.id,
          store_name: seller.store_name,
          bio: seller.bio,
          seller_rating: seller.seller_rating,
          total_sales: seller.total_sales,
        } : null,
      },
    });
  } catch (error) {
    console.error("Profile setup error:", error);
    res.status(500).json({
      error: "Internal server error",
    });
  }
};

// Generate JWT token
const generateJWT = (user) => {
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
    },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
};

// Login user
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        error: "Email and password are required",
      });
    }

    // Find user by email
    const user = await User.findByEmailOrPhone(email);

    if (!user) {
      return res.status(401).json({
        error: "Invalid email or password",
      });
    }

    // Compare password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      return res.status(401).json({
        error: "Invalid email or password",
      });
    }

    // Get user profile
    const profile = await Profile.findByUserId(user.id);

    // Get seller info if user is a seller
    let seller = null;
    if (profile && profile.seller_mode) {
      seller = await Seller.findByUserId(user.id);
    }

    // Generate JWT token
    const token = generateJWT(user);

    res.status(200).json({
      message: "Login successful",
      token: token,
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        sellerMode: profile?.seller_mode || false,
        profileCompleted: !!profile,
        token: token,
        profile: profile || null,
        seller: seller ? {
          id: seller.id,
          store_name: seller.store_name,
          bio: seller.bio,
          seller_rating: seller.seller_rating,
          total_sales: seller.total_sales,
        } : null,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      error: "Internal server error",
    });
  }
};

// Google OAuth login/register
const googleAuth = async (req, res) => {
  try {
    const { email, name, googleId } = req.body;

    // Validate input
    if (!email || !googleId) {
      return res.status(400).json({
        error: "Email and Google ID are required",
      });
    }

    // Check if user exists
    let user = await User.findByEmailOrPhone(email);

    if (!user) {
      // Create new user for Google OAuth
      user = await User.create({
        email,
        password_hash: null, // No password for OAuth users
      });

      res.status(201).json({
        message: "Google account registered successfully. Please complete your profile setup.",
        user: {
          id: user.id,
          email: user.email,
          phone: user.phone,
          profile: null,
        },
        requiresProfileSetup: true,
        nextStep: "profile_setup"
      });
    } else {
      // Existing user - check if profile exists
      const profile = await Profile.findByUserId(user.id);

      if (!profile) {
        res.status(200).json({
          message: "Welcome back! Please complete your profile setup to continue.",
          user: {
            id: user.id,
            email: user.email,
            phone: user.phone,
            profile: null,
            seller: null,
          },
          requiresProfileSetup: true,
          nextStep: "profile_setup"
        });
      } else {
        // Get seller info if user is a seller
        let seller = null;
        if (profile.seller_mode) {
          seller = await Seller.findByUserId(user.id);
        }

        // Complete login - issue JWT
        const token = generateJWT(user);

        res.status(200).json({
          message: "Google login successful",
          token: token,
          user: {
            id: user.id,
            email: user.email,
            phone: user.phone,
            profile: {
              id: profile.id,
              name: profile.name,
              bio: profile.bio,
              seller_mode: profile.seller_mode,
              rating_avg: profile.rating_avg,
              rating_count: profile.rating_count,
            },
            seller: seller ? {
              id: seller.id,
              store_name: seller.store_name,
              bio: seller.bio,
              seller_rating: seller.seller_rating,
              total_sales: seller.total_sales,
            } : null,
          },
          requiresProfileSetup: false,
        });
      }
    }
  } catch (error) {
    console.error("Google auth error:", error);
    res.status(500).json({
      error: "Internal server error",
    });
  }
};

// Logout user
const logout = async (req, res) => {
  try {
    
    // For JWT-based auth, logout is mainly client-side (token removal)
    // But we can log the logout event or invalidate tokens if using a token blacklist
    res.status(200).json({
      message: "Logout successful",
    });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({
      error: "Internal server error",
    });
  }
};

// Update profile picture
const updateProfilePicture = async (req, res) => {
  try {
    const userId = req.user?.userId;
    
    if (!userId) {
      return res.status(401).json({
        error: "User not authenticated",
      });
    }

    const { avatar_key, profile_picture_url, profile_picture_mime_type, profile_picture_size_bytes } = req.body;

    // Validate required fields
    if (!profile_picture_url || !profile_picture_mime_type || !profile_picture_size_bytes) {
      return res.status(400).json({
        error: "profile_picture_url, profile_picture_mime_type, and profile_picture_size_bytes are required",
      });
    }

    // Upload profile picture to S3
    let profilePictureData = {};
    try {
      profilePictureData = await uploadProfilePicture(userId, {
        profile_picture_url,
        profile_picture_mime_type,
        profile_picture_size_bytes,
      });
    } catch (uploadError) {
      console.error("Profile picture upload failed:", uploadError);
      return res.status(500).json({
        error: "Failed to upload profile picture: " + uploadError.message,
      });
    }

    // Update profile with new picture data
    const updatedProfile = await Profile.updateProfilePicture(userId, profilePictureData);

    if (!updatedProfile) {
      return res.status(404).json({
        error: "Profile not found",
      });
    }

    res.status(200).json({
      message: "Profile picture updated successfully",
      profile: {
        id: updatedProfile.id,
        avatar_key: updatedProfile.avatar_key,
        profile_picture_url: updatedProfile.profile_picture_url,
        profile_picture_mime_type: updatedProfile.profile_picture_mime_type,
        profile_picture_size_bytes: updatedProfile.profile_picture_size_bytes,
      },
    });
  } catch (error) {
    console.error("Update profile picture error:", error);
    res.status(500).json({
      error: "Internal server error",
    });
  }
};

// Get current user info (for auth hydration)
const getMe = async (req, res) => {
  try {
    // User should be authenticated via middleware
    if (!req.user) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    // Get user data using the custom findById method
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Get user profile data separately
    const profileResult = await pool.query(
      "SELECT * FROM profiles WHERE user_id = $1",
      [req.user.id]
    );
    const profile = profileResult.rows[0];

    // Return user data in expected format
    res.status(200).json({
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        sellerMode: profile?.seller_mode || false,
        profileCompleted: !!profile,
      },
      token: req.headers.authorization?.replace('Bearer ', ''), // Return current token
    });
  } catch (error) {
    console.error("Get me error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = {
  registerBasic,
  setupProfile,
  login,
  googleAuth,
  logout,
  updateProfilePicture,
  getMe,
};
