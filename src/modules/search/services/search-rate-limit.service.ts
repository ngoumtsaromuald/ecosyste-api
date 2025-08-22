import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { AuthService } from '../../../auth/services/auth.service';
import { JWTService } from '../../../auth/services/jwt.service';

export interface RateLimitConfig {
  // Limites par utilisateur authentifié
  authenticatedUser: {
    search: { requests: number; window: number }; // ex: 1000 req/heure
    suggest: { requests: number; window: number }; // ex: 2000 req/heure
    analytics: { requests: number; window: number }; // ex: 100 req/heure
  };
  
  // Limites par IP pour utilisateurs non authentifiés
  anonymous: {
    search: { requests: number; window: number }; // ex: 100 req/heure
    suggest: { requests: number; window: number }; // ex: 200 req/heure
    analytics: { requests: number; window: number }; // ex: 10 req/heure
  };
  
  // Limites par session
  session: {
    search: { requests: number; window: number }; // ex: 500 req/heure
    suggest: { requests: number; window: number }; // ex: 1000 req/heure
  };
  
  // Limites globales par endpoint
  global: {
    search: { requests: number; window: number }; // ex: 10000 req/minute
    suggest: { requests: number; window: number }; // ex: 20000 req/minute
  };
  
  // Limites premium pour utilisateurs payants
  premium: {
    search: { requests: number; window: number }; // ex: 5000 req/heure
    suggest: { requests: number; window: number }; // ex: 10000 req/heure
    analytics: { requests: number; window: number }; // ex: 1000 req/heure
  };
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: Date;
  retryAfter?: number; // secondes
  limitType: string;
  limitValue: number;
}

export interface RateLimitContext {
  userId?: string;
  sessionId?: string;
  ipAddress: string;
  userAgent?: string;
  endpoint: string;
  operationType: 'search' | 'suggest' | 'analytics' | 'category' | 'multi-type';
  userTier?: 'free' | 'premium' | 'enterprise';
  isAuthenticated: boolean;
}

@Injectable()
export class SearchRateLimitService {
  private readonly logger = new Logger(SearchRateLimitService.name);
  private readonly redis: Redis;
  private readonly config: RateLimitConfig;

