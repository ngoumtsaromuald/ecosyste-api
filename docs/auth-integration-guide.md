# ROMAPI Authentication Integration Guide

This guide provides comprehensive instructions for integrating with the ROMAPI Authentication Service, including code examples, best practices, and troubleshooting tips.

## Table of Contents

1. [Quick Start](#quick-start)
2. [Authentication Methods](#authentication-methods)
3. [Integration Examples](#integration-examples)
4. [SDK Usage](#sdk-usage)
5. [Error Handling](#error-handling)
6. [Security Best Practices](#security-best-practices)
7. [Rate Limiting](#rate-limiting)
8. [Testing](#testing)
9. [Troubleshooting](#troubleshooting)
10. [Migration Guide](#migration-guide)

## Quick Start

### 1. Get Your Credentials

First, register for a ROMAPI account and obtain your API credentials:

1. Visit [ROMAPI Console](https://console.romapi.com)
2. Create a new project
3. Generate API keys in the Authentication section
4. Note your API endpoint: `https://api.romapi.com`

### 2. Basic Authentication Flow

```javascript
// 1. Register a new user
const registerResponse = await fetch('https://api.romapi.com/auth/register', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'SecurePass123!',
    name: 'John Doe',
    userType: 'INDIVIDUAL'
  })
});

const { user, accessToken, refreshToken } = await registerResponse.json();

// 2. Store tokens securely
localStorage.setItem('accessToken', accessToken);
localStorage.setItem('refreshToken', refreshToken);

// 3. Make authenticated requests
const profileResponse = await fetch('https://api.romapi.com/auth/profile', {
  headers: {
    'Authorization': `Bearer ${accessToken}`
  }
});
```

## Authentication Methods

### JWT Bearer Token Authentication

Most suitable for user-facing applications (web, mobile).

```javascript
// Login and get tokens
async function login(email, password) {
  const response = await fetch('https://api.romapi.com/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password })
  });

  if (!response.ok) {
    throw new Error('Login failed');
  }

  const { user, accessToken, refreshToken, expiresIn } = await response.json();
  
  // Store tokens securely
  secureStorage.setItem('accessToken', accessToken);
  secureStorage.setItem('refreshToken', refreshToken);
  secureStorage.setItem('tokenExpiry', Date.now() + (expiresIn * 1000));
  
  return { user, accessToken };
}

// Refresh expired tokens
async function refreshAccessToken() {
  const refreshToken = secureStorage.getItem('refreshToken');
  
  const response = await fetch('https://api.romapi.com/auth/refresh', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ refreshToken })
  });

  if (!response.ok) {
    // Refresh token expired, redirect to login
    redirectToLogin();
    return null;
  }

  const { accessToken, refreshToken: newRefreshToken, expiresIn } = await response.json();
  
  // Update stored tokens
  secureStorage.setItem('accessToken', accessToken);
  secureStorage.setItem('refreshToken', newRefreshToken);
  secureStorage.setItem('tokenExpiry', Date.now() + (expiresIn * 1000));
  
  return accessToken;
}

// Automatic token refresh
async function makeAuthenticatedRequest(url, options = {}) {
  let accessToken = secureStorage.getItem('accessToken');
  const tokenExpiry = secureStorage.getItem('tokenExpiry');
  
  // Check if token is expired or will expire soon (5 minutes buffer)
  if (Date.now() > (tokenExpiry - 300000)) {
    accessToken = await refreshAccessToken();
    if (!accessToken) {
      throw new Error('Authentication required');
    }
  }
  
  return fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${accessToken}`
    }
  });
}
```

### API Key Authentication

Best for server-to-server communication and automated systems.

```javascript
// Create API key (requires user authentication)
async function createApiKey(name, permissions, rateLimit) {
  const response = await makeAuthenticatedRequest('https://api.romapi.com/api-keys', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name,
      permissions,
      rateLimit,
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() // 1 year
    })
  });

  const { keyValue } = await response.json();
  
  // Store API key securely (server environment only)
  process.env.ROMAPI_API_KEY = keyValue;
  
  return keyValue;
}

// Use API key for requests
async function makeApiKeyRequest(url, options = {}) {
  return fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'X-API-Key': process.env.ROMAPI_API_KEY
    }
  });
}
```

## Integration Examples

### React.js Integration

```jsx
// AuthContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing session on app start
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setLoading(false);
        return;
      }

      const response = await fetch('https://api.romapi.com/auth/profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData.user);
      } else {
        // Token invalid, try refresh
        await refreshToken();
      }
    } catch (error) {
      console.error('Auth check failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const response = await fetch('https://api.romapi.com/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error.message);
    }

    const { user, accessToken, refreshToken } = await response.json();
    
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    setUser(user);
    
    return user;
  };

  const logout = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      await fetch('https://api.romapi.com/auth/logout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      setUser(null);
    }
  };

  const refreshToken = async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      const response = await fetch('https://api.romapi.com/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken })
      });

      if (response.ok) {
        const { accessToken, refreshToken: newRefreshToken } = await response.json();
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', newRefreshToken);
        return accessToken;
      } else {
        throw new Error('Refresh failed');
      }
    } catch (error) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      setUser(null);
      throw error;
    }
  };

  const value = {
    user,
    login,
    logout,
    loading,
    refreshToken
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Protected Route Component
export const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  return children;
};
```

### Node.js/Express Integration

```javascript
// auth-middleware.js
const jwt = require('jsonwebtoken');
const axios = require('axios');

