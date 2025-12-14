const { pool } = require("../database/db");

const createOrder = async (buyerId, sellerId, orderData) => {
  const { total_amount, currency, shipping_address, billing_info, metadata } = orderData;
  
  await pool.query('BEGIN');
  
  try {
    // Create order
    const orderQuery = `
      INSERT INTO orders (buyer_id, seller_id, total_amount, currency, shipping_address, billing_info, metadata)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
    
    const orderResult = await pool.query(orderQuery, [
      buyerId, sellerId, total_amount, currency || 'USD', shipping_address, billing_info, metadata
    ]);
    
    const order = orderResult.rows[0];
    
    // Create order items from metadata
    if (metadata && metadata.offer_id) {
      const offerQuery = `
        SELECT o.listing_id, o.offered_price, o.offered_quantity, l.title
        FROM offers o
        JOIN listings l ON o.listing_id = l.id
        WHERE o.id = $1
      `;
      
      const offerResult = await pool.query(offerQuery, [metadata.offer_id]);
      
      if (offerResult.rows.length > 0) {
        const offer = offerResult.rows[0];
        
        const itemQuery = `
          INSERT INTO order_items (order_id, listing_id, price, quantity, metadata)
          VALUES ($1, $2, $3, $4, $5)
        `;
        
        await pool.query(itemQuery, [
          order.id, offer.listing_id, offer.offered_price, offer.offered_quantity,
          { listing_title: offer.title }
        ]);
      }
    }
    
    await pool.query('COMMIT');
    
    return order;
  } catch (error) {
    await pool.query('ROLLBACK');
    throw error;
  }
};

const getOrdersByUser = async (userId, userType, filters = {}, options = {}) => {
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
    FROM orders o
    WHERE ${whereConditions.join(' AND ')}
  `;
  
  const dataQuery = `
    SELECT o.*, 
           ub.name as buyer_name, ub.email as buyer_email,
           us.name as seller_name, s.store_name,
           COUNT(oi.id) as item_count
    FROM orders o
    LEFT JOIN users ub ON o.buyer_id = ub.id
    LEFT JOIN sellers s ON o.seller_id = s.id
    LEFT JOIN users us ON s.user_id = us.id
    LEFT JOIN order_items oi ON o.id = oi.order_id
    WHERE ${whereConditions.join(' AND ')}
    GROUP BY o.id, ub.name, ub.email, us.name, s.store_name
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
    orders: dataResult.rows,
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

const getOrderById = async (userId, orderId) => {
  const query = `
    SELECT o.*, 
           ub.name as buyer_name, ub.email as buyer_email,
           us.name as seller_name, s.store_name,
           pb.name as buyer_profile_name, pb.avatar_key as buyer_avatar,
           ps.name as seller_profile_name, ps.avatar_key as seller_avatar
    FROM orders o
    LEFT JOIN users ub ON o.buyer_id = ub.id
    LEFT JOIN sellers s ON o.seller_id = s.id
    LEFT JOIN users us ON s.user_id = us.id
    LEFT JOIN profiles pb ON ub.id = pb.user_id
    LEFT JOIN profiles ps ON us.id = ps.user_id
    WHERE o.id = $1 AND (o.buyer_id = $2 OR o.seller_id = $2)
  `;
  
  const result = await pool.query(query, [orderId, userId]);
  return result.rows[0] || null;
};

const updateOrderStatus = async (userId, orderId, status, trackingInfo = null) => {
  await pool.query('BEGIN');
  
  try {
    // First verify user can modify this order
    const orderQuery = `
      SELECT o.id, o.buyer_id, o.seller_id, o.status
      FROM orders o
      WHERE o.id = $1
    `;
    
    const orderResult = await pool.query(orderQuery, [orderId]);
    
    if (orderResult.rows.length === 0) {
      throw new Error('Order not found');
    }
    
    const order = orderResult.rows[0];
    
    // Check permissions based on status
    const buyerOnlyStatuses = ['cancelled'];
    const sellerOnlyStatuses = ['reserved', 'shipped'];
    const bothCanUpdate = ['disputed', 'completed'];
    
    if (buyerOnlyStatuses.includes(status) && order.buyer_id !== userId) {
      throw new Error('Only buyer can perform this action');
    }
    
    if (sellerOnlyStatuses.includes(status) && order.seller_id !== userId) {
      throw new Error('Only seller can perform this action');
    }
    
    if (!bothCanUpdate.includes(status) && 
        !buyerOnlyStatuses.includes(status) && 
        !sellerOnlyStatuses.includes(status) &&
        order.buyer_id !== userId && order.seller_id !== userId) {
      throw new Error('Not authorized to update this order');
    }
    
    // Update the order
    const updateFields = ['status = $1', 'updated_at = NOW()'];
    const queryParams = [status, orderId];
    
    if (trackingInfo) {
      updateFields.push('metadata = metadata || $2');
      queryParams.splice(1, 0, JSON.stringify({ tracking_info: trackingInfo }));
    }
    
    const updateQuery = `
      UPDATE orders 
      SET ${updateFields.join(', ')}
      WHERE id = $${trackingInfo ? 3 : 2}
      RETURNING *
    `;
    
    const result = await pool.query(updateQuery, queryParams);
    
    await pool.query('COMMIT');
    
    return result.rows[0];
  } catch (error) {
    await pool.query('ROLLBACK');
    throw error;
  }
};

const getOrderItems = async (orderId) => {
  const query = `
    SELECT oi.*, l.title as listing_title, l.description as listing_description,
           li.url as listing_image, l.condition as listing_condition
    FROM order_items oi
    LEFT JOIN listings l ON oi.listing_id = l.id
    LEFT JOIN listing_images li ON l.id = li.listing_id AND li.is_primary = true
    WHERE oi.order_id = $1
    ORDER BY oi.created_at
  `;
  
  const result = await pool.query(query, [orderId]);
  return result.rows;
};

module.exports = {
  createOrder,
  getOrdersByUser,
  getOrderById,
  updateOrderStatus,
  getOrderItems
};
