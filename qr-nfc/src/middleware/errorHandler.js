// Global error handler

export function errorHandler(error, request, reply) {
  console.error(error);
  
  if (error.validation) {
    return reply.code(400).send({
      error: 'Validation Error',
      details: error.validation
    });
  }
  
  if (error.code === '23505') { // Unique violation
    return reply.code(409).send({
      error: 'Duplicate entry',
      message: 'This record already exists'
    });
  }
  
  if (error.code === '23503') { // Foreign key violation
    return reply.code(400).send({
      error: 'Invalid reference',
      message: 'Referenced record does not exist'
    });
  }
  
  return reply.code(500).send({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
}
