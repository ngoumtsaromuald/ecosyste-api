# Security Hardening Guide - ROMAPI Backend Core

## Overview

This guide provides comprehensive security hardening recommendations for the ROMAPI Backend Core in production environments.

## Application Security

### 1. Environment Variables and Secrets

#### Secure Secret Management

```bash
# Generate strong JWT secret (64 characters)
openssl rand -base64 64

# Generate secure passwords
openssl rand -base64 32

# Use environment-specific secrets
# Never commit secrets to version control
echo "secrets.env" >> .gitignore
```

#### Required Security Variables

```bash
# Strong JWT secret (minimum 64 characters)
JWT_SECRET="your-super-secure-jwt-secret-key-at-least-64-characters-long"

# Secure database credentials
DB_PASSWORD="your-secure-database-password-with-special-chars-123!"

# Redis authentication
REDIS_PASSWORD="your-secure-redis-password-456@"

# Admin credentials
ADMIN_PASSWORD="your-secure-admin-password-789#"
```

### 2. Input Validation and Sanitization

The application implements multiple layers of input validation:

- **Class Validator**: DTO validation with decorators
- **Prisma**: Database-level constraints
- **Custom Sanitization**: Input sanitization functions

#### Security Validation Rules

```typescript
// Example: Secure input validation
@IsString()
@Length(1, 100)
@Matches(/^[a-zA-Z0-9\s\-_]+$/, { message: 'Invalid characters detected' })
name: string;

@IsEmail()
@IsNotEmpty()
email: string;

@IsStrongPassword({
  minLength: 8,
  minLowercase: 1,
  minUppercase: 1,
  minNumbers: 1,
  minSymbols: 1
})
password: string;
```

### 3. Authentication and Authorization

#### JWT Security

- **Algorithm**: HS256 (configurable)
- **Expiration**: 24 hours (configurable)
- **Issuer/Audience**: Validated
- **Secret Rotation**: Supported

#### Rate Limiting

```typescript
// Production rate limits
const rateLimits = {
  global: 1000, // requests per minute
  auth: 5,      // login attempts per minute
  api: 100,     // API calls per minute per user
};
```

### 4. Data Protection

#### Encryption at Rest

- **Database**: PostgreSQL with encryption
- **Passwords**: bcrypt with salt rounds 12
- **Sensitive Data**: AES-256-GCM encryption

#### Encryption in Transit

- **HTTPS**: TLS 1.2+ required
- **Database**: SSL connections enforced
- **Redis**: TLS connections supported

## Infrastructure Security

### 1. Docker Security

#### Container Hardening

```dockerfile
# Use non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nestjs
USER nestjs

# Read-only root filesystem
--read-only --tmpfs /tmp

# Drop capabilities
--cap-drop=ALL --cap-add=NET_BIND_SERVICE

# Security options
--security-opt=no-new-privileges:true
```

#### Docker Compose Security

```yaml
# Production security settings
services:
  app:
    security_opt:
      - no-new-privileges:true
    read_only: true
    tmpfs:
      - /tmp
    cap_drop:
      - ALL
    cap_add:
      - NET_BIND_SERVICE
```

### 2. Network Security

#### Firewall Configuration

```bash
# UFW firewall rules
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

#### Docker Network Isolation

```yaml
# Isolated networks
networks:
  frontend:
    driver: bridge
  backend:
    driver: bridge
    internal: true  # No external access
```

### 3. Database Security

#### PostgreSQL Hardening

```sql
-- Create dedicated application user
CREATE USER romapi_app WITH PASSWORD 'secure_password';
GRANT CONNECT ON DATABASE romapi_core TO romapi_app;
GRANT USAGE ON SCHEMA public TO romapi_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO romapi_app;