class AuthMiddleware {
  constructor(apiBaseUrl = 'https://api.romapi.com') {
    this.apiBaseUrl = apiBaseUrl;
    this.tokenCache = new Map();
  }

  // Middleware for JWT authentication
  authenticateJWT = async (req, res, next) => {
    try {
      const authHeader = req.headers.authorization;
      const token = authHeader && authHeader.split(' ')[1];

      if (!token) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Access token required'
          }
        });
      }

      // Verify token with ROMAPI
      const userInfo = await this.verifyToken(token);
      req.user = userInfo;
      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Invalid or expired token'
        }
      });
    }
  };

  // Middleware for API key authentication
  authenticateApiKey = async (req, res, next) => {
    try {
      const apiKey = req.headers['x-api-key'];

      if (!apiKey) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'API key required'
          }
        });
      }

      // Verify API key with ROMAPI
      const keyInfo = await this.verifyApiKey(apiKey);
      req.apiKey = keyInfo.apiKey;
      req.user = keyInfo.user;
      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Invalid API key'
        }
      });
    }
  };

  // Permission check middleware
  requirePermissions = (permissions) => {
    return (req, res, next) => {
      const userPermissions = req.user?.permissions || [];
      const apiKeyPermissions = req.apiKey?.permissions || [];
      const allPermissions = [...userPermissions, ...apiKeyPermissions];

      const hasPermission = permissions.every(permission => 
        allPermissions.includes(permission) || 
        allPermissions.includes('admin:*') ||
        allPermissions.some(p => p.endsWith(':*') && permission.startsWith(p.split(':')[0]))
      );

      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Insufficient permissions',
            required: permissions,
            available: allPermissions
          }
        });
      }

      next();
    };
  };

  async verifyToken(token) {
    // Check cache first
    if (this.tokenCache.has(token)) {
      const cached = this.tokenCache.get(token);
      if (cached.expires > Date.now()) {
        return cached.user;
      }
      this.tokenCache.delete(token);
    }

    // Verify with ROMAPI
    const response = await axios.get(`${this.apiBaseUrl}/auth/profile`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const userInfo = response.data.user;
    
    // Cache for 5 minutes
    this.tokenCache.set(token, {
      user: userInfo,
      expires: Date.now() + 5 * 60 * 1000
    });

    return userInfo;
  }

  async verifyApiKey(apiKey) {
    // In production, you might want to cache this as well
    const response = await axios.post(`${this.apiBaseUrl}/auth/verify-api-key`, {
      apiKey
    });

    return response.data;
  }
}

module.exports = AuthMiddleware;

