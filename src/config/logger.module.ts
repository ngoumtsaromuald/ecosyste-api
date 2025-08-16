import { Module, Global } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WinstonModule } from 'nest-winston';
import { CustomLoggerService } from './logger.service';
import * as winston from 'winston';

@Global()
@Module({
  imports: [
    WinstonModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const logLevel = configService.get('LOG_LEVEL', 'info');
        const serviceName = configService.get('app.name', 'backend-api-core');
        const version = configService.get('app.version', '1.0.0');
        const isProduction = configService.get('nodeEnv') === 'production';

        // Define log format
        const logFormat = winston.format.combine(
          winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
          winston.format.errors({ stack: true }),
          winston.format.json(),
          winston.format.printf((info) => {
            const { timestamp, level, message, context, trace, ...meta } = info;
            
            const logEntry = {
              timestamp,
              level: level.toUpperCase(),
              service: serviceName,
              version,
              message,
              ...(context && { context }),
              ...(trace && { trace }),
              ...meta,
            };

            return JSON.stringify(logEntry);
          })
        );

        // Configure transports
        const transports: winston.transport[] = [];

        // Console transport
        if (!isProduction) {
          transports.push(
            new winston.transports.Console({
              level: logLevel,
              format: winston.format.combine(
                winston.format.colorize(),
                winston.format.simple(),
                winston.format.printf((info) => {
                  const { timestamp, level, message, context, ...meta } = info;
                  const contextStr = context ? ` [${context}]` : '';
                  const metaStr = Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : '';
                  return `${timestamp} ${level}${contextStr} ${message}${metaStr}`;
                })
              ),
            })
          );
        } else {
          transports.push(
            new winston.transports.Console({
              level: logLevel,
              format: logFormat,
            })
          );
        }

        // File transports for production
        if (isProduction) {
          // Application logs
          transports.push(
            new winston.transports.File({
              filename: 'logs/app.log',
              level: 'info',
              format: logFormat,
              maxsize: 10 * 1024 * 1024, // 10MB
              maxFiles: 5,
            })
          );

          // Error logs
          transports.push(
            new winston.transports.File({
              filename: 'logs/error.log',
              level: 'error',
              format: logFormat,
              maxsize: 10 * 1024 * 1024, // 10MB
              maxFiles: 5,
            })
          );

          // Audit logs
          transports.push(
            new winston.transports.File({
              filename: 'logs/audit.log',
              level: 'info',
              format: logFormat,
              maxsize: 10 * 1024 * 1024, // 10MB
              maxFiles: 10,
            })
          );
        }

        return {
          level: logLevel,
          format: logFormat,
          transports,
          exitOnError: false,
        };
      },
    }),
  ],
  providers: [CustomLoggerService],
  exports: [CustomLoggerService],
})
export class LoggerModule {}