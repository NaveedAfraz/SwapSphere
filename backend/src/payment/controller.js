const { pool } = require('../database/db');
const { createPayment: createPaymentModel, updatePaymentStatus, getPaymentsByOrder, getPaymentById, updatePaymentTimeline, movePaymentToEscrow, releaseEscrowFunds } = require('./model');
const EventService = require('../services/eventService');

// Helper function to update order status based on payment status
const updateOrderStatusFromPayment = async (orderId, paymentStatus) => {
  const statusMapping = {
    'created': 'pending',
    'requires_action': 'pending',
    'succeeded': 'paid',
    'escrowed': 'paid',
    'released': 'completed',
    'failed': 'cancelled',
    'canceled': 'cancelled',
    'refunded': 'refunded'
  };

  const orderStatus = statusMapping[paymentStatus];
  if (orderStatus) {
    const updateQuery = `
      UPDATE orders 
      SET status = $1, updated_at = NOW()
      WHERE id = $2
    `;
    await pool.query(updateQuery, [orderStatus, orderId]);
    
  }
};

// Initialize PayPal
let paypal;

try {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

 

  if (clientId && clientSecret) {
    const paypalSDK = require("@paypal/checkout-server-sdk");

    // Create PayPal environment and client
    const environment = new paypalSDK.core.SandboxEnvironment(
      clientId,
      clientSecret
    );
    paypal = new paypalSDK.core.PayPalHttpClient(environment);
  } else {
    console.warn("[PAYMENT] PayPal credentials not found");
    paypal = null;
  }
} catch (error) {
  console.error("[PAYMENT] Failed to initialize PayPal:", error.message);
  paypal = null;
}


