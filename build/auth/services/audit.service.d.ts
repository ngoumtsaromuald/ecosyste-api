import { AuditRepository } from '../repositories/audit.repository';
export declare class AuditService {
    private readonly auditRepository;
    constructor(auditRepository: AuditRepository);
    logLogin(userId: string, ipAddress?: string, userAgent?: string, success?: boolean): Promise<void>;
    logLogout(userId: string, ipAddress?: string, userAgent?: string): Promise<void>;
    logTokenGeneration(userId: string, tokenType: 'access_token' | 'refresh_token', ipAddress?: string, userAgent?: string): Promise<void>;
    logApiKeyCreation(userId: string, apiKeyId: string, ipAddress?: string, userAgent?: string): Promise<void>;
    logApiKeyRevocation(userId: string, apiKeyId: string, ipAddress?: string, userAgent?: string): Promise<void>;
    logApiKeyUsage(userId: string, apiKeyId: string, endpoint: string, ipAddress?: string, userAgent?: string): Promise<void>;
    logOAuthLogin(userId: string, provider: string, ipAddress?: string, userAgent?: string): Promise<void>;
    logPermissionCheck(userId: string, permission: string, granted: boolean, context?: {
        userId?: string;
        resourceId?: string;
        action?: string;
        resource?: string;
    }, ipAddress?: string, userAgent?: string): Promise<void>;
    logSuspiciousActivity(userId: string | null, activity: string, details: Record<string, any>, ipAddress?: string, userAgent?: string): Promise<void>;
    logPasswordChange(userId: string, ipAddress?: string, userAgent?: string): Promise<void>;
    logAccountLocked(userId: string, reason: string, ipAddress?: string, userAgent?: string): Promise<void>;
    logAccountUnlocked(userId: string, ipAddress?: string, userAgent?: string): Promise<void>;
    logUserRegistration(userId: string, email: string, method?: string, ipAddress?: string, userAgent?: string): Promise<void>;
    logOAuthAccountLinked(userId: string, provider: string, ipAddress?: string, userAgent?: string): Promise<void>;
    logOAuthAccountUnlinked(userId: string, provider: string, ipAddress?: string, userAgent?: string): Promise<void>;
    logFailedLogin(email: string, reason: string, ipAddress?: string, userAgent?: string): Promise<void>;
    logSuccessfulLogin(userId: string, email: string, ipAddress?: string, userAgent?: string): Promise<void>;
    logPasswordResetRequest(userId: string, email: string, ipAddress?: string, userAgent?: string): Promise<void>;
    logPasswordReset(userId: string, ipAddress?: string, userAgent?: string): Promise<void>;
}
