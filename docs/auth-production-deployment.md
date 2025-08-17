# Auth System Production Deployment Guide

## Overview

This guide provides step-by-step instructions for deploying the ROMAPI Auth System to production, including all security configurations, environment setup, and validation procedures.

## Pre-Deployment Checklist

### 1. Environment Variables Configuration

#### Required Variables
- [ ] `DATABASE_URL` - PostgreSQL connection string
- [ ] `JWT_SECRET` - Strong JWT signing secret (min 32 chars)
- [ ] `JWT_REFRESH_SECRET` - Strong refresh token secret (min 32 chars)
- [ ] `REDIS_HOST` - Redis server hostname
- [ ] `REDIS_PORT` - Redis server port
- [ ] `REDIS_PASSWORD` - Strong Redis password (min 8 chars)

#### Email Configuration
- [ ] `SMTP_HOST` - SMTP server hostname
- [ ] `SMTP_PORT` - SMTP server port (587 for STARTTLS, 465 for SSL)
- [ ] `SMTP_SECURE` - Set to `true` for SSL, `false` for STARTTLS
- [ ] `SMTP_USER` - SMTP username
- [ ] `SMTP_PASS` - SMTP password or app-specific password
- [ ] `EMAIL_FROM` - Sender email address
- [ ] `SMTP_TLS_REJECT_UNAUTHORIZED` - Set to `true` for production
- [ ] `SMTP_TLS_MIN_VERSION` - Set to `TLSv1.2` or higher

#### OAuth2 Configuration (Optional)
- [ ] `GOOGLE_CLIENT_ID` - Google OAuth2 client ID
- [ ] `GOOGLE_CLIENT_SECRET` - Google OAuth2 client secret
- [ ] `GITHUB_CLIENT_ID` - GitHub OAuth2 client ID
- [ ] `GITHUB_CLIENT_SECRET` - GitHub OAuth2 client secret
- [ ] `LINKEDIN_CLIENT_ID` - LinkedIn OAuth2 client ID
- [ ] `LINKEDIN_CLIENT_SECRET` - LinkedIn OAuth2 client secret

#### Security Settings
- [ ] `BCRYPT_ROUNDS` - Set to 12 or higher
- [ ] `MAX_LOGIN_ATTEMPTS` - Set to 5 or appropriate value
- [ ] `ACCOUNT_LOCKOUT_DURATION` - Set to 15m or appropriate value
- [ ] `CORS_ORIGINS` - Production domain URLs only (no wildcards)
- [ ] `FRONTEND_URL` - Production frontend URL (HTTPS)
- [ ] `OAUTH_CALLBACK_URL` - Production OAuth callback URL (HTTPS)

### 2. Infrastructure Requirements

#### Database
- [ ] PostgreSQL 13+ running and accessible
- [ ] Database user with appropriate permissions
- [ ] Connection pooling configured
- [ ] Backup strategy in place

#### Redis
- [ ] Redis 6+ running and accessible
- [ ] Password authentication enabled
- [ ] Memory limits configured
- [ ] Persistence configured for session data

#### SSL/TLS
- [ ] Valid SSL certificates installed
- [ ] HTTPS enforced for all endpoints
- [ ] SMTP SSL/TLS properly configured
- [ ] OAuth2 callback URLs use HTTPS

### 3. Security Configuration

#### File Permissions
- [ ] Environment files have restricted permissions (600)
- [ ] Log directories are writable by application
- [ ] Backup directories are secure

#### Network Security
- [ ] Firewall rules configured
- [ ] Database access restricted to application servers
- [ ] Redis access restricted to application servers
- [ ] Rate limiting configured at load balancer level

## Deployment Steps

### Step 1: Environment Validation

Run the production validation script:

```bash
# Validate all auth configurations
node scripts/validate-auth-prod.js

# Validate specific components
node scripts/validate-auth-prod.js env      # Environment variables
node scripts/validate-auth-prod.js ssl     # SSL/TLS configuration
node scripts/validate-auth-prod.js security # Security settings
node scripts/validate-auth-prod.js oauth   # OAuth2 configuration
```

### Step 2: Database Migration

Run the auth-specific migration script:

```bash
# Full auth migration with backup
node scripts/migrate-auth-prod.js

# Individual operations
node scripts/migrate-auth-prod.js validate    # Validate environment
node scripts/migrate-auth-prod.js test-redis  # Test Redis connectivity
node scripts/migrate-auth-prod.js test-smtp   # Test SMTP configuration
node scripts/migrate-auth-prod.js backup      # Create backup only
```

### Step 3: Application Deployment

Deploy using Docker Compose:

```bash
# Deploy to production
npm run deploy:prod

# Or manually with Docker
docker-compose -f docker-compose.prod.yml up -d --build
```

### Step 4: Post-Deployment Verification

