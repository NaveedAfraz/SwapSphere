const { pool } = require("../database/db");

const createOffer = async (buyerId, sellerId, offerData) => {
  const { listing_id, offered_price, offered_quantity, expires_at, deal_room_id, offer_type, cash_amount, swap_items, metadata } = offerData;
  
  // Default to cash offer for backward compatibility
  const finalOfferType = offer_type || 'cash';
  const finalCashAmount = cash_amount || offered_price || 0;
  const finalSwapItems = swap_items || [];
  const finalMetadata = metadata || {};
  
  const query = `
    INSERT INTO offers (listing_id, buyer_id, seller_id, offered_price, offered_quantity, expires_at, deal_room_id, offer_type, cash_amount, swap_items, metadata)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    RETURNING *
  `;
  
  const result = await pool.query(query, [
    listing_id, buyerId, sellerId, offered_price, offered_quantity || 1, expires_at, deal_room_id,
    finalOfferType, finalCashAmount, JSON.stringify(finalSwapItems), JSON.stringify(finalMetadata)
  ]);
  
  return result.rows[0];
};

const getOffersByUser = async (userId, userType, filters = {}, options = {}) => {
  const { status } = filters;
  const { page = 1, limit = 20 } = options;
  const offset = (page - 1) * limit;
  
  let whereCondition, whereParam;
  if (userType === 'buyer') {
    whereCondition = 'o.buyer_id = $1';
    whereParam = userId;
  } else {
    whereCondition = 'o.seller_id = $1';
    whereParam = userId;
  }
  
  const whereConditions = [whereCondition];
  const queryParams = [whereParam];
  let paramIndex = 2;
  
  if (status) {
    whereConditions.push(`o.status = $${paramIndex++}`);
    queryParams.push(status);
  }
  
  const countQuery = `
    SELECT COUNT(*) as total
    FROM offers o
    WHERE ${whereConditions.join(' AND ')}
  `;
  
  const dataQuery = `
    SELECT o.*, l.title as listing_title, l.price as listing_price,
           li.url as listing_image,
           pb.name as buyer_name, ub.email as buyer_email,
           ps.name as seller_name, s.store_name,
           (SELECT COUNT(*) FROM offers counter WHERE counter.counter_for = o.id) as counter_count
    FROM offers o
    JOIN listings l ON o.listing_id = l.id
    LEFT JOIN listing_images li ON l.id = li.listing_id AND li.is_primary = true
    LEFT JOIN users ub ON o.buyer_id = ub.id
    LEFT JOIN profiles pb ON ub.id = pb.user_id
    LEFT JOIN sellers s ON o.seller_id = s.id
    LEFT JOIN users us ON s.user_id = us.id
    LEFT JOIN profiles ps ON us.id = ps.user_id
    WHERE ${whereConditions.join(' AND ')}
    ORDER BY o.created_at DESC
    LIMIT $${paramIndex++} OFFSET $${paramIndex++}
  `;
  
  queryParams.push(limit, offset);
  
  const [countResult, dataResult] = await Promise.all([
    pool.query(countQuery, queryParams.slice(0, -2)),
    pool.query(dataQuery, queryParams)
  ]);
  
  const total = parseInt(countResult.rows[0].total);
  const totalPages = Math.ceil(total / limit);
  
  return {
    offers: dataResult.rows,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1
    }
  };
};

const getOffersByListing = async (listingId, filters = {}, options = {}) => {
  const { status } = filters;
  const { page = 1, limit = 20 } = options;
  const offset = (page - 1) * limit;
  
  const whereConditions = ['o.listing_id = $1'];
  const queryParams = [listingId];
  let paramIndex = 2;
  
  if (status) {
    whereConditions.push(`o.status = $${paramIndex++}`);
    queryParams.push(status);
  }
  
  const countQuery = `
    SELECT COUNT(*) as total
    FROM offers o
    WHERE ${whereConditions.join(' AND ')}
  `;
  
  const dataQuery = `
    SELECT o.*, 
           pb.name as buyer_name, ub.email as buyer_email,
           pb.avatar_key as buyer_avatar
    FROM offers o
    LEFT JOIN users ub ON o.buyer_id = ub.id
    LEFT JOIN profiles pb ON ub.id = pb.user_id
    WHERE ${whereConditions.join(' AND ')}
    ORDER BY o.created_at DESC
    LIMIT $${paramIndex++} OFFSET $${paramIndex++}
  `;
  
  queryParams.push(limit, offset);
  
  const [countResult, dataResult] = await Promise.all([
    pool.query(countQuery, queryParams.slice(0, -2)),
    pool.query(dataQuery, queryParams)
  ]);
  
  const total = parseInt(countResult.rows[0].total);
  const totalPages = Math.ceil(total / limit);
  
  return {
    offers: dataResult.rows,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1
    }
  };
};

