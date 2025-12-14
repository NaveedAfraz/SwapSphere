const { pool } = require("../database/db");

const createReview = async (reviewerId, reviewData) => {
  const { reviewee_id, order_id, rating, title, body } = reviewData;
  
  await pool.query('BEGIN');
  
  try {
    // Create review
    const reviewQuery = `
      INSERT INTO reviews (reviewer_id, reviewee_id, order_id, rating, title, body)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    
    const result = await pool.query(reviewQuery, [reviewerId, reviewee_id, order_id, rating, title, body]);
    const review = result.rows[0];
    
    // Update reviewee's average rating
    await updateUserRating(reviewee_id);
    
    await pool.query('COMMIT');
    
    return review;
  } catch (error) {
    await pool.query('ROLLBACK');
    throw error;
  }
};

const getReviewsByUser = async (userId, options = {}) => {
  const { page = 1, limit = 20 } = options;
  const offset = (page - 1) * limit;
  
  const countQuery = `
    SELECT COUNT(*) as total
    FROM reviews r
    WHERE r.reviewer_id = $1
  `;
  
  const dataQuery = `
    SELECT r.*, 
           pr.name as reviewee_name, pr.avatar_key as reviewee_avatar,
           o.id as order_id, o.created_at as order_date
    FROM reviews r
    LEFT JOIN users ur ON r.reviewee_id = ur.id
    LEFT JOIN profiles pr ON ur.id = pr.user_id
    LEFT JOIN orders o ON r.order_id = o.id
    WHERE r.reviewer_id = $1
    ORDER BY r.created_at DESC
    LIMIT $2 OFFSET $3
  `;
  
  const [countResult, dataResult] = await Promise.all([
    pool.query(countQuery, [userId]),
    pool.query(dataQuery, [userId, limit, offset])
  ]);
  
  const total = parseInt(countResult.rows[0].total);
  const totalPages = Math.ceil(total / limit);
  
  return {
    reviews: dataResult.rows,
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

const getReviewsForUser = async (userId, options = {}) => {
  const { page = 1, limit = 20 } = options;
  const offset = (page - 1) * limit;
  
  const countQuery = `
    SELECT COUNT(*) as total
    FROM reviews r
    WHERE r.reviewee_id = $1
  `;
  
  const dataQuery = `
    SELECT r.*, 
           pr.name as reviewer_name, pr.avatar_key as reviewer_avatar,
           o.id as order_id, o.created_at as order_date
    FROM reviews r
    LEFT JOIN users ur ON r.reviewer_id = ur.id
    LEFT JOIN profiles pr ON ur.id = pr.user_id
    LEFT JOIN orders o ON r.order_id = o.id
    WHERE r.reviewee_id = $1
    ORDER BY r.created_at DESC
    LIMIT $2 OFFSET $3
  `;
  
  const [countResult, dataResult] = await Promise.all([
    pool.query(countQuery, [userId]),
    pool.query(dataQuery, [userId, limit, offset])
  ]);
  
  const total = parseInt(countResult.rows[0].total);
  const totalPages = Math.ceil(total / limit);
  
  return {
    reviews: dataResult.rows,
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

const getReviewById = async (userId, reviewId) => {
  const query = `
    SELECT r.*, 
           pr.name as reviewee_name, pr.avatar_key as reviewee_avatar,
           prev.name as reviewer_name, prev.avatar_key as reviewer_avatar,
           o.id as order_id, o.created_at as order_date
    FROM reviews r
    LEFT JOIN users ur ON r.reviewee_id = ur.id
    LEFT JOIN profiles pr ON ur.id = pr.user_id
    LEFT JOIN users urev ON r.reviewer_id = urev.id
    LEFT JOIN profiles prev ON urev.id = prev.user_id
    LEFT JOIN orders o ON r.order_id = o.id
    WHERE r.id = $1 AND (r.reviewer_id = $2 OR r.reviewee_id = $2)
  `;
  
  const result = await pool.query(query, [reviewId, userId]);
  return result.rows[0] || null;
};

const updateReview = async (userId, reviewId, updateData) => {
  const { rating, title, body } = updateData;
  
  const updateFields = [];
  const queryParams = [];
  let paramIndex = 1;
  
  if (rating !== undefined) {
    updateFields.push(`rating = $${paramIndex++}`);
    queryParams.push(rating);
  }
  
  if (title !== undefined) {
    updateFields.push(`title = $${paramIndex++}`);
    queryParams.push(title);
  }
  
  if (body !== undefined) {
    updateFields.push(`body = $${paramIndex++}`);
    queryParams.push(body);
  }
  
  if (updateFields.length === 0) {
    throw new Error('No fields to update');
  }
  
  updateFields.push('updated_at = NOW()');
  queryParams.push(reviewId, userId);
  
  await pool.query('BEGIN');
  
  try {
    const query = `
      UPDATE reviews 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex++} AND reviewer_id = $${paramIndex++}
      RETURNING *
    `;
    
    const result = await pool.query(query, queryParams);
    
    if (result.rows.length === 0) {
      throw new Error('Review not found or not authorized');
    }
    
    // Update reviewee's average rating if rating changed
    if (rating !== undefined) {
      await updateUserRating(result.rows[0].reviewee_id);
    }
    
    await pool.query('COMMIT');
    
    return result.rows[0];
  } catch (error) {
    await pool.query('ROLLBACK');
    throw error;
  }
};

const updateUserRating = async (userId) => {
  const ratingQuery = `
    SELECT AVG(rating) as avg_rating, COUNT(*) as rating_count
    FROM reviews
    WHERE reviewee_id = $1
  `;
  
  const result = await pool.query(ratingQuery, [userId]);
  const { avg_rating, rating_count } = result.rows[0];
  
  // Update profile rating
  const profileQuery = `
    INSERT INTO profiles (user_id, rating_avg, rating_count)
    VALUES ($1, $2, $3)
    ON CONFLICT (user_id)
    DO UPDATE SET 
      rating_avg = EXCLUDED.rating_avg,
      rating_count = EXCLUDED.rating_count,
      updated_at = NOW()
  `;
  
  await pool.query(profileQuery, [userId, avg_rating, rating_count]);
  
  // Update seller rating if user is a seller
  const sellerQuery = `
    UPDATE sellers 
    SET seller_rating = $1, updated_at = NOW()
    WHERE user_id = $1
  `;
  
  await pool.query(sellerQuery, [userId]);
};

const getUserRatingStats = async (userId) => {
  const query = `
    SELECT 
      AVG(rating) as average_rating,
      COUNT(*) as total_reviews,
      COUNT(CASE WHEN rating = 5 THEN 1 END) as five_star,
      COUNT(CASE WHEN rating = 4 THEN 1 END) as four_star,
      COUNT(CASE WHEN rating = 3 THEN 1 END) as three_star,
      COUNT(CASE WHEN rating = 2 THEN 1 END) as two_star,
      COUNT(CASE WHEN rating = 1 THEN 1 END) as one_star
    FROM reviews
    WHERE reviewee_id = $1
  `;
  
  const result = await pool.query(query, [userId]);
  return result.rows[0];
};

module.exports = {
  createReview,
  getReviewsByUser,
  getReviewsForUser,
  getReviewById,
  updateReview,
  updateUserRating,
  getUserRatingStats
};
