#!/bin/bash

# Search System Deployment Script
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT=${1:-production}
BACKUP_DIR="./backups/search-deploy-$(date +%Y%m%d_%H%M%S)"
LOG_FILE="./logs/search-deploy-$(date +%Y%m%d_%H%M%S).log"

echo -e "${GREEN}🔍 Starting Search System deployment for environment: ${ENVIRONMENT}${NC}"

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
    log "❌ Search deployment failed at step: $1" "RED"
    log "📋 Check deployment log: $LOG_FILE" "YELLOW"
    exit 1
}

# Validate environment
validate_environment() {
    log "🔍 Validating search environment..." "BLUE"
    
    if [[ ! "$ENVIRONMENT" =~ ^(production|staging|development)$ ]]; then
        handle_error "Invalid environment. Use 'production', 'staging', or 'development'"
    fi
    
    # Load environment-specific configuration
    if [[ -f "config/environments/.env.search.${ENVIRONMENT}" ]]; then
        log "Loading search environment configuration..." "BLUE"
        export $(cat "config/environments/.env.search.${ENVIRONMENT}" | grep -v '^#' | xargs)
    else
        handle_error "Search environment file not found: config/environments/.env.search.${ENVIRONMENT}"
    fi
    
    # Load main environment configuration
    if [[ -f "config/environments/.env.${ENVIRONMENT}" ]]; then
        export $(cat "config/environments/.env.${ENVIRONMENT}" | grep -v '^#' | xargs)
    fi
    
    log "✅ Environment validation completed" "GREEN"
}

# Pre-deployment validation
pre_deployment_validation() {
    log "🔍 Running pre-deployment validation..." "BLUE"
    
    # Check required files
    local required_files=(
        "docker-compose.search.yml"
        "config/elasticsearch/index-mappings.json"
        "config/redis/redis-search.conf"
        "Dockerfile.search-worker"
        "Dockerfile.search-indexer"
    )
    
    for file in "${required_files[@]}"; do
        if [[ ! -f "$file" ]]; then
            handle_error "Required file not found: $file"
        fi
    done
    
    # Check if Elasticsearch mappings are valid
    if ! node -e "JSON.parse(require('fs').readFileSync('config/elasticsearch/index-mappings.json', 'utf8'))" 2>/dev/null; then
        handle_error "Invalid Elasticsearch mappings JSON"
    fi
    
    log "✅ Pre-deployment validation passed" "GREEN"
}

# Create comprehensive backup
create_backup() {
    log "📦 Creating search system backup..." "YELLOW"
    
    mkdir -p "$BACKUP_DIR"
    
    # Elasticsearch data backup
    if docker ps | grep -q "romapi-elasticsearch"; then
        log "Creating Elasticsearch backup..." "BLUE"
        
        # Create snapshot repository if it doesn't exist
        curl -X PUT "localhost:${ELASTICSEARCH_PORT:-9200}/_snapshot/backup_repo" \
            -H 'Content-Type: application/json' \
            -d '{"type": "fs", "settings": {"location": "/usr/share/elasticsearch/backup"}}' \
            2>/dev/null || log "⚠️  Could not create snapshot repository" "YELLOW"
        
        # Create snapshot
        curl -X PUT "localhost:${ELASTICSEARCH_PORT:-9200}/_snapshot/backup_repo/backup_$(date +%Y%m%d_%H%M%S)" \
            -H 'Content-Type: application/json' \
            -d '{"indices": "*", "ignore_unavailable": true, "include_global_state": false}' \
            2>/dev/null || log "⚠️  Could not create Elasticsearch snapshot" "YELLOW"
    fi
    
    # Redis Search data backup
    if docker ps | grep -q "romapi-redis-search"; then
        log "Creating Redis Search backup..." "BLUE"
        docker exec romapi-redis-search redis-cli --no-auth-warning -a "${REDIS_SEARCH_PASSWORD}" BGSAVE || {
            log "⚠️  Redis Search backup failed, continuing..." "YELLOW"
        }
    fi
    
    # Configuration backup
    log "Creating configuration backup..." "BLUE"
    cp -r ./config "$BACKUP_DIR/config_backup"
    
    # Docker images backup
    log "Creating Docker images backup..." "BLUE"
    docker save $(docker images --format "table {{.Repository}}:{{.Tag}}" | grep -E "(romapi.*search|elasticsearch|redis)" | tr '\n' ' ') > "$BACKUP_DIR/search_docker_images.tar" 2>/dev/null || {
        log "⚠️  Docker images backup failed, continuing..." "YELLOW"
    }
    
    # Create backup metadata
    cat > "$BACKUP_DIR/backup_metadata.json" << EOF
{
    "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
    "environment": "$ENVIRONMENT",
    "deployment_type": "search_system",
    "backup_components": [
        "elasticsearch_data",
        "redis_search_data",
        "configuration",
        "docker_images"
    ],
    "git_commit": "$(git rev-parse HEAD 2>/dev/null || echo 'unknown')",
    "git_branch": "$(git branch --show-current 2>/dev/null || echo 'unknown')"
}
EOF
    
    log "✅ Backup created: $BACKUP_DIR" "GREEN"
}

