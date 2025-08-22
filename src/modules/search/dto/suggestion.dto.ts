import {
  IsOptional,
  IsString,
  IsNumber,
  IsArray,
  IsEnum,
  IsUUID,
  IsBoolean,
  Min,
  Max,
  Length,
  ArrayMaxSize
} from 'class-validator';
import { Transform } from 'class-transformer';
import { SuggestionType } from '../types/suggestion.types';

// DTO pour les paramètres de suggestion
export class SuggestionParamsDto {
  @IsString()
  @Length(2, 100, { message: 'La requête doit contenir entre 2 et 100 caractères' })
  query: string;

  @IsOptional()
  @IsNumber({}, { message: 'Limite invalide' })
  @Min(1, { message: 'La limite doit être supérieure à 0' })
  @Max(20, { message: 'Limite maximum de 20 suggestions' })
  @Transform(({ value }) => parseInt(value))
  limit?: number;

  @IsOptional()
  @IsArray()
  @IsEnum(SuggestionType, { each: true, message: 'Type de suggestion invalide' })
  @ArrayMaxSize(5, { message: 'Maximum 5 types de suggestions autorisés' })
  types?: SuggestionType[];

  @IsOptional()
  @IsUUID(4, { message: 'ID utilisateur invalide' })
  userId?: string;

  @IsOptional()
  @IsBoolean()
  includePopular?: boolean;

  @IsOptional()
  @IsBoolean()
  includeRecent?: boolean;
}

// DTO pour créer une suggestion
export class CreateSuggestionDto {
  @IsString()
  @Length(1, 200, { message: 'Le texte doit contenir entre 1 et 200 caractères' })
  text: string;

  @IsEnum(SuggestionType, { message: 'Type de suggestion invalide' })
  type: SuggestionType;

  @IsNumber({}, { message: 'Score invalide' })
  @Min(0, { message: 'Le score doit être positif' })
  @Max(100, { message: 'Score maximum de 100' })
  score: number;

  @IsOptional()
  @IsString()
  @Length(1, 100, { message: 'Catégorie invalide' })
  category?: string;

  @IsOptional()
  @IsString()
  @Length(1, 50, { message: 'Type de ressource invalide' })
  resourceType?: string;
}

// DTO pour l'événement de suggestion
export class SuggestionEventDto {
  @IsString()
  @Length(1, 200, { message: 'Texte de suggestion invalide' })
  suggestionText: string;

  @IsEnum(SuggestionType, { message: 'Type de suggestion invalide' })
  suggestionType: SuggestionType;

  @IsString()
  @Length(1, 200, { message: 'Requête invalide' })
  query: string;

  @IsOptional()
  @IsUUID(4, { message: 'ID utilisateur invalide' })
  userId?: string;

  @IsString()
  sessionId: string;
}