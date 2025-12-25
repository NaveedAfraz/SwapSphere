const { pool } = require("../database/db");

const createIntent = async (intentData) => {
  const { buyer_id, title, description, category, max_price, location } = intentData;

  const query = `
    INSERT INTO intents (buyer_id, title, description, category, max_price, location, status)
    VALUES ($1, $2, $3, $4, $5, $6, 'open')
    RETURNING *
  `;

  const result = await pool.query(query, [buyer_id, title, description, category, max_price, JSON.stringify(location)]);
  return result.rows[0];
};

const getIntentsByUser = async (userId, options = {}) => {
  const { page = 1, limit = 20, status } = options;
  const offset = (page - 1) * limit;

  let whereClause = "WHERE i.buyer_id = $1";
  let queryParams = [userId];
  let paramIndex = 2;

  if (status) {
    whereClause += ` AND i.status = $${paramIndex}`;
    queryParams.push(status);
    paramIndex++;
  }

  const countQuery = `
    SELECT COUNT(*) as total
    FROM intents i
    ${whereClause}
  `;

  const dataQuery = `
    SELECT i.id, i.title, i.description, i.category, i.max_price, i.location, 
           i.status, i.created_at, i.updated_at,
           (SELECT COUNT(*) FROM deal_rooms dr WHERE dr.intent_id = i.id) as deal_rooms_count,
           (SELECT COUNT(*) FROM deal_rooms dr WHERE dr.intent_id = i.id AND dr.current_state = 'negotiation') as active_deals_count
    FROM intents i
    ${whereClause}
    ORDER BY i.created_at DESC
    LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
  `;

  queryParams.push(limit, offset);

  const [countResult, dataResult] = await Promise.all([
    pool.query(countQuery, queryParams.slice(0, paramIndex - 1)),
    pool.query(dataQuery, queryParams)
  ]);

  const total = parseInt(countResult.rows[0].total);
  const totalPages = Math.ceil(total / limit);

  return {
    intents: dataResult.rows,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
};

const getIntentById = async (intentId) => {
  const query = `
    SELECT i.id, i.buyer_id, i.title, i.description, i.category, i.max_price, i.location, 
           i.status, i.created_at, i.updated_at,
           p.name as buyer_name, p.profile_picture_url as buyer_avatar,
           (SELECT COUNT(*) FROM deal_rooms dr WHERE dr.intent_id = i.id) as deal_rooms_count
    FROM intents i
    LEFT JOIN users u ON i.buyer_id = u.id
    LEFT JOIN profiles p ON u.id = p.user_id
    WHERE i.id = $1
  `;

  const result = await pool.query(query, [intentId]);
  return result.rows[0] || null;
};

const updateIntent = async (intentId, updateData) => {
  const { title, description, category, max_price, location, status } = updateData;
  
  const updateFields = [];
  const queryParams = [];
  let paramIndex = 1;

  if (title !== undefined) {
    updateFields.push(`title = $${paramIndex}`);
    queryParams.push(title);
    paramIndex++;
  }

  if (description !== undefined) {
    updateFields.push(`description = $${paramIndex}`);
    queryParams.push(description);
    paramIndex++;
  }

  if (category !== undefined) {
    updateFields.push(`category = $${paramIndex}`);
    queryParams.push(category);
    paramIndex++;
  }

  if (max_price !== undefined) {
    updateFields.push(`max_price = $${paramIndex}`);
    queryParams.push(max_price);
    paramIndex++;
  }

  if (location !== undefined) {
    updateFields.push(`location = $${paramIndex}`);
    queryParams.push(JSON.stringify(location));
    paramIndex++;
  }

  if (status !== undefined) {
    updateFields.push(`status = $${paramIndex}`);
    queryParams.push(status);
    paramIndex++;
  }

  if (updateFields.length === 0) {
    throw new Error('No fields to update');
  }

  updateFields.push(`updated_at = NOW()`);
  queryParams.push(intentId);

  const query = `
    UPDATE intents 
    SET ${updateFields.join(', ')}
    WHERE id = $${paramIndex}
    RETURNING *
  `;


  try {
    const result = await pool.query(query, queryParams);
    return result.rows[0] || null;
  } catch (error) {
    console.error('Database error in updateIntent:', error);
    throw error;
  }
};

const deleteIntent = async (intentId, userId) => {
  // First check if intent belongs to user and has no active deal rooms
  const checkQuery = `
    SELECT i.id, 
           (SELECT COUNT(*) FROM deal_rooms dr WHERE dr.intent_id = i.id AND dr.current_state != 'completed') as active_deals
    FROM intents i
    WHERE i.id = $1 AND i.buyer_id = $2
  `;

  const checkResult = await pool.query(checkQuery, [intentId, userId]);
  
  if (checkResult.rows.length === 0) {
    throw new Error('Intent not found or access denied');
  }

  if (parseInt(checkResult.rows[0].active_deals) > 0) {
    throw new Error('Cannot delete intent with active deal rooms');
  }

  const query = "DELETE FROM intents WHERE id = $1 AND buyer_id = $2 RETURNING *";
  const result = await pool.query(query, [intentId, userId]);
  return result.rows[0] || null;
};

const searchIntents = async (searchOptions = {}) => {
  const { 
    page = 1, 
    limit = 20, 
    category, 
    max_price, 
    location_text,
    buyer_location 
  } = searchOptions;
  const offset = (page - 1) * limit;

  let whereClause = "WHERE i.status = 'open'";
  let queryParams = [];
  let paramIndex = 1;

  if (category) {
    whereClause += ` AND i.category = $${paramIndex}`;
    queryParams.push(category);
    paramIndex++;
  }

  if (max_price) {
    whereClause += ` AND i.max_price <= $${paramIndex}`;
    queryParams.push(max_price);
    paramIndex++;
  }

  if (location_text) {
    whereClause += ` AND (i.location->>'city' ILIKE $${paramIndex} OR i.location->>'state' ILIKE $${paramIndex})`;
    queryParams.push(`%${location_text}%`);
    paramIndex++;
  }

  // If buyer location is provided, we could add distance calculation here
  // For now, just filter by same city/state
  if (buyer_location) {
    whereClause += ` AND (i.location->>'city' = $${paramIndex} OR i.location->>'state' = $${paramIndex + 1})`;
    queryParams.push(buyer_location.city, buyer_location.state);
    paramIndex += 2;
  }

  const countQuery = `
    SELECT COUNT(*) as total
    FROM intents i
    ${whereClause}
  `;

  const dataQuery = `
    SELECT i.id, i.title, i.description, i.category, i.max_price, i.location, 
           i.status, i.created_at,
           p.name as buyer_name, p.profile_picture_url as buyer_avatar
    FROM intents i
    LEFT JOIN users u ON i.buyer_id = u.id
    LEFT JOIN profiles p ON u.id = p.user_id
    ${whereClause}
    ORDER BY i.created_at DESC
    LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
  `;

  queryParams.push(limit, offset);

  const [countResult, dataResult] = await Promise.all([
    pool.query(countQuery, queryParams.slice(0, paramIndex - 1)),
    pool.query(dataQuery, queryParams)
  ]);

  const total = parseInt(countResult.rows[0].total);
  const totalPages = Math.ceil(total / limit);

  return {
    intents: dataResult.rows,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
};

module.exports = {
  createIntent,
  getIntentsByUser,
  getIntentById,
  updateIntent,
  deleteIntent,
  searchIntents,
};
