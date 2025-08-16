import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppService {
  constructor(private readonly configService: ConfigService) {}

  getInfo(): { message: string; timestamp: string; version: string; environment: string } {
    return {
      message: 'ROMAPI Backend Core is running',
      timestamp: new Date().toISOString(),
      version: this.configService.get('app.version', '1.0.0'),
      environment: this.configService.get('nodeEnv', 'development'),
    };
  }
}