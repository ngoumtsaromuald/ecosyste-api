# ROMAPI Backend Core

Backend API Core for the ROMAPI ecosystem - A comprehensive microservices architecture built with NestJS, PostgreSQL, and Redis.

## 🚀 Features

- **Microservices Architecture**: Scalable NestJS-based microservices
- **Database**: PostgreSQL with Prisma ORM
- **Caching**: Redis for high-performance caching
- **API Documentation**: Automatic Swagger/OpenAPI documentation
- **Validation**: Comprehensive input validation with class-validator
- **Rate Limiting**: Built-in rate limiting and throttling
- **Docker Support**: Full Docker and docker-compose setup
- **Testing**: Unit and E2E testing with Jest
- **Code Quality**: ESLint and Prettier configuration

## 📋 Prerequisites

- Node.js 18+ 
- Docker and Docker Compose
- PostgreSQL 15+
- Redis 7+

## 🛠️ Installation

### 1. Clone and Install Dependencies

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env
```

### 2. Start Infrastructure with Docker

```bash
# Start PostgreSQL and Redis for development
docker-compose -f docker-compose.dev.yml up -d

# Or start all services including the app
docker-compose up -d
```

### 3. Database Setup

```bash
# Generate Prisma client
npm run prisma:generate

# Run database migrations
npm run prisma:migrate

# (Optional) Open Prisma Studio
npm run prisma:studio
```

## 🏃‍♂️ Running the Application

### Development Mode

```bash
# Start in development mode with hot reload
npm run start:dev

# Start in debug mode
npm run start:debug
```

### Production Mode

```bash
# Build the application
npm run build

# Start in production mode
npm run start:prod
```

## 🐳 Docker Commands

```bash
# Start development infrastructure only
docker-compose -f docker-compose.dev.yml up -d

# Start all services (production)
docker-compose up -d

# Stop services
docker-compose down

# View logs
docker-compose logs -f app

# Rebuild and start
docker-compose up --build -d
```

## 🧪 Testing

```bash
# Run unit tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run E2E tests
npm run test:e2e

# Generate test coverage
npm run test:cov
```

## 📚 API Documentation

Once the application is running, you can access:

- **API Documentation**: http://localhost:3000/api/docs
- **Health Check**: http://localhost:3000/api/v1

## 🔧 Configuration

### Environment Variables

Key environment variables (see `.env.example` for full list):

```bash
# Application
NODE_ENV=development
PORT=3000

# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/romapi_core?schema=public"

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=24h
```

### Database Configuration

The application uses Prisma ORM with PostgreSQL. Key commands:

```bash
# Generate Prisma client after schema changes
npm run prisma:generate

# Create and apply migrations
npm run prisma:migrate

# Reset database (development only)
npx prisma migrate reset

# Seed database
npx prisma db seed
```

## 📁 Project Structure

```
src/
├── config/           # Configuration modules
│   ├── database.module.ts
│   ├── redis.module.ts
│   └── prisma.service.ts
├── modules/          # Feature modules (to be added)
├── common/           # Shared utilities (to be added)
├── app.module.ts     # Root application module
├── app.controller.ts # Root controller
├── app.service.ts    # Root service
└── main.ts          # Application entry point

prisma/
├── schema.prisma    # Database schema (to be added)
└── migrations/      # Database migrations

docker/
├── Dockerfile       # Production Docker image
├── docker-compose.yml        # Production services
└── docker-compose.dev.yml    # Development services
```

## 🔍 Code Quality

```bash
# Lint code
npm run lint

# Format code
npm run format

# Type check
npx tsc --noEmit
```

## 📊 Monitoring

The application includes built-in monitoring capabilities:

- Health checks at `/api/v1`
- Prometheus metrics (to be implemented)
- Structured logging
- Request/response interceptors

## 🚀 Deployment

### Docker Production Deployment

```bash
# Build and start production services
docker-compose up -d

# Scale the application
docker-compose up -d --scale app=3
```

### Manual Deployment

```bash
# Build the application
npm run build

# Start with PM2 or similar process manager
pm2 start dist/main.js --name romapi-core
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:

- Create an issue in the repository
- Check the API documentation at `/api/docs`
- Review the configuration in `.env.example`