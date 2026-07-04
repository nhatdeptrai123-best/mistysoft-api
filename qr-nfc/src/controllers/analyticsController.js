import pool from '../config/database.js';

// Get analytics overview
export async function getOverview(request, reply) {
  try {
    await request.jwtVerify();
    const { venue_id } = request.query;
    
    let venueFilter = '';
    const params = [request.user.userId];
    
    if (venue_id) {
      venueFilter = 'AND v.id = $2';
      params.push(venue_id);
    }
    
    const result = await pool.query(
      `SELECT 
        COALESCE(qr_agg.total_qr_codes, 0) as total_qr_codes,
        COALESCE(qr_agg.total_scans, 0) as total_scans,
        COALESCE(qr_agg.active_qr_codes, 0) as active_qr_codes,
        COALESCE(r_agg.total_reviews, 0) as total_reviews
       FROM venues v
       LEFT JOIN (
         SELECT venue_id, 
           COUNT(*) as total_qr_codes,
           SUM(scan_count) as total_scans,
           COUNT(CASE WHEN is_active THEN 1 END) as active_qr_codes
         FROM qr_codes
         GROUP BY venue_id
       ) qr_agg ON v.id = qr_agg.venue_id
       LEFT JOIN (
         SELECT qc.venue_id, COUNT(r.id) as total_reviews
         FROM reviews r
         JOIN qr_codes qc ON r.qr_code_id = qc.id
         GROUP BY qc.venue_id
       ) r_agg ON v.id = r_agg.venue_id
       WHERE v.user_id = $1 ${venueFilter}`,
      params
    );
    
    return reply.send({ overview: result.rows[0] });
    
  } catch (error) {
    console.error('Get overview error:', error);
    return reply.code(500).send({ error: 'Failed to fetch overview' });
  }
}

// Get scan analytics
export async function getScanAnalytics(request, reply) {
  try {
    await request.jwtVerify();
    const { venue_id, start_date, end_date } = request.query;
    
    let venueFilter = '';
    const params = [request.user.userId];
    let paramIndex = 2;
    
    if (venue_id) {
      venueFilter = 'AND v.id = $' + paramIndex++;
      params.push(venue_id);
    }
    
    if (start_date) {
      venueFilter += ' AND s.scanned_at >= $' + paramIndex++;
      params.push(start_date);
    }
    
    if (end_date) {
      venueFilter += ' AND s.scanned_at <= $' + paramIndex++;
      params.push(end_date);
    }
    
    const result = await pool.query(
      `SELECT 
        DATE(s.scanned_at) as date,
        COUNT(*) as scans,
        COUNT(DISTINCT s.ip_address) as unique_scans
       FROM scans s
       JOIN qr_codes qc ON s.qr_code_id = qc.id
       JOIN venues v ON qc.venue_id = v.id
       WHERE v.user_id = $1 ${venueFilter}
       GROUP BY DATE(s.scanned_at)
       ORDER BY date DESC
       LIMIT 30`,
      params
    );
    
    return reply.send({ scans: result.rows });
    
  } catch (error) {
    console.error('Get scan analytics error:', error);
    return reply.code(500).send({ error: 'Failed to fetch scan analytics' });
  }
}

// Get review analytics
export async function getReviewAnalytics(request, reply) {
  try {
    await request.jwtVerify();
    const { venue_id } = request.query;
    
    let venueFilter = '';
    const params = [request.user.userId];
    
    if (venue_id) {
      venueFilter = 'AND v.id = $2';
      params.push(venue_id);
    }
    
    const result = await pool.query(
      `SELECT 
        r.rating,
        COUNT(*) as count
       FROM reviews r
       JOIN qr_codes qc ON r.qr_code_id = qc.id
       JOIN venues v ON qc.venue_id = v.id
       WHERE v.user_id = $1 ${venueFilter}
       GROUP BY r.rating
       ORDER BY r.rating`,
      params
    );
    
    // Calculate average
    const avgResult = await pool.query(
      `SELECT AVG(r.rating) as average_rating
       FROM reviews r
       JOIN qr_codes qc ON r.qr_code_id = qc.id
       JOIN venues v ON qc.venue_id = v.id
       WHERE v.user_id = $1 ${venueFilter}`,
      params
    );
    
    return reply.send({
      ratings: result.rows,
      average_rating: avgResult.rows[0]?.average_rating || 0
    });
    
  } catch (error) {
    console.error('Get review analytics error:', error);
    return reply.code(500).send({ error: 'Failed to fetch review analytics' });
  }
}