// Usage in Express app
const express = require('express');
const AuthMiddleware = require('./auth-middleware');

const app = express();
const auth = new AuthMiddleware();

// Public routes
app.post('/auth/login', async (req, res) => {
  // Proxy to ROMAPI or handle locally
});

// Protected routes
app.get('/profile', auth.authenticateJWT, (req, res) => {
  res.json({ user: req.user });
});

// API key protected routes
app.get('/api/data', auth.authenticateApiKey, auth.requirePermissions(['read:data']), (req, res) => {
  res.json({ data: 'sensitive data' });
});
```

### Python/Django Integration

```python
# auth_middleware.py
import jwt
import requests
from django.http import JsonResponse
from django.conf import settings
from functools import wraps
import time

class RomApiAuth:
    def __init__(self, api_base_url='https://api.romapi.com'):
        self.api_base_url = api_base_url
        self.token_cache = {}

    def authenticate_jwt(self, get_response):
        """Django middleware for JWT authentication"""
        def middleware(request):
            if request.path.startswith('/api/'):
                auth_header = request.META.get('HTTP_AUTHORIZATION')
                if auth_header and auth_header.startswith('Bearer '):
                    token = auth_header.split(' ')[1]
                    try:
                        user_info = self.verify_token(token)
                        request.user_info = user_info
                    except Exception as e:
                        return JsonResponse({
                            'success': False,
                            'error': {
                                'code': 'UNAUTHORIZED',
                                'message': 'Invalid or expired token'
                            }
                        }, status=401)

            response = get_response(request)
            return response
        return middleware

    def verify_token(self, token):
        """Verify JWT token with ROMAPI"""
        # Check cache
        if token in self.token_cache:
            cached = self.token_cache[token]
            if cached['expires'] > time.time():
                return cached['user']
            del self.token_cache[token]

        # Verify with ROMAPI
        response = requests.get(
            f'{self.api_base_url}/auth/profile',
            headers={'Authorization': f'Bearer {token}'}
        )
        
        if response.status_code != 200:
            raise Exception('Token verification failed')

        user_info = response.json()['user']
        
        # Cache for 5 minutes
        self.token_cache[token] = {
            'user': user_info,
            'expires': time.time() + 300
        }

        return user_info

def require_auth(view_func):
    """Decorator to require authentication"""
    @wraps(view_func)
    def wrapper(request, *args, **kwargs):
        if not hasattr(request, 'user_info'):
            return JsonResponse({
                'success': False,
                'error': {
                    'code': 'UNAUTHORIZED',
                    'message': 'Authentication required'
                }
            }, status=401)
        return view_func(request, *args, **kwargs)
    return wrapper

def require_permissions(permissions):
    """Decorator to require specific permissions"""
    def decorator(view_func):
        @wraps(view_func)
        def wrapper(request, *args, **kwargs):
            if not hasattr(request, 'user_info'):
                return JsonResponse({
                    'success': False,
                    'error': {
                        'code': 'UNAUTHORIZED',
                        'message': 'Authentication required'
                    }
                }, status=401)

            user_permissions = request.user_info.get('permissions', [])
            has_permission = all(perm in user_permissions for perm in permissions)
            
            if not has_permission:
                return JsonResponse({
                    'success': False,
                    'error': {
                        'code': 'FORBIDDEN',
                        'message': 'Insufficient permissions',
                        'required': permissions,
                        'available': user_permissions
                    }
                }, status=403)

            return view_func(request, *args, **kwargs)
        return wrapper
    return decorator

# views.py
from django.http import JsonResponse
from .auth_middleware import require_auth, require_permissions

@require_auth
def profile_view(request):
    return JsonResponse({
        'user': request.user_info
    })

@require_auth
@require_permissions(['read:data'])
def protected_data_view(request):
    return JsonResponse({
        'data': 'sensitive information'
    })
```

## SDK Usage

### JavaScript/TypeScript SDK

```bash
npm install @romapi/auth-sdk
```

```typescript
import { RomApiAuth, AuthConfig } from '@romapi/auth-sdk';

