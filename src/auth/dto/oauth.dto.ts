import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString, IsUrl, IsOptional } from 'class-validator';
import { OAuthProvider } from '@prisma/client';

export class OAuthInitiateDto {
  @ApiProperty({
    description: 'OAuth provider',
    enum: OAuthProvider,
    example: OAuthProvider.GOOGLE,
  })
  @IsEnum(OAuthProvider)
  provider: OAuthProvider;

  @ApiProperty({
    description: 'Redirect URI after OAuth completion',
    example: 'https://app.romapi.com/auth/callback',
  })
  @IsUrl()
  redirectUri: string;
}

export class OAuthCallbackDto {
  @ApiProperty({
    description: 'Authorization code from OAuth provider',
    example: 'abc123def456',
  })
  @IsString()
  code: string;

  @ApiProperty({
    description: 'State parameter for CSRF protection',
    example: 'xyz789',
  })
  @IsString()
  state: string;
}

export class OAuthLinkDto {
  @ApiProperty({
    description: 'OAuth provider to link',
    enum: OAuthProvider,
    example: OAuthProvider.GITHUB,
  })
  @IsEnum(OAuthProvider)
  provider: OAuthProvider;

  @ApiProperty({
    description: 'Authorization code from OAuth provider',
    example: 'abc123def456',
  })
  @IsString()
  code: string;

  @ApiProperty({
    description: 'State parameter for CSRF protection',
    example: 'xyz789',
  })
  @IsString()
  state: string;
}

export class OAuthInitiateResponseDto {
  @ApiProperty({
    description: 'OAuth authorization URL',
    example: 'https://accounts.google.com/o/oauth2/v2/auth?client_id=...',
  })
  authUrl: string;

  @ApiProperty({
    description: 'State parameter for CSRF protection',
    example: 'xyz789',
  })
  state: string;
}

export class OAuthAccountResponseDto {
  @ApiProperty({
    description: 'OAuth account ID',
    example: 'uuid-here',
  })
  id: string;

  @ApiProperty({
    description: 'OAuth provider',
    enum: OAuthProvider,
    example: OAuthProvider.GOOGLE,
  })
  provider: OAuthProvider;

  @ApiProperty({
    description: 'Provider user ID',
    example: '123456789',
  })
  providerId: string;

  @ApiProperty({
    description: 'Account creation date',
    example: '2024-01-01T00:00:00Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Account last update date',
    example: '2024-01-01T00:00:00Z',
  })
  updatedAt: Date;
}

export interface OAuthUserInfo {
  id: string;
  email: string;
  name: string;
  picture?: string;
}

export interface OAuthTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  token_type: string;
}

export interface OAuthProviderConfig {
  clientId: string;
  clientSecret: string;
  authUrl: string;
  tokenUrl: string;
  userInfoUrl: string;
  scopes: string[];
}

export interface OAuthState {
  provider: OAuthProvider;
  redirectUri: string;
  userId?: string; // For linking existing accounts
}