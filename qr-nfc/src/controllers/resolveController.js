import pool from '../config/database.js';

// Resolve QR code (public endpoint)
export async function resolveQRCode(request, reply) {
  try {
    const { code } = request.params;
    
    const result = await pool.query(
      `SELECT qc.id, qc.redirect_url, qc.is_active, v.name as venue_name
       FROM qr_codes qc
       JOIN venues v ON qc.venue_id = v.id
       WHERE qc.code = $1`,
      [code]
    );
    
    if (result.rows.length === 0) {
      return reply.code(404).send({ error: 'QR code not found' });
    }
    
    const qrCode = result.rows[0];
    
    if (!qrCode.is_active) {
      return reply.code(410).send({ error: 'QR code is inactive' });
    }
    
    // Increment scan count
    await pool.query(
      'UPDATE qr_codes SET scan_count = scan_count + 1 WHERE id = $1',
      [qrCode.id]
    );
    
    return reply.send({
      redirect_url: qrCode.redirect_url,
      venue_name: qrCode.venue_name,
      configured: !!qrCode.redirect_url
    });
    
  } catch (error) {
    console.error('Resolve QR code error:', error);
    return reply.code(500).send({ error: 'Failed to resolve QR code' });
  }
}

// Log scan event
export async function logScan(request, reply) {
  try {
    const { code, user_agent, ip_address } = request.body;
    
    // Get QR code ID
    const qrResult = await pool.query(
      'SELECT id FROM qr_codes WHERE code = $1',
      [code]
    );
    
    if (qrResult.rows.length === 0) {
      return reply.code(404).send({ error: 'QR code not found' });
    }
    
    const qrCodeId = qrResult.rows[0].id;
    
    // Log scan
    await pool.query(
      `INSERT INTO scans (qr_code_id, user_agent, ip_address, scanned_at)
       VALUES ($1, $2, $3, CURRENT_TIMESTAMP)`,
      [qrCodeId, user_agent || null, ip_address || null]
    );
    
    return reply.send({ message: 'Scan logged successfully' });
    
  } catch (error) {
    console.error('Log scan error:', error);
    return reply.code(500).send({ error: 'Failed to log scan' });
  }
}
