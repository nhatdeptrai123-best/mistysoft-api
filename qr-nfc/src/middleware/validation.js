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
      name: { type: 'string', minLength: 2 },
      address: { type: 'string' },
      city: { type: 'string' },
      country: { type: 'string' },
      logo_url: { type: 'string', format: 'uri' }
    },
    required: ['name']
  }
};

export const updateVenueSchema = {
  body: {
    type: 'object',
    properties: {
      name: { type: 'string', minLength: 2 },
      address: { type: 'string' },
      city: { type: 'string' },
      country: { type: 'string' },
      logo_url: { type: 'string', format: 'uri' }
    }
  }
};

export const createQRSchema = {
  body: {
    type: 'object',
    properties: {
      venue_id: { type: 'string' },
      name: { type: 'string', minLength: 2 },
      description: { type: 'string' },
      redirect_url: { type: 'string', format: 'uri' }
    },
    required: ['venue_id', 'name', 'redirect_url']
  }
};

export const updateQRSchema = {
  body: {
    type: 'object',
    properties: {
      name: { type: 'string', minLength: 2 },
      description: { type: 'string' },
      redirect_url: { type: 'string', format: 'uri' },
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