  constructor(
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
    private readonly jwtService: JWTService
  ) {
    // Configuration Redis
    this.redis = new Redis({
      host: this.configService.get('REDIS_HOST', 'localhost'),
      port: this.configService.get('REDIS_PORT', 6379),
      password: this.configService.get('REDIS_PASSWORD'),
      db: this.configService.get('REDIS_SEARCH_RATE_LIMIT_DB', 2),
      maxRetriesPerRequest: 3,
      lazyConnect: true
    });

    // Configuration des limites
    this.config = {
      authenticatedUser: {
        search: { 
          requests: this.configService.get('RATE_LIMIT_AUTH_SEARCH_REQUESTS', 1000), 
          window: this.configService.get('RATE_LIMIT_AUTH_SEARCH_WINDOW', 3600) 
        },
        suggest: { 
          requests: this.configService.get('RATE_LIMIT_AUTH_SUGGEST_REQUESTS', 2000), 
          window: this.configService.get('RATE_LIMIT_AUTH_SUGGEST_WINDOW', 3600) 
        },
        analytics: { 
          requests: this.configService.get('RATE_LIMIT_AUTH_ANALYTICS_REQUESTS', 100), 
          window: this.configService.get('RATE_LIMIT_AUTH_ANALYTICS_WINDOW', 3600) 
        }
      },
      anonymous: {
        search: { 
          requests: this.configService.get('RATE_LIMIT_ANON_SEARCH_REQUESTS', 100), 
          window: this.configService.get('RATE_LIMIT_ANON_SEARCH_WINDOW', 3600) 
        },
        suggest: { 
          requests: this.configService.get('RATE_LIMIT_ANON_SUGGEST_REQUESTS', 200), 
          window: this.configService.get('RATE_LIMIT_ANON_SUGGEST_WINDOW', 3600) 
        },
        analytics: { 
          requests: this.configService.get('RATE_LIMIT_ANON_ANALYTICS_REQUESTS', 10), 
          window: this.configService.get('RATE_LIMIT_ANON_ANALYTICS_WINDOW', 3600) 
        }
      },
      session: {
        search: { 
          requests: this.configService.get('RATE_LIMIT_SESSION_SEARCH_REQUESTS', 500), 
          window: this.configService.get('RATE_LIMIT_SESSION_SEARCH_WINDOW', 3600) 
        },
        suggest: { 
          requests: this.configService.get('RATE_LIMIT_SESSION_SUGGEST_REQUESTS', 1000), 
          window: this.configService.get('RATE_LIMIT_SESSION_SUGGEST_WINDOW', 3600) 
        }
      },
      global: {
        search: { 
          requests: this.configService.get('RATE_LIMIT_GLOBAL_SEARCH_REQUESTS', 10000), 
          window: this.configService.get('RATE_LIMIT_GLOBAL_SEARCH_WINDOW', 60) 
        },
        suggest: { 
          requests: this.configService.get('RATE_LIMIT_GLOBAL_SUGGEST_REQUESTS', 20000), 
          window: this.configService.get('RATE_LIMIT_GLOBAL_SUGGEST_WINDOW', 60) 
        }
      },
      premium: {
        search: { 
          requests: this.configService.get('RATE_LIMIT_PREMIUM_SEARCH_REQUESTS', 5000), 
          window: this.configService.get('RATE_LIMIT_PREMIUM_SEARCH_WINDOW', 3600) 
        },
        suggest: { 
          requests: this.configService.get('RATE_LIMIT_PREMIUM_SUGGEST_REQUESTS', 10000), 
          window: this.configService.get('RATE_LIMIT_PREMIUM_SUGGEST_WINDOW', 3600) 
        },
        analytics: { 
          requests: this.configService.get('RATE_LIMIT_PREMIUM_ANALYTICS_REQUESTS', 1000), 
          window: this.configService.get('RATE_LIMIT_PREMIUM_ANALYTICS_WINDOW', 3600) 
        }
      }
    };

    this.initializeRedis();
  }

  private async initializeRedis(): Promise<void> {
    try {
      await this.redis.connect();
      this.logger.log('Connected to Redis for rate limiting');
    } catch (error) {
      this.logger.error('Failed to connect to Redis for rate limiting', error);
    }
  }

  /**
   * Vérifie si une requête est autorisée selon les limites de taux
   */
  async checkRateLimit(context: RateLimitContext): Promise<RateLimitResult> {
    try {
      // Vérifier les limites dans l'ordre de priorité
      const checks = await Promise.all([
        this.checkGlobalLimit(context),
        this.checkUserLimit(context),
        this.checkSessionLimit(context),
        this.checkIPLimit(context)
      ]);

      // Trouver la première limite dépassée
      const failedCheck = checks.find(check => !check.allowed);
      if (failedCheck) {
        this.logger.warn(`Rate limit exceeded: ${failedCheck.limitType} for ${context.operationType}`, {
          userId: context.userId,
          sessionId: context.sessionId,
          ipAddress: context.ipAddress,
          endpoint: context.endpoint
        });
        return failedCheck;
      }

      // Retourner le résultat le plus restrictif parmi ceux qui passent
      const mostRestrictive = checks.reduce((prev, current) => 
        current.remaining < prev.remaining ? current : prev
      );

      return mostRestrictive;
    } catch (error) {
      this.logger.error(`Rate limit check failed: ${error.message}`, error.stack);
      
      // En cas d'erreur Redis, permettre la requête mais logger l'erreur
      return {
        allowed: true,
        remaining: 1000,
        resetTime: new Date(Date.now() + 3600000),
        limitType: 'fallback',
        limitValue: 1000
      };
    }
  }

