import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RefreshTokenDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ 
    description: 'JWT refresh token used to obtain a new access token. Refresh tokens are long-lived and can be used multiple times until they expire or are revoked.',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjNlNDU2Ny1lODliLTEyZDMtYTQ1Ni00MjY2MTQxNzQwMDAiLCJ0eXBlIjoicmVmcmVzaCIsImlhdCI6MTcwNTQxNjAwMCwiZXhwIjoxNzA2MDIwODAwfQ.example_refresh_token_signature',
    format: 'jwt'
  })
  refreshToken: string;
}