const config: AuthConfig = {
  apiBaseUrl: 'https://api.romapi.com',
  apiKey: process.env.ROMAPI_API_KEY, // For server-side
  autoRefresh: true, // Automatically refresh tokens
  storage: 'localStorage' // or 'sessionStorage', 'memory'
};

const auth = new RomApiAuth(config);

// Register user
const user = await auth.register({
  email: 'user@example.com',
  password: 'SecurePass123!',
  name: 'John Doe',
  userType: 'INDIVIDUAL'
});

// Login
const session = await auth.login('user@example.com', 'SecurePass123!');

// Make authenticated requests
const profile = await auth.getProfile();

// Create API key
const apiKey = await auth.createApiKey({
  name: 'My App Key',
  permissions: ['read:resources', 'write:resources'],
  rateLimit: 1000
});

// OAuth integration
const oauthUrl = await auth.initiateOAuth('GOOGLE', 'https://myapp.com/callback');
window.location.href = oauthUrl;

// Handle OAuth callback
const authResult = await auth.handleOAuthCallback('GOOGLE', code, state);
```

### Python SDK

```bash
pip install romapi-auth
```

```python
from romapi_auth import RomApiAuth, AuthConfig

config = AuthConfig(
    api_base_url='https://api.romapi.com',
    api_key=os.getenv('ROMAPI_API_KEY')
)

auth = RomApiAuth(config)

# Register user
user = auth.register(
    email='user@example.com',
    password='SecurePass123!',
    name='John Doe',
    user_type='INDIVIDUAL'
)

# Login
session = auth.login('user@example.com', 'SecurePass123!')

# Make authenticated requests
profile = auth.get_profile()

# Create API key
api_key = auth.create_api_key(
    name='My App Key',
    permissions=['read:resources', 'write:resources'],
    rate_limit=1000
)

# OAuth integration
oauth_url = auth.initiate_oauth('GOOGLE', 'https://myapp.com/callback')
print(f"Visit: {oauth_url}")
```

## Error Handling

### Common Error Patterns

```javascript
// Comprehensive error handling
async function handleApiCall(apiCall) {
  try {
    const response = await apiCall();
    return response;
  } catch (error) {
    if (error.response) {
      const { status, data } = error.response;
      
      switch (status) {
        case 400:
          // Validation error
          if (data.error.code === 'VALIDATION_ERROR') {
            const validationErrors = data.error.details.map(detail => 
              `${detail.field}: ${detail.message}`
            ).join(', ');
            throw new Error(`Validation failed: ${validationErrors}`);
          }
          break;
          
        case 401:
          // Authentication error
          if (data.error.code === 'TOKEN_EXPIRED') {
            // Try to refresh token
            try {
              await refreshAccessToken();
              return await apiCall(); // Retry with new token
            } catch (refreshError) {
              redirectToLogin();
              throw new Error('Session expired. Please log in again.');
            }
          } else {
            throw new Error('Authentication failed. Please log in.');
          }
          break;
          
        case 403:
          // Permission error
          throw new Error(`Access denied. Required permissions: ${data.error.required?.join(', ')}`);
          
        case 429:
          // Rate limit error
          const resetTime = new Date(data.headers['X-RateLimit-Reset'] * 1000);
          throw new Error(`Rate limit exceeded. Try again at ${resetTime.toLocaleTimeString()}`);
          
        case 500:
          // Server error
          throw new Error('Server error. Please try again later.');
          
        default:
          throw new Error(data.error.message || 'An unexpected error occurred');
      }
    } else {
      // Network error
      throw new Error('Network error. Please check your connection.');
    }
  }
}

