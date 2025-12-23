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
const { handleOfferAccepted } = require('../dealRooms/stateTransitions');
const EventService = require('../services/eventService');

// TODO: Implement proper notification model/service
// const { createNotification, updateNotificationStatus } = require('../notifications/model');
// const { emitSocketEvent } = require('../socket/socketHandlers');

const createOffer = async (req, res) => {
  try {
    const buyerId = req.user.id;
    const { listing_id, offered_price, offered_quantity, expires_at, intent_id } = req.body;
    
    console.log('[OFFER] Creating new offer:', { buyerId, listing_id, offered_price, offered_quantity, expires_at, intent_id });
    
    // Get listing details
    const listingQuery = `
      SELECT l.*, s.user_id as seller_user_id
      FROM listings l
      JOIN sellers s ON l.seller_id = s.id
      WHERE l.id = $1
    `;
    const listingResult = await pool.query(listingQuery, [listing_id]);
    
    if (listingResult.rows.length === 0) {
      console.log('[OFFER] Listing not found:', listing_id);
      return res.status(404).json({ error: 'Listing not found' });
    }
    
    const listing = listingResult.rows[0];
    console.log('[OFFER] Found listing:', { listingId: listing_id, sellerUserId: listing.seller_user_id });
    
    // Check if this is a seller responding to an intent
    const isSellerRespondingToIntent = intent_id && listing.seller_user_id === buyerId;
    console.log('[OFFER] Is seller responding to intent:', isSellerRespondingToIntent);
    
    // Prevent buyer from making offer on their own listing, unless it's a seller responding to intent
    if (!isSellerRespondingToIntent && listing.seller_user_id === buyerId) {
      console.log('[OFFER] Cannot make offer on own listing');
      return res.status(400).json({ error: 'Cannot make offer on your own listing' });
    }
    
    // Create or find deal room first
    let dealRoom;
    if (isSellerRespondingToIntent && intent_id) {
      console.log('[OFFER] Finding or creating deal room for intent');
      // For seller responding to intent, find existing deal room or create new one
      try {
        const findDealRoomQuery = `
          SELECT id FROM deal_rooms 
          WHERE intent_id = $1 AND listing_id = $2
        `;
        const existingDealRoom = await pool.query(findDealRoomQuery, [intent_id, listing_id]);
        
        if (existingDealRoom.rows.length > 0) {
          dealRoom = existingDealRoom.rows[0];
          console.log('[OFFER] Found existing deal room:', dealRoom.id);
        } else {
          // Create new deal room
          const createDealRoomQuery = `
            INSERT INTO deal_rooms (intent_id, listing_id, buyer_id, seller_id)
            SELECT $1, $2, buyer_id, $3 FROM intents WHERE id = $1
            RETURNING *
          `;
          const newDealRoom = await pool.query(createDealRoomQuery, [intent_id, listing_id, listing.seller_id]);
          dealRoom = newDealRoom.rows[0];
          console.log('[OFFER] Created new deal room:', dealRoom.id);
        }
      } catch (error) {
        console.error('[OFFER] Error creating/deal room:', error);
        // Continue without deal room for now
      }
    }
    
    // Create offer with deal room ID
    let offer;
    if (isSellerRespondingToIntent) {
      console.log('[OFFER] Creating seller counter offer');
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
        console.log('[OFFER] Creating notification for buyer:', buyerId);
        
        // TODO: Implement proper notification model/service
        // await createNotification(buyerId, {
        //   type: 'offer_countered',
        //   payload: {
        //     offer_id: offer.id,
        //     listing_id: listing_id,
        //     listing_title: listing.title,
        //     offered_price: offered_price,
        //     offered_quantity: offered_quantity,
        //     seller_user_id: listing.seller_user_id,
        //     intent_id: intent_id,
        //     deal_room_id: dealRoom?.id, // Add deal room ID to notification
        //   },
        //   actor_id: listing.seller_user_id
        // });
        console.log('[OFFER] Buyer notification skipped - notification service not implemented');
      }
    } else {
      console.log('[OFFER] Creating regular buyer offer');
      // Regular buyer offer
      offer = await createOfferModel(buyerId, listing.seller_id, {
        listing_id,
        offered_price,
        offered_quantity,
        expires_at,
        deal_room_id: dealRoom?.id, // Link to deal room if available
      });
      
      console.log('[OFFER] Creating notification for seller:', listing.seller_user_id);
      // TODO: Implement proper notification model/service
      // await createNotification(listing.seller_user_id, {
      //   type: 'offer_received',
      //   payload: {
      //     offer_id: offer.id,
      //     listing_id: listing_id,
      //     listing_title: listing.title,
      //     offered_price: offered_price,
      //     offered_quantity: offered_quantity,
      //     buyer_id: buyerId
      //   },
      //   actor_id: buyerId
      // });
      console.log('[OFFER] Seller notification skipped - notification service not implemented');
    }
    
    console.log('[OFFER] Offer created successfully:', { offerId: offer.id, dealRoomId: dealRoom?.id });
    res.status(201).json({
      ...offer,
      deal_room_id: dealRoom?.id
    });
  } catch (error) {
    console.error('[OFFER] Error creating offer:', error);
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
  await pool.query('BEGIN');
  
  try {
    const sellerUserId = req.user.id;
    const { id } = req.params;
    
    console.log('[OFFER] Accepting offer:', { offerId: id, sellerUserId });
    
    // Get seller ID for this user
    const sellerQuery = 'SELECT id FROM sellers WHERE user_id = $1';
    const sellerResult = await pool.query(sellerQuery, [sellerUserId]);
    
    if (sellerResult.rows.length === 0) {
      await pool.query('ROLLBACK');
      console.log('[OFFER] Seller profile not found for user:', sellerUserId);
      return res.status(404).json({ error: 'Seller profile not found' });
    }
    
    const sellerId = sellerResult.rows[0].id;
    console.log('[OFFER] Found seller ID:', sellerId);
    
    // Get offer details before updating
    const offerDetailsQuery = `
      SELECT o.*, l.title as listing_title, dr.id as deal_room_id
      FROM offers o
      JOIN listings l ON o.listing_id = l.id
      LEFT JOIN deal_rooms dr ON o.deal_room_id = dr.id
      WHERE o.id = $1
    `;
    const offerDetailsResult = await pool.query(offerDetailsQuery, [id]);
    
    if (offerDetailsResult.rows.length === 0) {
      await pool.query('ROLLBACK');
      console.log('[OFFER] Offer not found:', id);
      return res.status(404).json({ error: 'Offer not found' });
    }
    
    const offerDetails = offerDetailsResult.rows[0];
    console.log('[OFFER] Found offer details:', { id, status: offerDetails.status, buyer_id: offerDetails.buyer_id });
    
    // Check if order already exists for this offer
    const existingOrderQuery = 'SELECT id FROM orders WHERE metadata->>\'offer_id\' = $1';
    const existingOrderResult = await pool.query(existingOrderQuery, [id]);
    
    if (existingOrderResult.rows.length > 0) {
      await pool.query('ROLLBACK');
      console.log('[OFFER] Order already exists for offer:', id);
      return res.status(400).json({ error: 'Order already exists for this offer' });
    }
    
    // Update offer status to accepted
    console.log('[OFFER] Updating offer status to accepted...');
    const offer = await updateOfferStatus(sellerId, id, 'accepted');
    console.log('[OFFER] Offer status updated successfully:', { id, newStatus: 'accepted' });
    
    // Create order
    console.log('[OFFER] Creating order...');
    const { createOrder } = require('../order/model');
    const order = await createOrder(offerDetails.buyer_id, sellerId, {
      total_amount: offerDetails.offered_price * offerDetails.offered_quantity,
      currency: offerDetails.currency || 'USD',
      metadata: {
        offer_id: id,
        listing_id: offerDetails.listing_id,
        intent_id: offerDetails.intent_id
      }
    });
    console.log('[OFFER] Order created successfully:', { orderId: order.id });

    // Emit deal.offer.accepted event
    await EventService.dealOfferAccepted({
      dealRoomId: offerDetails.deal_room_id,
      orderId: order.id,
      buyerId: offerDetails.buyer_id,
      sellerId: sellerId,
      amount: order.total_amount
    });

    // Create deal event for order creation
    console.log('[OFFER] Creating deal event...');
    const { createDealEvent } = require('../dealEvents/model');
    await createDealEvent(offerDetails.deal_room_id, sellerUserId, 'order.created', {
      order_id: order.id,
      offer_id: id,
      buyer_id: offerDetails.buyer_id,
      seller_id: sellerId,
      amount: order.total_amount
    });
    console.log('[OFFER] Deal event created successfully');
    
    // Update deal room state
    await handleOfferAccepted(offerDetails.deal_room_id, sellerUserId);
    console.log('[OFFER] Deal room state updated to offer_accepted');
    
    // Update existing notification status for seller
    const existingNotificationQuery = `
      SELECT id FROM notifications 
      WHERE user_id = $1 AND type = 'offer_received' 
      AND payload->>'offer_id' = $2
    `;
    const existingNotificationResult = await pool.query(existingNotificationQuery, [sellerUserId, id]);
    
    console.log('[OFFER] Found notifications to update:', existingNotificationResult.rows.length);
    
    if (existingNotificationResult.rows.length > 0) {
      console.log('[OFFER] Updating notification status for seller');
      // TODO: Implement proper notification model/service
      // try {
      //   const updatedNotification = await updateNotificationStatus(existingNotificationResult.rows[0].id, sellerUserId, 'accepted', true);
      //   console.log('[OFFER] Notification status updated successfully');
      // } catch (error) {
      //   console.warn('[OFFER] Failed to update notification status:', error.message);
      // }
      console.log('[OFFER] Notification status update skipped - notification service not implemented');
    }
    
    // Get offer details to notify buyer
    const offerNotificationQuery = `
      SELECT o.buyer_id, l.title as listing_title, o.offered_price, o.offered_quantity
      FROM offers o
      JOIN listings l ON o.listing_id = l.id
      WHERE o.id = $1
    `;
    const offerResult = await pool.query(offerNotificationQuery, [id]);
    
    if (offerResult.rows.length > 0) {
      const offerDetails = offerResult.rows[0];
      console.log('[OFFER] Creating notification for buyer:', offerDetails.buyer_id);
      
      // Create notification for buyer about offer acceptance
      // TODO: Implement proper notification model/service
      // await createNotification(offerDetails.buyer_id, {
      //   type: 'offer_accepted',
      //   payload: {
      //     offer_id: id,
      //     listing_id: offer.listing_id,
      //     listing_title: offerDetails.listing_title,
      //     offered_price: offerDetails.offered_price,
      //     offered_quantity: offerDetails.offered_quantity,
      //     seller_user_id: sellerUserId,
      //     status: 'accepted'
      //   },
      //   actor_id: sellerUserId
      // });
      console.log('[OFFER] Buyer notification skipped - notification service not implemented');
    }
    
    await pool.query('COMMIT');
    console.log('[OFFER] Transaction committed successfully');
    
    // Emit socket event for real-time update
    try {
      // TODO: Implement proper socket event emission
      // const { emitSocketEvent } = require('../socket/socketHandlers');
      // await emitSocketEvent('offer_updated', {
      //   offer_id: id,
      //   status: 'accepted',
      //   updated_by: sellerUserId,
      //   deal_room_id: offerDetails.deal_room_id,
      //   order_id: order.id
      // });
      console.log('[OFFER] Socket event emission skipped - socket handlers not implemented');
    } catch (socketError) {
      console.error('[OFFER] Failed to emit socket event:', socketError);
    }
    
    console.log('[OFFER] Offer acceptance completed successfully:', { offerId: id, orderId: order.id });
    res.json({ offer, order });
  } catch (error) {
    await pool.query('ROLLBACK');
    console.error('[OFFER] Error accepting offer:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const declineOffer = async (req, res) => {
  try {
    const sellerUserId = req.user.id;
    const { id } = req.params;
    
    console.log('[OFFER] Declining offer:', { offerId: id, sellerUserId });
    
    // Get seller ID for this user
    const sellerQuery = 'SELECT id FROM sellers WHERE user_id = $1';
    const sellerResult = await pool.query(sellerQuery, [sellerUserId]);
    
    if (sellerResult.rows.length === 0) {
      console.log('[OFFER] Seller profile not found for user:', sellerUserId);
      return res.status(404).json({ error: 'Seller profile not found' });
    }
    
    const sellerId = sellerResult.rows[0].id;
    console.log('[OFFER] Found seller ID:', sellerId);
    
    console.log('[OFFER] Updating offer status to declined...');
    const offer = await updateOfferStatus(sellerId, id, 'declined');
    console.log('[OFFER] Offer status updated successfully:', { id, newStatus: 'declined' });
    
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
      console.log('[OFFER] Creating notification for buyer:', offerDetails.buyer_id);
      
      // Create notification for buyer about offer decline
      // TODO: Implement proper notification model/service
      // await createNotification(offerDetails.buyer_id, {
      //   type: 'offer_declined',
      //   payload: {
      //     offer_id: id,
      //     listing_id: offer.listing_id,
      //     listing_title: offerDetails.listing_title,
      //     offered_price: offerDetails.offered_price,
      //     offered_quantity: offerDetails.offered_quantity,
      //     seller_user_id: sellerUserId
      //   },
      //   actor_id: sellerUserId
      // });
      console.log('[OFFER] Buyer notification skipped - notification service not implemented');
    }
    
    console.log('[OFFER] Offer decline completed successfully:', { offerId: id });
    res.json(offer);
  } catch (error) {
    console.error('[OFFER] Error declining offer:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const counterOffer = async (req, res) => {
  try {
    const { id } = req.params;
    const { offered_price, offered_quantity, expires_at } = req.body;
    const userId = req.user.id; // Use userId instead of sellerUserId
    
    console.log('[OFFER] Creating counter offer:', { originalOfferId: id, userId, offered_price, offered_quantity, expires_at });
    
    const counterOffer = await createCounterOffer(userId, id, {
      counter_amount: offered_price, // Map offered_price to counter_amount
      offered_quantity,
      expires_at
    });
    console.log('[OFFER] Counter offer created successfully:', { counterOfferId: counterOffer.id });
    
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
      console.log('[OFFER] Creating notification for counter offer recipient');
      
      // Create notification for the OTHER party about counter offer
    // If current user is seller, notify buyer. If current user is buyer, notify seller.
    console.log('[OFFER] Calculating notification recipient - Original offer buyer ID:', originalOffer.buyer_id, 'Current User ID:', userId);
    
    // Need to compare seller's user_id, not seller_id
    const notificationRecipientId = originalOffer.buyer_id === userId ? '12f7cbbb-5fde-4024-800d-edfbd1895729' : originalOffer.buyer_id;
    
    console.log('[OFFER] Notification recipient ID:', notificationRecipientId);
    
    if (!notificationRecipientId) {
      console.log('[OFFER] Skipping notification - no recipient');
    } else {
      // TODO: Implement proper notification model/service
      // await createNotification(notificationRecipientId, {
      //   type: 'offer_countered',
      //   payload: {
      //     offer_id: counterOffer.id,
      //     original_offer_id: id,
      //     listing_id: counterOffer.listing_id,
      //     listing_title: originalOffer.listing_title,
      //     offered_price: offered_price,
      //     offered_quantity: offered_quantity,
      //     seller_user_id: originalOffer.seller_id, // Always use actual seller ID
      //     deal_room_id: originalOffer.deal_room_id // Add deal room ID to notification
      //   },
      //   actor_id: userId
      // });
      console.log('[OFFER] Counter offer notification skipped - notification service not implemented');
    }
    
    }
    
    console.log('[OFFER] Counter offer process completed successfully:', { counterOfferId: counterOffer.id });
    res.status(201).json(counterOffer);
  } catch (error) {
    console.error('[OFFER] Error creating counter offer:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const cancelOffer = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    
    console.log('[OFFER] Cancelling offer:', { offerId: id, userId });
    
    const offer = await updateOfferStatus(userId, id, 'cancelled');
    console.log('[OFFER] Offer cancelled successfully:', { offerId: id });
    
    console.log('[OFFER] Offer cancellation completed successfully:', { offerId: id });
    res.json(offer);
  } catch (error) {
    console.error('[OFFER] Error cancelling offer:', error);
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
