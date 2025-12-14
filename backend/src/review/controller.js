const pool = require('../database/connection');
const { 
  createReview: createReviewModel,
  getReviewsByUser,
  getReviewsForUser,
  getReviewById,
  updateReview
} = require('./model');

const createReview = async (req, res) => {
  try {
    const reviewerId = req.user.id;
    const { reviewee_id, order_id, rating, title, body } = req.body;
    
    // Validate rating
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }
    
    // Verify order exists and user can review
    const orderQuery = `
      SELECT o.id, o.buyer_id, o.seller_id, o.status
      FROM orders o
      WHERE o.id = $1 AND (o.buyer_id = $2 OR o.seller_id = $2)
    `;
    
    const orderResult = await pool.query(orderQuery, [order_id, reviewerId]);
    
    if (orderResult.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    const order = orderResult.rows[0];
    
    // Verify order is completed
    if (order.status !== 'completed') {
      return res.status(400).json({ error: 'Can only review completed orders' });
    }
    
    // Verify reviewer is not reviewing themselves
    if (reviewee_id === reviewerId) {
      return res.status(400).json({ error: 'Cannot review yourself' });
    }
    
    // Verify reviewee is the other party in the order
    const validReviewee = order.buyer_id === reviewerId ? order.seller_id : order.buyer_id;
    if (reviewee_id !== validReviewee) {
      return res.status(400).json({ error: 'Can only review the other party in the order' });
    }
    
    // Check if review already exists
    const existingReviewQuery = `
      SELECT 1 FROM reviews 
      WHERE reviewer_id = $1 AND reviewee_id = $2 AND order_id = $3
    `;
    
    const existingResult = await pool.query(existingReviewQuery, [reviewerId, reviewee_id, order_id]);
    
    if (existingResult.rows.length > 0) {
      return res.status(400).json({ error: 'Review already exists for this order' });
    }
    
    const review = await createReviewModel(reviewerId, {
      reviewee_id,
      order_id,
      rating,
      title,
      body
    });
    
    res.status(201).json(review);
  } catch (error) {
    console.error('Error creating review:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getMyReviews = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20 } = req.query;
    
    const options = {
      page: parseInt(page),
      limit: parseInt(limit)
    };
    
    const result = await getReviewsByUser(userId, options);
    
    res.json(result);
  } catch (error) {
    console.error('Error getting my reviews:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getReviewsForMe = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20 } = req.query;
    
    const options = {
      page: parseInt(page),
      limit: parseInt(limit)
    };
    
    const result = await getReviewsForUser(userId, options);
    
    res.json(result);
  } catch (error) {
    console.error('Error getting reviews for me:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getReview = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    
    const review = await getReviewById(userId, id);
    
    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }
    
    res.json(review);
  } catch (error) {
    console.error('Error getting review:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const updateReviewController = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { rating, title, body } = req.body;
    
    // Validate rating if provided
    if (rating && (rating < 1 || rating > 5)) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }
    
    const review = await updateReview(userId, id, { rating, title, body });
    
    res.json(review);
  } catch (error) {
    console.error('Error updating review:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const deleteReview = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    
    // Verify user owns this review
    const reviewQuery = `
      SELECT id FROM reviews 
      WHERE id = $1 AND reviewer_id = $2
    `;
    
    const reviewResult = await pool.query(reviewQuery, [id, userId]);
    
    if (reviewResult.rows.length === 0) {
      return res.status(404).json({ error: 'Review not found or not authorized' });
    }
    
    await pool.query('DELETE FROM reviews WHERE id = $1', [id]);
    
    res.json({ message: 'Review deleted successfully' });
  } catch (error) {
    console.error('Error deleting review:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  createReview,
  getMyReviews,
  getReviewsForMe,
  getReview,
  updateReview: updateReviewController,
  deleteReview
};
