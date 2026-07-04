import pool from '../config/database.js';
import { hashPassword, comparePassword } from '../utils/helpers.js';

// Register new user
export async function register(request, reply) {
  const { email, password, name, phone } = request.body;
  
  try {
    // Check if user exists
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );
    
    if (existingUser.rows.length > 0) {
      return reply.code(409).send({ error: 'Email already registered' });
    }
    
    // Hash password
    const passwordHash = await hashPassword(password);
    
    // Insert user
    const result = await pool.query(
      'INSERT INTO users (email, password_hash, name, phone) VALUES ($1, $2, $3, $4) RETURNING id, email, name, created_at',
      [email, passwordHash, name, phone || null]
    );
    
    const user = result.rows[0];
    
    // Generate token
    const token = await reply.jwtSign({ 
      userId: user.id, 
      email: user.email 
    });
    
    return reply.send({
      message: 'User registered successfully',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        createdAt: user.created_at
      },
      token
    });
    
  } catch (error) {
    console.error('Register error:', error);
    return reply.code(500).send({ error: 'Registration failed' });
  }
}

// Login user
export async function login(request, reply) {
  const { email, password } = request.body;
  
  try {
    // Find user
    const result = await pool.query(
      'SELECT id, email, password_hash, name FROM users WHERE email = $1',
      [email]
    );
    
    if (result.rows.length === 0) {
      return reply.code(401).send({ error: 'Invalid credentials' });
    }
    
    const user = result.rows[0];
    
    // Verify password
    const isValid = await comparePassword(password, user.password_hash);
    
    if (!isValid) {
      return reply.code(401).send({ error: 'Invalid credentials' });
    }
    
    // Generate token
    const token = await reply.jwtSign({ 
      userId: user.id, 
      email: user.email 
    });
    
    return reply.send({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      },
      token
    });
    
  } catch (error) {
    console.error('Login error:', error);
    return reply.code(500).send({ error: 'Login failed' });
  }
}

// Refresh token
export async function refresh(request, reply) {
  try {
    await request.jwtVerify();
    
    const token = await reply.jwtSign({ 
      userId: request.user.userId, 
      email: request.user.email 
    });
    
    return reply.send({ token });
    
  } catch (error) {
    return reply.code(401).send({ error: 'Invalid token' });
  }
}

// Get current user
export async function me(request, reply) {
  try {
    await request.jwtVerify();
    
    const result = await pool.query(
      'SELECT id, email, name, phone, created_at FROM users WHERE id = $1',
      [request.user.userId]
    );
    
    if (result.rows.length === 0) {
      return reply.code(404).send({ error: 'User not found' });
    }
    
    return reply.send({ user: result.rows[0] });
    
  } catch (error) {
    return reply.code(401).send({ error: 'Unauthorized' });
  }
}
