const db = require('../database/connection');
const { validationResult } = require('express-validator');

class SupportController {
  // Ticket management
  async createTicket(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ error: 'Validation failed', details: errors.array() });
      }

      const { type, category, priority, subject, description, attachments, order_id, listing_id, user_reported_id } = req.body;
      const user_id = req.user.id;

      // Generate ticket number
      const ticket_number = `TKT-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

      const query = `
        INSERT INTO support_tickets (
          user_id, ticket_number, type, category, priority, status, 
          subject, description, attachments, order_id, listing_id, user_reported_id
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING *
      `;

      const values = [
        user_id, ticket_number, type, category, priority, 'open',
        subject, description, attachments || [], order_id, listing_id, user_reported_id
      ];

      const result = await db.query(query, values);

      // Create initial system message
      await db.query(
        'INSERT INTO support_messages (ticket_id, sender_id, sender_type, message, is_internal) VALUES ($1, $2, $3, $4, $5)',
        [result.rows[0].id, user_id, 'user', description, false]
      );

      res.status(201).json({ ticket: result.rows[0] });
    } catch (error) {
      console.error('Error creating ticket:', error);
      res.status(500).json({ error: 'Failed to create ticket' });
    }
  }

  async getTickets(req, res) {
    try {
      const { status, category, priority, type, search, page = 1, limit = 20, sortBy = 'created_at', sortOrder = 'desc' } = req.query;
      const user_id = req.user.id;
      const offset = (page - 1) * limit;

      let query = `
        SELECT * FROM support_tickets 
        WHERE user_id = $1
      `;
      let values = [user_id];

      if (status) {
        query += ` AND status = $${values.length + 1}`;
        values.push(status);
      }

      if (category) {
        query += ` AND category = $${values.length + 1}`;
        values.push(category);
      }

      if (priority) {
        query += ` AND priority = $${values.length + 1}`;
        values.push(priority);
      }

      if (type) {
        query += ` AND type = $${values.length + 1}`;
        values.push(type);
      }

      if (search) {
        query += ` AND (subject ILIKE $${values.length + 1} OR description ILIKE $${values.length + 1})`;
        values.push(`%${search}%`);
      }

      // Add sorting
      query += ` ORDER BY ${sortBy} ${sortOrder}`;

      // Add pagination
      query += ` LIMIT $${values.length + 1} OFFSET $${values.length + 2}`;
      values.push(limit, offset);

      const result = await db.query(query, values);

      // Get total count
      let countQuery = `
        SELECT COUNT(*) FROM support_tickets 
        WHERE user_id = $1
      `;
      let countValues = [user_id];

      if (status) {
        countQuery += ` AND status = $${countValues.length + 1}`;
        countValues.push(status);
      }

      if (category) {
        countQuery += ` AND category = $${countValues.length + 1}`;
        countValues.push(category);
      }

      if (priority) {
        countQuery += ` AND priority = $${countValues.length + 1}`;
        countValues.push(priority);
      }

      if (type) {
        countQuery += ` AND type = $${countValues.length + 1}`;
        countValues.push(type);
      }

      if (search) {
        countQuery += ` AND (subject ILIKE $${countValues.length + 1} OR description ILIKE $${countValues.length + 1})`;
        countValues.push(`%${search}%`);
      }

      const countResult = await db.query(countQuery, countValues);
      const total = parseInt(countResult.rows[0].count);

      res.json({
        tickets: result.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          hasMore: offset + result.rows.length < total
        }
      });
    } catch (error) {
      console.error('Error fetching tickets:', error);
      res.status(500).json({ error: 'Failed to fetch tickets' });
    }
  }

  async getTicketById(req, res) {
    try {
      const { id } = req.params;
      const user_id = req.user.id;

      const query = `
        SELECT * FROM support_tickets 
        WHERE id = $1 AND user_id = $2
      `;

      const result = await db.query(query, [id, user_id]);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Ticket not found' });
      }

      res.json({ ticket: result.rows[0] });
    } catch (error) {
      console.error('Error fetching ticket:', error);
      res.status(500).json({ error: 'Failed to fetch ticket' });
    }
  }

  async updateTicket(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ error: 'Validation failed', details: errors.array() });
      }

      const { id } = req.params;
      const user_id = req.user.id;
      const updates = req.body;

      // Build dynamic update query
      const updateFields = [];
      const values = [];
      let paramIndex = 1;

      Object.keys(updates).forEach(key => {
        if (updates[key] !== undefined) {
          updateFields.push(`${key} = $${paramIndex}`);
          values.push(updates[key]);
          paramIndex++;
        }
      });

      if (updateFields.length === 0) {
        return res.status(400).json({ error: 'No valid fields to update' });
      }

      values.push(id, user_id);

      const query = `
        UPDATE support_tickets 
        SET ${updateFields.join(', ')}, updated_at = NOW()
        WHERE id = $${paramIndex} AND user_id = $${paramIndex + 1}
        RETURNING *
      `;

      const result = await db.query(query, values);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Ticket not found' });
      }

      res.json({ ticket: result.rows[0] });
    } catch (error) {
      console.error('Error updating ticket:', error);
      res.status(500).json({ error: 'Failed to update ticket' });
    }
  }

  // Message management
  async getTicketMessages(req, res) {
    try {
      const { id } = req.params;
      const user_id = req.user.id;

      // First verify user owns the ticket
      const ticketCheck = await db.query(
        'SELECT id FROM support_tickets WHERE id = $1 AND user_id = $2',
        [id, user_id]
      );

      if (ticketCheck.rows.length === 0) {
        return res.status(404).json({ error: 'Ticket not found' });
      }

      const query = `
        SELECT * FROM support_messages 
        WHERE ticket_id = $1 AND is_internal = false
        ORDER BY created_at ASC
      `;

      const result = await db.query(query, [id]);

      res.json({ messages: result.rows });
    } catch (error) {
      console.error('Error fetching messages:', error);
      res.status(500).json({ error: 'Failed to fetch messages' });
    }
  }

  async createMessage(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ error: 'Validation failed', details: errors.array() });
      }

      const { ticket_id, message, attachments } = req.body;
      const user_id = req.user.id;

      // Verify user owns the ticket
      const ticketCheck = await db.query(
        'SELECT id, status FROM support_tickets WHERE id = $1 AND user_id = $2',
        [ticket_id, user_id]
      );

      if (ticketCheck.rows.length === 0) {
        return res.status(404).json({ error: 'Ticket not found' });
      }

      const query = `
        INSERT INTO support_messages (ticket_id, sender_id, sender_type, message, attachments, is_internal)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `;

      const values = [
        ticket_id, user_id, 'user', message, attachments || [], false
      ];

      const result = await db.query(query, values);

      // Update ticket's last activity
      await db.query(
        'UPDATE support_tickets SET last_activity_at = NOW() WHERE id = $1',
        [ticket_id]
      );

      res.status(201).json({ message: result.rows[0] });
    } catch (error) {
      console.error('Error creating message:', error);
      res.status(500).json({ error: 'Failed to send message' });
    }
  }

  // Dispute management
  async createDispute(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ error: 'Validation failed', details: errors.array() });
      }

      const { order_id, respondent_id, reason, category, priority, evidence } = req.body;
      const reporter_id = req.user.id;

      // Verify order exists and reporter is involved
      const orderCheck = await db.query(
        'SELECT id FROM orders WHERE id = $1 AND (buyer_id = $2 OR seller_id = $2)',
        [order_id, reporter_id]
      );

      if (orderCheck.rows.length === 0) {
        return res.status(404).json({ error: 'Order not found or access denied' });
      }

      const query = `
        INSERT INTO disputes (order_id, reporter_id, respondent_id, reason, category, priority, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `;

      const values = [order_id, reporter_id, respondent_id, reason, category, priority, 'open'];

      const result = await db.query(query, values);

      // Add evidence if provided
      if (evidence && evidence.length > 0) {
        const evidenceQuery = `
          INSERT INTO dispute_evidence (dispute_id, submitted_by, evidence_type, evidence_url, description)
          VALUES ${evidence.map((_, index) => `($1, $2, $${index * 3 + 3}, $${index * 3 + 4}, $${index * 3 + 5})`).join(', ')}
        `;

        const evidenceValues = evidence.flatMap(e => [e.evidence_type, e.evidence_url, e.description || null]);
        await db.query(evidenceQuery, [result.rows[0].id, reporter_id, ...evidenceValues]);
      }

      res.status(201).json({ dispute: result.rows[0] });
    } catch (error) {
      console.error('Error creating dispute:', error);
      res.status(500).json({ error: 'Failed to create dispute' });
    }
  }

  async getDisputes(req, res) {
    try {
      const { status, category, priority, search, page = 1, limit = 20, sortBy = 'created_at', sortOrder = 'desc' } = req.query;
      const user_id = req.user.id;
      const offset = (page - 1) * limit;

      let query = `
        SELECT d.*, o.buyer_id, o.seller_id 
        FROM disputes d
        JOIN orders o ON d.order_id = o.id
        WHERE (d.reporter_id = $1 OR d.respondent_id = $1)
      `;
      let values = [user_id];

      if (status) {
        query += ` AND d.status = $${values.length + 1}`;
        values.push(status);
      }

      if (category) {
        query += ` AND d.category = $${values.length + 1}`;
        values.push(category);
      }

      if (priority) {
        query += ` AND d.priority = $${values.length + 1}`;
        values.push(priority);
      }

      if (search) {
        query += ` AND (d.reason ILIKE $${values.length + 1})`;
        values.push(`%${search}%`);
      }

      // Add sorting
      query += ` ORDER BY d.${sortBy} ${sortOrder}`;

      // Add pagination
      query += ` LIMIT $${values.length + 1} OFFSET $${values.length + 2}`;
      values.push(limit, offset);

      const result = await db.query(query, values);

      // Get total count
      let countQuery = `
        SELECT COUNT(*) 
        FROM disputes d
        JOIN orders o ON d.order_id = o.id
        WHERE (d.reporter_id = $1 OR d.respondent_id = $1)
      `;
      let countValues = [user_id];

      if (status) {
        countQuery += ` AND d.status = $${countValues.length + 1}`;
        countValues.push(status);
      }

      if (category) {
        countQuery += ` AND d.category = $${countValues.length + 1}`;
        countValues.push(category);
      }

      if (priority) {
        countQuery += ` AND d.priority = $${countValues.length + 1}`;
        countValues.push(priority);
      }

      if (search) {
        countQuery += ` AND (d.reason ILIKE $${countValues.length + 1})`;
        countValues.push(`%${search}%`);
      }

      const countResult = await db.query(countQuery, countValues);
      const total = parseInt(countResult.rows[0].count);

      res.json({
        disputes: result.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          hasMore: offset + result.rows.length < total
        }
      });
    } catch (error) {
      console.error('Error fetching disputes:', error);
      res.status(500).json({ error: 'Failed to fetch disputes' });
    }
  }

  async getDisputeById(req, res) {
    try {
      const { id } = req.params;
      const user_id = req.user.id;

      const query = `
        SELECT d.*, o.buyer_id, o.seller_id 
        FROM disputes d
        JOIN orders o ON d.order_id = o.id
        WHERE d.id = $1 AND (d.reporter_id = $2 OR d.respondent_id = $2)
      `;

      const result = await db.query(query, [id, user_id]);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Dispute not found' });
      }

      // Get evidence
      const evidenceQuery = `
        SELECT * FROM dispute_evidence 
        WHERE dispute_id = $1 
        ORDER BY created_at ASC
      `;
      const evidenceResult = await db.query(evidenceQuery, [id]);

      const dispute = result.rows[0];
      dispute.evidence = evidenceResult.rows;

      res.json({ dispute });
    } catch (error) {
      console.error('Error fetching dispute:', error);
      res.status(500).json({ error: 'Failed to fetch dispute' });
    }
  }

  async submitEvidence(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ error: 'Validation failed', details: errors.array() });
      }

      const { dispute_id, evidence_type, evidence_url, description } = req.body;
      const user_id = req.user.id;

      // Verify user is involved in dispute
      const disputeCheck = await db.query(
        'SELECT id FROM disputes WHERE id = $1 AND (reporter_id = $2 OR respondent_id = $2)',
        [dispute_id, user_id]
      );

      if (disputeCheck.rows.length === 0) {
        return res.status(404).json({ error: 'Dispute not found or access denied' });
      }

      const query = `
        INSERT INTO dispute_evidence (dispute_id, submitted_by, evidence_type, evidence_url, description)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `;

      const values = [dispute_id, user_id, evidence_type, evidence_url, description];

      const result = await db.query(query, values);

      res.status(201).json({ evidence: result.rows[0] });
    } catch (error) {
      console.error('Error submitting evidence:', error);
      res.status(500).json({ error: 'Failed to submit evidence' });
    }
  }

  async submitSatisfaction(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ error: 'Validation failed', details: errors.array() });
      }

      const { ticket_id, rating, comment } = req.body;
      const user_id = req.user.id;

      // Verify ticket exists and belongs to user
      const ticketCheck = await db.query(
        'SELECT id, status FROM support_tickets WHERE id = $1 AND user_id = $2',
        [ticket_id, user_id]
      );

      if (ticketCheck.rows.length === 0) {
        return res.status(404).json({ error: 'Ticket not found' });
      }

      if (ticketCheck.rows[0].status !== 'resolved') {
        return res.status(400).json({ error: 'Ticket must be resolved to submit satisfaction rating' });
      }

      const query = `
        UPDATE support_tickets 
        SET satisfaction_rating = $1, satisfaction_comment = $2, updated_at = NOW()
        WHERE id = $3
      `;

      await db.query(query, [rating, comment, ticket_id]);

      res.json({ message: 'Satisfaction rating submitted successfully' });
    } catch (error) {
      console.error('Error submitting satisfaction:', error);
      res.status(500).json({ error: 'Failed to submit satisfaction rating' });
    }
  }

  async getStats(req, res) {
    try {
      const user_id = req.user.id;

      const query = `
        SELECT 
          COUNT(*) as total_tickets,
          COUNT(*) FILTER (WHERE status = 'open') as open_tickets,
          COUNT(*) FILTER (WHERE status = 'resolved') as resolved_tickets,
          COUNT(*) FILTER (WHERE status IN ('pending_customer', 'pending_support')) as pending_tickets,
          COUNT(*) FILTER (WHERE priority = 'urgent') as urgent_tickets,
          AVG(CASE 
            WHEN resolved_at IS NOT NULL 
            THEN EXTRACT(EPOCH FROM (resolved_at - created_at)) / 3600 
            ELSE NULL 
          END) as avg_resolution_hours,
          AVG(satisfaction_rating) as avg_satisfaction
        FROM support_tickets 
        WHERE user_id = $1
      `;

      const result = await db.query(query, [user_id]);

      const stats = {
        total_tickets: parseInt(result.rows[0].total_tickets),
        open_tickets: parseInt(result.rows[0].open_tickets),
        resolved_tickets: parseInt(result.rows[0].resolved_tickets),
        pending_tickets: parseInt(result.rows[0].pending_tickets),
        urgent_tickets: parseInt(result.rows[0].urgent_tickets),
        average_resolution_time: parseFloat(result.rows[0].avg_resolution_hours) || 0,
        satisfaction_score: parseFloat(result.rows[0].avg_satisfaction) || 0,
      };

      res.json({ stats });
    } catch (error) {
      console.error('Error fetching stats:', error);
      res.status(500).json({ error: 'Failed to fetch stats' });
    }
  }
}

module.exports = new SupportController();
