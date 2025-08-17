import { IsString, IsOptional, IsArray, IsNumber, IsDateString, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateApiKeyDto {
  @IsString()
  @IsOptional()
  @ApiProperty({ 
    description: 'Name for the API key',
    example: 'My Updated API Key',
    required: false
  })
  name?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  @ApiProperty({ 
    description: 'List of permissions for this API key',
    example: ['read:resources', 'write:resources'],
    required: false,
    type: [String]
  })
  permissions?: string[];

  @IsNumber()
  @Min(1)
  @Max(100000)
  @IsOptional()
  @ApiProperty({ 
    description: 'Rate limit per hour for this API key',
    example: 1000,
    minimum: 1,
    maximum: 100000,
    required: false
  })
  rateLimit?: number;

  @IsDateString()
  @IsOptional()
  @ApiProperty({ 
    description: 'Expiration date for the API key (ISO string)',
    example: '2024-12-31T23:59:59.000Z',
    required: false
  })
  expiresAt?: string;
}