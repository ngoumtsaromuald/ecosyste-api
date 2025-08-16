# ROMAPI Backend Core - Production Deployment Guide

## Overview

This guide covers the complete deployment process for the ROMAPI Backend Core in production environments. The application uses a containerized architecture with Docker, PostgreSQL, Redis, and optional Nginx reverse proxy.

## Prerequisites

### System Requirements

- **Operating System**: Linux (Ubuntu 20.04+ recommended)
- **Docker**: Version 20.10+
- **Docker Compose**: Version 2.0+
- **Memory**: Minimum 4GB RAM (8GB+ recommended)
- **Storage**: Minimum 20GB free space
- **Network**: Stable internet connection for container downloads

### Required Tools

```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verify installations
docker --version
docker-compose --version
```

## Environment Setup

### 1. Clone Repository

```bash
git clone <repository-url>
cd backend-api-core-romapi
```

### 2. Environment Configuration

#### Production Environment Variables

Copy the production environment template:

```bash
cp config/environments/.env.production .env.production
```

Edit `.env.production` with your actual values:

```bash
# Required variables
export NODE_ENV=production
export DATABASE_URL="postgresql://username:password@postgres:5432/romapi_core?schema=public"
export JWT_SECRET="your-super-secure-jwt-secret-key"
export REDIS_PASSWORD="your-secure-redis-password"
export CORS_ORIGINS="https://yourdomain.com,https://api.yourdomain.com"

# Optional but recommended
export ADMIN_PASSWORD="your-secure-admin-password"
export SSL_ENABLED=true
export METRICS_ENABLED=true
```

#### Secrets Management

Create secrets file (never commit to version control):

```bash
cp config/security/secrets.example.env config/security/secrets.env
# Edit with actual production secrets
nano config/security/secrets.env
```

### 3. SSL Certificate Setup (Optional but Recommended)

For HTTPS support, place your SSL certificates:

```bash
mkdir -p config/nginx/ssl
# Copy your certificates
cp /path/to/your/cert.pem config/nginx/ssl/cert.pem
cp /path/to/your/private.key config/nginx/ssl/private.key
```

Or generate self-signed certificates for testing:

```bash
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout config/nginx/ssl/private.key \
  -out config/nginx/ssl/cert.pem
```

## Deployment Methods

### Method 1: Automated Deployment (Recommended)

Use the provided deployment script:

```bash
# Make script executable (Linux/Mac)
chmod +x scripts/deploy.sh

# Deploy to production
./scripts/deploy.sh production

# Deploy to staging
./scripts/deploy.sh staging
```

The script will:
1. Validate environment variables
2. Create database backup
3. Build the application
4. Run database migrations
5. Deploy with Docker Compose
6. Verify deployment health

### Method 2: Manual Deployment

#### Step 1: Build Application

```bash
# Install dependencies
npm ci --only=production

# Generate Prisma client
npx prisma generate

# Build application
npm run build
```

#### Step 2: Database Setup

```bash
# Run migrations
node scripts/migrate-prod.js

# Seed initial data
node scripts/seed-prod.js
```

#### Step 3: Deploy with Docker

```bash
# Load environment variables
source .env.production

# Deploy services
docker-compose -f docker-compose.prod.yml up -d --build

# Check service health
docker-compose -f docker-compose.prod.yml ps
```

## Post-Deployment Verification

### 1. Health Checks

```bash
# Application health
curl -f http://localhost:3000/api/v1/health

# Database connectivity
curl -f http://localhost:3000/api/v1/health/database

# Redis connectivity
curl -f http://localhost:3000/api/v1/health/redis
```

### 2. API Documentation

Access Swagger documentation:
- **URL**: `http://localhost:3000/api/docs`
- **Metrics**: `http://localhost:3000/api/v1/metrics`

### 3. Log Verification

```bash
# Application logs
docker logs romapi-app-prod

# Database logs
docker logs romapi-postgres-prod

# Redis logs
docker logs romapi-redis-prod

# Nginx logs (if using)
docker logs romapi-nginx-prod
```

## Monitoring and Maintenance

### 1. Log Management

Logs are stored in the `./logs` directory:

```bash
# Application logs
tail -f logs/application.log

# Error logs
tail -f logs/error.log

# Access logs (if using Nginx)
tail -f logs/nginx/access.log
```

### 2. Database Maintenance

#### Backup

```bash
# Manual backup
docker exec romapi-postgres-prod pg_dump -U postgres romapi_core > backup_$(date +%Y%m%d).sql

# Automated backup (add to cron)
0 2 * * * /path/to/backup-script.sh
```

#### Restore

```bash
# Restore from backup
docker exec -i romapi-postgres-prod psql -U postgres romapi_core < backup_file.sql
```

### 3. Performance Monitoring

#### Metrics Collection

The application exposes Prometheus metrics at `/api/v1/metrics`:

```bash
# View metrics
curl http://localhost:3000/api/v1/metrics
```

#### Key Metrics to Monitor

- **HTTP Request Rate**: `http_requests_total`
- **Response Time**: `http_request_duration_seconds`
- **Database Connections**: `database_connections_active`
- **Cache Hit Rate**: `cache_hit_rate`
- **Memory Usage**: `process_resident_memory_bytes`

## Scaling and High Availability

