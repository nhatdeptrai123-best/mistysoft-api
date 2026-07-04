# MistySoft QR-NFC API

Backend API for QR-NFC SaaS system.

## Tech Stack

- Node.js + Fastify
- PostgreSQL (Supabase)
- JWT Authentication
- CORS enabled
- Rate limiting

## Setup

1. Install dependencies:
```bash
npm install
```

2. Copy environment variables:
```bash
cp .env.example .env
```

3. Edit `.env` with your configuration:
```
PORT=3000
DATABASE_URL=postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres
JWT_SECRET=your-secret-key-here
GO_URL=https://go.mistydev.id.vn
NODE_ENV=development
```

4. Run development server:
```bash
npm run dev
```

5. Run production:
```bash
npm start
```

## Database Setup

1. Go to Supabase Dashboard → SQL Editor
2. Paste contents of `database/schema.sql`
3. Run to create all tables
4. (Optional) Run `database/seed.sql` for test data

## API Endpoints

### Health Check
- `GET /health` - Server health status

### Authentication
- `POST /api/qr-nfc/auth/register` - Register new user
- `POST /api/qr-nfc/auth/login` - Login user
- `POST /api/qr-nfc/auth/refresh` - Refresh token
- `GET /api/qr-nfc/auth/me` - Get current user

### Venues
- `GET /api/qr-nfc/venues` - List all venues
- `GET /api/qr-nfc/venues/:id` - Get venue details
- `POST /api/qr-nfc/venues` - Create new venue
- `PUT /api/qr-nfc/venues/:id` - Update venue
- `DELETE /api/qr-nfc/venues/:id` - Delete venue

### QR Codes
- `GET /api/qr-nfc/qr` - List all QR codes
- `POST /api/qr-nfc/qr` - Create new QR code
- `GET /api/qr-nfc/qr/:id` - Get QR code details
- `PUT /api/qr-nfc/qr/:id` - Update QR code
- `DELETE /api/qr-nfc/qr/:id` - Delete QR code

### Redirect/Resolve
- `GET /api/qr-nfc/resolve/:code` - Resolve QR code (public)
- `POST /api/qr-nfc/resolve/scan/log` - Log scan event (public)

### Analytics
- `GET /api/qr-nfc/analytics/overview` - Analytics overview
- `GET /api/qr-nfc/analytics/scans` - Scan analytics
- `GET /api/qr-nfc/analytics/reviews` - Review analytics

## Deployment

### Render + Supabase

1. **Supabase Setup:**
   - Create new project at supabase.com
   - Go to SQL Editor and run `database/schema.sql`
   - Copy the connection string from Settings → Database

2. **Render Setup:**
   - Create new Web Service
   - Connect your GitHub repo
   - Set build command: `npm install`
   - Set start command: `npm start`
   - Add environment variables:
     - `DATABASE_URL` = Supabase connection string
     - `JWT_SECRET` = random secret key
     - `GO_URL` = `https://go.mistydev.id.vn`
     - `NODE_ENV` = `production`

3. **Custom Domain (optional):**
   - In Render, go to Settings → Custom Domains
   - Add `api.mistydev.id.vn`
   - Update DNS records at your domain provider

## License

MIT
