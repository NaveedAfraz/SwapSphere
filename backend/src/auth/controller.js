const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { User, Profile, Seller } = require("./model");

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
    const { name, bio, seller_mode, location, password } = req.body;

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

    // Create profile
    const profile = await Profile.create({
      user_id: userId,
      name,
      bio,
      seller_mode,
      location,
    });

    // Create seller profile if seller_mode is true
    let seller = null;
    if (seller_mode) {
      seller = await Seller.create({
        user_id: userId,
        store_name: name, // Use profile name as store name
        bio: bio,
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

module.exports = {
  registerBasic,
  setupProfile,
  login,
  googleAuth,
};
