/**
 * Workflows Registry
 * 
 * Import and export all workflow functions here.
 */

const { intentMatchingWorkflow } = require("./intentMatchingWorkflow");
const { pushNotificationWorker, cleanupRateLimits } = require("./pushNotificationWorker");
const { deliveryNotificationWorkflow } = require("./deliveryNotificationWorkflow");
const { autoCaptureAfterEscrow } = require("./autoCaptureAfterEscrow");
const {
  autoCapturePayment,
  handlePaymentFailure,
  handleOrderCompletion
} = require('./paymentAutomation');

const {
  cleanupAbandonedDealRooms,
  cleanupOldWebhookEvents,
  cleanupExpiredPayments
} = require('./cleanupJobs');

// const { autoCloseAuction } = require('./auctionWorkflow');

// All workflows to be registered with Inngest
const workflows = [
  intentMatchingWorkflow, 
  pushNotificationWorker, 
  cleanupRateLimits,
  deliveryNotificationWorkflow,
  autoCaptureAfterEscrow,
  autoCapturePayment,
  handlePaymentFailure,
  handleOrderCompletion,
  cleanupAbandonedDealRooms,
  cleanupOldWebhookEvents,
  cleanupExpiredPayments
  // autoCloseAuction
];

// Debug: Log workflow details
workflows.forEach((workflow, index) => {
});

module.exports = {
  workflows,
  intentMatchingWorkflow,
  pushNotificationWorker,
  cleanupRateLimits,
  deliveryNotificationWorkflow,
  autoCaptureAfterEscrow,
  autoCapturePayment,
  handlePaymentFailure,
  // handleOrderCompletion,
  // autoCloseAuction
};
