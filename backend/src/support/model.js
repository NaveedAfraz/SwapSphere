const db = require('../database/connection');

class SupportModel {
  // Support Tickets
  static async createTicket(ticketData) {
    const query = `
      INSERT INTO support_tickets (
        user_id, ticket_number, type, category, priority, status, 
        subject, description, attachments, order_id, listing_id, user_reported_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `;
    
    const values = [
      ticketData.user_id,
      ticketData.ticket_number,
      ticketData.type,
      ticketData.category,
      ticketData.priority,
      ticketData.status || 'open',
      ticketData.subject,
      ticketData.description,
      ticketData.attachments || [],
      ticketData.order_id,
      ticketData.listing_id,
      ticketData.user_reported_id
    ];

    const result = await db.query(query, values);
    return result.rows[0];
  }

  static async findTickets(filters = {}) {
    let query = 'SELECT * FROM support_tickets WHERE 1=1';
    let values = [];
    let paramIndex = 1;

    if (filters.user_id) {
      query += ` AND user_id = $${paramIndex}`;
      values.push(filters.user_id);
      paramIndex++;
    }

    if (filters.status) {
      query += ` AND status = $${paramIndex}`;
      values.push(filters.status);
      paramIndex++;
    }

    if (filters.category) {
      query += ` AND category = $${paramIndex}`;
      values.push(filters.category);
      paramIndex++;
    }

    if (filters.priority) {
      query += ` AND priority = $${paramIndex}`;
      values.push(filters.priority);
      paramIndex++;
    }

    if (filters.type) {
      query += ` AND type = $${paramIndex}`;
      values.push(filters.type);
      paramIndex++;
    }

    if (filters.search) {
      query += ` AND (subject ILIKE $${paramIndex} OR description ILIKE $${paramIndex})`;
      values.push(`%${filters.search}%`);
      paramIndex++;
    }

    // Sorting
    const sortBy = filters.sortBy || 'created_at';
    const sortOrder = filters.sortOrder || 'desc';
    query += ` ORDER BY ${sortBy} ${sortOrder}`;

    // Pagination
    if (filters.limit) {
      query += ` LIMIT $${paramIndex}`;
      values.push(filters.limit);
      paramIndex++;

      if (filters.offset) {
        query += ` OFFSET $${paramIndex}`;
        values.push(filters.offset);
      }
    }

    const result = await db.query(query, values);
    return result.rows;
  }

  static async findTicketById(id, user_id = null) {
    let query = 'SELECT * FROM support_tickets WHERE id = $1';
    let values = [id];

    if (user_id) {
      query += ' AND user_id = $2';
      values.push(user_id);
    }

    const result = await db.query(query, values);
    return result.rows[0];
  }

  static async updateTicket(id, updates) {
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
      throw new Error('No valid fields to update');
    }

    values.push(id);

    const query = `
      UPDATE support_tickets 
      SET ${updateFields.join(', ')}, updated_at = NOW()
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await db.query(query, values);
    return result.rows[0];
  }

  static async deleteTicket(id) {
    const query = 'DELETE FROM support_tickets WHERE id = $1 RETURNING *';
    const result = await db.query(query, [id]);
    return result.rows[0];
  }

  static async countTickets(filters = {}) {
    let query = 'SELECT COUNT(*) FROM support_tickets WHERE 1=1';
    let values = [];
    let paramIndex = 1;

    if (filters.user_id) {
      query += ` AND user_id = $${paramIndex}`;
      values.push(filters.user_id);
      paramIndex++;
    }

    if (filters.status) {
      query += ` AND status = $${paramIndex}`;
      values.push(filters.status);
      paramIndex++;
    }

    if (filters.category) {
      query += ` AND category = $${paramIndex}`;
      values.push(filters.category);
      paramIndex++;
    }

    if (filters.priority) {
      query += ` AND priority = $${paramIndex}`;
      values.push(filters.priority);
      paramIndex++;
    }

    if (filters.type) {
      query += ` AND type = $${paramIndex}`;
      values.push(filters.type);
      paramIndex++;
    }

    if (filters.search) {
      query += ` AND (subject ILIKE $${paramIndex} OR description ILIKE $${paramIndex})`;
      values.push(`%${filters.search}%`);
      paramIndex++;
    }

    const result = await db.query(query, values);
    return parseInt(result.rows[0].count);
  }

  static async getTicketCategoryStats(user_id) {
    const query = `
      SELECT category, COUNT(*) as count
      FROM support_tickets
      WHERE user_id = $1
      GROUP BY category
      ORDER BY count DESC
    `;
    
    const result = await db.query(query, [user_id]);
    const distribution = {};
    
    result.rows.forEach(row => {
      distribution[row.category] = parseInt(row.count);
    });
    
    return distribution;
  }

  static async getStatusStats(user_id) {
    const query = `
      SELECT status, COUNT(*) as count
      FROM support_tickets
      WHERE user_id = $1
      GROUP BY status
      ORDER BY count DESC
    `;
    
    const result = await db.query(query, [user_id]);
    const distribution = {};
    
    result.rows.forEach(row => {
      distribution[row.status] = parseInt(row.count);
    });
    
    return distribution;
  }

  // Support Messages
  static async createMessage(messageData) {
    const query = `
      INSERT INTO support_messages (ticket_id, sender_id, sender_type, message, attachments, is_internal)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    
    const values = [
      messageData.ticket_id,
      messageData.sender_id,
      messageData.sender_type,
      messageData.message,
      messageData.attachments || [],
      messageData.is_internal || false
    ];

