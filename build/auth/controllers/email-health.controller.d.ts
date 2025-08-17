import { EmailService } from '../services/email.service';
import { EmailConfigService } from '../services/email-config.service';
export declare class EmailHealthController {
    private readonly emailService;
    private readonly emailConfigService;
    constructor(emailService: EmailService, emailConfigService: EmailConfigService);
    checkEmailHealth(): Promise<{
        status: string;
        configuration: string;
        connection: string;
        timestamp: string;
    }>;
    getEmailConfig(): Promise<{
        host: string;
        port: number;
        secure: boolean;
        from: string;
        frontendUrl: string;
        user: string;
    }>;
}
