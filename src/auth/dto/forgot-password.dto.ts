import { IsEmail, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ForgotPasswordDto {
  @IsEmail()
  @IsNotEmpty()
  @ApiProperty({ 
    description: 'Email address to send password reset link to. If the email exists in the system, a reset link will be sent.',
    example: 'user@example.com',
    format: 'email'
  })
  email: string;
}