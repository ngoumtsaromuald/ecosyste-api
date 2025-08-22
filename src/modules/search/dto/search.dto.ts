import {
  IsOptional,
  IsString,
  IsArray,
  IsEnum,
  IsNumber,
  IsBoolean,
  IsDateString,
  IsUUID,
  Min,
  Max,
  ValidateNested,
  IsLatitude,
  IsLongitude,
  ArrayMaxSize,
  Length,
  IsPositive,
  IsIn
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ResourceType, ResourcePlan } from '@prisma/client';
import { SortField, SortOrder } from '../interfaces/search.interfaces';

// DTO pour les paramètres de recherche
export class SearchParamsDto {
  @IsOptional()
  @IsString()
  @Length(1, 200, { message: 'La requête doit contenir entre 1 et 200 caractères' })
  query?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => SearchFiltersDto)
  filters?: SearchFiltersDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => SortOptionsDto)
  sort?: SortOptionsDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => PaginationParamsDto)
  pagination?: PaginationParamsDto;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(10, { message: 'Maximum 10 facettes autorisées' })
  facets?: string[];

  @IsOptional()
  @IsUUID(4, { message: 'userId doit être un UUID valide' })
  userId?: string;

  @IsOptional()
  @IsString()
  sessionId?: string;
}

// DTO pour les filtres de recherche
export class SearchFiltersDto {
  @IsOptional()
  @IsArray()
  @IsUUID(4, { each: true, message: 'Chaque catégorie doit être un UUID valide' })
  @ArrayMaxSize(20, { message: 'Maximum 20 catégories autorisées' })
  categories?: string[];

  @IsOptional()
  @IsArray()
  @IsEnum(ResourceType, { each: true, message: 'Type de ressource invalide' })
  @ArrayMaxSize(10, { message: 'Maximum 10 types de ressources autorisés' })
  resourceTypes?: ResourceType[];

  @IsOptional()
  @IsArray()
  @IsEnum(ResourcePlan, { each: true, message: 'Plan de ressource invalide' })
  @ArrayMaxSize(5, { message: 'Maximum 5 plans autorisés' })
  plans?: ResourcePlan[];

  @IsOptional()
  @ValidateNested()
  @Type(() => GeoFilterDto)
  location?: GeoFilterDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => PriceRangeDto)
  priceRange?: PriceRangeDto;

  @IsOptional()
  @IsBoolean()
  verified?: boolean;

  @IsOptional()
  @IsString()
  @Length(1, 100, { message: 'Le nom de ville doit contenir entre 1 et 100 caractères' })
  city?: string;

  @IsOptional()
  @IsString()
  @Length(1, 100, { message: 'Le nom de région doit contenir entre 1 et 100 caractères' })
  region?: string;

  @IsOptional()
  @IsString()
  @Length(2, 3, { message: 'Le code pays doit contenir 2 ou 3 caractères' })
  country?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(50, { message: 'Maximum 50 tags autorisés' })
  tags?: string[];

  @IsOptional()
  @ValidateNested()
  @Type(() => DateRangeDto)
  dateRange?: DateRangeDto;
}

// DTO pour le filtre géographique
export class GeoFilterDto {
  @IsLatitude({ message: 'Latitude invalide' })
  latitude: number;

  @IsLongitude({ message: 'Longitude invalide' })
  longitude: number;

  @IsNumber({}, { message: 'Le rayon doit être un nombre' })
  @IsPositive({ message: 'Le rayon doit être positif' })
  @Max(1000, { message: 'Le rayon maximum est de 1000 km' })
  radius: number;

  @IsOptional()
  @IsIn(['km', 'mi'], { message: 'Unité doit être km ou mi' })
  unit?: 'km' | 'mi';
}

// DTO pour la fourchette de prix
export class PriceRangeDto {
  @IsOptional()
  @IsNumber({}, { message: 'Le prix minimum doit être un nombre' })
  @Min(0, { message: 'Le prix minimum doit être positif ou nul' })
  min?: number;

  @IsOptional()
  @IsNumber({}, { message: 'Le prix maximum doit être un nombre' })
  @Min(0, { message: 'Le prix maximum doit être positif ou nul' })
  max?: number;

  @IsOptional()
  @IsString()
  @Length(3, 3, { message: 'La devise doit contenir 3 caractères' })
  currency?: string;
}

// DTO pour la fourchette de dates
export class DateRangeDto {
  @IsOptional()
  @IsDateString({}, { message: 'Date de début invalide' })
  from?: string;

  @IsOptional()
  @IsDateString({}, { message: 'Date de fin invalide' })
  to?: string;
}

// DTO pour les options de tri
export class SortOptionsDto {
  @IsEnum(SortField, { message: 'Champ de tri invalide' })
  field: SortField;

  @IsEnum(SortOrder, { message: 'Ordre de tri invalide' })
  order: SortOrder;
}

// DTO pour les paramètres de pagination
export class PaginationParamsDto {
  @IsOptional()
  @IsNumber({}, { message: 'Le numéro de page doit être un nombre' })
  @Min(1, { message: 'Le numéro de page doit être supérieur à 0' })
  @Max(1000, { message: 'Le numéro de page maximum est 1000' })
  @Transform(({ value }) => parseInt(value))
  page?: number;