-- Revoke unnecessary privileges
REVOKE ALL ON SCHEMA public FROM PUBLIC;
REVOKE CREATE ON SCHEMA public FROM PUBLIC;
```

#### Connection Security

```bash
# postgresql.conf security settings
ssl = on
ssl_cert_file = 'server.crt'
ssl_key_file = 'server.key'
password_encryption = scram-sha-256
log_connections = on
log_disconnections = on
log_statement = 'mod'
```

### 4. Redis Security

#### Authentication and Access Control

```bash
# redis.conf security settings
requirepass your_secure_redis_password
rename-command FLUSHDB ""
rename-command FLUSHALL ""
rename-command KEYS ""
rename-command CONFIG "CONFIG_b835c3f8a5d9e7f2"
bind 127.0.0.1 ::1
protected-mode yes
```

## Web Server Security

### 1. Nginx Security Headers

```nginx
# Security headers
add_header X-Frame-Options DENY always;
add_header X-Content-Type-Options nosniff always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;

# Content Security Policy
add_header Content-Security-Policy "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self'; frame-src 'none'; object-src 'none';" always;
```

### 2. SSL/TLS Configuration

#### Strong SSL Configuration

```nginx
# SSL protocols and ciphers
ssl_protocols TLSv1.2 TLSv1.3;
ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
ssl_prefer_server_ciphers off;

# SSL session settings
ssl_session_timeout 1d;
ssl_session_cache shared:SSL:50m;
ssl_session_tickets off;

# OCSP stapling
ssl_stapling on;
ssl_stapling_verify on;
```

### 3. Rate Limiting

```nginx
# Rate limiting zones
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=login:10m rate=1r/s;

# Apply rate limits
location /api/ {
    limit_req zone=api burst=20 nodelay;
}

location ~ ^/api/v1/(auth|login) {
    limit_req zone=login burst=5 nodelay;
}
```

## Monitoring and Logging

### 1. Security Logging

#### Application Security Logs

```typescript
// Security event logging
logger.warn('Failed login attempt', {
  ip: request.ip,
  userAgent: request.headers['user-agent'],
  email: loginDto.email,
  timestamp: new Date().toISOString()
});

logger.error('Suspicious activity detected', {
  type: 'rate_limit_exceeded',
  ip: request.ip,
  endpoint: request.url,
  attempts: attemptCount
});
```

#### Log Analysis

```bash
# Monitor failed login attempts
grep "Failed login attempt" logs/application.log | tail -20

# Check for suspicious patterns
grep "rate_limit_exceeded" logs/application.log | wc -l

# Monitor database connections
grep "database_connection" logs/application.log | tail -10
```

### 2. Intrusion Detection

#### File Integrity Monitoring

```bash
# Install AIDE (Advanced Intrusion Detection Environment)
sudo apt-get install aide
sudo aideinit
sudo aide --check
```

#### Log Monitoring with Fail2Ban

```bash
# Install Fail2Ban
sudo apt-get install fail2ban

# Configure jail for application
cat > /etc/fail2ban/jail.local << EOF
[romapi-auth]
enabled = true
port = http,https
filter = romapi-auth
logpath = /path/to/logs/application.log
maxretry = 5
bantime = 3600
EOF
```

## Vulnerability Management

### 1. Dependency Scanning

```bash
# Audit npm dependencies
npm audit

# Fix vulnerabilities
npm audit fix

# Check for outdated packages
npm outdated

# Use Snyk for advanced scanning
npx snyk test
npx snyk monitor
```

### 2. Container Scanning

```bash
# Scan Docker images for vulnerabilities
docker run --rm -v /var/run/docker.sock:/var/run/docker.sock \
  -v $HOME/Library/Caches:/root/.cache/ \
  aquasec/trivy image romapi-app:latest

# Use Clair for continuous scanning
docker run -d --name clair-db arminc/clair-db:latest
docker run -p 6060:6060 --link clair-db:postgres -d --name clair arminc/clair-local-scan:latest
```

### 3. Security Testing

#### Automated Security Tests

```bash
# OWASP ZAP security testing
docker run -t owasp/zap2docker-stable zap-baseline.py -t http://localhost:3000

