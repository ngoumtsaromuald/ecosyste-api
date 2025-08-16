import { ApiProperty } from '@nestjs/swagger';
import { 
  IsString, 
  IsNotEmpty, 
  IsOptional, 
  IsEnum, 
  IsUUID, 
  ValidateNested, 
  Length,
  IsArray
} from 'class-validator';
import { Type } from 'class-transformer';
import { ResourceType } from '../domain/enums';
import { AddressDto } from './address.dto';
import { ContactDto } from './contact.dto';
import { SeoDataDto } from './seo-data.dto';
import { BusinessHourDto } from './business-hour.dto';
import { CreateResourceImageDto } from './resource-image.dto';

export class CreateApiResourceDto {
  @ApiProperty({ 
    description: 'Resource name - must be unique and descriptive',
    example: 'Restaurant Le Palais',
    minLength: 1,
    maxLength: 255
  })
  @IsString()
  @IsNotEmpty()
  @Length(1, 255)
  name: string;

  @ApiProperty({ 
    description: 'Detailed description of the resource - supports markdown formatting',
    example: 'Authentic Cameroonian cuisine in the heart of Yaoundé. We offer traditional dishes prepared with fresh local ingredients, creating an unforgettable dining experience.',
    required: false,
    minLength: 1,
    maxLength: 2000
  })
  @IsOptional()
  @IsString()
  @Length(1, 2000)
  description?: string;

  @ApiProperty({ 
    description: 'Type of resource',
    enum: ResourceType,
    example: ResourceType.BUSINESS 
  })
  @IsEnum(ResourceType)
  resourceType: ResourceType;

  @ApiProperty({ 
    description: 'Category ID',
    example: '123e4567-e89b-12d3-a456-426614174000' 
  })
  @IsUUID(4, { message: 'Category ID must be a valid UUID' })
  categoryId: string;

  @ApiProperty({ 
    description: 'Address information',
    type: AddressDto,
    required: false 
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => AddressDto)
  address?: AddressDto;

  @ApiProperty({ 
    description: 'Contact information',
    type: ContactDto,
    required: false 
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => ContactDto)
  contact?: ContactDto;

  @ApiProperty({ 
    description: 'SEO metadata',
    type: SeoDataDto,
    required: false 
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => SeoDataDto)
  seo?: SeoDataDto;

  @ApiProperty({ 
    description: 'Business hours',
    type: [BusinessHourDto],
    required: false 
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BusinessHourDto)
  businessHours?: BusinessHourDto[];

  @ApiProperty({ 
    description: 'Resource images',
    type: [CreateResourceImageDto],
    required: false 
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateResourceImageDto)
  images?: CreateResourceImageDto[];
}