  @IsOptional()
  @IsNumber({}, { message: 'La limite doit être un nombre' })
  @Min(1, { message: 'La limite doit être supérieure à 0' })
  @Max(100, { message: 'La limite maximum est 100' })
  @Transform(({ value }) => parseInt(value))
  limit?: number;

  @IsOptional()
  @IsNumber({}, { message: 'L\'offset doit être un nombre' })
  @Min(0, { message: 'L\'offset doit être positif ou nul' })
  @Transform(({ value }) => parseInt(value))
  offset?: number;

  @IsOptional()
  @IsString()
  searchAfter?: string;
}

// Note: SuggestionParamsDto is now defined in suggestion.dto.ts to avoid duplication

// DTO pour la recherche par catégorie
export class SearchByCategoryDto extends SearchParamsDto {
  @IsUUID(4, { message: 'categoryId doit être un UUID valide' })
  categoryId: string;
}

// DTO pour la recherche géographique
export class SearchNearbyDto extends SearchParamsDto {
  @ValidateNested()
  @Type(() => GeoFilterDto)
  location: GeoFilterDto;
}

// DTO pour la recherche personnalisée
export class PersonalizedSearchDto extends SearchParamsDto {
  @IsUUID(4, { message: 'userId doit être un UUID valide' })
  userId: string;
}

// DTO pour la recherche par adresse
export class SearchByAddressDto extends SearchParamsDto {
  @IsString({ message: 'L\'adresse est requise' })
  @Length(3, 200, { message: 'L\'adresse doit contenir entre 3 et 200 caractères' })
  address: string;

  @IsOptional()
  @IsNumber({}, { message: 'Le rayon doit être un nombre' })
  @IsPositive({ message: 'Le rayon doit être positif' })
  @Max(100, { message: 'Le rayon maximum est de 100 km' })
  radius?: number;
}

// DTO pour la recherche près de l'utilisateur
export class SearchNearUserDto extends SearchParamsDto {
  @ValidateNested()
  @Type(() => GeoFilterDto)
  userLocation: GeoFilterDto;

  @IsOptional()
  @IsNumber({}, { message: 'Le rayon doit être un nombre' })
  @IsPositive({ message: 'Le rayon doit être positif' })
  @Max(100, { message: 'Le rayon maximum est de 100 km' })
  radius?: number;
}

// DTO pour la recherche par ville
export class SearchByCityDto extends SearchParamsDto {
  @IsString({ message: 'Le nom de ville est requis' })
  @Length(2, 100, { message: 'Le nom de ville doit contenir entre 2 et 100 caractères' })
  city: string;
}

// DTO pour la recherche par région
export class SearchByRegionDto extends SearchParamsDto {
  @IsString({ message: 'Le nom de région est requis' })
  @Length(2, 100, { message: 'Le nom de région doit contenir entre 2 et 100 caractères' })
  region: string;
}

// DTO pour le log de recherche
export class SearchLogDto {
  @IsString({ message: 'La requête est requise' })
  @Length(1, 500, { message: 'La requête doit contenir entre 1 et 500 caractères' })
  query: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => SearchFiltersDto)
  filters?: SearchFiltersDto;

  @IsOptional()
  @IsUUID(4, { message: 'userId doit être un UUID valide' })
  userId?: string;

  @IsString({ message: 'sessionId est requis' })
  sessionId: string;

  @IsString({ message: 'userAgent est requis' })
  userAgent: string;

  @IsString({ message: 'ipAddress est requis' })
  ipAddress: string;

  @IsNumber({}, { message: 'resultsCount doit être un nombre' })
  @Min(0, { message: 'resultsCount doit être positif ou nul' })
  resultsCount: number;

  @IsNumber({}, { message: 'took doit être un nombre' })
  @Min(0, { message: 'took doit être positif ou nul' })
  took: number;
}

// DTO pour le clic de recherche
export class SearchClickDto {
  @IsUUID(4, { message: 'searchLogId doit être un UUID valide' })
  searchLogId: string;

  @IsUUID(4, { message: 'resourceId doit être un UUID valide' })
  resourceId: string;

  @IsOptional()
  @IsUUID(4, { message: 'userId doit être un UUID valide' })
  userId?: string;

  @IsNumber({}, { message: 'position doit être un nombre' })
  @Min(1, { message: 'position doit être supérieure à 0' })
  @Max(1000, { message: 'position maximum est 1000' })
  position: number;
}

// DTO pour la recherche sauvegardée
export class SavedSearchDto {
  @IsString({ message: 'Le nom est requis' })
  @Length(1, 100, { message: 'Le nom doit contenir entre 1 et 100 caractères' })
  name: string;

  @IsString({ message: 'La requête est requise' })
  @Length(1, 500, { message: 'La requête doit contenir entre 1 et 500 caractères' })
  query: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => SearchFiltersDto)
  filters?: SearchFiltersDto;

  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;
}