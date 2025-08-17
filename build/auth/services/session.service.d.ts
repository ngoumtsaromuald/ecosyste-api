import { Redis } from 'ioredis';
import { SessionRepository } from '../repositories/session.repository';
export interface Session {
    id: string;
    userId: string;
    refreshToken: string;
    userAgent?: string;
    ipAddress?: string;
    isActive: boolean;
    expiresAt: Date;
    createdAt: Date;
    lastUsedAt: Date;
}
export interface CreateSessionData {
    userId: string;
    refreshToken: string;
    userAgent?: string;
    ipAddress?: string;
    expiresAt: Date;
}
export declare class SessionService {
    private readonly redis;
    private readonly sessionRepository;
    constructor(redis: Redis, sessionRepository: SessionRepository);
    createSession(userId: string, refreshToken: string, userAgent?: string, ipAddress?: string): Promise<Session>;
    validateRefreshToken(userId: string, refreshToken: string): Promise<Session | null>;
    updateSession(sessionId: string, newRefreshToken: string): Promise<void>;
    invalidateSession(userId: string, token?: string): Promise<void>;
    invalidateAllUserSessions(userId: string): Promise<void>;
    isTokenBlacklisted(token: string): Promise<boolean>;
    getActiveSessionsByUserId(userId: string): Promise<Session[]>;
    private addTokenToBlacklist;
    cleanupExpiredSessions(): Promise<void>;
}
