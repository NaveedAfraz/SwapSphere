/**
 * Workflows Registry
 * 
 * Central registration point for all Inngest workflows.
 * Import and export all workflow functions here.
 */

const { intentMatchingWorkflow } = require("./intentMatchingWorkflow");
const { pushNotificationWorker, cleanupRateLimits } = require("./pushNotificationWorker");

// All workflows to be registered with Inngest
const workflows = [
  intentMatchingWorkflow, 
  pushNotificationWorker, 
  cleanupRateLimits
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
  cleanupRateLimits
};
