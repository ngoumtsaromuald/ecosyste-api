import { IsString, IsNotEmpty, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ 
    description: 'Password reset token received via email. This token is single-use and expires after 1 hour.',
    example: 'abc123def456ghi789jkl012mno345pqr678',
    minLength: 32,
    maxLength: 64
  })
  token: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @ApiProperty({ 
    description: 'New password (minimum 8 characters). Must contain at least one uppercase letter, one lowercase letter, one number, and one special character.',
    example: 'NewSecurePass123!',
    minLength: 8,
    pattern: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]'
  })
  newPassword: string;
}