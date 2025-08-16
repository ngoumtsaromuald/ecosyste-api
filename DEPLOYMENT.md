# ROMAPI Backend Core - Production Deployment

## Quick Start

### 1. Environment Setup

```bash
# Copy production environment template
cp config/environments/.env.production .env.production

# Edit with your production values
nano .env.production
```

### 2. Configure Secrets

```bash
# Copy secrets template
cp config/security/secrets.example.env config/security/secrets.env

# Edit with actual production secrets
nano config/security/secrets.env
```

### 3. Deploy

```bash
# Automated deployment (recommended)
npm run deploy:prod

# Or manual deployment
npm run docker:prod:up
```

### 4. Verify Deployment

```bash
# Check health
curl http://localhost:3000/api/v1/health

# View API documentation
open http://localhost:3000/api/docs

# Check metrics
curl http://localhost:3000/api/v1/metrics
```

## Available Scripts

### Deployment Scripts

- `npm run deploy:prod` - Deploy to production
- `npm run deploy:staging` - Deploy to staging

### Database Scripts

- `npm run migrate:prod` - Run production migrations
- `npm run migrate:status` - Check migration status
- `npm run migrate:rollback <backup-file>` - Rollback database
- `npm run seed:prod` - Seed production data
- `npm run seed:admin` - Create admin user only

### Docker Scripts

- `npm run docker:prod:up` - Start production containers
- `npm run docker:prod:down` - Stop production containers
- `npm run docker:prod:logs` - View production logs

## Environment Variables

### Required

- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - JWT signing secret (min 32 chars)
- `REDIS_PASSWORD` - Redis password
- `CORS_ORIGINS` - Allowed CORS origins (comma-separated)

### Optional

- `ADMIN_PASSWORD` - Admin user password
- `SSL_ENABLED` - Enable HTTPS (true/false)
- `METRICS_ENABLED` - Enable metrics collection (true/false)

## Security Checklist

- [ ] Strong JWT secret (64+ characters)
- [ ] Secure database password
- [ ] Redis password configured
- [ ] CORS origins properly set
- [ ] SSL certificates configured (production)
- [ ] Firewall rules configured
- [ ] Regular backups scheduled

## Monitoring

### Health Checks

- **Application**: `GET /api/v1/health`
- **Database**: `GET /api/v1/health/database`
- **Redis**: `GET /api/v1/health/redis`

### Metrics

- **Prometheus**: `GET /api/v1/metrics`
- **Application logs**: `./logs/application.log`
- **Error logs**: `./logs/error.log`

## Troubleshooting

### Common Issues

1. **Database connection failed**
   ```bash
   # Check database status
   docker logs romapi-postgres-prod
   ```

2. **Redis connection failed**
   ```bash
   # Check Redis status
   docker logs romapi-redis-prod
   ```

3. **Application won't start**
   ```bash
   # Check application logs
   docker logs romapi-app-prod
   ```

### Support

For detailed deployment guide, see [docs/deployment-guide.md](docs/deployment-guide.md)

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│     Nginx       │    │   Application   │    │   PostgreSQL    │
│  (Reverse Proxy)│────│   (NestJS)      │────│   (Database)    │
│     Port 80/443 │    │    Port 3000    │    │    Port 5432    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
                       ┌─────────────────┐
                       │      Redis      │
                       │     (Cache)     │
                       │    Port 6379    │
                       └─────────────────┘
```

## Production Checklist

### Pre-Deployment

- [ ] Environment variables configured
- [ ] Secrets properly set
- [ ] SSL certificates ready
- [ ] Database backup created
- [ ] Staging environment tested

### Post-Deployment

- [ ] Health checks passing
- [ ] API documentation accessible
- [ ] Metrics collection working
- [ ] Logs being generated
- [ ] Monitoring alerts configured

### Ongoing Maintenance

- [ ] Regular backups scheduled
- [ ] Security updates applied
- [ ] Performance monitoring active
- [ ] Log rotation configured
- [ ] Incident response plan ready