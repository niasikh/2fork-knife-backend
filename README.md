# 🍴 Fork & Knife Backend

**Production-ready NestJS backend for restaurant reservation system**

**Tech Stack**: NestJS + TypeScript + Prisma + Supabase PostgreSQL + Redis + Stripe

---

## 🚀 Quick Start

```bash
# 1. Install dependencies
npm install --legacy-peer-deps

# 2. Copy and configure environment
cp .env.example .env
# Edit .env with your Supabase credentials

# 3. Start Redis
docker run -d -p 6379:6379 redis:7-alpine

# 4. Setup database
npm run prisma:generate
npm run prisma:migrate:deploy

# 5. Run the server
npm run start:dev
```

Server starts on `http://localhost:3000`

**Full setup guide**: See [GETTING_STARTED.md](./GETTING_STARTED.md)

---

## ⚙️ Environment Variables

**Required**:
- `DATABASE_URL` - PostgreSQL connection (from Supabase)
- `DIRECT_URL` - Connection pooling URL (from Supabase)
- `JWT_SECRET` - Min 32 characters
- `JWT_REFRESH_SECRET` - Min 32 characters
- `REDIS_HOST` & `REDIS_PORT` - Redis connection

**Optional**:
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` - For payments
- `ENABLE_GRAPHQL` - Set to `"true"` to enable GraphQL
- See `.env.example` for complete list

**Validate environment**:
```bash
npm run check:env
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

**Primary Strategy**:
- **Backend API + Worker** → **Fly.io** or Render
- **Frontend** → **Vercel**
- **Database** → **Supabase**
- **Redis** → **Upstash** or Fly Redis

**Complete deployment guide**: See [docs/DEPLOYMENT_STRATEGY.md](./docs/DEPLOYMENT_STRATEGY.md)

**Quick Fly.io Deploy**:
```bash
fly launch
fly secrets set DATABASE_URL="..." JWT_SECRET="..."
fly deploy
```

**Alternative platforms**: Render, Railway - See deployment docs

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

