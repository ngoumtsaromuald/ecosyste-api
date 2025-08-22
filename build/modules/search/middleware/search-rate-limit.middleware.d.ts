import { NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { SearchRateLimitService } from '../services/search-rate-limit.service';
import { JWTService } from '../../../auth/services/jwt.service';
export declare class SearchRateLimitMiddleware implements NestMiddleware {
    private readonly rateLimitService;
    private readonly jwtService;
    private readonly logger;
    constructor(rateLimitService: SearchRateLimitService, jwtService: JWTService);
    use(req: Request, res: Response, next: NextFunction): Promise<void>;
    private buildRateLimitContext;
    private determineOperationType;
    private extractUserId;
    private extractSessionId;
    private extractIPAddress;
    private extractUserTier;
    private isAuthenticated;
    private extractAuthToken;
    private handleRateLimitViolation;
}
export declare class SuggestionRateLimitMiddleware implements NestMiddleware {
    private readonly rateLimitService;
    private readonly logger;
    constructor(rateLimitService: SearchRateLimitService);
    use(req: Request, res: Response, next: NextFunction): Promise<void>;
    private extractUserId;
    private extractSessionId;
    private extractIPAddress;
    private extractUserTier;
    private isAuthenticated;
}
export declare class AnalyticsRateLimitMiddleware implements NestMiddleware {
    private readonly rateLimitService;
    private readonly logger;
    constructor(rateLimitService: SearchRateLimitService);
    use(req: Request, res: Response, next: NextFunction): Promise<void>;
    private extractUserId;
    private extractSessionId;
    private extractIPAddress;
    private extractUserTier;
    private isAuthenticated;
}
export declare class GlobalRateLimitMiddleware implements NestMiddleware {
    private readonly rateLimitService;
    private readonly logger;
    private readonly suspiciousIPs;
    constructor(rateLimitService: SearchRateLimitService);
    use(req: Request, res: Response, next: NextFunction): Promise<void>;
    private isSuspiciousIP;
    private markSuspiciousIP;
    private cleanupSuspiciousIPs;
    private extractIPAddress;
    private extractUserId;
    private extractSessionId;
    private extractUserTier;
    private isAuthenticated;
    private determineOperationType;
}
export declare class ApiKeyRateLimitMiddleware implements NestMiddleware {
    private readonly rateLimitService;
    private readonly jwtService;
    private readonly logger;
    constructor(rateLimitService: SearchRateLimitService, jwtService: JWTService);
    use(req: Request, res: Response, next: NextFunction): Promise<void>;
    private extractIPAddress;
    private determineOperationType;
}
export declare class AdaptiveRateLimitMiddleware implements NestMiddleware {
    private readonly rateLimitService;
    private readonly jwtService;
    private readonly logger;
    constructor(rateLimitService: SearchRateLimitService, jwtService: JWTService);
    use(req: Request, res: Response, next: NextFunction): Promise<void>;
    private buildRateLimitContext;
    private extractAuthToken;
    private extractUserId;
    private extractSessionId;
    private extractIPAddress;
    private extractUserTier;
    private isAuthenticated;
    private determineOperationType;
}