// Usage
try {
  const result = await handleApiCall(() => 
    fetch('/api/protected-endpoint', {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    })
  );
} catch (error) {
  console.error('API call failed:', error.message);
  showErrorToUser(error.message);
}
```

### Error Recovery Strategies

```javascript
// Exponential backoff for retries
async function retryWithBackoff(apiCall, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await apiCall();
    } catch (error) {
      if (attempt === maxRetries) {
        throw error;
      }
      
      // Don't retry on client errors (4xx)
      if (error.response?.status >= 400 && error.response?.status < 500) {
        throw error;
      }
      
      // Exponential backoff: 1s, 2s, 4s
      const delay = Math.pow(2, attempt - 1) * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

// Circuit breaker pattern
class CircuitBreaker {
  constructor(threshold = 5, timeout = 60000) {
    this.threshold = threshold;
    this.timeout = timeout;
    this.failureCount = 0;
    this.lastFailureTime = null;
    this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
  }

  async call(apiCall) {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.timeout) {
        this.state = 'HALF_OPEN';
      } else {
        throw new Error('Circuit breaker is OPEN');
      }
    }

    try {
      const result = await apiCall();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  onSuccess() {
    this.failureCount = 0;
    this.state = 'CLOSED';
  }

  onFailure() {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    
    if (this.failureCount >= this.threshold) {
      this.state = 'OPEN';
    }
  }
}
```

## Security Best Practices

### Token Storage

```javascript
// ❌ DON'T: Store tokens in localStorage (vulnerable to XSS)
localStorage.setItem('accessToken', token);

// ✅ DO: Use secure storage methods
class SecureTokenStorage {
  constructor() {
    this.storage = this.getSecureStorage();
  }

  getSecureStorage() {
    // For web apps: use httpOnly cookies or secure sessionStorage
    // For mobile apps: use secure keychain/keystore
    // For server apps: use environment variables or secure vaults
    
    if (typeof window !== 'undefined') {
      // Browser environment
      return {
        setItem: (key, value) => {
          // Use httpOnly cookie via API call
          fetch('/api/auth/store-token', {
            method: 'POST',
            credentials: 'include',
            body: JSON.stringify({ [key]: value })
          });
        },
        getItem: (key) => {
          // Token will be sent automatically via httpOnly cookie
          return null; // Don't expose token to JavaScript
        },
        removeItem: (key) => {
          fetch('/api/auth/clear-token', {
            method: 'POST',
            credentials: 'include'
          });
        }
      };
    } else {
      // Node.js environment
      return {
        setItem: (key, value) => {
          process.env[key.toUpperCase()] = value;
        },
        getItem: (key) => {
          return process.env[key.toUpperCase()];
        },
        removeItem: (key) => {
          delete process.env[key.toUpperCase()];
        }
      };
    }
  }

  setToken(token) {
    this.storage.setItem('accessToken', token);
  }

  getToken() {
    return this.storage.getItem('accessToken');
  }

  clearToken() {
    this.storage.removeItem('accessToken');
  }
}
```

### Input Validation

```javascript
// Client-side validation (not sufficient alone)
function validateRegistrationInput(data) {
  const errors = [];

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(data.email)) {
    errors.push({ field: 'email', message: 'Invalid email format' });
  }

  // Password strength validation
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  if (!passwordRegex.test(data.password)) {
    errors.push({ 
      field: 'password', 
      message: 'Password must be at least 8 characters with uppercase, lowercase, number, and special character' 
    });
  }

  // Name validation
  if (!data.name || data.name.trim().length < 2) {
    errors.push({ field: 'name', message: 'Name must be at least 2 characters' });
  }

  return errors;
}

// Sanitize input
function sanitizeInput(input) {
  if (typeof input !== 'string') return input;
  
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .substring(0, 1000); // Limit length
}
```

### HTTPS and Security Headers

```javascript
// Express.js security setup
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// Rate limiting
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many authentication attempts. Try again later.'
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/auth/login', authLimiter);
app.use('/auth/register', authLimiter);
```

## Rate Limiting

### Understanding Rate Limits

```javascript
// Rate limit information from response headers
function handleRateLimit(response) {
  const limit = response.headers.get('X-RateLimit-Limit');
  const remaining = response.headers.get('X-RateLimit-Remaining');
  const reset = response.headers.get('X-RateLimit-Reset');
  const window = response.headers.get('X-RateLimit-Window');

  console.log(`Rate limit: ${remaining}/${limit} requests remaining`);
  console.log(`Resets at: ${new Date(reset * 1000).toLocaleTimeString()}`);

  // Warn when approaching limit
  if (remaining < limit * 0.1) {
    console.warn('Approaching rate limit!');
  }

  return {
    limit: parseInt(limit),
    remaining: parseInt(remaining),
    reset: new Date(reset * 1000),
    window: parseInt(window)
  };
}

