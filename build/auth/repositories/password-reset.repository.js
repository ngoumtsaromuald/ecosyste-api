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
exports.PasswordResetRepository = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../config/prisma.service");
let PasswordResetRepository = class PasswordResetRepository {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(data) {
        return this.prisma.passwordReset.create({
            data: {
                userId: data.userId,
                token: data.token,
                expiresAt: data.expiresAt,
            },
        });
    }
    async findByToken(token) {
        return this.prisma.passwordReset.findUnique({
            where: {
                token,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        name: true,
                    },
                },
            },
        });
    }
    async findValidByToken(token) {
        return this.prisma.passwordReset.findFirst({
            where: {
                token,
                expiresAt: {
                    gt: new Date(),
                },
                usedAt: null,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        name: true,
                    },
                },
            },
        });
    }
    async markAsUsed(id) {
        return this.prisma.passwordReset.update({
            where: {
                id,
            },
            data: {
                usedAt: new Date(),
            },
        });
    }
    async findByUserId(userId) {
        return this.prisma.passwordReset.findMany({
            where: {
                userId,
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
    }
    async invalidateAllForUser(userId) {
        await this.prisma.passwordReset.updateMany({
            where: {
                userId,
                usedAt: null,
                expiresAt: {
                    gt: new Date(),
                },
            },
            data: {
                usedAt: new Date(),
            },
        });
    }
    async deleteExpiredTokens() {
        await this.prisma.passwordReset.deleteMany({
            where: {
                expiresAt: {
                    lt: new Date(),
                },
            },
        });
    }
};
exports.PasswordResetRepository = PasswordResetRepository;
exports.PasswordResetRepository = PasswordResetRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PasswordResetRepository);
//# sourceMappingURL=password-reset.repository.js.map