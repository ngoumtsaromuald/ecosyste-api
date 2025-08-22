import {
  IsOptional,
  IsString,
  IsNumber,
  IsUUID,
  IsEnum,
  IsDateString,
  IsIP,
  IsObject,
  Min,
  Max,
  Length,
  IsPositive
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { TimePeriod } from '../interfaces/search.interfaces';

// DTO pour logger une recherche
export class LogSearchDto {
  @IsString()
  @Length(1, 500, { message: 'La requête doit contenir entre 1 et 500 caractères' })
  query: string;

  @IsOptional()
  @IsObject()
  filters?: Record<string, any>;

  @IsOptional()
  @IsUUID(4, { message: 'ID utilisateur invalide' })
  userId?: string;

  @IsString()
  sessionId: string;

  @IsOptional()
  @IsString()
  @Length(1, 500, { message: 'User agent invalide' })
  userAgent?: string;

  @IsOptional()
  @IsIP(undefined, { message: 'Adresse IP invalide' })
  ipAddress?: string;

  @IsNumber({}, { message: 'Nombre de résultats invalide' })
  @Min(0, { message: 'Le nombre de résultats doit être positif' })
  @Transform(({ value }) => parseInt(value))
  resultsCount: number;

  @IsNumber({}, { message: 'Durée invalide' })
  @IsPositive({ message: 'La durée doit être positive' })
  @Transform(({ value }) => parseInt(value))
  took: number;
}

// DTO pour logger un clic
export class LogClickDto {
  @IsUUID(4, { message: 'ID de log de recherche invalide' })
  searchLogId: string;

  @IsUUID(4, { message: 'ID de ressource invalide' })
  resourceId: string;

  @IsOptional()
  @IsUUID(4, { message: 'ID utilisateur invalide' })
  userId?: string;

  @IsNumber({}, { message: 'Position invalide' })
  @Min(1, { message: 'La position doit être supérieure à 0' })
  @Max(100, { message: 'Position maximum de 100' })
  @Transform(({ value }) => parseInt(value))
  position: number;
}

// DTO pour les paramètres de métriques
export class SearchMetricsParamsDto {
  @IsEnum(TimePeriod, { message: 'Période invalide' })
  period: TimePeriod;

  @IsOptional()
  @IsDateString({}, { message: 'Date de début invalide' })
  startDate?: string;

  @IsOptional()
  @IsDateString({}, { message: 'Date de fin invalide' })
  endDate?: string;

  @IsOptional()
  @IsUUID(4, { message: 'ID utilisateur invalide' })
  userId?: string;

  @IsOptional()
  @IsNumber({}, { message: 'Limite invalide' })
  @Min(1, { message: 'La limite doit être supérieure à 0' })
  @Max(1000, { message: 'Limite maximum de 1000' })
  @Transform(({ value }) => parseInt(value))
  limit?: number;
}

// DTO pour les termes populaires
export class PopularTermsParamsDto {
  @IsEnum(TimePeriod, { message: 'Période invalide' })
  period: TimePeriod;

  @IsOptional()
  @IsNumber({}, { message: 'Limite invalide' })
  @Min(1, { message: 'La limite doit être supérieure à 0' })
  @Max(100, { message: 'Limite maximum de 100' })
  @Transform(({ value }) => parseInt(value))
  limit?: number;

  @IsOptional()
  @IsNumber({}, { message: 'Nombre minimum d\'occurrences invalide' })
  @Min(1, { message: 'Le nombre minimum doit être supérieur à 0' })
  @Transform(({ value }) => parseInt(value))
  minCount?: number;
}

// DTO pour les requêtes sans résultats
export class NoResultsQueriesParamsDto {
  @IsEnum(TimePeriod, { message: 'Période invalide' })
  period: TimePeriod;

  @IsOptional()
  @IsNumber({}, { message: 'Limite invalide' })
  @Min(1, { message: 'La limite doit être supérieure à 0' })
  @Max(100, { message: 'Limite maximum de 100' })
  @Transform(({ value }) => parseInt(value))
  limit?: number;

  @IsOptional()
  @IsNumber({}, { message: 'Nombre minimum d\'occurrences invalide' })
  @Min(1, { message: 'Le nombre minimum doit être supérieur à 0' })
  @Transform(({ value }) => parseInt(value))
  minCount?: number;
}

// DTO pour créer une recherche sauvegardée
export class CreateSavedSearchDto {
  @IsUUID(4, { message: 'ID utilisateur invalide' })
  userId: string;

  @IsString()
  @Length(1, 100, { message: 'Le nom doit contenir entre 1 et 100 caractères' })
  name: string;

  @IsString()
  @Length(1, 500, { message: 'La requête doit contenir entre 1 et 500 caractères' })
  query: string;

  @IsOptional()
  @IsObject()
  filters?: Record<string, any>;

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  isPublic?: boolean;
}

// DTO pour mettre à jour une recherche sauvegardée
export class UpdateSavedSearchDto {
  @IsOptional()
  @IsString()
  @Length(1, 100, { message: 'Le nom doit contenir entre 1 et 100 caractères' })
  name?: string;

  @IsOptional()
  @IsString()
  @Length(1, 500, { message: 'La requête doit contenir entre 1 et 500 caractères' })
  query?: string;

  @IsOptional()
  @IsObject()
  filters?: Record<string, any>;

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  isPublic?: boolean;
}