const { pool } = require("../database/db");

const createPayment = async (orderId, paymentData) => {
  const { provider, amount, currency, capture_method } = paymentData;
  
  const query = `
    INSERT INTO payments (order_id, provider, amount, currency, capture_method, status)
    VALUES ($1, $2, $3, $4, $5, 'created')
    RETURNING *
  `;
  
  const result = await pool.query(query, [
    orderId, provider, amount, currency || 'USD', capture_method
  ]);
  
  return result.rows[0];
};

const getPaymentsByOrder = async (orderId) => {
  const query = `
    SELECT p.*, o.total_amount as order_amount, o.currency as order_currency
    FROM payments p
    JOIN orders o ON p.order_id = o.id
    WHERE p.order_id = $1
    ORDER BY p.created_at DESC
  `;
  
  const result = await pool.query(query, [orderId]);
  return result.rows;
};

const getPaymentById = async (userId, paymentId) => {
  const query = `
    SELECT p.*, o.total_amount, o.currency, o.buyer_id, o.seller_id,
           ub.name as buyer_name, us.name as seller_name
    FROM payments p
    JOIN orders o ON p.order_id = o.id
    LEFT JOIN users ub ON o.buyer_id = ub.id
    LEFT JOIN sellers s ON o.seller_id = s.id
    LEFT JOIN users us ON s.user_id = us.id
    WHERE p.id = $1 AND (o.buyer_id = $2 OR o.seller_id = $2)
  `;
  
  const result = await pool.query(query, [paymentId, userId]);
  return result.rows[0] || null;
};

const updatePaymentStatus = async (paymentId, updateData) => {
  const { status, provider_payment_id, metadata } = updateData;
  
  const updateFields = ['updated_at = NOW()'];
  const queryParams = [];
  let paramIndex = 1;
  
  if (status) {
    updateFields.push(`status = $${paramIndex++}`);
    queryParams.push(status);
  }
  
  if (provider_payment_id) {
    updateFields.push(`provider_payment_id = $${paramIndex++}`);
    queryParams.push(provider_payment_id);
  }
  
  if (metadata) {
    updateFields.push(`metadata = metadata || $${paramIndex++}`);
    queryParams.push(JSON.stringify(metadata));
  }
  
  queryParams.push(paymentId);
  
  const query = `
    UPDATE payments 
    SET ${updateFields.join(', ')}
    WHERE id = $${paramIndex}
    RETURNING *
  `;
  
  const result = await pool.query(query, queryParams);
  return result.rows[0];
};

const getPaymentsByUser = async (userId, userType, filters = {}, options = {}) => {
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
    whereConditions.push(`p.status = $${paramIndex++}`);
    queryParams.push(status);
  }
  
  const countQuery = `
    SELECT COUNT(*) as total
    FROM payments p
    JOIN orders o ON p.order_id = o.id
    WHERE ${whereConditions.join(' AND ')}
  `;
  
  const dataQuery = `
    SELECT p.*, o.total_amount, o.currency,
           ub.name as buyer_name, us.name as seller_name
    FROM payments p
    JOIN orders o ON p.order_id = o.id
    LEFT JOIN users ub ON o.buyer_id = ub.id
    LEFT JOIN sellers s ON o.seller_id = s.id
    LEFT JOIN users us ON s.user_id = us.id
    WHERE ${whereConditions.join(' AND ')}
    ORDER BY p.created_at DESC
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
    payments: dataResult.rows,
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

module.exports = {
  createPayment,
  getPaymentsByOrder,
  getPaymentById,
  updatePaymentStatus,
  getPaymentsByUser
};