// Client-side rate limiting
class RateLimiter {
  constructor(limit, windowMs) {
    this.limit = limit;
    this.windowMs = windowMs;
    this.requests = [];
  }

  async checkLimit() {
    const now = Date.now();
    
    // Remove old requests outside the window
    this.requests = this.requests.filter(time => now - time < this.windowMs);
    
    if (this.requests.length >= this.limit) {
      const oldestRequest = Math.min(...this.requests);
      const waitTime = this.windowMs - (now - oldestRequest);
      
      throw new Error(`Rate limit exceeded. Wait ${Math.ceil(waitTime / 1000)} seconds.`);
    }
    
    this.requests.push(now);
  }

  async makeRequest(apiCall) {
    await this.checkLimit();
    return await apiCall();
  }
}

// Usage
const limiter = new RateLimiter(100, 60 * 60 * 1000); // 100 requests per hour

try {
  const result = await limiter.makeRequest(() => 
    fetch('/api/endpoint', { headers: { 'Authorization': `Bearer ${token}` } })
  );
} catch (error) {
  console.error('Rate limit error:', error.message);
}
```

## Testing

### Unit Tests

```javascript
// Jest tests for authentication
describe('Authentication Service', () => {
  let authService;

  beforeEach(() => {
    authService = new AuthService({
      apiBaseUrl: 'https://api.romapi.com',
      apiKey: 'test-api-key'
    });
  });

  describe('login', () => {
    it('should login successfully with valid credentials', async () => {
      // Mock successful response
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          user: { id: '123', email: 'test@example.com' },
          accessToken: 'mock-access-token',
          refreshToken: 'mock-refresh-token',
          expiresIn: 900
        })
      });

      const result = await authService.login('test@example.com', 'password');

      expect(result.user.email).toBe('test@example.com');
      expect(result.accessToken).toBe('mock-access-token');
    });

    it('should throw error with invalid credentials', async () => {
      // Mock error response
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({
          success: false,
          error: {
            code: 'INVALID_CREDENTIALS',
            message: 'Invalid email or password'
          }
        })
      });

      await expect(authService.login('test@example.com', 'wrong-password'))
        .rejects.toThrow('Invalid email or password');
    });
  });

  describe('token refresh', () => {
    it('should refresh token successfully', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          accessToken: 'new-access-token',
          refreshToken: 'new-refresh-token',
          expiresIn: 900
        })
      });

      const result = await authService.refreshToken('old-refresh-token');

      expect(result.accessToken).toBe('new-access-token');
    });
  });
});
```

### Integration Tests

```javascript
// Integration tests with real API
describe('Authentication Integration', () => {
  const testUser = {
    email: `test-${Date.now()}@example.com`,
    password: 'TestPass123!',
    name: 'Test User'
  };

  let accessToken;
  let refreshToken;

  it('should register a new user', async () => {
    const response = await fetch('https://api.romapi.com/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testUser)
    });

    expect(response.status).toBe(201);
    
    const data = await response.json();
    expect(data.user.email).toBe(testUser.email);
    expect(data.accessToken).toBeDefined();
    
    accessToken = data.accessToken;
    refreshToken = data.refreshToken;
  });

  it('should login with registered user', async () => {
    const response = await fetch('https://api.romapi.com/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testUser.email,
        password: testUser.password
      })
    });

    expect(response.status).toBe(200);
    
    const data = await response.json();
    expect(data.user.email).toBe(testUser.email);
  });

  it('should access protected endpoint with token', async () => {
    const response = await fetch('https://api.romapi.com/auth/profile', {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });

    expect(response.status).toBe(200);
    
    const data = await response.json();
    expect(data.user.email).toBe(testUser.email);
  });

  afterAll(async () => {
    // Cleanup: delete test user
    await fetch('https://api.romapi.com/auth/delete-account', {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
  });
});
```

## Troubleshooting

### Common Issues

#### 1. Token Expiration Issues

**Problem**: Getting 401 errors even with valid tokens

**Solution**:
```javascript
// Check token expiration before making requests
function isTokenExpired(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return Date.now() >= payload.exp * 1000;
  } catch (error) {
    return true; // Assume expired if can't parse
  }
}

