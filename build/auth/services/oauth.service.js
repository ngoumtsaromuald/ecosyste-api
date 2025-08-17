"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OAuthService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const oauth_repository_1 = require("../../repositories/oauth.repository");
const user_repository_1 = require("../../repositories/user.repository");
const jwt_service_1 = require("./jwt.service");
const audit_service_1 = require("./audit.service");
const session_service_1 = require("./session.service");
const client_1 = require("@prisma/client");
const crypto = require("crypto");
const axios_1 = require("axios");
const ioredis_1 = require("ioredis");
let OAuthService = class OAuthService {
    constructor(oauthRepository, userRepository, jwtService, auditService, sessionService, configService, redis) {
        this.oauthRepository = oauthRepository;
        this.userRepository = userRepository;
        this.jwtService = jwtService;
        this.auditService = auditService;
        this.sessionService = sessionService;
        this.configService = configService;
        this.redis = redis;
    }
    async initiateOAuth(provider, redirectUri, userId) {
        const config = this.getProviderConfig(provider);
        const state = this.generateSecureState();
        const stateData = { provider, redirectUri, userId };
        await this.redis.setex(`oauth_state:${state}`, 600, JSON.stringify(stateData));
        const authUrl = this.buildAuthUrl(config, state, redirectUri);
        return {
            authUrl,
            state,
        };
    }
    async handleOAuthCallback(provider, code, state) {
        const storedState = await this.validateOAuthState(state);
        if (!storedState || storedState.provider !== provider) {
            throw new common_1.UnauthorizedException('Invalid OAuth state');
        }
        const providerConfig = this.getProviderConfig(provider);
        const tokenResponse = await this.exchangeCodeForToken(providerConfig, code, storedState.redirectUri);
        const userInfo = await this.getUserInfoFromProvider(provider, tokenResponse.access_token);
        let user = await this.userRepository.findByEmail(userInfo.email);
        if (!user) {
            user = await this.userRepository.create({
                email: userInfo.email,
                passwordHash: null,
                name: userInfo.name,
                userType: client_1.UserType.INDIVIDUAL,
                emailVerified: true,
                emailVerifiedAt: new Date(),
            });
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
        }
        else {
            const existingOAuth = await this.oauthRepository.findByUserIdAndProvider(user.id, provider);
            if (existingOAuth) {
                await this.oauthRepository.updateTokens(existingOAuth.id, {
                    accessToken: tokenResponse.access_token,
                    refreshToken: tokenResponse.refresh_token,
                    expiresAt: tokenResponse.expires_in
                        ? new Date(Date.now() + tokenResponse.expires_in * 1000)
                        : undefined,
                });
            }
            else {
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
        const tokens = await this.jwtService.generateTokens(user);
        await this.sessionService.createSession(user.id, tokens.refreshToken);
        await this.auditService.logOAuthLogin(user.id, provider);
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
    async linkOAuthAccount(userId, provider, code, state) {
        const storedState = await this.validateOAuthState(state);
        if (!storedState || storedState.provider !== provider || storedState.userId !== userId) {
            throw new common_1.UnauthorizedException('Invalid OAuth state');
        }
        const user = await this.userRepository.findById(userId);
        if (!user) {
            throw new common_1.UnauthorizedException('User not found');
        }
        const existingOAuth = await this.oauthRepository.findByUserIdAndProvider(userId, provider);
        if (existingOAuth) {
            throw new common_1.ConflictException('OAuth account already linked');
        }
        const providerConfig = this.getProviderConfig(provider);
        const tokenResponse = await this.exchangeCodeForToken(providerConfig, code, storedState.redirectUri);
        const userInfo = await this.getUserInfoFromProvider(provider, tokenResponse.access_token);
        const existingAccount = await this.oauthRepository.findByProviderAndId(provider, userInfo.id);
        if (existingAccount) {
            throw new common_1.ConflictException('This OAuth account is already linked to another user');
        }
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
        await this.redis.del(`oauth_state:${state}`);
        return {
            id: oauthAccount.id,
            provider: oauthAccount.provider,
            providerId: oauthAccount.providerId,
            createdAt: oauthAccount.createdAt,
            updatedAt: oauthAccount.updatedAt,
        };
    }
    async unlinkOAuthAccount(userId, provider) {
        const oauthAccount = await this.oauthRepository.findByUserIdAndProvider(userId, provider);
        if (!oauthAccount) {
            throw new common_1.BadRequestException('OAuth account not found');
        }
        const user = await this.userRepository.findById(userId);
        const userOAuthAccounts = await this.oauthRepository.findByUserId(userId);
        if (!user?.passwordHash && userOAuthAccounts.length === 1) {
            throw new common_1.BadRequestException('Cannot unlink the only authentication method');
        }
        await this.oauthRepository.delete(oauthAccount.id);
        await this.auditService.logOAuthAccountUnlinked(userId, provider);
    }
    async getUserOAuthAccounts(userId) {
        const accounts = await this.oauthRepository.findByUserId(userId);
        return accounts.map(account => ({
            id: account.id,
            provider: account.provider,
            providerId: account.providerId,
            createdAt: account.createdAt,
            updatedAt: account.updatedAt,
        }));
    }
    async refreshOAuthTokens(accountId) {
        const account = await this.oauthRepository.findById(accountId);
        if (!account || !account.refreshToken) {
            throw new common_1.BadRequestException('OAuth account not found or no refresh token available');
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
        }
        catch (error) {
            await this.oauthRepository.updateTokens(accountId, {
                accessToken: null,
                refreshToken: null,
                expiresAt: null,
            });
            throw new common_1.UnauthorizedException('Failed to refresh OAuth token');
        }
    }
    getProviderConfig(provider) {
        const configs = {
            [client_1.OAuthProvider.GOOGLE]: {
                clientId: this.configService.get('GOOGLE_CLIENT_ID'),
                clientSecret: this.configService.get('GOOGLE_CLIENT_SECRET'),
                authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
                tokenUrl: 'https://oauth2.googleapis.com/token',
                userInfoUrl: 'https://www.googleapis.com/oauth2/v2/userinfo',
                scopes: ['openid', 'email', 'profile'],
            },
            [client_1.OAuthProvider.GITHUB]: {
                clientId: this.configService.get('GITHUB_CLIENT_ID'),
                clientSecret: this.configService.get('GITHUB_CLIENT_SECRET'),
                authUrl: 'https://github.com/login/oauth/authorize',
                tokenUrl: 'https://github.com/login/oauth/access_token',
                userInfoUrl: 'https://api.github.com/user',
                scopes: ['user:email'],
            },
            [client_1.OAuthProvider.LINKEDIN]: {
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
            throw new common_1.BadRequestException(`OAuth provider ${provider} not configured`);
        }
        return config;
    }
    buildAuthUrl(config, state, redirectUri) {
        const params = new URLSearchParams({
            client_id: config.clientId,
            redirect_uri: redirectUri,
            scope: config.scopes.join(' '),
            response_type: 'code',
            state,
        });
        return `${config.authUrl}?${params.toString()}`;
    }
    async exchangeCodeForToken(config, code, redirectUri) {
        try {
            const response = await axios_1.default.post(config.tokenUrl, {
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
        }
        catch (error) {
            throw new common_1.UnauthorizedException('Failed to exchange authorization code');
        }
    }
    async refreshProviderToken(config, refreshToken) {
        const response = await axios_1.default.post(config.tokenUrl, {
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
    async getUserInfoFromProvider(provider, accessToken) {
        const config = this.getProviderConfig(provider);
        try {
            const response = await axios_1.default.get(config.userInfoUrl, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Accept': 'application/json',
                },
            });
            return this.normalizeUserInfo(provider, response.data);
        }
        catch (error) {
            throw new common_1.UnauthorizedException('Failed to get user info from OAuth provider');
        }
    }
    normalizeUserInfo(provider, rawData) {
        switch (provider) {
            case client_1.OAuthProvider.GOOGLE:
                return {
                    id: rawData.id,
                    email: rawData.email,
                    name: rawData.name,
                    picture: rawData.picture,
                };
            case client_1.OAuthProvider.GITHUB:
                return {
                    id: rawData.id.toString(),
                    email: rawData.email,
                    name: rawData.name || rawData.login,
                    picture: rawData.avatar_url,
                };
            case client_1.OAuthProvider.LINKEDIN:
                return {
                    id: rawData.id,
                    email: rawData.emailAddress,
                    name: `${rawData.firstName?.localized?.en_US || ''} ${rawData.lastName?.localized?.en_US || ''}`.trim(),
                    picture: rawData.profilePicture?.['displayImage~']?.elements?.[0]?.identifiers?.[0]?.identifier,
                };
            default:
                throw new common_1.BadRequestException(`Unsupported OAuth provider: ${provider}`);
        }
    }
    generateSecureState() {
        return crypto.randomBytes(32).toString('hex');
    }
    async validateOAuthState(state) {
        const stateData = await this.redis.get(`oauth_state:${state}`);
        if (!stateData) {
            return null;
        }
        try {
            return JSON.parse(stateData);
        }
        catch {
            return null;
        }
    }
};
exports.OAuthService = OAuthService;
exports.OAuthService = OAuthService = __decorate([
    (0, common_1.Injectable)(),
    __param(6, (0, common_1.Inject)('REDIS_CLIENT')),
    __metadata("design:paramtypes", [oauth_repository_1.OAuthRepository,
        user_repository_1.UserRepository,
        jwt_service_1.JWTService,
        audit_service_1.AuditService,
        session_service_1.SessionService,
        config_1.ConfigService,
        ioredis_1.Redis])
], OAuthService);
//# sourceMappingURL=oauth.service.js.map