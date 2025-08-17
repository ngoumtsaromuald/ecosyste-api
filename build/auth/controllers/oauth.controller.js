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
exports.OAuthController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const oauth_service_1 = require("../services/oauth.service");
const jwt_auth_guard_1 = require("../guards/jwt-auth.guard");
const client_1 = require("@prisma/client");
const oauth_dto_1 = require("../dto/oauth.dto");
const auth_response_dto_1 = require("../dto/auth-response.dto");
let OAuthController = class OAuthController {
    constructor(oauthService) {
        this.oauthService = oauthService;
    }
    async initiateOAuth(provider, redirectUri) {
        return this.oauthService.initiateOAuth(provider, redirectUri);
    }
    async handleOAuthCallback(provider, code, state) {
        return this.oauthService.handleOAuthCallback(provider, code, state);
    }
    async linkOAuthAccount(linkDto, req) {
        return this.oauthService.linkOAuthAccount(req.user.id, linkDto.provider, linkDto.code, linkDto.state);
    }
    async getUserOAuthAccounts(req) {
        return this.oauthService.getUserOAuthAccounts(req.user.id);
    }
    async unlinkOAuthAccount(provider, req) {
        return this.oauthService.unlinkOAuthAccount(req.user.id, provider);
    }
    async initiateOAuthLinking(provider, redirectUri, req) {
        return this.oauthService.initiateOAuth(provider, redirectUri, req.user.id);
    }
    async refreshOAuthTokens(accountId, req) {
        const userAccounts = await this.oauthService.getUserOAuthAccounts(req.user.id);
        const account = userAccounts.find(acc => acc.id === accountId);
        if (!account) {
            throw new Error('OAuth account not found or does not belong to user');
        }
        return this.oauthService.refreshOAuthTokens(accountId);
    }
};
exports.OAuthController = OAuthController;
__decorate([
    (0, common_1.Get)(':provider/initiate'),
    (0, swagger_1.ApiOperation)({
        summary: 'Initiate OAuth flow',
        description: 'Start OAuth authentication flow with the specified provider'
    }),
    (0, swagger_1.ApiParam)({
        name: 'provider',
        enum: client_1.OAuthProvider,
        description: 'OAuth provider (google, github, linkedin)',
    }),
    (0, swagger_1.ApiQuery)({
        name: 'redirectUri',
        description: 'URI to redirect to after OAuth completion',
        example: 'https://app.romapi.com/auth/callback',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'OAuth initiation successful',
        type: oauth_dto_1.OAuthInitiateResponseDto,
    }),
    (0, swagger_1.ApiResponse)({
        status: 400,
        description: 'Invalid provider or missing redirect URI',
    }),
    __param(0, (0, common_1.Param)('provider')),
    __param(1, (0, common_1.Query)('redirectUri')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], OAuthController.prototype, "initiateOAuth", null);
__decorate([
    (0, common_1.Get)(':provider/callback'),
    (0, swagger_1.ApiOperation)({
        summary: 'Handle OAuth callback',
        description: 'Handle OAuth provider callback and complete authentication'
    }),
    (0, swagger_1.ApiParam)({
        name: 'provider',
        enum: client_1.OAuthProvider,
        description: 'OAuth provider (google, github, linkedin)',
    }),
    (0, swagger_1.ApiQuery)({
        name: 'code',
        description: 'Authorization code from OAuth provider',
    }),
    (0, swagger_1.ApiQuery)({
        name: 'state',
        description: 'State parameter for CSRF protection',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'OAuth authentication successful',
        type: auth_response_dto_1.AuthResponseDto,
    }),
    (0, swagger_1.ApiResponse)({
        status: 401,
        description: 'Invalid authorization code or state',
    }),
    __param(0, (0, common_1.Param)('provider')),
    __param(1, (0, common_1.Query)('code')),
    __param(2, (0, common_1.Query)('state')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], OAuthController.prototype, "handleOAuthCallback", null);
__decorate([
    (0, common_1.Post)('link'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Link OAuth account',
        description: 'Link an OAuth account to the current authenticated user'
    }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: 'OAuth account linked successfully',
        type: oauth_dto_1.OAuthAccountResponseDto,
    }),
    (0, swagger_1.ApiResponse)({
        status: 401,
        description: 'User not authenticated',
    }),
    (0, swagger_1.ApiResponse)({
        status: 409,
        description: 'OAuth account already linked',
    }),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [oauth_dto_1.OAuthLinkDto, Object]),
    __metadata("design:returntype", Promise)
], OAuthController.prototype, "linkOAuthAccount", null);
__decorate([
    (0, common_1.Get)('accounts'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Get user OAuth accounts',
        description: 'Get all OAuth accounts linked to the current user'
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'OAuth accounts retrieved successfully',
        type: [oauth_dto_1.OAuthAccountResponseDto],
    }),
    (0, swagger_1.ApiResponse)({
        status: 401,
        description: 'User not authenticated',
    }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], OAuthController.prototype, "getUserOAuthAccounts", null);
