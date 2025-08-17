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
exports.SessionService = void 0;
const common_1 = require("@nestjs/common");
const ioredis_1 = require("ioredis");
const session_repository_1 = require("../repositories/session.repository");
let SessionService = class SessionService {
    constructor(redis, sessionRepository) {
        this.redis = redis;
        this.sessionRepository = sessionRepository;
    }
    async createSession(userId, refreshToken, userAgent, ipAddress) {
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);
        const sessionData = {
            userId,
            refreshToken,
            userAgent,
            ipAddress,
            expiresAt,
        };
        const session = await this.sessionRepository.create(sessionData);
        try {
            const sessionKey = `session:${session.id}`;
            await this.redis.setex(sessionKey, 7 * 24 * 60 * 60, JSON.stringify(session));
        }
        catch (redisError) {
        }
        return session;
    }
    async validateRefreshToken(userId, refreshToken) {
        const sessions = await this.getActiveSessionsByUserId(userId);
        const cachedSession = sessions?.find(s => s.refreshToken === refreshToken && s.isActive);
        if (cachedSession && cachedSession.expiresAt > new Date()) {
            return cachedSession;
        }
        const session = await this.sessionRepository.findByRefreshToken(refreshToken);
        if (!session || !session.isActive || session.expiresAt <= new Date()) {
            return null;
        }
        return session;
    }
    async updateSession(sessionId, newRefreshToken) {
        await this.sessionRepository.update(sessionId, {
            refreshToken: newRefreshToken,
            lastUsedAt: new Date(),
        });
        try {
            const sessionKey = `session:${sessionId}`;
            const cachedSession = await this.redis.get(sessionKey);
            if (cachedSession) {
                const session = JSON.parse(cachedSession);
                session.refreshToken = newRefreshToken;
                session.lastUsedAt = new Date().toISOString();
                await this.redis.setex(sessionKey, 7 * 24 * 60 * 60, JSON.stringify(session));
            }
        }
        catch (redisError) {
        }
    }
    async invalidateSession(userId, token) {
        if (token) {
            const sessions = await this.getActiveSessionsByUserId(userId);
            const session = sessions.find(s => s.refreshToken === token);
            if (session) {
                await this.sessionRepository.invalidate(session.id);
                await this.redis.del(`session:${session.id}`);
                await this.addTokenToBlacklist(token);
            }
        }
        else {
            await this.invalidateAllUserSessions(userId);
        }
    }
    async invalidateAllUserSessions(userId) {
        const sessions = await this.getActiveSessionsByUserId(userId);
        for (const session of sessions) {
            await this.sessionRepository.invalidate(session.id);
            await this.redis.del(`session:${session.id}`);
            await this.addTokenToBlacklist(session.refreshToken);
        }
    }
    async isTokenBlacklisted(token) {
        const blacklistKey = `blacklist:${token}`;
        const result = await this.redis.get(blacklistKey);
        return result !== null;
    }
    async getActiveSessionsByUserId(userId) {
        try {
            const userSessionsKey = `user_sessions:${userId}`;
            const cachedSessions = await this.redis.get(userSessionsKey);
            if (cachedSessions) {
                try {
                    const parsed = JSON.parse(cachedSessions);
                    return parsed.map(session => ({
                        ...session,
                        expiresAt: new Date(session.expiresAt),
                        createdAt: new Date(session.createdAt),
                        lastUsedAt: new Date(session.lastUsedAt),
                    }));
                }
                catch (parseError) {
                }
            }
        }
        catch (redisError) {
        }
        const sessions = await this.sessionRepository.findActiveSessionsByUserId(userId);
        try {
            await this.redis.setex(`user_sessions:${userId}`, 300, JSON.stringify(sessions));
        }
        catch (cacheError) {
        }
        return sessions;
    }
    async addTokenToBlacklist(token) {
        const blacklistKey = `blacklist:${token}`;
        await this.redis.setex(blacklistKey, 7 * 24 * 60 * 60, 'blacklisted');
    }
    async cleanupExpiredSessions() {
        await this.sessionRepository.deleteExpiredSessions();
    }
};
exports.SessionService = SessionService;
exports.SessionService = SessionService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)('REDIS_CLIENT')),
    __metadata("design:paramtypes", [ioredis_1.Redis,
        session_repository_1.SessionRepository])
], SessionService);
//# sourceMappingURL=session.service.js.map