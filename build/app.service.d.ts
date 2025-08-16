import { ConfigService } from '@nestjs/config';
export declare class AppService {
    private readonly configService;
    constructor(configService: ConfigService);
    getInfo(): {
        message: string;
        timestamp: string;
        version: string;
        environment: string;
    };
}
