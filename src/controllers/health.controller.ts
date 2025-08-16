import { Controller, Get, HttpStatus, HttpException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PrismaService } from '../config/prisma.service';
import { CacheService } from '../config/cache.service';
import { ConfigService } from '@nestjs/config';
import { CustomLoggerService } from '../config/logger.service';

export interface HealthCheckResult {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  version: string;
  environment: string;
  uptime: number;
  services: {
    database: ServiceHealth;
    redis: ServiceHealth;
    external?: ServiceHealth;
  };
  metrics?: {
    memoryUsage: NodeJS.MemoryUsage;
    cpuUsage: NodeJS.CpuUsage;
  };
}

export interface ServiceHealth {
  status: 'up' | 'down' | 'degraded';
  responseTime?: number;
  details?: any;
  error?: string;
}

@ApiTags('Health')
@Controller('health')
export class HealthController {
  private readonly startTime = Date.now();

  constructor(
    private readonly prisma: PrismaService,
    private readonly cacheService: CacheService,
    private readonly configService: ConfigService,
    private readonly logger: CustomLoggerService,
  ) {}

  @Get()
  @ApiOperation({ 
    summary: 'Comprehensive health check',
    description: 'Returns detailed health status of all system components including database, cache, and external services'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'System is healthy',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'object',
          properties: {
            status: { type: 'string', enum: ['healthy', 'unhealthy', 'degraded'], example: 'healthy' },
            timestamp: { type: 'string', example: '2024-01-15T10:30:00Z' },
            version: { type: 'string', example: '1.0.0' },
            environment: { type: 'string', example: 'development' },
            uptime: { type: 'number', example: 3600000 },
            services: {
              type: 'object',
              properties: {
                database: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', enum: ['up', 'down', 'degraded'], example: 'up' },
                    responseTime: { type: 'number', example: 15 },
                    details: { type: 'object' }
                  }
                },
                redis: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', enum: ['up', 'down', 'degraded'], example: 'up' },
                    responseTime: { type: 'number', example: 5 },
                    details: { type: 'object' }
                  }
                }
              }
            },
            metrics: {
              type: 'object',
              properties: {
                memoryUsage: { type: 'object' },
                cpuUsage: { type: 'object' }
              }
            }
          }
        },
        timestamp: { type: 'string', example: '2024-01-15T10:30:00Z' }
      }
    }
  })
  @ApiResponse({ 
    status: 503, 
    description: 'System is unhealthy',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        error: {
          type: 'object',
          properties: {
            code: { type: 'string', example: 'SERVICE_UNHEALTHY' },
            message: { type: 'string', example: 'One or more critical services are down' },
            timestamp: { type: 'string', example: '2024-01-15T10:30:00Z' }
          }
        }
      }
    }
  })
  async check(): Promise<HealthCheckResult> {
    const timestamp = new Date().toISOString();
    const uptime = Date.now() - this.startTime;
    const version = this.configService.get('app.version', '1.0.0');
    const environment = this.configService.get('nodeEnv', 'development');

    try {
      // Run all health checks in parallel with timeout
      const healthChecks = await Promise.allSettled([
        this.checkDatabase(),
        this.checkRedis(),
        this.checkExternalServices(),
      ]);

      const [databaseResult, redisResult, externalResult] = healthChecks;

      const services = {
        database: this.extractServiceHealth(databaseResult),
        redis: this.extractServiceHealth(redisResult),
        ...(externalResult.status === 'fulfilled' && { external: externalResult.value }),
      };

      // Determine overall system status
      const status = this.determineOverallStatus(services);

      const result: HealthCheckResult = {
        status,
        timestamp,
        version,
        environment,
        uptime,
        services,
        metrics: {
          memoryUsage: process.memoryUsage(),
          cpuUsage: process.cpuUsage(),
        },
      };

      // Log health check result
      this.logger.log(`Health check completed: ${status}`, {
        context: 'HealthController',
        status,
        services: Object.entries(services).map(([name, health]) => ({
          name,
          status: health.status,
          responseTime: health.responseTime,
        })),
      });

      // Return appropriate HTTP status
      if (status === 'unhealthy') {
        throw new HttpException(result, HttpStatus.SERVICE_UNAVAILABLE);
      }

      return result;
    } catch (error) {
      this.logger.error('Health check failed:', error.stack, {
        context: 'HealthController',
        error: error.message,
      });
      
      if (error instanceof HttpException) {
        throw error;
      }

      const errorResult: HealthCheckResult = {
        status: 'unhealthy',
        timestamp,
        version,
        environment,
        uptime,
        services: {
          database: { status: 'down', error: 'Health check failed' },
          redis: { status: 'down', error: 'Health check failed' },
        },
      };

      throw new HttpException(errorResult, HttpStatus.SERVICE_UNAVAILABLE);
    }
  }

  @Get('ready')
  @ApiOperation({ 
    summary: 'Readiness probe',
    description: 'Kubernetes readiness probe endpoint - checks if service is ready to receive traffic'
  })
  @ApiResponse({ status: 200, description: 'Service is ready' })
  @ApiResponse({ status: 503, description: 'Service is not ready' })
  async readiness(): Promise<{ status: string; timestamp: string }> {
    try {
      // Quick checks for readiness
      await Promise.all([
        this.quickDatabaseCheck(),
        this.quickRedisCheck(),
      ]);

      return {
        status: 'ready',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.warn('Readiness check failed:', {
        context: 'HealthController',
        error: error.message,
      });
      throw new HttpException(
        {
          status: 'not ready',
          timestamp: new Date().toISOString(),
          error: error.message,
        },
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  @Get('live')
  @ApiOperation({ 
    summary: 'Liveness probe',
    description: 'Kubernetes liveness probe endpoint - checks if service is alive'
  })
  @ApiResponse({ status: 200, description: 'Service is alive' })
  async liveness(): Promise<{ status: string; timestamp: string; uptime: number }> {
    return {
      status: 'alive',
      timestamp: new Date().toISOString(),
      uptime: Date.now() - this.startTime,
    };
  }

  private async checkDatabase(): Promise<ServiceHealth> {
    const startTime = Date.now();
    
    try {
      // Test database connection with a simple query
      await this.prisma.$queryRaw`SELECT 1 as test`;
      
      // Get database stats
      const stats = await this.getDatabaseStats();
      
      const responseTime = Date.now() - startTime;
      
      return {
        status: responseTime > 1000 ? 'degraded' : 'up',
        responseTime,
        details: stats,
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      this.logger.error('Database health check failed:', error.stack, {
        context: 'HealthController',
        operation: 'database_health_check',
        responseTime,
      });
      
      return {
        status: 'down',
        responseTime,
        error: error.message,
      };
    }
  }

  private async checkRedis(): Promise<ServiceHealth> {
    const startTime = Date.now();
    
    try {
      // Test Redis connection with ping and get stats
      const stats = await this.cacheService.getStats();
      const responseTime = Date.now() - startTime;
      
      if (!stats.connected) {
        return {
          status: 'down',
          responseTime,
          error: 'Redis not connected',
        };
      }
      
      return {
        status: responseTime > 500 ? 'degraded' : 'up',
        responseTime,
        details: stats,
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      this.logger.error('Redis health check failed:', error.stack, {
        context: 'HealthController',
        operation: 'redis_health_check',
        responseTime,
      });
      
      return {
        status: 'down',
        responseTime,
        error: error.message,
      };
    }
  }

  private async checkExternalServices(): Promise<ServiceHealth> {
    // Placeholder for external service checks
    // This could include checks for:
    // - External APIs
    // - Message queues
    // - File storage services
    // - Third-party integrations
    
    try {
      // Example: Check external API endpoint
      // const response = await fetch('https://api.external-service.com/health');
      // if (!response.ok) throw new Error('External service unavailable');
      
      return {
        status: 'up',
        responseTime: 0,
        details: { message: 'No external services configured' },
      };
    } catch (error) {
      return {
        status: 'down',
        error: error.message,
      };
    }
  }

  private async quickDatabaseCheck(): Promise<void> {
    await this.prisma.$queryRaw`SELECT 1`;
  }

  private async quickRedisCheck(): Promise<void> {
    const stats = await this.cacheService.getStats();
    if (!stats.connected) {
      throw new Error('Redis not connected');
    }
  }

  private async getDatabaseStats(): Promise<any> {
    try {
      // Get basic database statistics
      const [connectionCount, databaseSize] = await Promise.all([
        this.prisma.$queryRaw`SELECT count(*) as connections FROM pg_stat_activity WHERE state = 'active'`,
        this.prisma.$queryRaw`SELECT pg_size_pretty(pg_database_size(current_database())) as size`,
      ]);

      return {
        activeConnections: connectionCount[0]?.connections || 0,
        databaseSize: databaseSize[0]?.size || 'unknown',
      };
    } catch (error) {
      this.logger.warn('Failed to get database stats:', {
        context: 'HealthController',
        error: error.message,
      });
      return { error: 'Stats unavailable' };
    }
  }

  private extractServiceHealth(result: PromiseSettledResult<ServiceHealth>): ServiceHealth {
    if (result.status === 'fulfilled') {
      return result.value;
    } else {
      return {
        status: 'down',
        error: result.reason?.message || 'Unknown error',
      };
    }
  }

  private determineOverallStatus(services: Record<string, ServiceHealth>): 'healthy' | 'unhealthy' | 'degraded' {
    const serviceStatuses = Object.values(services).map(service => service.status);
    
    // If any critical service is down, system is unhealthy
    if (serviceStatuses.includes('down')) {
      return 'unhealthy';
    }
    
    // If any service is degraded, system is degraded
    if (serviceStatuses.includes('degraded')) {
      return 'degraded';
    }
    
    // All services are up
    return 'healthy';
  }
}