    const result = await db.query(query, values);
    return result.rows[0];
  }

  static async findMessages(ticket_id, options = {}) {
    let query = 'SELECT * FROM support_messages WHERE ticket_id = $1';
    let values = [ticket_id];

    if (options.internal_only) {
      query += ' AND is_internal = true';
    } else if (options.public_only) {
      query += ' AND is_internal = false';
    }

    query += ' ORDER BY created_at ASC';

    if (options.limit) {
      query += ` LIMIT $2`;
      values.push(options.limit);
    }

    const result = await db.query(query, values);
    return result.rows;
  }

  // Disputes
  static async createDispute(disputeData) {
    const query = `
      INSERT INTO disputes (order_id, reporter_id, respondent_id, reason, category, priority, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
    
    const values = [
      disputeData.order_id,
      disputeData.reporter_id,
      disputeData.respondent_id,
      disputeData.reason,
      disputeData.category,
      disputeData.priority,
      disputeData.status || 'open'
    ];

    const result = await db.query(query, values);
    return result.rows[0];
  }

  static async findDisputes(filters = {}) {
    let query = `
      SELECT d.*, o.buyer_id, o.seller_id 
      FROM disputes d
      JOIN orders o ON d.order_id = o.id
      WHERE 1=1
    `;
    let values = [];
    let paramIndex = 1;

    if (filters.reporter_id) {
      query += ` AND d.reporter_id = $${paramIndex}`;
      values.push(filters.reporter_id);
      paramIndex++;
    }

    if (filters.respondent_id) {
      query += ` AND d.respondent_id = $${paramIndex}`;
      values.push(filters.respondent_id);
      paramIndex++;
    }

    if (filters.user_id) {
      query += ` AND (d.reporter_id = $${paramIndex} OR d.respondent_id = $${paramIndex})`;
      values.push(filters.user_id);
      paramIndex++;
    }

    if (filters.status) {
      query += ` AND d.status = $${paramIndex}`;
      values.push(filters.status);
      paramIndex++;
    }

    if (filters.category) {
      query += ` AND d.category = $${paramIndex}`;
      values.push(filters.category);
      paramIndex++;
    }

    if (filters.priority) {
      query += ` AND d.priority = $${paramIndex}`;
      values.push(filters.priority);
      paramIndex++;
    }

    if (filters.search) {
      query += ` AND d.reason ILIKE $${paramIndex}`;
      values.push(`%${filters.search}%`);
      paramIndex++;
    }

    // Sorting
    const sortBy = filters.sortBy || 'created_at';
    const sortOrder = filters.sortOrder || 'desc';
    query += ` ORDER BY d.${sortBy} ${sortOrder}`;

    // Pagination
    if (filters.limit) {
      query += ` LIMIT $${paramIndex}`;
      values.push(filters.limit);
      paramIndex++;

      if (filters.offset) {
        query += ` OFFSET $${paramIndex}`;
        values.push(filters.offset);
      }
    }

    const result = await db.query(query, values);
    return result.rows;
  }

  static async findDisputeById(id, user_id = null) {
    let query = `
      SELECT d.*, o.buyer_id, o.seller_id 
      FROM disputes d
      JOIN orders o ON d.order_id = o.id
      WHERE d.id = $1
    `;
    let values = [id];

    if (user_id) {
      query += ` AND (d.reporter_id = $2 OR d.respondent_id = $2)`;
      values.push(user_id);
    }

    const result = await db.query(query, values);
    return result.rows[0];
  }

  static async updateDispute(id, updates) {
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
      throw new Error('No valid fields to update');
    }

    values.push(id);

    const query = `
      UPDATE disputes 
      SET ${updateFields.join(', ')}, updated_at = NOW()
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await db.query(query, values);
    return result.rows[0];
  }

  // Dispute Evidence
  static async createEvidence(evidenceData) {
    const query = `
      INSERT INTO dispute_evidence (dispute_id, submitted_by, evidence_type, evidence_url, description)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    
    const values = [
      evidenceData.dispute_id,
      evidenceData.submitted_by,
      evidenceData.evidence_type,
      evidenceData.evidence_url,
      evidenceData.description
    ];

    const result = await db.query(query, values);
    return result.rows[0];
  }

  static async findEvidence(dispute_id) {
    const query = `
      SELECT * FROM dispute_evidence 
      WHERE dispute_id = $1 
      ORDER BY created_at ASC
    `;
    
    const result = await db.query(query, [dispute_id]);
    return result.rows;
  }

  // Stats
  static async getUserStats(user_id) {
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
    
    return {
      total_tickets: parseInt(result.rows[0].total_tickets),
      open_tickets: parseInt(result.rows[0].open_tickets),
      resolved_tickets: parseInt(result.rows[0].resolved_tickets),
      pending_tickets: parseInt(result.rows[0].pending_tickets),
      urgent_tickets: parseInt(result.rows[0].urgent_tickets),
      average_resolution_time: parseFloat(result.rows[0].avg_resolution_hours) || 0,
      satisfaction_score: parseFloat(result.rows[0].avg_satisfaction) || 0,
    };
  }
}

module.exports = SupportModel;
