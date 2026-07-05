// Validation schemas

export const registerSchema = {
  body: {
    type: 'object',
    properties: {
      email: { type: 'string', format: 'email' },
      password: { type: 'string', minLength: 6 },
      name: { type: 'string', minLength: 2 },
      phone: { type: 'string' }
    },
    required: ['email', 'password', 'name']
  }
};

export const loginSchema = {
  body: {
    type: 'object',
    properties: {
      email: { type: 'string', format: 'email' },
      password: { type: 'string' }
    },
    required: ['email', 'password']
  }
};

export const createVenueSchema = {
  body: {
    type: 'object',
    properties: {
      name: { type: 'string', minLength: 2, maxLength: 255 },
      address: { type: 'string', maxLength: 1000 },
      city: { type: 'string', maxLength: 100 },
      country: { type: 'string', maxLength: 100 },
      logo_url: { type: 'string', format: 'uri', maxLength: 2048 }
    },
    required: ['name']
  }
};

export const updateVenueSchema = {
  body: {
    type: 'object',
    properties: {
      name: { type: 'string', minLength: 2, maxLength: 255 },
      address: { type: 'string', maxLength: 1000 },
      city: { type: 'string', maxLength: 100 },
      country: { type: 'string', maxLength: 100 },
      logo_url: { type: 'string', format: 'uri', maxLength: 2048 }
    }
  }
};

export const createQRSchema = {
  body: {
    type: 'object',
    properties: {
      venue_id: { type: 'string', format: 'uuid', maxLength: 36 },
      name: { type: 'string', minLength: 2, maxLength: 255 },
      description: { type: 'string', maxLength: 1000 },
      redirect_url: { type: 'string', maxLength: 2048 }
    },
    required: ['venue_id', 'name']
  }
};

export const updateQRSchema = {
  body: {
    type: 'object',
    properties: {
      name: { type: 'string', minLength: 2, maxLength: 255 },
      description: { type: 'string', maxLength: 1000 },
      redirect_url: { type: 'string', maxLength: 2048 },
      is_active: { type: 'boolean' }
    }
  }
};

export const logScanSchema = {
  body: {
    type: 'object',
    properties: {
      code: { type: 'string' },
      user_agent: { type: 'string' },
      ip_address: { type: 'string' }
    },
    required: ['code']
  }
};
