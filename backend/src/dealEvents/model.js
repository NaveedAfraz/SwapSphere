const { pool } = require("../database/db");

const createDealEvent = async (dealRoomId, actorId, eventType, payload = {}) => {
  const query = `
    INSERT INTO deal_events (deal_room_id, actor_id, event_type, payload)
    VALUES ($1, $2, $3, $4)
    RETURNING *
  `;

  const result = await pool.query(query, [dealRoomId, actorId, eventType, payload]);
  return result.rows[0];
};

const getDealEvents = async (dealRoomId, options = {}) => {
  const { page = 1, limit = 20, event_type } = options;
  const offset = (page - 1) * limit;

  let whereClause = "WHERE de.deal_room_id = $1";
  let queryParams = [dealRoomId];
  let paramIndex = 2;

  if (event_type) {
    whereClause += ` AND de.event_type = $${paramIndex}`;
    queryParams.push(event_type);
    paramIndex++;
  }

  const countQuery = `
    SELECT COUNT(*) as total
    FROM deal_events de
    ${whereClause}
  `;

  const dataQuery = `
    SELECT de.id, de.event_type, de.payload, de.created_at,
           u.id as actor_id, p.name as actor_name, p.profile_picture_url as actor_avatar
    FROM deal_events de
    LEFT JOIN users u ON de.actor_id = u.id
    LEFT JOIN profiles p ON u.id = p.user_id
    ${whereClause}
    ORDER BY de.created_at DESC
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
    events: dataResult.rows,
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

// Helper functions for common event types
const createOfferEvent = async (dealRoomId, actorId, offerData) => {
  return await createDealEvent(dealRoomId, actorId, 'offer_created', {
    offer: offerData
  });
};

const createOfferAcceptedEvent = async (dealRoomId, actorId, offerId) => {
  return await createDealEvent(dealRoomId, actorId, 'offer_accepted', {
    offer_id: offerId
  });
};

const createOfferDeclinedEvent = async (dealRoomId, actorId, offerId, reason) => {
  return await createDealEvent(dealRoomId, actorId, 'offer_declined', {
    offer_id: offerId,
    reason: reason || null
  });
};

const createPaymentInitiatedEvent = async (dealRoomId, actorId, paymentData) => {
  return await createDealEvent(dealRoomId, actorId, 'payment_initiated', {
    payment: paymentData
  });
};

const createPaymentCompletedEvent = async (dealRoomId, actorId, paymentId) => {
  return await createDealEvent(dealRoomId, actorId, 'payment_completed', {
    payment_id: paymentId
  });
};

const createOrderCreatedEvent = async (dealRoomId, actorId, orderData) => {
  return await createDealEvent(dealRoomId, actorId, 'order_created', {
    order: orderData
  });
};

const createDealRoomStateChangedEvent = async (dealRoomId, actorId, oldState, newState) => {
  return await createDealEvent(dealRoomId, actorId, 'state_changed', {
    old_state: oldState,
    new_state: newState
  });
};

const createDisputeCreatedEvent = async (dealRoomId, actorId, disputeData) => {
  return await createDealEvent(dealRoomId, actorId, 'dispute_created', {
    dispute: disputeData
  });
};

const createMessageEvent = async (dealRoomId, actorId, messageId, isSystem = false) => {
  const eventType = isSystem ? 'system_message' : 'message_sent';
  return await createDealEvent(dealRoomId, actorId, eventType, {
    message_id: messageId
  });
};

module.exports = {
  createDealEvent,
  getDealEvents,
  // Helper functions
  createOfferEvent,
  createOfferAcceptedEvent,
  createOfferDeclinedEvent,
  createPaymentInitiatedEvent,
  createPaymentCompletedEvent,
  createOrderCreatedEvent,
  createDealRoomStateChangedEvent,
  createDisputeCreatedEvent,
  createMessageEvent,
};
