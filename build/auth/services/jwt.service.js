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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JWTService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const jwt_1 = require("@nestjs/jwt");
const jwt = require("jsonwebtoken");
const session_service_1 = require("./session.service");
const audit_service_1 = require("./audit.service");
const user_repository_1 = require("../../repositories/user.repository");
const client_1 = require("@prisma/client");
let JWTService = class JWTService {
    constructor(jwtService, configService, sessionService, auditService, userRepository) {
        this.jwtService = jwtService;
        this.configService = configService;
        this.sessionService = sessionService;
        this.auditService = auditService;
        this.userRepository = userRepository;
    }
    async generateTokens(user) {
        const payload = {
            sub: user.id,
            email: user.email,
            userType: user.userType,
            plan: user.plan,
            permissions: await this.getUserPermissions(user),
            iat: Math.floor(Date.now() / 1000),
        };
        const accessToken = this.jwtService.sign(payload, {
            expiresIn: this.configService.get('jwt.expiresIn', '15m'),
        });
        const refreshSecret = this.configService.get('jwt.refreshSecret') || process.env.REFRESH_TOKEN_SECRET;
        const refreshExpiresIn = this.configService.get('jwt.refreshExpiresIn') || process.env.REFRESH_TOKEN_EXPIRES_IN || '7d';
        const refreshToken = jwt.sign({ sub: user.id, type: 'refresh' }, refreshSecret, { expiresIn: refreshExpiresIn });
        await this.auditService.logTokenGeneration(user.id, 'access_token');
        return {
            accessToken,
            refreshToken,
            expiresIn: this.getTokenExpiration('JWT_ACCESS_EXPIRES'),
        };
    }
    async validateToken(token) {
        try {
            const payload = this.jwtService.verify(token);
            const isBlacklisted = await this.sessionService.isTokenBlacklisted(token);
            if (isBlacklisted) {
                throw new common_1.UnauthorizedException('Token has been revoked');
            }
            return payload;
        }
        catch (error) {
            if (error instanceof common_1.UnauthorizedException) {
                throw error;
            }
            if (error instanceof jwt.TokenExpiredError) {
                throw new common_1.UnauthorizedException('Token has expired');
            }
            throw new common_1.UnauthorizedException('Invalid token');
        }
    }
    async refreshTokens(refreshToken) {
        try {
            const payload = jwt.verify(refreshToken, this.configService.get('jwt.refreshSecret') || process.env.REFRESH_TOKEN_SECRET);
            if (payload.type !== 'refresh') {
                throw new common_1.UnauthorizedException('Invalid refresh token');
            }
            const session = await this.sessionService.validateRefreshToken(payload.sub, refreshToken);
            if (!session) {
                throw new common_1.UnauthorizedException('Refresh token not found or expired');
            }
            const user = await this.getUserById(payload.sub);
            const newTokens = await this.generateTokens(user);
            await this.sessionService.updateSession(session.id, newTokens.refreshToken);
            return newTokens;
        }
        catch (error) {
            throw new common_1.UnauthorizedException('Invalid refresh token');
        }
    }
    async getUserPermissions(user) {
        const basePermissions = ['read:profile', 'update:profile'];
        if (user.userType === client_1.UserType.BUSINESS) {
            basePermissions.push('read:business', 'update:business');
        }
        if (user.userType === client_1.UserType.ADMIN) {
            basePermissions.push('admin:*');
        }
        return basePermissions;
    }
    getTokenExpiration(configKey) {
        const expiresIn = this.configService.get(configKey, '15m');
        const match = expiresIn.match(/^(\d+)([smhd])$/);
        if (!match)
            return 900;
        const value = parseInt(match[1]);
        const unit = match[2];
        switch (unit) {
            case 's': return value;
            case 'm': return value * 60;
            case 'h': return value * 3600;
            case 'd': return value * 86400;
            default: return 900;
        }
    }
    async getUserById(id) {
        const user = await this.userRepository.findById(id);
        if (!user) {
            throw new common_1.UnauthorizedException('User not found');
        }
        return user;
    }
};
exports.JWTService = JWTService;
exports.JWTService = JWTService = __decorate([
    (0, common_1.Injectable)(),
    __param(2, (0, common_1.Inject)((0, common_1.forwardRef)(() => session_service_1.SessionService))),
    __metadata("design:paramtypes", [jwt_1.JwtService,
        config_1.ConfigService,
        session_service_1.SessionService,
        audit_service_1.AuditService,
        user_repository_1.UserRepository])
], JWTService);
//# sourceMappingURL=jwt.service.js.map