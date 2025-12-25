const { pool } = require("../database/db");
const { inngest } = require("../services/inngest");
const EventService = require("../services/eventService");

const createOrder = async (buyerId, sellerId, orderData) => {
  const { total_amount, currency, shipping_address, billing_info, metadata, order_type, swap_items } = orderData;
  
  await pool.query('BEGIN');
  
  try {
    // Create order
    const orderQuery = `
      INSERT INTO orders (buyer_id, seller_id, total_amount, currency, shipping_address, billing_info, metadata, order_type, swap_items)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;
    
    // Default to cash order for backward compatibility
    const finalOrderType = order_type || 'cash';
    const finalSwapItems = swap_items || [];
    
    const orderResult = await pool.query(orderQuery, [
      buyerId, sellerId, total_amount, currency || 'USD', shipping_address, billing_info, metadata,
      finalOrderType, JSON.stringify(finalSwapItems)
    ]);
    
    const order = orderResult.rows[0];
    
    // Create order items from metadata
    if (metadata && metadata.offer_id) {
      const offerQuery = `
        SELECT o.listing_id, o.offered_price, o.offered_quantity, o.offer_type, o.cash_amount, o.swap_items, l.title
        FROM offers o
        JOIN listings l ON o.listing_id = l.id
        WHERE o.id = $1
      `;
      
      const offerResult = await pool.query(offerQuery, [metadata.offer_id]);
      
      if (offerResult.rows.length > 0) {
        const offer = offerResult.rows[0];
        
        // For swap/hybrid orders, create items for both the main listing and swap items
        const itemsToCreate = [];
        
        // Main listing item
        itemsToCreate.push({
          listing_id: offer.listing_id,
          price: offer.offer_type === 'cash' ? offer.offered_price : offer.cash_amount,
          quantity: offer.offered_quantity,
          metadata: { 
            listing_title: offer.title,
            is_main_item: true
          }
        });
        
        // Swap items (if any)
        if (offer.swap_items && Array.isArray(offer.swap_items)) {
          for (const swapItem of offer.swap_items) {
            itemsToCreate.push({
              listing_id: swapItem.listing_id,
              price: 0, // Swap items have no cash value
              quantity: 1,
              metadata: {
                listing_title: swapItem.title,
                is_swap_item: true,
                swap_item_data: swapItem
              }
            });
          }
        }
        
        // Insert all items
        for (const item of itemsToCreate) {
          const itemQuery = `
            INSERT INTO order_items (order_id, listing_id, price, quantity, metadata)
            VALUES ($1, $2, $3, $4, $5)
          `;
          
          await pool.query(itemQuery, [
            order.id, item.listing_id, item.price, item.quantity, item.metadata
          ]);
        }
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
           ub.email as buyer_email,
           us.email as seller_email, 
           s.store_name,
           COUNT(oi.id) as item_count,
           COALESCE(
             JSON_BUILD_OBJECT(
               'id', (o.metadata->>'listing_id')::uuid,
               'title', o.metadata->>'listing_title',
               'price', l.price,
               'condition', l.condition,
               'description', l.description,
               'images', COALESCE(
                 JSON_AGG(
                   JSON_BUILD_OBJECT('url', li.url) 
                   ORDER BY li.id
                 ) FILTER (WHERE li.url IS NOT NULL),
                 '[]'::json
               )
             ),
             '{}'::json
           ) as listing
    FROM orders o
    LEFT JOIN users ub ON o.buyer_id = ub.id
    LEFT JOIN sellers s ON o.seller_id = s.id
    LEFT JOIN users us ON s.user_id = us.id
    LEFT JOIN order_items oi ON o.id = oi.order_id
    LEFT JOIN listings l ON l.id = (o.metadata->>'listing_id')::uuid
    LEFT JOIN listing_images li ON l.id = li.listing_id
    WHERE ${whereConditions.join(' AND ')}
    GROUP BY o.id, ub.email, us.email, s.store_name, l.id, l.title, l.price, l.condition, l.description
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
  
  // Parse JSON fields for each order
  const orders = dataResult.rows.map(order => {
    
    try {
      const parsedListing = typeof order.listing === 'string' ? JSON.parse(order.listing) : order.listing;
      return {
        ...order,
        listing: parsedListing
      };
    } catch (error) {
      console.error('Error parsing listing JSON for order:', order.id, error);
      console.error('[ORDER MODEL] Failed JSON string:', order.listing);
      return {
        ...order,
        listing: {}
      };
    }
  });
  
  return {
    orders,
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
           ub.email as buyer_email,
           us.email as seller_email, 
           s.store_name,
           COALESCE(
             JSON_BUILD_OBJECT(
               'id', (o.metadata->>'listing_id')::uuid,
               'title', o.metadata->>'listing_title',
               'price', l.price,
               'condition', l.condition,
               'description', l.description,
               'images', COALESCE(
                 JSON_AGG(
                   JSON_BUILD_OBJECT('url', li.url) 
                   ORDER BY li.id
                 ) FILTER (WHERE li.url IS NOT NULL),
                 '[]'::json
               )
             ),
             '{}'::json
           ) as listing,
           COALESCE(
             JSON_BUILD_OBJECT(
               'id', p.id,
               'status', p.status,
               'amount', p.amount,
               'currency', p.currency,
               'provider', p.provider,
               'created_at', p.created_at,
               'updated_at', p.updated_at,
               'metadata', p.metadata
             ),
             NULL
           ) as payment,
           COALESCE(
             JSON_BUILD_OBJECT(
               'id', dr.id,
               'current_state', dr.current_state,
               'created_at', dr.created_at,
               'updated_at', dr.updated_at
             ),
             NULL
           ) as deal_room
    FROM orders o
    LEFT JOIN users ub ON o.buyer_id = ub.id
    LEFT JOIN sellers s ON o.seller_id = s.id
    LEFT JOIN users us ON s.user_id = us.id
    LEFT JOIN listings l ON (o.metadata->>'listing_id')::uuid = l.id
    LEFT JOIN listing_images li ON l.id = li.listing_id
    LEFT JOIN payments p ON o.id = p.order_id
    LEFT JOIN deal_rooms dr ON (
      o.buyer_id = dr.buyer_id AND 
      o.seller_id = dr.seller_id AND 
      (o.metadata->>'listing_id')::uuid = dr.listing_id
    )
    WHERE o.id = $1 AND (o.buyer_id = $2 OR s.user_id = $2)
    GROUP BY o.id, ub.email, us.email, s.store_name, l.price, l.condition, l.description, p.id, p.status, p.amount, p.currency, p.provider, p.created_at, p.updated_at, p.metadata, dr.id, dr.current_state, dr.created_at, dr.updated_at
  `;
  
  const result = await pool.query(query, [orderId, userId]);
  const order = result.rows[0];
  
  if (!order) return null;
  
  // Parse JSON fields with error handling
  try {
    return {
      ...order,
      listing: typeof order.listing === 'string' ? JSON.parse(order.listing) : order.listing,
      payment: typeof order.payment === 'string' ? JSON.parse(order.payment) : order.payment,
      deal_room: typeof order.deal_room === 'string' ? JSON.parse(order.deal_room) : order.deal_room
    };
  } catch (error) {
    console.error('Error parsing JSON for order:', order.id, error);
    return {
      ...order,
      listing: {},
      payment: null,
      deal_room: null
    };
  }
};

const updateOrderStatus = async (userId, orderId, status, trackingInfo = null) => {
  await pool.query('BEGIN');
  
  try {
    // First verify user can modify this order
    const orderQuery = `
      SELECT o.id, o.buyer_id, o.seller_id, o.status, s.user_id as seller_user_id
      FROM orders o
      LEFT JOIN sellers s ON o.seller_id = s.id
      WHERE o.id = $1
    `;
    
    const orderResult = await pool.query(orderQuery, [orderId]);
    
    
    if (orderResult.rows.length === 0) {
      throw new Error('Order not found');
    }
    
    const order = orderResult.rows[0];
    
      orderId: order.id, 
      buyer_id: order.buyer_id, 
      seller_id: order.seller_id, 
      seller_user_id: order.seller_user_id,
      currentStatus: order.status 
    });
    
    // Check permissions based on status
    const buyerOnlyStatuses = ['cancelled'];
    const sellerOnlyStatuses = ['reserved', 'shipped', 'delivered'];
    const bothCanUpdate = ['disputed', 'completed'];
    
    if (buyerOnlyStatuses.includes(status) && order.buyer_id !== userId) {
      throw new Error('Only buyer can perform this action');
    }
    
    if (sellerOnlyStatuses.includes(status) && order.seller_user_id !== userId) {
        orderSellerId: order.seller_id, 
        orderSellerUserId: order.seller_user_id,
        requestUserId: userId, 
        status 
      });
      throw new Error('Only seller can perform this action');
    }
    
    if (bothCanUpdate.includes(status) && order.buyer_id !== userId && order.seller_user_id !== userId) {
      throw new Error('Only buyer or seller can perform this action');
    }
    
    // For other statuses, ensure user is either buyer or seller
    if (!buyerOnlyStatuses.includes(status) && 
        !sellerOnlyStatuses.includes(status) && 
        !bothCanUpdate.includes(status) &&
        order.buyer_id !== userId && order.seller_user_id !== userId) {
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
    
    // Update payment status when order is completed
    if (status === 'completed') {
      const paymentUpdateQuery = `
        UPDATE payments 
        SET status = 'captured', updated_at = NOW()
        WHERE order_id = $1 AND status = 'escrowed'
      `;
      
      await pool.query(paymentUpdateQuery, [orderId]);
    }
    
    // Send Inngest event for order shipped
    if (status === 'shipped') {
      try {
        // Get order details for the event
        const orderDetails = await pool.query(`
          SELECT o.*, dr.id as deal_room_id
          FROM orders o
          LEFT JOIN deal_rooms dr ON o.metadata->>'intent_id' = dr.intent_id
          WHERE o.id = $1
        `, [orderId]);
        
        const orderData = orderDetails.rows[0];
        
        // Send the order shipped event
        await inngest.send({
          name: 'deal.order.shipped',
          data: {
            dealRoomId: orderData.deal_room_id,
            orderId: orderId
          }
        });
        
      } catch (eventError) {
        console.error('[ORDER SHIPPED] Failed to send event:', eventError);
        // Don't fail the transaction if event fails
      }
    }
    
    // Send Inngest event for delivery notification if status is 'delivered'
    if (status === 'delivered') {
      try {
        // Get order details for the event
        const orderDetails = await pool.query(`
          SELECT o.*, l.title as listing_title
          FROM orders o
          LEFT JOIN order_items oi ON o.id = oi.order_id
          LEFT JOIN listings l ON oi.listing_id = l.id
          WHERE o.id = $1
        `, [orderId]);
        
        const orderData = orderDetails.rows[0];
        
        // Send the delivery notification event
        await inngest.send({
          name: 'order.delivered',
          data: {
            orderId: orderId,
            buyerId: orderData.buyer_id,
            sellerId: orderData.seller_id,
            orderData: {
              listingTitle: orderData.listing_title,
              totalAmount: orderData.total_amount,
              currency: orderData.currency
            }
          }
        });
        
      } catch (eventError) {
        console.error('[DELIVERY NOTIFICATION] Failed to send event:', eventError);
        // Don't fail the transaction if event fails
      }
    }

    // Send deal.order.delivered event if status is 'completed' (buyer confirmed delivery)
    if (status === 'completed') {
      try {
        // Get order details for the event
        const orderDetails = await pool.query(`
          SELECT o.*, dr.id as deal_room_id
          FROM orders o
          LEFT JOIN deal_rooms dr ON dr.intent_id::text = o.metadata->>'intent_id'
          WHERE o.id = $1
        `, [orderId]);
        
        const orderData = orderDetails.rows[0];
        
        // Send the order delivered event
        await inngest.send({
          name: 'deal.order.delivered',
          data: {
            dealRoomId: orderData.deal_room_id,
            orderId: orderId
          }
        });
        
      } catch (eventError) {
        console.error('[ORDER DELIVERED] Failed to send event:', eventError);
        // Don't fail the transaction if event fails
      }
    }
    
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
