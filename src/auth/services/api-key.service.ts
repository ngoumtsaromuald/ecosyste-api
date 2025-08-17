import { Injectable, UnauthorizedException, NotFoundException, BadRequestException, HttpException, HttpStatus } from '@nestjs/common';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';
import { ApiKeyRepository } from '../../repositories/api-key.repository';
import { RateLimitService } from './rate-limit.service';
import { AuditService } from './audit.service';
import { CreateApiKeyDto, UpdateApiKeyDto, ApiKeyResponseDto, ApiKeyListResponseDto, ApiKeyValidationResult } from '../dto';

@Injectable()
export class ApiKeyService {
  constructor(
    private readonly apiKeyRepository: ApiKeyRepository,
    private readonly rateLimitService: RateLimitService,
    private readonly auditService: AuditService,
  ) {}

  /**
   * Create a new API key for a user
   */
  async createApiKey(userId: string, createDto: CreateApiKeyDto): Promise<ApiKeyResponseDto> {
    // Check if name is unique for this user
    const isNameUnique = await this.apiKeyRepository.isNameUniqueForUser(userId, createDto.name);
    if (!isNameUnique) {
      throw new BadRequestException('API key name must be unique for your account');
    }

    // Generate secure API key
    const keyValue = this.generateSecureKey();
    const keyPrefix = keyValue.substring(0, 8);
    const keyHash = await bcrypt.hash(keyValue, 12);

    // Parse expiration date if provided
    let expiresAt: Date | undefined;
    if (createDto.expiresAt) {
      expiresAt = new Date(createDto.expiresAt);
      if (expiresAt <= new Date()) {
        throw new BadRequestException('Expiration date must be in the future');
      }
    }

    // Create the API key
    const apiKey = await this.apiKeyRepository.create({
      userId,
      name: createDto.name,
      keyHash,
      keyPrefix,
      permissions: createDto.permissions || [],
      rateLimit: createDto.rateLimit || 1000,
      expiresAt,
    });

    // Log audit event
    await this.auditService.logApiKeyCreation(userId, apiKey.id);

    return {
      id: apiKey.id,
      name: apiKey.name,
      keyPrefix,
      keyValue, // Only returned once during creation
      permissions: apiKey.permissions as string[],
      rateLimit: apiKey.rateLimit,
      isActive: apiKey.isActive,
      lastUsedAt: apiKey.lastUsedAt,
      expiresAt: apiKey.expiresAt,
      createdAt: apiKey.createdAt,
    };
  }

  /**
   * Validate an API key and return validation result
   */
  async validateApiKey(keyValue: string): Promise<ApiKeyValidationResult> {
    if (!keyValue || !keyValue.startsWith('rk_')) {
      throw new UnauthorizedException('Invalid API key format');
    }

    const keyPrefix = keyValue.substring(0, 8);
    const apiKey = await this.apiKeyRepository.findByPrefix(keyPrefix, {
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

    if (!apiKey || !apiKey.isActive) {
      throw new UnauthorizedException('Invalid or inactive API key');
    }

    // Check if expired
    if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
      await this.apiKeyRepository.deactivate(apiKey.id);
      throw new UnauthorizedException('API key has expired');
    }

    // Validate the key hash
    const isValid = await bcrypt.compare(keyValue, apiKey.keyHash);
    if (!isValid) {
      throw new UnauthorizedException('Invalid API key');
    }

    // Check rate limit
    const rateLimitResult = await this.rateLimitService.checkApiKeyLimit(
      apiKey.id,
      apiKey.rateLimit
    );

    if (!rateLimitResult.allowed) {
      throw new HttpException('API key rate limit exceeded', HttpStatus.TOO_MANY_REQUESTS);
    }

    // Update last used timestamp (fire and forget)
    this.apiKeyRepository.updateLastUsed(apiKey.id).catch(error => {
      console.error('Failed to update API key last used timestamp:', error);
    });

    // Log usage (fire and forget)
    this.auditService.logApiKeyUsage(apiKey.userId, apiKey.id, 'api_validation').catch(error => {
      console.error('Failed to log API key usage:', error);
    });

    return {
      apiKey: {
        id: apiKey.id,
        name: apiKey.name,
        permissions: apiKey.permissions as string[],
        rateLimit: apiKey.rateLimit,
        userId: apiKey.userId,
      },
      user: {
        id: apiKey.user!.id,
        email: apiKey.user!.email,
        name: apiKey.user!.name,
        userType: apiKey.user!.userType,
        plan: apiKey.user!.plan,
      },
      rateLimitRemaining: rateLimitResult.remaining,
      rateLimitReset: rateLimitResult.resetTime,
    };
  }

  /**
   * List all API keys for a user
   */
  async listUserApiKeys(userId: string): Promise<ApiKeyListResponseDto[]> {
    const { apiKeys } = await this.apiKeyRepository.findByUserId(userId, { limit: 100 });
    
    return apiKeys.map(key => ({
      id: key.id,
      name: key.name,
      keyPrefix: key.keyPrefix,
      permissions: key.permissions as string[],
      rateLimit: key.rateLimit,
      isActive: key.isActive,
      lastUsedAt: key.lastUsedAt,
      expiresAt: key.expiresAt,
      createdAt: key.createdAt,
    }));
  }

  /**
   * Revoke (deactivate) an API key
   */
  async revokeApiKey(userId: string, keyId: string): Promise<void> {
    const apiKey = await this.apiKeyRepository.findByIdAndUserId(keyId, userId);
    if (!apiKey) {
      throw new NotFoundException('API key not found');
    }

    if (!apiKey.isActive) {
      throw new BadRequestException('API key is already inactive');
    }

    await this.apiKeyRepository.deactivate(keyId);
    await this.auditService.logApiKeyRevocation(userId, keyId);
  }

  /**
   * Update an API key's properties
   */
  async updateApiKey(userId: string, keyId: string, updateDto: UpdateApiKeyDto): Promise<ApiKeyListResponseDto> {
    const apiKey = await this.apiKeyRepository.findByIdAndUserId(keyId, userId);
    if (!apiKey) {
      throw new NotFoundException('API key not found');
    }

    // Check name uniqueness if name is being updated
    if (updateDto.name && updateDto.name !== apiKey.name) {
      const isNameUnique = await this.apiKeyRepository.isNameUniqueForUser(userId, updateDto.name, keyId);
      if (!isNameUnique) {
        throw new BadRequestException('API key name must be unique for your account');
      }
    }

    // Parse expiration date if provided
    let expiresAt: Date | undefined;
    if (updateDto.expiresAt !== undefined) {
      if (updateDto.expiresAt) {
        expiresAt = new Date(updateDto.expiresAt);
        if (expiresAt <= new Date()) {
          throw new BadRequestException('Expiration date must be in the future');
        }
      } else {
        expiresAt = undefined; // Remove expiration
      }
    }

    const updateData: any = {};
    if (updateDto.name !== undefined) updateData.name = updateDto.name;
    if (updateDto.permissions !== undefined) updateData.permissions = updateDto.permissions;
    if (updateDto.rateLimit !== undefined) updateData.rateLimit = updateDto.rateLimit;
    if (updateDto.expiresAt !== undefined) updateData.expiresAt = expiresAt;

    const updatedApiKey = await this.apiKeyRepository.update(keyId, updateData);

    return {
      id: updatedApiKey.id,
      name: updatedApiKey.name,
      keyPrefix: updatedApiKey.keyPrefix,
      permissions: updatedApiKey.permissions as string[],
      rateLimit: updatedApiKey.rateLimit,
      isActive: updatedApiKey.isActive,
      lastUsedAt: updatedApiKey.lastUsedAt,
      expiresAt: updatedApiKey.expiresAt,
      createdAt: updatedApiKey.createdAt,
    };
  }

  /**
   * Reactivate a previously deactivated API key
   */
  async reactivateApiKey(userId: string, keyId: string): Promise<void> {
    const apiKey = await this.apiKeyRepository.findByIdAndUserId(keyId, userId);
    if (!apiKey) {
      throw new NotFoundException('API key not found');
    }

    if (apiKey.isActive) {
      throw new BadRequestException('API key is already active');
    }

    // Check if expired
    if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
      throw new BadRequestException('Cannot reactivate expired API key');
    }

    await this.apiKeyRepository.reactivate(keyId);
  }

