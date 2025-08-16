import { ApiProperty } from '@nestjs/swagger';
import { IsArray, ValidateNested, IsOptional, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateApiResourceDto } from './create-api-resource.dto';

export class IngestApiResourcesDto {
  @ApiProperty({ 
    description: 'Array of API resources to ingest',
    type: [CreateApiResourceDto],
    example: [
      {
        name: 'Restaurant Le Palais',
        description: 'Authentic Cameroonian cuisine',
        resourceType: 'BUSINESS',
        categoryId: '123e4567-e89b-12d3-a456-426614174000',
        address: {
          addressLine1: '123 Main Street',
          city: 'Yaoundé',
          country: 'CM'
        }
      }
    ]
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateApiResourceDto)
  resources: CreateApiResourceDto[];

  @ApiProperty({ 
    description: 'Whether to skip validation errors and continue with valid resources',
    example: true,
    default: false,
    required: false 
  })
  @IsOptional()
  @IsBoolean()
  skipErrors?: boolean = false;

  @ApiProperty({ 
    description: 'Whether to skip duplicate resources (based on name similarity)',
    example: true,
    default: true,
    required: false 
  })
  @IsOptional()
  @IsBoolean()
  skipDuplicates?: boolean = true;

  @ApiProperty({ 
    description: 'Batch size for processing (max 100)',
    example: 50,
    default: 50,
    required: false 
  })
  @IsOptional()
  batchSize?: number = 50;
}

export class IngestItemResultDto {
  @ApiProperty({ 
    description: 'Index of the resource in the original array',
    example: 0 
  })
  index: number;

  @ApiProperty({ 
    description: 'Original resource name from the request',
    example: 'Restaurant Le Palais' 
  })
  name: string;

  @ApiProperty({ 
    description: 'Processing status',
    enum: ['success', 'failed', 'skipped'],
    example: 'success' 
  })
  status: 'success' | 'failed' | 'skipped';

  @ApiProperty({ 
    description: 'ID of the created resource (if successful)',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false 
  })
  resourceId?: string;

  @ApiProperty({ 
    description: 'Generated slug (if successful)',
    example: 'restaurant-le-palais',
    required: false 
  })
  slug?: string;

  @ApiProperty({ 
    description: 'Error message (if failed)',
    example: 'Validation failed: Category ID is required',
    required: false 
  })
  error?: string;

  @ApiProperty({ 
    description: 'Error type for categorization',
    example: 'validation_error',
    required: false 
  })
  errorType?: string;

  @ApiProperty({ 
    description: 'Reason for skipping (if skipped)',
    example: 'Duplicate resource found with similar name',
    required: false 
  })
  skipReason?: string;

  @ApiProperty({ 
    description: 'Processing time for this item in milliseconds',
    example: 25 
  })
  processingTimeMs: number;
}

export class IngestResultDto {
  @ApiProperty({ 
    description: 'Total number of resources in the request',
    example: 100 
  })
  total: number;

  @ApiProperty({ 
    description: 'Number of resources successfully processed',
    example: 85 
  })
  processed: number;

  @ApiProperty({ 
    description: 'Number of resources that failed validation or processing',
    example: 10 
  })
  failed: number;

  @ApiProperty({ 
    description: 'Number of resources skipped due to duplicates',
    example: 5 
  })
  skipped: number;

  @ApiProperty({ 
    description: 'Processing time in milliseconds',
    example: 2500 
  })
  processingTimeMs: number;

  @ApiProperty({ 
    description: 'Detailed results for each resource',
    type: [IngestItemResultDto] 
  })
  results: IngestItemResultDto[];

  @ApiProperty({ 
    description: 'Summary of errors by type',
    example: {
      'validation_error': 5,
      'duplicate_error': 3,
      'enrichment_error': 2
    }
  })
  errorSummary: Record<string, number>;
}