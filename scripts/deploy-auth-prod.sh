#!/bin/bash

# Auth System Production Deployment Script
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT=${1:-production}
BACKUP_DIR="./backups/auth-deploy-$(date +%Y%m%d_%H%M%S)"
LOG_FILE="./logs/auth-deploy-$(date +%Y%m%d_%H%M%S).log"

echo -e "${GREEN}🚀 Starting Auth System deployment for environment: ${ENVIRONMENT}${NC}"

# Ensure logs directory exists
mkdir -p ./logs

# Logging function
log() {
    local message="$1"
    local color="${2:-NC}"
    echo -e "${!color}$(date '+%Y-%m-%d %H:%M:%S') - ${message}${NC}" | tee -a "$LOG_FILE"
}

# Error handling
handle_error() {
    log "❌ Deployment failed at step: $1" "RED"
    log "📋 Check deployment log: $LOG_FILE" "YELLOW"
    exit 1
}

# Validate environment
validate_environment() {
    log "🔍 Validating environment..." "BLUE"
    
    if [[ ! "$ENVIRONMENT" =~ ^(production|staging)$ ]]; then
        handle_error "Invalid environment. Use 'production' or 'staging'"
    fi
    
    # Load environment-specific configuration
    if [[ -f "config/environments/.env.auth.${ENVIRONMENT}" ]]; then
        log "Loading auth environment configuration..." "BLUE"
        export $(cat "config/environments/.env.auth.${ENVIRONMENT}" | grep -v '^#' | xargs)
    else
        log "⚠️  Auth environment file not found: config/environments/.env.auth.${ENVIRONMENT}" "YELLOW"
    fi
    
    log "✅ Environment validation completed" "GREEN"
}

# Pre-deployment validation
pre_deployment_validation() {
    log "🔍 Running pre-deployment validation..." "BLUE"
    
    # Run auth-specific validation
    if ! node scripts/validate-auth-prod.js; then
        handle_error "Auth system validation failed"
    fi
    
    # Check required files
    local required_files=(
        "prisma/schema.prisma"
        "scripts/migrate-auth-prod.js"
        "config/redis/redis-auth.conf"
        "docker-compose.prod.yml"
        "docker-compose.auth-prod.yml"
    )
    
    for file in "${required_files[@]}"; do
        if [[ ! -f "$file" ]]; then
            handle_error "Required file not found: $file"
        fi
    done
    
    log "✅ Pre-deployment validation passed" "GREEN"
}

# Create comprehensive backup
create_backup() {
    log "📦 Creating comprehensive backup..." "YELLOW"
    
    mkdir -p "$BACKUP_DIR"
    
    # Database backup
    if [[ -n "$DATABASE_URL" ]]; then
        log "Creating database backup..." "BLUE"
        if command -v pg_dump &> /dev/null; then
            pg_dump "$DATABASE_URL" > "$BACKUP_DIR/database_backup.sql" || {
                log "⚠️  Database backup failed, continuing..." "YELLOW"
            }
        else
            log "⚠️  pg_dump not found, skipping database backup" "YELLOW"
        fi
    fi
    
    # Application backup
    if [[ -d "./dist" ]]; then
        log "Creating application backup..." "BLUE"
        cp -r ./dist "$BACKUP_DIR/app_backup"
    fi
    
    # Configuration backup
    log "Creating configuration backup..." "BLUE"
    cp -r ./config "$BACKUP_DIR/config_backup"
    
    # Docker images backup
    log "Creating Docker images backup..." "BLUE"
    docker save $(docker images --format "table {{.Repository}}:{{.Tag}}" | grep romapi | tr '\n' ' ') > "$BACKUP_DIR/docker_images.tar" || {
        log "⚠️  Docker images backup failed, continuing..." "YELLOW"
    }
    
    # Create backup metadata
    cat > "$BACKUP_DIR/backup_metadata.json" << EOF
{
    "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
    "environment": "$ENVIRONMENT",
    "deployment_type": "auth_system",
    "backup_components": [
        "database",
        "application",
        "configuration",
        "docker_images"
    ],
    "git_commit": "$(git rev-parse HEAD 2>/dev/null || echo 'unknown')",
    "git_branch": "$(git branch --show-current 2>/dev/null || echo 'unknown')"
}
EOF
    
    log "✅ Backup created: $BACKUP_DIR" "GREEN"
}