#### Health Checks
```bash
# Application health
curl -f https://your-domain.com/api/v1/health

# Auth-specific endpoints
curl -f https://your-domain.com/api/v1/auth/health
curl -f https://your-domain.com/api/v1/auth/status
```

#### Functional Tests
```bash
# Run auth integration tests
npm run test:e2e -- --testPathPattern=auth

# Test specific auth flows
npm run test:e2e -- test/auth/auth.e2e-spec.ts
npm run test:e2e -- test/auth/api-keys.e2e-spec.ts
npm run test:e2e -- test/auth/oauth.e2e-spec.ts
```

## Monitoring and Logging

### Log Files Location
- Security logs: `./logs/security/auth-security.log`
- Error logs: `./logs/security/auth-errors.log`
- Critical events: `./logs/security/auth-critical.log`
- Audit trail: `./logs/security/auth-audit.log`

### Key Metrics to Monitor
- Authentication success/failure rates
- API key usage patterns
- Rate limiting triggers
- Session creation/expiration
- OAuth2 flow completion rates
- Database connection pool usage
- Redis memory usage

### Alert Thresholds
- Failed login attempts > 10 per minute
- Rate limit exceeded > 100 per minute
- Critical security events > 50 per hour
- Database connection failures
- Redis connectivity issues
- SMTP delivery failures

## Security Best Practices

### 1. Secrets Management
- Use environment variables or dedicated secrets management
- Rotate JWT secrets regularly
- Use strong, unique passwords for all services
- Never commit secrets to version control

### 2. Network Security
- Use HTTPS for all communications
- Implement proper CORS policies
- Configure rate limiting at multiple levels
- Use secure headers (Helmet.js)

### 3. Database Security
- Use connection pooling
- Implement query timeouts
- Regular security updates
- Encrypted connections

### 4. Monitoring
- Implement comprehensive logging
- Set up alerting for security events
- Regular security audits
- Monitor for suspicious patterns

## Troubleshooting

### Common Issues

#### Database Connection Issues
```bash
# Test database connectivity
node scripts/test-db-connection.ts

# Check migration status
npx prisma migrate status
```

#### Redis Connection Issues
```bash
# Test Redis connectivity
node scripts/migrate-auth-prod.js test-redis

# Check Redis logs
docker logs romapi-redis-prod
```

#### SMTP Configuration Issues
```bash
# Test SMTP configuration
node scripts/migrate-auth-prod.js test-smtp

# Check email service logs
docker logs romapi-app-prod | grep -i smtp
```

#### OAuth2 Issues
- Verify callback URLs match OAuth2 provider settings
- Check client ID and secret configuration
- Ensure HTTPS is used for all OAuth2 URLs
- Validate redirect URI whitelist

### Log Analysis

#### Security Event Analysis
```bash
# View recent security events
tail -f ./logs/security/auth-security.log | jq '.'

# Search for failed logins
grep "login_failure" ./logs/security/auth-audit.log | jq '.'

# Monitor rate limiting
grep "rate_limit_exceeded" ./logs/security/auth-security.log | jq '.'
```

#### Performance Analysis
```bash
# Database query performance
grep "slow_query" ./logs/auth-migration-*.log

# Redis performance
grep "redis" ./logs/security/auth-security.log | jq '.responseTime'
```

## Rollback Procedures

### Database Rollback
```bash
# Rollback using backup
node scripts/migrate-prod.js rollback /path/to/backup/database_backup.sql

# Or use auth-specific rollback
node scripts/migrate-auth-prod.js rollback /path/to/backup/auth_tables_backup.sql
```

### Application Rollback
```bash
# Rollback to previous version
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d --build
```

## Maintenance

### Regular Tasks
- [ ] Monitor log file sizes and rotate as needed
- [ ] Review security logs for suspicious activity
- [ ] Update dependencies and security patches
- [ ] Backup database and configuration files
- [ ] Test disaster recovery procedures

### Monthly Tasks
- [ ] Review and rotate JWT secrets
- [ ] Audit user accounts and permissions
- [ ] Review rate limiting thresholds
- [ ] Update OAuth2 provider configurations
- [ ] Performance optimization review

### Quarterly Tasks
- [ ] Security audit and penetration testing
- [ ] Review and update security policies
- [ ] Disaster recovery testing
- [ ] Capacity planning review

## Support and Documentation

### Additional Resources
- [Auth System API Documentation](./swagger-documentation.md)
- [Security Hardening Guide](./security-hardening.md)
- [Performance Tuning Guide](./performance-tuning.md)

### Emergency Contacts
- DevOps Team: [contact information]
- Security Team: [contact information]
- Database Administrator: [contact information]

---

**Note**: This deployment guide should be reviewed and updated regularly to reflect changes in the auth system and security best practices.