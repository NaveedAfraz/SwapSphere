const { pool } = require("../database/db");
const {
  createListing: createListingModel,
  getListings: getListingsModel,
  getListingById: getListingByIdModel,
  updateListing: updateListingModel,
  deleteListing: deleteListingModel,
  searchListings: searchListingsModel,
  toggleFavorite: toggleFavoriteModel,
  getFavorites: getFavoritesModel,
} = require("./model");

const createListing = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      title,
      description,
      price,
      currency,
      quantity,
      condition,
      category,
      location,
      tags,
      metadata,
    } = req.body;

    // Get seller ID for this user
    const sellerQuery = "SELECT id FROM sellers WHERE user_id = $1";
    const sellerResult = await pool.query(sellerQuery, [userId]);

    if (sellerResult.rows.length === 0) {
      return res
        .status(400)
        .json({ error: "Seller profile required to create listings" });
    }

    const sellerId = sellerResult.rows[0].id;

    const listing = await createListingModel({
      seller_id: sellerId,
      title,
      description,
      price,
      currency,
      quantity,
      condition,
      category,
      location,
      tags,
      metadata,
    });

    res.status(201).json(listing);
  } catch (error) {
    console.error("Error creating listing:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const getListings = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      category,
      condition,
      seller_id,
      sort = "created_at",
      order = "desc",
    } = req.query;

    const filters = {};
    if (category) filters.category = category;
    if (condition) filters.condition = condition;
    if (seller_id) filters.seller_id = seller_id;

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort,
      order,
    };

    const result = await getListingsModel(filters, options);

    res.json(result);
  } catch (error) {
    console.error("Error getting listings:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const getListing = async (req, res) => {
  try {
    const { id } = req.params;

    const listing = await getListingByIdModel(id);

    if (!listing) {
      return res.status(404).json({ error: "Listing not found" });
    }

    // Increment view count
    await pool.query(
      "UPDATE listings SET view_count = view_count + 1 WHERE id = $1",
      [id]
    );

    res.json(listing);
  } catch (error) {
    console.error("Error getting listing:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const updateListing = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const updates = req.body;

    // Verify ownership
    const listing = await getListingByIdModel(id);

    if (!listing) {
      return res.status(404).json({ error: "Listing not found" });
    }

    // Check if user owns this listing
    const sellerQuery = `
        SELECT s.id 
        FROM sellers s 
        WHERE s.id = $1 AND s.user_id = $2
      `;
    const sellerResult = await pool.query(sellerQuery, [
      listing.seller_id,
      userId,
    ]);

    if (sellerResult.rows.length === 0) {
      return res
        .status(403)
        .json({ error: "Not authorized to update this listing" });
    }

    const updatedListing = await updateListingModel(id, updates);

    res.json(updatedListing);
  } catch (error) {
    console.error("Error updating listing:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const deleteListing = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    // Verify ownership
    const listing = await getListingByIdModel(id);

    if (!listing) {
      return res.status(404).json({ error: "Listing not found" });
    }

    // Check if user owns this listing
    const sellerQuery = `
        SELECT s.id 
        FROM sellers s 
        WHERE s.id = $1 AND s.user_id = $2
      `;
    const sellerResult = await pool.query(sellerQuery, [
      listing.seller_id,
      userId,
    ]);

    if (sellerResult.rows.length === 0) {
      return res
        .status(403)
        .json({ error: "Not authorized to delete this listing" });
    }

    await deleteListingModel(id);

    res.json({ message: "Listing deleted successfully" });
  } catch (error) {
    console.error("Error deleting listing:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const searchListings = async (req, res) => {
  try {
    const {
      q,
      category,
      condition,
      min_price,
      max_price,
      location,
      page = 1,
      limit = 20,
    } = req.query;

    const filters = {};
    if (category) filters.category = category;
    if (condition) filters.condition = condition;
    if (min_price) filters.min_price = parseFloat(min_price);
    if (max_price) filters.max_price = parseFloat(max_price);
    if (location) filters.location = location;

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
    };

    const result = await searchListingsModel(q, filters, options);

    res.json(result);
  } catch (error) {
    console.error("Error searching listings:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const toggleFavorite = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const result = await toggleFavoriteModel(userId, id);

    res.json(result);
  } catch (error) {
    console.error("Error toggling favorite:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const getFavorites = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20 } = req.query;

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
    };

    const result = await getFavoritesModel(userId, options);

    res.json(result);
  } catch (error) {
    console.error("Error getting favorites:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const uploadImages = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { images } = req.body; // Array of image objects with url, width, height, etc.

    // Verify ownership
    const listing = await getListingByIdModel(id);

    if (!listing) {
      return res.status(404).json({ error: "Listing not found" });
    }

    const sellerQuery = `
        SELECT s.id 
        FROM sellers s 
        WHERE s.id = $1 AND s.user_id = $2
      `;
    const sellerResult = await pool.query(sellerQuery, [
      listing.seller_id,
      userId,
    ]);

    if (sellerResult.rows.length === 0) {
      return res
        .status(403)
        .json({ error: "Not authorized to upload images to this listing" });
    }

    // Insert images
    const imageValues = images
      .map(
        (img, index) =>
          `($${index * 7 + 1}, $${index * 7 + 2}, $${index * 7 + 3}, $${
            index * 7 + 4
          }, $${index * 7 + 5}, $${index * 7 + 6}, $${index * 7 + 7})`
      )
      .join(", ");

    const imageParams = images.flatMap((img) => [
      id,
      img.url,
      img.width,
      img.height,
      img.size_bytes,
      img.mime_type,
      img.blurhash,
    ]);

    const query = `
        INSERT INTO listing_images (listing_id, url, width, height, size_bytes, mime_type, blurhash)
        VALUES ${imageValues}
        RETURNING *
      `;

    const result = await pool.query(query, imageParams);

    res.json(result.rows);
  } catch (error) {
    console.error("Error uploading images:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const setPrimaryImage = async (req, res) => {
  try {
    const { id, imageId } = req.params;
    const userId = req.user.id;

    // Verify ownership
    const listing = await getListingByIdModel(id);

    if (!listing) {
      return res.status(404).json({ error: "Listing not found" });
    }

    const sellerQuery = `
        SELECT s.id 
        FROM sellers s 
        WHERE s.id = $1 AND s.user_id = $2
      `;
    const sellerResult = await pool.query(sellerQuery, [
      listing.seller_id,
      userId,
    ]);

    if (sellerResult.rows.length === 0) {
      return res
        .status(403)
        .json({ error: "Not authorized to modify this listing" });
    }

    await pool.query("BEGIN");

    // Unset all primary images for this listing
    await pool.query(
      "UPDATE listing_images SET is_primary = false WHERE listing_id = $1",
      [id]
    );

    // Set new primary image
    await pool.query(
      "UPDATE listing_images SET is_primary = true WHERE id = $1",
      [imageId]
    );

    await pool.query("COMMIT");

    res.json({ message: "Primary image set successfully" });
  } catch (error) {
    await pool.query("ROLLBACK");
    console.error("Error setting primary image:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = {
  createListing,
  getListings,
  getListing,
  updateListing,
  deleteListing,
  searchListings,
  toggleFavorite,
  getFavorites,
  uploadImages,
  setPrimaryImage,
};
