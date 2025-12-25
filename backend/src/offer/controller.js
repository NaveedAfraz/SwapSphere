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
    const { listing_id, offered_price, offered_quantity, expires_at, intent_id, offer_type, cash_amount, swap_items } = req.body;
    
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
    
    // Check if this is a seller making a swap offer on their own listing
    const isSellerMakingSwapOffer = !isSellerRespondingToIntent && 
                                   listing.seller_user_id === buyerId && 
                                   ['swap', 'hybrid'].includes(offer_type);
    
    // Prevent buyer from making offer on their own listing, unless:
    // 1. It's a seller responding to an intent, OR
    // 2. It's a seller making a swap offer on their own listing
    if (!isSellerRespondingToIntent && !isSellerMakingSwapOffer && listing.seller_user_id === buyerId) {
      return res.status(400).json({ error: 'Cannot make offer on your own listing' });
    }
    
    // Validate swap offer data
    if (offer_type && ['swap', 'hybrid'].includes(offer_type)) {
      if (!swap_items || !Array.isArray(swap_items) || swap_items.length === 0) {
        return res.status(400).json({ error: 'Swap offers must include at least one swap item' });
      }
      
      if (offer_type === 'hybrid' && (!cash_amount || cash_amount <= 0)) {
        return res.status(400).json({ error: 'Hybrid offers must include a cash amount' });
      }
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
        } else {
          // Create new deal room
          const createDealRoomQuery = `
            INSERT INTO deal_rooms (intent_id, listing_id, seller_id, current_state)
            VALUES ($1, $2, $3, 'pending')
            RETURNING *
          `;
          const newDealRoom = await pool.query(createDealRoomQuery, [intent_id, listing_id, listing.seller_id]);
          dealRoom = newDealRoom.rows[0];
        }
      } catch (error) {
        // Continue without deal room for now
      }
    } else if (isSellerMakingSwapOffer) {
      // This is a seller making a swap offer on their own listing
      // Find existing deal room for this listing, or create one if none exists
      try {
        const findExistingDealRoomQuery = `
          SELECT id FROM deal_rooms 
          WHERE listing_id = $1
          ORDER BY created_at DESC
          LIMIT 1
        `;
        const existingDealRoom = await pool.query(findExistingDealRoomQuery, [listing_id]);
        
        if (existingDealRoom.rows.length > 0) {
          dealRoom = existingDealRoom.rows[0];
        } else {
          // Don't create a new deal room for seller swap offers
          return res.status(400).json({ error: 'Cannot create swap offer - no active negotiation found' });
        }
      } catch (error) {
        console.error('[OFFER] Error finding deal room for seller swap:', error);
        return res.status(500).json({ error: 'Error finding deal room' });
      }
    } else {
      // Regular buyer offer - create new deal room if none exists
      try {
        const findExistingDealRoomQuery = `
          SELECT id FROM deal_rooms 
          WHERE listing_id = $1 AND buyer_id = $2
          ORDER BY created_at DESC
          LIMIT 1
        `;
        const existingDealRoom = await pool.query(findExistingDealRoomQuery, [listing_id, buyerId]);
        
        if (existingDealRoom.rows.length > 0) {
          dealRoom = existingDealRoom.rows[0];
        } else {
          // Create new deal room for buyer offer
          const createDealRoomQuery = `
            INSERT INTO deal_rooms (listing_id, buyer_id, seller_id, current_state)
            VALUES ($1, $2, $3, 'negotiation')
            RETURNING *
          `;
          const newDealRoom = await pool.query(createDealRoomQuery, [listing_id, buyerId, listing.seller_id]);
          dealRoom = newDealRoom.rows[0];
        }
      } catch (error) {
        console.error('[OFFER] Error creating deal room for buyer:', error);
        // Continue without deal room for now
      }
    }
    
    // Before creating new offer, mark any existing pending offers as countered
    // This ensures only one offer per deal room has status = 'pending' at any time
    if (dealRoom?.id) {
      try {
        const updatePendingOffersQuery = `
          UPDATE offers 
          SET status = 'countered', updated_at = NOW()
          WHERE deal_room_id = $1 AND status = 'pending'
        `;
        const updateResult = await pool.query(updatePendingOffersQuery, [dealRoom.id]);
      } catch (error) {
        console.error('[OFFER] Error updating pending offers:', error);
        // Continue with offer creation even if this fails
      }
    } else {
      // If no deal room exists, check for other pending offers on the same listing
      // This handles the case of multiple offers on the same listing before deal room creation
      try {
        const updateListingOffersQuery = `
          UPDATE offers 
          SET status = 'countered', updated_at = NOW()
          WHERE listing_id = $1 AND status = 'pending' AND deal_room_id IS NULL
        `;
        const updateResult = await pool.query(updateListingOffersQuery, [listing_id]);
      } catch (error) {
        console.error('[OFFER] Error updating listing offers:', error);
        // Continue with offer creation even if this fails
      }
    }
    
    // Create offer with deal room ID
    let offer;
    if (isSellerRespondingToIntent) {
      // This is a seller responding to an intent, treat as counter-offer
      // Get the original intent to find the buyer first
      const intentQuery = `
        SELECT buyer_id FROM intents WHERE id = $1
      `;
      const intentResult = await pool.query(intentQuery, [intent_id]);
      
      if (intentResult.rows.length === 0) {
        throw new Error('Intent not found');
      }
      
      const actualBuyerId = intentResult.rows[0].buyer_id;
      
      // Create offer with correct buyer_id (the actual buyer, not the seller)
      offer = await createOfferModel(actualBuyerId, listing.seller_id, {
        listing_id,
        offered_price,
        offered_quantity,
        expires_at,
        intent_id, // Link to the original intent
        deal_room_id: dealRoom?.id, // Link to deal room
        is_counter_offer: true, // Flag this as a counter-offer
        offer_type,
        cash_amount,
        swap_items,
        metadata: {
          made_by_user_id: listing.seller_user_id,
          is_seller_counter_to_intent: true
        }
      });
      
      
      // TODO: Implement proper notification model/service
      // await createNotification(actualBuyerId, {
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
      //     offer_type: offer.offer_type,
      //     cash_amount: offer.cash_amount,
      //     swap_items: offer.swap_items
      //   },
      //   actor_id: listing.seller_user_id
      // });
    } else if (isSellerMakingSwapOffer) {
      // This is a seller making a swap offer on their own listing
      // Find existing deal room for this listing, or create one if none exists
      try {
        const findExistingDealRoomQuery = `
          SELECT id FROM deal_rooms 
          WHERE listing_id = $1
          ORDER BY created_at DESC
          LIMIT 1
        `;
        const existingDealRoom = await pool.query(findExistingDealRoomQuery, [listing_id]);
        
        if (existingDealRoom.rows.length > 0) {
          dealRoom = existingDealRoom.rows[0];
          
          // Get the actual buyer from the deal room
          const dealRoomBuyerQuery = `
            SELECT buyer_id FROM deal_rooms WHERE id = $1
          `;
          const dealRoomBuyerResult = await pool.query(dealRoomBuyerQuery, [dealRoom.id]);
          
          if (dealRoomBuyerResult.rows.length === 0) {
            return res.status(400).json({ error: 'Deal room not found' });
          }
          
          const actualBuyerId = dealRoomBuyerResult.rows[0].buyer_id;
          
          // Create the swap offer with correct buyer_id (the actual buyer from deal room)
          // The offer should always belong to the buyer, even if seller is countering
          offer = await createOfferModel(actualBuyerId, listing.seller_id, {
            listing_id,
            offered_price,
            offered_quantity,
            expires_at,
            deal_room_id: dealRoom?.id,
            offer_type,
            cash_amount,
            swap_items,
            metadata: {
              made_by_user_id: listing.seller_user_id, // Track that seller made this offer
              is_seller_swap_offer: true
            }
          });
        } else {
          // Don't create a new deal room for seller swap offers
          return res.status(400).json({ error: 'Cannot create swap offer - no active negotiation found' });
        }
      } catch (error) {
        console.error('[OFFER] Error finding deal room for seller swap:', error);
        return res.status(500).json({ error: 'Error finding deal room' });
      }
      
    } else {
      // Regular buyer offer
      offer = await createOfferModel(buyerId, listing.seller_id, {
        listing_id,
        offered_price,
        offered_quantity,
        expires_at,
        deal_room_id: dealRoom?.id, // Link to deal room if available
        offer_type,
        cash_amount,
        swap_items,
        metadata: {
          made_by_user_id: buyerId,
          is_buyer_offer: true
        }
      });
      
      // TODO: Implement proper notification model/service
      // await createNotification(listing.seller_user_id, {
      //   type: 'offer_received',
      //   payload: {
      //     offer_id: offer.id,
      //     listing_id: listing_id,
      //     listing_title: listing.title,
      //     offered_price: offered_price,
      //     offered_quantity: offered_quantity,
      //     buyer_id: buyerId,
      //     offer_type: offer.offer_type,
      //     cash_amount: offer.cash_amount,
      //     swap_items: offer.swap_items
      //   },
      //   actor_id: buyerId
      // });
    }
    
    // Update deal room with latest offer information
    if (dealRoom?.id) {
      // Note: latest_offer_id column doesn't exist in deal_rooms table
      // The frontend gets latest offer from the offers API endpoint
    }
    
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
    
    
    // Get seller ID for this user
    const sellerQuery = 'SELECT id FROM sellers WHERE user_id = $1';
    const sellerResult = await pool.query(sellerQuery, [sellerUserId]);
    
    if (sellerResult.rows.length === 0) {
      await pool.query('ROLLBACK');
      return res.status(404).json({ error: 'Seller profile not found' });
    }
    
    const sellerId = sellerResult.rows[0].id;
    
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
      return res.status(404).json({ error: 'Offer not found' });
    }
    
    const offerDetails = offerDetailsResult.rows[0];
    
    // Check if order already exists for this offer
    const existingOrderQuery = 'SELECT id FROM orders WHERE metadata->>\'offer_id\' = $1';
    const existingOrderResult = await pool.query(existingOrderQuery, [id]);
    
    if (existingOrderResult.rows.length > 0) {
      await pool.query('ROLLBACK');
      return res.status(400).json({ error: 'Order already exists for this offer' });
    }
    
    // Update offer status to accepted
    const offer = await updateOfferStatus(sellerId, id, 'accepted');
    
    // Create order
    const { createOrder } = require('../order/model');
    const order = await createOrder(offerDetails.buyer_id, sellerId, {
      total_amount: offerDetails.offer_type === 'cash' ? offerDetails.offered_price * offerDetails.offered_quantity : (offerDetails.cash_amount || 0) * offerDetails.offered_quantity,
      currency: offerDetails.currency || 'USD',
      metadata: {
        offer_id: id,
        listing_id: offerDetails.listing_id,
        intent_id: offerDetails.intent_id
      },
      order_type: offerDetails.offer_type || 'cash',
      swap_items: offerDetails.swap_items || []
    });

    // Emit deal.offer.accepted event
    await EventService.dealOfferAccepted({
      dealRoomId: offerDetails.deal_room_id,
      orderId: order.id,
      buyerId: offerDetails.buyer_id,
      sellerId: sellerId,
      amount: order.total_amount
    });

    // Create deal event for order creation
    const { createDealEvent } = require('../dealEvents/model');
    await createDealEvent(offerDetails.deal_room_id, sellerUserId, 'order.created', {
      order_id: order.id,
      offer_id: id,
      buyer_id: offerDetails.buyer_id,
      seller_id: sellerId,
      amount: order.total_amount
    });
    
    // Update deal room state
    await handleOfferAccepted(offerDetails.deal_room_id, sellerUserId);
    
    // Update existing notification status for seller
    const existingNotificationQuery = `
      SELECT id FROM notifications 
      WHERE user_id = $1 AND type = 'offer_received' 
      AND payload->>'offer_id' = $2
    `;
    const existingNotificationResult = await pool.query(existingNotificationQuery, [sellerUserId, id]);
    
    
    if (existingNotificationResult.rows.length > 0) {
      // TODO: Implement proper notification model/service
      // try {
      //   const updatedNotification = await updateNotificationStatus(existingNotificationResult.rows[0].id, sellerUserId, 'accepted', true);
      // } catch (error) {
      //   console.warn('[OFFER] Failed to update notification status:', error.message);
      // }
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
    }
    
    await pool.query('COMMIT');
    
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
    } catch (socketError) {
      console.error('[OFFER] Failed to emit socket event:', socketError);
    }
    
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
    }
    
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
    
    // Need to compare seller's user_id, not seller_id
    const notificationRecipientId = originalOffer.buyer_id === userId ? '12f7cbbb-5fde-4024-800d-edfbd1895729' : originalOffer.buyer_id;
    
    
    if (!notificationRecipientId) {
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
    }
    
    }
    
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
    
    
    const offer = await updateOfferStatus(userId, id, 'cancelled');
    
    res.json(offer);
  } catch (error) {
    console.error('[OFFER] Error cancelling offer:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const updateOfferController = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { counter_amount, counter_message, expires_at, offer_type, cash_amount, swap_items } = req.body;
    
    
    const updatedOffer = await updateOffer(userId, id, { counter_amount, expires_at, offer_type, cash_amount, swap_items });
    
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
