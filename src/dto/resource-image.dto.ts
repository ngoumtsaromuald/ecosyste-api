import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean, IsInt, IsUrl, Length, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class ResourceImageDto {
  @ApiProperty({ 
    description: 'Image ID',
    example: '123e4567-e89b-12d3-a456-426614174000' 
  })
  @IsString()
  id: string;

  @ApiProperty({ 
    description: 'Image URL',
    example: 'https://example.com/images/restaurant.jpg' 
  })
  @IsUrl({}, { message: 'URL must be a valid URL' })
  url: string;

  @ApiProperty({ 
    description: 'Alternative text for accessibility',
    example: 'Restaurant interior with modern decor',
    required: false 
  })
  @IsOptional()
  @IsString()
  @Length(1, 255)
  altText?: string;

  @ApiProperty({ 
    description: 'Whether this is the primary image',
    example: true,
    default: false 
  })
  @IsBoolean()
  isPrimary: boolean = false;

  @ApiProperty({ 
    description: 'Display order index',
    example: 0,
    default: 0 
  })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  orderIndex: number = 0;

  @ApiProperty({ 
    description: 'Creation timestamp',
    example: '2024-01-15T10:30:00Z' 
  })
  createdAt: Date;
}

export class CreateResourceImageDto {
  @ApiProperty({ 
    description: 'Image URL',
    example: 'https://example.com/images/restaurant.jpg' 
  })
  @IsUrl({}, { message: 'URL must be a valid URL' })
  url: string;

  @ApiProperty({ 
    description: 'Alternative text for accessibility',
    example: 'Restaurant interior with modern decor',
    required: false 
  })
  @IsOptional()
  @IsString()
  @Length(1, 255)
  altText?: string;

  @ApiProperty({ 
    description: 'Whether this is the primary image',
    example: true,
    default: false 
  })
  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean = false;

  @ApiProperty({ 
    description: 'Display order index',
    example: 0,
    default: 0 
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  orderIndex?: number = 0;
}