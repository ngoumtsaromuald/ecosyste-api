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
Object.defineProperty(exports, "__esModule", { value: true });
exports.OAuthAccountResponseDto = exports.OAuthInitiateResponseDto = exports.OAuthLinkDto = exports.OAuthCallbackDto = exports.OAuthInitiateDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const client_1 = require("@prisma/client");
class OAuthInitiateDto {
}
exports.OAuthInitiateDto = OAuthInitiateDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'OAuth provider',
        enum: client_1.OAuthProvider,
        example: client_1.OAuthProvider.GOOGLE,
    }),
    (0, class_validator_1.IsEnum)(client_1.OAuthProvider),
    __metadata("design:type", String)
], OAuthInitiateDto.prototype, "provider", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Redirect URI after OAuth completion',
        example: 'https://app.romapi.com/auth/callback',
    }),
    (0, class_validator_1.IsUrl)(),
    __metadata("design:type", String)
], OAuthInitiateDto.prototype, "redirectUri", void 0);
class OAuthCallbackDto {
}
exports.OAuthCallbackDto = OAuthCallbackDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Authorization code from OAuth provider',
        example: 'abc123def456',
    }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], OAuthCallbackDto.prototype, "code", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'State parameter for CSRF protection',
        example: 'xyz789',
    }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], OAuthCallbackDto.prototype, "state", void 0);
class OAuthLinkDto {
}
exports.OAuthLinkDto = OAuthLinkDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'OAuth provider to link',
        enum: client_1.OAuthProvider,
        example: client_1.OAuthProvider.GITHUB,
    }),
    (0, class_validator_1.IsEnum)(client_1.OAuthProvider),
    __metadata("design:type", String)
], OAuthLinkDto.prototype, "provider", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Authorization code from OAuth provider',
        example: 'abc123def456',
    }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], OAuthLinkDto.prototype, "code", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'State parameter for CSRF protection',
        example: 'xyz789',
    }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], OAuthLinkDto.prototype, "state", void 0);
class OAuthInitiateResponseDto {
}
exports.OAuthInitiateResponseDto = OAuthInitiateResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'OAuth authorization URL',
        example: 'https://accounts.google.com/o/oauth2/v2/auth?client_id=...',
    }),
    __metadata("design:type", String)
], OAuthInitiateResponseDto.prototype, "authUrl", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'State parameter for CSRF protection',
        example: 'xyz789',
    }),
    __metadata("design:type", String)
], OAuthInitiateResponseDto.prototype, "state", void 0);
class OAuthAccountResponseDto {
}
exports.OAuthAccountResponseDto = OAuthAccountResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'OAuth account ID',
        example: 'uuid-here',
    }),
    __metadata("design:type", String)
], OAuthAccountResponseDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'OAuth provider',
        enum: client_1.OAuthProvider,
        example: client_1.OAuthProvider.GOOGLE,
    }),
    __metadata("design:type", String)
], OAuthAccountResponseDto.prototype, "provider", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Provider user ID',
        example: '123456789',
    }),
    __metadata("design:type", String)
], OAuthAccountResponseDto.prototype, "providerId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Account creation date',
        example: '2024-01-01T00:00:00Z',
    }),
    __metadata("design:type", Date)
], OAuthAccountResponseDto.prototype, "createdAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Account last update date',
        example: '2024-01-01T00:00:00Z',
    }),
    __metadata("design:type", Date)
], OAuthAccountResponseDto.prototype, "updatedAt", void 0);
//# sourceMappingURL=oauth.dto.js.map