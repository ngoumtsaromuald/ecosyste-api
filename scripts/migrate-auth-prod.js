#!/usr/bin/env node

/**
 * Production migration script specifically for Auth System
 * Handles auth-related database migrations with enhanced security and validation
 */

const { execSync } = require('child_process');
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
  const timestamp = new Date().toISOString();
  console.log(`${colors[color]}[${timestamp}] ${message}${colors.reset}`);
};

// Configuration
const config = {
  environment: process.env.NODE_ENV || 'production',
  databaseUrl: process.env.DATABASE_URL,
  backupDir: `./backups/auth-migration-${new Date().toISOString().replace(/[:.]/g, '-')}`,
  logFile: `./logs/auth-migration-${new Date().toISOString().replace(/[:.]/g, '-')}.log`
};

// Ensure logs directory exists
if (!fs.existsSync('./logs')) {
  fs.mkdirSync('./logs', { recursive: true });
}

// Setup logging to file
const logToFile = (message) => {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  fs.appendFileSync(config.logFile, logMessage);
};

// Enhanced logging function
const logBoth = (message, color = 'reset') => {
  log(message, color);
  logToFile(message);
};

// Validate auth-specific environment variables
const validateAuthEnvironment = () => {
  logBoth('🔍 Validating auth environment variables...', 'blue');
  
  const requiredVars = [
    'DATABASE_URL',
    'JWT_SECRET',
    'JWT_REFRESH_SECRET',
    'REDIS_HOST',
    'REDIS_PORT'
  ];
  
  const missingVars = [];
  const weakSecrets = [];
  
  for (const varName of requiredVars) {
    const value = process.env[varName];
    
    if (!value) {
      missingVars.push(varName);
    } else if (varName.includes('SECRET') && value.length < 32) {
      weakSecrets.push(varName);
    }
  }
  
  if (missingVars.length > 0) {
    logBoth(`❌ Missing required environment variables: ${missingVars.join(', ')}`, 'red');
    process.exit(1);
  }
  
  if (weakSecrets.length > 0) {
    logBoth(`⚠️  Weak secrets detected (less than 32 characters): ${weakSecrets.join(', ')}`, 'yellow');
    logBoth('Consider using stronger secrets for production', 'yellow');
  }
  
  // Validate JWT secrets are different
  if (process.env.JWT_SECRET === process.env.JWT_REFRESH_SECRET) {
    logBoth('⚠️  JWT_SECRET and JWT_REFRESH_SECRET should be different', 'yellow');
  }
  
  logBoth('✅ Auth environment validation passed', 'green');
};

// Test Redis connectivity
const testRedisConnection = async () => {
  logBoth('🔄 Testing Redis connectivity...', 'blue');
  
  try {
    const Redis = require('ioredis');
    const redis = new Redis({
      host: process.env.REDIS_HOST,
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      db: parseInt(process.env.REDIS_DB || '0'),
      connectTimeout: 5000,
      lazyConnect: true
    });
    
    await redis.connect();
    await redis.ping();
    
    // Test auth-specific operations
    const testKey = `auth_migration_test_${Date.now()}`;
    await redis.set(testKey, 'test_value', 'EX', 10);
    const value = await redis.get(testKey);
    await redis.del(testKey);
    
    if (value !== 'test_value') {
      throw new Error('Redis read/write test failed');
    }
    
    await redis.disconnect();
    logBoth('✅ Redis connectivity test passed', 'green');
    
  } catch (error) {
    logBoth(`❌ Redis connectivity test failed: ${error.message}`, 'red');
    throw error;
  }
};

// Validate SMTP configuration for production
const validateSMTPConfig = async () => {
  logBoth('📧 Validating SMTP configuration...', 'blue');
  
  const smtpConfig = {
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  };
  
  if (!smtpConfig.host || !smtpConfig.user || !smtpConfig.pass) {
    logBoth('⚠️  SMTP configuration incomplete - email features may not work', 'yellow');
    return;
  }
  
  try {
    const nodemailer = require('nodemailer');
    const transporter = nodemailer.createTransporter({
      host: smtpConfig.host,
      port: smtpConfig.port,
      secure: smtpConfig.secure,
      auth: {
        user: smtpConfig.user,
        pass: smtpConfig.pass
      },
      tls: {
        rejectUnauthorized: process.env.SMTP_TLS_REJECT_UNAUTHORIZED !== 'false',
        minVersion: process.env.SMTP_TLS_MIN_VERSION || 'TLSv1.2'
      }
    });
    
    await transporter.verify();
    logBoth('✅ SMTP configuration validated', 'green');
    
  } catch (error) {
    logBoth(`⚠️  SMTP validation failed: ${error.message}`, 'yellow');
    logBoth('Email features may not work properly', 'yellow');
  }
};

