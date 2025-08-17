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
exports.SessionRepository = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../config/prisma.service");
let SessionRepository = class SessionRepository {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(data) {
        return this.prisma.session.create({
            data: {
                userId: data.userId,
                refreshToken: data.refreshToken,
                userAgent: data.userAgent,
                ipAddress: data.ipAddress,
                expiresAt: data.expiresAt,
                isActive: true,
            },
        });
    }
    async findByRefreshToken(refreshToken) {
        return this.prisma.session.findFirst({
            where: {
                refreshToken,
                isActive: true,
                expiresAt: {
                    gt: new Date(),
                },
            },
        });
    }
    async findActiveSessionsByUserId(userId) {
        return this.prisma.session.findMany({
            where: {
                userId,
                isActive: true,
                expiresAt: {
                    gt: new Date(),
                },
            },
            orderBy: {
                lastUsedAt: 'desc',
            },
        });
    }
    async update(sessionId, data) {
        return this.prisma.session.update({
            where: { id: sessionId },
            data,
        });
    }
    async invalidate(sessionId) {
        return this.prisma.session.update({
            where: { id: sessionId },
            data: {
                isActive: false,
            },
        });
    }
    async invalidateByUserId(userId) {
        await this.prisma.session.updateMany({
            where: {
                userId,
                isActive: true,
            },
            data: {
                isActive: false,
            },
        });
    }
    async deleteExpiredSessions() {
        await this.prisma.session.deleteMany({
            where: {
                expiresAt: {
                    lt: new Date(),
                },
            },
        });
    }
    async findById(sessionId) {
        return this.prisma.session.findUnique({
            where: { id: sessionId },
        });
    }
};
exports.SessionRepository = SessionRepository;
exports.SessionRepository = SessionRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SessionRepository);
//# sourceMappingURL=session.repository.js.map