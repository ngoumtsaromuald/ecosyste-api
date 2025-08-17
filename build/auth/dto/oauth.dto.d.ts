import { OAuthProvider } from '@prisma/client';
export declare class OAuthInitiateDto {
    provider: OAuthProvider;
    redirectUri: string;
}
export declare class OAuthCallbackDto {
    code: string;
    state: string;
}
export declare class OAuthLinkDto {
    provider: OAuthProvider;
    code: string;
    state: string;
}
export declare class OAuthInitiateResponseDto {
    authUrl: string;
    state: string;
}
export declare class OAuthAccountResponseDto {
    id: string;
    provider: OAuthProvider;
    providerId: string;
    createdAt: Date;
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
    userId?: string;
}