const getOfferById = async (userId, offerId) => {
  const query = `
    SELECT o.*, l.title as listing_title, l.price as listing_price,
           li.url as listing_image,
           pb.name as buyer_name, ub.email as buyer_email,
           ps.name as seller_name, s.store_name,
           (SELECT COUNT(*) FROM offers counter WHERE counter.counter_for = o.id) as counter_count
    FROM offers o
    JOIN listings l ON o.listing_id = l.id
    LEFT JOIN listing_images li ON l.id = li.listing_id AND li.is_primary = true
    LEFT JOIN users ub ON o.buyer_id = ub.id
    LEFT JOIN profiles pb ON ub.id = pb.user_id
    LEFT JOIN sellers s ON o.seller_id = s.id
    LEFT JOIN users us ON s.user_id = us.id
    LEFT JOIN profiles ps ON us.id = ps.user_id
    WHERE o.id = $1 AND (o.buyer_id = $2 OR o.seller_id = $2)
  `;
  
  const result = await pool.query(query, [offerId, userId]);
  return result.rows[0] || null;
};

const updateOfferStatus = async (userId, offerId, status) => {
  await pool.query('BEGIN');
  
  try {
    // First verify user can modify this offer
    const offerQuery = `
      SELECT o.id, o.seller_id, o.buyer_id, o.status
      FROM offers o
      WHERE o.id = $1
    `;
    
    const offerResult = await pool.query(offerQuery, [offerId]);
    
    if (offerResult.rows.length === 0) {
      throw new Error('Offer not found');
    }
    
    const offer = offerResult.rows[0];
    
    // Check permissions based on who made the offer using metadata
    const madeByUserId = offer.metadata?.made_by_user_id;
    const counteredByUserId = offer.metadata?.countered_by_user_id;
    const updatedByUserId = offer.metadata?.updated_by_user_id;
    
    // Determine who actually made this offer
    const offerMaker = madeByUserId || counteredByUserId || updatedByUserId || offer.buyer_id;
    
    if (status === 'cancelled' && offer.buyer_id !== userId) {
      throw new Error('Only buyer can cancel offer');
    }
    
    if (status === 'declined' && offer.seller_id !== userId) {
      throw new Error('Only seller can decline offer');
    }
    
    if (status === 'accepted' && offerMaker === userId) {
      throw new Error('Cannot accept your own offer');
    }
    
    // Update the offer
    const updateQuery = `
      UPDATE offers 
      SET status = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING *
    `;
    
    const result = await pool.query(updateQuery, [status, offerId]);
    
    await pool.query('COMMIT');
    
    return result.rows[0];
  } catch (error) {
    await pool.query('ROLLBACK');
    throw error;
  }
};

