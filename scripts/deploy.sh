#!/bin/bash

# Production deployment script for ROMAPI Backend Core
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT=${1:-production}
BACKUP_DIR="./backups/$(date +%Y%m%d_%H%M%S)"

echo -e "${GREEN}🚀 Starting deployment for environment: ${ENVIRONMENT}${NC}"

# Validate environment
if [[ ! "$ENVIRONMENT" =~ ^(production|staging)$ ]]; then
    echo -e "${RED}❌ Invalid environment. Use 'production' or 'staging'${NC}"
    exit 1
fi

# Check if required environment variables are set
check_env_vars() {
    local required_vars=("DATABASE_URL" "JWT_SECRET" "REDIS_HOST")
    local missing_vars=()
    
    for var in "${required_vars[@]}"; do
        if [[ -z "${!var}" ]]; then
            missing_vars+=("$var")
        fi
    done
    
    if [[ ${#missing_vars[@]} -gt 0 ]]; then
        echo -e "${RED}❌ Missing required environment variables: ${missing_vars[*]}${NC}"
        exit 1
    fi
}

# Create backup
create_backup() {
    echo -e "${YELLOW}📦 Creating backup...${NC}"
    mkdir -p "$BACKUP_DIR"
    
    # Database backup
    if command -v pg_dump &> /dev/null; then
        pg_dump "$DATABASE_URL" > "$BACKUP_DIR/database_backup.sql"
        echo -e "${GREEN}✅ Database backup created${NC}"
    else
        echo -e "${YELLOW}⚠️  pg_dump not found, skipping database backup${NC}"
    fi
    
    # Application backup (if exists)
    if [[ -d "./dist" ]]; then
        cp -r ./dist "$BACKUP_DIR/app_backup"
        echo -e "${GREEN}✅ Application backup created${NC}"
    fi
}

# Run database migrations
run_migrations() {
    echo -e "${YELLOW}🔄 Running database migrations...${NC}"
    
    # Generate Prisma client
    npx prisma generate
    
    # Run migrations
    if [[ "$ENVIRONMENT" == "production" ]]; then
        npx prisma migrate deploy
    else
        npx prisma migrate dev
    fi
    
    echo -e "${GREEN}✅ Database migrations completed${NC}"
}

# Build application
build_app() {
    echo -e "${YELLOW}🔨 Building application...${NC}"
    
    # Install dependencies
    npm ci --only=production
    
    # Build application
    npm run build
    
    echo -e "${GREEN}✅ Application built successfully${NC}"
}

# Deploy with Docker
deploy_docker() {
    echo -e "${YELLOW}🐳 Deploying with Docker...${NC}"
    
    # Load environment-specific configuration
    if [[ -f "config/environments/.env.${ENVIRONMENT}" ]]; then
        export $(cat "config/environments/.env.${ENVIRONMENT}" | grep -v '^#' | xargs)
    fi
    
    # Stop existing containers
    docker-compose -f docker-compose.prod.yml down
    
    # Build and start new containers
    docker-compose -f docker-compose.prod.yml up -d --build
    
    # Wait for services to be healthy
    echo -e "${YELLOW}⏳ Waiting for services to be healthy...${NC}"
    sleep 30
    
    # Check health
    if curl -f http://localhost:${PORT:-3000}/api/v1/health > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Application is healthy${NC}"
    else
        echo -e "${RED}❌ Application health check failed${NC}"
        exit 1
    fi
}

# Rollback function
rollback() {
    echo -e "${YELLOW}🔄 Rolling back deployment...${NC}"
    
    if [[ -d "$BACKUP_DIR" ]]; then
        # Restore database if backup exists
        if [[ -f "$BACKUP_DIR/database_backup.sql" ]]; then
            psql "$DATABASE_URL" < "$BACKUP_DIR/database_backup.sql"
            echo -e "${GREEN}✅ Database restored${NC}"
        fi
        
        # Restore application if backup exists
        if [[ -d "$BACKUP_DIR/app_backup" ]]; then
            rm -rf ./dist
            cp -r "$BACKUP_DIR/app_backup" ./dist
            echo -e "${GREEN}✅ Application restored${NC}"
        fi
    else
        echo -e "${RED}❌ No backup found for rollback${NC}"
        exit 1
    fi
}

# Main deployment process
main() {
    # Check environment variables
    check_env_vars
    
    # Create backup
    create_backup
    
    # Build application
    build_app
    
    # Run migrations
    run_migrations
    
    # Deploy
    deploy_docker
    
    echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
    echo -e "${GREEN}📊 Application URL: http://localhost:${PORT:-3000}${NC}"
    echo -e "${GREEN}📚 API Documentation: http://localhost:${PORT:-3000}/api/docs${NC}"
    echo -e "${GREEN}🔍 Health Check: http://localhost:${PORT:-3000}/api/v1/health${NC}"
    echo -e "${GREEN}📈 Metrics: http://localhost:${PORT:-3000}/api/v1/metrics${NC}"
}

# Handle script arguments
case "${2:-deploy}" in
    "rollback")
        rollback
        ;;
    "deploy"|*)
        main
        ;;
esac