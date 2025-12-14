const { pool } = require("../database/db");

const createOffer = async (buyerId, sellerId, offerData) => {
  const { listing_id, offered_price, offered_quantity, expires_at } = offerData;
  
  const query = `
    INSERT INTO offers (listing_id, buyer_id, seller_id, offered_price, offered_quantity, expires_at)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *
  `;
  
  const result = await pool.query(query, [
    listing_id, buyerId, sellerId, offered_price, offered_quantity || 1, expires_at
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
           pb.name as buyer_name, pb.email as buyer_email,
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
           pb.name as buyer_name, pb.email as buyer_email,
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
           pb.name as buyer_name, pb.email as buyer_email,
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

const createCounterOffer = async (sellerId, originalOfferId, counterData) => {
  const { offered_price, offered_quantity, expires_at } = counterData;
  
  await pool.query('BEGIN');
  
  try {
    // Get original offer details
    const originalQuery = `
      SELECT o.listing_id, o.buyer_id, o.status
      FROM offers o
      WHERE o.id = $1 AND o.seller_id = $2
    `;
    
    const originalResult = await pool.query(originalQuery, [originalOfferId, sellerId]);
    
    if (originalResult.rows.length === 0) {
      throw new Error('Original offer not found or not authorized');
    }
    
    const original = originalResult.rows[0];
    
    if (original.status !== 'pending' && original.status !== 'countered') {
      throw new Error('Cannot counter offer that is not pending');
    }
    
    // Update original offer status to countered
    await pool.query('UPDATE offers SET status = $1 WHERE id = $2', ['countered', originalOfferId]);
    
    // Create counter offer
    const counterQuery = `
      INSERT INTO offers (listing_id, buyer_id, seller_id, offered_price, offered_quantity, expires_at, counter_for)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
    
    const result = await pool.query(counterQuery, [
      original.listing_id,
      original.buyer_id,
      sellerId,
      offered_price,
      offered_quantity || 1,
      expires_at,
      originalOfferId
    ]);
    
    await pool.query('COMMIT');
    
    return result.rows[0];
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

module.exports = {
  createOffer,
  getOffersByUser,
  getOffersByListing,
  getOfferById,
  updateOfferStatus,
  createCounterOffer,
  expireOffers
};
