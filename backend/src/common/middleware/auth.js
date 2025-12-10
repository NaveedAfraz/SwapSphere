const jwt = require("jsonwebtoken");
const { User } = require("../../auth/model");

// Authenticate middleware - verifies JWT token
const authenticate = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.header("Authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        error: "Access denied. No token provided.",
      });
    }

    const token = authHeader.replace("Bearer ", "");

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get user from database
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({
        error: "Invalid token. User not found.",
      });
    }

    // Add user to request object
    req.user = {
      id: user.id,
      email: user.email,
      phone: user.phone,
    };

    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        error: "Invalid token.",
      });
    } else if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        error: "Token expired.",
      });
    } else {
      console.error("Authentication error:", error);
      return res.status(500).json({
        error: "Internal server error",
      });
    }
  }
};

// Optional authentication - doesn't fail if no token
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.header("Authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      // No token provided, continue without authentication
      return next();
    }

    const token = authHeader.replace("Bearer ", "");
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);

    if (user) {
      req.user = {
        id: user.id,
        email: user.email,
        phone: user.phone,
      };
    }

    next();
  } catch (error) {
    // For optional auth, we don't fail on token errors
    // Just continue without authentication
    next();
  }
};

module.exports = {
  authenticate,
  optionalAuth,
};