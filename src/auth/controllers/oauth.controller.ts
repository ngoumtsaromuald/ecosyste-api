import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Request } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { OAuthService } from '../services/oauth.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { OAuthProvider } from '@prisma/client';
import {
  OAuthInitiateResponseDto,
  OAuthCallbackDto,
  OAuthLinkDto,
  OAuthAccountResponseDto,
} from '../dto/oauth.dto';
import { AuthResponseDto } from '../dto/auth-response.dto';

interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    email: string;
    userType: string;
    plan: string;
  };
  token?: string;
}

@ApiTags('OAuth')
@Controller('oauth')
export class OAuthController {
  constructor(private readonly oauthService: OAuthService) { }

  @Get(':provider/initiate')
  @ApiOperation({
    summary: 'Initiate OAuth flow',
    description: 'Start OAuth authentication flow with the specified provider'
  })
  @ApiParam({
    name: 'provider',
    enum: OAuthProvider,
    description: 'OAuth provider (google, github, linkedin)',
  })
  @ApiQuery({
    name: 'redirectUri',
    description: 'URI to redirect to after OAuth completion',
    example: 'https://app.romapi.com/auth/callback',
  })
  @ApiResponse({
    status: 200,
    description: 'OAuth initiation successful',
    type: OAuthInitiateResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid provider or missing redirect URI',
  })
  async initiateOAuth(
    @Param('provider') provider: OAuthProvider,
    @Query('redirectUri') redirectUri: string,
  ): Promise<OAuthInitiateResponseDto> {
    return this.oauthService.initiateOAuth(provider, redirectUri);
  }

  @Get(':provider/callback')
  @ApiOperation({
    summary: 'Handle OAuth callback',
    description: 'Handle OAuth provider callback and complete authentication'
  })
  @ApiParam({
    name: 'provider',
    enum: OAuthProvider,
    description: 'OAuth provider (google, github, linkedin)',
  })
  @ApiQuery({
    name: 'code',
    description: 'Authorization code from OAuth provider',
  })
  @ApiQuery({
    name: 'state',
    description: 'State parameter for CSRF protection',
  })
  @ApiResponse({
    status: 200,
    description: 'OAuth authentication successful',
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid authorization code or state',
  })
  async handleOAuthCallback(
    @Param('provider') provider: OAuthProvider,
    @Query('code') code: string,
    @Query('state') state: string,
  ): Promise<AuthResponseDto> {
    return this.oauthService.handleOAuthCallback(provider, code, state);
  }

  @Post('link')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Link OAuth account',
    description: 'Link an OAuth account to the current authenticated user'
  })
  @ApiResponse({
    status: 201,
    description: 'OAuth account linked successfully',
    type: OAuthAccountResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'User not authenticated',
  })
  @ApiResponse({
    status: 409,
    description: 'OAuth account already linked',
  })
  @HttpCode(HttpStatus.CREATED)
  async linkOAuthAccount(
    @Body() linkDto: OAuthLinkDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<OAuthAccountResponseDto> {
    return this.oauthService.linkOAuthAccount(
      req.user.id,
      linkDto.provider,
      linkDto.code,
      linkDto.state,
    );
  }

  @Get('accounts')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get user OAuth accounts',
    description: 'Get all OAuth accounts linked to the current user'
  })
  @ApiResponse({
    status: 200,
    description: 'OAuth accounts retrieved successfully',
    type: [OAuthAccountResponseDto],
  })
  @ApiResponse({
    status: 401,
    description: 'User not authenticated',
  })
  async getUserOAuthAccounts(
    @Req() req: AuthenticatedRequest,
  ): Promise<OAuthAccountResponseDto[]> {
    return this.oauthService.getUserOAuthAccounts(req.user.id);
  }

  @Delete(':provider')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Unlink OAuth account',
    description: 'Unlink an OAuth account from the current user'
  })
  @ApiParam({
    name: 'provider',
    enum: OAuthProvider,
    description: 'OAuth provider to unlink (google, github, linkedin)',
  })
  @ApiResponse({
    status: 204,
    description: 'OAuth account unlinked successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Cannot unlink the only authentication method',
  })
  @ApiResponse({
    status: 401,
    description: 'User not authenticated',
  })
  @ApiResponse({
    status: 404,
    description: 'OAuth account not found',
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  async unlinkOAuthAccount(
    @Param('provider') provider: OAuthProvider,
    @Req() req: AuthenticatedRequest,
  ): Promise<void> {
    return this.oauthService.unlinkOAuthAccount(req.user.id, provider);
  }

  @Post(':provider/initiate-link')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Initiate OAuth linking flow',
    description: 'Start OAuth flow to link an account to the current authenticated user'
  })
  @ApiParam({
    name: 'provider',
    enum: OAuthProvider,
    description: 'OAuth provider (google, github, linkedin)',
  })
  @ApiQuery({
    name: 'redirectUri',
    description: 'URI to redirect to after OAuth completion',
    example: 'https://app.romapi.com/settings/accounts',
  })
  @ApiResponse({
    status: 200,
    description: 'OAuth linking initiation successful',
    type: OAuthInitiateResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid provider or missing redirect URI',
  })
  @ApiResponse({
    status: 401,
    description: 'User not authenticated',
  })
  async initiateOAuthLinking(
    @Param('provider') provider: OAuthProvider,
    @Query('redirectUri') redirectUri: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<OAuthInitiateResponseDto> {
    return this.oauthService.initiateOAuth(provider, redirectUri, req.user.id);
  }

  @Post('accounts/:accountId/refresh')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Refresh OAuth tokens',
    description: 'Refresh OAuth access tokens for a specific account'
  })
  @ApiParam({
    name: 'accountId',
    description: 'OAuth account ID',
  })
  @ApiResponse({
    status: 204,
    description: 'OAuth tokens refreshed successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'OAuth account not found or no refresh token available',
  })
  @ApiResponse({
    status: 401,
    description: 'User not authenticated or failed to refresh token',
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  async refreshOAuthTokens(
    @Param('accountId') accountId: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<void> {
    // First verify the account belongs to the user
    const userAccounts = await this.oauthService.getUserOAuthAccounts(req.user.id);
    const account = userAccounts.find(acc => acc.id === accountId);

    if (!account) {
      throw new Error('OAuth account not found or does not belong to user');
    }

    return this.oauthService.refreshOAuthTokens(accountId);
  }
}