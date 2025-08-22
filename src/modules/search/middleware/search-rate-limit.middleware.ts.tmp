import { Injectable, NestMiddleware, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { SearchRateLimitService, RateLimitContext, RateLimitResult } from '../services/search-rate-limit.service';
import { JWTService } from '../../../auth/services/jwt.service';

// Interface pour étendre Request avec sessionID
interface RequestWithSession extends Request {
  sessionID?: string;
}

// Helper pour extraire sessionID de manière sûre
function getSessionId(req: Request): string | undefined {
  return (req as any).sessionID || req.get('X-Session-ID') || req.query?.sessionId as string || undefined;
}

@Injectable()
export class SearchRateLimitMiddleware implements NestMiddleware {
  private readonly logger = new Logger(SearchRateLimitMiddleware.name);

  constructor(
    private readonly rateLimitService: SearchRateLimitService,
    private readonly jwtService: JWTService
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    try {
      // Vérifier d'abord les blocages temporaires
      const ipAddress = this.extractIPAddress(req);
      const userId = this.extractUserId(req);
      const sessionId = getSessionId(req);

      // Vérifier les blocages temporaires
      const isIpBlocked = await this.rateLimitService.isTemporarilyBlocked(ipAddress, 'ip');
      const isUserBlocked = userId ? await this.rateLimitService.isTemporarilyBlocked(userId, 'user') : false;
      const isSessionBlocked = sessionId ? await this.rateLimitService.isTemporarilyBlocked(sessionId, 'session') : false;

      if (isIpBlocked || isUserBlocked || isSessionBlocked) {
        const blockType = isUserBlocked ? 'user' : isSessionBlocked ? 'session' : 'ip';
        const blockId = isUserBlocked ? userId : isSessionBlocked ? sessionId : ipAddress;
        const blockInfo = await this.rateLimitService.getBlockInfo(blockId, blockType);

        throw new HttpException({
          message: `Accès temporairement bloqué: ${blockInfo?.reason || 'Violation des limites de taux'}`,
          limitType: 'temporary_block',
          remaining: 0,
          resetTime: blockInfo?.expiresAt ? new Date(blockInfo.expiresAt) : new Date(Date.now() + 3600000),
          retryAfter: blockInfo?.duration || 3600
        }, HttpStatus.TOO_MANY_REQUESTS);
      }

      // Construire le contexte avec authentification enrichie
      const baseContext = this.buildRateLimitContext(req);
      const authToken = this.extractAuthToken(req);
      
      // Enrichir le contexte avec les informations d'authentification
      const enrichedContext = await this.rateLimitService.enrichContextWithAuth(baseContext, authToken);
      
      // Vérifier les limites avec le contexte enrichi
      const result = await this.rateLimitService.checkRateLimit(enrichedContext);

      // Ajouter les headers de rate limiting à la réponse
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

        // Appliquer un blocage temporaire si les violations sont répétées
        await this.handleRateLimitViolation(enrichedContext, result);

        throw new HttpException({
          message: 'Limite de taux dépassée',
          limitType: result.limitType,
          remaining: result.remaining,
          resetTime: result.resetTime,
          retryAfter: result.retryAfter
        }, HttpStatus.TOO_MANY_REQUESTS);
      }

      // Ajouter les informations de rate limiting à la requête
      req.body = req.body || {};
      req.body.rateLimitInfo = result;
      req.body.userContext = enrichedContext;

      next();
    } catch (error) {
      if (error instanceof HttpException && error.getStatus() === HttpStatus.TOO_MANY_REQUESTS) {
        throw error;
      }
      
      this.logger.error(`Rate limit middleware error: ${error.message}`, error.stack);
      
      // En cas d'erreur, permettre la requête mais logger l'erreur
      next();
    }
  }

  private buildRateLimitContext(req: Request): RateLimitContext {
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

  private determineOperationType(path: string): 'search' | 'suggest' | 'analytics' | 'category' | 'multi-type' {
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

  private extractUserId(req: Request): string | undefined {
    // Extraire l'ID utilisateur depuis le token JWT ou la session
    return req.body?.user?.id || req.query?.userId as string || undefined;
  }

  private extractSessionId(req: Request): string | undefined {
    // Extraire l'ID de session depuis les cookies ou headers
    return (req as any).sessionID || req.get('X-Session-ID') || req.query?.sessionId as string || undefined;
  }

  private extractIPAddress(req: Request): string {
    // Extraire l'adresse IP réelle en tenant compte des proxies
    return (
      req.get('X-Forwarded-For')?.split(',')[0]?.trim() ||
      req.get('X-Real-IP') ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress ||
      'unknown'
    );
  }

  private extractUserTier(req: Request): 'free' | 'premium' | 'enterprise' | undefined {
    // Extraire le tier utilisateur depuis le token JWT ou la base de données
    return req.body?.user?.tier || undefined;
  }

  private isAuthenticated(req: Request): boolean {
    // Vérifier si l'utilisateur est authentifié
    return !!(req.body?.user?.id || req.get('Authorization') || req.get('X-API-Key'));
  }

  private extractAuthToken(req: Request): string | undefined {
    const authHeader = req.get('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }
    return undefined;
  }

  private async handleRateLimitViolation(context: RateLimitContext, result: RateLimitResult): Promise<void> {
    try {
      // Compter les violations récentes
      const violationKey = `violations:${context.userId || context.sessionId || context.ipAddress}`;
      const violations = await this.rateLimitService['redis'].incr(violationKey);
      await this.rateLimitService['redis'].expire(violationKey, 3600); // 1 heure

      // Appliquer un blocage temporaire après plusieurs violations
      if (violations >= 5) {
        const identifier = context.userId || context.sessionId || context.ipAddress;
        const type = context.userId ? 'user' : context.sessionId ? 'session' : 'ip';
        
        await this.rateLimitService.temporaryBlock(
          identifier,
          type,
          Math.min(violations * 300, 3600), // Blocage progressif, max 1h
          `Violations répétées des limites de taux (${violations} violations)`
        );
      }
    } catch (error) {
      this.logger.warn(`Failed to handle rate limit violation: ${error.message}`);
    }
  }
}

/**
 * Middleware spécialisé pour les suggestions avec rate limiting plus strict
 */
@Injectable()
export class SuggestionRateLimitMiddleware implements NestMiddleware {
  private readonly logger = new Logger(SuggestionRateLimitMiddleware.name);

  constructor(private readonly rateLimitService: SearchRateLimitService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    try {
      const context: RateLimitContext = {
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

      // Headers spécifiques aux suggestions
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

        // Pour les suggestions, retourner une réponse vide plutôt qu'une erreur
        res.status(429).json({
          suggestions: [],
          message: 'Limite de suggestions dépassée',
          retryAfter: result.retryAfter
        });
        return;
      }

      next();
    } catch (error) {
      this.logger.error(`Suggestion rate limit error: ${error.message}`, error.stack);
      
      // En cas d'erreur, permettre la requête
      next();
    }
  }

  private extractUserId(req: Request): string | undefined {
    return req.body?.user?.id || req.query?.userId as string || undefined;
  }

  private extractSessionId(req: Request): string | undefined {
    return getSessionId(req) || req.get('X-Session-ID') || req.query?.sessionId as string || undefined;
  }

  private extractIPAddress(req: Request): string {
    return (
      req.get('X-Forwarded-For')?.split(',')[0]?.trim() ||
      req.get('X-Real-IP') ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress ||
      'unknown'
    );
  }

  private extractUserTier(req: Request): 'free' | 'premium' | 'enterprise' | undefined {
    return req.body?.user?.tier || undefined;
  }

  private isAuthenticated(req: Request): boolean {
    return !!(req.body?.user?.id || req.get('Authorization'));
  }
}

/**
 * Middleware pour rate limiting des analytics avec authentification requise
 */
@Injectable()
export class AnalyticsRateLimitMiddleware implements NestMiddleware {
  private readonly logger = new Logger(AnalyticsRateLimitMiddleware.name);

  constructor(private readonly rateLimitService: SearchRateLimitService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    try {
      // Vérifier l'authentification pour les analytics
      if (!this.isAuthenticated(req)) {
        throw new HttpException({
          message: 'Authentification requise pour accéder aux analytics',
          limitType: 'authentication',
          remaining: 0,
          resetTime: new Date()
        }, HttpStatus.TOO_MANY_REQUESTS);
      }

      const context: RateLimitContext = {
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
          'Retry-After': result.retryAfter?.toString() || '300' // 5 minutes pour analytics
        });

        throw new HttpException({
          message: 'Limite d\'accès aux analytics dépassée',
          limitType: result.limitType,
          remaining: result.remaining,
          resetTime: result.resetTime,
          retryAfter: result.retryAfter
        }, HttpStatus.TOO_MANY_REQUESTS);
      }

      next();
    } catch (error) {
      if (error instanceof HttpException && error.getStatus() === HttpStatus.TOO_MANY_REQUESTS) {
        throw error;
      }
      
      this.logger.error(`Analytics rate limit error: ${error.message}`, error.stack);
      next();
    }
  }

  private extractUserId(req: Request): string | undefined {
    return req.body?.user?.id || req.query?.userId as string || undefined;
  }

  private extractSessionId(req: Request): string | undefined {
    return getSessionId(req) || req.get('X-Session-ID') || req.query?.sessionId as string || undefined;
  }

  private extractIPAddress(req: Request): string {
    return (
      req.get('X-Forwarded-For')?.split(',')[0]?.trim() ||
      req.get('X-Real-IP') ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress ||
      'unknown'
    );
  }

  private extractUserTier(req: Request): 'free' | 'premium' | 'enterprise' | undefined {
    return req.body?.user?.tier || undefined;
  }

  private isAuthenticated(req: Request): boolean {
    return !!(req.body?.user?.id || req.get('Authorization'));
  }
}

/**
 * Middleware global pour rate limiting avec détection d'abus
 */
@Injectable()
export class GlobalRateLimitMiddleware implements NestMiddleware {
  private readonly logger = new Logger(GlobalRateLimitMiddleware.name);
  private readonly suspiciousIPs = new Map<string, { count: number; lastSeen: Date }>();

  constructor(private readonly rateLimitService: SearchRateLimitService) {
    // Nettoyer les IPs suspectes toutes les heures
    setInterval(() => {
      this.cleanupSuspiciousIPs();
    }, 3600000);
  }

  async use(req: Request, res: Response, next: NextFunction) {
    try {
      const ipAddress = this.extractIPAddress(req);
      
      // Vérifier si l'IP est suspecte
      if (this.isSuspiciousIP(ipAddress)) {
        this.logger.warn(`Suspicious IP detected: ${ipAddress}`);
        
        throw new HttpException({
          message: 'Activité suspecte détectée',
          limitType: 'suspicious',
          remaining: 0,
          resetTime: new Date(Date.now() + 3600000), // 1 heure
          retryAfter: 3600
        }, HttpStatus.TOO_MANY_REQUESTS);
      }

      const context: RateLimitContext = {
        userId: this.extractUserId(req),
        sessionId: this.extractSessionId(req),
        ipAddress,
        userAgent: req.get('User-Agent'),
        endpoint: req.path,
        operationType: this.determineOperationType(req.path),
        userTier: this.extractUserTier(req),
        isAuthenticated: this.isAuthenticated(req)
      };

      // Vérifier uniquement la limite globale
      const globalResult = await this.rateLimitService.checkRateLimit({
        ...context,
        userId: undefined, // Ignorer les limites utilisateur pour le check global
        sessionId: undefined
      });

      if (!globalResult.allowed) {
        // Marquer l'IP comme suspecte si elle dépasse les limites globales
        this.markSuspiciousIP(ipAddress);
        
        throw new HttpException({
          message: 'Limite globale dépassée',
          limitType: 'global',
          remaining: 0,
          resetTime: globalResult.resetTime,
          retryAfter: globalResult.retryAfter
        }, HttpStatus.TOO_MANY_REQUESTS);
      }

      next();
    } catch (error) {
      if (error instanceof HttpException && error.getStatus() === HttpStatus.TOO_MANY_REQUESTS) {
        throw error;
      }
      
      this.logger.error(`Global rate limit error: ${error.message}`, error.stack);
      next();
    }
  }

  private isSuspiciousIP(ipAddress: string): boolean {
    const suspicious = this.suspiciousIPs.get(ipAddress);
    if (!suspicious) return false;
    
    // Considérer comme suspect si plus de 10 violations dans la dernière heure
    const oneHourAgo = new Date(Date.now() - 3600000);
    return suspicious.count > 10 && suspicious.lastSeen > oneHourAgo;
  }

  private markSuspiciousIP(ipAddress: string): void {
    const existing = this.suspiciousIPs.get(ipAddress);
    if (existing) {
      existing.count++;
      existing.lastSeen = new Date();
    } else {
      this.suspiciousIPs.set(ipAddress, { count: 1, lastSeen: new Date() });
    }
  }

  private cleanupSuspiciousIPs(): void {
    const oneHourAgo = new Date(Date.now() - 3600000);
    
    for (const [ip, data] of this.suspiciousIPs.entries()) {
      if (data.lastSeen < oneHourAgo) {
        this.suspiciousIPs.delete(ip);
      }
    }
    
    this.logger.debug(`Cleaned up suspicious IPs, ${this.suspiciousIPs.size} remaining`);
  }

  private extractIPAddress(req: Request): string {
    return (
      req.get('X-Forwarded-For')?.split(',')[0]?.trim() ||
      req.get('X-Real-IP') ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress ||
      'unknown'
    );
  }

  private extractUserId(req: Request): string | undefined {
    return req.body?.user?.id || req.query?.userId as string || undefined;
  }

  private extractSessionId(req: Request): string | undefined {
    return getSessionId(req) || req.get('X-Session-ID') || req.query?.sessionId as string || undefined;
  }

  private extractUserTier(req: Request): 'free' | 'premium' | 'enterprise' | undefined {
    return req.body?.user?.tier || undefined;
  }

  private isAuthenticated(req: Request): boolean {
    return !!(req.body?.user?.id || req.get('Authorization'));
  }

  private determineOperationType(path: string): 'search' | 'suggest' | 'analytics' | 'category' | 'multi-type' {
    if (path.includes('/suggest')) return 'suggest';
    if (path.includes('/analytics')) return 'analytics';
    if (path.includes('/category')) return 'category';
    if (path.includes('/multi-type')) return 'multi-type';
    return 'search';
  }
}

/**
 * Middleware spécialisé pour rate limiting des API keys
 */
@Injectable()
export class ApiKeyRateLimitMiddleware implements NestMiddleware {
  private readonly logger = new Logger(ApiKeyRateLimitMiddleware.name);

  constructor(
    private readonly rateLimitService: SearchRateLimitService,
    private readonly jwtService: JWTService
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    try {
      const apiKey = req.get('X-API-Key');
      
      if (!apiKey) {
        // Pas d'API key, passer au middleware suivant
        next();
        return;
      }

      const operationType = this.determineOperationType(req.path);
      const ipAddress = this.extractIPAddress(req);

      // Vérifier les limites spécifiques à l'API key
      const result = await this.rateLimitService.checkApiKeyRateLimit(
        apiKey,
        operationType,
        req.path,
        ipAddress
      );

      // Headers spécifiques aux API keys
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

        throw new HttpException({
          message: 'Limite de taux API key dépassée',
          limitType: result.limitType,
          remaining: result.remaining,
          resetTime: result.resetTime,
          retryAfter: result.retryAfter
        }, HttpStatus.TOO_MANY_REQUESTS);
      }

      // Ajouter les informations à la requête
      req.body = req.body || {};
      req.body.apiKeyRateLimitInfo = result;

      next();
    } catch (error) {
      if (error instanceof HttpException && error.getStatus() === HttpStatus.TOO_MANY_REQUESTS) {
        throw error;
      }
      
      this.logger.error(`API key rate limit error: ${error.message}`, error.stack);
      next();
    }
  }

  private extractIPAddress(req: Request): string {
    return (
      req.get('X-Forwarded-For')?.split(',')[0]?.trim() ||
      req.get('X-Real-IP') ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress ||
      'unknown'
    );
  }

  private determineOperationType(path: string): 'search' | 'suggest' | 'analytics' | 'category' | 'multi-type' {
    if (path.includes('/suggest')) return 'suggest';
    if (path.includes('/analytics')) return 'analytics';
    if (path.includes('/category')) return 'category';
    if (path.includes('/multi-type')) return 'multi-type';
    return 'search';
  }
}

