const express = require("express");
const { body } = require("express-validator");
const { authenticate } = require("../../src/common/middleware/auth");
const controller = require("./controller");

const router = express.Router();

// Validation rules
const createTicketValidation = [
  body("type")
    .isIn(["ticket", "dispute", "inquiry"])
    .withMessage("Invalid ticket type"),
  body("category")
    .isIn([
      "account",
      "payment",
      "listing",
      "order",
      "dispute",
      "technical",
      "feature_request",
      "bug_report",
      "safety",
      "other",
    ])
    .withMessage("Invalid category"),
  body("priority")
    .isIn(["low", "medium", "high", "urgent"])
    .withMessage("Invalid priority"),
  body("subject")
    .trim()
    .isLength({ min: 3, max: 200 })
    .withMessage("Subject must be 3-200 characters"),
  body("description")
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage("Description must be 10-2000 characters"),
  body("attachments")
    .optional()
    .isArray()
    .withMessage("Attachments must be an array"),
  body("order_id").optional().isUUID().withMessage("Invalid order ID"),
  body("listing_id").optional().isUUID().withMessage("Invalid listing ID"),
  body("user_reported_id").optional().isUUID().withMessage("Invalid user ID"),
];

const updateTicketValidation = [
  body("category")
    .optional()
    .isIn([
      "account",
      "payment",
      "listing",
      "order",
      "dispute",
      "technical",
      "feature_request",
      "bug_report",
      "safety",
      "other",
    ])
    .withMessage("Invalid category"),
  body("priority")
    .optional()
    .isIn(["low", "medium", "high", "urgent"])
    .withMessage("Invalid priority"),
  body("status")
    .optional()
    .isIn([
      "open",
      "in_progress",
      "pending_customer",
      "pending_support",
      "resolved",
      "closed",
    ])
    .withMessage("Invalid status"),
  body("subject")
    .optional()
    .trim()
    .isLength({ min: 3, max: 200 })
    .withMessage("Subject must be 3-200 characters"),
  body("description")
    .optional()
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage("Description must be 10-2000 characters"),
  body("assigned_to").optional().isUUID().withMessage("Invalid assignee ID"),
  body("escalation_level")
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage("Escalation level must be 1-5"),
];

const createMessageValidation = [
  body("ticket_id").isUUID().withMessage("Invalid ticket ID"),
  body("message")
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage("Message must be 1-1000 characters"),
  body("attachments")
    .optional()
    .isArray()
    .withMessage("Attachments must be an array"),
];

const createDisputeValidation = [
  body("order_id").isUUID().withMessage("Invalid order ID"),
  body("respondent_id").isUUID().withMessage("Invalid respondent ID"),
  body("reason")
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage("Reason must be 10-1000 characters"),
  body("category")
    .isIn([
      "account",
      "payment",
      "listing",
      "order",
      "dispute",
      "technical",
      "feature_request",
      "bug_report",
      "safety",
      "other",
    ])
    .withMessage("Invalid category"),
  body("priority")
    .isIn(["low", "medium", "high", "urgent"])
    .withMessage("Invalid priority"),
  body("evidence")
    .optional()
    .isArray()
    .withMessage("Evidence must be an array"),
];

const submitEvidenceValidation = [
  body("dispute_id").isUUID().withMessage("Invalid dispute ID"),
  body("evidence_type")
    .isIn(["photo", "document", "message", "other"])
    .withMessage("Invalid evidence type"),
  body("evidence_url").isURL().withMessage("Invalid evidence URL"),
  body("description")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Description must be max 500 characters"),
];

const satisfactionValidation = [
  body("ticket_id").isUUID().withMessage("Invalid ticket ID"),
  body("rating").isInt({ min: 1, max: 5 }).withMessage("Rating must be 1-5"),
  body("comment")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Comment must be max 500 characters"),
];

// Ticket routes
router.post(
  "/tickets",
  authenticate,
  createTicketValidation,
  controller.createTicket
);
router.get("/tickets", authenticate, controller.getTickets);
router.get("/tickets/:id", authenticate, controller.getTicketById);
router.put(
  "/tickets/:id",
  authenticate,
  updateTicketValidation,
  controller.updateTicket
);

// Message routes
router.get("/tickets/:id/messages", authenticate, controller.getTicketMessages);
router.post(
  "/messages",
  authenticate,
  createMessageValidation,
  controller.createMessage
);

// Dispute routes
router.post(
  "/disputes",
  authenticate,
  createDisputeValidation,
  controller.createDispute
);
router.get("/disputes", authenticate, controller.getDisputes);
router.get("/disputes/:id", authenticate, controller.getDisputeById);
router.post(
  "/disputes/:id/evidence",
  authenticate,
  submitEvidenceValidation,
  controller.submitEvidence
);

// Satisfaction routes
router.post(
  "/satisfaction",
  authenticate,
  satisfactionValidation,
  controller.submitSatisfaction
);

// Stats routes
router.get("/stats", authenticate, controller.getStats);

// My tickets/disputes shortcuts
router.get("/my-tickets", authenticate, controller.getTickets);
router.get("/my-disputes", authenticate, controller.getDisputes);

module.exports = router;
