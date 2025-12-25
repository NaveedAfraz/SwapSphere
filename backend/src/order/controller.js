const { pool } = require("../database/db");
const { 
  createOrder: createOrderModel,
  getOrdersByUser,
  getOrderById,
  updateOrderStatus,
  getOrderItems
} = require('./model');

const createOrder = async (req, res) => {
  try {
    const buyerId = req.user.id;
    const { offer_id, shipping_address, billing_info } = req.body;
    
    // Get offer details and verify it's accepted
    const offerQuery = `
      SELECT o.*, l.seller_id, l.title, l.price
      FROM offers o
      JOIN listings l ON o.listing_id = l.id
      WHERE o.id = $1 AND o.buyer_id = $2 AND o.status = 'accepted'
    `;
    
    const offerResult = await pool.query(offerQuery, [offer_id, buyerId]);
    
    if (offerResult.rows.length === 0) {
      return res.status(400).json({ error: 'Offer not found or not accepted' });
    }
    
    const offer = offerResult.rows[0];
    
    const order = await createOrderModel(buyerId, offer.seller_id, {
      total_amount: offer.offered_price * offer.offered_quantity,
      currency: offer.currency || 'USD',
      shipping_address,
      billing_info,
      metadata: {
        offer_id: offer.id,
        listing_id: offer.listing_id,
        listing_title: offer.title
      }
    });
    
    res.status(201).json(order);
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getBuyerOrders = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20, status } = req.query;
    
    
    const result = await getOrdersByUser(userId, 'buyer', status, page, limit);
    
    
    res.json(result);
  } catch (error) {
    console.error('Error getting buyer orders:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getSellerOrders = async (req, res) => {
  try {
    const sellerUserId = req.user.id;
    
    // Get seller ID for this user
    const sellerQuery = 'SELECT id FROM sellers WHERE user_id = $1';
    const sellerResult = await pool.query(sellerQuery, [sellerUserId]);
    
    if (sellerResult.rows.length === 0) {
      return res.status(404).json({ error: 'Seller profile not found' });
    }
    
    const sellerId = sellerResult.rows[0].id;
    const { status, page = 1, limit = 20 } = req.query;
    
    const filters = {};
    if (status) filters.status = status;
    
    const options = {
      page: parseInt(page),
      limit: parseInt(limit)
    };
    
    const result = await getOrdersByUser(sellerId, 'seller', filters, options);
    
    res.json(result);
  } catch (error) {
    console.error('Error getting seller orders:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getOrder = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    
    
    const order = await getOrderById(userId, id);
    
    if (order) {
    }
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    // Add cache-busting headers
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    
    res.json(order);
  } catch (error) {
    console.error('Error getting order:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const updateStatus = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { status, tracking_info } = req.body;
    
    
    // Validate status transitions
    const validStatuses = ['pending', 'reserved', 'paid', 'shipped', 'delivered', 'cancelled', 'refunded', 'disputed', 'completed'];
    
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    
    const order = await updateOrderStatus(userId, id, status, tracking_info);
    
    res.json(order);
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getOrderItemsController = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    
    // Verify user has access to this order
    const order = await getOrderById(userId, id);
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    const items = await getOrderItems(id);
    
    res.json(items);
  } catch (error) {
    console.error('Error getting order items:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const cancelOrder = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { reason } = req.body;
    
    const order = await updateOrderStatus(userId, id, 'cancelled', { reason });
    
    res.json(order);
  } catch (error) {
    console.error('Error cancelling order:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  createOrder,
  getBuyerOrders,
  getSellerOrders,
  getOrder,
  updateStatus,
  getOrderItems: getOrderItemsController,
  cancelOrder
};
