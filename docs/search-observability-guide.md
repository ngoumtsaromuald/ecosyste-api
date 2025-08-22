# ROMAPI Search System Observability Guide

## Overview

This guide covers the comprehensive observability setup for the ROMAPI search system, including logging, tracing, metrics, and monitoring.

## Architecture

The observability stack consists of:

- **Logging**: Structured logging with Winston + Elasticsearch + Kibana
- **Tracing**: Distributed tracing with OpenTelemetry + Jaeger
- **Metrics**: Prometheus metrics + Grafana dashboards
- **Alerting**: Prometheus Alertmanager
- **Debug Mode**: Advanced debugging capabilities

## Quick Start

### 1. Start Observability Stack

```bash
# Start the observability infrastructure
docker-compose -f docker-compose.observability.yml up -d

# Verify services are running
docker-compose -f docker-compose.observability.yml ps
```

### 2. Configure Environment Variables

Add to your `.env` file:

```env
# Logging Configuration
LOG_LEVEL=info
ELASTICSEARCH_LOGGING_ENABLED=true
ELASTICSEARCH_LOGGING_NODE=http://localhost:9201
ELASTICSEARCH_LOGGING_INDEX=romapi-search-logs

# Tracing Configuration
TRACING_JAEGER_ENDPOINT=http://localhost:14268/api/traces
TRACING_PROMETHEUS_PORT=9464
TRACING_CONSOLE_ENABLED=false
TRACING_SAMPLE_RATE=1.0

# Search Observability
SEARCH_OBSERVABILITY_TRACING=true
SEARCH_OBSERVABILITY_METRICS=true
SEARCH_OBSERVABILITY_LOGGING=true
SEARCH_OBSERVABILITY_PROFILING=false
SEARCH_OBSERVABILITY_SAMPLE_RATE=1.0
SEARCH_DEBUG=false
```

### 3. Access Dashboards

- **Grafana**: http://localhost:3001 (admin/admin123)
- **Prometheus**: http://localhost:9090
- **Jaeger**: http://localhost:16686
- **Kibana**: http://localhost:5601
- **Alertmanager**: http://localhost:9093

## Components

### 1. Structured Logging

#### SearchLoggerService

Provides structured logging with search context:

```typescript
// Log search events
searchLogger.logSearchEvent('search_started', searchContext);
searchLogger.logSearchEvent('search_completed', searchContext, debugInfo);

// Log user interactions
searchLogger.logUserInteraction('search_click', searchContext, {
  resourceId: 'api-123',
  position: 1
});

// Log performance metrics
searchLogger.logPerformanceMetrics(searchContext, debugInfo);

// Log security events
searchLogger.logSecurityEvent('rate_limit_exceeded', searchContext, {
  reason: 'Too many requests',
  severity: 'medium',
  action: 'throttled'
});
```

#### Log Structure

All logs include:
- `searchId`: Unique identifier for the search operation
- `traceId`: Distributed tracing correlation ID
- `userId`: User identifier (if authenticated)
- `sessionId`: Session identifier
- `timestamp`: ISO timestamp
- `query`: Search query (sanitized)
- `resultsCount`: Number of results returned
- `took`: Response time in milliseconds

### 2. Distributed Tracing

#### SearchTracingService

Provides OpenTelemetry integration:

```typescript
// Trace search operations
await searchTracing.traceSearchOperation('search', attributes, async (span) => {
  // Your search logic here
  return results;
});

// Add custom events and attributes
searchTracing.addSpanEvent('cache_hit', { cacheKey: 'search-123' });
searchTracing.addSpanAttributes({ 'search.personalized': true });

// Record metrics
searchTracing.recordCacheHit('search-key', 'search');
```

#### Trace Attributes

Standard attributes included:
- `search.id`: Search identifier
- `search.query`: Search query
- `search.user_id`: User ID
- `search.results_count`: Results count
- `search.took_ms`: Response time
- `search.cached`: Whether result was cached
- `search.personalized`: Whether search was personalized

