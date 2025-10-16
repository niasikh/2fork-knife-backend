# 🍴 Fork & Knife Backend - Production Ready

> **Modern, scalable restaurant reservation system built with NestJS, Prisma, and Supabase PostgreSQL**

A complete restaurant booking platform backend featuring:
- ✅ Real-time availability engine
- ✅ Comprehensive reservation management
- ✅ Restaurant operator console
- ✅ Guest CRM system
- ✅ Payment processing (Stripe)
- ✅ Multi-channel notifications
- ✅ Analytics & reporting
- ✅ Role-based access control
- 🚧 POS integration framework (optional, separate service)
- 🚧 GraphQL BFF for mobile app (optional)

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** >= 20.x
- **npm** >= 9.x
- **PostgreSQL** (Supabase recommended)
- **Redis** (for queues & caching)
- **Stripe Account** (for payments)

### Installation

```bash
# Clone the repository
cd fork-knife-backend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your credentials
nano .env

# Generate Prisma client
npm run prisma:generate

# Run database migrations
npm run prisma:migrate:deploy

# (Optional) Seed database with sample data
npm run prisma:seed
```

### Running the Application

```bash
# Development mode (with hot reload)
npm run start:dev

# Production mode
npm run build
npm run start:prod

# With Docker
docker-compose up -d
```

The server will start on `http://localhost:3000`

---

## 📋 Environment Variables

Create a `.env` file in the root directory:

```bash
# Database (Supabase PostgreSQL)
DATABASE_URL="postgresql://user:password@db.supabase.co:5432/postgres"
DIRECT_URL="postgresql://user:password@db.supabase.co:5432/postgres"

# Supabase
SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_KEY="your-service-role-key"

# JWT
JWT_SECRET="your-super-secret-jwt-key-min-32-chars"
JWT_EXPIRATION="7d"
JWT_REFRESH_SECRET="your-refresh-secret-min-32-chars"
JWT_REFRESH_EXPIRATION="30d"

# Stripe
STRIPE_SECRET_KEY="sk_live_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
STRIPE_CURRENCY="GEL"

# Twilio (SMS)
TWILIO_ACCOUNT_SID="your-account-sid"
TWILIO_AUTH_TOKEN="your-auth-token"
TWILIO_PHONE_NUMBER="+995555123456"

# Email (SendGrid/SMTP)
SMTP_HOST="smtp.sendgrid.net"
SMTP_PORT="587"
SMTP_USER="apikey"
SMTP_PASSWORD="your-sendgrid-api-key"
SMTP_FROM="noreply@forkknife.ge"

# Redis
REDIS_HOST="localhost"
REDIS_PORT="6379"
REDIS_PASSWORD=""

# Application
NODE_ENV="production"
PORT="3000"
FRONTEND_URL="http://localhost:3001"
ADMIN_PANEL_URL="http://localhost:3002"
DEFAULT_TIMEZONE="Asia/Tbilisi"
```

---

## 🏗️ Architecture

```
fork-knife-backend/
├── prisma/
│   ├── schema.prisma          # Database schema
│   ├── migrations/            # Database migrations
│   └── seed.ts               # Seed data (optional)
├── src/
│   ├── main.ts               # Application entry point
│   ├── app.module.ts         # Root module
│   ├── prisma/               # Prisma service
│   ├── health/               # Health check endpoints
│   ├── common/               # Shared utilities
│   │   ├── decorators/       # Custom decorators
│   │   ├── guards/           # Auth & role guards
│   │   ├── filters/          # Exception filters
│   │   ├── interceptors/     # Logging interceptors
│   │   └── pipes/            # Validation pipes
│   └── modules/              # Feature modules
│       ├── auth/             # Authentication & JWT
│       ├── users/            # User management
│       ├── restaurants/      # Restaurant CRUD & setup
│       ├── reservations/     # Booking system
│       ├── availability/     # Availability engine
│       ├── payments/         # Stripe integration
│       ├── guests/           # Guest CRM
│       ├── experiences/      # Events & special dinners
│       ├── waitlist/         # Waitlist management
│       ├── notifications/    # Email/SMS/Push
│       ├── analytics/        # Reporting & KPIs
│       ├── reviews/          # Reviews & ratings
│       └── menu/             # Menu items
├── docker-compose.yml        # Docker setup
├── Dockerfile                # Production container
└── package.json              # Dependencies
```

