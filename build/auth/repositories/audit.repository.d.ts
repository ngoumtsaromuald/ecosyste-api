import { PrismaService } from '../../config/prisma.service';
import { AuditLog } from '@prisma/client';
export interface CreateAuditLogData {
    userId?: string;
    action: string;
    resource?: string;
    details?: Record<string, any>;
    ipAddress?: string;
    userAgent?: string;
}
export interface FindAuditLogsParams {
    userId?: string;
    action?: string;
    resource?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
}
export declare class AuditRepository {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(data: CreateAuditLogData): Promise<AuditLog>;
    findByUserId(userId: string, params?: Omit<FindAuditLogsParams, 'userId'>): Promise<AuditLog[]>;
    findByAction(action: string, params?: Omit<FindAuditLogsParams, 'action'>): Promise<AuditLog[]>;
    findMany(params?: FindAuditLogsParams): Promise<AuditLog[]>;
    countByAction(action: string, startDate?: Date, endDate?: Date): Promise<number>;
    countByUserId(userId: string, startDate?: Date, endDate?: Date): Promise<number>;
    deleteOldLogs(olderThanDays?: number): Promise<void>;
}
