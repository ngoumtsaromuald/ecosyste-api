import { Injectable, UnauthorizedException, BadRequestException, ConflictException, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OAuthRepository } from '../../repositories/oauth.repository';
import { UserRepository } from '../../repositories/user.repository';
import { JWTService } from './jwt.service';
import { AuditService } from './audit.service';
import { SessionService } from './session.service';
import { OAuthProvider, UserType } from '@prisma/client';
import { 
  OAuthInitiateResponseDto, 
  OAuthUserInfo, 
  OAuthTokenResponse, 
  OAuthProviderConfig, 
  OAuthState,
  OAuthAccountResponseDto 
} from '../dto/oauth.dto';
import { AuthResponseDto } from '../dto/auth-response.dto';
import * as crypto from 'crypto';
import axios from 'axios';
import { Redis } from 'ioredis';

@Injectable()
export class OAuthService {
  constructor(
    private readonly oauthRepository: OAuthRepository,
    private readonly userRepository: UserRepository,
    private readonly jwtService: JWTService,
    private readonly auditService: AuditService,
    private readonly sessionService: SessionService,
    private readonly configService: ConfigService,
    @Inject('REDIS_CLIENT') private readonly redis: Redis,
  ) {}

  async initiateOAuth(provider: OAuthProvider, redirectUri: string, userId?: string): Promise<OAuthInitiateResponseDto> {
    const config = this.getProviderConfig(provider);
    const state = this.generateSecureState();
    
    // Store state in Redis with expiration (10 minutes)
    const stateData: OAuthState = { provider, redirectUri, userId };
    await this.redis.setex(`oauth_state:${state}`, 600, JSON.stringify(stateData));

    const authUrl = this.buildAuthUrl(config, state, redirectUri);

    return {
      authUrl,
      state,
    };
  }

