# Database Setup - ROMAPI Core

This directory contains the database schema, migrations, and seed data for the ROMAPI Core backend.

## Overview

The database uses PostgreSQL with Prisma ORM and includes the following main entities:

- **Users**: System users (individual, business, admin)
- **Categories**: Hierarchical categorization system
- **API Resources**: Core business entities (businesses, services, APIs, data)
- **Business Hours**: Operating hours for business resources
- **Resource Images**: Image gallery for resources
- **API Keys**: Authentication and rate limiting
- **Subscriptions**: User plan management
- **Analytics Events**: Usage tracking and analytics

## Quick Start

### 1. Start Database

```bash
# Using Docker (recommended)
docker run -d --name romapi-postgres \
  -e POSTGRES_DB=romapi_core \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -p 5432:5432 \
  postgres:15-alpine

# Or using docker-compose
docker-compose up -d postgres
```

### 2. Setup Database Schema

```bash
# Generate Prisma client
npm run prisma:generate

# Apply migrations (if database connection works from host)
npm run prisma:migrate

# Or manually apply migration (if connection issues)
docker cp prisma/migrations/20250815211800_init/migration.sql romapi-postgres:/tmp/migration.sql
docker exec -it romapi-postgres psql -U postgres -d romapi_core -f /tmp/migration.sql
```

### 3. Seed Test Data

```bash
# Using TypeScript seed (if connection works)
npm run prisma:seed

# Or using SQL seed (if connection issues)
docker cp prisma/seed-container.sql romapi-postgres:/tmp/seed.sql
docker exec -it romapi-postgres psql -U postgres -d romapi_core -f /tmp/seed.sql
```

### 4. Verify Setup

```bash
# Test database connection and data
npm run db:verify

# Or check manually
docker exec -it romapi-postgres psql -U postgres -d romapi_core -c "\\dt"
```

## Database Schema

### Core Tables

#### Users
- Supports individual, business, and admin user types
- Includes API quota and usage tracking
- Pricing tier management

#### Categories
- Hierarchical structure with parent-child relationships
- Supports unlimited nesting levels
- Includes SEO-friendly slugs

#### API Resources
- Main business entities with full address information
- Supports different resource types (business, service, data, API)
- Includes SEO metadata and soft deletion
- Geographic indexing for location-based queries

#### Business Hours
- Flexible scheduling system
- Supports closed days and custom hours
- Linked to API resources

#### Resource Images
- Image gallery with primary image designation
- Ordering support for image sequences
- Alt text for accessibility

#### API Keys
- Secure API authentication
- Granular permissions system
- Rate limiting configuration
- Usage tracking

#### Analytics Events
- Comprehensive event tracking
- IP address and user agent logging
- Flexible metadata storage
- Time-series optimized indexing

## Test Data

The seed script creates:

- **8 categories** (5 main + 3 subcategories)
- **4 users** with different roles and plans
- **4 API resources** with varied data
- **14 business hour entries**
- **4 resource images**
- **3 API keys** with different permissions
- **2 active subscriptions**
- **7 analytics events**

### Test Credentials

All test users use password: `password123`

- **Admin**: admin@romapi.com (Enterprise plan)
- **Business**: business@example.com (Pro plan)
- **Developer**: developer@example.com (Free plan)
- **Premium**: premium@example.com (Premium plan)

## Scripts

### Available Commands

```bash
# Database management
npm run prisma:generate     # Generate Prisma client
npm run prisma:migrate      # Run migrations
npm run prisma:seed         # Seed test data
npm run prisma:studio       # Open Prisma Studio

# Custom scripts
npm run db:setup           # Complete database setup
npm run db:test            # Test connection
npm run db:verify          # Verify setup and data

# Docker management
npm run docker:up          # Start all services
npm run docker:down        # Stop all services
```

### Manual Database Operations

```bash
# Connect to database
docker exec -it romapi-postgres psql -U postgres -d romapi_core

# View tables
\\dt

# View table structure
\\d users

# Query data
SELECT name, user_type, plan FROM users;
SELECT name, slug, status FROM api_resources;

# Check record counts
SELECT 
  'users' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT 'api_resources', COUNT(*) FROM api_resources
UNION ALL
SELECT 'categories', COUNT(*) FROM categories;
```

## Performance Considerations

### Indexes

The schema includes optimized indexes for:

- **Geographic queries**: `(latitude, longitude)` on api_resources
- **Status filtering**: `(status, plan)` on api_resources
- **Time-series queries**: `created_at DESC` on api_resources
- **Analytics**: `(resource_id, created_at DESC)` on analytics_events
- **API keys**: `(user_id, is_active)` on api_keys

### Query Optimization

- Use `include` for related data instead of separate queries
- Leverage indexes for filtering and sorting
- Use pagination for large result sets
- Consider caching for frequently accessed data

## Troubleshooting

### Connection Issues

If you can't connect from the host machine:

1. **Check Docker container**: `docker ps`
2. **Check logs**: `docker logs romapi-postgres`
3. **Test inside container**: `docker exec -it romapi-postgres psql -U postgres -d romapi_core -c "SELECT 1;"`
4. **Use manual migration**: Copy SQL files to container and execute

### Migration Issues

If migrations fail:

1. **Use db push**: `npx prisma db push`
2. **Manual migration**: Copy migration SQL to container
3. **Reset database**: `npm run prisma:migrate:reset`

### Seed Issues

If seeding fails:

1. **Check connection**: `npm run db:test`
2. **Use SQL seed**: Copy `seed-container.sql` to container
3. **Manual verification**: Check table contents directly

## Environment Variables

Required environment variables in `.env`:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/romapi_core?schema=public"
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=romapi_core
```

## Next Steps

After successful database setup:

1. **Start the application**: `npm run start:dev`
2. **Run tests**: `npm run test`
3. **Explore data**: `npm run prisma:studio`
4. **Build features**: Implement the remaining tasks from the spec