### Design Patterns

- **Clean Architecture**: Separation of concerns with services, controllers, DTOs
- **Dependency Injection**: NestJS IoC container
- **Repository Pattern**: Prisma ORM as data layer
- **Guard Pattern**: JWT & role-based access control
- **Observer Pattern**: Event-driven notifications (future)
- **Strategy Pattern**: Multiple notification channels

---

## 📡 API Endpoints

### Authentication

```http
POST   /api/v1/auth/register          # Register new user
POST   /api/v1/auth/login             # Login
POST   /api/v1/auth/refresh           # Refresh access token
POST   /api/v1/auth/logout            # Logout
GET    /api/v1/auth/me                # Get current user
```

### Restaurants

```http
GET    /api/v1/restaurants                      # List all restaurants
GET    /api/v1/restaurants/:id                  # Get restaurant by ID
GET    /api/v1/restaurants/slug/:slug           # Get restaurant by slug
POST   /api/v1/restaurants                      # Create restaurant (Owner/Admin)
PUT    /api/v1/restaurants/:id                  # Update restaurant
DELETE /api/v1/restaurants/:id                  # Delete restaurant

# Areas
GET    /api/v1/restaurants/:id/areas            # Get restaurant areas
POST   /api/v1/restaurants/:id/areas            # Create area
PUT    /api/v1/restaurants/areas/:areaId        # Update area
DELETE /api/v1/restaurants/areas/:areaId        # Delete area

# Tables
GET    /api/v1/restaurants/:id/tables           # Get restaurant tables
POST   /api/v1/restaurants/:id/tables           # Create table
PUT    /api/v1/restaurants/tables/:tableId      # Update table
DELETE /api/v1/restaurants/tables/:tableId      # Delete table

# Shifts
GET    /api/v1/restaurants/:id/shifts           # Get shifts
POST   /api/v1/restaurants/:id/shifts           # Create shift
PUT    /api/v1/restaurants/shifts/:shiftId      # Update shift
DELETE /api/v1/restaurants/shifts/:shiftId      # Delete shift

# Policy
GET    /api/v1/restaurants/:id/policy           # Get booking policy
PUT    /api/v1/restaurants/:id/policy           # Update policy

# Blocks (Closures)
GET    /api/v1/restaurants/:id/blocks           # Get closures
POST   /api/v1/restaurants/:id/blocks           # Create closure
DELETE /api/v1/restaurants/blocks/:blockId      # Delete closure
```

### Availability

```http
GET    /api/v1/availability/:restaurantId/check
       ?date=2025-10-20&time=19:00&partySize=4

GET    /api/v1/availability/:restaurantId/slots
       ?date=2025-10-20&partySize=4
```

### Reservations

```http
GET    /api/v1/reservations                     # List user's reservations
GET    /api/v1/reservations/:id                 # Get reservation details
GET    /api/v1/reservations/confirmation/:code  # Get by confirmation code
POST   /api/v1/reservations                     # Create reservation
PUT    /api/v1/reservations/:id                 # Modify reservation
POST   /api/v1/reservations/:id/cancel          # Cancel reservation
POST   /api/v1/reservations/:id/seat            # Mark as seated (Staff)
POST   /api/v1/reservations/:id/complete        # Mark as completed (Staff)
POST   /api/v1/reservations/:id/no-show         # Mark as no-show (Staff)
```

### Guests (CRM)

```http
GET    /api/v1/guests                           # List guests
GET    /api/v1/guests/:id                       # Get guest profile
POST   /api/v1/guests/:id/notes                 # Add note
PUT    /api/v1/guests/:id/tags                  # Update tags
```

### Experiences (Events)

```http
GET    /api/v1/experiences                      # List experiences
GET    /api/v1/experiences/:id                  # Get experience details
```