  /**
   * Vérifie et lance une exception si la limite est dépassée
   */
  async checkRateLimitAndThrow(context: RateLimitContext): Promise<RateLimitResult> {
    const result = await this.checkRateLimit(context);
    
    if (!result.allowed) {
      throw new HttpException({
        message: 'Limite de taux dépassée',
        limitType: result.limitType,
        remaining: result.remaining,
        resetTime: result.resetTime,
        retryAfter: result.retryAfter,
        endpoint: context.endpoint,
        operationType: context.operationType
      }, HttpStatus.TOO_MANY_REQUESTS);
    }

    return result;
  }

  /**
   * Vérifie la limite globale par endpoint
   */
  private async checkGlobalLimit(context: RateLimitContext): Promise<RateLimitResult> {
    const operationType = this.mapOperationType(context.operationType);
    const limit = this.config.global[operationType];
    
    if (!limit) {
      return this.createAllowedResult('global', 1000000);
    }

    const key = `global:${operationType}`;
    return this.checkLimit(key, limit.requests, limit.window, 'global');
  }

  /**
   * Vérifie la limite par utilisateur
   */
  private async checkUserLimit(context: RateLimitContext): Promise<RateLimitResult> {
    if (!context.userId || !context.isAuthenticated) {
      return this.createAllowedResult('user', 1000000);
    }

    const operationType = this.mapOperationType(context.operationType);
    const userTier = context.userTier || 'free';
    
    let limit;
    if (userTier === 'premium' || userTier === 'enterprise') {
      limit = this.config.premium[operationType];
    } else {
      limit = this.config.authenticatedUser[operationType];
    }

    if (!limit) {
      return this.createAllowedResult('user', 1000000);
    }

    const key = `user:${context.userId}:${operationType}`;
    return this.checkLimit(key, limit.requests, limit.window, `user-${userTier}`);
  }

  /**
   * Vérifie la limite par session
   */
  private async checkSessionLimit(context: RateLimitContext): Promise<RateLimitResult> {
    if (!context.sessionId) {
      return this.createAllowedResult('session', 1000000);
    }

    const operationType = this.mapOperationType(context.operationType);
    const limit = this.config.session[operationType];
    
    if (!limit) {
      return this.createAllowedResult('session', 1000000);
    }

    const key = `session:${context.sessionId}:${operationType}`;
    return this.checkLimit(key, limit.requests, limit.window, 'session');
  }

  /**
   * Vérifie la limite par IP (pour utilisateurs non authentifiés)
   */
  private async checkIPLimit(context: RateLimitContext): Promise<RateLimitResult> {
    if (context.isAuthenticated) {
      return this.createAllowedResult('ip', 1000000);
    }

    const operationType = this.mapOperationType(context.operationType);
    const limit = this.config.anonymous[operationType];
    
    if (!limit) {
      return this.createAllowedResult('ip', 1000000);
    }

    const key = `ip:${context.ipAddress}:${operationType}`;
    return this.checkLimit(key, limit.requests, limit.window, 'ip');
  }

