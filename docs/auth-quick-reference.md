# ROMAPI Authentication Quick Reference

## 🚀 Quick Start

### 1. Register User
```bash
curl -X POST https://api.romapi.com/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123!",
    "name": "John Doe",
    "userType": "INDIVIDUAL"
  }'
```

### 2. Login
```bash
curl -X POST https://api.romapi.com/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123!"
  }'
```

### 3. Use Access Token
```bash
curl -X GET https://api.romapi.com/auth/profile \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## 🔑 Authentication Headers

### JWT Bearer Token
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### API Key
```
X-API-Key: rk_abc123def456ghi789jkl012mno345pqr678stu901vwx234yz567890abcdef123456
```

## 📋 Endpoints Reference

### Authentication
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/auth/register` | Register new user | No |
| POST | `/auth/login` | User login | No |
| POST | `/auth/refresh` | Refresh access token | No |
| POST | `/auth/logout` | User logout | Yes (JWT) |
| POST | `/auth/forgot-password` | Request password reset | No |
| POST | `/auth/reset-password` | Reset password with token | No |
| GET | `/auth/profile` | Get user profile | Yes (JWT) |

### API Keys
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api-keys` | List user API keys | Yes (JWT) |
| POST | `/api-keys` | Create new API key | Yes (JWT) |
| PUT | `/api-keys/:id` | Update API key | Yes (JWT) |
| DELETE | `/api-keys/:id` | Revoke API key | Yes (JWT) |
| POST | `/api-keys/:id/reactivate` | Reactivate API key | Yes (JWT) |
| GET | `/api-keys/stats` | Get API key statistics | Yes (JWT) |

### OAuth
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/oauth/:provider/initiate` | Start OAuth flow | No |
| GET | `/oauth/:provider/callback` | Handle OAuth callback | No |
| POST | `/oauth/link` | Link OAuth account | Yes (JWT) |
| GET | `/oauth/accounts` | Get linked OAuth accounts | Yes (JWT) |
| DELETE | `/oauth/:provider` | Unlink OAuth account | Yes (JWT) |
| POST | `/oauth/:provider/initiate-link` | Start OAuth linking | Yes (JWT) |
| POST | `/oauth/accounts/:id/refresh` | Refresh OAuth tokens | Yes (JWT) |

## 🔒 Permission System

### User Types
- **INDIVIDUAL**: Basic user with limited permissions
- **BUSINESS**: Enhanced permissions for business features
- **ADMIN**: Full system access

### Common Permissions
```
read:profile          # View own profile
update:profile        # Update own profile
read:resources        # View resources
create:resources      # Create resources
write:resources       # Update resources
delete:resources      # Delete resources
read:business         # View business data
update:business       # Manage business settings
read:analytics        # Access analytics
manage:team          # Team management
admin:*              # Full admin access
```

## 📊 Rate Limits

### Default Limits
- **Authenticated Users**: 1000 requests/hour
- **Unauthenticated**: 100 requests/hour
- **API Keys**: Configurable per key

### Rate Limit Headers
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1705416060
X-RateLimit-Window: 3600
```

## 🚨 Error Codes

| Code | Status | Description |
|------|--------|-------------|
| `VALIDATION_ERROR` | 400 | Input validation failed |
| `UNAUTHORIZED` | 401 | Authentication required |
| `INVALID_CREDENTIALS` | 401 | Login failed |
| `TOKEN_EXPIRED` | 401 | Access token expired |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `CONFLICT` | 409 | Resource already exists |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |

## 📝 Request/Response Examples

### Register User
**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "name": "John Doe",
  "userType": "INDIVIDUAL"
}
```

**Response:**
```json
{
  "user": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "email": "user@example.com",
    "name": "John Doe",
    "userType": "INDIVIDUAL",
    "plan": "FREE",
    "emailVerified": false,
    "createdAt": "2024-01-15T10:30:00Z"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 900
}
```

### Create API Key
**Request:**
```json
{
  "name": "Production API Key",
  "permissions": ["read:resources", "write:resources"],
  "rateLimit": 1000,
  "expiresAt": "2025-01-15T10:30:00Z"
}
```

**Response:**
```json
{
  "id": "456e7890-e89b-12d3-a456-426614174000",
  "name": "Production API Key",
  "keyPrefix": "rk_abc123",
  "keyValue": "rk_abc123def456ghi789jkl012mno345pqr678stu901vwx234yz567890abcdef123456",
  "permissions": ["read:resources", "write:resources"],
  "rateLimit": 1000,
  "isActive": true,
  "expiresAt": "2025-01-15T10:30:00Z",
  "createdAt": "2024-01-15T10:30:00Z"
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      {
        "field": "email",
        "message": "Email must be a valid email address"
      }
    ],
    "timestamp": "2024-01-15T10:30:00Z",
    "path": "/auth/register",
    "method": "POST"
  }
}
```

## 🔧 Environment Variables

```bash
# JWT Configuration
JWT_SECRET=your-secret-key
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# OAuth Providers
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
LINKEDIN_CLIENT_ID=your-linkedin-client-id
LINKEDIN_CLIENT_SECRET=your-linkedin-client-secret

# Rate Limiting
RATE_LIMIT_USER=1000
RATE_LIMIT_IP=100
RATE_LIMIT_WINDOW=3600

# Redis Configuration
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=your-redis-password

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/romapi

# Email Service
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

## 🛠️ SDK Installation

### JavaScript/TypeScript
```bash
npm install @romapi/auth-sdk
```

### Python
```bash
pip install romapi-auth
```

### PHP
```bash
composer require romapi/auth-sdk
```

### Go
```bash
go get github.com/romapi/auth-sdk-go
```

## 🔍 Testing Endpoints

### Health Check
```bash
curl https://api.romapi.com/health
```

### Test Authentication
```bash
# Get token
TOKEN=$(curl -s -X POST https://api.romapi.com/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}' \
  | jq -r '.accessToken')

# Use token
curl -H "Authorization: Bearer $TOKEN" \
  https://api.romapi.com/auth/profile
```

## 📚 Resources

- **Full Documentation**: https://docs.romapi.com/auth
- **API Reference**: https://api.romapi.com/docs/auth
- **Integration Guide**: [auth-integration-guide.md](./auth-integration-guide.md)
- **Support**: support@romapi.com
- **Status**: https://status.romapi.com