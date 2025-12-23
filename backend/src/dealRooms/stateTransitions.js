const { pool } = require('../database/db');

// Valid state transitions for deal rooms
const VALID_TRANSITIONS = {
  'negotiation': ['offer_accepted', 'canceled'],
  'offer_accepted': ['payment_pending', 'canceled'],
  'payment_pending': ['payment_authorized', 'payment_failed', 'canceled'],
  'payment_authorized': ['in_delivery', 'dispute_opened', 'canceled'],
  'in_delivery': ['completed', 'dispute_opened', 'canceled'],
  'dispute_opened': ['dispute_resolved', 'canceled'],
  'dispute_resolved': ['completed', 'canceled'],
  'completed': [], // Terminal state
  'canceled': []   // Terminal state
};

// State transition validation
const validateStateTransition = (currentState, newState) => {
  const validNextStates = VALID_TRANSITIONS[currentState] || [];
  return validNextStates.includes(newState);
};

// Update deal room state with validation
const updateDealRoomState = async (dealRoomId, newState, actorId = null, metadata = {}) => {
  await pool.query('BEGIN');
  
  try {
    // Get current state
    const getCurrentStateQuery = 'SELECT current_state FROM deal_rooms WHERE id = $1';
    const currentStateResult = await pool.query(getCurrentStateQuery, [dealRoomId]);
    
    if (currentStateResult.rows.length === 0) {
      throw new Error('Deal room not found');
    }
    
    const currentState = currentStateResult.rows[0].current_state;
    
    // Validate transition
    if (!validateStateTransition(currentState, newState)) {
      throw new Error(`Invalid state transition from ${currentState} to ${newState}`);
    }
    
    // Update state
    const updateQuery = `
      UPDATE deal_rooms 
      SET current_state = $1, updated_at = NOW(), metadata = metadata || $2
      WHERE id = $3
      RETURNING *
    `;
    
    const updateResult = await pool.query(updateQuery, [
      newState,
      JSON.stringify({
        ...metadata,
        state_changed_at: new Date().toISOString(),
        state_changed_by: actorId
      }),
      dealRoomId
    ]);
    
    const updatedDealRoom = updateResult.rows[0];
    
    // Create deal event for state transition
    const { createDealEvent } = require('../dealEvents/model');
    await createDealEvent(dealRoomId, actorId, 'state.changed', {
      from_state: currentState,
      to_state: newState,
      actor_id: actorId,
      metadata
    });
    
    await pool.query('COMMIT');
    
    console.log(`[STATE-TRANSITION] Deal room ${dealRoomId} transitioned from ${currentState} to ${newState}`);
    
    return updatedDealRoom;
    
  } catch (error) {
    await pool.query('ROLLBACK');
    console.error('[STATE-TRANSITION] Error updating deal room state:', error);
    throw error;
  }
};

// Get deal room state with validation
const getDealRoomState = async (dealRoomId) => {
  const query = 'SELECT current_state, metadata FROM deal_rooms WHERE id = $1';
  const result = await pool.query(query, [dealRoomId]);
  
  if (result.rows.length === 0) {
    throw new Error('Deal room not found');
  }
  
  return result.rows[0];
};

// Check if user can perform action on deal room
const canUserPerformAction = async (dealRoomId, userId, action) => {
  const query = `
    SELECT dr.current_state, dr.buyer_id, dr.seller_id, s.user_id as seller_user_id
    FROM deal_rooms dr
    LEFT JOIN sellers s ON dr.seller_id = s.id
    WHERE dr.id = $1
  `;
  
  const dealRoomResult = await pool.query(query, [dealRoomId]);
  
  if (dealRoomResult.rows.length === 0) {
    console.log('[PERMISSION] Deal room not found:', dealRoomId);
    return false;
  }
  
  const dealRoom = dealRoomResult.rows[0];
  const isBuyer = dealRoom.buyer_id === userId;
  const isSeller = dealRoom.seller_user_id === userId;
  
  console.log('[PERMISSION] Checking action:', { 
    dealRoomId, 
    userId, 
    action, 
    currentState: dealRoom.current_state,
    isBuyer, 
    isSeller,
    sellerUserId: dealRoom.seller_user_id
  });
  
  // Define permissions based on action and state
  const permissions = {
    'accept_offer': () => {
      const canAccept = isSeller && dealRoom.current_state === 'negotiation';
      console.log('[PERMISSION] Accept offer check:', { isSeller, currentState: dealRoom.current_state, canAccept });
      return canAccept;
    },
    'make_payment': () => {
      const canPay = isBuyer && dealRoom.current_state === 'payment_pending';
      console.log('[PERMISSION] Make payment check:', { isBuyer, currentState: dealRoom.current_state, canPay });
      return canPay;
    },
    'confirm_delivery': () => {
      const canConfirm = isBuyer && dealRoom.current_state === 'in_delivery';
      console.log('[PERMISSION] Confirm delivery check:', { isBuyer, currentState: dealRoom.current_state, canConfirm });
      return canConfirm;
    },
    'open_dispute': () => {
      const canDispute = (isBuyer || isSeller) && ['payment_authorized', 'in_delivery'].includes(dealRoom.current_state);
      console.log('[PERMISSION] Open dispute check:', { isBuyer, isSeller, currentState: dealRoom.current_state, canDispute });
      return canDispute;
    },
    'cancel_deal': () => {
      const canCancel = (isBuyer || isSeller) && !['completed', 'canceled'].includes(dealRoom.current_state);
      console.log('[PERMISSION] Cancel deal check:', { isBuyer, isSeller, currentState: dealRoom.current_state, canCancel });
      return canCancel;
    }
  };
  
  const permissionCheck = permissions[action];
  const permissionResult = permissionCheck ? permissionCheck() : false;
  console.log('[PERMISSION] Final permission result:', { action, result: permissionResult });
  return permissionResult;
};