const createCounterOffer = async (userId, originalOfferId, counterData) => {
  const { counter_amount, expires_at } = counterData;
  
  
  if (!counter_amount) {
    throw new Error('Counter amount is required');
  }
  
  await pool.query('BEGIN');
  
  try {
    // Get the original offer details
    const originalQuery = `
      SELECT o.*, l.title as listing_title, s.user_id as seller_user_id
      FROM offers o
      JOIN listings l ON o.listing_id = l.id
      LEFT JOIN sellers s ON o.seller_id = s.id
      WHERE o.id = $1
    `;
    
    const originalResult = await pool.query(originalQuery, [originalOfferId]);
    
    if (originalResult.rows.length === 0) {
      throw new Error('Original offer not found');
    }
    
    const original = originalResult.rows[0];
    
    // Check if user is authorized to counter (either buyer or seller)
    if (original.buyer_id !== userId && original.seller_user_id !== userId) {
      throw new Error('You are not authorized to counter this offer');
    }
    
    if (original.status !== 'pending' && original.status !== 'countered') {
      throw new Error('Cannot counter offer that is not pending');
    }
    
    // Update the existing offer with counter offer details
    const updateQuery = `
      UPDATE offers 
      SET offered_price = $1, offered_quantity = $2, expires_at = $3, status = 'countered', updated_at = CURRENT_TIMESTAMP,
          metadata = COALESCE(metadata, '{}')::jsonb || $4::jsonb
      WHERE id = $5
      RETURNING *
    `;
    
    const counterMetadata = {
      countered_by_user_id: userId,
      countered_at: new Date().toISOString(),
      is_seller_counter: original.seller_user_id === userId
    };
    
    const result = await pool.query(updateQuery, [
      counter_amount,
      1, // Default quantity since offered_quantity is not passed in counterData
      expires_at,
      JSON.stringify(counterMetadata),
      originalOfferId
    ]);
    
    const updatedOffer = result.rows[0];
    
    // Emit real-time counter offer update to both buyer and seller
    try {
      const { emitToDealRoom } = require('../socket/dealRoomSocketServer');
      
      // Get deal room ID to emit to the right room
      const dealRoomId = updatedOffer.deal_room_id;
      if (dealRoomId) {
          offerId: updatedOffer.id,
          newAmount: updatedOffer.offered_price,
          updatedBy: userId,
          timestamp: updatedOffer.updated_at
        });
        emitToDealRoom(dealRoomId, 'offer_updated', {
          offerId: updatedOffer.id,
          newAmount: updatedOffer.offered_price,
          updatedBy: userId,
          timestamp: updatedOffer.updated_at
        });
      } else {
      }
    } catch (error) {
      console.error('[COUNTER] Failed to emit socket event:', error);
      // Continue without socket emission - offer still updates in database
    }
    
    await pool.query('COMMIT');
    
    return updatedOffer;
  } catch (error) {
    await pool.query('ROLLBACK');
    throw error;
  }
};

const expireOffers = async () => {
  const query = `
    UPDATE offers 
    SET status = 'expired', updated_at = NOW()
    WHERE status = 'pending' AND expires_at <= NOW()
    RETURNING *
  `;
  
  const result = await pool.query(query);
  return result.rows;
};