# Setup data directories
setup_data_directories() {
    log "📁 Setting up data directories..." "BLUE"
    
    # Create data directories
    mkdir -p "${ELASTICSEARCH_DATA_PATH:-./data/elasticsearch}"
    mkdir -p "${REDIS_SEARCH_DATA_PATH:-./data/redis-search}"
    mkdir -p "${SEARCH_LOGS_PATH:-./logs/search}"
    mkdir -p "${SEARCH_BACKUPS_PATH:-./backups/search}"
    
    # Set proper permissions
    chmod 755 "${ELASTICSEARCH_DATA_PATH:-./data/elasticsearch}"
    chmod 755 "${REDIS_SEARCH_DATA_PATH:-./data/redis-search}"
    chmod 755 "${SEARCH_LOGS_PATH:-./logs/search}"
    
    # Create Elasticsearch backup directory
    mkdir -p "${ELASTICSEARCH_DATA_PATH:-./data/elasticsearch}/backup"
    chmod 755 "${ELASTICSEARCH_DATA_PATH:-./data/elasticsearch}/backup"
    
    log "✅ Data directories setup completed" "GREEN"
}

# Deploy search services
deploy_search_services() {
    log "🐳 Deploying search services..." "BLUE"
    
    # Stop existing search containers
    log "Stopping existing search containers..." "BLUE"
    docker-compose -f docker-compose.search.yml down || true
    
    # Pull latest images
    log "Pulling latest images..." "BLUE"
    docker-compose -f docker-compose.search.yml pull
    
    # Build and start search containers
    log "Building and starting search containers..." "BLUE"
    docker-compose -f docker-compose.search.yml up -d --build
    
    # Wait for services to be healthy
    log "⏳ Waiting for search services to be healthy..." "YELLOW"
    wait_for_search_services
    
    log "✅ Search services deployed successfully" "GREEN"
}

# Wait for search services
wait_for_search_services() {
    local max_attempts=60
    local attempt=0
    
    local services=("elasticsearch" "redis-search")
    
    for service in "${services[@]}"; do
        attempt=0
        while [[ $attempt -lt $max_attempts ]]; do
            if docker-compose -f docker-compose.search.yml ps "$service" | grep -q "healthy\|Up"; then
                log "✅ $service is healthy" "GREEN"
                break
            fi
            
            attempt=$((attempt + 1))
            log "Waiting for $service... (attempt $attempt/$max_attempts)" "BLUE"
            sleep 5
        done
        
        if [[ $attempt -eq $max_attempts ]]; then
            handle_error "$service failed to become healthy within timeout"
        fi
    done
}

# Initialize search indices
initialize_search_indices() {
    log "🔧 Initializing search indices..." "BLUE"
    
    # Wait a bit more for Elasticsearch to be fully ready
    sleep 10
    
    # Create search indices with mappings
    if ! curl -f -X PUT "localhost:${ELASTICSEARCH_PORT:-9200}/${ELASTICSEARCH_INDEX_PREFIX:-romapi_prod}_resources" \
        -H 'Content-Type: application/json' \
        -d @config/elasticsearch/index-mappings.json 2>/dev/null; then
        log "⚠️  Could not create search indices, they may already exist" "YELLOW"
    else
        log "✅ Search indices created successfully" "GREEN"
    fi
    
    # Test search functionality
    if curl -f -s "localhost:${ELASTICSEARCH_PORT:-9200}/_cluster/health?wait_for_status=yellow&timeout=30s" > /dev/null; then
        log "✅ Elasticsearch cluster is healthy" "GREEN"
    else
        handle_error "Elasticsearch cluster health check failed"
    fi
}

