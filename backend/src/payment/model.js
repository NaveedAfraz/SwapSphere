const { pool } = require("../database/db");

const createPayment = async (order_id, paymentData) => {
  const { provider, provider_payment_id, status, amount, currency, capture_method, metadata = {} } = paymentData;
  
  const query = `
    INSERT INTO payments (order_id, provider, provider_payment_id, status, amount, currency, capture_method, metadata)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *
  `;
  
  const result = await pool.query(query, [
    order_id, provider, provider_payment_id, status, amount, currency || 'USD', capture_method, metadata
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
           pb.name as buyer_name, ps.name as seller_name
    FROM payments p
    JOIN orders o ON p.order_id = o.id
    LEFT JOIN users ub ON o.buyer_id = ub.id
    LEFT JOIN profiles pb ON ub.id = pb.user_id
    LEFT JOIN sellers s ON o.seller_id = s.id
    LEFT JOIN users us ON s.user_id = us.id
    LEFT JOIN profiles ps ON us.id = ps.user_id
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
    
    // Update status timestamps for timeline
    if (status === 'created') {
      updateFields.push(`created_at = NOW()`);
    } else if (status === 'escrowed') {
      updateFields.push(`escrowed_at = NOW()`);
    } else if (status === 'released') {
      updateFields.push(`released_at = NOW()`);
    }
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

const updatePaymentTimeline = async (paymentId, status, metadata = {}) => {
  const updateFields = ['updated_at = NOW()'];
  const queryParams = [];
  let paramIndex = 1;
  
  // Update status and corresponding timestamp
  updateFields.push(`status = $${paramIndex++}`);
  queryParams.push(status);
  
  const statusTimestamps = {
    'created': 'created_at',
    'requires_action': 'requires_action_at',
    'succeeded': 'succeeded_at',
    'failed': 'failed_at',
    'refunded': 'refunded_at',
    'canceled': 'canceled_at',
    'escrowed': 'escrowed_at',
    'released': 'released_at',
  };
  
  if (statusTimestamps[status]) {
    updateFields.push(`${statusTimestamps[status]} = NOW()`);
  }
  
  if (Object.keys(metadata).length > 0) {
    updateFields.push(`metadata = COALESCE(metadata, '{}')::jsonb || $${paramIndex++}::jsonb`);
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

const movePaymentToEscrow = async (paymentId, escrowData = {}) => {
  const updateFields = [
    'status = $1',
    'escrowed_at = NOW()',
    'updated_at = NOW()'
  ];
  
  const queryParams = ['escrowed'];
  
  if (Object.keys(escrowData).length > 0) {
    updateFields.push(`escrow_info = $${queryParams.length + 1}`);
    queryParams.push(JSON.stringify(escrowData));
  }
  
  queryParams.push(paymentId);
  
  const query = `
    UPDATE payments 
    SET ${updateFields.join(', ')}
    WHERE id = $${queryParams.length}
    RETURNING *
  `;
  
  const result = await pool.query(query, queryParams);
  return result.rows[0];
};

const releaseEscrowFunds = async (paymentId, releaseData = {}) => {
  const updateFields = [
    'status = $1',
    'released_at = NOW()',
    'updated_at = NOW()'
  ];
  
  const queryParams = ['released'];
  
  if (Object.keys(releaseData).length > 0) {
    updateFields.push(`release_info = $${queryParams.length + 1}`);
    queryParams.push(JSON.stringify(releaseData));
  }
  
  queryParams.push(paymentId);
  
  const query = `
    UPDATE payments 
    SET ${updateFields.join(', ')}
    WHERE id = $${queryParams.length}
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
           pb.name as buyer_name, ps.name as seller_name
    FROM payments p
    JOIN orders o ON p.order_id = o.id
    LEFT JOIN users ub ON o.buyer_id = ub.id
    LEFT JOIN profiles pb ON ub.id = pb.user_id
    LEFT JOIN sellers s ON o.seller_id = s.id
    LEFT JOIN users us ON s.user_id = us.id
    LEFT JOIN profiles ps ON us.id = ps.user_id
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
  getPaymentsByUser,
  updatePaymentTimeline,
  movePaymentToEscrow,
  releaseEscrowFunds
};