// Create enhanced backup with auth-specific data
const createAuthBackup = () => {
  logBoth('📦 Creating auth-specific database backup...', 'yellow');
  
  try {
    fs.mkdirSync(config.backupDir, { recursive: true });
    
    // Full database backup
    const fullBackupFile = path.join(config.backupDir, 'full_database_backup.sql');
    execSync(`pg_dump "${config.databaseUrl}" > "${fullBackupFile}"`, { stdio: 'inherit' });
    
    // Auth-specific tables backup
    const authTables = [
      'users',
      'sessions',
      'api_keys',
      'oauth_accounts',
      'password_resets',
      'audit_logs'
    ];
    
    const authBackupFile = path.join(config.backupDir, 'auth_tables_backup.sql');
    const tablesArg = authTables.map(table => `-t ${table}`).join(' ');
    execSync(`pg_dump "${config.databaseUrl}" ${tablesArg} > "${authBackupFile}"`, { stdio: 'inherit' });
    
    // Create backup metadata
    const metadata = {
      timestamp: new Date().toISOString(),
      environment: config.environment,
      authTables: authTables,
      backupFiles: {
        full: fullBackupFile,
        authOnly: authBackupFile
      }
    };
    
    fs.writeFileSync(
      path.join(config.backupDir, 'backup_metadata.json'),
      JSON.stringify(metadata, null, 2)
    );
    
    logBoth(`✅ Auth database backup created: ${config.backupDir}`, 'green');
    return config.backupDir;
    
  } catch (error) {
    logBoth(`⚠️  Backup failed: ${error.message}`, 'yellow');
    logBoth('Continuing without backup...', 'yellow');
    return null;
  }
};

// Run auth-specific migrations
const runAuthMigrations = () => {
  logBoth('🚀 Running auth system migrations...', 'blue');
  
  try {
    // Generate Prisma client
    logBoth('Generating Prisma client...', 'blue');
    execSync('npx prisma generate', { stdio: 'inherit' });
    
    // Deploy migrations
    logBoth('Deploying database migrations...', 'blue');
    execSync('npx prisma migrate deploy', { stdio: 'inherit' });
    
    logBoth('✅ Auth migrations completed successfully', 'green');
    
  } catch (error) {
    logBoth(`❌ Migration failed: ${error.message}`, 'red');
    throw error;
  }
};

// Verify auth system integrity
const verifyAuthSystem = async () => {
  logBoth('🔍 Verifying auth system integrity...', 'blue');
  
  try {
    // Check database schema
    execSync('npx prisma migrate status', { stdio: 'inherit' });
    
    // Test Redis connection
    await testRedisConnection();
    
    // Validate SMTP
    await validateSMTPConfig();
    
    logBoth('✅ Auth system integrity verified', 'green');
    
  } catch (error) {
    logBoth(`⚠️  Auth system verification failed: ${error.message}`, 'yellow');
    throw error;
  }
};

// Setup security logging
const setupSecurityLogging = () => {
  logBoth('🔒 Setting up security logging...', 'blue');
  
  try {
    const securityLogDir = './logs/security';
    if (!fs.existsSync(securityLogDir)) {
      fs.mkdirSync(securityLogDir, { recursive: true });
    }
    
    // Create security log configuration
    const securityLogConfig = {
      enabled: process.env.AUDIT_LOG_ENABLED === 'true',
      level: process.env.AUDIT_LOG_LEVEL || 'info',
      retentionDays: parseInt(process.env.AUDIT_LOG_RETENTION_DAYS || '90'),
      alertThreshold: parseInt(process.env.FAILED_LOGIN_ALERT_THRESHOLD || '10'),
      logFile: process.env.SECURITY_LOG_FILE || './logs/security/auth.log'
    };
    
    fs.writeFileSync(
      path.join(securityLogDir, 'config.json'),
      JSON.stringify(securityLogConfig, null, 2)
    );
    
    logBoth('✅ Security logging configured', 'green');
    
  } catch (error) {
    logBoth(`⚠️  Security logging setup failed: ${error.message}`, 'yellow');
  }
};

// Main migration process
const main = async () => {
  logBoth('🚀 Starting auth system production migration...', 'green');
  logBoth(`Environment: ${config.environment}`, 'blue');
  logBoth(`Log file: ${config.logFile}`, 'blue');
  
  let backupDir = null;
  
  try {
    // Validate environment
    validateAuthEnvironment();
    
    // Create backup
    backupDir = createAuthBackup();
    
    // Setup security logging
    setupSecurityLogging();
    
    // Run migrations
    runAuthMigrations();
    
    // Verify system
    await verifyAuthSystem();
    
    logBoth('🎉 Auth system migration completed successfully!', 'green');
    logBoth(`📋 Migration log: ${config.logFile}`, 'blue');
    
    if (backupDir) {
      logBoth(`📦 Backup location: ${backupDir}`, 'blue');
    }
    
  } catch (error) {
    logBoth(`❌ Auth migration failed: ${error.message}`, 'red');
    
    if (backupDir) {
      logBoth(`💾 Backup available for rollback: ${backupDir}`, 'yellow');
    }
    
    process.exit(1);
  }
};

// Handle command line arguments
const command = process.argv[2];

switch (command) {
  case 'validate':
    validateAuthEnvironment();
    break;
    
  case 'test-redis':
    testRedisConnection().catch(console.error);
    break;
    
  case 'test-smtp':
    validateSMTPConfig().catch(console.error);
    break;
    
  case 'backup':
    createAuthBackup();
    break;
    
  case 'verify':
    verifyAuthSystem().catch(console.error);
    break;
    
  default:
    main();
    break;
}

module.exports = {
  validateAuthEnvironment,
  testRedisConnection,
  validateSMTPConfig,
  createAuthBackup,
  runAuthMigrations,
  verifyAuthSystem,
  setupSecurityLogging
};