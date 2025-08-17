import { Test, TestingModule } from '@nestjs/testing';
import { SessionService, Session, CreateSessionData } from '../session.service';
import { SessionRepository } from '../../repositories/session.repository';
import { Redis } from 'ioredis';

describe('SessionService', () => {
  let service: SessionService;
  let sessionRepository: SessionRepository;
  let redis: Redis;

  const mockSession: Session = {
    id: 'session-123',
    userId: 'user-123',
    refreshToken: 'refresh-token-123',
    userAgent: 'Mozilla/5.0',
    ipAddress: '192.168.1.1',
    isActive: true,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    createdAt: new Date(),
    lastUsedAt: new Date(),
  };

  const mockCreateSessionData: CreateSessionData = {
    userId: 'user-123',
    refreshToken: 'refresh-token-123',
    userAgent: 'Mozilla/5.0',
    ipAddress: '192.168.1.1',
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SessionService,
        {
          provide: 'REDIS_CLIENT',
          useValue: {
            setex: jest.fn(),
            get: jest.fn(),
            del: jest.fn(),
          },
        },
        {
          provide: SessionRepository,
          useValue: {
            create: jest.fn(),
            findByRefreshToken: jest.fn(),
            findActiveSessionsByUserId: jest.fn(),
            update: jest.fn(),
            invalidate: jest.fn(),
            deleteExpiredSessions: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<SessionService>(SessionService);
    sessionRepository = module.get<SessionRepository>(SessionRepository);
    redis = module.get<Redis>('REDIS_CLIENT');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createSession', () => {
    it('should create session successfully', async () => {
      (sessionRepository.create as jest.Mock).mockResolvedValue(mockSession);
      (redis.setex as jest.Mock).mockResolvedValue('OK');

      const result = await service.createSession(
        'user-123',
        'refresh-token-123',
        'Mozilla/5.0',
        '192.168.1.1'
      );

      expect(result).toEqual(mockSession);
      expect(sessionRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-123',
          refreshToken: 'refresh-token-123',
          userAgent: 'Mozilla/5.0',
          ipAddress: '192.168.1.1',
          expiresAt: expect.any(Date),
        })
      );
      expect(redis.setex).toHaveBeenCalledWith(
        `session:${mockSession.id}`,
        7 * 24 * 60 * 60, // 7 days in seconds
        JSON.stringify(mockSession)
      );
    });

    it('should create session without optional parameters', async () => {
      const sessionWithoutOptionals = { ...mockSession, userAgent: null, ipAddress: null };
      (sessionRepository.create as jest.Mock).mockResolvedValue(sessionWithoutOptionals);
      (redis.setex as jest.Mock).mockResolvedValue('OK');

      const result = await service.createSession('user-123', 'refresh-token-123');

      expect(result).toEqual(sessionWithoutOptionals);
      expect(sessionRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-123',
          refreshToken: 'refresh-token-123',
          userAgent: undefined,
          ipAddress: undefined,
        })
      );
    });

    it('should handle Redis errors gracefully', async () => {
      (sessionRepository.create as jest.Mock).mockResolvedValue(mockSession);
      (redis.setex as jest.Mock).mockRejectedValue(new Error('Redis connection error'));

      // Should still return the session even if Redis fails
      const result = await service.createSession('user-123', 'refresh-token-123');

      expect(result).toEqual(mockSession);
      expect(sessionRepository.create).toHaveBeenCalled();
    });
  });

  describe('validateRefreshToken', () => {
    it('should return session from Redis cache when available', async () => {
      const cachedSessions = [mockSession];
      (redis.get as jest.Mock).mockResolvedValue(JSON.stringify(cachedSessions));

      const result = await service.validateRefreshToken('user-123', 'refresh-token-123');

      expect(result).toEqual(mockSession);
      expect(redis.get).toHaveBeenCalledWith('user_sessions:user-123');
      expect(sessionRepository.findByRefreshToken).not.toHaveBeenCalled();
    });

    it('should fallback to database when not in cache', async () => {
      (redis.get as jest.Mock).mockResolvedValue(null);
      (sessionRepository.findActiveSessionsByUserId as jest.Mock).mockResolvedValue([]);
      (sessionRepository.findByRefreshToken as jest.Mock).mockResolvedValue(mockSession);
      (redis.setex as jest.Mock).mockResolvedValue('OK');

      const result = await service.validateRefreshToken('user-123', 'refresh-token-123');

      expect(result).toEqual(mockSession);
      expect(sessionRepository.findByRefreshToken).toHaveBeenCalledWith('refresh-token-123');
    });

    it('should return null for expired session from cache', async () => {
      const expiredSession = { ...mockSession, expiresAt: new Date(Date.now() - 1000) };
      const cachedSessions = [expiredSession];
      (redis.get as jest.Mock).mockResolvedValue(JSON.stringify(cachedSessions));

      const result = await service.validateRefreshToken('user-123', 'refresh-token-123');

      expect(result).toBeNull();
    });

    it('should return null for inactive session from cache', async () => {
      const inactiveSession = { ...mockSession, isActive: false };
      const cachedSessions = [inactiveSession];
      (redis.get as jest.Mock).mockResolvedValue(JSON.stringify(cachedSessions));

      const result = await service.validateRefreshToken('user-123', 'refresh-token-123');

      expect(result).toBeNull();
    });

    it('should return null when session not found in database', async () => {
      (redis.get as jest.Mock).mockResolvedValue(null);
      (sessionRepository.findActiveSessionsByUserId as jest.Mock).mockResolvedValue([]);
      (sessionRepository.findByRefreshToken as jest.Mock).mockResolvedValue(null);
      (redis.setex as jest.Mock).mockResolvedValue('OK');

      const result = await service.validateRefreshToken('user-123', 'refresh-token-123');

      expect(result).toBeNull();
    });

    it('should return null for expired session from database', async () => {
      const expiredSession = { ...mockSession, expiresAt: new Date(Date.now() - 1000) };
      (redis.get as jest.Mock).mockResolvedValue(null);
      (sessionRepository.findActiveSessionsByUserId as jest.Mock).mockResolvedValue([]);
      (sessionRepository.findByRefreshToken as jest.Mock).mockResolvedValue(expiredSession);
      (redis.setex as jest.Mock).mockResolvedValue('OK');

      const result = await service.validateRefreshToken('user-123', 'refresh-token-123');

      expect(result).toBeNull();
    });

    it('should return null for inactive session from database', async () => {
      const inactiveSession = { ...mockSession, isActive: false };
      (redis.get as jest.Mock).mockResolvedValue(null);
      (sessionRepository.findActiveSessionsByUserId as jest.Mock).mockResolvedValue([]);
      (sessionRepository.findByRefreshToken as jest.Mock).mockResolvedValue(inactiveSession);
      (redis.setex as jest.Mock).mockResolvedValue('OK');

      const result = await service.validateRefreshToken('user-123', 'refresh-token-123');

      expect(result).toBeNull();
    });
  });

  describe('updateSession', () => {
    it('should update session in database and Redis cache', async () => {
      const existingCachedSession = JSON.stringify(mockSession);
      (redis.get as jest.Mock).mockResolvedValue(existingCachedSession);
      (sessionRepository.update as jest.Mock).mockResolvedValue(mockSession);
      (redis.setex as jest.Mock).mockResolvedValue('OK');

      await service.updateSession('session-123', 'new-refresh-token');

      expect(sessionRepository.update).toHaveBeenCalledWith('session-123', {
        refreshToken: 'new-refresh-token',
        lastUsedAt: expect.any(Date),
      });

      expect(redis.setex).toHaveBeenCalledWith(
        'session:session-123',
        7 * 24 * 60 * 60,
        expect.stringContaining('new-refresh-token')
      );
    });

    it('should update session in database only when not in cache', async () => {
      (redis.get as jest.Mock).mockResolvedValue(null);
      (sessionRepository.update as jest.Mock).mockResolvedValue(mockSession);

      await service.updateSession('session-123', 'new-refresh-token');

      expect(sessionRepository.update).toHaveBeenCalledWith('session-123', {
        refreshToken: 'new-refresh-token',
        lastUsedAt: expect.any(Date),
      });

      expect(redis.setex).not.toHaveBeenCalled();
    });

    it('should handle Redis errors gracefully', async () => {
      (redis.get as jest.Mock).mockRejectedValue(new Error('Redis error'));
      (sessionRepository.update as jest.Mock).mockResolvedValue(mockSession);

      await expect(service.updateSession('session-123', 'new-refresh-token')).resolves.not.toThrow();

      expect(sessionRepository.update).toHaveBeenCalled();
    });
  });

  describe('invalidateSession', () => {
    it('should invalidate specific session when token provided', async () => {
      const sessions = [mockSession];
      (redis.get as jest.Mock).mockResolvedValue(JSON.stringify(sessions));
      (sessionRepository.invalidate as jest.Mock).mockResolvedValue(mockSession);
      (redis.del as jest.Mock).mockResolvedValue(1);
      (redis.setex as jest.Mock).mockResolvedValue('OK');

      await service.invalidateSession('user-123', 'refresh-token-123');

      expect(sessionRepository.invalidate).toHaveBeenCalledWith('session-123');
      expect(redis.del).toHaveBeenCalledWith('session:session-123');
      expect(redis.setex).toHaveBeenCalledWith(
        'blacklist:refresh-token-123',
        7 * 24 * 60 * 60,
        'blacklisted'
      );
    });

    it('should invalidate all user sessions when no token provided', async () => {
      const sessions = [mockSession, { ...mockSession, id: 'session-456' }];
      (redis.get as jest.Mock).mockResolvedValue(JSON.stringify(sessions));
      (sessionRepository.invalidate as jest.Mock).mockResolvedValue(mockSession);
      (redis.del as jest.Mock).mockResolvedValue(1);
      (redis.setex as jest.Mock).mockResolvedValue('OK');

      await service.invalidateSession('user-123');

      expect(sessionRepository.invalidate).toHaveBeenCalledTimes(2);
      expect(redis.del).toHaveBeenCalledTimes(2);
      expect(redis.setex).toHaveBeenCalledTimes(2);
    });

    it('should handle case when session not found', async () => {
      (redis.get as jest.Mock).mockResolvedValue(JSON.stringify([]));

      await expect(service.invalidateSession('user-123', 'non-existent-token')).resolves.not.toThrow();

      expect(sessionRepository.invalidate).not.toHaveBeenCalled();
    });
  });

  describe('invalidateAllUserSessions', () => {
    it('should invalidate all sessions for a user', async () => {
      const sessions = [
        mockSession,
        { ...mockSession, id: 'session-456', refreshToken: 'token-456' },
      ];
      (redis.get as jest.Mock).mockResolvedValue(JSON.stringify(sessions));
      (sessionRepository.invalidate as jest.Mock).mockResolvedValue(mockSession);
      (redis.del as jest.Mock).mockResolvedValue(1);
      (redis.setex as jest.Mock).mockResolvedValue('OK');

      await service.invalidateAllUserSessions('user-123');

      expect(sessionRepository.invalidate).toHaveBeenCalledTimes(2);
      expect(sessionRepository.invalidate).toHaveBeenCalledWith('session-123');
      expect(sessionRepository.invalidate).toHaveBeenCalledWith('session-456');

      expect(redis.del).toHaveBeenCalledTimes(2);
      expect(redis.del).toHaveBeenCalledWith('session:session-123');
      expect(redis.del).toHaveBeenCalledWith('session:session-456');

      expect(redis.setex).toHaveBeenCalledTimes(2);
      expect(redis.setex).toHaveBeenCalledWith(
        'blacklist:refresh-token-123',
        7 * 24 * 60 * 60,
        'blacklisted'
      );
      expect(redis.setex).toHaveBeenCalledWith(
        'blacklist:token-456',
        7 * 24 * 60 * 60,
        'blacklisted'
      );
    });

    it('should handle empty sessions list', async () => {
      (redis.get as jest.Mock).mockResolvedValue(JSON.stringify([]));

      await expect(service.invalidateAllUserSessions('user-123')).resolves.not.toThrow();

      expect(sessionRepository.invalidate).not.toHaveBeenCalled();
      expect(redis.del).not.toHaveBeenCalled();
      expect(redis.setex).not.toHaveBeenCalled();
    });
  });

  describe('isTokenBlacklisted', () => {
    it('should return true for blacklisted token', async () => {
      (redis.get as jest.Mock).mockResolvedValue('blacklisted');

      const result = await service.isTokenBlacklisted('blacklisted-token');

      expect(result).toBe(true);
      expect(redis.get).toHaveBeenCalledWith('blacklist:blacklisted-token');
    });

    it('should return false for non-blacklisted token', async () => {
      (redis.get as jest.Mock).mockResolvedValue(null);

      const result = await service.isTokenBlacklisted('valid-token');

      expect(result).toBe(false);
      expect(redis.get).toHaveBeenCalledWith('blacklist:valid-token');
    });

    it('should handle Redis errors gracefully', async () => {
      (redis.get as jest.Mock).mockRejectedValue(new Error('Redis connection error'));

      await expect(service.isTokenBlacklisted('token')).rejects.toThrow('Redis connection error');
    });
  });

  describe('getActiveSessionsByUserId', () => {
    it('should return sessions from Redis cache when available', async () => {
      const sessions = [mockSession];
      // Simulate how dates are serialized in Redis
      const serializedSessions = sessions.map(s => ({
        ...s,
        expiresAt: s.expiresAt.toISOString(),
        createdAt: s.createdAt.toISOString(),
        lastUsedAt: s.lastUsedAt.toISOString(),
      }));
      (redis.get as jest.Mock).mockResolvedValue(JSON.stringify(serializedSessions));

      const result = await service.getActiveSessionsByUserId('user-123');

      expect(result).toEqual(sessions);
      expect(redis.get).toHaveBeenCalledWith('user_sessions:user-123');
      expect(sessionRepository.findActiveSessionsByUserId).not.toHaveBeenCalled();
    });

    it('should fallback to database and cache result when not in Redis', async () => {
      const sessions = [mockSession];
      (redis.get as jest.Mock).mockResolvedValue(null);
      (sessionRepository.findActiveSessionsByUserId as jest.Mock).mockResolvedValue(sessions);
      (redis.setex as jest.Mock).mockResolvedValue('OK');

      const result = await service.getActiveSessionsByUserId('user-123');

      expect(result).toEqual(sessions);
      expect(sessionRepository.findActiveSessionsByUserId).toHaveBeenCalledWith('user-123');
      expect(redis.setex).toHaveBeenCalledWith(
        'user_sessions:user-123',
        300, // 5 minutes
        JSON.stringify(sessions)
      );
    });

    it('should handle Redis cache errors gracefully', async () => {
      const sessions = [mockSession];
      (redis.get as jest.Mock).mockRejectedValue(new Error('Redis error'));
      (sessionRepository.findActiveSessionsByUserId as jest.Mock).mockResolvedValue(sessions);
      (redis.setex as jest.Mock).mockResolvedValue('OK');

      const result = await service.getActiveSessionsByUserId('user-123');

      expect(result).toEqual(sessions);
      expect(sessionRepository.findActiveSessionsByUserId).toHaveBeenCalled();
    });
  });

  describe('cleanupExpiredSessions', () => {
    it('should cleanup expired sessions from database', async () => {
      (sessionRepository.deleteExpiredSessions as jest.Mock).mockResolvedValue(undefined);

      await service.cleanupExpiredSessions();

      expect(sessionRepository.deleteExpiredSessions).toHaveBeenCalled();
    });

    it('should handle database errors gracefully', async () => {
      (sessionRepository.deleteExpiredSessions as jest.Mock).mockRejectedValue(
        new Error('Database error')
      );

      await expect(service.cleanupExpiredSessions()).rejects.toThrow('Database error');
    });
  });

  describe('addTokenToBlacklist', () => {
    it('should add token to blacklist with correct expiration', async () => {
      (redis.setex as jest.Mock).mockResolvedValue('OK');

      await service['addTokenToBlacklist']('token-to-blacklist');

      expect(redis.setex).toHaveBeenCalledWith(
        'blacklist:token-to-blacklist',
        7 * 24 * 60 * 60, // 7 days
        'blacklisted'
      );
    });

    it('should handle Redis errors when blacklisting', async () => {
      (redis.setex as jest.Mock).mockRejectedValue(new Error('Redis error'));

      await expect(service['addTokenToBlacklist']('token')).rejects.toThrow('Redis error');
    });
  });

  describe('error handling and edge cases', () => {
    it('should handle malformed JSON in Redis cache', async () => {
      (redis.get as jest.Mock).mockResolvedValue('invalid-json');
      (sessionRepository.findActiveSessionsByUserId as jest.Mock).mockResolvedValue([mockSession]);
      (redis.setex as jest.Mock).mockResolvedValue('OK');

      const result = await service.getActiveSessionsByUserId('user-123');

      expect(result).toEqual([mockSession]);
      expect(sessionRepository.findActiveSessionsByUserId).toHaveBeenCalled();
    });

    it('should handle concurrent session operations', async () => {
      const sessions = [mockSession];
      (redis.get as jest.Mock).mockResolvedValue(JSON.stringify(sessions));
      (sessionRepository.invalidate as jest.Mock).mockResolvedValue(mockSession);
      (redis.del as jest.Mock).mockResolvedValue(1);
      (redis.setex as jest.Mock).mockResolvedValue('OK');

      // Simulate concurrent invalidation calls
      const promises = [
        service.invalidateSession('user-123', 'refresh-token-123'),
        service.invalidateSession('user-123', 'refresh-token-123'),
      ];

      await Promise.all(promises);

      // Should handle gracefully without errors
      expect(sessionRepository.invalidate).toHaveBeenCalled();
    });

    it('should handle session creation with future expiration date', async () => {
      const futureDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
      const sessionWithFutureExpiry = { ...mockSession, expiresAt: futureDate };
      (sessionRepository.create as jest.Mock).mockResolvedValue(sessionWithFutureExpiry);
      (redis.setex as jest.Mock).mockResolvedValue('OK');

      const result = await service.createSession('user-123', 'refresh-token-123');

      expect(result.expiresAt).toEqual(expect.any(Date));
      expect(sessionRepository.create).toHaveBeenCalled();
    });
  });

  describe('integration scenarios', () => {
    it('should handle complete session lifecycle', async () => {
      // Create session
      (sessionRepository.create as jest.Mock).mockResolvedValue(mockSession);
      (redis.setex as jest.Mock).mockResolvedValue('OK');

      const session = await service.createSession('user-123', 'refresh-token-123');

      // Validate session - simulate Redis cache with serialized dates
      const serializedSession = {
        ...session,
        expiresAt: session.expiresAt.toISOString(),
        createdAt: session.createdAt.toISOString(),
        lastUsedAt: session.lastUsedAt.toISOString(),
      };
      (redis.get as jest.Mock).mockResolvedValue(JSON.stringify([serializedSession]));

      const validatedSession = await service.validateRefreshToken('user-123', 'refresh-token-123');

      // Update session
      (sessionRepository.update as jest.Mock).mockResolvedValue(session);

      await service.updateSession('session-123', 'new-refresh-token');

      // Invalidate session - need to mock the session lookup first
      const sessionWithNewToken = { ...session, refreshToken: 'new-refresh-token' };
      const serializedSessionWithNewToken = {
        ...sessionWithNewToken,
        expiresAt: sessionWithNewToken.expiresAt.toISOString(),
        createdAt: sessionWithNewToken.createdAt.toISOString(),
        lastUsedAt: sessionWithNewToken.lastUsedAt.toISOString(),
      };
      (redis.get as jest.Mock).mockResolvedValue(JSON.stringify([serializedSessionWithNewToken]));
      (sessionRepository.invalidate as jest.Mock).mockResolvedValue(session);
      (redis.del as jest.Mock).mockResolvedValue(1);

      await service.invalidateSession('user-123', 'new-refresh-token');

      expect(session).toBeDefined();
      expect(validatedSession).toEqual(session);
      expect(sessionRepository.create).toHaveBeenCalled();
      expect(sessionRepository.update).toHaveBeenCalled();
      expect(sessionRepository.invalidate).toHaveBeenCalled();
    });

    it('should handle Redis unavailability gracefully', async () => {
      // Simulate Redis being completely unavailable
      (redis.setex as jest.Mock).mockRejectedValue(new Error('Redis unavailable'));
      (redis.get as jest.Mock).mockRejectedValue(new Error('Redis unavailable'));
      (redis.del as jest.Mock).mockRejectedValue(new Error('Redis unavailable'));

      (sessionRepository.create as jest.Mock).mockResolvedValue(mockSession);
      (sessionRepository.findByRefreshToken as jest.Mock).mockResolvedValue(mockSession);
      (sessionRepository.findActiveSessionsByUserId as jest.Mock).mockResolvedValue([mockSession]);

      // Should still work with database fallback
      const session = await service.createSession('user-123', 'refresh-token-123');
      const validatedSession = await service.validateRefreshToken('user-123', 'refresh-token-123');
      const activeSessions = await service.getActiveSessionsByUserId('user-123');

      expect(session).toEqual(mockSession);
      expect(validatedSession).toEqual(mockSession);
      expect(activeSessions).toEqual([mockSession]);
    });
  });
});