const { pool } = require("../database/db");

const createOffer = async (buyerId, sellerId, offerData) => {
  const { listing_id, offered_price, offered_quantity, expires_at, deal_room_id } = offerData;
  
  const query = `
    INSERT INTO offers (listing_id, buyer_id, seller_id, offered_price, offered_quantity, expires_at, deal_room_id)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *
  `;
  
  const result = await pool.query(query, [
    listing_id, buyerId, sellerId, offered_price, offered_quantity || 1, expires_at, deal_room_id
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
    
    // Check permissions
    if (status === 'cancelled' && offer.buyer_id !== userId) {
      throw new Error('Only buyer can cancel offer');
    }
    
    if ((status === 'accepted' || status === 'declined') && offer.seller_id !== userId) {
      throw new Error('Only seller can accept/decline offer');
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
  
  console.log('[COUNTER] Creating counter offer with data:', { userId, originalOfferId, counter_amount, expires_at });
  
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
      console.log('[COUNTER] Authorization failed - Buyer ID:', original.buyer_id, 'Seller User ID:', original.seller_user_id, 'Current User ID:', userId);
      throw new Error('You are not authorized to counter this offer');
    }
    
    if (original.status !== 'pending' && original.status !== 'countered') {
      throw new Error('Cannot counter offer that is not pending');
    }
    
    // Update the existing offer with counter offer details
    const updateQuery = `
      UPDATE offers 
      SET offered_price = $1, offered_quantity = $2, expires_at = $3, status = 'countered', updated_at = CURRENT_TIMESTAMP
      WHERE id = $4
      RETURNING *
    `;
    
    const result = await pool.query(updateQuery, [
      counter_amount,
      1, // Default quantity since offered_quantity is not passed in counterData
      expires_at,
      originalOfferId
    ]);
    
    const updatedOffer = result.rows[0];
    
    // Emit real-time counter offer update to both buyer and seller
    try {
      console.log('[COUNTER] Starting socket emission process...');
      const { emitToDealRoom } = require('../socket/dealRoomSocketServer');
      
      // Get deal room ID to emit to the right room
      const dealRoomId = updatedOffer.deal_room_id;
      if (dealRoomId) {
        console.log('[COUNTER] Emitting counter offer update to deal room:', dealRoomId);
        console.log('[COUNTER] Emit data:', {
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
        console.log('[COUNTER] Socket emission completed');
      } else {
        console.log('[COUNTER] No deal room ID found for socket emission');
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
  const { counter_amount, expires_at } = updateData;
  
  await pool.query("BEGIN");
  
  try {
    // First verify the user is a participant in this deal (buyer or seller)
    console.log('[OFFER DEBUG] Checking authorization - Offer ID:', offerId, 'User ID:', userId);
    
    // First check if offer exists at all
    const offerExistsCheck = await pool.query(
      'SELECT * FROM offers WHERE id = $1',
      [offerId]
    );
    
    console.log('[OFFER DEBUG] Offer exists check - Found rows:', offerExistsCheck.rows.length);
    if (offerExistsCheck.rows.length > 0) {
      console.log('[OFFER DEBUG] Found offer - Buyer ID:', offerExistsCheck.rows[0].buyer_id, 'Seller ID:', offerExistsCheck.rows[0].seller_id);
    }
    
    // Check authorization: user is buyer OR user is seller (through sellers.user_id)
    const offerCheck = await pool.query(
      'SELECT o.* FROM offers o LEFT JOIN sellers s ON o.seller_id = s.id WHERE o.id = $1 AND (o.buyer_id = $2 OR s.user_id = $2)',
      [offerId, userId]
    );
    
    console.log('[OFFER DEBUG] Authorization query result rows:', offerCheck.rows.length);
    console.log('[OFFER DEBUG] Query executed: SELECT o.* FROM offers o LEFT JOIN sellers s ON o.seller_id = s.id WHERE o.id =', offerId, 'AND (o.buyer_id =', userId, 'OR s.user_id =', userId, ')');
    
    if (offerCheck.rows.length === 0) {
      console.log('[OFFER DEBUG] Authorization failed - offer not found or user not authorized');
      throw new Error('Offer not found or not authorized');
    }
    
    const originalOffer = offerCheck.rows[0];
    
    // Update the offer
    const updateQuery = `
      UPDATE offers o 
      SET offered_price = $1, expires_at = $2, updated_at = CURRENT_TIMESTAMP
      FROM sellers s 
      WHERE o.id = $3 AND o.seller_id = s.id AND (o.buyer_id = $4 OR s.user_id = $4)
      RETURNING o.*
    `;
    
    const result = await pool.query(updateQuery, [
      counter_amount,
      expires_at || null,
      offerId,
      userId
    ]);
    
    const updatedOffer = result.rows[0];
    
    // Emit real-time offer update to both buyer and seller
    try {
      console.log('[OFFER] Starting socket emission process...');
      // Import the socket server module to get the IO instance
      const setupSocketIO = require('../socket/socketServer');
      // We need to get the IO instance from the server - this will be handled differently
      // For now, let's emit through the deal room socket server
      const { emitToDealRoom } = require('../socket/dealRoomSocketServer');
      
      // Get deal room ID to emit to the right room
      const dealRoomId = updatedOffer.deal_room_id;
      if (dealRoomId) {
        console.log('[OFFER] Emitting offer update to deal room:', dealRoomId);
        console.log('[OFFER] Emit data:', {
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
        console.log('[OFFER] Socket emission completed');
      } else {
        console.log('[OFFER] No deal room ID found for socket emission');
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
          deal_room_id: originalOffer.deal_room_id
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
