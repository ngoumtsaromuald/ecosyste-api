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
export declare class HealthController {
    private readonly prisma;
    private readonly cacheService;
    private readonly configService;
    private readonly logger;
    private readonly startTime;
    constructor(prisma: PrismaService, cacheService: CacheService, configService: ConfigService, logger: CustomLoggerService);
    check(): Promise<HealthCheckResult>;
    readiness(): Promise<{
        status: string;
        timestamp: string;
    }>;
    liveness(): Promise<{
        status: string;
        timestamp: string;
        uptime: number;
    }>;
    private checkDatabase;
    private checkRedis;
    private checkExternalServices;
    private quickDatabaseCheck;
    private quickRedisCheck;
    private getDatabaseStats;
    private extractServiceHealth;
    private determineOverallStatus;
}
