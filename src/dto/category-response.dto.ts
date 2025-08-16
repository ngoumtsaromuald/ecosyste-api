import { ApiProperty } from '@nestjs/swagger';

export class CategoryResponseDto {
  @ApiProperty({ 
    description: 'Category ID',
    example: '123e4567-e89b-12d3-a456-426614174000' 
  })
  id: string;

  @ApiProperty({ 
    description: 'Category name',
    example: 'Restaurants' 
  })
  name: string;

  @ApiProperty({ 
    description: 'Category slug',
    example: 'restaurants' 
  })
  slug: string;

  @ApiProperty({ 
    description: 'Category description',
    example: 'Food and dining establishments',
    required: false 
  })
  description?: string;

  @ApiProperty({ 
    description: 'Category icon',
    example: 'restaurant',
    required: false 
  })
  icon?: string;

  @ApiProperty({ 
    description: 'Parent category ID',
    example: '456e7890-e89b-12d3-a456-426614174000',
    required: false 
  })
  parentId?: string;

  @ApiProperty({ 
    description: 'Creation timestamp',
    example: '2024-01-15T10:30:00Z' 
  })
  createdAt: Date;
}