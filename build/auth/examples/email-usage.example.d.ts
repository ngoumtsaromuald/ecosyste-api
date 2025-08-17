import { EmailService } from '../services/email.service';
export declare class EmailUsageExample {
    private readonly emailService;
    constructor(emailService: EmailService);
    handleUserRegistration(email: string, name: string, verificationToken: string): Promise<void>;
    handlePasswordResetRequest(email: string, name: string, resetToken: string): Promise<void>;
    handleSuspiciousLogin(email: string, loginDetails: any): Promise<void>;
    handleQuotaWarning(email: string, quotaInfo: any): Promise<void>;
    sendBatchEmails(emailList: Array<{
        email: string;
        name: string;
        token: string;
    }>): Promise<any[]>;
    safeEmailSend(email: string, name: string, token: string): Promise<void>;
}
export declare class AuthEmailIntegration {
    private readonly emailService;
    constructor(emailService: EmailService);
    onUserRegistered(user: any, verificationToken: string): Promise<void>;
    onPasswordResetRequested(user: any, resetToken: string): Promise<void>;
    onSuspiciousLoginDetected(user: any, loginContext: any): Promise<void>;
    onQuotaThresholdReached(user: any, usage: any): Promise<void>;
}
