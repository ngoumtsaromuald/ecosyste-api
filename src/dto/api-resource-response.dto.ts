import { ApiProperty } from '@nestjs/swagger';
import { ResourceType, ResourceStatus, ResourcePlan } from '../domain/enums';
import { AddressDto } from './address.dto';
import { ContactDto } from './contact.dto';
import { SeoDataDto } from './seo-data.dto';
import { BusinessHourDto } from './business-hour.dto';
import { ResourceImageDto } from './resource-image.dto';
import { CategoryResponseDto } from './category-response.dto';

export class ApiResourceResponseDto {
  @ApiProperty({ 
    description: 'Resource ID',
    example: '123e4567-e89b-12d3-a456-426614174000' 
  })
  id: string;

  @ApiProperty({ 
    description: 'User ID who owns this resource',
    example: '456e7890-e89b-12d3-a456-426614174000' 
  })
  userId: string;

  @ApiProperty({ 
    description: 'Resource name',
    example: 'Restaurant Le Palais' 
  })
  name: string;

  @ApiProperty({ 
    description: 'Resource slug',
    example: 'restaurant-le-palais' 
  })
  slug: string;

  @ApiProperty({ 
    description: 'Resource description',
    example: 'Authentic Cameroonian cuisine in the heart of Yaoundé',
    required: false 
  })
  description?: string;

  @ApiProperty({ 
    description: 'Type of resource',
    enum: ResourceType,
    example: ResourceType.BUSINESS 
  })
  resourceType: ResourceType;

  @ApiProperty({ 
    description: 'Category ID',
    example: '123e4567-e89b-12d3-a456-426614174000' 
  })
  categoryId: string;

  @ApiProperty({ 
    description: 'Category information',
    type: CategoryResponseDto 
  })
  category: CategoryResponseDto;

  @ApiProperty({ 
    description: 'Address information',
    type: AddressDto,
    required: false 
  })
  address?: AddressDto;

  @ApiProperty({ 
    description: 'Contact information',
    type: ContactDto,
    required: false 
  })
  contact?: ContactDto;

  @ApiProperty({ 
    description: 'Resource status',
    enum: ResourceStatus,
    example: ResourceStatus.ACTIVE 
  })
  status: ResourceStatus;

  @ApiProperty({ 
    description: 'Resource plan',
    enum: ResourcePlan,
    example: ResourcePlan.FREE 
  })
  plan: ResourcePlan;

  @ApiProperty({ 
    description: 'Whether the resource is verified',
    example: false 
  })
  verified: boolean;

  @ApiProperty({ 
    description: 'SEO metadata',
    type: SeoDataDto,
    required: false 
  })
  seo?: SeoDataDto;

  @ApiProperty({ 
    description: 'Business hours',
    type: [BusinessHourDto] 
  })
  businessHours: BusinessHourDto[];

  @ApiProperty({ 
    description: 'Resource images',
    type: [ResourceImageDto] 
  })
  images: ResourceImageDto[];

  @ApiProperty({ 
    description: 'Creation timestamp',
    example: '2024-01-15T10:30:00Z' 
  })
  createdAt: Date;

  @ApiProperty({ 
    description: 'Last update timestamp',
    example: '2024-01-15T10:30:00Z' 
  })
  updatedAt: Date;

  @ApiProperty({ 
    description: 'Publication timestamp',
    example: '2024-01-15T10:30:00Z',
    required: false 
  })
  publishedAt?: Date;
}