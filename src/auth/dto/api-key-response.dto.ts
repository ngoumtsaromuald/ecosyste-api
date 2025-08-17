import { ApiProperty } from '@nestjs/swagger';

export class ApiKeyResponseDto {
  @ApiProperty({ 
    description: 'API key ID',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  id: string;

  @ApiProperty({ 
    description: 'API key name',
    example: 'My App API Key'
  })
  name: string;

  @ApiProperty({ 
    description: 'API key prefix (first 8 characters)',
    example: 'rk_abc123'
  })
  keyPrefix: string;

  @ApiProperty({ 
    description: 'Full API key value (only shown once during creation)',
    example: 'rk_abc123def456ghi789jkl012mno345pqr678stu901vwx234yz567',
    required: false
  })
  keyValue?: string;

  @ApiProperty({ 
    description: 'List of permissions for this API key',
    example: ['read:resources', 'write:resources'],
    type: [String]
  })
  permissions: string[];

  @ApiProperty({ 
    description: 'Rate limit per hour for this API key',
    example: 1000
  })
  rateLimit: number;

  @ApiProperty({ 
    description: 'Whether the API key is active',
    example: true
  })
  isActive: boolean;

  @ApiProperty({ 
    description: 'Last time the API key was used',
    example: '2024-01-15T10:30:00.000Z',
    required: false
  })
  lastUsedAt?: Date;

  @ApiProperty({ 
    description: 'API key expiration date',
    example: '2024-12-31T23:59:59.000Z',
    required: false
  })
  expiresAt?: Date;

  @ApiProperty({ 
    description: 'API key creation date',
    example: '2024-01-01T00:00:00.000Z'
  })
  createdAt: Date;
}

export class ApiKeyListResponseDto {
  @ApiProperty({ 
    description: 'API key ID',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  id: string;

  @ApiProperty({ 
    description: 'API key name',
    example: 'My App API Key'
  })
  name: string;

  @ApiProperty({ 
    description: 'API key prefix (first 8 characters)',
    example: 'rk_abc123'
  })
  keyPrefix: string;

  @ApiProperty({ 
    description: 'List of permissions for this API key',
    example: ['read:resources', 'write:resources'],
    type: [String]
  })
  permissions: string[];

  @ApiProperty({ 
    description: 'Rate limit per hour for this API key',
    example: 1000
  })
  rateLimit: number;

  @ApiProperty({ 
    description: 'Whether the API key is active',
    example: true
  })
  isActive: boolean;

  @ApiProperty({ 
    description: 'Last time the API key was used',
    example: '2024-01-15T10:30:00.000Z',
    required: false
  })
  lastUsedAt?: Date;

  @ApiProperty({ 
    description: 'API key expiration date',
    example: '2024-12-31T23:59:59.000Z',
    required: false
  })
  expiresAt?: Date;

  @ApiProperty({ 
    description: 'API key creation date',
    example: '2024-01-01T00:00:00.000Z'
  })
  createdAt: Date;
}

export class ApiKeyValidationResult {
  @ApiProperty({ 
    description: 'The validated API key',
  })
  apiKey: {
    id: string;
    name: string;
    permissions: string[];
    rateLimit: number;
    userId: string;
  };

  @ApiProperty({ 
    description: 'The user who owns this API key',
  })
  user: {
    id: string;
    email: string;
    name: string;
    userType: string;
    plan: string;
  };

  @ApiProperty({ 
    description: 'Remaining rate limit for this period',
    example: 950
  })
  rateLimitRemaining: number;

  @ApiProperty({ 
    description: 'When the rate limit resets',
    example: '2024-01-15T11:00:00.000Z'
  })
  rateLimitReset: Date;
}