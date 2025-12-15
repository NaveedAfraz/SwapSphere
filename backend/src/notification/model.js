const { pool } = require("../database/db");

const createNotification = async (userId, notificationData) => {
  const { type, payload, actor_id } = notificationData;
  
  const query = `
    INSERT INTO notifications (user_id, actor_id, type, payload)
    VALUES ($1, $2, $3, $4)
    RETURNING *
  `;
  
  const result = await pool.query(query, [userId, actor_id, type, payload]);
  return result.rows[0];
};

const updateNotificationStatus = async (notificationId, userId, status, isRead = null) => {
  // Build dynamic update query based on what parameters are provided
  let setClauses = [];
  let queryParams = [];
  let paramIndex = 1;
  
  if (status !== null) {
    setClauses.push(`status = $${paramIndex}`);
    queryParams.push(status);
    paramIndex++;
  }
  
  if (isRead !== null) {
    setClauses.push(`is_read = $${paramIndex}`);
    queryParams.push(isRead);
    paramIndex++;
  }
  
  // Only add SET clause if there are actual updates
  if (setClauses.length === 0) {
    return null; // No updates to make
  }
  
  queryParams.push(notificationId, userId);
  
  const query = `
    UPDATE notifications 
    SET ${setClauses.join(', ')}
    WHERE id = $${paramIndex} AND user_id = $${paramIndex + 1}
    RETURNING *
  `;
  
  console.log('updateNotificationStatus query:', query);
  console.log('updateNotificationStatus params:', queryParams);
  
  const result = await pool.query(query, queryParams);
  console.log('updateNotificationStatus result:', result.rows[0]);
  return result.rows[0];
};

const getNotificationsByUser = async (userId, filters = {}, options = {}) => {
  const { unread_only } = filters;
  const { page = 1, limit = 20 } = options;
  const offset = (page - 1) * limit;
  
  const whereConditions = ['n.user_id = $1'];
  const queryParams = [userId];
  let paramIndex = 2;
  
  if (unread_only) {
    whereConditions.push(`n.is_read = false`);
  }
  
  const countQuery = `
    SELECT COUNT(*) as total
    FROM notifications n
    WHERE ${whereConditions.join(' AND ')}
  `;
  
  const dataQuery = `
    SELECT n.*, 
           p.name as actor_name, p.avatar_key as actor_avatar
    FROM notifications n
    LEFT JOIN users ua ON n.actor_id = ua.id
    LEFT JOIN profiles p ON ua.id = p.user_id
    WHERE ${whereConditions.join(' AND ')}
    ORDER BY n.created_at DESC
    LIMIT $${paramIndex++} OFFSET $${paramIndex++}
  `;
  
  queryParams.push(limit, offset);
  
  const [countResult, dataResult] = await Promise.all([
    pool.query(countQuery, queryParams.slice(0, -2)),
    pool.query(dataQuery, queryParams)
  ]);
  
  const total = parseInt(countResult.rows[0].total);
  const totalPages = Math.ceil(total / limit);
  
  return {
    notifications: dataResult.rows,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1
    }
  };
};

const markNotificationAsRead = async (userId, notificationId) => {
  const query = `
    UPDATE notifications 
    SET is_read = true, delivered_at = NOW()
    WHERE id = $1 AND user_id = $2
    RETURNING *
  `;
  
  const result = await pool.query(query, [notificationId, userId]);
  
  if (result.rows.length === 0) {
    throw new Error('Notification not found or not authorized');
  }
  
  return result.rows[0];
};

const markAllNotificationsAsRead = async (userId) => {
  const query = `
    UPDATE notifications 
    SET is_read = true, delivered_at = NOW()
    WHERE user_id = $1 AND is_read = false
    RETURNING *
  `;
  
  const result = await pool.query(query, [userId]);
  
  return {
    marked_count: result.rows.length,
    notifications: result.rows
  };
};

const deleteNotification = async (userId, notificationId) => {
  const query = `
    DELETE FROM notifications 
    WHERE id = $1 AND user_id = $2
    RETURNING *
  `;
  
  const result = await pool.query(query, [notificationId, userId]);
  
  if (result.rows.length === 0) {
    throw new Error('Notification not found or not authorized');
  }
  
  return result.rows[0];
};

const createBulkNotifications = async (notifications) => {
  const values = notifications.map((notif, index) => 
    `($${index * 4 + 1}, $${index * 4 + 2}, $${index * 4 + 3}, $${index * 4 + 4})`
  ).join(', ');
  
  const params = notifications.flatMap(notif => [
    notif.user_id,
    notif.actor_id,
    notif.type,
    JSON.stringify(notif.payload)
  ]);
  
  const query = `
    INSERT INTO notifications (user_id, actor_id, type, payload)
    VALUES ${values}
    RETURNING *
  `;
  
  const result = await pool.query(query, params);
  return result.rows;
};

const cleanupOldNotifications = async (daysOld = 90) => {
  const query = `
    DELETE FROM notifications 
    WHERE is_read = true AND created_at < NOW() - INTERVAL '${daysOld} days'
    RETURNING *
  `;
  
  const result = await pool.query(query);
  return result.rows;
};

module.exports = {
  createNotification,
  updateNotificationStatus,
  getNotificationsByUser,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  createBulkNotifications,
  cleanupOldNotifications
};
