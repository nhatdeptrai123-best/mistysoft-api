-- Seed data for testing

-- Insert test user (password: password123)
INSERT INTO users (email, password_hash, name, phone) VALUES
('test@example.com', '$2a$10$rOZjQ1Z9Z9Z9Z9Z9Z9Z9Ze', 'Test User', '0123456789')
ON CONFLICT (email) DO NOTHING;

-- Insert test venue
INSERT INTO venues (user_id, name, address, city, country) VALUES
(
    (SELECT id FROM users WHERE email = 'test@example.com'),
    'Test Cafe',
    '123 Test Street',
    'Ho Chi Minh City',
    'Vietnam'
)
ON CONFLICT DO NOTHING;

-- Insert test QR code
INSERT INTO qr_codes (venue_id, code, name, description, redirect_url, is_active) VALUES
(
    (SELECT id FROM venues WHERE name = 'Test Cafe'),
    'TEST001',
    'Table QR Code',
    'QR code for table ordering',
    'https://example.com/menu',
    true
)
ON CONFLICT (code) DO NOTHING;
