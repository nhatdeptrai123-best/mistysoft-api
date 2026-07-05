import pool from '../config/database.js';

// Public: submit review/feedback
export async function submitReview(request, reply) {
  try {
    const { code, rating, comment, customer_name, customer_email } = request.body;
    
    const qrResult = await pool.query(
      'SELECT id, venue_id, is_active FROM qr_codes WHERE code = $1',
      [code]
    );
    
    if (qrResult.rows.length === 0) {
      return reply.code(404).send({ error: 'QR code not found' });
    }
    
    const qr = qrResult.rows[0];
    
    if (!qr.is_active) {
      return reply.code(410).send({ error: 'QR code is inactive' });
    }
    
    const reviewResult = await pool.query(
      `INSERT INTO reviews (qr_code_id, rating, comment, customer_name, customer_email)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, rating, comment, customer_name, customer_email, is_approved, created_at`,
      [qr.id, rating, comment || null, customer_name || null, customer_email || null]
    );
    
    return reply.code(201).send({
      message: 'Review submitted successfully',
      review: reviewResult.rows[0]
    });
    
  } catch (error) {
    console.error('Submit review error:', error);
    return reply.code(500).send({ error: 'Failed to submit review' });
  }
}

// Admin: list all reviews
export async function listReviews(request, reply) {
  try {
    await request.jwtVerify();
    const { venue_id, qr_code_id, status, page = 1, limit = 20 } = request.query;
    
    let query = `
      SELECT r.*, qc.code as qr_code, qc.name as qr_name, v.name as venue_name
      FROM reviews r
      JOIN qr_codes qc ON r.qr_code_id = qc.id
      JOIN venues v ON qc.venue_id = v.id
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;
    
    if (venue_id) {
      query += ` AND v.id = $${paramIndex++}`;
      params.push(venue_id);
    }
    
    if (qr_code_id) {
      query += ` AND qc.id = $${paramIndex++}`;
      params.push(qr_code_id);
    }
    
    if (status === 'approved') {
      query += ` AND r.is_approved = true`;
    } else if (status === 'pending') {
      query += ` AND r.is_approved = false`;
    }
    
    query += ` ORDER BY r.created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex}`;
    params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));
    
    const result = await pool.query(query, params);
    
    return reply.send({
      reviews: result.rows,
      total: result.rows.length
    });
    
  } catch (error) {
    console.error('List reviews error:', error);
    return reply.code(500).send({ error: 'Failed to fetch reviews' });
  }
}

// Owner: list own reviews
export async function listOwnerReviews(request, reply) {
  try {
    await request.jwtVerify();
    const { venue_id, qr_code_id, status } = request.query;
    
    // Get owner's venues
    const venuesResult = await pool.query(
      'SELECT id FROM venues WHERE owner_id = $1',
      [request.user.userId]
    );
    
    const venueIds = venuesResult.rows.map(v => v.id);
    
    if (venueIds.length === 0) {
      return reply.send({ reviews: [], total: 0 });
    }
    
    let query = `
      SELECT r.*, qc.code as qr_code, qc.name as qr_name, v.name as venue_name
      FROM reviews r
      JOIN qr_codes qc ON r.qr_code_id = qc.id
      JOIN venues v ON qc.venue_id = v.id
      WHERE v.id = ANY($1::uuid[])
    `;
    const params = [venueIds];
    
    if (qr_code_id) {
      query += ' AND qc.id = $2';
      params.push(qr_code_id);
    }
    
    if (status === 'approved') {
      query += ` AND r.is_approved = true`;
    } else if (status === 'pending') {
      query += ` AND r.is_approved = false`;
    }
    
    query += ' ORDER BY r.created_at DESC LIMIT 100';
    
    const result = await pool.query(query, params);
    
    return reply.send({
      reviews: result.rows,
      total: result.rows.length
    });
    
  } catch (error) {
    console.error('List owner reviews error:', error);
    return reply.code(500).send({ error: 'Failed to fetch reviews' });
  }
}

// Admin: update review approval status
export async function updateReview(request, reply) {
  try {
    await request.jwtVerify();
    const { id } = request.params;
    const { is_approved } = request.body;
    
    const result = await pool.query(
      `UPDATE reviews 
       SET is_approved = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING *`,
      [is_approved, id]
    );
    
    if (result.rows.length === 0) {
      return reply.code(404).send({ error: 'Review not found' });
    }
    
    return reply.send({
      message: 'Review updated successfully',
      review: result.rows[0]
    });
    
  } catch (error) {
    console.error('Update review error:', error);
    return reply.code(500).send({ error: 'Failed to update review' });
  }
}

// Admin/Owner: get review stats
export async function getReviewStats(request, reply) {
  try {
    await request.jwtVerify();
    const { venue_id } = request.query;
    
    let whereClause = '1=1';
    const params = [];
    
    // Admin can see all, owner can only see their venues
    const userResult = await pool.query(
      'SELECT role FROM users WHERE id = $1',
      [request.user.userId]
    );
    
    const userRole = userResult.rows[0]?.role;
    
    if (userRole === 'owner') {
      const venuesResult = await pool.query(
        'SELECT id FROM venues WHERE owner_id = $1',
        [request.user.userId]
      );
      const venueIds = venuesResult.rows.map(v => v.id);
      
      if (venueIds.length === 0) {
        return reply.send({
          total_reviews: 0,
          average_rating: 0,
          positive_reviews: 0,
          negative_reviews: 0,
          pending_reviews: 0
        });
      }
      
      whereClause = `v.id = ANY($${params.length + 1}::uuid[])`;
      params.push(venueIds);
    }
    
    const statsResult = await pool.query(
      `
      SELECT 
        COUNT(*) as total_reviews,
        ROUND(AVG(rating), 2) as average_rating,
        COUNT(CASE WHEN rating >= 4 THEN 1 END) as positive_reviews,
        COUNT(CASE WHEN rating < 4 THEN 1 END) as negative_reviews,
        COUNT(CASE WHEN is_approved = false THEN 1 END) as pending_reviews
      FROM reviews r
      JOIN qr_codes qc ON r.qr_code_id = qc.id
      JOIN venues v ON qc.venue_id = v.id
      WHERE ${whereClause}
      `,
      params
    );
    
    return reply.send(statsResult.rows[0]);
    
  } catch (error) {
    console.error('Get review stats error:', error);
    return reply.code(500).send({ error: 'Failed to fetch review stats' });
  }
}
