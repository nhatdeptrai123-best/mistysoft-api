import pool from '../config/database.js';
import { generateQRCode, generateQRImage } from '../utils/helpers.js';

async function getUserRole(request) {
  const result = await pool.query('SELECT role FROM users WHERE id = $1', [request.user.userId]);
  return result.rows[0]?.role || 'admin';
}

// List all QR codes for a venue
export async function listQRCodes(request, reply) {
  try {
    await request.jwtVerify();
    const role = await getUserRole(request);
    const { venue_id } = request.query;
    
    let query = `
      SELECT qc.*, v.name as venue_name 
      FROM qr_codes qc 
      JOIN venues v ON qc.venue_id = v.id 
      WHERE 1=1
    `;
    const params = [];
    
    if (role === 'owner') {
      query += ` AND v.owner_id = $${params.length + 1}`;
      params.push(request.user.userId);
    } else {
      query += ` AND v.user_id = $${params.length + 1}`;
      params.push(request.user.userId);
    }
    
    if (venue_id) {
      query += ` AND qc.venue_id = $${params.length + 1}`;
      params.push(venue_id);
    }
    
    query += ' ORDER BY qc.created_at DESC';
    
    const result = await pool.query(query, params);
    
    return reply.send({ 
      qr_codes: result.rows,
      total: result.rows.length 
    });
    
  } catch (error) {
    console.error('List QR codes error:', error);
    return reply.code(500).send({ error: 'Failed to fetch QR codes' });
  }
}

// Create new QR code
export async function createQRCode(request, reply) {
  try {
    await request.jwtVerify();
    const role = await getUserRole(request);
    
    if (role !== 'admin') {
      return reply.code(403).send({ error: 'Only admins can create QR codes' });
    }
    
    const { venue_id, name, description, mode, redirect_url } = request.body;
    
    // Verify venue belongs to user
    const venueCheck = await pool.query(
      'SELECT id FROM venues WHERE id = $1 AND user_id = $2',
      [venue_id, request.user.userId]
    );
    
    if (venueCheck.rows.length === 0) {
      return reply.code(403).send({ error: 'Venue not found or access denied' });
    }
    
    // Generate unique code
    const code = generateQRCode();
    
    // Generate QR image
    const goUrl = process.env.GO_URL || 'https://go.mistydev.id.vn';
    const qrImage = await generateQRImage(code, goUrl);
    
    // Insert QR code
    const result = await pool.query(
      `INSERT INTO qr_codes (venue_id, code, name, description, mode, redirect_url, qr_image_url) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) 
       RETURNING *`,
      [venue_id, code, name, description || null, mode || 'simple', redirect_url || '', qrImage]
    );
    
    return reply.code(201).send({
      message: 'QR code created successfully',
      qr_code: result.rows[0]
    });
    
  } catch (error) {
    console.error('Create QR code error:', error);
    return reply.code(500).send({ error: 'Failed to create QR code' });
  }
}

// Get QR code by ID
export async function getQRCode(request, reply) {
  try {
    await request.jwtVerify();
    const role = await getUserRole(request);
    const { id } = request.params;
    
    let query, params;
    if (role === 'owner') {
      query = `SELECT qc.*, v.name as venue_name 
               FROM qr_codes qc 
               JOIN venues v ON qc.venue_id = v.id 
               WHERE qc.id = $1 AND v.owner_id = $2`;
      params = [id, request.user.userId];
    } else {
      query = `SELECT qc.*, v.name as venue_name 
               FROM qr_codes qc 
               JOIN venues v ON qc.venue_id = v.id 
               WHERE qc.id = $1 AND v.user_id = $2`;
      params = [id, request.user.userId];
    }
    
    const result = await pool.query(query, params);
    
    if (result.rows.length === 0) {
      return reply.code(404).send({ error: 'QR code not found' });
    }
    
    return reply.send({ qr_code: result.rows[0] });
    
  } catch (error) {
    console.error('Get QR code error:', error);
    return reply.code(500).send({ error: 'Failed to fetch QR code' });
  }
}

// Update QR code
export async function updateQRCode(request, reply) {
  try {
    await request.jwtVerify();
    const role = await getUserRole(request);
    const { id } = request.params;
    const { name, description, mode, redirect_url, is_active } = request.body;
    
    let checkQuery, checkParams;
    if (role === 'owner') {
      checkQuery = `SELECT qc.id 
                    FROM qr_codes qc 
                    JOIN venues v ON qc.venue_id = v.id 
                    WHERE qc.id = $1 AND v.owner_id = $2`;
      checkParams = [id, request.user.userId];
    } else {
      checkQuery = `SELECT qc.id 
                    FROM qr_codes qc 
                    JOIN venues v ON qc.venue_id = v.id 
                    WHERE qc.id = $1 AND v.user_id = $2`;
      checkParams = [id, request.user.userId];
    }
    
    const checkResult = await pool.query(checkQuery, checkParams);
    
    if (checkResult.rows.length === 0) {
      return reply.code(404).send({ error: 'QR code not found or access denied' });
    }
    
    const result = await pool.query(
      `UPDATE qr_codes 
       SET name = COALESCE($1, name),
           description = COALESCE($2, description),
           mode = COALESCE($3, mode),
           redirect_url = COALESCE($4, redirect_url),
           is_active = COALESCE($5, is_active)
       WHERE id = $6
       RETURNING *`,
      [name, description, mode, redirect_url, is_active, id]
    );
    
    return reply.send({
      message: 'QR code updated successfully',
      qr_code: result.rows[0]
    });
    
  } catch (error) {
    console.error('Update QR code error:', error);
    return reply.code(500).send({ error: 'Failed to update QR code' });
  }
}

// Delete QR code
export async function deleteQRCode(request, reply) {
  try {
    await request.jwtVerify();
    const role = await getUserRole(request);
    
    if (role !== 'admin') {
      return reply.code(403).send({ error: 'Only admins can delete QR codes' });
    }
    
    const { id } = request.params;
    
    const checkResult = await pool.query(
      `SELECT qc.id 
       FROM qr_codes qc 
       JOIN venues v ON qc.venue_id = v.id 
       WHERE qc.id = $1 AND v.user_id = $2`,
      [id, request.user.userId]
    );
    
    if (checkResult.rows.length === 0) {
      return reply.code(404).send({ error: 'QR code not found or access denied' });
    }
    
    await pool.query('DELETE FROM qr_codes WHERE id = $1', [id]);
    
    return reply.send({ message: 'QR code deleted successfully' });
    
  } catch (error) {
    console.error('Delete QR code error:', error);
    return reply.code(500).send({ error: 'Failed to delete QR code' });
  }
}