# Nmap port scanning
nmap -sS -O localhost

# SSL testing
testssl.sh https://localhost:443
```

## Incident Response

### 1. Security Incident Procedures

#### Immediate Response

1. **Isolate**: Disconnect affected systems
2. **Assess**: Determine scope and impact
3. **Contain**: Prevent further damage
4. **Eradicate**: Remove threats
5. **Recover**: Restore normal operations
6. **Learn**: Post-incident analysis

#### Emergency Contacts

```bash
# Security team contacts
SECURITY_TEAM_EMAIL="security@romapi.com"
INCIDENT_RESPONSE_PHONE="+1234567890"
EMERGENCY_ESCALATION="emergency@romapi.com"
```

### 2. Backup and Recovery

#### Automated Backups

```bash
#!/bin/bash
# Automated backup script
BACKUP_DIR="/backups/$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

# Database backup
docker exec romapi-postgres-prod pg_dump -U postgres romapi_core > "$BACKUP_DIR/database.sql"

# Application backup
tar -czf "$BACKUP_DIR/application.tar.gz" ./dist

# Encrypt backups
gpg --cipher-algo AES256 --compress-algo 1 --s2k-mode 3 \
    --s2k-digest-algo SHA512 --s2k-count 65536 --symmetric \
    --output "$BACKUP_DIR/backup.gpg" "$BACKUP_DIR/"
```

## Compliance and Auditing

### 1. Audit Logging

```typescript
// Comprehensive audit logging
const auditLog = {
  timestamp: new Date().toISOString(),
  userId: user.id,
  action: 'CREATE_RESOURCE',
  resource: 'api_resource',
  resourceId: resource.id,
  ip: request.ip,
  userAgent: request.headers['user-agent'],
  success: true,
  details: {
    changes: changedFields,
    metadata: additionalContext
  }
};

logger.info('Audit event', auditLog);
```

### 2. Compliance Frameworks

#### GDPR Compliance

- **Data Minimization**: Collect only necessary data
- **Consent Management**: Explicit user consent
- **Right to Erasure**: Data deletion capabilities
- **Data Portability**: Export user data
- **Breach Notification**: 72-hour reporting

#### SOC 2 Compliance

- **Security**: Access controls and monitoring
- **Availability**: System uptime and reliability
- **Processing Integrity**: Data accuracy and completeness
- **Confidentiality**: Data protection measures
- **Privacy**: Personal information handling

## Security Checklist

### Pre-Production

- [ ] Strong secrets generated and configured
- [ ] Input validation implemented
- [ ] Authentication and authorization working
- [ ] HTTPS/TLS configured
- [ ] Database security hardened
- [ ] Container security implemented
- [ ] Network security configured
- [ ] Security headers enabled
- [ ] Rate limiting configured
- [ ] Logging and monitoring active

### Production

- [ ] Security scanning completed
- [ ] Penetration testing performed
- [ ] Incident response plan ready
- [ ] Backup and recovery tested
- [ ] Compliance requirements met
- [ ] Security training completed
- [ ] Regular security reviews scheduled

### Ongoing

- [ ] Dependency updates automated
- [ ] Security patches applied
- [ ] Log analysis performed
- [ ] Vulnerability assessments conducted
- [ ] Security metrics monitored
- [ ] Incident response drills executed

## Resources

### Security Tools

- **OWASP ZAP**: Web application security testing
- **Snyk**: Dependency vulnerability scanning
- **Trivy**: Container vulnerability scanning
- **Fail2Ban**: Intrusion prevention
- **AIDE**: File integrity monitoring

### Documentation

- **OWASP Top 10**: Web application security risks
- **NIST Cybersecurity Framework**: Security guidelines
- **CIS Controls**: Critical security controls
- **Docker Security**: Container security best practices

### Training

- **OWASP WebGoat**: Hands-on security training
- **Security Awareness**: Regular team training
- **Incident Response**: Emergency procedures training