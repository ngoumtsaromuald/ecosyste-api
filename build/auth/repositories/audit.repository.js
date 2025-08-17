"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditRepository = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../config/prisma.service");
let AuditRepository = class AuditRepository {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(data) {
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
    async findByUserId(userId, params = {}) {
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
    async findByAction(action, params = {}) {
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
    async findMany(params = {}) {
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
    async countByAction(action, startDate, endDate) {
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
    async countByUserId(userId, startDate, endDate) {
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
    async deleteOldLogs(olderThanDays = 90) {
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
};
exports.AuditRepository = AuditRepository;
exports.AuditRepository = AuditRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AuditRepository);
//# sourceMappingURL=audit.repository.js.map