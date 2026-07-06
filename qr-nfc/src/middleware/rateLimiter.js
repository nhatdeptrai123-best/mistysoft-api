// Simple in-memory rate limiter

const rateLimitMap = new Map();

function getClientIp(request) {
  const forwarded = request.headers['x-forwarded-for'];
  if (forwarded) {
    return Array.isArray(forwarded) ? forwarded[0] : forwarded.split(',')[0].trim();
  }
  return request.ip || request.connection.remoteAddress || 'unknown';
}

export function rateLimit(options = {}) {
  const maxRequests = options.max || 100;
  const windowMs = options.window || 60000; // 1 minute
  
  return async function (request, reply) {
    const ip = getClientIp(request);
    const now = Date.now();
    
    if (!rateLimitMap.has(ip)) {
      rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs });
      return reply;
    }
    
    const record = rateLimitMap.get(ip);
    
    if (now > record.resetTime) {
      record.count = 1;
      record.resetTime = now + windowMs;
      return reply;
    }
    
    record.count++;
    
    if (record.count > maxRequests) {
      return reply.code(429).send({
        error: 'Too many requests',
        message: `Rate limit exceeded. Please try again later.`
      });
    }
    
    return reply;
  };
}

export const authRateLimiter = rateLimit({ max: 20, window: 60000 });
