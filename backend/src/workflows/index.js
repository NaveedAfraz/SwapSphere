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
];

// Debug: Log workflow details
console.log("[WORKFLOWS] Registering workflows:");
console.log(`[WORKFLOWS] Total workflows: ${workflows.length}`);
workflows.forEach((workflow, index) => {
  console.log(`[WORKFLOWS] ${index + 1}. Type: ${typeof workflow}`);
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
  handleOrderCompletion
};