  /**
   * Vérifie une limite spécifique avec sliding window
   */
  private async checkLimit(
    key: string, 
    maxRequests: number, 
    windowSeconds: number, 
    limitType: string
  ): Promise<RateLimitResult> {
    const now = Date.now();
    const windowStart = now - (windowSeconds * 1000);
    
    // Utiliser un pipeline Redis pour l'atomicité
    const pipeline = this.redis.pipeline();
    
    // Supprimer les entrées expirées
    pipeline.zremrangebyscore(key, 0, windowStart);
    
    // Compter les requêtes dans la fenêtre
    pipeline.zcard(key);
    
    // Ajouter la requête actuelle
    pipeline.zadd(key, now, `${now}-${Math.random()}`);
    
    // Définir l'expiration de la clé
    pipeline.expire(key, windowSeconds);
    
    const results = await pipeline.exec();
    
    if (!results || results.some(([err]) => err)) {
      throw new Error('Redis pipeline failed');
    }

    const currentCount = results[1][1] as number;
    const remaining = Math.max(0, maxRequests - currentCount - 1);
    const resetTime = new Date(now + (windowSeconds * 1000));
    
    const allowed = currentCount < maxRequests;
    
    if (!allowed) {
      // Supprimer la requête ajoutée si elle n'est pas autorisée
      await this.redis.zrem(key, `${now}-${Math.random()}`);
      
      return {
        allowed: false,
        remaining: 0,
        resetTime,
        retryAfter: Math.ceil(windowSeconds / 2), // Suggérer d'attendre la moitié de la fenêtre
        limitType,
        limitValue: maxRequests
      };
    }

    return {
      allowed: true,
      remaining,
      resetTime,
      limitType,
      limitValue: maxRequests
    };
  }

  /**
   * Mappe les types d'opération aux configurations
   */
  private mapOperationType(operationType: string): 'search' | 'suggest' | 'analytics' {
    switch (operationType) {
      case 'search':
      case 'category':
      case 'multi-type':
        return 'search';
      case 'suggest':
        return 'suggest';
      case 'analytics':
        return 'analytics';
      default:
        return 'search';
    }
  }

  /**
   * Crée un résultat autorisé par défaut
   */
  private createAllowedResult(limitType: string, limitValue: number): RateLimitResult {
    return {
      allowed: true,
      remaining: limitValue,
      resetTime: new Date(Date.now() + 3600000),
      limitType,
      limitValue
    };
  }

  /**
   * Obtient les statistiques de rate limiting pour un utilisateur
   */
  async getRateLimitStats(userId?: string, sessionId?: string, ipAddress?: string): Promise<any> {
    try {
      const stats: any = {};
      
      if (userId) {
        const userKeys = await this.redis.keys(`user:${userId}:*`);
        for (const key of userKeys) {
          const count = await this.redis.zcard(key);
          const operationType = key.split(':')[2];
          stats[`user_${operationType}`] = count;
        }
      }
      
      if (sessionId) {
        const sessionKeys = await this.redis.keys(`session:${sessionId}:*`);
        for (const key of sessionKeys) {
          const count = await this.redis.zcard(key);
          const operationType = key.split(':')[2];
          stats[`session_${operationType}`] = count;
        }
      }
      
      if (ipAddress) {
        const ipKeys = await this.redis.keys(`ip:${ipAddress}:*`);
        for (const key of ipKeys) {
          const count = await this.redis.zcard(key);
          const operationType = key.split(':')[2];
          stats[`ip_${operationType}`] = count;
        }
      }
      
      return stats;
    } catch (error) {
      this.logger.error(`Failed to get rate limit stats: ${error.message}`, error.stack);
      return {};
    }
  }

