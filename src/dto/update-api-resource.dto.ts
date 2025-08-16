import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsBoolean, IsString } from 'class-validator';
import { CreateApiResourceDto } from './create-api-resource.dto';
import { ResourceStatus, ResourcePlan } from '../domain/enums';

export class UpdateApiResourceDto extends PartialType(CreateApiResourceDto) {
  @ApiProperty({ 
    description: 'Resource slug',
    example: 'restaurant-le-palais',
    required: false 
  })
  @IsOptional()
  @IsString()
  slug?: string;
  @ApiProperty({ 
    description: 'Resource status',
    enum: ResourceStatus,
    example: ResourceStatus.ACTIVE,
    required: false 
  })
  @IsOptional()
  @IsEnum(ResourceStatus)
  status?: ResourceStatus;

  @ApiProperty({ 
    description: 'Resource plan',
    enum: ResourcePlan,
    example: ResourcePlan.PREMIUM,
    required: false 
  })
  @IsOptional()
  @IsEnum(ResourcePlan)
  plan?: ResourcePlan;

  @ApiProperty({ 
    description: 'Whether the resource is verified',
    example: true,
    required: false 
  })
  @IsOptional()
  @IsBoolean()
  verified?: boolean;
}