### Waitlist

```http
GET    /api/v1/waitlist
       ?restaurantId=xxx&date=2025-10-20
```

### Reviews

```http
GET    /api/v1/reviews/restaurant/:id           # Get restaurant reviews
```

### Menu

```http
GET    /api/v1/menu/restaurant/:id              # Get restaurant menu
```

### Analytics

```http
GET    /api/v1/analytics/restaurant/:id
       ?startDate=2025-01-01&endDate=2025-12-31
```

### Health Checks

```http
GET    /health                                  # Health status
GET    /health/ready                            # Readiness probe
GET    /health/live                             # Liveness probe
```

---

## 🔐 Authentication & Authorization

### JWT Strategy

- **Access Token**: 7 days (configurable)
- **Refresh Token**: 30 days (configurable)
- Tokens are signed with `JWT_SECRET` and `JWT_REFRESH_SECRET`

### User Roles

| Role | Description |
|------|-------------|
| `CUSTOMER` | End users booking reservations |
| `RESTAURANT_HOST` | Front-of-house staff |
| `RESTAURANT_MANAGER` | Restaurant managers |
| `RESTAURANT_OWNER` | Restaurant owners |
| `RESTAURANT_MARKETER` | Marketing staff |
| `ADMIN` | System administrators |

### Protected Routes

Use `@UseGuards(JwtAuthGuard)` for authentication and `@Roles(...)` for authorization.

```typescript
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.RESTAURANT_OWNER, UserRole.ADMIN)
@Post()
async create(@Body() dto: CreateRestaurantDto) {
  // Only owners and admins can create restaurants
}
```

---

## 💾 Database Schema

### Key Models

- **User**: Authentication and user profiles
- **Restaurant**: Restaurant details, settings, timezone
- **Area**: Dining areas (Main Room, Patio, Bar, etc.)
- **Table**: Individual tables with min/max seats
- **Shift**: Operating hours by day of week
- **RestaurantPolicy**: Booking rules, cancellation policy, deposits
- **RestaurantBlock**: Closures and private events
- **Reservation**: Bookings with full lifecycle
- **Guest**: Customer profiles with visit history
- **Payment**: Stripe payments and refunds
- **Experience**: Special events and prix fixe
- **Waitlist**: Walk-in queue management
- **Review**: Customer reviews and ratings
- **MenuItem**: Menu items with dietary info
- **Notification**: Email/SMS tracking
- **AuditLog**: Change history for reservations

### Migrations

```bash
# Create a new migration
npm run prisma:migrate:dev --name add_feature

# Apply migrations in production
npm run prisma:migrate:deploy

# Reset database (WARNING: deletes all data)
npm run prisma:migrate:reset

# Open Prisma Studio (database GUI)
npm run prisma:studio
```

---

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:cov

# E2E tests
npm run test:e2e
```

---

## 🐳 Docker Deployment

### Development

```bash
docker-compose up -d
```

### Production

```bash
# Build image
docker build -t fork-knife-backend:latest .

# Run container
docker run -p 3000:3000 --env-file .env fork-knife-backend:latest
```

### Kubernetes

```bash
# Apply configurations
kubectl apply -f kubernetes/

# Check status
kubectl get pods -n production
kubectl logs -f deployment/fork-knife-backend -n production
```

---

## 📊 Monitoring & Logging

### Logs

- **Development**: Colorized console logs with Winston
- **Production**: JSON logs written to `logs/combined.log` and `logs/error.log`

### Health Checks

- **`GET /health`**: Overall health status
- **`GET /health/ready`**: Kubernetes readiness probe
- **`GET /health/live`**: Kubernetes liveness probe

### Metrics (Future)

- Prometheus metrics endpoint
- Grafana dashboards
- Sentry error tracking

---

## 🚀 Deployment

### Supabase Setup

1. Create a new project at [supabase.com](https://supabase.com)
2. Get your connection strings from Settings → Database
3. Update `.env` with `DATABASE_URL` and `DIRECT_URL`
4. Run migrations: `npm run prisma:migrate:deploy`

### Stripe Setup

1. Create account at [stripe.com](https://stripe.com)
2. Get API keys from Dashboard → Developers → API keys
3. Update `.env` with `STRIPE_SECRET_KEY`
4. Set up webhooks for payment events

### Twilio Setup (SMS)

1. Create account at [twilio.com](https://twilio.com)
2. Get Account SID and Auth Token
3. Purchase a phone number
4. Update `.env` with Twilio credentials

### Redis Setup

```bash
# Using Docker
docker run -d -p 6379:6379 redis:7-alpine

