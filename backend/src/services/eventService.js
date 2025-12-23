const { inngest } = require("./inngest");

/**
 * Send an event to Inngest
 * @param {string} eventName - The name of the event
 * @param {object} data - The event data payload
 */
const sendEvent = async (eventName, data) => {
  try {
    await inngest.send({
      name: eventName,
      data: {
        ...data,
        timestamp: new Date().toISOString(),
      }
    });
    
    console.log(`[EVENT SERVICE] Event sent: ${eventName}`, data);
    return { success: true };
  } catch (error) {
    console.error(`[EVENT SERVICE] Failed to send event: ${eventName}`, error);
    return { success: false, error: error.message };
  }
};

/**
 * Deal Events
 */
const dealOfferAccepted = ({ dealRoomId, orderId, buyerId, sellerId, amount }) => {
  return sendEvent("deal.offer.accepted", {
    dealRoomId,
    orderId,
    buyerId,
    sellerId,
    amount
  });
};

const dealPaymentAuthorized = ({ dealRoomId, orderId, paymentIntentId }) => {
  return sendEvent("deal.payment.authorized", {
    dealRoomId,
    orderId,
    paymentIntentId
  });
};

const dealOrderShipped = ({ dealRoomId, orderId }) => {
  return sendEvent("deal.order.shipped", {
    dealRoomId,
    orderId
  });
};

const dealOrderDelivered = ({ dealRoomId, orderId }) => {
  return sendEvent("deal.order.delivered", {
    dealRoomId,
    orderId
  });
};

/**
 * Order Events (for existing workflows)
 */
const orderDelivered = ({ orderId, buyerId, sellerId, orderData }) => {
  return sendEvent("order.delivered", {
    orderId,
    buyerId,
    sellerId,
    orderData
  });
};

const orderDeliveryConfirmed = ({ orderId }) => {
  return sendEvent("order.delivery_confirmed", {
    orderId
  });
};

module.exports = {
  sendEvent,
  dealOfferAccepted,
  dealPaymentAuthorized,
  dealOrderShipped,
  dealOrderDelivered,
  orderDelivered,
  orderDeliveryConfirmed
};
