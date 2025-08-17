import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException, NotFoundException, BadRequestException, HttpException, HttpStatus } from '@nestjs/common';
import { ApiKeyService } from '../api-key.service';
import { ApiKeyRepository } from '../../../repositories/api-key.repository';
import { RateLimitService } from '../rate-limit.service';
import { AuditService } from '../audit.service';
import { CreateApiKeyDto, UpdateApiKeyDto } from '../../dto';
import { UserType, Plan } from '@prisma/client';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';

describe('ApiKeyService', () => {
  let service: ApiKeyService;
  let apiKeyRepository: jest.Mocked<ApiKeyRepository>;
  let rateLimitService: jest.Mocked<RateLimitService>;
  let auditService: jest.Mocked<AuditService>;

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
    userType: UserType.INDIVIDUAL,
    plan: Plan.FREE,
  };

  const mockApiKey = {
    id: 'key-123',
    userId: 'user-123',
    name: 'Test API Key',
    keyHash: 'hashed-key',
    keyPrefix: 'rk_abc12',
    permissions: ['read:resources'],
    rateLimit: 1000,
    isActive: true,
    lastUsedAt: null,
    expiresAt: null,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    user: mockUser,
  };

  const mockCreateDto: CreateApiKeyDto = {
    name: 'Test API Key',
    permissions: ['read:resources'],
    rateLimit: 1000,
  };

  beforeEach(async () => {
    const mockApiKeyRepository = {
      isNameUniqueForUser: jest.fn(),
      create: jest.fn(),
      findByPrefix: jest.fn(),
      updateLastUsed: jest.fn(),
      findByUserId: jest.fn(),
      findByIdAndUserId: jest.fn(),
      deactivate: jest.fn(),
      update: jest.fn(),
      reactivate: jest.fn(),
      getExpiredKeys: jest.fn(),
      bulkDeactivate: jest.fn(),
      getKeysExpiringSoon: jest.fn(),
    };

    const mockRateLimitService = {
      checkApiKeyLimit: jest.fn(),
    };

    const mockAuditService = {
      logApiKeyCreation: jest.fn(),
      logApiKeyUsage: jest.fn(),
      logApiKeyRevocation: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApiKeyService,
        {
          provide: ApiKeyRepository,
          useValue: mockApiKeyRepository,
        },
        {
          provide: RateLimitService,
          useValue: mockRateLimitService,
        },
        {
          provide: AuditService,
          useValue: mockAuditService,
        },
      ],
    }).compile();

    service = module.get<ApiKeyService>(ApiKeyService);
    apiKeyRepository = module.get(ApiKeyRepository);
    rateLimitService = module.get(RateLimitService);
    auditService = module.get(AuditService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createApiKey', () => {
    beforeEach(() => {
      jest.spyOn(crypto, 'randomBytes').mockImplementation(() => Buffer.from('random-bytes-for-key'));
      jest.spyOn(bcrypt, 'hash').mockResolvedValue('hashed-key' as never);
    });

    it('should create API key successfully', async () => {
      // Arrange
      apiKeyRepository.isNameUniqueForUser.mockResolvedValue(true);
      apiKeyRepository.create.mockResolvedValue(mockApiKey);
      auditService.logApiKeyCreation.mockResolvedValue(undefined);

      // Act
      const result = await service.createApiKey('user-123', mockCreateDto);

      // Assert
      expect(apiKeyRepository.isNameUniqueForUser).toHaveBeenCalledWith('user-123', mockCreateDto.name);
      expect(crypto.randomBytes).toHaveBeenCalledWith(32);
      expect(bcrypt.hash).toHaveBeenCalledWith('rk_72616e646f6d2d62797465732d666f722d6b6579', 12);
      expect(apiKeyRepository.create).toHaveBeenCalledWith({
        userId: 'user-123',
        name: mockCreateDto.name,
        keyHash: 'hashed-key',
        keyPrefix: 'rk_72616',
        permissions: mockCreateDto.permissions,
        rateLimit: mockCreateDto.rateLimit,
        expiresAt: undefined,
      });
      expect(auditService.logApiKeyCreation).toHaveBeenCalledWith('user-123', mockApiKey.id);
      expect(result).toEqual({
        id: mockApiKey.id,
        name: mockApiKey.name,
        keyPrefix: 'rk_72616', // This should match the generated prefix
        keyValue: 'rk_72616e646f6d2d62797465732d666f722d6b6579',
        permissions: mockApiKey.permissions,
        rateLimit: mockApiKey.rateLimit,
        isActive: mockApiKey.isActive,
        lastUsedAt: mockApiKey.lastUsedAt,
        expiresAt: mockApiKey.expiresAt,
        createdAt: mockApiKey.createdAt,
      });
    });

    it('should throw BadRequestException if name is not unique', async () => {
      // Arrange
      apiKeyRepository.isNameUniqueForUser.mockResolvedValue(false);

      // Act & Assert
      await expect(service.createApiKey('user-123', mockCreateDto)).rejects.toThrow(BadRequestException);
      expect(apiKeyRepository.create).not.toHaveBeenCalled();
    });

    it('should handle expiration date correctly', async () => {
      // Arrange
      const futureDate = new Date(Date.now() + 86400000); // 1 day from now
      const createDtoWithExpiry = {
        ...mockCreateDto,
        expiresAt: futureDate.toISOString(),
      };
      apiKeyRepository.isNameUniqueForUser.mockResolvedValue(true);
      apiKeyRepository.create.mockResolvedValue(mockApiKey);
      auditService.logApiKeyCreation.mockResolvedValue(undefined);

      // Act
      await service.createApiKey('user-123', createDtoWithExpiry);

      // Assert
      expect(apiKeyRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          expiresAt: futureDate,
        })
      );
    });

    it('should throw BadRequestException if expiration date is in the past', async () => {
      // Arrange
      const pastDate = new Date(Date.now() - 86400000); // 1 day ago
      const createDtoWithPastExpiry = {
        ...mockCreateDto,
        expiresAt: pastDate.toISOString(),
      };
      apiKeyRepository.isNameUniqueForUser.mockResolvedValue(true);

      // Act & Assert
      await expect(service.createApiKey('user-123', createDtoWithPastExpiry)).rejects.toThrow(BadRequestException);
      expect(apiKeyRepository.create).not.toHaveBeenCalled();
    });

    it('should use default values when optional fields are not provided', async () => {
      // Arrange
      const minimalDto = { name: 'Minimal Key' };
      apiKeyRepository.isNameUniqueForUser.mockResolvedValue(true);
      apiKeyRepository.create.mockResolvedValue(mockApiKey);
      auditService.logApiKeyCreation.mockResolvedValue(undefined);

      // Act
      await service.createApiKey('user-123', minimalDto);

      // Assert
      expect(apiKeyRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          permissions: [],
          rateLimit: 1000,
        })
      );
    });
  });

  describe('validateApiKey', () => {
    const validKeyValue = 'rk_abc123def456ghi789';

    beforeEach(() => {
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);
    });

    it('should validate API key successfully', async () => {
      // Arrange
      apiKeyRepository.findByPrefix.mockResolvedValue(mockApiKey);
      rateLimitService.checkApiKeyLimit.mockResolvedValue({
        allowed: true,
        remaining: 950,
        resetTime: new Date(),
        current: 50,
      });
      apiKeyRepository.updateLastUsed.mockResolvedValue(undefined);
      auditService.logApiKeyUsage.mockResolvedValue(undefined);

      // Act
      const result = await service.validateApiKey(validKeyValue);

      // Assert
      expect(apiKeyRepository.findByPrefix).toHaveBeenCalledWith('rk_abc12', {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            userType: true,
            plan: true,
          },
        },
      });
      expect(bcrypt.compare).toHaveBeenCalledWith(validKeyValue, mockApiKey.keyHash);
      expect(rateLimitService.checkApiKeyLimit).toHaveBeenCalledWith(mockApiKey.id, mockApiKey.rateLimit);
      expect(result).toEqual({
        apiKey: {
          id: mockApiKey.id,
          name: mockApiKey.name,
          permissions: mockApiKey.permissions,
          rateLimit: mockApiKey.rateLimit,
          userId: mockApiKey.userId,
        },
        user: {
          id: mockUser.id,
          email: mockUser.email,
          name: mockUser.name,
          userType: mockUser.userType,
          plan: mockUser.plan,
        },
        rateLimitRemaining: 950,
        rateLimitReset: expect.any(Date),
      });
    });

    it('should throw UnauthorizedException for invalid key format', async () => {
      // Act & Assert
      await expect(service.validateApiKey('invalid-key')).rejects.toThrow(UnauthorizedException);
      await expect(service.validateApiKey('')).rejects.toThrow(UnauthorizedException);
      await expect(service.validateApiKey('sk_wrongprefix')).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if API key not found', async () => {
      // Arrange
      apiKeyRepository.findByPrefix.mockResolvedValue(null);

      // Act & Assert
      await expect(service.validateApiKey(validKeyValue)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if API key is inactive', async () => {
      // Arrange
      const inactiveApiKey = { ...mockApiKey, isActive: false };
      apiKeyRepository.findByPrefix.mockResolvedValue(inactiveApiKey);

      // Act & Assert
      await expect(service.validateApiKey(validKeyValue)).rejects.toThrow(UnauthorizedException);
    });

    it('should deactivate and throw UnauthorizedException if API key is expired', async () => {
      // Arrange
      const expiredApiKey = {
        ...mockApiKey,
        expiresAt: new Date(Date.now() - 86400000), // 1 day ago
      };
      apiKeyRepository.findByPrefix.mockResolvedValue(expiredApiKey);
      apiKeyRepository.deactivate.mockResolvedValue(undefined);

      // Act & Assert
      await expect(service.validateApiKey(validKeyValue)).rejects.toThrow(UnauthorizedException);
      expect(apiKeyRepository.deactivate).toHaveBeenCalledWith(mockApiKey.id);
    });

    it('should throw UnauthorizedException if key hash validation fails', async () => {
      // Arrange
      apiKeyRepository.findByPrefix.mockResolvedValue(mockApiKey);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false as never);

      // Act & Assert
      await expect(service.validateApiKey(validKeyValue)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw HttpException if rate limit exceeded', async () => {
      // Arrange
      apiKeyRepository.findByPrefix.mockResolvedValue(mockApiKey);
      rateLimitService.checkApiKeyLimit.mockResolvedValue({
        allowed: false,
        remaining: 0,
        resetTime: new Date(),
        current: 1000,
      });

      // Act & Assert
      await expect(service.validateApiKey(validKeyValue)).rejects.toThrow(HttpException);
      await expect(service.validateApiKey(validKeyValue)).rejects.toThrow(
        expect.objectContaining({ status: HttpStatus.TOO_MANY_REQUESTS })
      );
    });

    it('should handle updateLastUsed failure gracefully', async () => {
      // Arrange
      apiKeyRepository.findByPrefix.mockResolvedValue(mockApiKey);
      rateLimitService.checkApiKeyLimit.mockResolvedValue({
        allowed: true,
        remaining: 950,
        resetTime: new Date(),
        current: 50,
      });
      apiKeyRepository.updateLastUsed.mockReturnValue(Promise.reject(new Error('Database error')));
      auditService.logApiKeyUsage.mockResolvedValue(undefined);
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      // Act
      const result = await service.validateApiKey(validKeyValue);

      // Assert
      expect(result).toBeDefined();
      expect(consoleSpy).toHaveBeenCalledWith('Failed to update API key last used timestamp:', expect.any(Error));
      consoleSpy.mockRestore();
    });

    it('should handle audit logging failure gracefully', async () => {
      // Arrange
      apiKeyRepository.findByPrefix.mockResolvedValue(mockApiKey);
      rateLimitService.checkApiKeyLimit.mockResolvedValue({
        allowed: true,
        remaining: 950,
        resetTime: new Date(),
        current: 50,
      });
      apiKeyRepository.updateLastUsed.mockResolvedValue(undefined);
      auditService.logApiKeyUsage.mockReturnValue(Promise.reject(new Error('Audit error')));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      // Act
      const result = await service.validateApiKey(validKeyValue);

      // Assert
      expect(result).toBeDefined();
      expect(consoleSpy).toHaveBeenCalledWith('Failed to log API key usage:', expect.any(Error));
      consoleSpy.mockRestore();
    });
  });

  describe('listUserApiKeys', () => {
    it('should list user API keys successfully', async () => {
      // Arrange
      const apiKeys = [mockApiKey, { ...mockApiKey, id: 'key-456', name: 'Another Key' }];
      apiKeyRepository.findByUserId.mockResolvedValue({ apiKeys, total: 2 });

      // Act
      const result = await service.listUserApiKeys('user-123');

      // Assert
      expect(apiKeyRepository.findByUserId).toHaveBeenCalledWith('user-123', { limit: 100 });
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: mockApiKey.id,
        name: mockApiKey.name,
        keyPrefix: mockApiKey.keyPrefix,
        permissions: mockApiKey.permissions,
        rateLimit: mockApiKey.rateLimit,
        isActive: mockApiKey.isActive,
        lastUsedAt: mockApiKey.lastUsedAt,
        expiresAt: mockApiKey.expiresAt,
        createdAt: mockApiKey.createdAt,
      });
    });

    it('should return empty array if user has no API keys', async () => {
      // Arrange
      apiKeyRepository.findByUserId.mockResolvedValue({ apiKeys: [], total: 0 });

      // Act
      const result = await service.listUserApiKeys('user-123');

      // Assert
      expect(result).toEqual([]);
    });
  });

  describe('revokeApiKey', () => {
    it('should revoke API key successfully', async () => {
      // Arrange
      apiKeyRepository.findByIdAndUserId.mockResolvedValue(mockApiKey);
      apiKeyRepository.deactivate.mockResolvedValue(undefined);
      auditService.logApiKeyRevocation.mockResolvedValue(undefined);

      // Act
      await service.revokeApiKey('user-123', 'key-123');

      // Assert
      expect(apiKeyRepository.findByIdAndUserId).toHaveBeenCalledWith('key-123', 'user-123');
      expect(apiKeyRepository.deactivate).toHaveBeenCalledWith('key-123');
      expect(auditService.logApiKeyRevocation).toHaveBeenCalledWith('user-123', 'key-123');
    });

    it('should throw NotFoundException if API key not found', async () => {
      // Arrange
      apiKeyRepository.findByIdAndUserId.mockResolvedValue(null);

      // Act & Assert
      await expect(service.revokeApiKey('user-123', 'key-123')).rejects.toThrow(NotFoundException);
      expect(apiKeyRepository.deactivate).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if API key is already inactive', async () => {
      // Arrange
      const inactiveApiKey = { ...mockApiKey, isActive: false };
      apiKeyRepository.findByIdAndUserId.mockResolvedValue(inactiveApiKey);

      // Act & Assert
      await expect(service.revokeApiKey('user-123', 'key-123')).rejects.toThrow(BadRequestException);
      expect(apiKeyRepository.deactivate).not.toHaveBeenCalled();
    });
  });

  describe('updateApiKey', () => {
    const updateDto: UpdateApiKeyDto = {
      name: 'Updated API Key',
      permissions: ['read:resources', 'write:resources'],
      rateLimit: 2000,
    };

    it('should update API key successfully', async () => {
      // Arrange
      apiKeyRepository.findByIdAndUserId.mockResolvedValue(mockApiKey);
      apiKeyRepository.isNameUniqueForUser.mockResolvedValue(true);
      const updatedApiKey = { ...mockApiKey, ...updateDto };
      apiKeyRepository.update.mockResolvedValue(updatedApiKey);

      // Act
      const result = await service.updateApiKey('user-123', 'key-123', updateDto);

      // Assert
      expect(apiKeyRepository.findByIdAndUserId).toHaveBeenCalledWith('key-123', 'user-123');
      expect(apiKeyRepository.isNameUniqueForUser).toHaveBeenCalledWith('user-123', updateDto.name, 'key-123');
      expect(apiKeyRepository.update).toHaveBeenCalledWith('key-123', {
        name: updateDto.name,
        permissions: updateDto.permissions,
        rateLimit: updateDto.rateLimit,
      });
      expect(result).toEqual({
        id: updatedApiKey.id,
        name: updatedApiKey.name,
        keyPrefix: updatedApiKey.keyPrefix,
        permissions: updatedApiKey.permissions,
        rateLimit: updatedApiKey.rateLimit,
        isActive: updatedApiKey.isActive,
        lastUsedAt: updatedApiKey.lastUsedAt,
        expiresAt: updatedApiKey.expiresAt,
        createdAt: updatedApiKey.createdAt,
      });
    });

    it('should throw NotFoundException if API key not found', async () => {
      // Arrange
      apiKeyRepository.findByIdAndUserId.mockResolvedValue(null);

      // Act & Assert
      await expect(service.updateApiKey('user-123', 'key-123', updateDto)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if name is not unique', async () => {
      // Arrange
      apiKeyRepository.findByIdAndUserId.mockResolvedValue(mockApiKey);
      apiKeyRepository.isNameUniqueForUser.mockResolvedValue(false);

      // Act & Assert
      await expect(service.updateApiKey('user-123', 'key-123', updateDto)).rejects.toThrow(BadRequestException);
    });

    it('should handle expiration date updates correctly', async () => {
      // Arrange
      const futureDate = new Date(Date.now() + 86400000);
      const updateDtoWithExpiry = { ...updateDto, expiresAt: futureDate.toISOString() };
      apiKeyRepository.findByIdAndUserId.mockResolvedValue(mockApiKey);
      apiKeyRepository.isNameUniqueForUser.mockResolvedValue(true);
      apiKeyRepository.update.mockResolvedValue({ ...mockApiKey, expiresAt: futureDate });

      // Act
      await service.updateApiKey('user-123', 'key-123', updateDtoWithExpiry);

      // Assert
      expect(apiKeyRepository.update).toHaveBeenCalledWith('key-123', 
        expect.objectContaining({
          expiresAt: futureDate,
        })
      );
    });

    it('should throw BadRequestException if expiration date is in the past', async () => {
      // Arrange
      const pastDate = new Date(Date.now() - 86400000);
      const updateDtoWithPastExpiry = { ...updateDto, expiresAt: pastDate.toISOString() };
      apiKeyRepository.findByIdAndUserId.mockResolvedValue(mockApiKey);

      // Act & Assert
      await expect(service.updateApiKey('user-123', 'key-123', updateDtoWithPastExpiry)).rejects.toThrow(BadRequestException);
    });
  });

  describe('hasPermission', () => {
    it('should return true for wildcard permissions', () => {
      // Arrange
      const apiKeyWithWildcard = { permissions: ['*'] };

      // Act & Assert
      expect(service.hasPermission(apiKeyWithWildcard, 'any:permission')).toBe(true);
    });

    it('should return true for admin wildcard permissions', () => {
      // Arrange
      const apiKeyWithAdminWildcard = { permissions: ['admin:*'] };

      // Act & Assert
      expect(service.hasPermission(apiKeyWithAdminWildcard, 'any:permission')).toBe(true);
    });

    it('should return true for exact permission match', () => {
      // Arrange
      const apiKey = { permissions: ['read:resources', 'write:resources'] };

      // Act & Assert
      expect(service.hasPermission(apiKey, 'read:resources')).toBe(true);
      expect(service.hasPermission(apiKey, 'write:resources')).toBe(true);
    });

    it('should return true for wildcard pattern matches', () => {
      // Arrange
      const apiKey = { permissions: ['read:*', 'write:users'] };

      // Act & Assert
      expect(service.hasPermission(apiKey, 'read:resources')).toBe(true);
      expect(service.hasPermission(apiKey, 'read:anything')).toBe(true);
      expect(service.hasPermission(apiKey, 'write:users')).toBe(true);
    });

    it('should return false for non-matching permissions', () => {
      // Arrange
      const apiKey = { permissions: ['read:resources'] };

      // Act & Assert
      expect(service.hasPermission(apiKey, 'write:resources')).toBe(false);
      expect(service.hasPermission(apiKey, 'delete:resources')).toBe(false);
    });
  });

  describe('getUserApiKeyStats', () => {
    it('should return correct statistics', async () => {
      // Arrange
      const now = new Date();
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const apiKeys = [
        { ...mockApiKey, isActive: true, lastUsedAt: new Date() },
        { ...mockApiKey, id: 'key-2', isActive: false, lastUsedAt: null },
        { ...mockApiKey, id: 'key-3', isActive: true, expiresAt: new Date(Date.now() - 1000), lastUsedAt: weekAgo },
        { ...mockApiKey, id: 'key-4', isActive: true, lastUsedAt: new Date() },
      ];
      apiKeyRepository.findByUserId.mockResolvedValue({ apiKeys, total: 4 });

      // Act
      const result = await service.getUserApiKeyStats('user-123');

      // Assert
      expect(result).toEqual({
        total: 4,
        active: 2, // key-1 and key-4 (key-3 is expired)
        inactive: 1, // key-2
        expired: 1, // key-3
        recentlyUsed: 2, // key-1 and key-4
      });
    });
  });

  describe('cleanupExpiredKeys', () => {
    it('should cleanup expired keys successfully', async () => {
      // Arrange
      const expiredKeys = [
        { 
          id: 'key-1', 
          name: 'Expired Key 1',
          userId: 'user-123',
          keyHash: 'hash1',
          keyPrefix: 'rk_exp1',
          permissions: [],
          rateLimit: 1000,
          isActive: true,
          lastUsedAt: new Date(),
          expiresAt: new Date(),
          createdAt: new Date(),
        },
        { 
          id: 'key-2', 
          name: 'Expired Key 2',
          userId: 'user-123',
          keyHash: 'hash2',
          keyPrefix: 'rk_exp2',
          permissions: [],
          rateLimit: 1000,
          isActive: true,
          lastUsedAt: new Date(),
          expiresAt: new Date(),
          createdAt: new Date(),
        },
      ];
      apiKeyRepository.getExpiredKeys.mockResolvedValue(expiredKeys);
      apiKeyRepository.bulkDeactivate.mockResolvedValue(undefined);

      // Act
      const result = await service.cleanupExpiredKeys();

      // Assert
      expect(apiKeyRepository.getExpiredKeys).toHaveBeenCalled();
      expect(apiKeyRepository.bulkDeactivate).toHaveBeenCalledWith(['key-1', 'key-2']);
      expect(result).toEqual({ deactivated: 2 });
    });

    it('should handle no expired keys', async () => {
      // Arrange
      apiKeyRepository.getExpiredKeys.mockResolvedValue([]);

      // Act
      const result = await service.cleanupExpiredKeys();

      // Assert
      expect(apiKeyRepository.bulkDeactivate).not.toHaveBeenCalled();
      expect(result).toEqual({ deactivated: 0 });
    });
  });

  describe('getKeysExpiringSoon', () => {
    it('should return keys expiring soon', async () => {
      // Arrange
      const expiringKeys = [
        {
          id: 'key-1',
          name: 'Expiring Key',
          userId: 'user-123',
          keyHash: 'hash',
          keyPrefix: 'rk_exp',
          permissions: [],
          rateLimit: 1000,
          isActive: true,
          lastUsedAt: new Date(),
          expiresAt: new Date(Date.now() + 86400000),
          createdAt: new Date(),
          user: mockUser,
        },
      ];
      apiKeyRepository.getKeysExpiringSoon.mockResolvedValue(expiringKeys);

      // Act
      const result = await service.getKeysExpiringSoon(7);

      // Assert
      expect(apiKeyRepository.getKeysExpiringSoon).toHaveBeenCalledWith(7);
      expect(result).toEqual([
        {
          id: 'key-1',
          name: 'Expiring Key',
          expiresAt: expect.any(Date),
          user: {
            id: mockUser.id,
            email: mockUser.email,
            name: mockUser.name,
          },
        },
      ]);
    });
  });

  describe('reactivateApiKey', () => {
    it('should reactivate API key successfully', async () => {
      // Arrange
      const inactiveApiKey = { ...mockApiKey, isActive: false };
      apiKeyRepository.findByIdAndUserId.mockResolvedValue(inactiveApiKey);
      apiKeyRepository.reactivate.mockResolvedValue(undefined);

      // Act
      await service.reactivateApiKey('user-123', 'key-123');

      // Assert
      expect(apiKeyRepository.findByIdAndUserId).toHaveBeenCalledWith('key-123', 'user-123');
      expect(apiKeyRepository.reactivate).toHaveBeenCalledWith('key-123');
    });

    it('should throw NotFoundException if API key not found', async () => {
      // Arrange
      apiKeyRepository.findByIdAndUserId.mockResolvedValue(null);

      // Act & Assert
      await expect(service.reactivateApiKey('user-123', 'key-123')).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if API key is already active', async () => {
      // Arrange
      apiKeyRepository.findByIdAndUserId.mockResolvedValue(mockApiKey);

      // Act & Assert
      await expect(service.reactivateApiKey('user-123', 'key-123')).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if API key is expired', async () => {
      // Arrange
      const expiredInactiveApiKey = {
        ...mockApiKey,
        isActive: false,
        expiresAt: new Date(Date.now() - 86400000),
      };
      apiKeyRepository.findByIdAndUserId.mockResolvedValue(expiredInactiveApiKey);

      // Act & Assert
      await expect(service.reactivateApiKey('user-123', 'key-123')).rejects.toThrow(BadRequestException);
    });
  });
});