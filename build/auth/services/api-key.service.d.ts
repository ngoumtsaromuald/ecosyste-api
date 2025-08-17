import { ApiKeyRepository } from '../../repositories/api-key.repository';
import { RateLimitService } from './rate-limit.service';
import { AuditService } from './audit.service';
import { CreateApiKeyDto, UpdateApiKeyDto, ApiKeyResponseDto, ApiKeyListResponseDto, ApiKeyValidationResult } from '../dto';
export declare class ApiKeyService {
    private readonly apiKeyRepository;
    private readonly rateLimitService;
    private readonly auditService;
    constructor(apiKeyRepository: ApiKeyRepository, rateLimitService: RateLimitService, auditService: AuditService);
    createApiKey(userId: string, createDto: CreateApiKeyDto): Promise<ApiKeyResponseDto>;
    validateApiKey(keyValue: string): Promise<ApiKeyValidationResult>;
    listUserApiKeys(userId: string): Promise<ApiKeyListResponseDto[]>;
    revokeApiKey(userId: string, keyId: string): Promise<void>;
    updateApiKey(userId: string, keyId: string, updateDto: UpdateApiKeyDto): Promise<ApiKeyListResponseDto>;
    reactivateApiKey(userId: string, keyId: string): Promise<void>;
    hasPermission(apiKey: {
        permissions: string[];
    }, requiredPermission: string): boolean;
    getUserApiKeyStats(userId: string): Promise<{
        total: number;
        active: number;
        inactive: number;
        expired: number;
        recentlyUsed: number;
    }>;
    private generateSecureKey;
    cleanupExpiredKeys(): Promise<{
        deactivated: number;
    }>;
    getKeysExpiringSoon(daysAhead?: number): Promise<Array<{
        id: string;
        name: string;
        expiresAt: Date;
        user: {
            id: string;
            email: string;
            name: string;
        };
    }>>;
}
