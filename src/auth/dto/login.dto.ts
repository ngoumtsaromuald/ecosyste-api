import { IsEmail, IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @IsEmail()
  @IsNotEmpty()
  @ApiProperty({ 
    description: 'User email address',
    example: 'user@example.com'
  })
  email: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ 
    description: 'User password',
    example: 'SecurePass123!'
  })
  password: string;
}