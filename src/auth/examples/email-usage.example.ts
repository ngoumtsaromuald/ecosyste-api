import { Injectable } from '@nestjs/common';
import { EmailService } from '../services/email.service';
import { LoginNotificationData, QuotaWarningData } from '../interfaces/email.interface';

/**
 * Example usage of EmailService for different scenarios
 * This file demonstrates how to use the EmailService in various contexts
 */
@Injectable()
export class EmailUsageExample {
  constructor(private readonly emailService: EmailService) {}

  /**
   * Example: Send verification email during user registration
   */
  async handleUserRegistration(email: string, name: string, verificationToken: string) {
    try {
      await this.emailService.sendVerificationEmail(email, name, verificationToken);
      console.log(`Verification email sent to ${email}`);
    } catch (error) {
      console.error('Failed to send verification email:', error);
      // Handle error appropriately (log, retry, etc.)
    }
  }

  /**
   * Example: Send password reset email
   */
  async handlePasswordResetRequest(email: string, name: string, resetToken: string) {
    try {
      await this.emailService.sendPasswordResetEmail(email, name, resetToken);
      console.log(`Password reset email sent to ${email}`);
    } catch (error) {
      console.error('Failed to send password reset email:', error);
    }
  }

  /**
   * Example: Send login notification for new device/location
   */
  async handleSuspiciousLogin(email: string, loginDetails: any) {
    const loginData: LoginNotificationData = {
      name: loginDetails.userName,
      loginTime: new Date().toLocaleString('fr-FR'),
      ipAddress: loginDetails.ipAddress,
      location: loginDetails.location || 'Unknown',
      device: loginDetails.device || 'Unknown',
      browser: loginDetails.userAgent || 'Unknown',
      securityUrl: 'https://romapi.com/security',
    };

    try {
      await this.emailService.sendLoginNotification(email, loginData);
      console.log(`Login notification sent to ${email}`);
    } catch (error) {
      console.error('Failed to send login notification:', error);
    }
  }

  /**
   * Example: Send quota warning when user approaches API limits
   */
  async handleQuotaWarning(email: string, quotaInfo: any) {
    const quotaData: QuotaWarningData = {
      name: quotaInfo.userName,
      usagePercentage: Math.round((quotaInfo.used / quotaInfo.total) * 100),
      usedRequests: quotaInfo.used,
      totalRequests: quotaInfo.total,
      remainingRequests: quotaInfo.total - quotaInfo.used,
      resetDate: quotaInfo.resetDate.toLocaleDateString('fr-FR'),
      isNearLimit: quotaInfo.used / quotaInfo.total >= 0.8, // 80% threshold
      dashboardUrl: 'https://romapi.com/dashboard',
      upgradeUrl: 'https://romapi.com/pricing',
    };

    try {
      await this.emailService.sendQuotaWarning(email, quotaData);
      console.log(`Quota warning sent to ${email} (${quotaData.usagePercentage}% usage)`);
    } catch (error) {
      console.error('Failed to send quota warning:', error);
    }
  }

  /**
   * Example: Batch email sending with error handling
   */
  async sendBatchEmails(emailList: Array<{ email: string; name: string; token: string }>) {
    const results = [];

    for (const user of emailList) {
      try {
        await this.emailService.sendVerificationEmail(user.email, user.name, user.token);
        results.push({ email: user.email, status: 'sent' });
      } catch (error) {
        results.push({ email: user.email, status: 'failed', error: error.message });
      }
    }

    return results;
  }

  /**
   * Example: Test email configuration before sending
   */
  async safeEmailSend(email: string, name: string, token: string) {
    // Test configuration first
    const isConfigValid = await this.emailService.testEmailConfiguration();
    
    if (!isConfigValid) {
      throw new Error('Email configuration is invalid');
    }

    // Send email if configuration is valid
    await this.emailService.sendVerificationEmail(email, name, token);
  }
}

/**
 * Example integration with authentication flow
 */
@Injectable()
export class AuthEmailIntegration {
  constructor(private readonly emailService: EmailService) {}

  /**
   * Integration with user registration
   */
  async onUserRegistered(user: any, verificationToken: string) {
    await this.emailService.sendVerificationEmail(
      user.email,
      user.name,
      verificationToken
    );
  }

  /**
   * Integration with password reset
   */
  async onPasswordResetRequested(user: any, resetToken: string) {
    await this.emailService.sendPasswordResetEmail(
      user.email,
      user.name,
      resetToken
    );
  }

  /**
   * Integration with login monitoring
   */
  async onSuspiciousLoginDetected(user: any, loginContext: any) {
    const loginData: LoginNotificationData = {
      name: user.name,
      loginTime: new Date().toLocaleString('fr-FR'),
      ipAddress: loginContext.ip,
      location: loginContext.location,
      device: loginContext.device,
      browser: loginContext.userAgent,
      securityUrl: `${process.env.FRONTEND_URL}/security`,
    };

    await this.emailService.sendLoginNotification(user.email, loginData);
  }

  /**
   * Integration with API quota monitoring
   */
  async onQuotaThresholdReached(user: any, usage: any) {
    const quotaData: QuotaWarningData = {
      name: user.name,
      usagePercentage: usage.percentage,
      usedRequests: usage.used,
      totalRequests: usage.total,
      remainingRequests: usage.remaining,
      resetDate: usage.resetDate.toLocaleDateString('fr-FR'),
      isNearLimit: usage.percentage >= 80,
      dashboardUrl: `${process.env.FRONTEND_URL}/dashboard`,
      upgradeUrl: `${process.env.FRONTEND_URL}/pricing`,
    };

    await this.emailService.sendQuotaWarning(user.email, quotaData);
  }
}