import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EmailConfigService {
  private readonly logger = new Logger(EmailConfigService.name);

  constructor(private readonly configService: ConfigService) {}

  validateEmailConfiguration(): boolean {
    const requiredConfigs = [
      'SMTP_HOST',
      'SMTP_PORT',
      'SMTP_USER',
      'SMTP_PASS',
      'EMAIL_FROM',
    ];

    const missingConfigs = requiredConfigs.filter(
      config => !this.configService.get(config)
    );

    if (missingConfigs.length > 0) {
      this.logger.error(
        `Missing email configuration: ${missingConfigs.join(', ')}`
      );
      return false;
    }

    this.logger.log('Email configuration validation passed');
    return true;
  }

  getEmailConfiguration() {
    return {
      host: this.configService.get<string>('SMTP_HOST'),
      port: this.configService.get<number>('SMTP_PORT', 587),
      secure: this.configService.get<boolean>('SMTP_SECURE', false),
      user: this.configService.get<string>('SMTP_USER'),
      from: this.configService.get<string>('EMAIL_FROM'),
      frontendUrl: this.configService.get<string>('FRONTEND_URL', 'http://localhost:3000'),
    };
  }
}