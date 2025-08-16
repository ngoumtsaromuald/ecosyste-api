import { ConfigService } from '@nestjs/config';

export interface SecurityConfig {
  helmet: HelmetConfig;
  cors: CorsConfig;
  rateLimit: RateLimitConfig;
  jwt: JwtConfig;
  encryption: EncryptionConfig;
  ssl: SslConfig;
}

export interface HelmetConfig {
  enabled: boolean;
  contentSecurityPolicy: {
    enabled: boolean;
    directives: Record<string, string[]>;
  };
  hsts: {
    enabled: boolean;
    maxAge: number;
    includeSubDomains: boolean;
    preload: boolean;
  };
}

export interface CorsConfig {
  enabled: boolean;
  origins: string[];
  methods: string[];
  allowedHeaders: string[];
  credentials: boolean;
}

export interface RateLimitConfig {
  enabled: boolean;
  windowMs: number;
  max: number;
  skipSuccessfulRequests: boolean;
  skipFailedRequests: boolean;
}

export interface JwtConfig {
  secret: string;
  expiresIn: string;
  algorithm: string;
  issuer: string;
  audience: string;
}

export interface EncryptionConfig {
  algorithm: string;
  keyLength: number;
  ivLength: number;
}

export interface SslConfig {
  enabled: boolean;
  certPath?: string;
  keyPath?: string;
  redirectHttp: boolean;
}

export const getSecurityConfig = (configService: ConfigService): SecurityConfig => {
  const nodeEnv = configService.get<string>('nodeEnv', 'development');
  const isProduction = nodeEnv === 'production';

  return {
    helmet: {
      enabled: configService.get<boolean>('security.helmetEnabled', isProduction),
      contentSecurityPolicy: {
        enabled: isProduction,
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
          fontSrc: ["'self'", 'https://fonts.gstatic.com'],
          imgSrc: ["'self'", 'data:', 'https:'],
          scriptSrc: ["'self'"],
          connectSrc: ["'self'"],
          frameSrc: ["'none'"],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'"],
          manifestSrc: ["'self'"],
          workerSrc: ["'self'"],
        },
      },
      hsts: {
        enabled: isProduction,
        maxAge: 31536000, // 1 year
        includeSubDomains: true,
        preload: true,
      },
    },

    cors: {
      enabled: true,
      origins: configService.get<string[]>('api.corsOrigins', ['http://localhost:3000']),
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: [
        'Origin',
        'X-Requested-With',
        'Content-Type',
        'Accept',
        'Authorization',
        'X-API-Key',
        'X-Request-ID',
      ],
      credentials: true,
    },

    rateLimit: {
      enabled: true,
      windowMs: configService.get<number>('rateLimit.ttl', 60000),
      max: configService.get<number>('rateLimit.limit', isProduction ? 1000 : 100),
      skipSuccessfulRequests: false,
      skipFailedRequests: false,
    },

    jwt: {
      secret: configService.get<string>('jwt.secret'),
      expiresIn: configService.get<string>('jwt.expiresIn', '24h'),
      algorithm: 'HS256',
      issuer: 'romapi-core',
      audience: 'romapi-clients',
    },

    encryption: {
      algorithm: 'aes-256-gcm',
      keyLength: 32,
      ivLength: 16,
    },

    ssl: {
      enabled: configService.get<boolean>('ssl.enabled', false),
      certPath: process.env.SSL_CERT_PATH,
      keyPath: process.env.SSL_KEY_PATH,
      redirectHttp: isProduction,
    },
  };
};

// Security middleware configuration
export const getHelmetConfig = (securityConfig: SecurityConfig) => {
  if (!securityConfig.helmet.enabled) {
    return false;
  }

  return {
    contentSecurityPolicy: securityConfig.helmet.contentSecurityPolicy.enabled
      ? { directives: securityConfig.helmet.contentSecurityPolicy.directives }
      : false,
    hsts: securityConfig.helmet.hsts.enabled
      ? {
          maxAge: securityConfig.helmet.hsts.maxAge,
          includeSubDomains: securityConfig.helmet.hsts.includeSubDomains,
          preload: securityConfig.helmet.hsts.preload,
        }
      : false,
    crossOriginEmbedderPolicy: false, // Disable for API compatibility
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    xssFilter: true,
    noSniff: true,
    frameguard: { action: 'deny' },
    hidePoweredBy: true,
  };
};

// CORS configuration
export const getCorsConfig = (securityConfig: SecurityConfig) => {
  if (!securityConfig.cors.enabled) {
    return false;
  }

  return {
    origin: (origin: string, callback: (error: Error | null, allow?: boolean) => void) => {
      // Allow requests with no origin (mobile apps, Postman, etc.)
      if (!origin) return callback(null, true);

      if (securityConfig.cors.origins.includes(origin) || 
          securityConfig.cors.origins.includes('*')) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'), false);
      }
    },
    methods: securityConfig.cors.methods,
    allowedHeaders: securityConfig.cors.allowedHeaders,
    credentials: securityConfig.cors.credentials,
    optionsSuccessStatus: 200,
  };
};

// Input validation and sanitization
export const sanitizeInput = (input: string): string => {
  if (typeof input !== 'string') return '';
  
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .substring(0, 1000); // Limit length
};

// Password strength validation
export const validatePasswordStrength = (password: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
};

// Generate secure random string
export const generateSecureToken = (length: number = 32): string => {
  const crypto = require('crypto');
  return crypto.randomBytes(length).toString('hex');
};

// Hash sensitive data
export const hashSensitiveData = (data: string): string => {
  const crypto = require('crypto');
  return crypto.createHash('sha256').update(data).digest('hex');
};