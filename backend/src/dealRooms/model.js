const { pool } = require("../database/db");

const createDealRoom = async (dealRoomData) => {
  const { intent_id, listing_id, buyer_id, seller_id, metadata = {} } = dealRoomData;

  // Check if deal room already exists for this combination
  const existingRoomQuery = `
    SELECT id FROM deal_rooms 
    WHERE listing_id = $1 AND buyer_id = $2 AND seller_id = $3
  `;

  const existingResult = await pool.query(existingRoomQuery, [listing_id, buyer_id, seller_id]);

  if (existingResult.rows.length > 0) {
    return await getDealRoomById(existingResult.rows[0].id);
  }

  const query = `
    INSERT INTO deal_rooms (intent_id, listing_id, buyer_id, seller_id, current_state, metadata)
    VALUES ($1, $2, $3, $4, 'negotiation', $5)
    RETURNING *
  `;

  const result = await pool.query(query, [intent_id, listing_id, buyer_id, seller_id, metadata]);
  return result.rows[0];
};

const getDealRoomsByUser = async (userId, options = {}) => {
  const { page = 1, limit = 20, state } = options;
  const offset = (page - 1) * limit;


  let whereClause = "WHERE dr.buyer_id = $1 OR dr.seller_id = (SELECT id FROM sellers WHERE user_id = $1)";
  let queryParams = [userId];
  let paramIndex = 2;

  if (state) {
    whereClause += ` AND dr.current_state = $${paramIndex}`;
    queryParams.push(state);
    paramIndex++;
  }


  const countQuery = `
    SELECT COUNT(*) as total
    FROM deal_rooms dr
    ${whereClause}
  `;


  const dataQuery = `
    SELECT DISTINCT dr.id, dr.intent_id, dr.listing_id, dr.buyer_id, dr.seller_id, 
           dr.current_state, dr.metadata, dr.created_at, dr.updated_at,
           l.title as listing_title, l.price as listing_price,
           li.url as listing_image,
           buyer_profile.name as buyer_name, buyer_profile.profile_picture_url as buyer_avatar,
           seller_profile.name as seller_name, seller_profile.profile_picture_url as seller_avatar,
           (SELECT COUNT(*) FROM messages m WHERE m.deal_room_id = dr.id AND m.is_read = false AND m.sender_id != $1) as unread_count,
           (SELECT m.body FROM messages m WHERE m.deal_room_id = dr.id ORDER BY m.created_at DESC LIMIT 1) as last_message,
           (SELECT m.created_at FROM messages m WHERE m.deal_room_id = dr.id ORDER BY m.created_at DESC LIMIT 1) as last_message_at
    FROM deal_rooms dr
    LEFT JOIN listings l ON dr.listing_id = l.id
    LEFT JOIN listing_images li ON l.id = li.listing_id AND li.is_primary = true
    LEFT JOIN users bu ON dr.buyer_id = bu.id
    LEFT JOIN profiles buyer_profile ON bu.id = buyer_profile.user_id
    LEFT JOIN sellers s ON dr.seller_id = s.id
    LEFT JOIN users su ON s.user_id = su.id
    LEFT JOIN profiles seller_profile ON su.id = seller_profile.user_id
    ${whereClause}
    ORDER BY dr.updated_at DESC
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
    deal_rooms: dataResult.rows,
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

const getDealRoomById = async (dealRoomId) => {
  const query = `
    SELECT dr.id, dr.intent_id, dr.listing_id, dr.buyer_id, dr.seller_id, 
           dr.current_state, dr.metadata, dr.created_at, dr.updated_at,
           l.title as listing_title, l.description as listing_description,
           l.price as listing_price, l.currency as listing_currency,
           li.url as listing_image,
           buyer_profile.name as buyer_name, buyer_profile.profile_picture_url as buyer_avatar,
           seller_profile.name as seller_name, seller_profile.profile_picture_url as seller_avatar,
           s.user_id as seller_user_id,
           latest_order.id as latest_order_id,
           latest_order.total_amount as order_amount,
           latest_order.status as order_status,
           latest_order.created_at as order_created_at
    FROM deal_rooms dr
    LEFT JOIN listings l ON dr.listing_id = l.id
    LEFT JOIN listing_images li ON l.id = li.listing_id AND li.is_primary = true
    LEFT JOIN users bu ON dr.buyer_id = bu.id
    LEFT JOIN profiles buyer_profile ON bu.id = buyer_profile.user_id
    LEFT JOIN sellers s ON dr.seller_id = s.id
    LEFT JOIN users su ON s.user_id = su.id
    LEFT JOIN profiles seller_profile ON su.id = seller_profile.user_id
    LEFT JOIN LATERAL (
      SELECT o.id, o.total_amount, o.status, o.created_at
      FROM orders o
      WHERE o.metadata->>'offer_id'::text IN (
        SELECT of.id::text FROM offers of WHERE of.deal_room_id = dr.id
      )
      ORDER BY o.created_at DESC
      LIMIT 1
    ) latest_order ON true
    WHERE dr.id = $1
  `;

  const result = await pool.query(query, [dealRoomId]);
  return result.rows[0] || null;
};

const updateDealRoomState = async (dealRoomId, newState, metadata = {}) => {
  const query = `
    UPDATE deal_rooms 
    SET current_state = $2, metadata = metadata || $3, updated_at = NOW()
    WHERE id = $1
    RETURNING *
  `;

  const result = await pool.query(query, [dealRoomId, newState, metadata]);
  return result.rows[0];
};

const findDealRoomByUsersAndListing = async (buyerId, sellerId, listingId) => {
  const query = `
    SELECT dr.* FROM deal_rooms dr
    WHERE dr.buyer_id = $1 AND dr.seller_id = $2 AND dr.listing_id = $3
    ORDER BY dr.created_at DESC
    LIMIT 1
  `;

  const result = await pool.query(query, [buyerId, sellerId, listingId]);
  return result.rows[0] || null;
};

const deleteDealRoom = async (dealRoomId) => {
  const query = "DELETE FROM deal_rooms WHERE id = $1 RETURNING *";
  const result = await pool.query(query, [dealRoomId]);
  return result.rows[0];
};

module.exports = {
  createDealRoom,
  getDealRoomsByUser,
  getDealRoomById,
  updateDealRoomState,
  findDealRoomByUsersAndListing,
  deleteDealRoom,
};
