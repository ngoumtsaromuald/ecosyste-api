import { IsEmail, IsString, IsNotEmpty, IsEnum, IsOptional, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserType } from '@prisma/client';

export class RegisterDto {
  @IsEmail()
  @IsNotEmpty()
  @ApiProperty({ 
    description: 'User email address',
    example: 'user@example.com'
  })
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @ApiProperty({ 
    description: 'User password (minimum 8 characters)',
    example: 'SecurePass123!'
  })
  password: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ 
    description: 'User full name',
    example: 'John Doe'
  })
  name: string;

  @IsEnum(UserType)
  @IsOptional()
  @ApiProperty({ 
    enum: UserType,
    description: 'Type of user account',
    example: UserType.INDIVIDUAL,
    default: UserType.INDIVIDUAL
  })
  userType?: UserType = UserType.INDIVIDUAL;
}