import { ApiProperty } from '@nestjs/swagger';
import { UserType, Plan } from '@prisma/client';

export class UserResponseDto {
  @ApiProperty({ 
    description: 'User ID',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  id: string;

  @ApiProperty({ 
    description: 'User email address',
    example: 'user@example.com'
  })
  email: string;

  @ApiProperty({ 
    description: 'User full name',
    example: 'John Doe'
  })
  name: string;

  @ApiProperty({ 
    enum: UserType,
    description: 'Type of user account',
    example: UserType.INDIVIDUAL
  })
  userType: UserType;

  @ApiProperty({ 
    enum: Plan,
    description: 'User subscription plan',
    example: Plan.FREE
  })
  plan: Plan;

  @ApiProperty({ 
    description: 'Whether email is verified',
    example: true
  })
  emailVerified: boolean;

  @ApiProperty({ 
    description: 'Account creation date',
    example: '2024-01-01T00:00:00.000Z'
  })
  createdAt: Date;
}

export class TokenResponseDto {
  @ApiProperty({ 
    description: 'JWT access token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
  })
  accessToken: string;

  @ApiProperty({ 
    description: 'JWT refresh token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
  })
  refreshToken: string;

  @ApiProperty({ 
    description: 'Token expiration time in seconds',
    example: 900
  })
  expiresIn: number;
}

export class AuthResponseDto extends TokenResponseDto {
  @ApiProperty({ 
    description: 'User information',
    type: UserResponseDto
  })
  user: UserResponseDto;
}