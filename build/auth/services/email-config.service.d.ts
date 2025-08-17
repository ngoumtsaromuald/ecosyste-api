import { ConfigService } from '@nestjs/config';
export declare class EmailConfigService {
    private readonly configService;
    private readonly logger;
    constructor(configService: ConfigService);
    validateEmailConfiguration(): boolean;
    getEmailConfiguration(): {
        host: string;
        port: number;
        secure: boolean;
        user: string;
        from: string;
        frontendUrl: string;
    };
}
