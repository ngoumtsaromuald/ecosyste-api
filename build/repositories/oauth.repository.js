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
exports.OAuthRepository = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../config/prisma.service");
let OAuthRepository = class OAuthRepository {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(data) {
        return this.prisma.oAuthAccount.create({
            data,
            include: {
                user: true,
            },
        });
    }
    async findById(id) {
        return this.prisma.oAuthAccount.findUnique({
            where: { id },
            include: {
                user: true,
            },
        });
    }
    async findByProviderAndId(provider, providerId) {
        return this.prisma.oAuthAccount.findUnique({
            where: {
                provider_providerId: {
                    provider,
                    providerId,
                },
            },
            include: {
                user: true,
            },
        });
    }
    async findByUserId(userId) {
        return this.prisma.oAuthAccount.findMany({
            where: { userId },
            include: {
                user: true,
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
    }
    async findByUserIdAndProvider(userId, provider) {
        return this.prisma.oAuthAccount.findFirst({
            where: {
                userId,
                provider,
            },
            include: {
                user: true,
            },
        });
    }
    async updateTokens(id, data) {
        return this.prisma.oAuthAccount.update({
            where: { id },
            data: {
                ...data,
                updatedAt: new Date(),
            },
            include: {
                user: true,
            },
        });
    }
    async update(id, data) {
        return this.prisma.oAuthAccount.update({
            where: { id },
            data: {
                ...data,
                updatedAt: new Date(),
            },
            include: {
                user: true,
            },
        });
    }
    async delete(id) {
        return this.prisma.oAuthAccount.delete({
            where: { id },
        });
    }
    async deleteByUserIdAndProvider(userId, provider) {
        const account = await this.findByUserIdAndProvider(userId, provider);
        if (!account) {
            return null;
        }
        return this.prisma.oAuthAccount.delete({
            where: { id: account.id },
        });
    }
    async findAll(options) {
        return this.prisma.oAuthAccount.findMany({
            ...options,
            include: {
                user: true,
            },
        });
    }
    async count(where) {
        return this.prisma.oAuthAccount.count({ where });
    }
    async findExpiredTokens() {
        return this.prisma.oAuthAccount.findMany({
            where: {
                expiresAt: {
                    lte: new Date(),
                },
                accessToken: {
                    not: null,
                },
            },
            include: {
                user: true,
            },
        });
    }
};
exports.OAuthRepository = OAuthRepository;
exports.OAuthRepository = OAuthRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], OAuthRepository);
//# sourceMappingURL=oauth.repository.js.map