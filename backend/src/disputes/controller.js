const { pool } = require('../database/db');
const { updateDealRoomState } = require('../dealRooms/stateTransitions');
const { createDealEvent } = require('../dealEvents/model');

// Create a new dispute
const createDispute = async (req, res) => {
  await pool.query('BEGIN');
  
  try {
    const userId = req.user.id;
    const { deal_room_id, reason, description, evidence = {} } = req.body;
    
    // Verify user is part of this deal room
    const dealRoomQuery = `
      SELECT dr.*, o.id as order_id, p.id as payment_id
      FROM deal_rooms dr
      LEFT JOIN orders o ON o.metadata->>'offer_id' IN (
        SELECT id FROM offers WHERE deal_room_id = dr.id
      )
      LEFT JOIN payments p ON p.order_id = o.id
      WHERE dr.id = $1 AND (dr.buyer_id = $2 OR dr.seller_id = (
        SELECT id FROM sellers WHERE user_id = $2
      ))
    `;
    
    const dealRoomResult = await pool.query(dealRoomQuery, [deal_room_id, userId]);
    
    if (dealRoomResult.rows.length === 0) {
      await pool.query('ROLLBACK');
      return res.status(404).json({ error: 'Deal room not found or access denied' });
    }
    
    const dealRoom = dealRoomResult.rows[0];
    
    // Check if dispute can be opened in current state
    if (!['payment_authorized', 'in_delivery'].includes(dealRoom.current_state)) {
      await pool.query('ROLLBACK');
      return res.status(400).json({ 
        error: 'Dispute can only be opened in payment_authorized or in_delivery states',
        current_state: dealRoom.current_state
      });
    }
    
    // Check if dispute already exists
    const existingDisputeQuery = `
      SELECT 1 FROM deal_events 
      WHERE deal_room_id = $1 AND type = 'dispute.opened'
      AND created_at > NOW() - INTERVAL '30 days'
    `;
    
    const existingDisputeResult = await pool.query(existingDisputeQuery, [deal_room_id]);
    
    if (existingDisputeResult.rows.length > 0) {
      await pool.query('ROLLBACK');
      return res.status(400).json({ error: 'Dispute already exists for this deal room' });
    }
    
    // Create dispute record
    const disputeQuery = `
      INSERT INTO disputes (deal_room_id, created_by, reason, description, evidence, status)
      VALUES ($1, $2, $3, $4, $5, 'opened')
      RETURNING *
    `;
    
    const disputeResult = await pool.query(disputeQuery, [
      deal_room_id, userId, reason, description, JSON.stringify(evidence)
    ]);
    
    const dispute = disputeResult.rows[0];
    
    // Update deal room state
    await updateDealRoomState(deal_room_id, 'dispute_opened', userId, {
      dispute_id: dispute.id,
      dispute_reason: reason
    });
    
    // Create deal event
    await createDealEvent(deal_room_id, 'dispute.opened', {
      dispute_id: dispute.id,
      reason,
      created_by: userId,
      order_id: dealRoom.order_id,
      payment_id: dealRoom.payment_id
    }, userId);
    
    // Hold payment if exists
    if (dealRoom.payment_id) {
      await pool.query(
        'UPDATE payments SET status = $1, metadata = metadata || $2 WHERE id = $3',
        [
          'held',
          JSON.stringify({
            dispute_id: dispute.id,
            held_at: new Date().toISOString()
          }),
          dealRoom.payment_id
        ]
      );
    }
    
    await pool.query('COMMIT');
    
    res.status(201).json({ dispute });
    
  } catch (error) {
    await pool.query('ROLLBACK');
    console.error('Error creating dispute:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Resolve a dispute (admin only)
const resolveDispute = async (req, res) => {
  await pool.query('BEGIN');
  
  try {
    const userId = req.user.id;
    const { dispute_id, resolution, refund_amount = 0, release_payment = false } = req.body;
    
    // Verify user is admin (simplified - in production, check admin role)
    const adminQuery = 'SELECT 1 FROM users WHERE id = $1 AND role = $2';
    const adminResult = await pool.query(adminQuery, [userId, 'admin']);
    
    if (adminResult.rows.length === 0) {
      await pool.query('ROLLBACK');
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    // Get dispute details
    const disputeQuery = `
      SELECT d.*, dr.current_state, dr.buyer_id, dr.seller_id, p.id as payment_id
      FROM disputes d
      JOIN deal_rooms dr ON d.deal_room_id = dr.id
      LEFT JOIN orders o ON o.metadata->>'offer_id' IN (
        SELECT id FROM offers WHERE deal_room_id = dr.id
      )
      LEFT JOIN payments p ON p.order_id = o.id
      WHERE d.id = $1
    `;
    
    const disputeResult = await pool.query(disputeQuery, [dispute_id]);
    
    if (disputeResult.rows.length === 0) {
      await pool.query('ROLLBACK');
      return res.status(404).json({ error: 'Dispute not found' });
    }
    
    const dispute = disputeResult.rows[0];
    
    if (dispute.status !== 'opened') {
      await pool.query('ROLLBACK');
      return res.status(400).json({ error: 'Dispute is not in opened state' });
    }
    
    // Update dispute
    const updateDisputeQuery = `
      UPDATE disputes 
      SET status = 'resolved', resolution = $1, resolved_by = $2, resolved_at = NOW()
      WHERE id = $3
    `;
    
    await pool.query(updateDisputeQuery, [resolution, userId, dispute_id]);
    
    // Update deal room state
    await updateDealRoomState(dispute.deal_room_id, 'dispute_resolved', userId, {
      dispute_id,
      resolution,
      refund_amount,
      release_payment
    });
    
    // Create deal event
    await createDealEvent(dispute.deal_room_id, 'dispute.resolved', {
      dispute_id,
      resolution,
      refund_amount,
      release_payment,
      resolved_by: userId
    }, userId);
    
    // Handle payment based on resolution
    if (dispute.payment_id) {
      if (refund_amount > 0) {
        // Process partial refund
        await pool.query(
          'UPDATE payments SET status = $1, metadata = metadata || $2 WHERE id = $3',
          [
            'partially_refunded',
            JSON.stringify({
              dispute_id,
              refund_amount,
              refunded_at: new Date().toISOString()
            }),
            dispute.payment_id
          ]
        );
      } else if (release_payment) {
        // Release payment to seller
        await pool.query(
          'UPDATE payments SET status = $1, metadata = metadata || $2 WHERE id = $3',
          [
            'released',
            JSON.stringify({
              dispute_id,
              released_at: new Date().toISOString()
            }),
            dispute.payment_id
          ]
        );
      }
    }
    
    await pool.query('COMMIT');
    
    res.json({ message: 'Dispute resolved successfully' });
    
  } catch (error) {
    await pool.query('ROLLBACK');
    console.error('Error resolving dispute:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get disputes for deal room
const getDealRoomDisputes = async (req, res) => {
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
    
    const disputesQuery = `
      SELECT d.*, u.email as created_by_email
      FROM disputes d
      JOIN users u ON d.created_by = u.id
      WHERE d.deal_room_id = $1
      ORDER BY d.created_at DESC
    `;
    
    const disputesResult = await pool.query(disputesQuery, [deal_room_id]);
    
    res.json({ disputes: disputesResult.rows });
    
  } catch (error) {
    console.error('Error getting disputes:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  createDispute,
  resolveDispute,
  getDealRoomDisputes
};