# Post-deployment verification
post_deployment_verification() {
    log "🔍 Running post-deployment verification..." "BLUE"
    
    # Check Elasticsearch
    local es_health=$(curl -s "localhost:${ELASTICSEARCH_PORT:-9200}/_cluster/health" | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
    if [[ "$es_health" == "green" || "$es_health" == "yellow" ]]; then
        log "✅ Elasticsearch health: $es_health" "GREEN"
    else
        handle_error "Elasticsearch health check failed: $es_health"
    fi
    
    # Check Redis Search
    if docker exec romapi-redis-search redis-cli --no-auth-warning -a "${REDIS_SEARCH_PASSWORD}" ping | grep -q "PONG"; then
        log "✅ Redis Search is responding" "GREEN"
    else
        handle_error "Redis Search connectivity test failed"
    fi
    
    # Check search worker
    if docker ps | grep -q "romapi-search-worker.*Up"; then
        log "✅ Search worker is running" "GREEN"
    else
        log "⚠️  Search worker status unclear" "YELLOW"
    fi
    
    # Check search indexer
    if docker ps | grep -q "romapi-search-indexer.*Up"; then
        log "✅ Search indexer is running" "GREEN"
    else
        log "⚠️  Search indexer status unclear" "YELLOW"
    fi
    
    log "✅ Post-deployment verification completed" "GREEN"
}

# Generate deployment report
generate_deployment_report() {
    log "📊 Generating search deployment report..." "BLUE"
    
    local report_file="./logs/search-deployment-report-$(date +%Y%m%d_%H%M%S).json"
    
    cat > "$report_file" << EOF
{
    "deployment": {
        "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
        "environment": "$ENVIRONMENT",
        "type": "search_system",
        "status": "success",
        "duration_seconds": $SECONDS
    },
    "backup": {
        "location": "$BACKUP_DIR",
        "created": true
    },
    "services": {
        "elasticsearch": "$(curl -s localhost:${ELASTICSEARCH_PORT:-9200}/_cluster/health | grep -o '"status":"[^"]*"' | cut -d'"' -f4 || echo 'unknown')",
        "redis_search": "$(docker exec romapi-redis-search redis-cli --no-auth-warning -a "${REDIS_SEARCH_PASSWORD}" ping 2>/dev/null || echo 'unknown')",
        "search_worker": "$(docker ps --format 'table {{.Status}}' | grep romapi-search-worker | awk '{print $1}' || echo 'unknown')",
        "search_indexer": "$(docker ps --format 'table {{.Status}}' | grep romapi-search-indexer | awk '{print $1}' || echo 'unknown')"
    },
    "indices": {
        "resources": "$(curl -s localhost:${ELASTICSEARCH_PORT:-9200}/${ELASTICSEARCH_INDEX_PREFIX:-romapi_prod}_resources/_stats | grep -o '"docs":{"count":[0-9]*' | cut -d':' -f3 || echo 'unknown')"
    },
    "git": {
        "commit": "$(git rev-parse HEAD 2>/dev/null || echo 'unknown')",
        "branch": "$(git branch --show-current 2>/dev/null || echo 'unknown')"
    },
    "logs": {
        "deployment_log": "$LOG_FILE",
        "search_logs": "${SEARCH_LOGS_PATH:-./logs/search}",
        "elasticsearch_logs": "docker logs romapi-elasticsearch-search",
        "redis_logs": "docker logs romapi-redis-search"
    }
}
EOF
    
    log "📋 Search deployment report saved: $report_file" "BLUE"
}

# Rollback function
rollback() {
    log "🔄 Rolling back search deployment..." "YELLOW"
    
    if [[ -d "$BACKUP_DIR" ]]; then
        # Stop current containers
        docker-compose -f docker-compose.search.yml down
        
        # Restore Docker images
        if [[ -f "$BACKUP_DIR/search_docker_images.tar" ]]; then
            log "Restoring Docker images..." "BLUE"
            docker load < "$BACKUP_DIR/search_docker_images.tar"
            log "✅ Docker images restored" "GREEN"
        fi
        
        # Restore configuration
        if [[ -d "$BACKUP_DIR/config_backup" ]]; then
            log "Restoring configuration..." "BLUE"
            cp -r "$BACKUP_DIR/config_backup"/* ./config/
            log "✅ Configuration restored" "GREEN"
        fi
        
        # Restart services
        docker-compose -f docker-compose.search.yml up -d
        
        log "✅ Search rollback completed successfully" "GREEN"
    else
        log "❌ No backup found for rollback" "RED"
        exit 1
    fi
}

# Main deployment process
main() {
    local start_time=$(date +%s)
    
    log "🚀 Starting Search System deployment..." "GREEN"
    log "Environment: $ENVIRONMENT" "BLUE"
    log "Deployment log: $LOG_FILE" "BLUE"
    
    # Set error handler
    trap 'handle_error "Unexpected error occurred"' ERR
    
    validate_environment
    pre_deployment_validation
    create_backup
    setup_data_directories
    deploy_search_services
    initialize_search_indices
    post_deployment_verification
    generate_deployment_report
    
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    log "🎉 Search System deployment completed successfully!" "GREEN"
    log "⏱️  Total deployment time: ${duration} seconds" "BLUE"
    log "🔍 Elasticsearch: http://localhost:${ELASTICSEARCH_PORT:-9200}" "GREEN"
    log "📊 Elasticsearch Health: http://localhost:${ELASTICSEARCH_PORT:-9200}/_cluster/health" "GREEN"
    log "🔧 Redis Search: localhost:${REDIS_SEARCH_PORT:-6380}" "GREEN"
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
    "indices")
        validate_environment
        initialize_search_indices
        ;;
    "deploy"|*)
        main
        ;;
esac