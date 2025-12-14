const pool = require('../database/connection');

const createListing = async (listingData) => {
  const { seller_id, title, description, price, currency, quantity, condition, category, location, tags, metadata } = listingData;
  
  const query = `
    INSERT INTO listings (seller_id, title, description, price, currency, quantity, condition, category, location, tags, metadata)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    RETURNING *
  `;
  
  const result = await pool.query(query, [
    seller_id, title, description, price, currency || 'USD', quantity || 1, 
    condition, category, location, tags, metadata
  ]);
  
  return result.rows[0];
};

const getListings = async (filters = {}, options = {}) => {
  const { category, condition, seller_id } = filters;
  const { page = 1, limit = 20, sort = 'created_at', order = 'desc' } = options;
  
  const whereConditions = ['l.is_published = true', 'l.deleted_at IS NULL'];
  const queryParams = [];
  let paramIndex = 1;
  
  if (category) {
    whereConditions.push(`l.category = $${paramIndex++}`);
    queryParams.push(category);
  }
  
  if (condition) {
    whereConditions.push(`l.condition = $${paramIndex++}`);
    queryParams.push(condition);
  }
  
  if (seller_id) {
    whereConditions.push(`l.seller_id = $${paramIndex++}`);
    queryParams.push(seller_id);
  }
  
  const offset = (page - 1) * limit;
  
  const countQuery = `
    SELECT COUNT(*) as total
    FROM listings l
    WHERE ${whereConditions.join(' AND ')}
  `;
  
  const dataQuery = `
    SELECT l.*, p.name as seller_name, p.avatar_key as seller_avatar,
           s.store_name, li.url as primary_image_url
    FROM listings l
    LEFT JOIN sellers s ON l.seller_id = s.id
    LEFT JOIN users u ON s.user_id = u.id
    LEFT JOIN profiles p ON u.id = p.user_id
    LEFT JOIN listing_images li ON l.id = li.listing_id AND li.is_primary = true
    WHERE ${whereConditions.join(' AND ')}
    ORDER BY l.${sort} ${order.toUpperCase()}
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
    listings: dataResult.rows,
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

const getListingById = async (id) => {
  const query = `
    SELECT l.*, p.name as seller_name, p.avatar_key as seller_avatar, p.rating_avg as seller_rating,
           s.store_name, s.bio as seller_bio,
           ARRAY_AGG(
           JSON_BUILD_OBJECT(
             'id', li.id,
             'url', li.url,
             'width', li.width,
             'height', li.height,
             'is_primary', li.is_primary,
             'blurhash', li.blurhash
           ) ORDER BY li.is_primary DESC, li.created_at ASC
           ) FILTER (WHERE li.id IS NOT NULL) as images
    FROM listings l
    LEFT JOIN sellers s ON l.seller_id = s.id
    LEFT JOIN users u ON s.user_id = u.id
    LEFT JOIN profiles p ON u.id = p.user_id
    LEFT JOIN listing_images li ON l.id = li.listing_id
    WHERE l.id = $1 AND l.deleted_at IS NULL
    GROUP BY l.id, p.name, p.avatar_key, p.rating_avg, s.store_name, s.bio
  `;
  
  const result = await pool.query(query, [id]);
  return result.rows[0] || null;
};

const updateListing = async (id, updates) => {
  const allowedFields = ['title', 'description', 'price', 'currency', 'quantity', 'condition', 'category', 'location', 'tags', 'is_published', 'metadata'];
  const updateFields = [];
  const values = [];
  let paramIndex = 1;
  
  for (const [key, value] of Object.entries(updates)) {
    if (allowedFields.includes(key)) {
      updateFields.push(`${key} = $${paramIndex++}`);
      values.push(value);
    }
  }
  
  if (updateFields.length === 0) {
    throw new Error('No valid fields to update');
  }
  
  values.push(id);
  
  const query = `
    UPDATE listings 
    SET ${updateFields.join(', ')}, updated_at = NOW()
    WHERE id = $${paramIndex}
    RETURNING *
  `;
  
  const result = await pool.query(query, values);
  return result.rows[0];
};

const deleteListing = async (id) => {
  const query = 'UPDATE listings SET deleted_at = NOW() WHERE id = $1';
  await pool.query(query, [id]);
};

const searchListings = async (searchQuery, filters = {}, options = {}) => {
  const { category, condition, min_price, max_price, location } = filters;
  const { page = 1, limit = 20 } = options;
  
  const whereConditions = ['l.is_published = true', 'l.deleted_at IS NULL'];
  const queryParams = [];
  let paramIndex = 1;
  
  if (searchQuery) {
    whereConditions.push(`(l.search_vector @@ plainto_tsquery('english', $${paramIndex++}) OR l.title ILIKE $${paramIndex++} OR l.description ILIKE $${paramIndex++})`);
    const searchTerm = `%${searchQuery}%`;
    queryParams.push(searchQuery, searchTerm, searchTerm);
  }
  
  if (category) {
    whereConditions.push(`l.category = $${paramIndex++}`);
    queryParams.push(category);
  }
  
  if (condition) {
    whereConditions.push(`l.condition = $${paramIndex++}`);
    queryParams.push(condition);
  }
  
  if (min_price) {
    whereConditions.push(`l.price >= $${paramIndex++}`);
    queryParams.push(min_price);
  }
  
  if (max_price) {
    whereConditions.push(`l.price <= $${paramIndex++}`);
    queryParams.push(max_price);
  }
  
  if (location) {
    whereConditions.push(`l.location::text ILIKE $${paramIndex++}`);
    queryParams.push(`%${location}%`);
  }
  
  const offset = (page - 1) * limit;
  
  const countQuery = `
    SELECT COUNT(*) as total
    FROM listings l
    WHERE ${whereConditions.join(' AND ')}
  `;
  
  const dataQuery = `
    SELECT l.*, p.name as seller_name, p.avatar_key as seller_avatar,
           s.store_name, li.url as primary_image_url,
           ts_rank(l.search_vector, plainto_tsquery('english', $1)) as search_rank
    FROM listings l
    LEFT JOIN sellers s ON l.seller_id = s.id
    LEFT JOIN users u ON s.user_id = u.id
    LEFT JOIN profiles p ON u.id = p.user_id
    LEFT JOIN listing_images li ON l.id = li.listing_id AND li.is_primary = true
    WHERE ${whereConditions.join(' AND ')}
    ORDER BY search_rank DESC, l.created_at DESC
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
    listings: dataResult.rows,
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

const toggleFavorite = async (userId, listingId) => {
  const checkQuery = `
    SELECT 1 FROM favorites 
    WHERE user_id = $1 AND listing_id = $2
  `;
  
  const checkResult = await pool.query(checkQuery, [userId, listingId]);
  const isFavorited = checkResult.rows.length > 0;
  
  if (isFavorited) {
    await pool.query('DELETE FROM favorites WHERE user_id = $1 AND listing_id = $2', [userId, listingId]);
    await pool.query('UPDATE listings SET favorites_count = favorites_count - 1 WHERE id = $1', [listingId]);
    return { favorited: false };
  } else {
    await pool.query('INSERT INTO favorites (user_id, listing_id) VALUES ($1, $2)', [userId, listingId]);
    await pool.query('UPDATE listings SET favorites_count = favorites_count + 1 WHERE id = $1', [listingId]);
    return { favorited: true };
  }
};

const getFavorites = async (userId, options = {}) => {
  const { page = 1, limit = 20 } = options;
  const offset = (page - 1) * limit;
  
  const countQuery = `
    SELECT COUNT(*) as total
    FROM favorites f
    JOIN listings l ON f.listing_id = l.id
    WHERE f.user_id = $1 AND l.is_published = true AND l.deleted_at IS NULL
  `;
  
  const dataQuery = `
    SELECT l.*, p.name as seller_name, p.avatar_key as seller_avatar,
           s.store_name, li.url as primary_image_url,
           f.created_at as favorited_at
    FROM favorites f
    JOIN listings l ON f.listing_id = l.id
    LEFT JOIN sellers s ON l.seller_id = s.id
    LEFT JOIN users u ON s.user_id = u.id
    LEFT JOIN profiles p ON u.id = p.user_id
    LEFT JOIN listing_images li ON l.id = li.listing_id AND li.is_primary = true
    WHERE f.user_id = $1 AND l.is_published = true AND l.deleted_at IS NULL
    ORDER BY f.created_at DESC
    LIMIT $2 OFFSET $3
  `;
  
  const [countResult, dataResult] = await Promise.all([
    pool.query(countQuery, [userId]),
    pool.query(dataQuery, [userId, limit, offset])
  ]);
  
  const total = parseInt(countResult.rows[0].total);
  const totalPages = Math.ceil(total / limit);
  
  return {
    listings: dataResult.rows,
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

module.exports = {
  createListing,
  getListings,
  getListingById,
  updateListing,
  deleteListing,
  searchListings,
  toggleFavorite,
  getFavorites
};
