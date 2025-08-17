import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import * as fs from 'fs';
import * as path from 'path';
import {
  EmailTemplate,
  LoginNotificationData,
  QuotaWarningData,
  EmailVerificationData,
  PasswordResetData,
} from '../interfaces/email.interface';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;
  private templatesPath: string;

  constructor(private readonly configService: ConfigService) {
    this.templatesPath = path.join(process.cwd(), 'src', 'auth', 'templates');
    this.initializeTransporter();
  }

  private initializeTransporter(): void {
    const smtpConfig = {
      host: this.configService.get<string>('SMTP_HOST'),
      port: this.configService.get<number>('SMTP_PORT', 587),
      secure: this.configService.get<boolean>('SMTP_SECURE', false),
      auth: {
        user: this.configService.get<string>('SMTP_USER'),
        pass: this.configService.get<string>('SMTP_PASS'),
      },
    };

    this.transporter = nodemailer.createTransport(smtpConfig);

    // Verify connection configuration
    this.transporter.verify((error, success) => {
      if (error) {
        this.logger.error('SMTP configuration error:', error);
      } else {
        this.logger.log('SMTP server is ready to take our messages');
      }
    });
  }

  private async loadTemplate(templateName: string, variables: Record<string, any>): Promise<EmailTemplate> {
    try {
      const htmlPath = path.join(this.templatesPath, `${templateName}.html`);
      const textPath = path.join(this.templatesPath, `${templateName}.txt`);

      let htmlContent = fs.readFileSync(htmlPath, 'utf8');
      let textContent = fs.readFileSync(textPath, 'utf8');

      // Replace variables in templates
      Object.keys(variables).forEach(key => {
        const regex = new RegExp(`{{${key}}}`, 'g');
        htmlContent = htmlContent.replace(regex, variables[key]);
        textContent = textContent.replace(regex, variables[key]);
      });

      // Handle conditional blocks (simple implementation)
      htmlContent = this.processConditionals(htmlContent, variables);
      textContent = this.processConditionals(textContent, variables);

      return {
        subject: this.getSubjectForTemplate(templateName, variables),
        html: htmlContent,
        text: textContent,
      };
    } catch (error) {
      this.logger.error(`Error loading template ${templateName}:`, error);
      throw new Error(`Failed to load email template: ${templateName}`);
    }
  }

  private processConditionals(content: string, variables: Record<string, any>): string {
    // Simple conditional processing for {{#if variable}} blocks
    const ifRegex = /{{#if\s+(\w+)}}([\s\S]*?){{\/if}}/g;
    
    return content.replace(ifRegex, (match, variable, block) => {
      return variables[variable] ? block : '';
    });
  }

  private getSubjectForTemplate(templateName: string, variables: Record<string, any>): string {
    const subjects = {
      'email-verification': 'Vérifiez votre adresse email - ROMAPI',
      'password-reset': 'Réinitialisation de votre mot de passe - ROMAPI',
      'login-notification': 'Nouvelle connexion détectée - ROMAPI',
      'quota-warning': `Avertissement de quota API (${variables.usagePercentage}%) - ROMAPI`,
    };

    return subjects[templateName] || 'Notification ROMAPI';
  }

  private async sendEmail(to: string, template: EmailTemplate): Promise<void> {
    try {
      const mailOptions = {
        from: this.configService.get<string>('EMAIL_FROM', 'noreply@romapi.com'),
        to,
        subject: template.subject,
        text: template.text,
        html: template.html,
      };

      const result = await this.transporter.sendMail(mailOptions);
      this.logger.log(`Email sent successfully to ${to}. Message ID: ${result.messageId}`);
    } catch (error) {
      this.logger.error(`Failed to send email to ${to}:`, error);
      throw new Error(`Failed to send email: ${error.message}`);
    }
  }

  async sendVerificationEmail(email: string, name: string, verificationToken?: string): Promise<void> {
    const baseUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:3000');
    const verificationUrl = `${baseUrl}/auth/verify-email?token=${verificationToken || 'placeholder-token'}`;

    const template = await this.loadTemplate('email-verification', {
      name,
      verificationUrl,
    });

    await this.sendEmail(email, template);
    this.logger.log(`Verification email sent to ${email}`);
  }

  async sendPasswordResetEmail(email: string, name: string, resetToken: string): Promise<void> {
    const baseUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:3000');
    const resetUrl = `${baseUrl}/auth/reset-password?token=${resetToken}`;

    const template = await this.loadTemplate('password-reset', {
      name,
      resetUrl,
    });

    await this.sendEmail(email, template);
    this.logger.log(`Password reset email sent to ${email}`);
  }

  async sendLoginNotification(email: string, data: LoginNotificationData): Promise<void> {
    const template = await this.loadTemplate('login-notification', data);

    await this.sendEmail(email, template);
    this.logger.log(`Login notification sent to ${email}`);
  }

  async sendQuotaWarning(email: string, data: QuotaWarningData): Promise<void> {
    const template = await this.loadTemplate('quota-warning', data);

    await this.sendEmail(email, template);
    this.logger.log(`Quota warning sent to ${email} (${data.usagePercentage}% usage)`);
  }

  // Legacy methods for backward compatibility
  async sendWelcomeEmail(email: string, name: string): Promise<void> {
    // For now, use verification email as welcome email
    await this.sendVerificationEmail(email, name);
  }

  async sendEmailVerification(email: string, token: string): Promise<void> {
    // Extract name from email for backward compatibility
    const name = email.split('@')[0];
    await this.sendVerificationEmail(email, name, token);
  }

  async sendSecurityAlert(email: string, activity: string): Promise<void> {
    const name = email.split('@')[0];
    const now = new Date();
    
    await this.sendLoginNotification(email, {
      name,
      loginTime: now.toLocaleString('fr-FR'),
      ipAddress: 'Unknown',
      location: 'Unknown',
      device: 'Unknown',
      browser: 'Unknown',
      securityUrl: `${this.configService.get<string>('FRONTEND_URL', 'http://localhost:3000')}/security`,
    });
  }

  async sendPasswordResetConfirmation(email: string, name: string): Promise<void> {
    // For now, log the confirmation - could be extended with a specific template
    this.logger.log(`Password reset confirmation for ${email} (${name})`);
    // Could implement a specific confirmation template here
  }

  // Utility method to test email configuration
  async testEmailConfiguration(): Promise<boolean> {
    try {
      await this.transporter.verify();
      return true;
    } catch (error) {
      this.logger.error('Email configuration test failed:', error);
      return false;
    }
  }
}