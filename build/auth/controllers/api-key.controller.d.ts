import { ApiKeyService } from '../services/api-key.service';
import { CreateApiKeyDto, UpdateApiKeyDto, ApiKeyResponseDto, ApiKeyListResponseDto } from '../dto';
interface AuthenticatedRequest extends Request {
    user: {
        id: string;
        email: string;
        userType: string;
        plan: string;
    };
}
export declare class ApiKeyController {
    private readonly apiKeyService;
    constructor(apiKeyService: ApiKeyService);
    listApiKeys(req: AuthenticatedRequest): Promise<ApiKeyListResponseDto[]>;
    createApiKey(req: AuthenticatedRequest, createDto: CreateApiKeyDto): Promise<ApiKeyResponseDto>;
    updateApiKey(req: AuthenticatedRequest, keyId: string, updateDto: UpdateApiKeyDto): Promise<ApiKeyListResponseDto>;
    revokeApiKey(req: AuthenticatedRequest, keyId: string): Promise<void>;
    reactivateApiKey(req: AuthenticatedRequest, keyId: string): Promise<void>;
    getApiKeyStats(req: AuthenticatedRequest): Promise<{
        total: number;
        active: number;
        inactive: number;
        expired: number;
        recentlyUsed: number;
    }>;
}
export {};