// Get available actions for user in deal room
const getAvailableActions = async (dealRoomId, userId) => {
  const query = `
    SELECT dr.current_state, dr.buyer_id, dr.seller_id, s.user_id as seller_user_id
    FROM deal_rooms dr
    LEFT JOIN sellers s ON dr.seller_id = s.id
    WHERE dr.id = $1
  `;
  
  const result = await pool.query(query, [dealRoomId]);
  
  if (result.rows.length === 0) {
    return [];
  }
  
  const dealRoom = result.rows[0];
  const isBuyer = dealRoom.buyer_id === userId;
  const isSeller = dealRoom.seller_user_id === userId;
  
  const actions = [];
  
  // Define available actions based on state and user role
  switch (dealRoom.current_state) {
    case 'negotiation':
      if (isSeller) actions.push('accept_offer');
      actions.push('cancel_deal');
      break;
      
    case 'payment_pending':
      if (isBuyer) actions.push('make_payment');
      actions.push('cancel_deal');
      break;
      
    case 'payment_authorized':
      actions.push('open_dispute');
      actions.push('cancel_deal');
      break;
      
    case 'in_delivery':
      if (isBuyer) actions.push('confirm_delivery');
      actions.push('open_dispute');
      break;
      
    case 'dispute_opened':
      actions.push('resolve_dispute');
      break;
      
    case 'completed':
    case 'canceled':
      // No actions available in terminal states
      break;
  }
  
  return actions;
};

// State transition handlers
const handleOfferAccepted = async (dealRoomId, sellerId) => {
  return await updateDealRoomState(dealRoomId, 'offer_accepted', sellerId, {
    trigger: 'offer_accepted'
  });
};

const handlePaymentCreated = async (dealRoomId, paymentId) => {
  return await updateDealRoomState(dealRoomId, 'payment_pending', null, {
    trigger: 'payment_created',
    payment_id: paymentId
  });
};

const handlePaymentAuthorized = async (dealRoomId, paymentId) => {
  return await updateDealRoomState(dealRoomId, 'payment_authorized', null, {
    trigger: 'payment_authorized',
    payment_id: paymentId
  });
};

const handleDeliveryStarted = async (dealRoomId, trackingInfo = {}) => {
  return await updateDealRoomState(dealRoomId, 'in_delivery', null, {
    trigger: 'delivery_started',
    tracking_info: trackingInfo
  });
};

const handleOrderCompleted = async (dealRoomId, completedBy = null) => {
  return await updateDealRoomState(dealRoomId, 'completed', completedBy, {
    trigger: 'order_completed',
    completed_at: new Date().toISOString()
  });
};

const handleDisputeOpened = async (dealRoomId, disputeReason, openedBy) => {
  return await updateDealRoomState(dealRoomId, 'dispute_opened', openedBy, {
    trigger: 'dispute_opened',
    dispute_reason,
    dispute_opened_at: new Date().toISOString()
  });
};

const handleDealCanceled = async (dealRoomId, cancelReason, canceledBy) => {
  return await updateDealRoomState(dealRoomId, 'canceled', canceledBy, {
    trigger: 'deal_canceled',
    cancel_reason,
    canceled_at: new Date().toISOString()
  });
};

module.exports = {
  VALID_TRANSITIONS,
  validateStateTransition,
  updateDealRoomState,
  getDealRoomState,
  canUserPerformAction,
  getAvailableActions,
  handleOfferAccepted,
  handlePaymentCreated,
  handlePaymentAuthorized,
  handleDeliveryStarted,
  handleOrderCompleted,
  handleDisputeOpened,
  handleDealCanceled
};
