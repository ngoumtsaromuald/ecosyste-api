import { PrismaService } from '../../config/prisma.service';
import { Session } from '@prisma/client';
export interface CreateSessionData {
    userId: string;
    refreshToken: string;
    userAgent?: string;
    ipAddress?: string;
    expiresAt: Date;
}
export interface UpdateSessionData {
    refreshToken?: string;
    lastUsedAt?: Date;
    isActive?: boolean;
}
export declare class SessionRepository {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(data: CreateSessionData): Promise<Session>;
    findByRefreshToken(refreshToken: string): Promise<Session | null>;
    findActiveSessionsByUserId(userId: string): Promise<Session[]>;
    update(sessionId: string, data: UpdateSessionData): Promise<Session>;
    invalidate(sessionId: string): Promise<Session>;
    invalidateByUserId(userId: string): Promise<void>;
    deleteExpiredSessions(): Promise<void>;
    findById(sessionId: string): Promise<Session | null>;
}
