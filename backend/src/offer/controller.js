const pool = require('../database/connection');
const { 
  createOffer: createOfferModel,
  getOffersByUser,
  getOffersByListing,
  getOfferById,
  updateOfferStatus,
  createCounterOffer
} = require('./model');

const createOffer = async (req, res) => {
  try {
    const buyerId = req.user.id;
    const { listing_id, offered_price, offered_quantity, expires_at } = req.body;
    
    // Get seller ID for the listing
    const listingQuery = `
      SELECT l.seller_id, l.title, l.price, s.user_id as seller_user_id
      FROM listings l
      JOIN sellers s ON l.seller_id = s.id
      WHERE l.id = $1 AND l.is_published = true AND l.deleted_at IS NULL
    `;
    
    const listingResult = await pool.query(listingQuery, [listing_id]);
    
    if (listingResult.rows.length === 0) {
      return res.status(404).json({ error: 'Listing not found' });
    }
    
    const listing = listingResult.rows[0];
    
    // Prevent buyer from making offer on their own listing
    if (listing.seller_user_id === buyerId) {
      return res.status(400).json({ error: 'Cannot make offer on your own listing' });
    }
    
    const offer = await createOfferModel(buyerId, listing.seller_id, {
      listing_id,
      offered_price,
      offered_quantity,
      expires_at
    });
    
    res.status(201).json(offer);
  } catch (error) {
    console.error('Error creating offer:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getBuyerOffers = async (req, res) => {
  try {
    const buyerId = req.user.id;
    const { status, page = 1, limit = 20 } = req.query;
    
    const filters = {};
    if (status) filters.status = status;
    
    const options = {
      page: parseInt(page),
      limit: parseInt(limit)
    };
    
    const result = await getOffersByUser(buyerId, 'buyer', filters, options);
    
    res.json(result);
  } catch (error) {
    console.error('Error getting buyer offers:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getSellerOffers = async (req, res) => {
  try {
    const sellerUserId = req.user.id;
    
    // Get seller ID for this user
    const sellerQuery = 'SELECT id FROM sellers WHERE user_id = $1';
    const sellerResult = await pool.query(sellerQuery, [sellerUserId]);
    
    if (sellerResult.rows.length === 0) {
      return res.status(404).json({ error: 'Seller profile not found' });
    }
    
    const sellerId = sellerResult.rows[0].id;
    const { status, page = 1, limit = 20 } = req.query;
    
    const filters = {};
    if (status) filters.status = status;
    
    const options = {
      page: parseInt(page),
      limit: parseInt(limit)
    };
    
    const result = await getOffersByUser(sellerId, 'seller', filters, options);
    
    res.json(result);
  } catch (error) {
    console.error('Error getting seller offers:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getListingOffers = async (req, res) => {
  try {
    const { listingId } = req.params;
    const { status, page = 1, limit = 20 } = req.query;
    
    const filters = {};
    if (status) filters.status = status;
    
    const options = {
      page: parseInt(page),
      limit: parseInt(limit)
    };
    
    const result = await getOffersByListing(listingId, filters, options);
    
    res.json(result);
  } catch (error) {
    console.error('Error getting listing offers:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getOffer = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    
    const offer = await getOfferById(userId, id);
    
    if (!offer) {
      return res.status(404).json({ error: 'Offer not found' });
    }
    
    res.json(offer);
  } catch (error) {
    console.error('Error getting offer:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const acceptOffer = async (req, res) => {
  try {
    const sellerUserId = req.user.id;
    const { id } = req.params;
    
    // Get seller ID for this user
    const sellerQuery = 'SELECT id FROM sellers WHERE user_id = $1';
    const sellerResult = await pool.query(sellerQuery, [sellerUserId]);
    
    if (sellerResult.rows.length === 0) {
      return res.status(404).json({ error: 'Seller profile not found' });
    }
    
    const sellerId = sellerResult.rows[0].id;
    
    const offer = await updateOfferStatus(sellerId, id, 'accepted');
    
    res.json(offer);
  } catch (error) {
    console.error('Error accepting offer:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const declineOffer = async (req, res) => {
  try {
    const sellerUserId = req.user.id;
    const { id } = req.params;
    
    // Get seller ID for this user
    const sellerQuery = 'SELECT id FROM sellers WHERE user_id = $1';
    const sellerResult = await pool.query(sellerQuery, [sellerUserId]);
    
    if (sellerResult.rows.length === 0) {
      return res.status(404).json({ error: 'Seller profile not found' });
    }
    
    const sellerId = sellerResult.rows[0].id;
    
    const offer = await updateOfferStatus(sellerId, id, 'declined');
    
    res.json(offer);
  } catch (error) {
    console.error('Error declining offer:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const counterOffer = async (req, res) => {
  try {
    const sellerUserId = req.user.id;
    const { id } = req.params;
    const { offered_price, offered_quantity, expires_at } = req.body;
    
    // Get seller ID for this user
    const sellerQuery = 'SELECT id FROM sellers WHERE user_id = $1';
    const sellerResult = await pool.query(sellerQuery, [sellerUserId]);
    
    if (sellerResult.rows.length === 0) {
      return res.status(404).json({ error: 'Seller profile not found' });
    }
    
    const sellerId = sellerResult.rows[0].id;
    
    const counterOffer = await createCounterOffer(sellerId, id, {
      offered_price,
      offered_quantity,
      expires_at
    });
    
    res.status(201).json(counterOffer);
  } catch (error) {
    console.error('Error creating counter offer:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const cancelOffer = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    
    const offer = await updateOfferStatus(userId, id, 'cancelled');
    
    res.json(offer);
  } catch (error) {
    console.error('Error cancelling offer:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  createOffer,
  getBuyerOffers,
  getSellerOffers,
  getListingOffers,
  getOffer,
  acceptOffer,
  declineOffer,
  counterOffer,
  cancelOffer
};
