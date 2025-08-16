import { IsString, IsNotEmpty, IsOptional, IsUUID, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCategoryDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  @ApiProperty({ 
    description: 'Category name',
    example: 'Restaurants',
    maxLength: 100
  })
  name: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  @ApiProperty({ 
    description: 'Category description',
    example: 'Food and dining establishments',
    required: false,
    maxLength: 500
  })
  description?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  @ApiProperty({ 
    description: 'Category icon identifier',
    example: 'restaurant',
    required: false,
    maxLength: 50
  })
  icon?: string;

  @IsUUID()
  @IsOptional()
  @ApiProperty({ 
    description: 'Parent category ID for hierarchical structure',
    example: '456e7890-e89b-12d3-a456-426614174000',
    required: false
  })
  parentId?: string;
}