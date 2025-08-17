import { Request } from 'express';
import { OAuthService } from '../services/oauth.service';
import { OAuthProvider } from '@prisma/client';
import { OAuthInitiateResponseDto, OAuthLinkDto, OAuthAccountResponseDto } from '../dto/oauth.dto';
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
export declare class OAuthController {
    private readonly oauthService;
    constructor(oauthService: OAuthService);
    initiateOAuth(provider: OAuthProvider, redirectUri: string): Promise<OAuthInitiateResponseDto>;
    handleOAuthCallback(provider: OAuthProvider, code: string, state: string): Promise<AuthResponseDto>;
    linkOAuthAccount(linkDto: OAuthLinkDto, req: AuthenticatedRequest): Promise<OAuthAccountResponseDto>;
    getUserOAuthAccounts(req: AuthenticatedRequest): Promise<OAuthAccountResponseDto[]>;
    unlinkOAuthAccount(provider: OAuthProvider, req: AuthenticatedRequest): Promise<void>;
    initiateOAuthLinking(provider: OAuthProvider, redirectUri: string, req: AuthenticatedRequest): Promise<OAuthInitiateResponseDto>;
    refreshOAuthTokens(accountId: string, req: AuthenticatedRequest): Promise<void>;
}
export {};
