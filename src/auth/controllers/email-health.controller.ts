import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { EmailService } from '../services/email.service';
import { EmailConfigService } from '../services/email-config.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { PermissionGuard } from '../guards/permission.guard';
import { RequirePermissions } from '../decorators/require-permissions.decorator';

@Controller('auth/email')
@ApiTags('Email Health')
@UseGuards(JwtAuthGuard, PermissionGuard)
@ApiBearerAuth()
export class EmailHealthController {
  constructor(
    private readonly emailService: EmailService,
    private readonly emailConfigService: EmailConfigService,
  ) {}

  @Get('health')
  @ApiOperation({ summary: 'Check email service health' })
  @ApiResponse({ status: 200, description: 'Email service status' })
  @RequirePermissions('admin:email')
  async checkEmailHealth() {
    const configValid = this.emailConfigService.validateEmailConfiguration();
    const connectionValid = await this.emailService.testEmailConfiguration();
    
    return {
      status: configValid && connectionValid ? 'healthy' : 'unhealthy',
      configuration: configValid ? 'valid' : 'invalid',
      connection: connectionValid ? 'connected' : 'failed',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('config')
  @ApiOperation({ summary: 'Get email configuration (admin only)' })
  @ApiResponse({ status: 200, description: 'Email configuration details' })
  @RequirePermissions('admin:email')
  async getEmailConfig() {
    const config = this.emailConfigService.getEmailConfiguration();
    
    // Remove sensitive information
    return {
      host: config.host,
      port: config.port,
      secure: config.secure,
      from: config.from,
      frontendUrl: config.frontendUrl,
      user: config.user ? `${config.user.substring(0, 3)}***` : 'not configured',
    };
  }
}