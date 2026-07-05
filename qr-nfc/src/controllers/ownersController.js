import pool from '../config/database.js';
import { hashPassword } from '../utils/helpers.js';

// Admin: create owner account
export async function createOwner(request, reply) {
  try {
    await request.jwtVerify();
    const { email, password, name, phone, venue_id } = request.body;
    
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );
    
    if (existingUser.rows.length > 0) {
      return reply.code(409).send({ error: 'Email already registered' });
    }
    
    const passwordHash = await hashPassword(password);
    
    const result = await pool.query(
      'INSERT INTO users (email, password_hash, name, phone, role) VALUES ($1, $2, $3, $4, $5) RETURNING id, email, name, phone, role, created_at',
      [email, passwordHash, name, phone || null, 'owner']
    );
    
    const owner = result.rows[0];
    
    if (venue_id) {
      const venue = await pool.query(
        'SELECT id FROM venues WHERE id = $1',
        [venue_id]
      );
      
      if (venue.rows.length === 0) {
        return reply.code(404).send({ error: 'Venue not found' });
      }
      
      await pool.query(
        'UPDATE venues SET owner_id = $1 WHERE id = $2',
        [owner.id, venue_id]
      );
    }
    
    return reply.code(201).send({
      message: 'Owner created successfully',
      user: owner
    });
    
  } catch (error) {
    console.error('Create owner error:', error);
    return reply.code(500).send({ error: 'Failed to create owner' });
  }
}

// Admin: list owners
export async function listOwners(request, reply) {
  try {
    await request.jwtVerify();
    
    const result = await pool.query(
      `SELECT u.id, u.email, u.name, u.phone, u.role, u.created_at,
              ARRAY_AGG(v.id) FILTER (WHERE v.id IS NOT NULL) as venue_ids,
              ARRAY_AGG(v.name) FILTER (WHERE v.name IS NOT NULL) as venue_names
       FROM users u
       LEFT JOIN venues v ON u.id = v.owner_id
       WHERE u.role = 'owner'
       GROUP BY u.id, u.email, u.name, u.phone, u.role, u.created_at
       ORDER BY u.created_at DESC`
    );
    
    return reply.send({ owners: result.rows, total: result.rows.length });
    
  } catch (error) {
    console.error('List owners error:', error);
    return reply.code(500).send({ error: 'Failed to fetch owners' });
  }
}

// Owner: get own profile with venues
export async function getOwnerProfile(request, reply) {
  try {
    await request.jwtVerify();
    
    const userResult = await pool.query(
      'SELECT id, email, name, phone, role, created_at FROM users WHERE id = $1 AND role = $2',
      [request.user.userId, 'owner']
    );
    
    if (userResult.rows.length === 0) {
      return reply.code(404).send({ error: 'Owner not found' });
    }
    
    const venuesResult = await pool.query(
      'SELECT id, name, address, city, country, logo_url FROM venues WHERE owner_id = $1',
      [request.user.userId]
    );
    
    return reply.send({
      owner: userResult.rows[0],
      venues: venuesResult.rows
    });
    
  } catch (error) {
    console.error('Get owner profile error:', error);
    return reply.code(500).send({ error: 'Failed to fetch owner profile' });
  }
}
