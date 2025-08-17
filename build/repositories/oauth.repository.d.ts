import { PrismaService } from '../config/prisma.service';
import { OAuthAccount, OAuthProvider, Prisma } from '@prisma/client';
export interface CreateOAuthAccountData {
    userId: string;
    provider: OAuthProvider;
    providerId: string;
    accessToken?: string;
    refreshToken?: string;
    expiresAt?: Date;
}
export interface UpdateOAuthTokensData {
    accessToken?: string;
    refreshToken?: string;
    expiresAt?: Date;
}
export declare class OAuthRepository {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(data: CreateOAuthAccountData): Promise<OAuthAccount>;
    findById(id: string): Promise<OAuthAccount | null>;
    findByProviderAndId(provider: OAuthProvider, providerId: string): Promise<OAuthAccount | null>;
    findByUserId(userId: string): Promise<OAuthAccount[]>;
    findByUserIdAndProvider(userId: string, provider: OAuthProvider): Promise<OAuthAccount | null>;
    updateTokens(id: string, data: UpdateOAuthTokensData): Promise<OAuthAccount>;
    update(id: string, data: Partial<CreateOAuthAccountData>): Promise<OAuthAccount>;
    delete(id: string): Promise<OAuthAccount>;
    deleteByUserIdAndProvider(userId: string, provider: OAuthProvider): Promise<OAuthAccount | null>;
    findAll(options?: {
        skip?: number;
        take?: number;
        where?: Prisma.OAuthAccountWhereInput;
        orderBy?: Prisma.OAuthAccountOrderByWithRelationInput;
    }): Promise<OAuthAccount[]>;
    count(where?: Prisma.OAuthAccountWhereInput): Promise<number>;
    findExpiredTokens(): Promise<OAuthAccount[]>;
}