  async handleOAuthCallback(
    provider: OAuthProvider,
    code: string,
    state: string
  ): Promise<AuthResponseDto> {
    // Validate state
    const storedState = await this.validateOAuthState(state);
    if (!storedState || storedState.provider !== provider) {
      throw new UnauthorizedException('Invalid OAuth state');
    }

    // Exchange code for access token
    const providerConfig = this.getProviderConfig(provider);
    const tokenResponse = await this.exchangeCodeForToken(providerConfig, code, storedState.redirectUri);
    
    // Get user info from provider
    const userInfo = await this.getUserInfoFromProvider(provider, tokenResponse.access_token);
    
    // Find or create user
    let user = await this.userRepository.findByEmail(userInfo.email);
    
    if (!user) {
      // Create new user from OAuth info
      user = await this.userRepository.create({
        email: userInfo.email,
        passwordHash: null, // OAuth users don't have passwords initially
        name: userInfo.name,
        userType: UserType.INDIVIDUAL,
        emailVerified: true, // OAuth providers verify emails
        emailVerifiedAt: new Date(),
      });

      // Create OAuth account
      await this.oauthRepository.create({
        userId: user.id,
        provider,
        providerId: userInfo.id,
        accessToken: tokenResponse.access_token,
        refreshToken: tokenResponse.refresh_token,
        expiresAt: tokenResponse.expires_in 
          ? new Date(Date.now() + tokenResponse.expires_in * 1000) 
          : undefined,
      });

      await this.auditService.logUserRegistration(user.id, user.email, 'oauth');
    } else {
      // Check if OAuth account already exists
      const existingOAuth = await this.oauthRepository.findByUserIdAndProvider(user.id, provider);
      
      if (existingOAuth) {
        // Update existing OAuth account tokens
        await this.oauthRepository.updateTokens(existingOAuth.id, {
          accessToken: tokenResponse.access_token,
          refreshToken: tokenResponse.refresh_token,
          expiresAt: tokenResponse.expires_in 
            ? new Date(Date.now() + tokenResponse.expires_in * 1000) 
            : undefined,
        });
      } else {
        // Create new OAuth account for existing user
        await this.oauthRepository.create({
          userId: user.id,
          provider,
          providerId: userInfo.id,
          accessToken: tokenResponse.access_token,
          refreshToken: tokenResponse.refresh_token,
          expiresAt: tokenResponse.expires_in 
            ? new Date(Date.now() + tokenResponse.expires_in * 1000) 
            : undefined,
        });
      }
    }

    // Generate JWT tokens
    const tokens = await this.jwtService.generateTokens(user);
    
    // Create session
    await this.sessionService.createSession(user.id, tokens.refreshToken);
    
    await this.auditService.logOAuthLogin(user.id, provider);

    // Clean up state
    await this.redis.del(`oauth_state:${state}`);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        userType: user.userType,
        plan: user.plan,
        emailVerified: user.emailVerified || false,
        createdAt: user.createdAt,
      },
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: tokens.expiresIn,
    };
  }

  async linkOAuthAccount(
    userId: string,
    provider: OAuthProvider,
    code: string,
    state: string
  ): Promise<OAuthAccountResponseDto> {
    // Validate state
    const storedState = await this.validateOAuthState(state);
    if (!storedState || storedState.provider !== provider || storedState.userId !== userId) {
      throw new UnauthorizedException('Invalid OAuth state');
    }

    // Check if user exists
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Check if OAuth account already exists for this user
    const existingOAuth = await this.oauthRepository.findByUserIdAndProvider(userId, provider);
    if (existingOAuth) {
      throw new ConflictException('OAuth account already linked');
    }

    // Exchange code for access token
    const providerConfig = this.getProviderConfig(provider);
    const tokenResponse = await this.exchangeCodeForToken(providerConfig, code, storedState.redirectUri);
    
    // Get user info from provider
    const userInfo = await this.getUserInfoFromProvider(provider, tokenResponse.access_token);
    
    // Check if this OAuth account is already linked to another user
    const existingAccount = await this.oauthRepository.findByProviderAndId(provider, userInfo.id);
    if (existingAccount) {
      throw new ConflictException('This OAuth account is already linked to another user');
    }

    // Create OAuth account
    const oauthAccount = await this.oauthRepository.create({
      userId,
      provider,
      providerId: userInfo.id,
      accessToken: tokenResponse.access_token,
      refreshToken: tokenResponse.refresh_token,
      expiresAt: tokenResponse.expires_in 
        ? new Date(Date.now() + tokenResponse.expires_in * 1000) 
        : undefined,
    });

    await this.auditService.logOAuthAccountLinked(userId, provider);

    // Clean up state
    await this.redis.del(`oauth_state:${state}`);

    return {
      id: oauthAccount.id,
      provider: oauthAccount.provider,
      providerId: oauthAccount.providerId,
      createdAt: oauthAccount.createdAt,
      updatedAt: oauthAccount.updatedAt,
    };
  }

  async unlinkOAuthAccount(userId: string, provider: OAuthProvider): Promise<void> {
    const oauthAccount = await this.oauthRepository.findByUserIdAndProvider(userId, provider);
    if (!oauthAccount) {
      throw new BadRequestException('OAuth account not found');
    }

    // Check if user has a password or other OAuth accounts
    const user = await this.userRepository.findById(userId);
    const userOAuthAccounts = await this.oauthRepository.findByUserId(userId);
    
    if (!user?.passwordHash && userOAuthAccounts.length === 1) {
      throw new BadRequestException('Cannot unlink the only authentication method');
    }

    await this.oauthRepository.delete(oauthAccount.id);
    await this.auditService.logOAuthAccountUnlinked(userId, provider);
  }

  async getUserOAuthAccounts(userId: string): Promise<OAuthAccountResponseDto[]> {
    const accounts = await this.oauthRepository.findByUserId(userId);
    
    return accounts.map(account => ({
      id: account.id,
      provider: account.provider,
      providerId: account.providerId,
      createdAt: account.createdAt,
      updatedAt: account.updatedAt,
    }));
  }

  async refreshOAuthTokens(accountId: string): Promise<void> {
    const account = await this.oauthRepository.findById(accountId);
    if (!account || !account.refreshToken) {
      throw new BadRequestException('OAuth account not found or no refresh token available');
    }

    const config = this.getProviderConfig(account.provider);
    
    try {
      const tokenResponse = await this.refreshProviderToken(config, account.refreshToken);
      
      await this.oauthRepository.updateTokens(accountId, {
        accessToken: tokenResponse.access_token,
        refreshToken: tokenResponse.refresh_token || account.refreshToken,
        expiresAt: tokenResponse.expires_in 
          ? new Date(Date.now() + tokenResponse.expires_in * 1000) 
          : undefined,
      });
    } catch (error) {
      // If refresh fails, the token might be revoked
      await this.oauthRepository.updateTokens(accountId, {
        accessToken: null,
        refreshToken: null,
        expiresAt: null,
      });
      throw new UnauthorizedException('Failed to refresh OAuth token');
    }
  }

  private getProviderConfig(provider: OAuthProvider): OAuthProviderConfig {
    const configs = {
      [OAuthProvider.GOOGLE]: {
        clientId: this.configService.get('GOOGLE_CLIENT_ID'),
        clientSecret: this.configService.get('GOOGLE_CLIENT_SECRET'),
        authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
        tokenUrl: 'https://oauth2.googleapis.com/token',
        userInfoUrl: 'https://www.googleapis.com/oauth2/v2/userinfo',
        scopes: ['openid', 'email', 'profile'],
      },
      [OAuthProvider.GITHUB]: {
        clientId: this.configService.get('GITHUB_CLIENT_ID'),
        clientSecret: this.configService.get('GITHUB_CLIENT_SECRET'),
        authUrl: 'https://github.com/login/oauth/authorize',
        tokenUrl: 'https://github.com/login/oauth/access_token',
        userInfoUrl: 'https://api.github.com/user',
        scopes: ['user:email'],
      },
      [OAuthProvider.LINKEDIN]: {
        clientId: this.configService.get('LINKEDIN_CLIENT_ID'),
        clientSecret: this.configService.get('LINKEDIN_CLIENT_SECRET'),
        authUrl: 'https://www.linkedin.com/oauth/v2/authorization',
        tokenUrl: 'https://www.linkedin.com/oauth/v2/accessToken',
        userInfoUrl: 'https://api.linkedin.com/v2/people/~',
        scopes: ['r_liteprofile', 'r_emailaddress'],
      },
    };

    const config = configs[provider];
    if (!config.clientId || !config.clientSecret) {
      throw new BadRequestException(`OAuth provider ${provider} not configured`);
    }

    return config;
  }

  private buildAuthUrl(config: OAuthProviderConfig, state: string, redirectUri: string): string {
    const params = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: redirectUri,
      scope: config.scopes.join(' '),
      response_type: 'code',
      state,
    });

    return `${config.authUrl}?${params.toString()}`;
  }

  private async exchangeCodeForToken(
    config: OAuthProviderConfig,
    code: string,
    redirectUri: string
  ): Promise<OAuthTokenResponse> {
    try {
      const response = await axios.post(config.tokenUrl, {
        client_id: config.clientId,
        client_secret: config.clientSecret,
        code,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      return response.data;
    } catch (error) {
      throw new UnauthorizedException('Failed to exchange authorization code');
    }
  }

  private async refreshProviderToken(
    config: OAuthProviderConfig,
    refreshToken: string
  ): Promise<OAuthTokenResponse> {
    const response = await axios.post(config.tokenUrl, {
      client_id: config.clientId,
      client_secret: config.clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    return response.data;
  }

  private async getUserInfoFromProvider(provider: OAuthProvider, accessToken: string): Promise<OAuthUserInfo> {
    const config = this.getProviderConfig(provider);
    
    try {
      const response = await axios.get(config.userInfoUrl, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json',
        },
      });

      return this.normalizeUserInfo(provider, response.data);
    } catch (error) {
      throw new UnauthorizedException('Failed to get user info from OAuth provider');
    }
  }

  private normalizeUserInfo(provider: OAuthProvider, rawData: any): OAuthUserInfo {
    switch (provider) {
      case OAuthProvider.GOOGLE:
        return {
          id: rawData.id,
          email: rawData.email,
          name: rawData.name,
          picture: rawData.picture,
        };
      
      case OAuthProvider.GITHUB:
        return {
          id: rawData.id.toString(),
          email: rawData.email,
          name: rawData.name || rawData.login,
          picture: rawData.avatar_url,
        };
      
      case OAuthProvider.LINKEDIN:
        return {
          id: rawData.id,
          email: rawData.emailAddress,
          name: `${rawData.firstName?.localized?.en_US || ''} ${rawData.lastName?.localized?.en_US || ''}`.trim(),
          picture: rawData.profilePicture?.['displayImage~']?.elements?.[0]?.identifiers?.[0]?.identifier,
        };
      
      default:
        throw new BadRequestException(`Unsupported OAuth provider: ${provider}`);
    }
  }

  private generateSecureState(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  private async validateOAuthState(state: string): Promise<OAuthState | null> {
    const stateData = await this.redis.get(`oauth_state:${state}`);
    if (!stateData) {
      return null;
    }

    try {
      return JSON.parse(stateData);
    } catch {
      return null;
    }
  }
}