// Auto-refresh before expiration
async function makeRequestWithAutoRefresh(url, options = {}) {
  let token = getStoredToken();
  
  if (isTokenExpired(token)) {
    token = await refreshAccessToken();
  }
  
  return fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${token}`
    }
  });
}
```

#### 2. CORS Issues

**Problem**: CORS errors when making requests from browser

**Solution**:
```javascript
// Ensure proper CORS headers on server
app.use(cors({
  origin: ['https://yourapp.com', 'http://localhost:3000'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key']
}));

// Or use a proxy in development
// In package.json for Create React App:
{
  "proxy": "https://api.romapi.com"
}
```

#### 3. Rate Limiting Issues

**Problem**: Hitting rate limits frequently

**Solution**:
```javascript
// Implement request queuing
class RequestQueue {
  constructor(maxConcurrent = 5, delayMs = 100) {
    this.maxConcurrent = maxConcurrent;
    this.delayMs = delayMs;
    this.queue = [];
    this.running = 0;
  }

  async add(requestFn) {
    return new Promise((resolve, reject) => {
      this.queue.push({ requestFn, resolve, reject });
      this.process();
    });
  }

  async process() {
    if (this.running >= this.maxConcurrent || this.queue.length === 0) {
      return;
    }

    this.running++;
    const { requestFn, resolve, reject } = this.queue.shift();

    try {
      const result = await requestFn();
      resolve(result);
    } catch (error) {
      reject(error);
    } finally {
      this.running--;
      setTimeout(() => this.process(), this.delayMs);
    }
  }
}

const requestQueue = new RequestQueue();

// Use queue for all API requests
const result = await requestQueue.add(() => 
  fetch('/api/endpoint', { headers: { 'Authorization': `Bearer ${token}` } })
);
```

#### 4. OAuth Callback Issues

**Problem**: OAuth callback not working properly

**Solution**:
```javascript
// Ensure proper state validation
function generateOAuthState() {
  const state = crypto.randomBytes(32).toString('hex');
  sessionStorage.setItem('oauth_state', state);
  return state;
}

function validateOAuthState(receivedState) {
  const storedState = sessionStorage.getItem('oauth_state');
  sessionStorage.removeItem('oauth_state');
  
  if (!storedState || storedState !== receivedState) {
    throw new Error('Invalid OAuth state parameter');
  }
}

// Handle OAuth callback
async function handleOAuthCallback() {
  const urlParams = new URLSearchParams(window.location.search);
  const code = urlParams.get('code');
  const state = urlParams.get('state');
  const error = urlParams.get('error');

  if (error) {
    throw new Error(`OAuth error: ${error}`);
  }

  validateOAuthState(state);

  const response = await fetch('/oauth/google/callback', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, state })
  });

  if (!response.ok) {
    throw new Error('OAuth callback failed');
  }

  return await response.json();
}
```

### Debug Mode

```javascript
// Enable debug logging
class AuthService {
  constructor(config) {
    this.config = config;
    this.debug = config.debug || false;
  }

  log(...args) {
    if (this.debug) {
      console.log('[AuthService]', ...args);
    }
  }

  async makeRequest(url, options = {}) {
    this.log('Making request to:', url, options);
    
    const response = await fetch(url, options);
    
    this.log('Response status:', response.status);
    this.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    if (!response.ok) {
      const errorData = await response.json();
      this.log('Error response:', errorData);
      throw new Error(errorData.error.message);
    }
    
    const data = await response.json();
    this.log('Success response:', data);
    
    return data;
  }
}

// Usage with debug enabled
const auth = new AuthService({
  apiBaseUrl: 'https://api.romapi.com',
  debug: process.env.NODE_ENV === 'development'
});
```

## Migration Guide

### From v0.x to v1.x

#### Breaking Changes

1. **Token Format**: Tokens now use JWT format instead of opaque tokens
2. **Permission System**: New granular permission system
3. **Rate Limiting**: New rate limiting headers and behavior
4. **Error Format**: Standardized error response format

#### Migration Steps

```javascript
// Old v0.x code
const response = await fetch('/auth/login', {
  method: 'POST',
  body: JSON.stringify({ username, password }) // username -> email
});

const { token } = await response.json(); // token -> accessToken + refreshToken

// New v1.x code
const response = await fetch('/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password })
});

const { accessToken, refreshToken, expiresIn } = await response.json();

// Update token storage
localStorage.setItem('accessToken', accessToken);
localStorage.setItem('refreshToken', refreshToken);
localStorage.setItem('tokenExpiry', Date.now() + (expiresIn * 1000));
```

#### Permission Migration

```javascript
// Old v0.x permissions
const oldPermissions = ['read', 'write', 'admin'];

// New v1.x permissions (more granular)
const newPermissions = [
  'read:profile',
  'update:profile',
  'read:resources',
  'write:resources',
  'admin:users'
];

// Migration mapping
const permissionMapping = {
  'read': ['read:profile', 'read:resources'],
  'write': ['update:profile', 'write:resources'],
  'admin': ['admin:*']
};

function migratePermissions(oldPerms) {
  return oldPerms.flatMap(perm => permissionMapping[perm] || []);
}
```

### From Other Auth Providers

#### From Auth0

```javascript
// Auth0 to ROMAPI migration
class Auth0ToRomApiMigrator {
  constructor(auth0Domain, romApiConfig) {
    this.auth0 = new Auth0Client({ domain: auth0Domain });
    this.romApi = new RomApiAuth(romApiConfig);
  }

  async migrateUser(auth0UserId) {
    // Get user from Auth0
    const auth0User = await this.auth0.getUser(auth0UserId);
    
    // Create user in ROMAPI
    const romApiUser = await this.romApi.register({
      email: auth0User.email,
      name: auth0User.name,
      userType: 'INDIVIDUAL',
      // Don't migrate password - user will need to reset
      externalId: auth0User.sub
    });

    // Migrate user metadata
    await this.romApi.updateProfile(romApiUser.id, {
      metadata: auth0User.user_metadata
    });

    return romApiUser;
  }
}
```

#### From Firebase Auth

```javascript
// Firebase to ROMAPI migration
import { getAuth } from 'firebase/auth';

class FirebaseToRomApiMigrator {
  constructor(romApiConfig) {
    this.firebaseAuth = getAuth();
    this.romApi = new RomApiAuth(romApiConfig);
  }

  async migrateCurrentUser() {
    const firebaseUser = this.firebaseAuth.currentUser;
    
    if (!firebaseUser) {
      throw new Error('No Firebase user logged in');
    }

    // Create user in ROMAPI
    const romApiUser = await this.romApi.register({
      email: firebaseUser.email,
      name: firebaseUser.displayName,
      userType: 'INDIVIDUAL',
      emailVerified: firebaseUser.emailVerified,
      externalId: firebaseUser.uid
    });

    // Migrate custom claims as permissions
    const idTokenResult = await firebaseUser.getIdTokenResult();
    const customClaims = idTokenResult.claims;
    
    if (customClaims.permissions) {
      await this.romApi.updateUserPermissions(romApiUser.id, customClaims.permissions);
    }

    return romApiUser;
  }
}
```

---

## Support and Resources

- **API Documentation**: https://api.romapi.com/docs/auth
- **SDK Documentation**: https://docs.romapi.com/sdks
- **Support Email**: support@romapi.com
- **Community Forum**: https://community.romapi.com
- **Status Page**: https://status.romapi.com
- **GitHub**: https://github.com/romapi/auth-service

For additional help or custom integration support, please contact our support team.