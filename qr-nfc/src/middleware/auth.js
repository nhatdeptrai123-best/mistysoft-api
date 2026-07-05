// JWT Authentication middleware

import pool from '../config/database.js';

export async function authenticate(request, reply) {
  try {
    await request.jwtVerify();
  } catch (err) {
    return reply.code(401).send({ error: 'Unauthorized' });
  }
}

export async function optionalAuth(request, reply) {
  try {
    await request.jwtVerify();
  } catch (err) {
    // Continue without auth
  }
}

export function requireRole(role) {
  return async (request, reply) => {
    try {
      await request.jwtVerify();
      
      const result = await pool.query(
        'SELECT role FROM users WHERE id = $1',
        [request.user.userId]
      );
      
      if (result.rows.length === 0) {
        return reply.code(403).send({ error: 'Forbidden: insufficient permissions' });
      }
      
      const userRole = result.rows[0].role;
      if (userRole !== role) {
        return reply.code(403).send({ error: 'Forbidden: insufficient permissions' });
      }
    } catch (err) {
      if (err.code === '42703') {
        return reply.code(403).send({ error: 'Forbidden: insufficient permissions' });
      }
      return reply.code(401).send({ error: 'Unauthorized' });
    }
  };
}
