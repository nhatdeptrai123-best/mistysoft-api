import pool from '../config/database.js';

// List venues for current user
export async function listVenues(request, reply) {
  try {
    await request.jwtVerify();
    
    const result = await pool.query(
      `SELECT id, name, address, city, country, logo_url, created_at, updated_at
       FROM venues
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [request.user.userId]
    );
    
    return reply.send({ 
      venues: result.rows,
      total: result.rows.length 
    });
    
  } catch (error) {
    console.error('List venues error:', error);
    return reply.code(500).send({ error: 'Failed to fetch venues' });
  }
}

// Get venue by ID
export async function getVenue(request, reply) {
  try {
    await request.jwtVerify();
    const { id } = request.params;
    
    const result = await pool.query(
      `SELECT id, name, address, city, country, logo_url, created_at, updated_at
       FROM venues
       WHERE id = $1 AND user_id = $2`,
      [id, request.user.userId]
    );
    
    if (result.rows.length === 0) {
      return reply.code(404).send({ error: 'Venue not found' });
    }
    
    return reply.send({ venue: result.rows[0] });
    
  } catch (error) {
    console.error('Get venue error:', error);
    return reply.code(500).send({ error: 'Failed to fetch venue' });
  }
}

// Create new venue
export async function createVenue(request, reply) {
  try {
    await request.jwtVerify();
    const { name, address, city, country, logo_url } = request.body;
    
    const result = await pool.query(
      `INSERT INTO venues (user_id, name, address, city, country, logo_url)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, name, address, city, country, logo_url, created_at`,
      [request.user.userId, name, address || null, city || null, country || 'Vietnam', logo_url || null]
    );
    
    return reply.code(201).send({
      message: 'Venue created successfully',
      venue: result.rows[0]
    });
    
  } catch (error) {
    console.error('Create venue error:', error);
    return reply.code(500).send({ error: 'Failed to create venue' });
  }
}

// Update venue
export async function updateVenue(request, reply) {
  try {
    await request.jwtVerify();
    const { id } = request.params;
    const { name, address, city, country, logo_url } = request.body;
    
    // Verify ownership
    const checkResult = await pool.query(
      'SELECT id FROM venues WHERE id = $1 AND user_id = $2',
      [id, request.user.userId]
    );
    
    if (checkResult.rows.length === 0) {
      return reply.code(404).send({ error: 'Venue not found or access denied' });
    }
    
    const result = await pool.query(
      `UPDATE venues 
       SET name = COALESCE($1, name),
           address = COALESCE($2, address),
           city = COALESCE($3, city),
           country = COALESCE($4, country),
           logo_url = COALESCE($5, logo_url)
       WHERE id = $6
       RETURNING id, name, address, city, country, logo_url, created_at, updated_at`,
      [name, address, city, country, logo_url, id]
    );
    
    return reply.send({
      message: 'Venue updated successfully',
      venue: result.rows[0]
    });
    
  } catch (error) {
    console.error('Update venue error:', error);
    return reply.code(500).send({ error: 'Failed to update venue' });
  }
}

// Delete venue
export async function deleteVenue(request, reply) {
  try {
    await request.jwtVerify();
    const { id } = request.params;
    
    const checkResult = await pool.query(
      'SELECT id FROM venues WHERE id = $1 AND user_id = $2',
      [id, request.user.userId]
    );
    
    if (checkResult.rows.length === 0) {
      return reply.code(404).send({ error: 'Venue not found or access denied' });
    }
    
    await pool.query('DELETE FROM venues WHERE id = $1', [id]);
    
    return reply.send({ message: 'Venue deleted successfully' });
    
  } catch (error) {
    console.error('Delete venue error:', error);
    return reply.code(500).send({ error: 'Failed to delete venue' });
  }
}
