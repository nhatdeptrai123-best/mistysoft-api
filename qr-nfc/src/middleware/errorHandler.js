// Global error handler

export function errorHandler(error, request, reply) {
  console.error(error);
  
  if (error.validation) {
    const details = Array.isArray(error.validation) 
      ? error.validation.map(d => `${d.instancePath || d.dataPath || ''} ${d.message || ''}`).join(', ')
      : error.validation;
    return reply.code(400).send({
      error: 'Validation Error',
      message: details,
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
  
  if (error.code === '22P02') { // Invalid text representation (e.g. bad UUID)
    return reply.code(400).send({
      error: 'Invalid data format',
      message: 'One or more field values have an invalid format'
    });
  }
  
  if (error.code === '22001') { // String data right truncation
    return reply.code(400).send({
      error: 'Value too long',
      message: 'One or more fields exceed the maximum allowed length'
    });
  }
  
  if (error.code === '42703') { // Undefined column
    return reply.code(500).send({
      error: 'Internal Server Error',
      message: 'A required database column is missing. Please contact support.'
    });
  }
  
  return reply.code(500).send({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong',
    stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
  });
}
