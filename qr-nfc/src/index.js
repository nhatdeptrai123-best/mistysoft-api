import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import env from '@fastify/env';
import path from 'path';
import { fileURLToPath } from 'url';
import { errorHandler } from './middleware/errorHandler.js';
import { authenticate, requireRole } from './middleware/auth.js';
import { rateLimit, authRateLimiter } from './middleware/rateLimiter.js';
import {
  registerSchema,
  loginSchema,
  createVenueSchema,
  updateVenueSchema,
  createQRSchema,
  updateQRSchema,
  logScanSchema,
  createReviewSchema,
  createOwnerSchema
} from './middleware/validation.js';
import * as authController from './controllers/authController.js';
import * as venuesController from './controllers/venuesController.js';
import * as qrController from './controllers/qrController.js';
import * as resolveController from './controllers/resolveController.js';
import * as analyticsController from './controllers/analyticsController.js';
import * as ownersController from './controllers/ownersController.js';
import * as reviewsController from './controllers/reviewsController.js';
import { migrate } from './migrate.js';
import pool from './config/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const fastify = Fastify({
  logger: true
});

// Environment configuration
const schema = {
  type: 'object',
  required: ['PORT', 'DATABASE_URL', 'JWT_SECRET'],
  properties: {
    PORT: {
      type: 'string',
      default: '3000'
    },
    DATABASE_URL: {
      type: 'string'
    },
    JWT_SECRET: {
      type: 'string'
    },
    NODE_ENV: {
      type: 'string',
      default: 'development'
    }
  }
};

await fastify.register(env, {
  schema,
  dotenv: true,
  confKey: 'config'
});

// Register plugins
await fastify.register(cors, {
  origin: true
});

await fastify.register(jwt, {
  secret: fastify.config.JWT_SECRET
});

// Global error handler
fastify.setErrorHandler(errorHandler);

// Global rate limiting (100 requests per minute per IP)
fastify.addHook('onRequest', rateLimit({ max: 100, window: 60000 }));

// Health check
fastify.get('/health', async (request, reply) => {
  return { status: 'ok', timestamp: new Date().toISOString() };
});

// API routes
fastify.register(async function (fastify) {
  // Auth routes
  fastify.register(async function (fastify) {
    fastify.post('/register', { schema: registerSchema, onRequest: [authRateLimiter] }, authController.register);
    fastify.post('/login', { schema: loginSchema, onRequest: [authRateLimiter] }, authController.login);
    fastify.post('/refresh', { onRequest: [authenticate] }, authController.refresh);
    fastify.get('/me', { onRequest: [authenticate] }, authController.me);
  }, { prefix: '/api/qr-nfc/auth' });

  // Venue routes
  fastify.register(async function (fastify) {
    fastify.get('/', { onRequest: [authenticate] }, venuesController.listVenues);
    fastify.get('/:id', { onRequest: [authenticate] }, venuesController.getVenue);
    fastify.post('/', { onRequest: [authenticate], schema: createVenueSchema }, venuesController.createVenue);
    fastify.put('/:id', { onRequest: [authenticate], schema: updateVenueSchema }, venuesController.updateVenue);
    fastify.delete('/:id', { onRequest: [authenticate] }, venuesController.deleteVenue);
  }, { prefix: '/api/qr-nfc/venues' });

  // QR Code routes
  fastify.register(async function (fastify) {
    fastify.get('/', { onRequest: [authenticate] }, qrController.listQRCodes);
    fastify.post('/', { onRequest: [authenticate], schema: createQRSchema }, qrController.createQRCode);
    fastify.get('/:id', { onRequest: [authenticate] }, qrController.getQRCode);
    fastify.put('/:id', { onRequest: [authenticate], schema: updateQRSchema }, qrController.updateQRCode);
    fastify.delete('/:id', { onRequest: [authenticate] }, qrController.deleteQRCode);
  }, { prefix: '/api/qr-nfc/qr' });

  // Redirect/Resolve routes (public)
  fastify.register(async function (fastify) {
    fastify.get('/:code', resolveController.resolveQRCode);
    fastify.post('/scan/log', { schema: logScanSchema }, resolveController.logScan);
  }, { prefix: '/api/qr-nfc/resolve' });

  // Analytics routes
  fastify.register(async function (fastify) {
    fastify.get('/overview', { onRequest: [authenticate] }, analyticsController.getOverview);
    fastify.get('/scans', { onRequest: [authenticate] }, analyticsController.getScanAnalytics);
    fastify.get('/reviews', { onRequest: [authenticate] }, analyticsController.getReviewAnalytics);
  }, { prefix: '/api/qr-nfc/analytics' });

  // Owner routes
  fastify.register(async function (fastify) {
    fastify.post('/owners', { onRequest: [authenticate], schema: createOwnerSchema }, ownersController.createOwner);
    fastify.get('/owners', { onRequest: [authenticate] }, ownersController.listOwners);
    fastify.get('/owners/me', { onRequest: [authenticate] }, ownersController.getOwnerProfile);
  }, { prefix: '/api/qr-nfc' });

  // Review routes
  fastify.register(async function (fastify) {
    fastify.post('/reviews/submit', { schema: createReviewSchema }, reviewsController.submitReview);
    fastify.get('/reviews', { onRequest: [authenticate] }, reviewsController.listReviews);
    fastify.get('/reviews/stats', { onRequest: [authenticate] }, reviewsController.getReviewStats);
    fastify.put('/reviews/:id', { onRequest: [authenticate] }, reviewsController.updateReview);
    fastify.get('/owners/reviews', { onRequest: [authenticate] }, reviewsController.listOwnerReviews);
  }, { prefix: '/api/qr-nfc' });
});

// Start server
const start = async () => {
  try {
    await migrate();
    
    const port = parseInt(fastify.config.PORT);
    await fastify.listen({ port, host: '0.0.0.0' });
    
    pool.query('SELECT 1').catch(err => 
      console.error('Warm-up query failed:', err)
    );
    
    console.log(`Server running on port ${port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
