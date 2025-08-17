import { ConfigService } from '@nestjs/config';
import { LoginNotificationData, QuotaWarningData } from '../interfaces/email.interface';
export declare class EmailService {
    private readonly configService;
    private readonly logger;
    private transporter;
    private templatesPath;
    constructor(configService: ConfigService);
    private initializeTransporter;
    private loadTemplate;
    private processConditionals;
    private getSubjectForTemplate;
    private sendEmail;
    sendVerificationEmail(email: string, name: string, verificationToken?: string): Promise<void>;
    sendPasswordResetEmail(email: string, name: string, resetToken: string): Promise<void>;
    sendLoginNotification(email: string, data: LoginNotificationData): Promise<void>;
    sendQuotaWarning(email: string, data: QuotaWarningData): Promise<void>;
    sendWelcomeEmail(email: string, name: string): Promise<void>;
    sendEmailVerification(email: string, token: string): Promise<void>;
    sendSecurityAlert(email: string, activity: string): Promise<void>;
    sendPasswordResetConfirmation(email: string, name: string): Promise<void>;
    testEmailConfiguration(): Promise<boolean>;
}