const createPayPalPaymentIntent = async (req, res) => {
  await pool.query("BEGIN");

  try {
    const userId = req.user.id;
    const { order_id } = req.body;

 
    // Lock the order row to prevent concurrent payment creation
    const lockQuery = "SELECT * FROM orders WHERE id = $1 FOR UPDATE";
    const orderResult = await pool.query(lockQuery, [order_id]);

    if (orderResult.rows.length === 0) {
      throw new Error("Order not found");
    }

    const order = orderResult.rows[0];
     

    // Verify user ownership
    if (order.buyer_id !== userId) {
      throw new Error("You can only create payments for your own orders");
    }

    // Check order status
    if (order.status !== "pending") {
      throw new Error("Order must be in pending status to create payment");
    }

    // Check for existing payments
    const existingPaymentQuery =
      "SELECT * FROM payments WHERE order_id = $1 AND status NOT IN ('failed', 'canceled')";
    const existingPaymentResult = await pool.query(existingPaymentQuery, [
      order_id,
    ]);

    if (existingPaymentResult.rows.length > 0) {
      throw new Error("Payment already exists for this order");
    }

    // Create PayPal order
 

    let paypalOrder;
    if (paypal) {
      // Real PayPal integration
      const paypalSDK = require("@paypal/checkout-server-sdk");
      const request = new paypalSDK.orders.OrdersCreateRequest();

      request.requestBody({
        intent: "CAPTURE",
        purchase_units: [
          {
            amount: {
              currency_code: "USD", // Hardcoded USD
              value: order.total_amount.toString(),
            },
            reference_id: order_id,
            description: `Payment for order ${order_id}`,
          },
        ],
        application_context: {
          return_url: `http://192.168.0.104:3000/payments/paypal/success`,
          cancel_url: `http://192.168.0.104:3000/payments/paypal/cancel`,
          brand_name: "SwapSphere",
          landing_page: "BILLING",
          user_action: "PAY_NOW",
        },
      });

      try {
        const response = await paypal.execute(request);
        paypalOrder = response.result;
       
      } catch (paypalError) {
        console.error("[PAYMENT] PayPal API error:", paypalError);
        throw new Error("PayPal order creation failed: " + paypalError.message);
      }
    } else {
      throw new Error("PayPal SDK not initialized - check credentials");
    }

    // Create minimal payment record with PayPal order ID
    const paymentData = {
      provider: "paypal",
      amount: order.total_amount,
      currency: "USD",
      capture_method: "automatic",
    };

    const payment = await createPaymentModel(order_id, paymentData);

    // Update payment with PayPal order ID but keep as 'created' status
    const updatePaymentQuery = `
      UPDATE payments 
      SET provider_payment_id = $1, status = 'created', updated_at = NOW()
      WHERE id = $2
      RETURNING *
    `;

    const updatedPaymentResult = await pool.query(updatePaymentQuery, [
      paypalOrder.id,
      payment.id,
    ]);
    const updatedPayment = updatedPaymentResult.rows[0];

    // Update order status based on payment status
    await updateOrderStatusFromPayment(order_id, 'created');
 
    await pool.query("COMMIT");

    res.json({
      payment: updatedPayment,
      paypal_order: paypalOrder,
      approval_url: paypalOrder.links.find((link) => link.rel === "approve")
        ?.href,
      message: "PayPal order created successfully",
    });
  } catch (error) {
    await pool.query("ROLLBACK");
    console.error("Error creating PayPal payment intent:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const getOrderPayments = async (req, res) => {
  try {
    const userId = req.user.id;
    const { orderId } = req.params;

    // Verify user has access to this order
    const orderQuery = `
      SELECT 1 FROM orders o
      LEFT JOIN sellers s ON o.seller_id = s.id
      WHERE o.id = $1 AND (o.buyer_id = $2 OR s.user_id = $2)
    `;

    const orderResult = await pool.query(orderQuery, [orderId, userId]);

    if (orderResult.rows.length === 0) {
      return res.status(404).json({ error: "Order not found" });
    }

    const result = await getPaymentsByOrder(orderId);

    res.json(result);
  } catch (error) {
    console.error("Error getting order payments:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const getPayment = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const payment = await getPaymentById(userId, id);

    if (!payment) {
      return res.status(404).json({ error: "Payment not found" });
    }

    res.json(payment);
  } catch (error) {
    console.error("Error getting payment:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const confirmPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { provider_payment_id, status } = req.body;

    const payment = await updatePaymentStatus(id, {
      provider_payment_id,
      status,
    });

    res.json(payment);
  } catch (error) {
    console.error("Error confirming payment:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const capturePayPalPayment = async (req, res) => {
  await pool.query("BEGIN");

  try {
    const userId = req.user.id;
    const { token } = req.body;
    
    
    if (!token) {
      throw new Error('PayPal token is required');
    }
    
    // Find payment record by PayPal order ID (token)
    const paymentQuery = `
      SELECT p.*, o.buyer_id, o.total_amount
      FROM payments p
      JOIN orders o ON p.order_id = o.id
      WHERE p.provider_payment_id = $1 AND p.provider = 'paypal'
    `;
    const paymentResult = await pool.query(paymentQuery, [token]);
    
    if (paymentResult.rows.length === 0) {
      throw new Error('Payment record not found for this PayPal token');
    }
    
    const payment = paymentResult.rows[0];
    
    // Verify user owns this payment
    if (payment.buyer_id !== userId) {
      throw new Error('Not authorized to capture this payment');
    }
    
    // Capture the PayPal order
    
    if (!paypal) {
      throw new Error('PayPal SDK not initialized');
    }
    
    const paypalSDK = require('@paypal/checkout-server-sdk');
    const request = new paypalSDK.orders.OrdersCaptureRequest(token);

    const response = await paypal.execute(request);
    const captureResult = response.result;
 
    // ✅ success path (same as yours)
    const updatePaymentQuery = `
    UPDATE payments 
    SET status = 'escrowed',
        metadata = metadata || $2,
        updated_at = NOW()
    WHERE id = $1
    RETURNING *
  `;

    const captureData = {
      capture_id: captureResult.id,
      capture_status: captureResult.status,
      captured_at: new Date().toISOString(),
    };

    const updatedPaymentResult = await pool.query(updatePaymentQuery, [
      payment.id,
      JSON.stringify(captureData),
    ]);

    const updatedPayment = updatedPaymentResult.rows[0];

    // Update order status based on payment status
    await updateOrderStatusFromPayment(payment.order_id, 'escrowed');

    // Emit deal.payment.authorized event when payment is moved to escrow
    await EventService.dealPaymentAuthorized({
      dealRoomId: payment.deal_room_id || null, // Will need to get this from order metadata
      orderId: payment.order_id,
      paymentIntentId: payment.provider_payment_id
    });

    await pool.query("COMMIT");

    return res.json({
      payment: updatedPayment,
      capture: captureResult,
      message: "PayPal payment captured successfully",
    });
  } catch (error) {
    await pool.query("ROLLBACK");
    console.error('Error capturing PayPal payment:', error);
    
    // Handle INSTRUMENT_DECLINED error for funding source issues
    const raw = error?._originalError?.text;
    if (raw && raw.includes("INSTRUMENT_DECLINED")) {
      const parsed = JSON.parse(raw);
      const redirectUrl = parsed.links?.find((l) => l.rel === "redirect")?.href;

      return res.status(409).json({
        error: "INSTRUMENT_DECLINED",
        message: "Payment method declined. Please try another funding source.",
        redirect_url: redirectUrl,
      });
    }
    
    res.status(500).json({ error: error.message || 'Internal server error' });
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
      return res.status(404).json({ error: "Payment not found" });
    }

    const payment = paymentResult.rows[0];

    if (payment.buyer_id !== userId && payment.seller_id !== userId) {
      return res
        .status(403)
        .json({ error: "Not authorized to refund this payment" });
    }

    // Validate payment status before allowing refund
    const refundableStatuses = ["captured", "succeeded", "held"];
    if (!refundableStatuses.includes(payment.status)) {
      return res.status(400).json({
        error: "Payment cannot be refunded in current status",
        current_status: payment.status,
        refundable_statuses: refundableStatuses,
      });
    }

    // Validate refund amount
    if (amount && (amount <= 0 || amount > payment.amount)) {
      return res.status(400).json({
        error: "Invalid refund amount",
        provided_amount: amount,
        payment_amount: payment.amount,
      });
    }

    const updatedPayment = await updatePaymentStatus(id, {
      status:
        amount && amount < payment.amount ? "partially_refunded" : "refunded",
      metadata: { reason, refund_amount: amount || payment.amount },
    });

    res.json(updatedPayment);
  } catch (error) {
    console.error("Error refunding payment:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const getTransactions = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;


    // Get all payments where user is either buyer or seller
    const query = `
      SELECT 
        p.*,
        o.id as order_id,
        o.total_amount,
        o.status as order_status,
        ub.email as buyer_email,
        us.email as seller_email
      FROM payments p
      JOIN orders o ON p.order_id = o.id
      JOIN users ub ON o.buyer_id = ub.id
      LEFT JOIN sellers s ON o.seller_id = s.id
      LEFT JOIN users us ON s.user_id = us.id
      WHERE o.buyer_id = $1 OR s.user_id = $1
      ORDER BY p.created_at DESC
      LIMIT $2 OFFSET $3
    `;

    const result = await pool.query(query, [userId, limit, offset]);
    
    
    // Transform the data to match frontend expectations
    const transactions = result.rows.map(row => ({
      id: row.id,
      order_id: row.order_id,
      amount: row.total_amount,
      status: row.status,
      payment_method: row.provider,
      created_at: row.created_at,
      // Include timeline timestamps
      created_at: row.created_at,
      requires_action_at: row.requires_action_at,
      succeeded_at: row.succeeded_at,
      escrowed_at: row.escrowed_at,
      released_at: row.released_at,
      failed_at: row.failed_at,
      refunded_at: row.refunded_at,
      canceled_at: row.canceled_at,
      buyer_email: row.buyer_email,
      seller_email: row.seller_email,
    }));

    res.json(transactions);
  } catch (error) {
    console.error("Error getting transactions:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const moveToEscrow = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const { escrowData = {} } = req.body;


    const payment = await movePaymentToEscrow(paymentId, escrowData);

    // Update order status to escrowed
    await pool.query(
      'UPDATE orders SET escrow_info = $1, updated_at = NOW() WHERE id = $2',
      [JSON.stringify({ escrowed_at: new Date(), ...escrowData }), payment.order_id]
    );

    res.json(payment);
  } catch (error) {
    console.error("Error moving payment to escrow:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const releaseEscrow = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const { releaseData = {} } = req.body;


    const payment = await releaseEscrowFunds(paymentId, releaseData);

    // Update order status to indicate funds released
    await pool.query(
      'UPDATE orders SET escrow_info = $1, updated_at = NOW() WHERE id = $2',
      [JSON.stringify({ released_at: new Date(), ...releaseData }), payment.order_id]
    );

    res.json(payment);
  } catch (error) {
    console.error("Error releasing escrow funds:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const updatePaymentTimelineController = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const { status, metadata = {} } = req.body;


    const payment = await updatePaymentTimeline(paymentId, status, metadata);

    res.json(payment);
  } catch (error) {
    console.error("Error updating payment timeline:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = {
  createPayPalPaymentIntent,
  capturePayPalPayment,
  getOrderPayments,
  getPayment,
  confirmPayment,
  refundPayment,
  getPaymentStatus: getPayment,
  getPaymentsByOrder: getOrderPayments,
  getPaymentById: getPayment,
  updatePaymentStatus,
  getTransactions,
  moveToEscrow,
  releaseEscrow,
  updatePaymentTimeline: updatePaymentTimelineController,
};
