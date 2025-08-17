import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';
import { PasswordReset } from '@prisma/client';

export interface CreatePasswordResetData {
  userId: string;
  token: string;
  expiresAt: Date;
}

@Injectable()
export class PasswordResetRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreatePasswordResetData): Promise<PasswordReset> {
    return this.prisma.passwordReset.create({
      data: {
        userId: data.userId,
        token: data.token,
        expiresAt: data.expiresAt,
      },
    });
  }

  async findByToken(token: string): Promise<PasswordReset | null> {
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

  async findValidByToken(token: string): Promise<PasswordReset | null> {
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

  async markAsUsed(id: string): Promise<PasswordReset> {
    return this.prisma.passwordReset.update({
      where: {
        id,
      },
      data: {
        usedAt: new Date(),
      },
    });
  }

  async findByUserId(userId: string): Promise<PasswordReset[]> {
    return this.prisma.passwordReset.findMany({
      where: {
        userId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async invalidateAllForUser(userId: string): Promise<void> {
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

  // Cleanup expired tokens (should be called periodically)
  async deleteExpiredTokens(): Promise<void> {
    await this.prisma.passwordReset.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });
  }
}