#!/usr/bin/env node

/**
 * Production environment validation script for Auth System
 * Validates all auth-related configurations before deployment
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Colors for console output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  reset: '\x1b[0m'
};

const log = (message, color = 'reset') => {
  console.log(`${colors[color]}${message}${colors.reset}`);
};

// Validation results
const results = {
  passed: [],
  warnings: [],
  errors: []
};

// Add result
const addResult = (type, message) => {
  results[type].push(message);
  const colorMap = { passed: 'green', warnings: 'yellow', errors: 'red' };
  const iconMap = { passed: '✅', warnings: '⚠️ ', errors: '❌' };
  log(`${iconMap[type]} ${message}`, colorMap[type]);
};

// Validate environment variables
const validateEnvironmentVariables = () => {
  log('🔍 Validating environment variables...', 'blue');
  
  const requiredVars = {
    // Database
    'DATABASE_URL': { required: true, sensitive: true },
    'DB_HOST': { required: true },
    'DB_PORT': { required: true, type: 'number' },
    'DB_USERNAME': { required: true },
    'DB_PASSWORD': { required: true, sensitive: true, minLength: 8 },
    'DB_NAME': { required: true },
    
    // Redis
    'REDIS_HOST': { required: true },
    'REDIS_PORT': { required: true, type: 'number' },
    'REDIS_PASSWORD': { required: true, sensitive: true, minLength: 8 },
    
    // JWT
    'JWT_SECRET': { required: true, sensitive: true, minLength: 32 },
    'JWT_REFRESH_SECRET': { required: true, sensitive: true, minLength: 32 },
    'JWT_ACCESS_EXPIRES': { required: true },
    'JWT_REFRESH_EXPIRES': { required: true },
    
    // Email
    'SMTP_HOST': { required: true },
    'SMTP_PORT': { required: true, type: 'number' },
    'SMTP_USER': { required: true },
    'SMTP_PASS': { required: true, sensitive: true },
    'EMAIL_FROM': { required: true, pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
    
    // OAuth2
    'GOOGLE_CLIENT_ID': { required: false },
    'GOOGLE_CLIENT_SECRET': { required: false, sensitive: true },
    'GITHUB_CLIENT_ID': { required: false },
    'GITHUB_CLIENT_SECRET': { required: false, sensitive: true },
    'LINKEDIN_CLIENT_ID': { required: false },
    'LINKEDIN_CLIENT_SECRET': { required: false, sensitive: true },
    
    // URLs
    'FRONTEND_URL': { required: true, pattern: /^https?:\/\/.+/ },
    'OAUTH_CALLBACK_URL': { required: true, pattern: /^https?:\/\/.+/ },
    
    // Security
    'BCRYPT_ROUNDS': { required: true, type: 'number', min: 10, max: 15 },
    'MAX_LOGIN_ATTEMPTS': { required: true, type: 'number', min: 3, max: 10 },
    'ACCOUNT_LOCKOUT_DURATION': { required: true }
  };
  
  for (const [varName, config] of Object.entries(requiredVars)) {
    const value = process.env[varName];
    
    if (config.required && !value) {
      addResult('errors', `Missing required environment variable: ${varName}`);
      continue;
    }
    
    if (!value) {
      if (varName.includes('OAUTH')) {
        addResult('warnings', `Optional OAuth variable not set: ${varName}`);
      }
      continue;
    }
    
    // Type validation
    if (config.type === 'number') {
      const numValue = parseInt(value);
      if (isNaN(numValue)) {
        addResult('errors', `${varName} must be a number, got: ${value}`);
        continue;
      }
      
      if (config.min && numValue < config.min) {
        addResult('errors', `${varName} must be at least ${config.min}, got: ${numValue}`);
        continue;
      }
      
      if (config.max && numValue > config.max) {
        addResult('warnings', `${varName} is higher than recommended maximum ${config.max}: ${numValue}`);
      }
    }
    
    // Length validation
    if (config.minLength && value.length < config.minLength) {
      addResult('errors', `${varName} must be at least ${config.minLength} characters long`);
      continue;
    }
    
    // Pattern validation
    if (config.pattern && !config.pattern.test(value)) {
      addResult('errors', `${varName} format is invalid: ${value}`);
      continue;
    }
    
    // Sensitive data validation
    if (config.sensitive) {
      if (value.includes('example') || value.includes('changeme') || value.includes('password')) {
        addResult('errors', `${varName} appears to contain placeholder value`);
        continue;
      }
    }
    
    addResult('passed', `${varName} is properly configured`);
  }
  
  // Cross-validation
  if (process.env.JWT_SECRET === process.env.JWT_REFRESH_SECRET) {
    addResult('warnings', 'JWT_SECRET and JWT_REFRESH_SECRET should be different');
  }
  
  if (process.env.NODE_ENV !== 'production') {
    addResult('warnings', `NODE_ENV is not set to production: ${process.env.NODE_ENV}`);
  }
};

// Validate SSL/TLS configuration
const validateSSLConfiguration = () => {
  log('🔒 Validating SSL/TLS configuration...', 'blue');
  
  const smtpSecure = process.env.SMTP_SECURE === 'true';
  const smtpPort = parseInt(process.env.SMTP_PORT || '587');
  
  if (!smtpSecure && smtpPort === 465) {
    addResult('warnings', 'SMTP port 465 typically requires SMTP_SECURE=true');
  }
  
  if (smtpSecure && smtpPort === 587) {
    addResult('warnings', 'SMTP port 587 typically uses STARTTLS, not direct SSL');
  }
  
  const tlsRejectUnauthorized = process.env.SMTP_TLS_REJECT_UNAUTHORIZED !== 'false';
  if (!tlsRejectUnauthorized) {
    addResult('warnings', 'SMTP_TLS_REJECT_UNAUTHORIZED is disabled - this reduces security');
  } else {
    addResult('passed', 'SMTP TLS certificate validation is enabled');
  }
  
  const tlsMinVersion = process.env.SMTP_TLS_MIN_VERSION || 'TLSv1.2';
  if (tlsMinVersion < 'TLSv1.2') {
    addResult('warnings', `SMTP TLS minimum version is below recommended TLSv1.2: ${tlsMinVersion}`);
  } else {
    addResult('passed', `SMTP TLS minimum version is secure: ${tlsMinVersion}`);
  }
  
  // Check if HTTPS is enforced
  const frontendUrl = process.env.FRONTEND_URL;
  const callbackUrl = process.env.OAUTH_CALLBACK_URL;
  
  if (frontendUrl && !frontendUrl.startsWith('https://')) {
    addResult('warnings', 'FRONTEND_URL should use HTTPS in production');
  } else if (frontendUrl) {
    addResult('passed', 'FRONTEND_URL uses HTTPS');
  }
  
  if (callbackUrl && !callbackUrl.startsWith('https://')) {
    addResult('warnings', 'OAUTH_CALLBACK_URL should use HTTPS in production');
  } else if (callbackUrl) {
    addResult('passed', 'OAUTH_CALLBACK_URL uses HTTPS');
  }
};

// Validate security settings
const validateSecuritySettings = () => {
  log('🛡️  Validating security settings...', 'blue');
  
  const bcryptRounds = parseInt(process.env.BCRYPT_ROUNDS || '12');
  if (bcryptRounds < 12) {
    addResult('warnings', `BCRYPT_ROUNDS is below recommended minimum of 12: ${bcryptRounds}`);
  } else if (bcryptRounds > 15) {
    addResult('warnings', `BCRYPT_ROUNDS is very high and may impact performance: ${bcryptRounds}`);
  } else {
    addResult('passed', `BCRYPT_ROUNDS is appropriately configured: ${bcryptRounds}`);
  }
  
  const maxLoginAttempts = parseInt(process.env.MAX_LOGIN_ATTEMPTS || '5');
  if (maxLoginAttempts < 3) {
    addResult('warnings', `MAX_LOGIN_ATTEMPTS is very low: ${maxLoginAttempts}`);
  } else if (maxLoginAttempts > 10) {
    addResult('warnings', `MAX_LOGIN_ATTEMPTS is very high: ${maxLoginAttempts}`);
  } else {
    addResult('passed', `MAX_LOGIN_ATTEMPTS is appropriately configured: ${maxLoginAttempts}`);
  }
  
  // Check CORS origins
  const corsOrigins = process.env.CORS_ORIGINS;
  if (corsOrigins) {
    const origins = corsOrigins.split(',').map(o => o.trim());
    const hasWildcard = origins.includes('*');
    const hasLocalhost = origins.some(o => o.includes('localhost') || o.includes('127.0.0.1'));
    
    if (hasWildcard) {
      addResult('errors', 'CORS_ORIGINS contains wildcard (*) - this is insecure for production');
    } else {
      addResult('passed', 'CORS_ORIGINS does not contain wildcard');
    }
    
    if (hasLocalhost) {
      addResult('warnings', 'CORS_ORIGINS contains localhost URLs - remove for production');
    }
  } else {
    addResult('warnings', 'CORS_ORIGINS is not configured');
  }
  
  // Check rate limiting
  const rateLimitMax = parseInt(process.env.RATE_LIMIT_MAX || '100');
  if (rateLimitMax < 100) {
    addResult('warnings', `RATE_LIMIT_MAX is very restrictive: ${rateLimitMax}`);
  } else if (rateLimitMax > 10000) {
    addResult('warnings', `RATE_LIMIT_MAX is very permissive: ${rateLimitMax}`);
  } else {
    addResult('passed', `RATE_LIMIT_MAX is appropriately configured: ${rateLimitMax}`);
  }
};

// Validate file permissions and directories
const validateFileSystem = () => {
  log('📁 Validating file system configuration...', 'blue');
  
  const requiredDirs = ['./logs', './logs/security', './backups'];
  
  for (const dir of requiredDirs) {
    try {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        addResult('passed', `Created required directory: ${dir}`);
      } else {
        addResult('passed', `Directory exists: ${dir}`);
      }
      
      // Check write permissions
      const testFile = path.join(dir, 'test-write.tmp');
      fs.writeFileSync(testFile, 'test');
      fs.unlinkSync(testFile);
      addResult('passed', `Write permissions OK for: ${dir}`);
      
    } catch (error) {
      addResult('errors', `Cannot write to directory ${dir}: ${error.message}`);
    }
  }
  
  // Check Prisma schema exists
  if (fs.existsSync('./prisma/schema.prisma')) {
    addResult('passed', 'Prisma schema file exists');
  } else {
    addResult('errors', 'Prisma schema file not found');
  }
  
  // Check if sensitive files are properly protected
  const sensitiveFiles = ['.env', '.env.production', 'config/security/secrets.env'];
  
  for (const file of sensitiveFiles) {
    if (fs.existsSync(file)) {
      try {
        const stats = fs.statSync(file);
        const mode = stats.mode & parseInt('777', 8);
        
        if (mode > parseInt('600', 8)) {
          addResult('warnings', `File ${file} has overly permissive permissions: ${mode.toString(8)}`);
        } else {
          addResult('passed', `File ${file} has appropriate permissions`);
        }
      } catch (error) {
        addResult('warnings', `Cannot check permissions for ${file}: ${error.message}`);
      }
    }
  }
};

// Validate OAuth2 configuration
const validateOAuth2Configuration = () => {
  log('🔐 Validating OAuth2 configuration...', 'blue');
  
  const providers = [
    { name: 'Google', clientId: 'GOOGLE_CLIENT_ID', clientSecret: 'GOOGLE_CLIENT_SECRET' },
    { name: 'GitHub', clientId: 'GITHUB_CLIENT_ID', clientSecret: 'GITHUB_CLIENT_SECRET' },
    { name: 'LinkedIn', clientId: 'LINKEDIN_CLIENT_ID', clientSecret: 'LINKEDIN_CLIENT_SECRET' }
  ];
  
  let configuredProviders = 0;
  
  for (const provider of providers) {
    const clientId = process.env[provider.clientId];
    const clientSecret = process.env[provider.clientSecret];
    
    if (clientId && clientSecret) {
      configuredProviders++;
      
      // Basic validation
      if (clientId.includes('example') || clientSecret.includes('example')) {
        addResult('errors', `${provider.name} OAuth2 credentials appear to be placeholder values`);
      } else {
        addResult('passed', `${provider.name} OAuth2 is properly configured`);
      }
    } else if (clientId || clientSecret) {
      addResult('warnings', `${provider.name} OAuth2 is partially configured (missing ${clientId ? 'secret' : 'client ID'})`);
    }
  }
  
  if (configuredProviders === 0) {
    addResult('warnings', 'No OAuth2 providers are configured');
  } else {
    addResult('passed', `${configuredProviders} OAuth2 provider(s) configured`);
  }
};

// Generate security report
const generateSecurityReport = () => {
  log('📊 Generating security report...', 'blue');
  
  const report = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'unknown',
    summary: {
      passed: results.passed.length,
      warnings: results.warnings.length,
      errors: results.errors.length,
      total: results.passed.length + results.warnings.length + results.errors.length
    },
    details: results,
    recommendations: []
  };
  
  // Add recommendations based on results
  if (results.errors.length > 0) {
    report.recommendations.push('Fix all error conditions before deploying to production');
  }
  
  if (results.warnings.length > 0) {
    report.recommendations.push('Review and address warning conditions for optimal security');
  }
  
  if (results.passed.length === 0) {
    report.recommendations.push('No validations passed - check environment configuration');
  }
  
  // Save report
  const reportFile = `./logs/auth-validation-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
  fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
  
  log(`📋 Security report saved: ${reportFile}`, 'blue');
  
  return report;
};

// Main validation process
const main = () => {
  log('🚀 Starting auth system production validation...', 'green');
  log(`Environment: ${process.env.NODE_ENV || 'unknown'}`, 'blue');
  
  try {
    validateEnvironmentVariables();
    validateSSLConfiguration();
    validateSecuritySettings();
    validateFileSystem();
    validateOAuth2Configuration();
    
    const report = generateSecurityReport();
    
    // Print summary
    log('\n📊 Validation Summary:', 'blue');
    log(`✅ Passed: ${report.summary.passed}`, 'green');
    log(`⚠️  Warnings: ${report.summary.warnings}`, 'yellow');
    log(`❌ Errors: ${report.summary.errors}`, 'red');
    
    if (report.summary.errors > 0) {
      log('\n❌ Validation failed - fix errors before deployment', 'red');
      process.exit(1);
    } else if (report.summary.warnings > 0) {
      log('\n⚠️  Validation passed with warnings - review before deployment', 'yellow');
      process.exit(0);
    } else {
      log('\n🎉 All validations passed - ready for production deployment!', 'green');
      process.exit(0);
    }
    
  } catch (error) {
    log(`❌ Validation process failed: ${error.message}`, 'red');
    process.exit(1);
  }
};

// Handle command line arguments
const command = process.argv[2];

switch (command) {
  case 'env':
    validateEnvironmentVariables();
    break;
    
  case 'ssl':
    validateSSLConfiguration();
    break;
    
  case 'security':
    validateSecuritySettings();
    break;
    
  case 'filesystem':
    validateFileSystem();
    break;
    
  case 'oauth':
    validateOAuth2Configuration();
    break;
    
  case 'report':
    generateSecurityReport();
    break;
    
  default:
    main();
    break;
}

module.exports = {
  validateEnvironmentVariables,
  validateSSLConfiguration,
  validateSecuritySettings,
  validateFileSystem,
  validateOAuth2Configuration,
  generateSecurityReport
};