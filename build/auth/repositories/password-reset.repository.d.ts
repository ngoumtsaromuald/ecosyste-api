import { PrismaService } from '../../config/prisma.service';
import { PasswordReset } from '@prisma/client';
export interface CreatePasswordResetData {
    userId: string;
    token: string;
    expiresAt: Date;
}
export declare class PasswordResetRepository {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(data: CreatePasswordResetData): Promise<PasswordReset>;
    findByToken(token: string): Promise<PasswordReset | null>;
    findValidByToken(token: string): Promise<PasswordReset | null>;
    markAsUsed(id: string): Promise<PasswordReset>;
    findByUserId(userId: string): Promise<PasswordReset[]>;
    invalidateAllForUser(userId: string): Promise<void>;
    deleteExpiredTokens(): Promise<void>;
}