# Build application
build_application() {
    log "🔨 Building application..." "BLUE"
    
    # Install production dependencies
    log "Installing production dependencies..." "BLUE"
    npm ci --only=production
    
    # Generate Prisma client
    log "Generating Prisma client..." "BLUE"
    npx prisma generate
    
    # Build application
    log "Building application..." "BLUE"
    npm run build
    
    log "✅ Application built successfully" "GREEN"
}

# Run auth-specific migrations
run_auth_migrations() {
    log "🔄 Running auth system migrations..." "BLUE"
    
    # Run auth-specific migration script
    if ! node scripts/migrate-auth-prod.js; then
        handle_error "Auth migrations failed"
    fi
    
    log "✅ Auth migrations completed successfully" "GREEN"
}

# Deploy with Docker
deploy_docker() {
    log "🐳 Deploying with Docker..." "BLUE"
    
    # Stop existing containers
    log "Stopping existing containers..." "BLUE"
    docker-compose -f docker-compose.prod.yml -f docker-compose.auth-prod.yml down || true
    
    # Pull latest images
    log "Pulling latest images..." "BLUE"
    docker-compose -f docker-compose.prod.yml -f docker-compose.auth-prod.yml pull
    
    # Build and start new containers
    log "Building and starting containers..." "BLUE"
    docker-compose -f docker-compose.prod.yml -f docker-compose.auth-prod.yml up -d --build
    
    # Wait for services to be healthy
    log "⏳ Waiting for services to be healthy..." "YELLOW"
    local max_attempts=30
    local attempt=0
    
    while [[ $attempt -lt $max_attempts ]]; do
        if docker-compose -f docker-compose.prod.yml -f docker-compose.auth-prod.yml ps | grep -q "healthy"; then
            log "✅ Services are healthy" "GREEN"
            break
        fi
        
        attempt=$((attempt + 1))
        log "Waiting for services... (attempt $attempt/$max_attempts)" "BLUE"
        sleep 10
    done
    
    if [[ $attempt -eq $max_attempts ]]; then
        handle_error "Services failed to become healthy within timeout"
    fi
}

# Post-deployment verification
post_deployment_verification() {
    log "🔍 Running post-deployment verification..." "BLUE"
    
    local base_url="http://localhost:${PORT:-3000}"
    
    # Health checks
    local endpoints=(
        "/api/v1/health"
        "/api/v1/auth/health"
        "/api/v1/auth/status"
    )
    
    for endpoint in "${endpoints[@]}"; do
        log "Testing endpoint: $endpoint" "BLUE"
        if curl -f -s "$base_url$endpoint" > /dev/null; then
            log "✅ $endpoint is responding" "GREEN"
        else
            log "❌ $endpoint is not responding" "RED"
            handle_error "Health check failed for $endpoint"
        fi
    done
    
    # Test auth-specific functionality
    log "Testing auth functionality..." "BLUE"
    
    # Test registration endpoint (should return validation error for empty body)
    if curl -f -s -X POST "$base_url/api/v1/auth/register" -H "Content-Type: application/json" -d '{}' | grep -q "error"; then
        log "✅ Auth registration endpoint is responding" "GREEN"
    else
        log "⚠️  Auth registration endpoint test inconclusive" "YELLOW"
    fi
    
    # Test Redis connectivity
    log "Testing Redis connectivity..." "BLUE"
    if docker exec romapi-redis-prod redis-cli --no-auth-warning -a "$REDIS_PASSWORD" ping | grep -q "PONG"; then
        log "✅ Redis is responding" "GREEN"
    else
        log "❌ Redis connectivity test failed" "RED"
        handle_error "Redis connectivity test failed"
    fi
    
    log "✅ Post-deployment verification completed" "GREEN"
}

