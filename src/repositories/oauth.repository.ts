import { Injectable } from '@nestjs/common';
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

@Injectable()
export class OAuthRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateOAuthAccountData): Promise<OAuthAccount> {
    return this.prisma.oAuthAccount.create({
      data,
      include: {
        user: true,
      },
    });
  }

  async findById(id: string): Promise<OAuthAccount | null> {
    return this.prisma.oAuthAccount.findUnique({
      where: { id },
      include: {
        user: true,
      },
    });
  }

  async findByProviderAndId(
    provider: OAuthProvider,
    providerId: string,
  ): Promise<OAuthAccount | null> {
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

  async findByUserId(userId: string): Promise<OAuthAccount[]> {
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

  async findByUserIdAndProvider(
    userId: string,
    provider: OAuthProvider,
  ): Promise<OAuthAccount | null> {
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

  async updateTokens(
    id: string,
    data: UpdateOAuthTokensData,
  ): Promise<OAuthAccount> {
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

  async update(
    id: string,
    data: Partial<CreateOAuthAccountData>,
  ): Promise<OAuthAccount> {
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

  async delete(id: string): Promise<OAuthAccount> {
    return this.prisma.oAuthAccount.delete({
      where: { id },
    });
  }

  async deleteByUserIdAndProvider(
    userId: string,
    provider: OAuthProvider,
  ): Promise<OAuthAccount | null> {
    const account = await this.findByUserIdAndProvider(userId, provider);
    if (!account) {
      return null;
    }

    return this.prisma.oAuthAccount.delete({
      where: { id: account.id },
    });
  }

  async findAll(options?: {
    skip?: number;
    take?: number;
    where?: Prisma.OAuthAccountWhereInput;
    orderBy?: Prisma.OAuthAccountOrderByWithRelationInput;
  }): Promise<OAuthAccount[]> {
    return this.prisma.oAuthAccount.findMany({
      ...options,
      include: {
        user: true,
      },
    });
  }

  async count(where?: Prisma.OAuthAccountWhereInput): Promise<number> {
    return this.prisma.oAuthAccount.count({ where });
  }

  async findExpiredTokens(): Promise<OAuthAccount[]> {
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
}