/**
 * Middleware pour rate limiting adaptatif basé sur la charge système
 */
@Injectable()
export class AdaptiveRateLimitMiddleware implements NestMiddleware {
  private readonly logger = new Logger(AdaptiveRateLimitMiddleware.name);

  constructor(
    private readonly rateLimitService: SearchRateLimitService,
    private readonly jwtService: JWTService
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    try {
      const context = this.buildRateLimitContext(req);
      const authToken = this.extractAuthToken(req);
      
      // Enrichir le contexte avec l'authentification
      const enrichedContext = await this.rateLimitService.enrichContextWithAuth(context, authToken);
      
      // Utiliser le rate limiting dynamique
      const result = await this.rateLimitService.checkDynamicRateLimit(enrichedContext);

      // Headers avec informations sur l'adaptation
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

        throw new HttpException({
          message: 'Limite de taux adaptative dépassée',
          limitType: result.limitType,
          remaining: result.remaining,
          resetTime: result.resetTime,
          retryAfter: result.retryAfter
        }, HttpStatus.TOO_MANY_REQUESTS);
      }

      req.body = req.body || {};
      req.body.adaptiveRateLimitInfo = result;

      next();
    } catch (error) {
      if (error instanceof HttpException && error.getStatus() === HttpStatus.TOO_MANY_REQUESTS) {
        throw error;
      }
      
      this.logger.error(`Adaptive rate limit error: ${error.message}`, error.stack);
      next();
    }
  }

  private buildRateLimitContext(req: Request): RateLimitContext {
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

  private extractAuthToken(req: Request): string | undefined {
    const authHeader = req.get('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }
    return undefined;
  }

  private extractUserId(req: Request): string | undefined {
    return req.body?.user?.id || req.query?.userId as string || undefined;
  }

  private extractSessionId(req: Request): string | undefined {
    return getSessionId(req) || req.get('X-Session-ID') || req.query?.sessionId as string || undefined;
  }

  private extractIPAddress(req: Request): string {
    return (
      req.get('X-Forwarded-For')?.split(',')[0]?.trim() ||
      req.get('X-Real-IP') ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress ||
      'unknown'
    );
  }

  private extractUserTier(req: Request): 'free' | 'premium' | 'enterprise' | undefined {
    return req.body?.user?.tier || undefined;
  }

  private isAuthenticated(req: Request): boolean {
    return !!(req.body?.user?.id || req.get('Authorization') || req.get('X-API-Key'));
  }

  private determineOperationType(path: string): 'search' | 'suggest' | 'analytics' | 'category' | 'multi-type' {
    if (path.includes('/suggest')) return 'suggest';
    if (path.includes('/analytics')) return 'analytics';
    if (path.includes('/category')) return 'category';
    if (path.includes('/multi-type')) return 'multi-type';
    return 'search';
  }
}
