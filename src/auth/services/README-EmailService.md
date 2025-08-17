# EmailService Documentation

## Overview

The EmailService provides a comprehensive email functionality for the ROMAPI authentication system. It supports HTML and text templates, SMTP configuration, and various email types including verification, password reset, login notifications, and quota warnings.

## Features

- ✅ **HTML and Text Templates**: Dual format support for better compatibility
- ✅ **SMTP Configuration**: Configurable SMTP settings via environment variables
- ✅ **Template Variables**: Dynamic content replacement with Handlebars-like syntax
- ✅ **Conditional Content**: Support for conditional blocks in templates
- ✅ **Error Handling**: Comprehensive error handling and logging
- ✅ **Configuration Validation**: Built-in configuration validation
- ✅ **Testing Support**: Email configuration testing capabilities

## Email Types

### 1. Email Verification
- **Purpose**: Verify user email addresses during registration
- **Template**: `email-verification.html/txt`
- **Variables**: `name`, `verificationUrl`

### 2. Password Reset
- **Purpose**: Send secure password reset links
- **Template**: `password-reset.html/txt`
- **Variables**: `name`, `resetUrl`

### 3. Login Notification
- **Purpose**: Alert users of new device/location logins
- **Template**: `login-notification.html/txt`
- **Variables**: `name`, `loginTime`, `ipAddress`, `location`, `device`, `browser`, `securityUrl`

### 4. Quota Warning
- **Purpose**: Warn users when approaching API limits
- **Template**: `quota-warning.html/txt`
- **Variables**: `name`, `usagePercentage`, `usedRequests`, `totalRequests`, `remainingRequests`, `resetDate`, `isNearLimit`, `dashboardUrl`, `upgradeUrl`

## Configuration

### Environment Variables

```env
# SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM=noreply@romapi.com

# Frontend URL for links
FRONTEND_URL=http://localhost:3000
```

### Required Dependencies

```json
{
  "nodemailer": "^7.0.5",
  "@types/nodemailer": "^7.0.0"
}
```

## Usage Examples

### Basic Usage

```typescript
import { EmailService } from './email.service';

@Injectable()
export class AuthService {
  constructor(private readonly emailService: EmailService) {}

  async registerUser(userData: any) {
    // ... user creation logic
    
    // Send verification email
    await this.emailService.sendVerificationEmail(
      user.email,
      user.name,
      verificationToken
    );
  }
}
```

### Advanced Usage with Error Handling

```typescript
async sendEmailWithRetry(email: string, name: string, token: string, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await this.emailService.sendVerificationEmail(email, name, token);
      return; // Success
    } catch (error) {
      if (attempt === maxRetries) {
        throw error; // Final attempt failed
      }
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt)); // Exponential backoff
    }
  }
}
```

### Configuration Testing

```typescript
// Test email configuration
const isValid = await this.emailService.testEmailConfiguration();
if (!isValid) {
  throw new Error('Email service is not properly configured');
}
```

## Template System

### Template Location
Templates are stored in `src/auth/templates/`:
- `email-verification.html/txt`
- `password-reset.html/txt`
- `login-notification.html/txt`
- `quota-warning.html/txt`

### Variable Replacement
Variables use double curly braces: `{{variableName}}`

```html
<p>Hello {{name}}, please verify your email by clicking: {{verificationUrl}}</p>
```

### Conditional Blocks
Simple conditional logic is supported:

```html
{{#if isNearLimit}}
<div class="warning">You are approaching your quota limit!</div>
{{/if}}
```

## API Methods

### Core Methods

#### `sendVerificationEmail(email: string, name: string, verificationToken?: string): Promise<void>`
Sends an email verification message.

#### `sendPasswordResetEmail(email: string, name: string, resetToken: string): Promise<void>`
Sends a password reset email with secure token.

#### `sendLoginNotification(email: string, data: LoginNotificationData): Promise<void>`
Sends a login notification for security monitoring.

#### `sendQuotaWarning(email: string, data: QuotaWarningData): Promise<void>`
Sends a quota warning when API limits are approached.

### Utility Methods

#### `testEmailConfiguration(): Promise<boolean>`
Tests the SMTP configuration and returns connection status.

### Legacy Methods (Backward Compatibility)

#### `sendWelcomeEmail(email: string, name: string): Promise<void>`
#### `sendEmailVerification(email: string, token: string): Promise<void>`
#### `sendSecurityAlert(email: string, activity: string): Promise<void>`
#### `sendPasswordResetConfirmation(email: string, name: string): Promise<void>`

## Error Handling

The service includes comprehensive error handling:

- **Template Loading Errors**: When templates cannot be found or read
- **SMTP Connection Errors**: When email server is unreachable
- **Configuration Errors**: When required environment variables are missing
- **Send Errors**: When individual emails fail to send

All errors are logged with appropriate context for debugging.

## Testing

The service includes comprehensive unit tests covering:

- ✅ SMTP configuration initialization
- ✅ Template loading and variable replacement
- ✅ All email types (verification, reset, notification, quota)
- ✅ Error handling scenarios
- ✅ Configuration validation
- ✅ Legacy method compatibility

Run tests with:
```bash
npm test -- src/auth/services/__tests__/email.service.spec.ts
```

## Health Monitoring

The EmailHealthController provides endpoints for monitoring:

- `GET /auth/email/health` - Check email service status
- `GET /auth/email/config` - View email configuration (admin only)

## Security Considerations

1. **SMTP Credentials**: Store SMTP credentials securely using environment variables
2. **Template Security**: Templates are loaded from the filesystem, ensure proper file permissions
3. **Rate Limiting**: Consider implementing rate limiting for email sending
4. **Content Validation**: Validate all template variables to prevent injection attacks
5. **Logging**: Sensitive information is not logged (passwords, tokens are masked)

## Performance Considerations

1. **Connection Pooling**: Nodemailer automatically handles connection pooling
2. **Template Caching**: Templates are loaded on-demand (consider caching for high volume)
3. **Async Processing**: All email operations are asynchronous
4. **Error Recovery**: Implement retry logic for transient failures

## Troubleshooting

### Common Issues

1. **SMTP Authentication Errors**
   - Verify SMTP credentials
   - Check if 2FA requires app-specific passwords
   - Ensure SMTP server allows connections

2. **Template Not Found Errors**
   - Verify template files exist in `src/auth/templates/`
   - Check file permissions
   - Ensure correct file extensions (.html/.txt)

3. **Variable Replacement Issues**
   - Verify variable names match exactly (case-sensitive)
   - Check for typos in template variables
   - Ensure all required variables are provided

### Debug Mode

Enable debug logging by setting log level to debug in your configuration.

## Future Enhancements

- [ ] Template caching for better performance
- [ ] Email queue system for high volume
- [ ] Rich text editor integration
- [ ] Email analytics and tracking
- [ ] Multi-language template support
- [ ] Email template management UI