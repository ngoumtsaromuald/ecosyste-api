import { WinstonModuleOptions } from 'nest-winston';
import * as winston from 'winston';
import { ElasticsearchTransport } from 'winston-elasticsearch';

export interface SearchLoggingConfig {
  level: string;
  enableConsole: boolean;
  enableFile: boolean;
  enableElasticsearch: boolean;
  elasticsearchNode?: string;
  elasticsearchIndex: string;
  structuredLogging: boolean;
  includeTraceId: boolean;
  sensitiveFields: string[];
}

export function createSearchLoggingConfig(config: SearchLoggingConfig): WinstonModuleOptions {
  const transports: winston.transport[] = [];

  // Console transport for development
  if (config.enableConsole) {
    transports.push(
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.errors({ stack: true }),
          winston.format.colorize(),
          winston.format.printf(({ timestamp, level, message, context, trace, ...meta }) => {
            const traceInfo = trace ? ` [${trace}]` : '';
            const contextInfo = context ? ` [${context}]` : '';
            const metaInfo = Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : '';
            return `${timestamp} ${level}${contextInfo}${traceInfo}: ${message}${metaInfo}`;
          })
        ),
      })
    );
  }

  // File transport for production
  if (config.enableFile) {
    transports.push(
      new winston.transports.File({
        filename: 'logs/search-error.log',
        level: 'error',
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.errors({ stack: true }),
          winston.format.json()
        ),
      }),
      new winston.transports.File({
        filename: 'logs/search-combined.log',
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.errors({ stack: true }),
          winston.format.json()
        ),
      })
    );
  }

  // Elasticsearch transport for centralized logging
  if (config.enableElasticsearch && config.elasticsearchNode) {
    transports.push(
      new ElasticsearchTransport({
        level: config.level,
        clientOpts: {
          node: config.elasticsearchNode,
        },
        index: config.elasticsearchIndex,
        transformer: (logData) => {
          // Transform log data for Elasticsearch
          const transformed = {
            '@timestamp': new Date().toISOString(),
            level: logData.level,
            message: logData.message,
            service: 'romapi-search',
            environment: process.env.NODE_ENV || 'development',
            ...logData.meta,
          };

          // Remove sensitive fields
          config.sensitiveFields.forEach(field => {
            delete transformed[field];
          });

          return transformed;
        },
      })
    );
  }

  return {
    level: config.level,
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.errors({ stack: true }),
      config.structuredLogging ? winston.format.json() : winston.format.simple()
    ),
    transports,
    exceptionHandlers: [
      new winston.transports.File({ filename: 'logs/search-exceptions.log' })
    ],
    rejectionHandlers: [
      new winston.transports.File({ filename: 'logs/search-rejections.log' })
    ],
  };
}

export const defaultSearchLoggingConfig: SearchLoggingConfig = {
  level: process.env.LOG_LEVEL || 'info',
  enableConsole: process.env.NODE_ENV !== 'production',
  enableFile: true,
  enableElasticsearch: process.env.ELASTICSEARCH_LOGGING_ENABLED === 'true',
  elasticsearchNode: process.env.ELASTICSEARCH_LOGGING_NODE,
  elasticsearchIndex: process.env.ELASTICSEARCH_LOGGING_INDEX || 'romapi-search-logs',
  structuredLogging: true,
  includeTraceId: true,
  sensitiveFields: ['password', 'token', 'apiKey', 'authorization', 'cookie'],
};