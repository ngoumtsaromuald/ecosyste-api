#!/usr/bin/env node

/**
 * Production migration script for ROMAPI Backend Core
 * This script handles database migrations in production environment
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

const log = (message, color = 'reset') => {
  console.log(`${colors[color]}${message}${colors.reset}`);
};

// Configuration
const config = {
  environment: process.env.NODE_ENV || 'production',
  databaseUrl: process.env.DATABASE_URL,
  backupDir: `./backups/${new Date().toISOString().replace(/[:.]/g, '-')}`
};

// Validate environment
const validateEnvironment = () => {
  log('🔍 Validating environment...', 'blue');
  
  if (!config.databaseUrl) {
    log('❌ DATABASE_URL environment variable is required', 'red');
    process.exit(1);
  }
  
  if (!fs.existsSync('./prisma/schema.prisma')) {
    log('❌ Prisma schema not found', 'red');
    process.exit(1);
  }
  
  log('✅ Environment validation passed', 'green');
};

// Create backup
const createBackup = () => {
  log('📦 Creating database backup...', 'yellow');
  
  try {
    // Create backup directory
    fs.mkdirSync(config.backupDir, { recursive: true });
    
    // Create database backup using pg_dump
    const backupFile = path.join(config.backupDir, 'database_backup.sql');
    execSync(`pg_dump "${config.databaseUrl}" > "${backupFile}"`, { stdio: 'inherit' });
    
    log(`✅ Database backup created: ${backupFile}`, 'green');
    return backupFile;
  } catch (error) {
    log(`⚠️  Backup failed: ${error.message}`, 'yellow');
    log('Continuing without backup...', 'yellow');
    return null;
  }
};

// Generate Prisma client
const generatePrismaClient = () => {
  log('🔄 Generating Prisma client...', 'blue');
  
  try {
    execSync('npx prisma generate', { stdio: 'inherit' });
    log('✅ Prisma client generated', 'green');
  } catch (error) {
    log(`❌ Failed to generate Prisma client: ${error.message}`, 'red');
    process.exit(1);
  }
};

// Run migrations
const runMigrations = () => {
  log('🚀 Running database migrations...', 'blue');
  
  try {
    // Deploy migrations (production-safe)
    execSync('npx prisma migrate deploy', { stdio: 'inherit' });
    log('✅ Database migrations completed successfully', 'green');
  } catch (error) {
    log(`❌ Migration failed: ${error.message}`, 'red');
    throw error;
  }
};

// Verify migration status
const verifyMigrations = () => {
  log('🔍 Verifying migration status...', 'blue');
  
  try {
    execSync('npx prisma migrate status', { stdio: 'inherit' });
    log('✅ Migration status verified', 'green');
  } catch (error) {
    log(`⚠️  Migration status check failed: ${error.message}`, 'yellow');
  }
};

// Rollback function
const rollback = (backupFile) => {
  if (!backupFile || !fs.existsSync(backupFile)) {
    log('❌ No backup file available for rollback', 'red');
    return false;
  }
  
  log('🔄 Rolling back database...', 'yellow');
  
  try {
    execSync(`psql "${config.databaseUrl}" < "${backupFile}"`, { stdio: 'inherit' });
    log('✅ Database rollback completed', 'green');
    return true;
  } catch (error) {
    log(`❌ Rollback failed: ${error.message}`, 'red');
    return false;
  }
};

// Main migration process
const main = async () => {
  log('🚀 Starting production migration process...', 'green');
  log(`Environment: ${config.environment}`, 'blue');
  
  let backupFile = null;
  
  try {
    // Validate environment
    validateEnvironment();
    
    // Create backup
    backupFile = createBackup();
    
    // Generate Prisma client
    generatePrismaClient();
    
    // Run migrations
    runMigrations();
    
    // Verify migrations
    verifyMigrations();
    
    log('🎉 Migration process completed successfully!', 'green');
    
  } catch (error) {
    log(`❌ Migration process failed: ${error.message}`, 'red');
    
    // Attempt rollback if backup exists
    if (backupFile) {
      log('🔄 Attempting automatic rollback...', 'yellow');
      const rollbackSuccess = rollback(backupFile);
      
      if (rollbackSuccess) {
        log('✅ Rollback completed successfully', 'green');
      } else {
        log('❌ Rollback failed - manual intervention required', 'red');
      }
    }
    
    process.exit(1);
  }
};

// Handle command line arguments
const command = process.argv[2];

switch (command) {
  case 'rollback':
    const backupPath = process.argv[3];
    if (!backupPath) {
      log('❌ Please provide backup file path for rollback', 'red');
      log('Usage: node migrate-prod.js rollback <backup-file-path>', 'blue');
      process.exit(1);
    }
    rollback(backupPath);
    break;
    
  case 'status':
    verifyMigrations();
    break;
    
  case 'generate':
    generatePrismaClient();
    break;
    
  default:
    main();
    break;
}

module.exports = {
  validateEnvironment,
  createBackup,
  generatePrismaClient,
  runMigrations,
  verifyMigrations,
  rollback
};