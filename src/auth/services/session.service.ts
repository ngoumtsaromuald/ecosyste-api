import { Injectable, Inject } from '@nestjs/common';
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

@Injectable()
export class SessionService {
  constructor(
    @Inject('REDIS_CLIENT') private readonly redis: Redis,
    private readonly sessionRepository: SessionRepository,
  ) {}

  async createSession(
    userId: string, 
    refreshToken: string, 
    userAgent?: string, 
    ipAddress?: string
  ): Promise<Session> {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    const sessionData: CreateSessionData = {
      userId,
      refreshToken,
      userAgent,
      ipAddress,
      expiresAt,
    };

    const session = await this.sessionRepository.create(sessionData);
    
    // Store session in Redis for fast access
    try {
      const sessionKey = `session:${session.id}`;
      await this.redis.setex(
        sessionKey,
        7 * 24 * 60 * 60, // 7 days in seconds
        JSON.stringify(session)
      );
    } catch (redisError) {
      // Ignore Redis errors during session creation
    }

    return session;
  }

  async validateRefreshToken(userId: string, refreshToken: string): Promise<Session | null> {
    // First try Redis cache
    const sessions = await this.getActiveSessionsByUserId(userId);
    const cachedSession = sessions?.find(s => s.refreshToken === refreshToken && s.isActive);
    
    if (cachedSession && cachedSession.expiresAt > new Date()) {
      return cachedSession;
    }

    // Fallback to database
    const session = await this.sessionRepository.findByRefreshToken(refreshToken);
    
    if (!session || !session.isActive || session.expiresAt <= new Date()) {
      return null;
    }

    return session;
  }

  async updateSession(sessionId: string, newRefreshToken: string): Promise<void> {
    await this.sessionRepository.update(sessionId, {
      refreshToken: newRefreshToken,
      lastUsedAt: new Date(),
    });

    // Update Redis cache
    try {
      const sessionKey = `session:${sessionId}`;
      const cachedSession = await this.redis.get(sessionKey);
      
      if (cachedSession) {
        const session = JSON.parse(cachedSession);
        session.refreshToken = newRefreshToken;
        session.lastUsedAt = new Date().toISOString();
        
        await this.redis.setex(
          sessionKey,
          7 * 24 * 60 * 60, // 7 days
          JSON.stringify(session)
        );
      }
    } catch (redisError) {
      // Ignore Redis errors during session update
    }
  }

  async invalidateSession(userId: string, token?: string): Promise<void> {
    if (token) {
      // Invalidate specific session
      const sessions = await this.getActiveSessionsByUserId(userId);
      const session = sessions.find(s => s.refreshToken === token);
      
      if (session) {
        await this.sessionRepository.invalidate(session.id);
        await this.redis.del(`session:${session.id}`);
        
        // Add token to blacklist
        await this.addTokenToBlacklist(token);
      }
    } else {
      // Invalidate all user sessions
      await this.invalidateAllUserSessions(userId);
    }
  }

  async invalidateAllUserSessions(userId: string): Promise<void> {
    const sessions = await this.getActiveSessionsByUserId(userId);
    
    for (const session of sessions) {
      await this.sessionRepository.invalidate(session.id);
      await this.redis.del(`session:${session.id}`);
      await this.addTokenToBlacklist(session.refreshToken);
    }
  }

  async isTokenBlacklisted(token: string): Promise<boolean> {
    const blacklistKey = `blacklist:${token}`;
    const result = await this.redis.get(blacklistKey);
    return result !== null;
  }

  async getActiveSessionsByUserId(userId: string): Promise<Session[]> {
    try {
      // Try to get from Redis first
      const userSessionsKey = `user_sessions:${userId}`;
      const cachedSessions = await this.redis.get(userSessionsKey);
      
      if (cachedSessions) {
        try {
          const parsed = JSON.parse(cachedSessions);
          // Convert date strings back to Date objects
          return parsed.map(session => ({
            ...session,
            expiresAt: new Date(session.expiresAt),
            createdAt: new Date(session.createdAt),
            lastUsedAt: new Date(session.lastUsedAt),
          }));
        } catch (parseError) {
          // If JSON parsing fails, fall back to database
        }
      }
    } catch (redisError) {
      // If Redis fails, fall back to database
    }

    // Fallback to database
    const sessions = await this.sessionRepository.findActiveSessionsByUserId(userId);
    
    // Try to cache the result
    try {
      await this.redis.setex(
        `user_sessions:${userId}`,
        300, // 5 minutes
        JSON.stringify(sessions)
      );
    } catch (cacheError) {
      // Ignore cache errors
    }

    return sessions;
  }

  private async addTokenToBlacklist(token: string): Promise<void> {
    const blacklistKey = `blacklist:${token}`;
    // Set expiration to match token expiration (7 days for refresh tokens)
    await this.redis.setex(blacklistKey, 7 * 24 * 60 * 60, 'blacklisted');
  }

  // Cleanup expired sessions (should be called periodically)
  async cleanupExpiredSessions(): Promise<void> {
    await this.sessionRepository.deleteExpiredSessions();
    
    // Clean up Redis cache - this would need a more sophisticated approach in production
    // For now, we'll just let Redis handle expiration automatically
  }
}