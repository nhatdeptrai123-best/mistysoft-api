// JWT Authentication middleware

export async function authenticate(request, reply) {
  try {
    await request.jwtVerify();
  } catch (err) {
    reply.send({ error: 'Unauthorized' });
    return reply.code(401);
  }
}

export async function optionalAuth(request, reply) {
  try {
    await request.jwtVerify();
  } catch (err) {
    // Continue without auth
  }
}
