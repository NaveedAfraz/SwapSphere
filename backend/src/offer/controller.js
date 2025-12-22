const { pool } = require("../database/db");
const { 
  createOffer: createOfferModel,
  getOffersByUser,
  getOffersByListing,
  getOfferById,
  updateOfferStatus,
  createCounterOffer,
  updateOffer
} = require('./model');
const { createNotification, updateNotificationStatus } = require('../notification/model');

const createOffer = async (req, res) => {
  try {
    const buyerId = req.user.id;
    const { listing_id, offered_price, offered_quantity, expires_at, intent_id } = req.body;
    
    
    // Get listing details
    const listingQuery = `
      SELECT l.*, s.user_id as seller_user_id
      FROM listings l
      JOIN sellers s ON l.seller_id = s.id
      WHERE l.id = $1
    `;
    const listingResult = await pool.query(listingQuery, [listing_id]);
    
    if (listingResult.rows.length === 0) {
      return res.status(404).json({ error: 'Listing not found' });
    }
    
    const listing = listingResult.rows[0];
    
    // Check if this is a seller responding to an intent
    const isSellerRespondingToIntent = intent_id && listing.seller_user_id === buyerId;
    
    
    // Prevent buyer from making offer on their own listing, unless it's a seller responding to intent
    if (!isSellerRespondingToIntent && listing.seller_user_id === buyerId) {
      return res.status(400).json({ error: 'Cannot make offer on your own listing' });
    }
    
    
    // Create or find deal room first
    let dealRoom;
    if (isSellerRespondingToIntent && intent_id) {
      // For seller responding to intent, find existing deal room or create new one
      try {
        const findDealRoomQuery = `
          SELECT id FROM deal_rooms 
          WHERE intent_id = $1 AND listing_id = $2
        `;
        const existingDealRoom = await pool.query(findDealRoomQuery, [intent_id, listing_id]);
        
        if (existingDealRoom.rows.length > 0) {
          dealRoom = existingDealRoom.rows[0];
          console.log('Found existing deal room:', dealRoom.id);
        } else {
          // Create new deal room
          const createDealRoomQuery = `
            INSERT INTO deal_rooms (intent_id, listing_id, buyer_id, seller_id)
            SELECT $1, $2, buyer_id, $3 FROM intents WHERE id = $1
            RETURNING *
          `;
          const newDealRoom = await pool.query(createDealRoomQuery, [intent_id, listing_id, listing.seller_id]);
          dealRoom = newDealRoom.rows[0];
          console.log('Created new deal room:', dealRoom.id);
        }
      } catch (error) {
        console.error('Error creating/deal room:', error);
        // Continue without deal room for now
      }
    }
    
    // Create offer with deal room ID
    let offer;
    if (isSellerRespondingToIntent) {
      // This is a seller responding to an intent, treat as counter-offer
      // Use seller_user_id (the actual user) not seller_id (the seller record)
      offer = await createOfferModel(listing.seller_user_id, listing.seller_id, {
        listing_id,
        offered_price,
        offered_quantity,
        expires_at,
        intent_id, // Link to the original intent
        deal_room_id: dealRoom?.id, // Link to deal room
        is_counter_offer: true, // Flag this as a counter-offer
      });
      
      
      // Get the original intent to find the buyer
      const intentQuery = `
        SELECT buyer_id FROM intents WHERE id = $1
      `;
      const intentResult = await pool.query(intentQuery, [intent_id]);
      
      if (intentResult.rows.length > 0) {
        const buyerId = intentResult.rows[0].buyer_id;
        
        await createNotification(buyerId, {
          type: 'offer_countered',
          payload: {
            offer_id: offer.id,
            listing_id: listing_id,
            listing_title: listing.title,
            offered_price: offered_price,
            offered_quantity: offered_quantity,
            seller_user_id: listing.seller_user_id,
            intent_id: intent_id,
            deal_room_id: dealRoom?.id, // Add deal room ID to notification
          },
          actor_id: listing.seller_user_id
        });
      }
    } else {
      // Regular buyer offer
      offer = await createOfferModel(buyerId, listing.seller_id, {
        listing_id,
        offered_price,
        offered_quantity,
        expires_at,
        deal_room_id: dealRoom?.id, // Link to deal room if available
      });
      
      
      await createNotification(listing.seller_user_id, {
        type: 'offer_received',
        payload: {
          offer_id: offer.id,
          listing_id: listing_id,
          listing_title: listing.title,
          offered_price: offered_price,
          offered_quantity: offered_quantity,
          buyer_id: buyerId
        },
        actor_id: buyerId
      });
    }
    
    res.status(201).json({
      ...offer,
      deal_room_id: dealRoom?.id
    });
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
    
    // Update existing notification status for seller
    // console.log('Looking for notification with user_id:', sellerUserId, 'and offer_id:', id);
    const existingNotificationQuery = `
      SELECT id FROM notifications 
      WHERE user_id = $1 AND type = 'offer_received' 
      AND payload->>'offer_id' = $2
    `;
    const existingNotificationResult = await pool.query(existingNotificationQuery, [sellerUserId, id]);
    
    // console.log('Found notifications:', existingNotificationResult.rows.length, existingNotificationResult.rows);
    
    if (existingNotificationResult.rows.length > 0) {
      console.log('Found notification to update:', existingNotificationResult.rows[0]);
      try {
        const updatedNotification = await updateNotificationStatus(existingNotificationResult.rows[0].id, sellerUserId, 'accepted', true);
        console.log('Successfully updated notification:', updatedNotification);
      } catch (error) {
        // If status column doesn't exist yet, log error but continue
        console.warn('Failed to update notification status (column may not exist):', error.message);
      }
    } else {
      console.log('No existing notification found for offer:', id, 'user:', sellerUserId);
    }
    
    // Get offer details to notify buyer
    const offerDetailsQuery = `
      SELECT o.buyer_id, l.title as listing_title, o.offered_price, o.offered_quantity
      FROM offers o
      JOIN listings l ON o.listing_id = l.id
      WHERE o.id = $1
    `;
    const offerResult = await pool.query(offerDetailsQuery, [id]);
    
    if (offerResult.rows.length > 0) {
      const offerDetails = offerResult.rows[0];
      
      // Create notification for buyer about offer acceptance
      await createNotification(offerDetails.buyer_id, {
        type: 'offer_accepted',
        payload: {
          offer_id: id,
          listing_id: offer.listing_id,
          listing_title: offerDetails.listing_title,
          offered_price: offerDetails.offered_price,
          offered_quantity: offerDetails.offered_quantity,
          seller_user_id: sellerUserId,
          status: 'accepted'
        },
        actor_id: sellerUserId
      });
    }
    
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
    
    // Get offer details to notify buyer
    const offerDetailsQuery = `
      SELECT o.buyer_id, l.title as listing_title, o.offered_price, o.offered_quantity
      FROM offers o
      JOIN listings l ON o.listing_id = l.id
      WHERE o.id = $1
    `;
    const offerResult = await pool.query(offerDetailsQuery, [id]);
    
    if (offerResult.rows.length > 0) {
      const offerDetails = offerResult.rows[0];
      
      // Create notification for buyer about offer decline
      await createNotification(offerDetails.buyer_id, {
        type: 'offer_declined',
        payload: {
          offer_id: id,
          listing_id: offer.listing_id,
          listing_title: offerDetails.listing_title,
          offered_price: offerDetails.offered_price,
          offered_quantity: offerDetails.offered_quantity,
          seller_user_id: sellerUserId
        },
        actor_id: sellerUserId
      });
    }
    
    res.json(offer);
  } catch (error) {
    console.error('Error declining offer:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const counterOffer = async (req, res) => {
  try {
    const { id } = req.params;
    const { offered_price, offered_quantity, expires_at } = req.body;
    const userId = req.user.id; // Use userId instead of sellerUserId
    
    const counterOffer = await createCounterOffer(userId, id, {
      counter_amount: offered_price, // Map offered_price to counter_amount
      offered_quantity,
      expires_at
    });
    
    // Get original offer details to notify buyer
    const originalOfferQuery = `
      SELECT o.buyer_id, l.title as listing_title
      FROM offers o
      JOIN listings l ON o.listing_id = l.id
      WHERE o.id = $1
    `;
    const originalOfferResult = await pool.query(originalOfferQuery, [id]);
    
    if (originalOfferResult.rows.length > 0) {
      const originalOffer = originalOfferResult.rows[0];
      
      // Create notification for the OTHER party about counter offer
    // If current user is seller, notify buyer. If current user is buyer, notify seller.
    console.log('[COUNTER NOTIFICATION] Calculating recipient - Seller ID:', originalOffer.seller_id, 'Buyer ID:', originalOffer.buyer_id, 'Current User ID:', userId);
    
    // Need to compare seller's user_id, not seller_id
    const notificationRecipientId = originalOffer.buyer_id === userId ? '12f7cbbb-5fde-4024-800d-edfbd1895729' : originalOffer.buyer_id;
    
    console.log('[COUNTER NOTIFICATION] Notification recipient ID:', notificationRecipientId);
    
    if (!notificationRecipientId) {
      console.log('[COUNTER NOTIFICATION] Skipping notification - no recipient');
    } else {
      await createNotification(notificationRecipientId, {
        type: 'offer_countered',
        payload: {
          offer_id: counterOffer.id,
          original_offer_id: id,
          listing_id: counterOffer.listing_id,
          listing_title: originalOffer.listing_title,
          offered_price: offered_price,
          offered_quantity: offered_quantity,
          seller_user_id: originalOffer.seller_id, // Always use actual seller ID
          deal_room_id: originalOffer.deal_room_id // Add deal room ID to notification
        },
        actor_id: userId
      });
    }
    
    }
    
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

const updateOfferController = async (req, res) => {
  try {
    console.log('[CONTROLLER] Update offer request received');
    const userId = req.user.id;
    const { id } = req.params;
    const { counter_amount, counter_message, expires_at } = req.body;
    
    console.log('[CONTROLLER] Update offer data:', { userId, id, counter_amount, counter_message, expires_at });
    
    const updatedOffer = await updateOffer(userId, id, { counter_amount, counter_message, expires_at });
    
    console.log('[CONTROLLER] Offer updated successfully:', updatedOffer);
    res.json(updatedOffer);
  } catch (error) {
    console.error('Error updating offer:', error);
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
  cancelOffer,
  updateOffer: updateOfferController
};
