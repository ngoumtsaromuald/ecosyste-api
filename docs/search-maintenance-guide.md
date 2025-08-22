# Search System Maintenance Guide

This guide covers the maintenance, monitoring, and troubleshooting of the ROMAPI search system.

## Table of Contents

1. [Overview](#overview)
2. [Daily Operations](#daily-operations)
3. [CLI Commands](#cli-commands)
4. [Monitoring](#monitoring)
5. [Backup and Restore](#backup-and-restore)
6. [Troubleshooting](#troubleshooting)
7. [Performance Optimization](#performance-optimization)
8. [Deployment](#deployment)

## Overview

The ROMAPI search system consists of several components:

- **Elasticsearch**: Primary search engine and document store
- **Redis**: Caching layer for search results and analytics
- **PostgreSQL**: Persistent storage for search analytics and user data
- **Search Workers**: Background job processors for indexing and analytics
- **Search Indexer**: Scheduled tasks for maintaining search indices

## Daily Operations

### Health Checks

Run daily health checks to ensure all components are functioning properly:

```bash
# Quick system status
npm run search:cli status

# Detailed health check
npm run search:monitor:check

# Individual component checks
npm run search:cli index stats
npm run search:cli cache stats
```

### Analytics Review

Monitor search performance and user behavior:

```bash
# View analytics for the last 7 days
npm run search:cli analytics

# View analytics for a specific period
npm run search:cli analytics --days 30
```

### Cache Management

Monitor and manage the search cache:

```bash
# View cache statistics
npm run search:cli cache stats

# Clear cache if needed (use with caution)
npm run search:cli cache clear
```

## CLI Commands

The search CLI provides comprehensive management capabilities:

### Index Management

```bash
# Create search indices
npm run search:cli index create

# View index statistics
npm run search:cli index stats

# Reindex all resources
npm run search:cli index reindex

# Delete indices (requires confirmation)
npm run search:cli index delete --confirm
```

### Cache Management

```bash
# View cache statistics
npm run search:cli cache stats

# Clear all search cache
npm run search:cli cache clear

# Clear specific cache pattern
npm run search:cli cache clear --pattern "search:suggestions:*"
```

### Analytics

```bash
# View search analytics (default: 7 days)
npm run search:cli analytics

# View analytics for specific period
npm run search:cli analytics --days 30
```

### System Status

```bash
# Overall system status
npm run search:cli status

# Continuous health monitoring
npm run search:monitor

# Single health check
npm run search:monitor:check
```

### Data Management

```bash
# Clean up old data
npm run search:cli cleanup

# Dry run cleanup (see what would be cleaned)
npm run search:cli cleanup --dry-run

# Create backup
npm run search:cli backup create

# Restore from backup
npm run search:cli backup restore /path/to/backup
```

## Monitoring

### Automated Health Monitoring

Start continuous health monitoring:

```bash
# Start monitoring daemon
npm run search:monitor
```

The monitor will:
- Check service health every minute
- Log health status to files
- Send alerts when issues are detected
- Monitor performance metrics

### Health Check Endpoints

The application provides health check endpoints:

- `GET /api/v1/search/health` - Search service health
- `GET /api/v1/health` - Overall application health

### Metrics and Alerts

Configure environment variables for alerting:

```bash
# Enable alerting
SEARCH_ALERTING_ENABLED=true

# Webhook for alerts
SEARCH_ALERT_WEBHOOK_URL=https://hooks.slack.com/your-webhook

# Alert thresholds
SEARCH_ALERT_ES_RESPONSE_TIME=1000
SEARCH_ALERT_REDIS_RESPONSE_TIME=100
SEARCH_ALERT_ERROR_RATE=5.0
SEARCH_ALERT_DISK_USAGE=85.0
SEARCH_ALERT_MEMORY_USAGE=90.0
```

## Backup and Restore

### Automated Backups

Create regular backups of search data:

```bash
# Create full backup
npm run search:backup

# Create backup with specific components
BACKUP_INCLUDE_ELASTICSEARCH=true \
BACKUP_INCLUDE_REDIS=true \
BACKUP_INCLUDE_DATABASE=true \
npm run search:backup
```

### Backup Configuration

Configure backup settings via environment variables:

```bash
# Backup location
SEARCH_BACKUPS_PATH=./backups/search

# Retention policy
BACKUP_RETENTION_DAYS=30

# Compression
BACKUP_COMPRESSION_ENABLED=true
```

### Restore Process

Restore from backup when needed:

```bash
# List available backups
ls -la ./backups/search/

# Restore from specific backup
npm run search:restore ./backups/search/search-backup-2024-01-15T10-30-00

# Restore using CLI
npm run search:cli backup restore ./backups/search/backup-path
```

## Troubleshooting

### Common Issues

#### Elasticsearch Issues

**Cluster Status Red:**
```bash
# Check cluster health
curl http://localhost:9200/_cluster/health

# Check node status
curl http://localhost:9200/_cat/nodes?v

# Check indices status
curl http://localhost:9200/_cat/indices?v
```

**High Memory Usage:**
```bash
# Check memory usage
curl http://localhost:9200/_cat/nodes?h=name,heap.percent,ram.percent

# Clear cache if needed
curl -X POST http://localhost:9200/_cache/clear
```

**Slow Queries:**
```bash
# Check slow queries
curl http://localhost:9200/_cat/pending_tasks?v

# Monitor search performance
npm run search:cli analytics
```

#### Redis Issues

**Connection Problems:**
```bash
# Test Redis connection
docker exec romapi-redis-search redis-cli --no-auth-warning -a "$REDIS_SEARCH_PASSWORD" ping

# Check Redis info
docker exec romapi-redis-search redis-cli --no-auth-warning -a "$REDIS_SEARCH_PASSWORD" info
```

**Memory Issues:**
```bash
# Check memory usage
docker exec romapi-redis-search redis-cli --no-auth-warning -a "$REDIS_SEARCH_PASSWORD" info memory

# Clear cache if needed
npm run search:cli cache clear
```

#### Search Performance Issues

**Slow Search Responses:**
1. Check Elasticsearch cluster health
2. Review search query complexity
3. Monitor cache hit rates
4. Check system resources

**High Error Rates:**
1. Review application logs
2. Check Elasticsearch logs
3. Monitor database connections
4. Verify search index integrity

### Log Analysis

Search system logs are located in:
- Application logs: `./logs/search/`
- Health monitoring: `./logs/search/health.log`
- Elasticsearch logs: Docker container logs
- Redis logs: Docker container logs

```bash
# View recent search logs
tail -f ./logs/search/search.log

# View health monitoring logs
tail -f ./logs/search/health.log

# View Docker container logs
docker logs romapi-elasticsearch-search
docker logs romapi-redis-search
```

## Performance Optimization

### Index Optimization

```bash
# Monitor index performance
npm run search:cli index stats

# Reindex if performance degrades
npm run search:cli index reindex
```

### Cache Optimization

```bash
# Monitor cache performance
npm run search:cli cache stats

# Adjust cache TTL settings in environment variables
SEARCH_CACHE_TTL=300
SEARCH_SUGGESTIONS_CACHE_TTL=3600
```

### Query Optimization

Monitor slow queries and optimize:

1. Review search analytics for common patterns
2. Optimize Elasticsearch mappings
3. Adjust search boost factors
4. Implement query result caching

### Resource Monitoring

Monitor system resources:

```bash
# Check disk usage
df -h

# Check memory usage
free -h

# Check Docker container resources
docker stats
```

## Deployment

### Production Deployment

Deploy search system to production:

```bash
# Deploy search services
npm run deploy:search:prod

# Deploy to staging first
npm run deploy:search:staging
```

### Environment Configuration

Ensure proper environment configuration:

```bash
# Production environment
cp config/environments/.env.search.production.template config/environments/.env.search.production

# Edit configuration
nano config/environments/.env.search.production
```

### Post-Deployment Verification

After deployment, verify system health:

```bash
# Check system status
npm run search:cli status

# Run health check
npm run search:monitor:check

# Verify search functionality
curl "http://localhost:3000/api/v1/search?q=test"
```

### Rollback Procedure

If deployment fails, rollback:

```bash
# Rollback search deployment
bash scripts/deploy-search.sh production rollback

# Restore from backup if needed
npm run search:cli backup restore /path/to/backup
```

## Maintenance Schedule

### Daily Tasks
- [ ] Check system health status
- [ ] Review search analytics
- [ ] Monitor error rates
- [ ] Check disk space

### Weekly Tasks
- [ ] Review performance metrics
- [ ] Clean up old logs
- [ ] Update search indices if needed
- [ ] Review backup integrity

### Monthly Tasks
- [ ] Full system health audit
- [ ] Performance optimization review
- [ ] Update search configurations
- [ ] Security review

### Quarterly Tasks
- [ ] Capacity planning review
- [ ] Disaster recovery testing
- [ ] Search algorithm optimization
- [ ] Infrastructure updates

## Emergency Procedures

### Service Outage

1. Check system status: `npm run search:cli status`
2. Review logs for errors
3. Restart services if needed: `docker-compose restart`
4. Escalate if issues persist

### Data Loss

1. Stop all search services
2. Restore from latest backup
3. Verify data integrity
4. Resume services
5. Monitor for issues

### Performance Degradation

1. Check resource usage
2. Review recent changes
3. Clear caches if needed
4. Scale resources if necessary
5. Optimize queries

## Support and Escalation

For issues that cannot be resolved using this guide:

1. Collect relevant logs and metrics
2. Document steps taken
3. Contact the development team
4. Escalate to infrastructure team if needed

## Additional Resources

- [Search API Documentation](./search-api-documentation.md)
- [Elasticsearch Documentation](https://www.elastic.co/guide/)
- [Redis Documentation](https://redis.io/documentation)
- [Docker Documentation](https://docs.docker.com/)