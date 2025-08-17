import { Injectable } from '@nestjs/common';
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

@Injectable()
export class AuditRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateAuditLogData): Promise<AuditLog> {
    return this.prisma.auditLog.create({
      data: {
        userId: data.userId,
        action: data.action,
        resource: data.resource,
        details: data.details || {},
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
      },
    });
  }

  async findByUserId(
    userId: string,
    params: Omit<FindAuditLogsParams, 'userId'> = {}
  ): Promise<AuditLog[]> {
    return this.prisma.auditLog.findMany({
      where: {
        userId,
        action: params.action,
        resource: params.resource,
        createdAt: {
          gte: params.startDate,
          lte: params.endDate,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: params.limit || 50,
      skip: params.offset || 0,
    });
  }

  async findByAction(
    action: string,
    params: Omit<FindAuditLogsParams, 'action'> = {}
  ): Promise<AuditLog[]> {
    return this.prisma.auditLog.findMany({
      where: {
        action,
        userId: params.userId,
        resource: params.resource,
        createdAt: {
          gte: params.startDate,
          lte: params.endDate,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: params.limit || 50,
      skip: params.offset || 0,
    });
  }

  async findMany(params: FindAuditLogsParams = {}): Promise<AuditLog[]> {
    return this.prisma.auditLog.findMany({
      where: {
        userId: params.userId,
        action: params.action,
        resource: params.resource,
        createdAt: {
          gte: params.startDate,
          lte: params.endDate,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: params.limit || 50,
      skip: params.offset || 0,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            userType: true,
          },
        },
      },
    });
  }

  async countByAction(action: string, startDate?: Date, endDate?: Date): Promise<number> {
    return this.prisma.auditLog.count({
      where: {
        action,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    });
  }

  async countByUserId(userId: string, startDate?: Date, endDate?: Date): Promise<number> {
    return this.prisma.auditLog.count({
      where: {
        userId,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    });
  }

  // Cleanup old audit logs (should be called periodically)
  async deleteOldLogs(olderThanDays: number = 90): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    await this.prisma.auditLog.deleteMany({
      where: {
        createdAt: {
          lt: cutoffDate,
        },
      },
    });
  }
}