# Or use Redis Cloud (free tier)
# https://redis.com/try-free/
```

### Production Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Use strong `JWT_SECRET` (min 32 chars)
- [ ] Configure CORS with actual frontend URLs
- [ ] Set up SSL/TLS certificates
- [ ] Enable rate limiting
- [ ] Configure backup strategy for database
- [ ] Set up monitoring and alerts
- [ ] Test all critical paths
- [ ] Document API for frontend team
- [ ] Set up CI/CD pipeline

---

## 🔧 Development

### Code Quality

```bash
# Lint code
npm run lint

# Fix lint issues
npm run lint:fix

# Format code
npm run format
```

### Commit Conventions

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add waitlist module
fix: resolve availability calculation bug
docs: update README with deployment steps
refactor: simplify reservation service
test: add unit tests for auth module
```

---

## 📝 API Documentation

### Example: Create Reservation

```http
POST /api/v1/reservations
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "restaurantId": "clx1234567890",
  "reservationDate": "2025-10-20",
  "startTime": "19:00",
  "partySize": 4,
  "guestName": "John Doe",
  "guestEmail": "john@example.com",
  "guestPhone": "+995555123456",
  "occasion": "Birthday",
  "specialRequests": "Window seat if possible",
  "dietaryNotes": "One guest is vegetarian"
}
```

**Response**:

```json
{
  "id": "clx9876543210",
  "confirmationCode": "FK-ABC123",
  "status": "CONFIRMED",
  "reservationDate": "2025-10-20T00:00:00.000Z",
  "startTime": "19:00",
  "partySize": 4,
  "restaurant": {
    "id": "clx1234567890",
    "name": "Tabla Restaurant",
    "address": "123 Rustaveli Ave, Tbilisi"
  },
  "table": {
    "id": "clxtable123",
    "number": "5",
    "area": {
      "name": "Main Dining"
    }
  }
}
```

---

## 🛣️ Roadmap

### Phase 1 ✅ (Completed)
- [x] Core restaurant & reservation management
- [x] Availability engine
- [x] Guest CRM
- [x] Authentication & authorization
- [x] Database schema & migrations

### Phase 2 🚧 (In Progress)
- [ ] Complete Stripe payment integration
- [ ] SMS & email notifications
- [ ] Advanced analytics & reporting
- [ ] POS integration framework

### Phase 3 📋 (Planned)
- [ ] GraphQL BFF for mobile app
- [ ] Real-time table status with WebSockets
- [ ] Advanced ML-based insights
- [ ] Multi-language support

---

## 🤝 Contributing

This is a private project for Fork & Knife. For internal team members:

1. Create a feature branch: `git checkout -b feature/amazing-feature`
2. Commit changes: `git commit -m 'feat: add amazing feature'`
3. Push to branch: `git push origin feature/amazing-feature`
4. Open a Pull Request

---

## 📄 License

Proprietary - Fork & Knife Team © 2025

---

## 📞 Support

For questions or issues:
- **Email**: dev@forkknife.ge
- **Slack**: #backend-team
- **Docs**: [Internal Wiki](https://wiki.forkknife.ge)

---

## 🙏 Acknowledgments

Built with:
- [NestJS](https://nestjs.com) - Progressive Node.js framework
- [Prisma](https://prisma.io) - Next-generation ORM
- [Supabase](https://supabase.com) - Open source Firebase alternative
- [Stripe](https://stripe.com) - Payment processing
- [date-fns](https://date-fns.org) - Date utility library

---

**Made with ❤️ by the Fork & Knife Team**

