const { pool } = require('../database/db');
const { updateDealRoomState } = require('../dealRooms/stateTransitions');
const { createDealEvent } = require('../dealEvents/model');

// Confirm delivery (buyer confirms item received)
const confirmDelivery = async (req, res) => {
  await pool.query('BEGIN');
  
  try {
    const userId = req.user.id;
    const { deal_room_id, tracking_info = {}, delivery_photos = [] } = req.body;
    
    // Verify user is buyer for this deal room
    const dealRoomQuery = `
      SELECT dr.*, o.id as order_id, p.id as payment_id
      FROM deal_rooms dr
      LEFT JOIN orders o ON o.metadata->>'offer_id' IN (
        SELECT id FROM offers WHERE deal_room_id = dr.id
      )
      LEFT JOIN payments p ON p.order_id = o.id
      WHERE dr.id = $1 AND dr.buyer_id = $2
    `;
    
    const dealRoomResult = await pool.query(dealRoomQuery, [deal_room_id, userId]);
    
    if (dealRoomResult.rows.length === 0) {
      await pool.query('ROLLBACK');
      return res.status(404).json({ error: 'Deal room not found or access denied' });
    }
    
    const dealRoom = dealRoomResult.rows[0];
    
    // Check if delivery can be confirmed in current state
    if (!['payment_authorized', 'in_delivery'].includes(dealRoom.current_state)) {
      await pool.query('ROLLBACK');
      return res.status(400).json({ 
        error: 'Delivery can only be confirmed in payment_authorized or in_delivery states',
        current_state: dealRoom.current_state
      });
    }
    
    // Check if delivery already confirmed
    const existingConfirmationQuery = `
      SELECT 1 FROM deal_events 
      WHERE deal_room_id = $1 AND type = 'delivery.confirmed'
    `;
    
    const existingConfirmationResult = await pool.query(existingConfirmationQuery, [deal_room_id]);
    
    if (existingConfirmationResult.rows.length > 0) {
      await pool.query('ROLLBACK');
      return res.status(400).json({ error: 'Delivery already confirmed for this deal room' });
    }
    
    // Create delivery confirmation record
    const deliveryQuery = `
      INSERT INTO delivery_confirmations (deal_room_id, confirmed_by, tracking_info, delivery_photos, confirmed_at)
      VALUES ($1, $2, $3, $4, NOW())
      RETURNING *
    `;
    
    const deliveryResult = await pool.query(deliveryQuery, [
      deal_room_id, userId, JSON.stringify(tracking_info), JSON.stringify(delivery_photos)
    ]);
    
    const deliveryConfirmation = deliveryResult.rows[0];
    
    // Update deal room state to completed
    await updateDealRoomState(deal_room_id, 'completed', userId, {
      delivery_confirmation_id: deliveryConfirmation.id,
      tracking_info
    });
    
    // Create deal event
    await createDealEvent(deal_room_id, 'delivery.confirmed', {
      delivery_confirmation_id: deliveryConfirmation.id,
      tracking_info,
      delivery_photos,
      confirmed_by: userId,
      order_id: dealRoom.order_id,
      payment_id: dealRoom.payment_id
    }, userId);
    
    // Update order status to completed
    if (dealRoom.order_id) {
      await pool.query(
        'UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2',
        ['completed', dealRoom.order_id]
      );
    }
    
    // Release payment to seller
    if (dealRoom.payment_id) {
      await pool.query(
        'UPDATE payments SET status = $1, metadata = metadata || $2 WHERE id = $3',
        [
          'released',
          JSON.stringify({
            delivery_confirmation_id: deliveryConfirmation.id,
            released_at: new Date().toISOString(),
            released_by: 'buyer_confirmation'
          }),
          dealRoom.payment_id
        ]
      );
    }
    
    await pool.query('COMMIT');
    
    res.status(201).json({ delivery_confirmation });
    
  } catch (error) {
    await pool.query('ROLLBACK');
    console.error('Error confirming delivery:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Mark item as shipped (seller action)
const markAsShipped = async (req, res) => {
  await pool.query('BEGIN');
  
  try {
    const userId = req.user.id;
    const { deal_room_id, tracking_number, carrier, estimated_delivery } = req.body;
    
    // Verify user is seller for this deal room
    const dealRoomQuery = `
      SELECT dr.*, o.id as order_id, p.id as payment_id
      FROM deal_rooms dr
      LEFT JOIN orders o ON o.metadata->>'offer_id' IN (
        SELECT id FROM offers WHERE deal_room_id = dr.id
      )
      LEFT JOIN payments p ON p.order_id = o.id
      LEFT JOIN sellers s ON dr.seller_id = s.id
      WHERE dr.id = $1 AND s.user_id = $2
    `;
    
    const dealRoomResult = await pool.query(dealRoomQuery, [deal_room_id, userId]);
    
    if (dealRoomResult.rows.length === 0) {
      await pool.query('ROLLBACK');
      return res.status(404).json({ error: 'Deal room not found or access denied' });
    }
    
    const dealRoom = dealRoomResult.rows[0];
    
    // Check if can be marked as shipped
    if (dealRoom.current_state !== 'payment_authorized') {
      await pool.query('ROLLBACK');
      return res.status(400).json({ 
        error: 'Item can only be marked as shipped in payment_authorized state',
        current_state: dealRoom.current_state
      });
    }
    
    // Create shipping record
    const shippingQuery = `
      INSERT INTO shipping_records (deal_room_id, shipped_by, tracking_number, carrier, estimated_delivery, shipped_at)
      VALUES ($1, $2, $3, $4, $5, NOW())
      RETURNING *
    `;
    
    const shippingResult = await pool.query(shippingQuery, [
      deal_room_id, userId, tracking_number, carrier, estimated_delivery
    ]);
    
    const shippingRecord = shippingResult.rows[0];
    
    // Update deal room state to in_delivery
    await updateDealRoomState(deal_room_id, 'in_delivery', userId, {
      shipping_record_id: shippingRecord.id,
      tracking_number,
      carrier,
      estimated_delivery
    });
    
    // Create deal event
    await createDealEvent(deal_room_id, 'shipping.created', {
      shipping_record_id: shippingRecord.id,
      tracking_number,
      carrier,
      estimated_delivery,
      shipped_by: userId,
      order_id: dealRoom.order_id
    }, userId);
    
    await pool.query('COMMIT');
    
    res.status(201).json({ shipping_record });
    
  } catch (error) {
    await pool.query('ROLLBACK');
    console.error('Error marking as shipped:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get delivery status for deal room
const getDeliveryStatus = async (req, res) => {
  try {
    const userId = req.user.id;
    const { deal_room_id } = req.params;
    
    // Verify user access
    const accessQuery = `
      SELECT 1 FROM deal_rooms dr
      WHERE dr.id = $1 AND (dr.buyer_id = $2 OR dr.seller_id = (
        SELECT id FROM sellers WHERE user_id = $2
      ))
    `;
    
    const accessResult = await pool.query(accessQuery, [deal_room_id, userId]);
    
    if (accessResult.rows.length === 0) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // Get shipping and delivery info
    const statusQuery = `
      SELECT 
        dr.current_state,
        sr.tracking_number,
        sr.carrier,
        sr.estimated_delivery,
        sr.shipped_at,
        dc.delivery_photos,
        dc.confirmed_at,
        u_seller.email as seller_email,
        u_buyer.email as buyer_email
      FROM deal_rooms dr
      LEFT JOIN shipping_records sr ON sr.deal_room_id = dr.id
      LEFT JOIN delivery_confirmations dc ON dc.deal_room_id = dr.id
      LEFT JOIN sellers s ON dr.seller_id = s.id
      LEFT JOIN users u_seller ON s.user_id = u_seller.id
      LEFT JOIN users u_buyer ON dr.buyer_id = u_buyer.id
      WHERE dr.id = $1
      ORDER BY sr.created_at DESC, dc.created_at DESC
      LIMIT 1
    `;
    
    const statusResult = await pool.query(statusQuery, [deal_room_id]);
    
    res.json({ delivery_status: statusResult.rows[0] || null });
    
  } catch (error) {
    console.error('Error getting delivery status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  confirmDelivery,
  markAsShipped,
  getDeliveryStatus
};