### 3. Metrics Collection

#### SearchMetricsService

Provides Prometheus metrics:

```typescript
// Record search metrics
searchMetrics.recordSearchStart('search', tags);
searchMetrics.recordSearchSuccess('search', duration, resultsCount, tags);
searchMetrics.recordSearchError('search', errorType, tags);

// Custom metrics
searchMetrics.recordCustomMetric('search_quality_score', 0.85, tags);
```

#### Available Metrics

- `search_requests_total`: Total search requests
- `search_duration_seconds`: Search duration histogram
- `search_errors_total`: Total search errors
- `search_cache_hits_total`: Cache hits
- `search_cache_misses_total`: Cache misses
- `search_results_count`: Results count histogram

### 4. Debug Mode

#### SearchDebugService

Provides advanced debugging capabilities:

```typescript
// Execute search with debug info
const debugResponse = await searchDebug.debugSearch({
  searchId: 'debug-123',
  params: searchParams,
  userId: 'user-123',
  debugLevel: 'verbose',
  explainQuery: true,
  includeRawResponse: true
}, searchOperation);

// Access debug information
console.log(debugResponse.debugInfo.performance);
console.log(debugResponse.debugInfo.elasticsearch);
console.log(debugResponse.debugInfo.recommendations);
```

#### Debug Information Includes

- **Query Analysis**: Original vs processed query, Elasticsearch query
- **Performance Breakdown**: Time spent in each phase
- **Cache Information**: Cache hits/misses, keys, TTL
- **Language Detection**: Detected language and confidence
- **Bottleneck Identification**: Performance bottlenecks
- **Optimization Recommendations**: Suggestions for improvement

### 5. Comprehensive Observability

#### SearchObservabilityService

Orchestrates all observability components:

```typescript
// Start observation
const context = observability.startObservation('search', params, userId);

// Add events and metrics during operation
observability.addEvent(context, 'cache_hit', { cacheKey: 'key-123' });
observability.addMetric(context, 'relevance_score', 0.92);
observability.recordCacheOperation(context, 'hit', 'search-key');

// End observation
observability.endObservation(context.searchContext.searchId, results);
```

## Monitoring and Alerting

### Grafana Dashboards

The system includes comprehensive Grafana dashboards:

1. **Search Performance Dashboard**
   - Request rate and response times
   - Error rates and success rates
   - Cache hit rates
   - Geographic distribution

2. **Search Quality Dashboard**
   - Results distribution
   - No-results queries
   - User engagement metrics
   - A/B test results

3. **System Health Dashboard**
   - Elasticsearch health
   - Redis performance
   - System resources
   - Service availability

### Prometheus Alerts

Configured alerts for:

- **Performance**: High latency, slow queries
- **Errors**: High error rates, service failures
- **Business**: Low search volume, high no-results rate
- **Security**: Rate limit violations, suspicious patterns
- **System**: Resource usage, service availability

### Alert Channels

- **Critical**: Email + Slack notifications
- **Warning**: Email notifications
- **Info**: Webhook notifications

## Debug Mode Usage

### Enable Debug Mode

```typescript
// Environment variable
SEARCH_DEBUG=true

// Or programmatically
searchDebug.setDebugMode(true);
```

### Debug API Endpoints

```bash
# Search with debug information
POST /api/v1/search/debug
{
  "query": "restaurant douala",
  "debugLevel": "verbose",
  "explainQuery": true,
  "includeRawResponse": true
}

# Get debug statistics
GET /api/v1/search/debug/stats
```

### Debug Response Structure

```json
{
  "searchId": "debug-123",
  "results": { /* normal search results */ },
  "debugInfo": {
    "query": {
      "original": { /* original parameters */ },
      "processed": { /* processed parameters */ },
      "elasticsearch": { /* ES query */ },
      "explanation": { /* query explanation */ }
    },
    "performance": {
      "totalTime": 150,
      "breakdown": {
        "preprocessing": 10,
        "elasticsearch": 120,
        "postprocessing": 20
      },
      "bottlenecks": ["elasticsearch"]
    },
    "cache": {
      "key": "search-key-123",
      "hit": false,
      "ttl": 300
    },
    "recommendations": [
      "Consider implementing result caching",
      "Elasticsearch query could be optimized"
    ]
  }
}
```

