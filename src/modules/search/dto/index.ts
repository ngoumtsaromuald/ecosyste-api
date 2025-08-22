// Export all search DTOs

export * from './search.dto';
export * from './suggestion.dto';
export * from './analytics.dto';

// Additional common DTOs
import { IsOptional, IsString, IsNumber, Min, Max } from 'class-validator';
import { Transform } from 'class-transformer';

// DTO pour les paramètres de santé
export class HealthCheckParamsDto {
  @IsOptional()
  @IsString()
  component?: string;

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  detailed?: boolean;
}

// DTO pour les paramètres de cache
export class CacheParamsDto {
  @IsString()
  key: string;

  @IsOptional()
  @IsNumber({}, { message: 'TTL invalide' })
  @Min(1, { message: 'TTL doit être supérieur à 0' })
  @Max(86400, { message: 'TTL maximum de 24 heures' })
  @Transform(({ value }) => parseInt(value))
  ttl?: number;
}

// DTO pour les paramètres de rate limiting
export class RateLimitParamsDto {
  @IsString()
  identifier: string;

  @IsOptional()
  @IsNumber({}, { message: 'Fenêtre de temps invalide' })
  @Min(1000, { message: 'Fenêtre minimum de 1 seconde' })
  @Max(3600000, { message: 'Fenêtre maximum de 1 heure' })
  @Transform(({ value }) => parseInt(value))
  windowMs?: number;

  @IsOptional()
  @IsNumber({}, { message: 'Nombre maximum de requêtes invalide' })
  @Min(1, { message: 'Minimum 1 requête autorisée' })
  @Max(10000, { message: 'Maximum 10000 requêtes autorisées' })
  @Transform(({ value }) => parseInt(value))
  maxRequests?: number;
}