### 1. Horizontal Scaling

Scale application instances:

```bash
# Scale to 3 instances
docker-compose -f docker-compose.prod.yml up -d --scale app=3
```

### 2. Database Scaling

For high-traffic scenarios:

- **Read Replicas**: Configure PostgreSQL read replicas
- **Connection Pooling**: Use PgBouncer for connection management
- **Partitioning**: Implement table partitioning for large datasets

### 3. Redis Clustering

For high availability:

```yaml
# docker-compose.prod.yml - Redis Cluster
redis-cluster:
  image: redis:7-alpine
  command: redis-cli --cluster create --cluster-replicas 1 redis1:6379 redis2:6379 redis3:6379
```

## Security Considerations

### 1. Network Security

- Use private networks for database connections
- Implement firewall rules
- Enable SSL/TLS for all connections
- Use VPN for administrative access

### 2. Application Security

- Regularly update dependencies
- Use strong passwords and secrets
- Implement rate limiting
- Enable security headers
- Monitor for security vulnerabilities

### 3. Data Protection

- Encrypt sensitive data at rest
- Use secure backup procedures
- Implement access controls
- Regular security audits

## Troubleshooting

### Common Issues

#### 1. Database Connection Issues

```bash
# Check database status
docker exec romapi-postgres-prod pg_isready -U postgres

# View database logs
docker logs romapi-postgres-prod

# Test connection
docker exec romapi-app-prod npm run db:test
```

#### 2. Redis Connection Issues

```bash
# Check Redis status
docker exec romapi-redis-prod redis-cli ping

# View Redis logs
docker logs romapi-redis-prod

# Test connection
docker exec romapi-redis-prod redis-cli info
```

#### 3. Application Startup Issues

```bash
# Check application logs
docker logs romapi-app-prod

# Check environment variables
docker exec romapi-app-prod env | grep NODE_ENV

# Restart application
docker-compose -f docker-compose.prod.yml restart app
```

### Performance Issues

#### 1. High Memory Usage

```bash
# Check memory usage
docker stats

# Optimize Node.js memory
export NODE_OPTIONS="--max-old-space-size=1024"
```

#### 2. Slow Database Queries

```bash
# Enable query logging
docker exec romapi-postgres-prod psql -U postgres -c "ALTER SYSTEM SET log_min_duration_statement = 1000;"

# Analyze slow queries
docker exec romapi-postgres-prod psql -U postgres -c "SELECT * FROM pg_stat_statements ORDER BY total_time DESC LIMIT 10;"
```

## Rollback Procedures

### 1. Application Rollback

```bash
# Rollback using deployment script
./scripts/deploy.sh production rollback

# Manual rollback
docker-compose -f docker-compose.prod.yml down
# Restore previous version
docker-compose -f docker-compose.prod.yml up -d
```

### 2. Database Rollback

```bash
# Restore from backup
node scripts/migrate-prod.js rollback /path/to/backup.sql
```

## Maintenance Windows

### Planned Maintenance

1. **Schedule**: Announce maintenance windows in advance
2. **Backup**: Create full system backup before maintenance
3. **Testing**: Test all changes in staging environment first
4. **Monitoring**: Monitor system closely after changes
5. **Rollback Plan**: Have rollback procedures ready

### Emergency Procedures

1. **Incident Response**: Follow incident response procedures
2. **Communication**: Notify stakeholders immediately
3. **Diagnosis**: Quickly identify root cause
4. **Resolution**: Apply fixes or rollback as needed
5. **Post-Mortem**: Conduct post-incident review

## Support and Resources

### Documentation

- **API Documentation**: `/api/docs`
- **Health Checks**: `/api/v1/health`
- **Metrics**: `/api/v1/metrics`

### Monitoring Dashboards

- **Application Metrics**: Prometheus + Grafana
- **Infrastructure**: System monitoring tools
- **Logs**: Centralized logging solution

### Contact Information

- **Development Team**: dev-team@romapi.com
- **Operations Team**: ops-team@romapi.com
- **Emergency Contact**: emergency@romapi.com

---

## Appendix

### A. Environment Variables Reference

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `NODE_ENV` | Environment mode | Yes | `production` |
| `DATABASE_URL` | PostgreSQL connection string | Yes | - |
| `JWT_SECRET` | JWT signing secret | Yes | - |
| `REDIS_HOST` | Redis host | Yes | `redis` |
| `CORS_ORIGINS` | Allowed CORS origins | Yes | - |
| `SSL_ENABLED` | Enable SSL/HTTPS | No | `false` |
| `METRICS_ENABLED` | Enable metrics collection | No | `true` |

### B. Port Reference

| Service | Port | Description |
|---------|------|-------------|
| Application | 3000 | Main API server |
| PostgreSQL | 5432 | Database server |
| Redis | 6379 | Cache server |
| Nginx | 80/443 | Reverse proxy |

### C. File Structure

```
backend-api-core-romapi/
├── config/
│   ├── environments/
│   ├── security/
│   ├── nginx/
│   ├── postgres/
│   └── redis/
├── scripts/
│   ├── deploy.sh
│   ├── migrate-prod.js
│   └── seed-prod.js
├── docker-compose.prod.yml
├── Dockerfile.prod
└── docs/
    └── deployment-guide.md
```