import { Injectable } from '@nestjs/common';
import { AuditRepository } from '../repositories/audit.repository';

@Injectable()
export class AuditService {
  constructor(private readonly auditRepository: AuditRepository) {}

  async logLogin(
    userId: string,
    ipAddress?: string,
    userAgent?: string,
    success: boolean = true
  ): Promise<void> {
    await this.auditRepository.create({
      userId,
      action: success ? 'auth.login.success' : 'auth.login.failed',
      resource: 'auth',
      details: {
        success,
        timestamp: new Date().toISOString(),
      },
      ipAddress,
      userAgent,
    });
  }

  async logLogout(
    userId: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await this.auditRepository.create({
      userId,
      action: 'auth.logout',
      resource: 'auth',
      details: {
        timestamp: new Date().toISOString(),
      },
      ipAddress,
      userAgent,
    });
  }

  async logTokenGeneration(
    userId: string,
    tokenType: 'access_token' | 'refresh_token',
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await this.auditRepository.create({
      userId,
      action: 'auth.token.generated',
      resource: 'auth',
      details: {
        tokenType,
        timestamp: new Date().toISOString(),
      },
      ipAddress,
      userAgent,
    });
  }

  async logApiKeyCreation(
    userId: string,
    apiKeyId: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await this.auditRepository.create({
      userId,
      action: 'api_key.created',
      resource: 'api_key',
      details: {
        apiKeyId,
        timestamp: new Date().toISOString(),
      },
      ipAddress,
      userAgent,
    });
  }

  async logApiKeyRevocation(
    userId: string,
    apiKeyId: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await this.auditRepository.create({
      userId,
      action: 'api_key.revoked',
      resource: 'api_key',
      details: {
        apiKeyId,
        timestamp: new Date().toISOString(),
      },
      ipAddress,
      userAgent,
    });
  }

  async logApiKeyUsage(
    userId: string,
    apiKeyId: string,
    endpoint: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await this.auditRepository.create({
      userId,
      action: 'api_key.used',
      resource: 'api_key',
      details: {
        apiKeyId,
        endpoint,
        timestamp: new Date().toISOString(),
      },
      ipAddress,
      userAgent,
    });
  }

  async logOAuthLogin(
    userId: string,
    provider: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await this.auditRepository.create({
      userId,
      action: 'auth.oauth.login',
      resource: 'auth',
      details: {
        provider,
        timestamp: new Date().toISOString(),
      },
      ipAddress,
      userAgent,
    });
  }

  async logPermissionCheck(
    userId: string,
    permission: string,
    granted: boolean,
    context?: {
      userId?: string;
      resourceId?: string;
      action?: string;
      resource?: string;
    },
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await this.auditRepository.create({
      userId,
      action: 'auth.permission.check',
      resource: context?.resource || 'permission',
      details: {
        permission,
        granted,
        context,
        timestamp: new Date().toISOString(),
      },
      ipAddress,
      userAgent,
    });
  }

  async logSuspiciousActivity(
    userId: string | null,
    activity: string,
    details: Record<string, any>,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await this.auditRepository.create({
      userId,
      action: 'security.suspicious_activity',
      resource: 'security',
      details: {
        activity,
        ...details,
        timestamp: new Date().toISOString(),
      },
      ipAddress,
      userAgent,
    });
  }



  async logPasswordChange(
    userId: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await this.auditRepository.create({
      userId,
      action: 'auth.password.changed',
      resource: 'auth',
      details: {
        timestamp: new Date().toISOString(),
      },
      ipAddress,
      userAgent,
    });
  }

  async logAccountLocked(
    userId: string,
    reason: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await this.auditRepository.create({
      userId,
      action: 'auth.account.locked',
      resource: 'auth',
      details: {
        reason,
        timestamp: new Date().toISOString(),
      },
      ipAddress,
      userAgent,
    });
  }

  async logAccountUnlocked(
    userId: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await this.auditRepository.create({
      userId,
      action: 'auth.account.unlocked',
      resource: 'auth',
      details: {
        timestamp: new Date().toISOString(),
      },
      ipAddress,
      userAgent,
    });
  }

  async logUserRegistration(
    userId: string,
    email: string,
    method: string = 'email',
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await this.auditRepository.create({
      userId,
      action: 'auth.user.registered',
      resource: 'auth',
      details: {
        email,
        method,
        timestamp: new Date().toISOString(),
      },
      ipAddress,
      userAgent,
    });
  }

  async logOAuthAccountLinked(
    userId: string,
    provider: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await this.auditRepository.create({
      userId,
      action: 'auth.oauth.account.linked',
      resource: 'auth',
      details: {
        provider,
        timestamp: new Date().toISOString(),
      },
      ipAddress,
      userAgent,
    });
  }

  async logOAuthAccountUnlinked(
    userId: string,
    provider: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await this.auditRepository.create({
      userId,
      action: 'auth.oauth.account.unlinked',
      resource: 'auth',
      details: {
        provider,
        timestamp: new Date().toISOString(),
      },
      ipAddress,
      userAgent,
    });
  }

  async logFailedLogin(
    email: string,
    reason: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await this.auditRepository.create({
      userId: null,
      action: 'auth.login.failed',
      resource: 'auth',
      details: {
        email,
        reason,
        timestamp: new Date().toISOString(),
      },
      ipAddress,
      userAgent,
    });
  }

  async logSuccessfulLogin(
    userId: string,
    email: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await this.auditRepository.create({
      userId,
      action: 'auth.login.success',
      resource: 'auth',
      details: {
        email,
        timestamp: new Date().toISOString(),
      },
      ipAddress,
      userAgent,
    });
  }

  async logPasswordResetRequest(
    userId: string,
    email: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await this.auditRepository.create({
      userId,
      action: 'auth.password.reset.requested',
      resource: 'auth',
      details: {
        email,
        timestamp: new Date().toISOString(),
      },
      ipAddress,
      userAgent,
    });
  }

  async logPasswordReset(
    userId: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await this.auditRepository.create({
      userId,
      action: 'auth.password.reset.completed',
      resource: 'auth',
      details: {
        timestamp: new Date().toISOString(),
      },
      ipAddress,
      userAgent,
    });
  }
}