## Performance Optimization

### Sampling

Configure sampling rates to reduce overhead:

```env
# Sample 10% of requests for tracing
TRACING_SAMPLE_RATE=0.1

# Sample 50% for detailed observability
SEARCH_OBSERVABILITY_SAMPLE_RATE=0.5
```

### Log Levels

Adjust log levels for different environments:

```env
# Production
LOG_LEVEL=warn

# Development
LOG_LEVEL=debug
```

### Metric Retention

Configure Prometheus retention:

```yaml
# prometheus.yml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

# Retention
--storage.tsdb.retention.time=200h
```

## Troubleshooting

### Common Issues

1. **High Memory Usage**
   - Reduce sampling rates
   - Increase batch sizes in OTEL collector
   - Configure log rotation

2. **Missing Traces**
   - Check OTEL collector configuration
   - Verify Jaeger connectivity
   - Check sampling configuration

3. **Alert Fatigue**
   - Adjust alert thresholds
   - Configure alert grouping
   - Set up inhibition rules

### Health Checks

```bash
# Check observability service health
curl http://localhost:3000/api/v1/search/observability/health

# Check individual components
curl http://localhost:9090/-/healthy  # Prometheus
curl http://localhost:16686/api/services  # Jaeger
curl http://localhost:3001/api/health  # Grafana
```

## Best Practices

### 1. Structured Logging

- Always include correlation IDs
- Use consistent log levels
- Sanitize sensitive data
- Include relevant context

### 2. Tracing

- Use meaningful span names
- Add relevant attributes
- Don't over-instrument
- Consider sampling in production

### 3. Metrics

- Use appropriate metric types
- Include relevant labels
- Avoid high cardinality
- Monitor metric ingestion rate

### 4. Alerting

- Set appropriate thresholds
- Include actionable information
- Configure escalation paths
- Test alert channels regularly

## Security Considerations

### Data Privacy

- Sanitize search queries in logs
- Remove PII from traces
- Configure data retention policies
- Implement access controls

### Access Control

- Secure dashboard access
- Use authentication for metrics endpoints
- Implement RBAC for observability tools
- Audit access logs

## Maintenance

### Regular Tasks

1. **Weekly**
   - Review alert thresholds
   - Check dashboard accuracy
   - Analyze performance trends

2. **Monthly**
   - Update observability stack
   - Review retention policies
   - Optimize queries and dashboards

3. **Quarterly**
   - Capacity planning
   - Security audit
   - Performance optimization review

### Backup and Recovery

- Backup Grafana dashboards
- Export Prometheus rules
- Document configuration changes
- Test recovery procedures

## Integration Examples

### Custom Middleware

```typescript
@Injectable()
export class SearchObservabilityMiddleware implements NestMiddleware {
  constructor(private observability: SearchObservabilityService) {}

  use(req: Request, res: Response, next: NextFunction) {
    const context = this.observability.startObservation(
      'search_request',
      req.body,
      req.user?.id,
      req.sessionID,
      req.get('User-Agent'),
      req.ip
    );

    res.on('finish', () => {
      this.observability.endObservation(
        context.searchContext.searchId,
        res.locals.searchResults
      );
    });

    next();
  }
}
```

### Custom Metrics

```typescript
// Business metrics
observability.addMetric(context, 'conversion_rate', 0.15);
observability.addMetric(context, 'user_satisfaction', 4.2);

// Technical metrics
observability.addMetric(context, 'index_size_mb', 1024);
observability.addMetric(context, 'query_complexity', 0.7);
```

This comprehensive observability setup provides deep insights into search system performance, user behavior, and system health, enabling proactive monitoring and optimization.