import pool from '../config/database.js';

// Debug endpoint to check DB state for current user
export async function debugDB(request, reply) {
  try {
    await request.jwtVerify();
    const userId = request.user.userId;

    const [usersResult, venuesResult, qrResult, scansResult] = await Promise.all([
      pool.query('SELECT id, email, name, created_at FROM users WHERE id = $1', [userId]),
      pool.query('SELECT * FROM venues WHERE user_id = $1 ORDER BY created_at DESC LIMIT 100', [userId]),
      pool.query('SELECT COUNT(*) as total_qr FROM qr_codes WHERE venue_id IN (SELECT id FROM venues WHERE user_id = $1)', [userId]),
      pool.query('SELECT COUNT(*) as total_scans FROM scans WHERE qr_code_id IN (SELECT id FROM qr_codes WHERE venue_id IN (SELECT id FROM venues WHERE user_id = $1))', [userId]),
    ]);

    return reply.send({
      user: usersResult.rows[0] || null,
      venues: venuesResult.rows,
      qr_count: parseInt(qrResult.rows[0]?.total_qr || 0),
      scan_count: parseInt(scansResult.rows[0]?.total_scans || 0),
      message: 'DB check completed'
    });
  } catch (error) {
    console.error('Debug DB error:', error);
    return reply.code(500).send({ error: 'Debug check failed', message: error.message });
  }
}