__decorate([
    (0, common_1.Delete)(':provider'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Unlink OAuth account',
        description: 'Unlink an OAuth account from the current user'
    }),
    (0, swagger_1.ApiParam)({
        name: 'provider',
        enum: client_1.OAuthProvider,
        description: 'OAuth provider to unlink (google, github, linkedin)',
    }),
    (0, swagger_1.ApiResponse)({
        status: 204,
        description: 'OAuth account unlinked successfully',
    }),
    (0, swagger_1.ApiResponse)({
        status: 400,
        description: 'Cannot unlink the only authentication method',
    }),
    (0, swagger_1.ApiResponse)({
        status: 401,
        description: 'User not authenticated',
    }),
    (0, swagger_1.ApiResponse)({
        status: 404,
        description: 'OAuth account not found',
    }),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    __param(0, (0, common_1.Param)('provider')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], OAuthController.prototype, "unlinkOAuthAccount", null);
__decorate([
    (0, common_1.Post)(':provider/initiate-link'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Initiate OAuth linking flow',
        description: 'Start OAuth flow to link an account to the current authenticated user'
    }),
    (0, swagger_1.ApiParam)({
        name: 'provider',
        enum: client_1.OAuthProvider,
        description: 'OAuth provider (google, github, linkedin)',
    }),
    (0, swagger_1.ApiQuery)({
        name: 'redirectUri',
        description: 'URI to redirect to after OAuth completion',
        example: 'https://app.romapi.com/settings/accounts',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'OAuth linking initiation successful',
        type: oauth_dto_1.OAuthInitiateResponseDto,
    }),
    (0, swagger_1.ApiResponse)({
        status: 400,
        description: 'Invalid provider or missing redirect URI',
    }),
    (0, swagger_1.ApiResponse)({
        status: 401,
        description: 'User not authenticated',
    }),
    __param(0, (0, common_1.Param)('provider')),
    __param(1, (0, common_1.Query)('redirectUri')),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], OAuthController.prototype, "initiateOAuthLinking", null);
__decorate([
    (0, common_1.Post)('accounts/:accountId/refresh'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Refresh OAuth tokens',
        description: 'Refresh OAuth access tokens for a specific account'
    }),
    (0, swagger_1.ApiParam)({
        name: 'accountId',
        description: 'OAuth account ID',
    }),
    (0, swagger_1.ApiResponse)({
        status: 204,
        description: 'OAuth tokens refreshed successfully',
    }),
    (0, swagger_1.ApiResponse)({
        status: 400,
        description: 'OAuth account not found or no refresh token available',
    }),
    (0, swagger_1.ApiResponse)({
        status: 401,
        description: 'User not authenticated or failed to refresh token',
    }),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    __param(0, (0, common_1.Param)('accountId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], OAuthController.prototype, "refreshOAuthTokens", null);
exports.OAuthController = OAuthController = __decorate([
    (0, swagger_1.ApiTags)('OAuth'),
    (0, common_1.Controller)('oauth'),
    __metadata("design:paramtypes", [oauth_service_1.OAuthService])
], OAuthController);
//# sourceMappingURL=oauth.controller.js.map