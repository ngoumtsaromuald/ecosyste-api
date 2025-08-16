import { ApiProperty } from '@nestjs/swagger';
import { 
  IsOptional, 
  IsEnum, 
  IsString, 
  IsInt, 
  IsUUID, 
  IsBoolean,
  Min, 
  Max,
  IsLatitude,
  IsLongitude
} from 'class-validator';
import { Type } from 'class-transformer';
import { ResourceType, ResourceStatus, ResourcePlan } from '../domain/enums';

export class FindApiResourcesDto {
  @ApiProperty({ 
    description: 'Search query for name and description',
    example: 'restaurant',
    required: false 
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({ 
    description: 'Filter by resource type',
    enum: ResourceType,
    required: false 
  })
  @IsOptional()
  @IsEnum(ResourceType)
  resourceType?: ResourceType;

  @ApiProperty({ 
    description: 'Filter by resource status',
    enum: ResourceStatus,
    required: false 
  })
  @IsOptional()
  @IsEnum(ResourceStatus)
  status?: ResourceStatus;

  @ApiProperty({ 
    description: 'Filter by resource plan',
    enum: ResourcePlan,
    required: false 
  })
  @IsOptional()
  @IsEnum(ResourcePlan)
  plan?: ResourcePlan;

  @ApiProperty({ 
    description: 'Filter by category ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false 
  })
  @IsOptional()
  @IsUUID(4)
  categoryId?: string;

  @ApiProperty({ 
    description: 'Filter by city',
    example: 'Yaoundé',
    required: false 
  })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiProperty({ 
    description: 'Filter by region',
    example: 'Centre',
    required: false 
  })
  @IsOptional()
  @IsString()
  region?: string;

  @ApiProperty({ 
    description: 'Filter by country',
    example: 'CM',
    required: false 
  })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiProperty({ 
    description: 'Filter by verified status',
    example: true,
    required: false 
  })
  @IsOptional()
  @IsBoolean()
  verified?: boolean;

  @ApiProperty({ 
    description: 'Latitude for location-based search',
    example: 3.848,
    required: false 
  })
  @IsOptional()
  @Type(() => Number)
  @IsLatitude()
  latitude?: number;

  @ApiProperty({ 
    description: 'Longitude for location-based search',
    example: 11.502,
    required: false 
  })
  @IsOptional()
  @Type(() => Number)
  @IsLongitude()
  longitude?: number;

  @ApiProperty({ 
    description: 'Radius in kilometers for location-based search',
    example: 10,
    minimum: 1,
    maximum: 100,
    required: false 
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  radius?: number;

  @ApiProperty({ 
    description: 'Number of items per page',
    example: 20,
    minimum: 1,
    maximum: 100,
    default: 20 
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiProperty({ 
    description: 'Number of items to skip',
    example: 0,
    minimum: 0,
    default: 0 
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number = 0;

  @ApiProperty({ 
    description: 'Sort field',
    example: 'createdAt',
    enum: ['name', 'createdAt', 'updatedAt', 'publishedAt'],
    required: false 
  })
  @IsOptional()
  @IsString()
  sortBy?: 'name' | 'createdAt' | 'updatedAt' | 'publishedAt';

  @ApiProperty({ 
    description: 'Sort order',
    example: 'desc',
    enum: ['asc', 'desc'],
    default: 'desc' 
  })
  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc' = 'desc';
}