const updateOffer = async (userId, offerId, updateData) => {
  const { counter_amount, expires_at, offer_type, cash_amount, swap_items } = updateData;
  
  await pool.query("BEGIN");
  
  try {
    // First verify the user is a participant in this deal (buyer or seller)
    
    // First check if offer exists at all
    const offerExistsCheck = await pool.query(
      'SELECT * FROM offers WHERE id = $1',
      [offerId]
    );
    
    if (offerExistsCheck.rows.length > 0) {
    }
    
    // Check authorization: user is buyer OR user is seller (through sellers.user_id)
    const offerCheck = await pool.query(
      'SELECT o.* FROM offers o LEFT JOIN sellers s ON o.seller_id = s.id WHERE o.id = $1 AND (o.buyer_id = $2 OR s.user_id = $2)',
      [offerId, userId]
    );
    
    
    if (offerCheck.rows.length === 0) {
      throw new Error('Offer not found or not authorized');
    }
    
    const originalOffer = offerCheck.rows[0];
    
    // Build dynamic update query based on provided data
    const updateFields = [];
    const queryParams = [];
    let paramIndex = 1;
    
    if (counter_amount !== undefined) {
      updateFields.push(`offered_price = $${paramIndex++}`);
      queryParams.push(counter_amount);
    }
    
    if (expires_at !== undefined) {
      updateFields.push(`expires_at = $${paramIndex++}`);
      queryParams.push(expires_at);
    }
    
    if (offer_type !== undefined) {
      updateFields.push(`offer_type = $${paramIndex++}`);
      queryParams.push(offer_type);
    }
    
    if (cash_amount !== undefined) {
      updateFields.push(`cash_amount = $${paramIndex++}`);
      queryParams.push(cash_amount);
    }
    
    if (swap_items !== undefined) {
      updateFields.push(`swap_items = $${paramIndex++}`);
      queryParams.push(JSON.stringify(swap_items));
    }
    
    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    
    // Add metadata update to track who made this change
    updateFields.push(`metadata = COALESCE(o.metadata, '{}')::jsonb || $${paramIndex++}::jsonb`);
    queryParams.push(JSON.stringify({
      updated_by_user_id: userId,
      updated_at: new Date().toISOString(),
      is_seller_update: originalOffer.seller_user_id === userId
    }));
    
    // Update the offer
    const updateQuery = `
      UPDATE offers o 
      SET ${updateFields.join(', ')}
      FROM sellers s 
      WHERE o.id = $${paramIndex++} AND o.seller_id = s.id AND (o.buyer_id = $${paramIndex++} OR s.user_id = $${paramIndex++})
      RETURNING o.*
    `;
    
    queryParams.push(offerId, userId, userId);
    
    const result = await pool.query(updateQuery, queryParams);
    
    const updatedOffer = result.rows[0];
    
    // Emit real-time offer update to both buyer and seller
    try {
      // Import the socket server module to get the IO instance
      const setupSocketIO = require('../socket/socketServer');
      // We need to get the IO instance from the server - this will be handled differently
      // For now, let's emit through the deal room socket server
      const { emitToDealRoom } = require('../socket/dealRoomSocketServer');
      
      // Get deal room ID to emit to the right room
      const dealRoomId = updatedOffer.deal_room_id || originalOffer.deal_room_id;
      if (dealRoomId) {
          offerId: updatedOffer.id,
          newAmount: updatedOffer.offered_price,
          offerType: updatedOffer.offer_type,
          cashAmount: updatedOffer.cash_amount,
          swapItems: updatedOffer.swap_items,
          updatedBy: userId,
          timestamp: updatedOffer.updated_at
        });
        emitToDealRoom(dealRoomId, 'offer_updated', {
          offerId: updatedOffer.id,
          newAmount: updatedOffer.offered_price,
          offerType: updatedOffer.offer_type,
          cashAmount: updatedOffer.cash_amount,
          swapItems: updatedOffer.swap_items,
          updatedBy: userId,
          timestamp: updatedOffer.updated_at
        });
      } else {
      }
    } catch (error) {
      console.error('[OFFER] Failed to emit socket event:', error);
      // Continue without socket emission - offer still updates in database
    }
    
    
    try {
      const sellerQuery = `
        SELECT user_id FROM sellers WHERE id = $1
      `;
      const sellerResult = await pool.query(sellerQuery, [originalOffer.seller_id]);
      
      if (sellerResult.rows.length === 0) {
        return; // Skip notification if seller not found
      }
      
      const sellerUserId = sellerResult.rows[0].user_id;
      
      const { createNotification } = require('../notification/model');
      
      await createNotification(sellerUserId, {
        type: 'offer_countered',
        payload: {
          offer_id: updatedOffer.id,
          original_offer_id: offerId,
          listing_id: updatedOffer.listing_id,
          offered_price: counter_amount,
          offered_quantity: updatedOffer.offered_quantity || 1,
          seller_user_id: originalOffer.seller_id,
          deal_room_id: originalOffer.deal_room_id,
          offer_type: updatedOffer.offer_type,
          cash_amount: updatedOffer.cash_amount,
          swap_items: updatedOffer.swap_items
        },
        actor_id: userId
      });
      
    } catch (notificationError) {
        // Don't throw here - the offer update should still succeed even if notification fails
    }
    
    await pool.query('COMMIT');
    
    return updatedOffer;
  } catch (error) {
    await pool.query('ROLLBACK');
    throw error;
  }
};

module.exports = {
  createOffer,
  getOffersByUser,
  getOffersByListing,
  getOfferById,
  updateOfferStatus,
  createCounterOffer,
  updateOffer,
  expireOffers
};
