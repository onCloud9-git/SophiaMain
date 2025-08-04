# Sophia AI Backend

Backend API for Sophia AI Business Agent - autonomiczny system zarządzania biznesami opartymi na modelu abonamentowym.

## Tech Stack

- **Runtime**: Node.js 20+
- **Framework**: Express.js z TypeScript  
- **Database**: PostgreSQL z Prisma ORM
- **Authentication**: JWT
- **Queue**: Bull Queue z Redis
- **Real-time**: Socket.io
- **Testing**: Jest

## Setup & Development

### Prerequisites

- Node.js 20+
- PostgreSQL database
- Redis server

### Installation

1. Install dependencies:
```bash
npm install
```

2. Setup environment variables (copy from `.env.example`):
```bash
cp .env.example .env
```

3. Configure database connection in `.env`:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/sophia_db"
REDIS_URL="redis://localhost:6379"
JWT_SECRET="your-super-secret-jwt-key"
```

4. Setup database:
```bash
npm run db:setup
```

This will:
- Generate Prisma client
- Push schema to database
- Seed with demo data

### Development

Start development server:
```bash
npm run dev
```

Server will start on `http://localhost:3001`

### Database Scripts

```bash
# Generate Prisma client after schema changes
npm run db:generate

# Push schema changes to database
npm run db:push

# Create and run migrations
npm run db:migrate

# Seed database with demo data
npm run db:seed

# Reset database (careful - deletes all data!)
npm run db:reset

# Open Prisma Studio (database GUI)
npm run db:studio
```

## Project Structure

```
src/
├── controllers/     # API route controllers
├── jobs/           # Background job definitions
├── lib/            # Shared utilities (Prisma client, etc.)
├── middlewares/    # Express middlewares
├── models/         # Database models with business logic
├── routes/         # Express route definitions
├── services/       # Business logic services
└── utils/          # Helper utilities

prisma/
├── schema.prisma   # Database schema
└── seed.ts         # Database seeding script
```

## Database Models

### Core Entities

- **User** - System users (business owners)
- **Business** - Main business entities with configuration
- **MarketingCampaign** - Marketing campaigns across platforms
- **BusinessMetric** - Daily performance metrics
- **Deployment** - Application deployment tracking

### Key Features

- Full CRUD operations for all entities
- Business status management (PLANNING → DEVELOPING → ACTIVE → PAUSED/CLOSED)
- Campaign performance tracking across platforms (Google Ads, Facebook, LinkedIn)
- Real-time metrics aggregation and analysis
- Automated decision-making based on performance data

## API Documentation

### Authentication

All API endpoints require JWT authentication except `/auth/login` and `/auth/register`.

Include token in Authorization header:
```
Authorization: Bearer <jwt_token>
```

### Core Endpoints

```
POST   /auth/login              # User login
POST   /auth/register           # User registration

GET    /businesses              # List user's businesses
POST   /businesses              # Create new business
GET    /businesses/:id          # Get business details
PUT    /businesses/:id          # Update business
DELETE /businesses/:id          # Delete business

GET    /campaigns               # List campaigns
POST   /campaigns               # Create campaign
PUT    /campaigns/:id           # Update campaign
DELETE /campaigns/:id           # Delete campaign

GET    /metrics/:businessId     # Get business metrics
POST   /metrics                 # Add/update metrics

GET    /deployments/:businessId # Get deployment history
POST   /deployments             # Create deployment
PUT    /deployments/:id         # Update deployment status
```

## Testing

Run tests:
```bash
npm test

# Watch mode
npm run test:watch
```

### Test Structure

- Unit tests for models: `src/models/__tests__/`
- Integration tests for API endpoints: `src/routes/__tests__/`
- Service tests: `src/services/__tests__/`

## Demo Data

After running `npm run db:seed`, you'll have:

### Demo Users
- `demo@sophia.ai` / `password123`
- `admin@sophia.ai` / `password123`

### Sample Businesses
- **TaskFlow Pro** - Active SaaS business with growing metrics
- **FitTracker AI** - Developing fitness app
- **LearnLab** - Paused education platform
- **ShopSync** - Active e-commerce tool

### Sample Data
- 3 marketing campaigns across Google Ads and Facebook
- 30 days of business metrics for each active business
- Deployment history with different statuses

## Error Handling

The API uses consistent error responses:

```json
{
  "success": false,
  "error": {
    "code": "BUSINESS_NOT_FOUND",
    "message": "Business with ID 'xyz' was not found",
    "details": {}
  }
}
```

Common error codes:
- `VALIDATION_ERROR` - Invalid input data
- `UNAUTHORIZED` - Authentication required
- `FORBIDDEN` - Insufficient permissions
- `NOT_FOUND` - Resource not found
- `BUSINESS_CREATION_FAILED` - Business creation error

## Environment Variables

Required environment variables:

```env
# Database
DATABASE_URL="postgresql://..."
REDIS_URL="redis://..."

# Authentication
JWT_SECRET="your-secret-key"
JWT_EXPIRES_IN="7d"

# External Services
STRIPE_SECRET_KEY="sk_..."
GOOGLE_ADS_CLIENT_ID="..."
FACEBOOK_APP_ID="..."

# Server
PORT=3001
NODE_ENV="development"
```

## Production Deployment

1. Build the application:
```bash
npm run build
```

2. Start production server:
```bash
npm start
```

3. Make sure PostgreSQL and Redis are available in production environment.

4. Run database migrations:
```bash
npx prisma migrate deploy
```

## Next Steps

This completes **Task 2: Database Schema and Core Data Models**. 

The database foundation is now ready with:
- ✅ Prisma ORM configured with PostgreSQL
- ✅ Complete schema for Business, User, MarketingCampaign, BusinessMetric, Deployment entities
- ✅ Model classes with full CRUD operations and business logic
- ✅ Database migrations and comprehensive seed data
- ✅ Unit tests for core model functionality

**Next Task**: Task 3 - Backend API Foundation and Authentication