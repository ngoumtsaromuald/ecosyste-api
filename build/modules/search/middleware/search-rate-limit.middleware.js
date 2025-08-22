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
var SearchRateLimitMiddleware_1, SuggestionRateLimitMiddleware_1, AnalyticsRateLimitMiddleware_1, GlobalRateLimitMiddleware_1, ApiKeyRateLimitMiddleware_1, AdaptiveRateLimitMiddleware_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdaptiveRateLimitMiddleware = exports.ApiKeyRateLimitMiddleware = exports.GlobalRateLimitMiddleware = exports.AnalyticsRateLimitMiddleware = exports.SuggestionRateLimitMiddleware = exports.SearchRateLimitMiddleware = void 0;
const common_1 = require("@nestjs/common");
const search_rate_limit_service_1 = require("../services/search-rate-limit.service");
const jwt_service_1 = require("../../../auth/services/jwt.service");
function getSessionId(req) {
    return req.sessionID || req.get('X-Session-ID') || req.query?.sessionId || undefined;
}
let SearchRateLimitMiddleware = SearchRateLimitMiddleware_1 = class SearchRateLimitMiddleware {
    constructor(rateLimitService, jwtService) {
        this.rateLimitService = rateLimitService;
        this.jwtService = jwtService;
        this.logger = new common_1.Logger(SearchRateLimitMiddleware_1.name);
    }
    async use(req, res, next) {
        try {
            const ipAddress = this.extractIPAddress(req);
            const userId = this.extractUserId(req);
            const sessionId = getSessionId(req);
            const isIpBlocked = await this.rateLimitService.isTemporarilyBlocked(ipAddress, 'ip');
            const isUserBlocked = userId ? await this.rateLimitService.isTemporarilyBlocked(userId, 'user') : false;
            const isSessionBlocked = sessionId ? await this.rateLimitService.isTemporarilyBlocked(sessionId, 'session') : false;
            if (isIpBlocked || isUserBlocked || isSessionBlocked) {
                const blockType = isUserBlocked ? 'user' : isSessionBlocked ? 'session' : 'ip';
                const blockId = isUserBlocked ? userId : isSessionBlocked ? sessionId : ipAddress;
                const blockInfo = await this.rateLimitService.getBlockInfo(blockId, blockType);
                throw new common_1.HttpException({
                    message: `Accès temporairement bloqué: ${blockInfo?.reason || 'Violation des limites de taux'}`,
                    limitType: 'temporary_block',
                    remaining: 0,
                    resetTime: blockInfo?.expiresAt ? new Date(blockInfo.expiresAt) : new Date(Date.now() + 3600000),
                    retryAfter: blockInfo?.duration || 3600
                }, common_1.HttpStatus.TOO_MANY_REQUESTS);
            }
            const baseContext = this.buildRateLimitContext(req);
            const authToken = this.extractAuthToken(req);
            const enrichedContext = await this.rateLimitService.enrichContextWithAuth(baseContext, authToken);
            const result = await this.rateLimitService.checkRateLimit(enrichedContext);
            res.set({
                'X-RateLimit-Limit': result.limitValue.toString(),
                'X-RateLimit-Remaining': result.remaining.toString(),
                'X-RateLimit-Reset': Math.ceil(result.resetTime.getTime() / 1000).toString(),
                'X-RateLimit-Type': result.limitType,
                'X-RateLimit-User-Tier': enrichedContext.userTier || 'anonymous'
            });
            if (!result.allowed) {
                res.set({
                    'Retry-After': result.retryAfter?.toString() || '60'
                });
                await this.handleRateLimitViolation(enrichedContext, result);
                throw new common_1.HttpException({
                    message: 'Limite de taux dépassée',
                    limitType: result.limitType,
                    remaining: result.remaining,
                    resetTime: result.resetTime,
                    retryAfter: result.retryAfter
                }, common_1.HttpStatus.TOO_MANY_REQUESTS);
            }
            req.body = req.body || {};
            req.body.rateLimitInfo = result;
            req.body.userContext = enrichedContext;
            next();
        }
        catch (error) {
            if (error instanceof common_1.HttpException && error.getStatus() === common_1.HttpStatus.TOO_MANY_REQUESTS) {
                throw error;
            }
            this.logger.error(`Rate limit middleware error: ${error.message}`, error.stack);
            next();
        }
    }
    buildRateLimitContext(req) {
        const path = req.path;
        const operationType = this.determineOperationType(path);
        return {
            userId: this.extractUserId(req),
            sessionId: this.extractSessionId(req),
            ipAddress: this.extractIPAddress(req),
            userAgent: req.get('User-Agent'),
            endpoint: path,
            operationType,
            userTier: this.extractUserTier(req),
            isAuthenticated: this.isAuthenticated(req)
        };
    }
    determineOperationType(path) {
        if (path.includes('/suggest')) {
            return 'suggest';
        }
        if (path.includes('/analytics')) {
            return 'analytics';
        }
        if (path.includes('/category')) {
            return 'category';
        }
        if (path.includes('/multi-type')) {
            return 'multi-type';
        }
        return 'search';
    }
    extractUserId(req) {
        return req.body?.user?.id || req.query?.userId || undefined;
    }
    extractSessionId(req) {
        return req.sessionID || req.get('X-Session-ID') || req.query?.sessionId || undefined;
    }
    extractIPAddress(req) {
        return (req.get('X-Forwarded-For')?.split(',')[0]?.trim() ||
            req.get('X-Real-IP') ||
            req.connection.remoteAddress ||
            req.socket.remoteAddress ||
            'unknown');
    }
    extractUserTier(req) {
        return req.body?.user?.tier || undefined;
    }
    isAuthenticated(req) {
        return !!(req.body?.user?.id || req.get('Authorization') || req.get('X-API-Key'));
    }
    extractAuthToken(req) {
        const authHeader = req.get('Authorization');
        if (authHeader && authHeader.startsWith('Bearer ')) {
            return authHeader.substring(7);
        }
        return undefined;
    }
    async handleRateLimitViolation(context, result) {
        try {
            const violationKey = `violations:${context.userId || context.sessionId || context.ipAddress}`;
            const violations = await this.rateLimitService['redis'].incr(violationKey);
            await this.rateLimitService['redis'].expire(violationKey, 3600);
            if (violations >= 5) {
                const identifier = context.userId || context.sessionId || context.ipAddress;
                const type = context.userId ? 'user' : context.sessionId ? 'session' : 'ip';
                await this.rateLimitService.temporaryBlock(identifier, type, Math.min(violations * 300, 3600), `Violations répétées des limites de taux (${violations} violations)`);
            }
        }
        catch (error) {
            this.logger.warn(`Failed to handle rate limit violation: ${error.message}`);
        }
    }
};
exports.SearchRateLimitMiddleware = SearchRateLimitMiddleware;
exports.SearchRateLimitMiddleware = SearchRateLimitMiddleware = SearchRateLimitMiddleware_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [search_rate_limit_service_1.SearchRateLimitService,
        jwt_service_1.JWTService])
], SearchRateLimitMiddleware);
let SuggestionRateLimitMiddleware = SuggestionRateLimitMiddleware_1 = class SuggestionRateLimitMiddleware {
    constructor(rateLimitService) {
        this.rateLimitService = rateLimitService;
        this.logger = new common_1.Logger(SuggestionRateLimitMiddleware_1.name);
    }
    async use(req, res, next) {
        try {
            const context = {
                userId: this.extractUserId(req),
                sessionId: this.extractSessionId(req),
                ipAddress: this.extractIPAddress(req),
                userAgent: req.get('User-Agent'),
                endpoint: req.path,
                operationType: 'suggest',
                userTier: this.extractUserTier(req),
                isAuthenticated: this.isAuthenticated(req)
            };
            const result = await this.rateLimitService.checkRateLimit(context);
            res.set({
                'X-RateLimit-Limit': result.limitValue.toString(),
                'X-RateLimit-Remaining': result.remaining.toString(),
                'X-RateLimit-Reset': Math.ceil(result.resetTime.getTime() / 1000).toString(),
                'X-RateLimit-Type': result.limitType,
                'X-Suggestion-RateLimit': 'true'
            });
            if (!result.allowed) {
                res.set({
                    'Retry-After': result.retryAfter?.toString() || '30'
                });
                res.status(429).json({
                    suggestions: [],
                    message: 'Limite de suggestions dépassée',
                    retryAfter: result.retryAfter
                });
                return;
            }
            next();
        }
        catch (error) {
            this.logger.error(`Suggestion rate limit error: ${error.message}`, error.stack);
            next();
        }
    }
    extractUserId(req) {
        return req.body?.user?.id || req.query?.userId || undefined;
    }
    extractSessionId(req) {
        return getSessionId(req) || req.get('X-Session-ID') || req.query?.sessionId || undefined;
    }
    extractIPAddress(req) {
        return (req.get('X-Forwarded-For')?.split(',')[0]?.trim() ||
            req.get('X-Real-IP') ||
            req.connection.remoteAddress ||
            req.socket.remoteAddress ||
            'unknown');
    }
    extractUserTier(req) {
        return req.body?.user?.tier || undefined;
    }
    isAuthenticated(req) {
        return !!(req.body?.user?.id || req.get('Authorization'));
    }
};
exports.SuggestionRateLimitMiddleware = SuggestionRateLimitMiddleware;
exports.SuggestionRateLimitMiddleware = SuggestionRateLimitMiddleware = SuggestionRateLimitMiddleware_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [search_rate_limit_service_1.SearchRateLimitService])
], SuggestionRateLimitMiddleware);
let AnalyticsRateLimitMiddleware = AnalyticsRateLimitMiddleware_1 = class AnalyticsRateLimitMiddleware {
    constructor(rateLimitService) {
        this.rateLimitService = rateLimitService;
        this.logger = new common_1.Logger(AnalyticsRateLimitMiddleware_1.name);
    }
    async use(req, res, next) {
        try {
            if (!this.isAuthenticated(req)) {
                throw new common_1.HttpException({
                    message: 'Authentification requise pour accéder aux analytics',
                    limitType: 'authentication',
                    remaining: 0,
                    resetTime: new Date()
                }, common_1.HttpStatus.TOO_MANY_REQUESTS);
            }
            const context = {
                userId: this.extractUserId(req),
                sessionId: this.extractSessionId(req),
                ipAddress: this.extractIPAddress(req),
                userAgent: req.get('User-Agent'),
                endpoint: req.path,
                operationType: 'analytics',
                userTier: this.extractUserTier(req),
                isAuthenticated: true
            };
            const result = await this.rateLimitService.checkRateLimit(context);
            res.set({
                'X-RateLimit-Limit': result.limitValue.toString(),
                'X-RateLimit-Remaining': result.remaining.toString(),
                'X-RateLimit-Reset': Math.ceil(result.resetTime.getTime() / 1000).toString(),
                'X-RateLimit-Type': result.limitType,
                'X-Analytics-RateLimit': 'true'
            });
            if (!result.allowed) {
                res.set({
                    'Retry-After': result.retryAfter?.toString() || '300'
                });
                throw new common_1.HttpException({
                    message: 'Limite d\'accès aux analytics dépassée',
                    limitType: result.limitType,
                    remaining: result.remaining,
                    resetTime: result.resetTime,
                    retryAfter: result.retryAfter
                }, common_1.HttpStatus.TOO_MANY_REQUESTS);
            }
            next();
        }
        catch (error) {
            if (error instanceof common_1.HttpException && error.getStatus() === common_1.HttpStatus.TOO_MANY_REQUESTS) {
                throw error;
            }
            this.logger.error(`Analytics rate limit error: ${error.message}`, error.stack);
            next();
        }
    }
    extractUserId(req) {
        return req.body?.user?.id || req.query?.userId || undefined;
    }
    extractSessionId(req) {
        return getSessionId(req) || req.get('X-Session-ID') || req.query?.sessionId || undefined;
    }
    extractIPAddress(req) {
        return (req.get('X-Forwarded-For')?.split(',')[0]?.trim() ||
            req.get('X-Real-IP') ||
            req.connection.remoteAddress ||
            req.socket.remoteAddress ||
            'unknown');
    }
    extractUserTier(req) {
        return req.body?.user?.tier || undefined;
    }
    isAuthenticated(req) {
        return !!(req.body?.user?.id || req.get('Authorization'));
    }
};
exports.AnalyticsRateLimitMiddleware = AnalyticsRateLimitMiddleware;
exports.AnalyticsRateLimitMiddleware = AnalyticsRateLimitMiddleware = AnalyticsRateLimitMiddleware_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [search_rate_limit_service_1.SearchRateLimitService])
], AnalyticsRateLimitMiddleware);
let GlobalRateLimitMiddleware = GlobalRateLimitMiddleware_1 = class GlobalRateLimitMiddleware {
    constructor(rateLimitService) {
        this.rateLimitService = rateLimitService;
        this.logger = new common_1.Logger(GlobalRateLimitMiddleware_1.name);
        this.suspiciousIPs = new Map();
        setInterval(() => {
            this.cleanupSuspiciousIPs();
        }, 3600000);
    }
    async use(req, res, next) {
        try {
            const ipAddress = this.extractIPAddress(req);
            if (this.isSuspiciousIP(ipAddress)) {
                this.logger.warn(`Suspicious IP detected: ${ipAddress}`);
                throw new common_1.HttpException({
                    message: 'Activité suspecte détectée',
                    limitType: 'suspicious',
                    remaining: 0,
                    resetTime: new Date(Date.now() + 3600000),
                    retryAfter: 3600
                }, common_1.HttpStatus.TOO_MANY_REQUESTS);
            }
            const context = {
                userId: this.extractUserId(req),
                sessionId: this.extractSessionId(req),
                ipAddress,
                userAgent: req.get('User-Agent'),
                endpoint: req.path,
                operationType: this.determineOperationType(req.path),
                userTier: this.extractUserTier(req),
                isAuthenticated: this.isAuthenticated(req)
            };
            const globalResult = await this.rateLimitService.checkRateLimit({
                ...context,
                userId: undefined,
                sessionId: undefined
            });
            if (!globalResult.allowed) {
                this.markSuspiciousIP(ipAddress);
                throw new common_1.HttpException({
                    message: 'Limite globale dépassée',
                    limitType: 'global',
                    remaining: 0,
                    resetTime: globalResult.resetTime,
                    retryAfter: globalResult.retryAfter
                }, common_1.HttpStatus.TOO_MANY_REQUESTS);
            }
            next();
        }
        catch (error) {
            if (error instanceof common_1.HttpException && error.getStatus() === common_1.HttpStatus.TOO_MANY_REQUESTS) {
                throw error;
            }
            this.logger.error(`Global rate limit error: ${error.message}`, error.stack);
            next();
        }
    }
    isSuspiciousIP(ipAddress) {
        const suspicious = this.suspiciousIPs.get(ipAddress);
        if (!suspicious)
            return false;
        const oneHourAgo = new Date(Date.now() - 3600000);
        return suspicious.count > 10 && suspicious.lastSeen > oneHourAgo;
    }
    markSuspiciousIP(ipAddress) {
        const existing = this.suspiciousIPs.get(ipAddress);
        if (existing) {
            existing.count++;
            existing.lastSeen = new Date();
        }
        else {
            this.suspiciousIPs.set(ipAddress, { count: 1, lastSeen: new Date() });
        }
    }
    cleanupSuspiciousIPs() {
        const oneHourAgo = new Date(Date.now() - 3600000);
        for (const [ip, data] of this.suspiciousIPs.entries()) {
            if (data.lastSeen < oneHourAgo) {
                this.suspiciousIPs.delete(ip);
            }
        }
        this.logger.debug(`Cleaned up suspicious IPs, ${this.suspiciousIPs.size} remaining`);
    }
    extractIPAddress(req) {
        return (req.get('X-Forwarded-For')?.split(',')[0]?.trim() ||
            req.get('X-Real-IP') ||
            req.connection.remoteAddress ||
            req.socket.remoteAddress ||
            'unknown');
    }
    extractUserId(req) {
        return req.body?.user?.id || req.query?.userId || undefined;
    }
    extractSessionId(req) {
        return getSessionId(req) || req.get('X-Session-ID') || req.query?.sessionId || undefined;
    }
    extractUserTier(req) {
        return req.body?.user?.tier || undefined;
    }
    isAuthenticated(req) {
        return !!(req.body?.user?.id || req.get('Authorization'));
    }
    determineOperationType(path) {
        if (path.includes('/suggest'))
            return 'suggest';
        if (path.includes('/analytics'))
            return 'analytics';
        if (path.includes('/category'))
            return 'category';
        if (path.includes('/multi-type'))
            return 'multi-type';
        return 'search';
    }
};
exports.GlobalRateLimitMiddleware = GlobalRateLimitMiddleware;
exports.GlobalRateLimitMiddleware = GlobalRateLimitMiddleware = GlobalRateLimitMiddleware_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [search_rate_limit_service_1.SearchRateLimitService])
], GlobalRateLimitMiddleware);
let ApiKeyRateLimitMiddleware = ApiKeyRateLimitMiddleware_1 = class ApiKeyRateLimitMiddleware {
    constructor(rateLimitService, jwtService) {
        this.rateLimitService = rateLimitService;
        this.jwtService = jwtService;
        this.logger = new common_1.Logger(ApiKeyRateLimitMiddleware_1.name);
    }
    async use(req, res, next) {
        try {
            const apiKey = req.get('X-API-Key');
            if (!apiKey) {
                next();
                return;
            }
            const operationType = this.determineOperationType(req.path);
            const ipAddress = this.extractIPAddress(req);
            const result = await this.rateLimitService.checkApiKeyRateLimit(apiKey, operationType, req.path, ipAddress);
            res.set({
                'X-RateLimit-Limit': result.limitValue.toString(),
                'X-RateLimit-Remaining': result.remaining.toString(),
                'X-RateLimit-Reset': Math.ceil(result.resetTime.getTime() / 1000).toString(),
                'X-RateLimit-Type': result.limitType,
                'X-API-Key-RateLimit': 'true'
            });
            if (!result.allowed) {
                res.set({
                    'Retry-After': result.retryAfter?.toString() || '300'
                });
                throw new common_1.HttpException({
                    message: 'Limite de taux API key dépassée',
                    limitType: result.limitType,
                    remaining: result.remaining,
                    resetTime: result.resetTime,
                    retryAfter: result.retryAfter
                }, common_1.HttpStatus.TOO_MANY_REQUESTS);
            }
            req.body = req.body || {};
            req.body.apiKeyRateLimitInfo = result;
            next();
        }
        catch (error) {
            if (error instanceof common_1.HttpException && error.getStatus() === common_1.HttpStatus.TOO_MANY_REQUESTS) {
                throw error;
            }
            this.logger.error(`API key rate limit error: ${error.message}`, error.stack);
            next();
        }
    }
    extractIPAddress(req) {
        return (req.get('X-Forwarded-For')?.split(',')[0]?.trim() ||
            req.get('X-Real-IP') ||
            req.connection.remoteAddress ||
            req.socket.remoteAddress ||
            'unknown');
    }
    determineOperationType(path) {
        if (path.includes('/suggest'))
            return 'suggest';
        if (path.includes('/analytics'))
            return 'analytics';
        if (path.includes('/category'))
            return 'category';
        if (path.includes('/multi-type'))
            return 'multi-type';
        return 'search';
    }
};
exports.ApiKeyRateLimitMiddleware = ApiKeyRateLimitMiddleware;
exports.ApiKeyRateLimitMiddleware = ApiKeyRateLimitMiddleware = ApiKeyRateLimitMiddleware_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [search_rate_limit_service_1.SearchRateLimitService,
        jwt_service_1.JWTService])
], ApiKeyRateLimitMiddleware);
let AdaptiveRateLimitMiddleware = AdaptiveRateLimitMiddleware_1 = class AdaptiveRateLimitMiddleware {
    constructor(rateLimitService, jwtService) {
        this.rateLimitService = rateLimitService;
        this.jwtService = jwtService;
        this.logger = new common_1.Logger(AdaptiveRateLimitMiddleware_1.name);
    }
    async use(req, res, next) {
        try {
            const context = this.buildRateLimitContext(req);
            const authToken = this.extractAuthToken(req);
            const enrichedContext = await this.rateLimitService.enrichContextWithAuth(context, authToken);
            const result = await this.rateLimitService.checkDynamicRateLimit(enrichedContext);
            res.set({
                'X-RateLimit-Limit': result.limitValue.toString(),
                'X-RateLimit-Remaining': result.remaining.toString(),
                'X-RateLimit-Reset': Math.ceil(result.resetTime.getTime() / 1000).toString(),
                'X-RateLimit-Type': result.limitType,
                'X-RateLimit-Adaptive': 'true'
            });
            if (!result.allowed) {
                res.set({
                    'Retry-After': result.retryAfter?.toString() || '60'
                });
                throw new common_1.HttpException({
                    message: 'Limite de taux adaptative dépassée',
                    limitType: result.limitType,
                    remaining: result.remaining,
                    resetTime: result.resetTime,
                    retryAfter: result.retryAfter
                }, common_1.HttpStatus.TOO_MANY_REQUESTS);
            }
            req.body = req.body || {};
            req.body.adaptiveRateLimitInfo = result;
            next();
        }
        catch (error) {
            if (error instanceof common_1.HttpException && error.getStatus() === common_1.HttpStatus.TOO_MANY_REQUESTS) {
                throw error;
            }
            this.logger.error(`Adaptive rate limit error: ${error.message}`, error.stack);
            next();
        }
    }
    buildRateLimitContext(req) {
        const path = req.path;
        const operationType = this.determineOperationType(path);
        return {
            userId: this.extractUserId(req),
            sessionId: this.extractSessionId(req),
            ipAddress: this.extractIPAddress(req),
            userAgent: req.get('User-Agent'),
            endpoint: path,
            operationType,
            userTier: this.extractUserTier(req),
            isAuthenticated: this.isAuthenticated(req)
        };
    }
    extractAuthToken(req) {
        const authHeader = req.get('Authorization');
        if (authHeader && authHeader.startsWith('Bearer ')) {
            return authHeader.substring(7);
        }
        return undefined;
    }
    extractUserId(req) {
        return req.body?.user?.id || req.query?.userId || undefined;
    }
    extractSessionId(req) {
        return getSessionId(req) || req.get('X-Session-ID') || req.query?.sessionId || undefined;
    }
    extractIPAddress(req) {
        return (req.get('X-Forwarded-For')?.split(',')[0]?.trim() ||
            req.get('X-Real-IP') ||
            req.connection.remoteAddress ||
            req.socket.remoteAddress ||
            'unknown');
    }
    extractUserTier(req) {
        return req.body?.user?.tier || undefined;
    }
    isAuthenticated(req) {
        return !!(req.body?.user?.id || req.get('Authorization') || req.get('X-API-Key'));
    }
    determineOperationType(path) {
        if (path.includes('/suggest'))
            return 'suggest';
        if (path.includes('/analytics'))
            return 'analytics';
        if (path.includes('/category'))
            return 'category';
        if (path.includes('/multi-type'))
            return 'multi-type';
        return 'search';
    }
};
exports.AdaptiveRateLimitMiddleware = AdaptiveRateLimitMiddleware;
exports.AdaptiveRateLimitMiddleware = AdaptiveRateLimitMiddleware = AdaptiveRateLimitMiddleware_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [search_rate_limit_service_1.SearchRateLimitService,
        jwt_service_1.JWTService])
], AdaptiveRateLimitMiddleware);
//# sourceMappingURL=search-rate-limit.middleware.js.map