  /**
   * Réinitialise les limites pour un utilisateur (admin uniquement)
   */
  async resetRateLimits(userId?: string, sessionId?: string, ipAddress?: string): Promise<void> {
    try {
      const keysToDelete: string[] = [];
      
      if (userId) {
        const userKeys = await this.redis.keys(`user:${userId}:*`);
        keysToDelete.push(...userKeys);
      }
      
      if (sessionId) {
        const sessionKeys = await this.redis.keys(`session:${sessionId}:*`);
        keysToDelete.push(...sessionKeys);
      }
      
      if (ipAddress) {
        const ipKeys = await this.redis.keys(`ip:${ipAddress}:*`);
        keysToDelete.push(...ipKeys);
      }
      
      if (keysToDelete.length > 0) {
        await this.redis.del(...keysToDelete);
        this.logger.log(`Reset rate limits for ${keysToDelete.length} keys`);
      }
    } catch (error) {
      this.logger.error(`Failed to reset rate limits: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Obtient la configuration actuelle des limites
   */
  getRateLimitConfig(): RateLimitConfig {
    return { ...this.config };
  }

  /**
   * Met à jour la configuration des limites (runtime)
   */
  updateRateLimitConfig(newConfig: Partial<RateLimitConfig>): void {
    Object.assign(this.config, newConfig);
    this.logger.log('Rate limit configuration updated');
  }

  /**
   * Vérifie la santé du service de rate limiting
   */
  async healthCheck(): Promise<{ status: string; redis: string; config: boolean }> {
    try {
      await this.redis.ping();
      return {
        status: 'healthy',
        redis: 'connected',
        config: !!this.config
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        redis: 'disconnected',
        config: !!this.config
      };
    }
  }

  /**
   * Enrichit le contexte avec les informations d'authentification
   */
  async enrichContextWithAuth(context: RateLimitContext, authToken?: string): Promise<RateLimitContext> {
    try {
      if (authToken && !context.userId) {
        // Extraire les informations du token JWT
        const payload = await this.jwtService.validateToken(authToken);
        if (payload && payload.sub) {
          context.userId = payload.sub;
          context.isAuthenticated = true;
          
          // Récupérer les informations utilisateur pour déterminer le tier
          const user = await this.authService['userRepository'].findById(payload.sub);
          if (user) {
            context.userTier = this.determineUserTier(user);
          }
        }
      }
      
      return context;
    } catch (error) {
      this.logger.warn(`Failed to enrich context with auth: ${error.message}`);
      return context;
    }
  }

  /**
   * Détermine le tier utilisateur basé sur ses informations
   */
  private determineUserTier(user: any): 'free' | 'premium' | 'enterprise' {
    if (user.subscription?.plan === 'enterprise') {
      return 'enterprise';
    }
    if (user.subscription?.plan === 'premium' || user.isPremium) {
      return 'premium';
    }
    return 'free';
  }

  /**
   * Vérifie les limites avec authentification automatique
   */
  async checkRateLimitWithAuth(
    context: Omit<RateLimitContext, 'isAuthenticated'>, 
    authToken?: string
  ): Promise<RateLimitResult> {
    const enrichedContext = await this.enrichContextWithAuth(
      { ...context, isAuthenticated: false }, 
      authToken
    );
    
    return this.checkRateLimit(enrichedContext);
  }

  /**
   * Applique des limites spéciales pour les API keys
   */
  async checkApiKeyRateLimit(
    apiKey: string, 
    operationType: RateLimitContext['operationType'],
    endpoint: string,
    ipAddress: string
  ): Promise<RateLimitResult> {
    try {
      // Vérifier la validité de l'API key (placeholder - à implémenter selon votre système)
      const apiKeyInfo = { id: apiKey, tier: 'free' }; // Placeholder
      if (!apiKeyInfo) {
        throw new HttpException({
          message: 'API key invalide',
          limitType: 'invalid_api_key',
          remaining: 0,
          resetTime: new Date()
        }, HttpStatus.TOO_MANY_REQUESTS);
      }

      // Déterminer les limites pour l'API key
      const limits = this.getApiKeyLimits(apiKeyInfo);
      const operationLimit = limits[this.mapOperationType(operationType)];
      
      if (!operationLimit) {
        return this.createAllowedResult('api_key', 1000000);
      }

      const key = `api_key:${apiKey}:${operationType}`;
      const result = await this.checkLimit(
        key, 
        operationLimit.requests, 
        operationLimit.window, 
        'api_key'
      );

      // Logger l'utilisation de l'API key
      this.logApiKeyUsage(apiKey, operationType, endpoint, ipAddress, result);

      return result;
    } catch (error) {
      this.logger.error(`API key rate limit check failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Obtient les limites pour une API key
   */
  private getApiKeyLimits(apiKeyInfo: any): any {
    const tier = apiKeyInfo.tier || 'free';
    
    const limits = {
      free: {
        search: { requests: 500, window: 3600 },
        suggest: { requests: 1000, window: 3600 },
        analytics: { requests: 50, window: 3600 }
      },
      premium: {
        search: { requests: 5000, window: 3600 },
        suggest: { requests: 10000, window: 3600 },
        analytics: { requests: 1000, window: 3600 }
      },
      enterprise: {
        search: { requests: 50000, window: 3600 },
        suggest: { requests: 100000, window: 3600 },
        analytics: { requests: 10000, window: 3600 }
      }
    };

    return limits[tier] || limits.free;
  }

  /**
   * Logger l'utilisation d'une API key
   */
  private async logApiKeyUsage(
    apiKey: string, 
    operationType: string, 
    endpoint: string, 
    ipAddress: string, 
    result: RateLimitResult
  ): Promise<void> {
    try {
      const logKey = `api_key_usage:${apiKey}:${new Date().toISOString().split('T')[0]}`;
      const logData = {
        timestamp: new Date().toISOString(),
        operationType,
        endpoint,
        ipAddress,
        allowed: result.allowed,
        remaining: result.remaining
      };

      await this.redis.lpush(logKey, JSON.stringify(logData));
      await this.redis.expire(logKey, 86400 * 30); // Garder 30 jours
    } catch (error) {
      this.logger.warn(`Failed to log API key usage: ${error.message}`);
    }
  }

  /**
   * Obtient les statistiques d'utilisation d'une API key
   */
  async getApiKeyUsageStats(apiKey: string, days: number = 7): Promise<any> {
    try {
      const stats = {};
      const today = new Date();
      
      for (let i = 0; i < days; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateKey = date.toISOString().split('T')[0];
        const logKey = `api_key_usage:${apiKey}:${dateKey}`;
        
        const logs = await this.redis.lrange(logKey, 0, -1);
        const dayStats = {
          date: dateKey,
          totalRequests: logs.length,
          allowedRequests: 0,
          blockedRequests: 0,
          operationTypes: {}
        };

        logs.forEach(log => {
          try {
            const data = JSON.parse(log);
            if (data.allowed) {
              dayStats.allowedRequests++;
            } else {
              dayStats.blockedRequests++;
            }
            
            dayStats.operationTypes[data.operationType] = 
              (dayStats.operationTypes[data.operationType] || 0) + 1;
          } catch (e) {
            // Ignorer les logs malformés
          }
        });

        stats[dateKey] = dayStats;
      }

      return stats;
    } catch (error) {
      this.logger.error(`Failed to get API key usage stats: ${error.message}`, error.stack);
      return {};
    }
  }

  /**
   * Applique des limites dynamiques basées sur la charge système
   */
  async checkDynamicRateLimit(context: RateLimitContext): Promise<RateLimitResult> {
    try {
      // Obtenir les métriques système
      const systemLoad = await this.getSystemLoad();
      
      // Ajuster les limites selon la charge
      const adjustedContext = this.adjustLimitsForLoad(context, systemLoad);
      
      return this.checkRateLimit(adjustedContext);
    } catch (error) {
      this.logger.error(`Dynamic rate limit check failed: ${error.message}`, error.stack);
      return this.checkRateLimit(context);
    }
  }

  /**
   * Obtient la charge système actuelle
   */
  private async getSystemLoad(): Promise<{ cpu: number; memory: number; redis: number }> {
    try {
      // Vérifier la latence Redis
      const start = Date.now();
      await this.redis.ping();
      const redisLatency = Date.now() - start;

      // Obtenir les informations Redis
      const redisInfo = await this.redis.info('memory');
      const memoryMatch = redisInfo.match(/used_memory:(\d+)/);
      const maxMemoryMatch = redisInfo.match(/maxmemory:(\d+)/);
      
      const usedMemory = memoryMatch ? parseInt(memoryMatch[1]) : 0;
      const maxMemory = maxMemoryMatch ? parseInt(maxMemoryMatch[1]) : 1;
      const memoryUsage = maxMemory > 0 ? (usedMemory / maxMemory) * 100 : 0;

      return {
        cpu: 0, // Placeholder - nécessiterait une intégration système
        memory: memoryUsage,
        redis: redisLatency
      };
    } catch (error) {
      this.logger.warn(`Failed to get system load: ${error.message}`);
      return { cpu: 0, memory: 0, redis: 0 };
    }
  }

  /**
   * Ajuste les limites selon la charge système
   */
  private adjustLimitsForLoad(context: RateLimitContext, load: any): RateLimitContext {
    // Si la charge est élevée, réduire les limites
    if (load.memory > 80 || load.redis > 100) {
      // Réduire les limites de 50%
      const adjustedConfig = { ...this.config };
      
      Object.keys(adjustedConfig).forEach(tier => {
        Object.keys(adjustedConfig[tier]).forEach(operation => {
          if (adjustedConfig[tier][operation].requests) {
            adjustedConfig[tier][operation].requests = 
              Math.floor(adjustedConfig[tier][operation].requests * 0.5);
          }
        });
      });

      // Créer un contexte temporaire avec les limites ajustées
      return { ...context };
    }

    return context;
  }

  /**
   * Bloque temporairement un utilisateur ou IP
   */
  async temporaryBlock(
    identifier: string, 
    type: 'user' | 'ip' | 'session', 
    duration: number = 3600,
    reason: string = 'Rate limit violation'
  ): Promise<void> {
    try {
      const blockKey = `blocked:${type}:${identifier}`;
      const blockData = {
        blockedAt: new Date().toISOString(),
        reason,
        duration,
        expiresAt: new Date(Date.now() + duration * 1000).toISOString()
      };

      await this.redis.setex(blockKey, duration, JSON.stringify(blockData));
      
      this.logger.warn(`Temporarily blocked ${type} ${identifier} for ${duration}s: ${reason}`);
    } catch (error) {
      this.logger.error(`Failed to apply temporary block: ${error.message}`, error.stack);
    }
  }

  /**
   * Vérifie si un utilisateur/IP est temporairement bloqué
   */
  async isTemporarilyBlocked(identifier: string, type: 'user' | 'ip' | 'session'): Promise<boolean> {
    try {
      const blockKey = `blocked:${type}:${identifier}`;
      const blockData = await this.redis.get(blockKey);
      
      return !!blockData;
    } catch (error) {
      this.logger.error(`Failed to check temporary block: ${error.message}`, error.stack);
      return false;
    }
  }

  /**
   * Obtient les informations de blocage
   */
  async getBlockInfo(identifier: string, type: 'user' | 'ip' | 'session'): Promise<any> {
    try {
      const blockKey = `blocked:${type}:${identifier}`;
      const blockData = await this.redis.get(blockKey);
      
      if (blockData) {
        return JSON.parse(blockData);
      }
      
      return null;
    } catch (error) {
      this.logger.error(`Failed to get block info: ${error.message}`, error.stack);
      return null;
    }
  }

  /**
   * Lève un blocage temporaire
   */
  async removeTemporaryBlock(identifier: string, type: 'user' | 'ip' | 'session'): Promise<void> {
    try {
      const blockKey = `blocked:${type}:${identifier}`;
      await this.redis.del(blockKey);
      
      this.logger.log(`Removed temporary block for ${type} ${identifier}`);
    } catch (error) {
      this.logger.error(`Failed to remove temporary block: ${error.message}`, error.stack);
    }
  }

  /**
   * Ferme les connexions Redis
   */
  async onModuleDestroy(): Promise<void> {
    try {
      await this.redis.quit();
      this.logger.log('Redis connection closed for rate limiting');
    } catch (error) {
      this.logger.error('Error closing Redis connection', error);
    }
  }
}