  /**
   * Check if an API key has a specific permission
   */
  hasPermission(apiKey: { permissions: string[] }, requiredPermission: string): boolean {
    // Check for wildcard permissions
    if (apiKey.permissions.includes('*') || apiKey.permissions.includes('admin:*')) {
      return true;
    }

    // Check for exact permission match
    if (apiKey.permissions.includes(requiredPermission)) {
      return true;
    }

    // Check for wildcard pattern matches
    for (const permission of apiKey.permissions) {
      if (permission.endsWith(':*')) {
        const prefix = permission.slice(0, -2);
        if (requiredPermission.startsWith(prefix + ':')) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Get API key statistics for a user
   */
  async getUserApiKeyStats(userId: string): Promise<{
    total: number;
    active: number;
    inactive: number;
    expired: number;
    recentlyUsed: number;
  }> {
    const { apiKeys } = await this.apiKeyRepository.findByUserId(userId, { limit: 1000 }, true);
    const now = new Date();
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const stats = {
      total: apiKeys.length,
      active: 0,
      inactive: 0,
      expired: 0,
      recentlyUsed: 0,
    };

    for (const key of apiKeys) {
      if (key.isActive) {
        if (key.expiresAt && key.expiresAt < now) {
          stats.expired++;
        } else {
          stats.active++;
        }
      } else {
        stats.inactive++;
      }

      if (key.lastUsedAt && key.lastUsedAt > weekAgo) {
        stats.recentlyUsed++;
      }
    }

    return stats;
  }

  /**
   * Generate a secure API key
   */
  private generateSecureKey(): string {
    const prefix = 'rk_'; // ROMAPI Key prefix
    const randomBytes = crypto.randomBytes(32).toString('hex');
    return `${prefix}${randomBytes}`;
  }

  /**
   * Clean up expired API keys (for scheduled tasks)
   */
  async cleanupExpiredKeys(): Promise<{ deactivated: number }> {
    const expiredKeys = await this.apiKeyRepository.getExpiredKeys();
    
    if (expiredKeys.length > 0) {
      const keyIds = expiredKeys.map(key => key.id);
      await this.apiKeyRepository.bulkDeactivate(keyIds);
    }

    return { deactivated: expiredKeys.length };
  }

  /**
   * Get API keys expiring soon (for notifications)
   */
  async getKeysExpiringSoon(daysAhead: number = 7): Promise<Array<{
    id: string;
    name: string;
    expiresAt: Date;
    user: { id: string; email: string; name: string };
  }>> {
    const keys = await this.apiKeyRepository.getKeysExpiringSoon(daysAhead);
    
    return keys.map(key => ({
      id: key.id,
      name: key.name,
      expiresAt: key.expiresAt!,
      user: {
        id: (key as any).user!.id,
        email: (key as any).user!.email,
        name: (key as any).user!.name,
      },
    }));
  }
}