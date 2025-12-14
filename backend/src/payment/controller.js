const { pool } = require("../database/db");
const { 
  createPayment: createPaymentModel,
  getPaymentsByOrder,
  getPaymentById,
  updatePaymentStatus
} = require('./model');

const createPayment = async (req, res) => {
  try {
    const userId = req.user.id;
    const { order_id, provider, payment_method_id } = req.body;
    
    // Verify user owns this order
    const orderQuery = `
      SELECT o.id, o.total_amount, o.currency, o.buyer_id
      FROM orders o
      WHERE o.id = $1 AND o.buyer_id = $2
    `;
    
    const orderResult = await pool.query(orderQuery, [order_id, userId]);
    
    if (orderResult.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    const order = orderResult.rows[0];
    
    const payment = await createPaymentModel(order_id, {
      provider,
      amount: order.total_amount,
      currency: order.currency,
      capture_method: payment_method_id
    });
    
    res.status(201).json(payment);
  } catch (error) {
    console.error('Error creating payment:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getOrderPayments = async (req, res) => {
  try {
    const userId = req.user.id;
    const { orderId } = req.params;
    
    // Verify user has access to this order
    const orderQuery = `
      SELECT 1 FROM orders o
      WHERE o.id = $1 AND (o.buyer_id = $2 OR o.seller_id = $2)
    `;
    
    const orderResult = await pool.query(orderQuery, [orderId, userId]);
    
    if (orderResult.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    const result = await getPaymentsByOrder(orderId);
    
    res.json(result);
  } catch (error) {
    console.error('Error getting order payments:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getPayment = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    
    const payment = await getPaymentById(userId, id);
    
    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }
    
    res.json(payment);
  } catch (error) {
    console.error('Error getting payment:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const confirmPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { provider_payment_id, status } = req.body;
    
    const payment = await updatePaymentStatus(id, {
      provider_payment_id,
      status
    });
    
    res.json(payment);
  } catch (error) {
    console.error('Error confirming payment:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const refundPayment = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { reason, amount } = req.body;
    
    // Verify user can refund this payment
    const paymentQuery = `
      SELECT p.*, o.buyer_id, o.seller_id
      FROM payments p
      JOIN orders o ON p.order_id = o.id
      WHERE p.id = $1
    `;
    
    const paymentResult = await pool.query(paymentQuery, [id]);
    
    if (paymentResult.rows.length === 0) {
      return res.status(404).json({ error: 'Payment not found' });
    }
    
    const payment = paymentResult.rows[0];
    
    if (payment.buyer_id !== userId && payment.seller_id !== userId) {
      return res.status(403).json({ error: 'Not authorized to refund this payment' });
    }
    
    const updatedPayment = await updatePaymentStatus(id, {
      status: 'refunded',
      metadata: { reason, refund_amount: amount }
    });
    
    res.json(updatedPayment);
  } catch (error) {
    console.error('Error refunding payment:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  createPayment,
  getOrderPayments,
  getPayment,
  confirmPayment,
  refundPayment
};
