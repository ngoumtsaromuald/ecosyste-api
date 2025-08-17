import { Injectable, UnauthorizedException, Inject, forwardRef } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as jwt from 'jsonwebtoken';
import { SessionService } from './session.service';
import { AuditService } from './audit.service';
import { UserRepository } from '../../repositories/user.repository';
import { UserType, Plan } from '@prisma/client';

export interface JWTPayload {
  sub: string;
  email: string;
  userType: UserType;
  plan: Plan;
  permissions: string[];
  iat: number;
  exp?: number;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface User {
  id: string;
  email: string;
  userType: UserType;
  plan: Plan;
}

@Injectable()
export class JWTService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @Inject(forwardRef(() => SessionService))
    private readonly sessionService: SessionService,
    private readonly auditService: AuditService,
    private readonly userRepository: UserRepository,
  ) {}

  async generateTokens(user: User): Promise<TokenPair> {
    const payload: JWTPayload = {
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
    
    const refreshToken = jwt.sign(
      { sub: user.id, type: 'refresh' },
      refreshSecret,
      { expiresIn: refreshExpiresIn }
    );

    await this.auditService.logTokenGeneration(user.id, 'access_token');

    return {
      accessToken,
      refreshToken,
      expiresIn: this.getTokenExpiration('JWT_ACCESS_EXPIRES'),
    };
  }

  async validateToken(token: string): Promise<JWTPayload> {
    try {
      const payload = this.jwtService.verify(token) as JWTPayload;
      
      // Check if token is blacklisted
      const isBlacklisted = await this.sessionService.isTokenBlacklisted(token);
      if (isBlacklisted) {
        throw new UnauthorizedException('Token has been revoked');
      }

      return payload;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error; // Re-throw UnauthorizedException (like blacklisted token)
      }
      if (error instanceof jwt.TokenExpiredError) {
        throw new UnauthorizedException('Token has expired');
      }
      throw new UnauthorizedException('Invalid token');
    }
  }

  async refreshTokens(refreshToken: string): Promise<TokenPair> {
    try {
      const payload = jwt.verify(
        refreshToken,
        this.configService.get('jwt.refreshSecret') || process.env.REFRESH_TOKEN_SECRET
      ) as { sub: string; type: string };

      if (payload.type !== 'refresh') {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const session = await this.sessionService.validateRefreshToken(payload.sub, refreshToken);
      if (!session) {
        throw new UnauthorizedException('Refresh token not found or expired');
      }

      // Note: We'll need to get user from UserRepository
      // For now, we'll create a placeholder that will be replaced
      const user = await this.getUserById(payload.sub);
      const newTokens = await this.generateTokens(user);
      
      // Update session with new refresh token
      await this.sessionService.updateSession(session.id, newTokens.refreshToken);

      return newTokens;
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  private async getUserPermissions(user: User): Promise<string[]> {
    const basePermissions = ['read:profile', 'update:profile'];
    
    if (user.userType === UserType.BUSINESS) {
      basePermissions.push('read:business', 'update:business');
    }
    
    if (user.userType === UserType.ADMIN) {
      basePermissions.push('admin:*');
    }

    return basePermissions;
  }

  private getTokenExpiration(configKey: string): number {
    const expiresIn = this.configService.get(configKey, '15m');
    // Convert string like '15m' to seconds
    const match = expiresIn.match(/^(\d+)([smhd])$/);
    if (!match) return 900; // default 15 minutes
    
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

  // Get user from UserRepository
  private async getUserById(id: string): Promise<User> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return user;
  }
}