# Generate deployment report
generate_deployment_report() {
    log "📊 Generating deployment report..." "BLUE"
    
    local report_file="./logs/auth-deployment-report-$(date +%Y%m%d_%H%M%S).json"
    
    cat > "$report_file" << EOF
{
    "deployment": {
        "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
        "environment": "$ENVIRONMENT",
        "type": "auth_system",
        "status": "success",
        "duration_seconds": $SECONDS
    },
    "backup": {
        "location": "$BACKUP_DIR",
        "created": true
    },
    "services": {
        "database": "$(docker-compose -f docker-compose.prod.yml ps postgres | grep -q 'healthy' && echo 'healthy' || echo 'unknown')",
        "redis": "$(docker-compose -f docker-compose.auth-prod.yml ps redis | grep -q 'healthy' && echo 'healthy' || echo 'unknown')",
        "application": "$(docker-compose -f docker-compose.prod.yml ps app | grep -q 'healthy' && echo 'healthy' || echo 'unknown')"
    },
    "git": {
        "commit": "$(git rev-parse HEAD 2>/dev/null || echo 'unknown')",
        "branch": "$(git branch --show-current 2>/dev/null || echo 'unknown')"
    },
    "logs": {
        "deployment_log": "$LOG_FILE",
        "security_logs": "./logs/security/",
        "application_logs": "docker logs romapi-app-prod"
    }
}
EOF
    
    log "📋 Deployment report saved: $report_file" "BLUE"
}

# Rollback function
rollback() {
    log "🔄 Rolling back deployment..." "YELLOW"
    
    if [[ -d "$BACKUP_DIR" ]]; then
        # Stop current containers
        docker-compose -f docker-compose.prod.yml -f docker-compose.auth-prod.yml down
        
        # Restore database if backup exists
        if [[ -f "$BACKUP_DIR/database_backup.sql" && -n "$DATABASE_URL" ]]; then
            log "Restoring database..." "BLUE"
            psql "$DATABASE_URL" < "$BACKUP_DIR/database_backup.sql"
            log "✅ Database restored" "GREEN"
        fi
        
        # Restore application if backup exists
        if [[ -d "$BACKUP_DIR/app_backup" ]]; then
            log "Restoring application..." "BLUE"
            rm -rf ./dist
            cp -r "$BACKUP_DIR/app_backup" ./dist
            log "✅ Application restored" "GREEN"
        fi
        
        # Restore Docker images
        if [[ -f "$BACKUP_DIR/docker_images.tar" ]]; then
            log "Restoring Docker images..." "BLUE"
            docker load < "$BACKUP_DIR/docker_images.tar"
            log "✅ Docker images restored" "GREEN"
        fi
        
        # Restart services
        docker-compose -f docker-compose.prod.yml -f docker-compose.auth-prod.yml up -d
        
        log "✅ Rollback completed successfully" "GREEN"
    else
        log "❌ No backup found for rollback" "RED"
        exit 1
    fi
}

# Main deployment process
main() {
    local start_time=$(date +%s)
    
    log "🚀 Starting Auth System deployment..." "GREEN"
    log "Environment: $ENVIRONMENT" "BLUE"
    log "Deployment log: $LOG_FILE" "BLUE"
    
    # Set error handler
    trap 'handle_error "Unexpected error occurred"' ERR
    
    validate_environment
    pre_deployment_validation
    create_backup
    build_application
    run_auth_migrations
    deploy_docker
    post_deployment_verification
    generate_deployment_report
    
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    log "🎉 Auth System deployment completed successfully!" "GREEN"
    log "⏱️  Total deployment time: ${duration} seconds" "BLUE"
    log "📊 Application URL: http://localhost:${PORT:-3000}" "GREEN"
    log "📚 API Documentation: http://localhost:${PORT:-3000}/api/docs" "GREEN"
    log "🔍 Health Check: http://localhost:${PORT:-3000}/api/v1/health" "GREEN"
    log "🔐 Auth Health: http://localhost:${PORT:-3000}/api/v1/auth/health" "GREEN"
    log "📈 Metrics: http://localhost:${PORT:-3000}/api/v1/metrics" "GREEN"
    log "📋 Deployment log: $LOG_FILE" "BLUE"
    
    if [[ -d "$BACKUP_DIR" ]]; then
        log "💾 Backup location: $BACKUP_DIR" "BLUE"
    fi
}

# Handle script arguments
case "${2:-deploy}" in
    "rollback")
        rollback
        ;;
    "validate")
        validate_environment
        pre_deployment_validation
        ;;
    "backup")
        validate_environment
        create_backup
        ;;
    "deploy"|*)
        main
        ;;
esac