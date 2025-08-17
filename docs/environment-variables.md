# Variables d'Environnement ROMAPI Auth

Ce document décrit toutes les variables d'environnement nécessaires pour configurer le système d'authentification ROMAPI.

## Table des Matières

1. [Variables Obligatoires](#variables-obligatoires)
2. [Variables Optionnelles](#variables-optionnelles)
3. [Configuration par Environnement](#configuration-par-environnement)
4. [Validation des Variables](#validation-des-variables)
5. [Sécurité](#sécurité)
6. [Exemples de Configuration](#exemples-de-configuration)

## Variables Obligatoires

### Base de Données

| Variable | Description | Exemple | Requis |
|----------|-------------|---------|---------|
| `DATABASE_URL` | URL de connexion PostgreSQL | `postgresql://user:pass@localhost:5432/romapi` | ✅ |
| `REDIS_URL` | URL de connexion Redis | `redis://localhost:6379` | ✅ |

### JWT Configuration

| Variable | Description | Exemple | Requis |
|----------|-------------|---------|---------|
| `JWT_SECRET` | Clé secrète pour signer les JWT access tokens | `your-super-secret-jwt-key-256-bits` | ✅ |
| `JWT_REFRESH_SECRET` | Clé secrète pour signer les refresh tokens | `your-refresh-secret-key-256-bits` | ✅ |
| `JWT_ACCESS_EXPIRES` | Durée de vie des access tokens | `15m` | ❌ (défaut: 15m) |
| `JWT_REFRESH_EXPIRES` | Durée de vie des refresh tokens | `7d` | ❌ (défaut: 7d) |

### Application

| Variable | Description | Exemple | Requis |
|----------|-------------|---------|---------|
| `PORT` | Port d'écoute du service | `3001` | ❌ (défaut: 3001) |
| `NODE_ENV` | Environnement d'exécution | `production` | ✅ |
| `API_PREFIX` | Préfixe des routes API | `api/v1` | ❌ (défaut: vide) |

## Variables Optionnelles

### OAuth2 Providers

#### Google OAuth2

| Variable | Description | Exemple | Requis |
|----------|-------------|---------|---------|
| `GOOGLE_CLIENT_ID` | Client ID Google OAuth2 | `123456789-abc.apps.googleusercontent.com` | ❌ |
| `GOOGLE_CLIENT_SECRET` | Client Secret Google OAuth2 | `GOCSPX-abcdefghijklmnopqrstuvwxyz` | ❌ |
| `GOOGLE_CALLBACK_URL` | URL de callback Google | `https://api.romapi.com/auth/oauth/google/callback` | ❌ |

#### GitHub OAuth2

| Variable | Description | Exemple | Requis |
|----------|-------------|---------|---------|
| `GITHUB_CLIENT_ID` | Client ID GitHub OAuth2 | `Iv1.abcdefghijklmnop` | ❌ |
| `GITHUB_CLIENT_SECRET` | Client Secret GitHub OAuth2 | `abcdefghijklmnopqrstuvwxyz1234567890abcd` | ❌ |
| `GITHUB_CALLBACK_URL` | URL de callback GitHub | `https://api.romapi.com/auth/oauth/github/callback` | ❌ |

#### LinkedIn OAuth2

| Variable | Description | Exemple | Requis |
|----------|-------------|---------|---------|
| `LINKEDIN_CLIENT_ID` | Client ID LinkedIn OAuth2 | `86abcdefghijklmn` | ❌ |
| `LINKEDIN_CLIENT_SECRET` | Client Secret LinkedIn OAuth2 | `AbCdEfGhIjKlMnOp` | ❌ |
| `LINKEDIN_CALLBACK_URL` | URL de callback LinkedIn | `https://api.romapi.com/auth/oauth/linkedin/callback` | ❌ |

### Email Configuration

| Variable | Description | Exemple | Requis |
|----------|-------------|---------|---------|
| `SMTP_HOST` | Serveur SMTP | `smtp.gmail.com` | ❌ |
| `SMTP_PORT` | Port SMTP | `587` | ❌ (défaut: 587) |
| `SMTP_SECURE` | Utiliser SSL/TLS | `false` | ❌ (défaut: false) |
| `SMTP_USER` | Utilisateur SMTP | `noreply@romapi.com` | ❌ |
| `SMTP_PASS` | Mot de passe SMTP | `your-app-password` | ❌ |
| `EMAIL_FROM` | Adresse expéditeur | `ROMAPI <noreply@romapi.com>` | ❌ |
| `FRONTEND_URL` | URL du frontend pour les liens | `https://app.romapi.com` | ❌ |

### Rate Limiting

| Variable | Description | Exemple | Requis |
|----------|-------------|---------|---------|
| `RATE_LIMIT_WINDOW_MS` | Fenêtre de rate limiting (ms) | `900000` | ❌ (défaut: 15min) |
| `RATE_LIMIT_MAX_REQUESTS` | Nombre max de requêtes par fenêtre | `100` | ❌ (défaut: 100) |
| `RATE_LIMIT_SKIP_SUCCESSFUL_REQUESTS` | Ignorer les requêtes réussies | `false` | ❌ (défaut: false) |

### Sécurité

| Variable | Description | Exemple | Requis |
|----------|-------------|---------|---------|
| `BCRYPT_SALT_ROUNDS` | Nombre de rounds bcrypt | `12` | ❌ (défaut: 12) |
| `PASSWORD_MIN_LENGTH` | Longueur minimale du mot de passe | `8` | ❌ (défaut: 8) |
| `MAX_LOGIN_ATTEMPTS` | Tentatives de connexion max | `5` | ❌ (défaut: 5) |
| `ACCOUNT_LOCK_TIME_MS` | Durée de verrouillage (ms) | `900000` | ❌ (défaut: 15min) |
| `CORS_ORIGIN` | Origines CORS autorisées | `https://app.romapi.com,https://admin.romapi.com` | ❌ |

### Logging et Monitoring

| Variable | Description | Exemple | Requis |
|----------|-------------|---------|---------|
| `LOG_LEVEL` | Niveau de log | `info` | ❌ (défaut: info) |
| `LOG_FORMAT` | Format des logs | `json` | ❌ (défaut: combined) |
| `ENABLE_AUDIT_LOGS` | Activer les logs d'audit | `true` | ❌ (défaut: true) |
| `METRICS_ENABLED` | Activer les métriques | `true` | ❌ (défaut: false) |
| `HEALTH_CHECK_TIMEOUT` | Timeout health check (ms) | `5000` | ❌ (défaut: 5000) |

### Microservices

| Variable | Description | Exemple | Requis |
|----------|-------------|---------|---------|
| `SERVICE_TOKEN` | Token pour communication inter-services | `your-service-secret-token` | ❌ |
| `USER_SERVICE_URL` | URL du service utilisateurs | `http://user-service:3002` | ❌ |
| `PRODUCT_SERVICE_URL` | URL du service produits | `http://product-service:3003` | ❌ |
| `NOTIFICATION_SERVICE_URL` | URL du service notifications | `http://notification-service:3004` | ❌ |

## Configuration par Environnement

### Développement (.env.development)

```bash
# Base de données
DATABASE_URL=postgresql://romapi:password@localhost:5432/romapi_dev
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=dev-jwt-secret-key-not-for-production
JWT_REFRESH_SECRET=dev-refresh-secret-key-not-for-production
JWT_ACCESS_EXPIRES=1h
JWT_REFRESH_EXPIRES=30d

# Application
NODE_ENV=development
PORT=3001
LOG_LEVEL=debug
CORS_ORIGIN=http://localhost:3000,http://localhost:3001

# Email (utiliser un service de test comme Mailtrap)
SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=2525
SMTP_USER=your-mailtrap-user
SMTP_PASS=your-mailtrap-pass
EMAIL_FROM=ROMAPI Dev <dev@romapi.com>
FRONTEND_URL=http://localhost:3000

# OAuth2 (utiliser des apps de test)
GOOGLE_CLIENT_ID=your-dev-google-client-id
GOOGLE_CLIENT_SECRET=your-dev-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3001/auth/oauth/google/callback

# Rate limiting (plus permissif en dev)
RATE_LIMIT_MAX_REQUESTS=1000
MAX_LOGIN_ATTEMPTS=10

# Sécurité (moins strict en dev)
BCRYPT_SALT_ROUNDS=10
ACCOUNT_LOCK_TIME_MS=60000

# Monitoring
ENABLE_AUDIT_LOGS=true
METRICS_ENABLED=true
```

### Test (.env.test)

```bash
# Base de données de test
DATABASE_URL=postgresql://romapi:password@localhost:5432/romapi_test
REDIS_URL=redis://localhost:6379/1

# JWT (clés de test)
JWT_SECRET=test-jwt-secret-key
JWT_REFRESH_SECRET=test-refresh-secret-key
JWT_ACCESS_EXPIRES=5m
JWT_REFRESH_EXPIRES=1h

# Application
NODE_ENV=test
PORT=3001
LOG_LEVEL=error

# Email (mock en test)
SMTP_HOST=localhost
SMTP_PORT=1025
EMAIL_FROM=ROMAPI Test <test@romapi.com>
FRONTEND_URL=http://localhost:3000

# Rate limiting (désactivé en test)
RATE_LIMIT_MAX_REQUESTS=10000
MAX_LOGIN_ATTEMPTS=100

# Sécurité (rapide en test)
BCRYPT_SALT_ROUNDS=4
ACCOUNT_LOCK_TIME_MS=1000

# Monitoring (minimal en test)
ENABLE_AUDIT_LOGS=false
METRICS_ENABLED=false
```

### Production (.env.production)

```bash
# Base de données
DATABASE_URL=postgresql://romapi:${DB_PASSWORD}@db.romapi.com:5432/romapi
REDIS_URL=redis://:${REDIS_PASSWORD}@redis.romapi.com:6379

# JWT (clés sécurisées)
JWT_SECRET=${JWT_SECRET}
JWT_REFRESH_SECRET=${JWT_REFRESH_SECRET}
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=7d

# Application
NODE_ENV=production
PORT=3001
LOG_LEVEL=warn
CORS_ORIGIN=https://app.romapi.com,https://admin.romapi.com

# Email (service de production)
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=${SENDGRID_API_KEY}
EMAIL_FROM=ROMAPI <noreply@romapi.com>
FRONTEND_URL=https://app.romapi.com

# OAuth2 (apps de production)
GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID}
GOOGLE_CLIENT_SECRET=${GOOGLE_CLIENT_SECRET}
GOOGLE_CALLBACK_URL=https://api.romapi.com/auth/oauth/google/callback

GITHUB_CLIENT_ID=${GITHUB_CLIENT_ID}
GITHUB_CLIENT_SECRET=${GITHUB_CLIENT_SECRET}
GITHUB_CALLBACK_URL=https://api.romapi.com/auth/oauth/github/callback

LINKEDIN_CLIENT_ID=${LINKEDIN_CLIENT_ID}
LINKEDIN_CLIENT_SECRET=${LINKEDIN_CLIENT_SECRET}
LINKEDIN_CALLBACK_URL=https://api.romapi.com/auth/oauth/linkedin/callback

# Rate limiting (strict en production)
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
MAX_LOGIN_ATTEMPTS=5

# Sécurité (maximum en production)
BCRYPT_SALT_ROUNDS=12
PASSWORD_MIN_LENGTH=8
ACCOUNT_LOCK_TIME_MS=900000

# Monitoring (complet en production)
ENABLE_AUDIT_LOGS=true
METRICS_ENABLED=true
HEALTH_CHECK_TIMEOUT=5000

# Microservices
SERVICE_TOKEN=${SERVICE_TOKEN}
USER_SERVICE_URL=http://user-service:3002
PRODUCT_SERVICE_URL=http://product-service:3003
NOTIFICATION_SERVICE_URL=http://notification-service:3004
```

## Validation des Variables

### Service de Validation

```typescript
// src/config/env-validation.service.ts
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Joi from 'joi';

@Injectable()
export class EnvValidationService {
  private readonly schema = Joi.object({
    // Base de données
    DATABASE_URL: Joi.string().uri().required(),
    REDIS_URL: Joi.string().uri().required(),

    // JWT
    JWT_SECRET: Joi.string().min(32).required(),
    JWT_REFRESH_SECRET: Joi.string().min(32).required(),
    JWT_ACCESS_EXPIRES: Joi.string().default('15m'),
    JWT_REFRESH_EXPIRES: Joi.string().default('7d'),

    // Application
    NODE_ENV: Joi.string().valid('development', 'test', 'production').required(),
    PORT: Joi.number().port().default(3001),
    API_PREFIX: Joi.string().default(''),

    // OAuth2
    GOOGLE_CLIENT_ID: Joi.string().optional(),
    GOOGLE_CLIENT_SECRET: Joi.string().optional(),
    GOOGLE_CALLBACK_URL: Joi.string().uri().optional(),

    GITHUB_CLIENT_ID: Joi.string().optional(),
    GITHUB_CLIENT_SECRET: Joi.string().optional(),
    GITHUB_CALLBACK_URL: Joi.string().uri().optional(),

    LINKEDIN_CLIENT_ID: Joi.string().optional(),
    LINKEDIN_CLIENT_SECRET: Joi.string().optional(),
    LINKEDIN_CALLBACK_URL: Joi.string().uri().optional(),

    // Email
    SMTP_HOST: Joi.string().optional(),
    SMTP_PORT: Joi.number().port().default(587),
    SMTP_SECURE: Joi.boolean().default(false),
    SMTP_USER: Joi.string().optional(),
    SMTP_PASS: Joi.string().optional(),
    EMAIL_FROM: Joi.string().email().optional(),
    FRONTEND_URL: Joi.string().uri().optional(),

    // Rate limiting
    RATE_LIMIT_WINDOW_MS: Joi.number().positive().default(900000),
    RATE_LIMIT_MAX_REQUESTS: Joi.number().positive().default(100),
    RATE_LIMIT_SKIP_SUCCESSFUL_REQUESTS: Joi.boolean().default(false),

    // Sécurité
    BCRYPT_SALT_ROUNDS: Joi.number().min(4).max(15).default(12),
    PASSWORD_MIN_LENGTH: Joi.number().min(6).max(128).default(8),
    MAX_LOGIN_ATTEMPTS: Joi.number().positive().default(5),
    ACCOUNT_LOCK_TIME_MS: Joi.number().positive().default(900000),
    CORS_ORIGIN: Joi.string().optional(),

    // Logging
    LOG_LEVEL: Joi.string().valid('error', 'warn', 'info', 'debug').default('info'),
    LOG_FORMAT: Joi.string().valid('combined', 'json', 'simple').default('combined'),
    ENABLE_AUDIT_LOGS: Joi.boolean().default(true),
    METRICS_ENABLED: Joi.boolean().default(false),
    HEALTH_CHECK_TIMEOUT: Joi.number().positive().default(5000),

    // Microservices
    SERVICE_TOKEN: Joi.string().optional(),
    USER_SERVICE_URL: Joi.string().uri().optional(),
    PRODUCT_SERVICE_URL: Joi.string().uri().optional(),
    NOTIFICATION_SERVICE_URL: Joi.string().uri().optional(),
  });

  constructor(private readonly configService: ConfigService) {}

  validate(): void {
    const config = {
      DATABASE_URL: this.configService.get('DATABASE_URL'),
      REDIS_URL: this.configService.get('REDIS_URL'),
      JWT_SECRET: this.configService.get('JWT_SECRET'),
      JWT_REFRESH_SECRET: this.configService.get('JWT_REFRESH_SECRET'),
      NODE_ENV: this.configService.get('NODE_ENV'),
      // ... autres variables
    };

    const { error, value } = this.schema.validate(config, {
      allowUnknown: true,
      abortEarly: false,
    });

    if (error) {
      const errorMessages = error.details.map(detail => detail.message).join(', ');
      throw new Error(`Environment validation failed: ${errorMessages}`);
    }

    console.log('✅ Environment variables validated successfully');
  }

  getValidatedConfig() {
    this.validate();
    return this.configService;
  }
}
```

### Utilisation dans l'Application

```typescript
// src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { EnvValidationService } from './config/env-validation.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Valider les variables d'environnement au démarrage
  const envValidation = app.get(EnvValidationService);
  envValidation.validate();
  
  const port = process.env.PORT || 3001;
  await app.listen(port);
  
  console.log(`🚀 Auth Service running on port ${port}`);
}
bootstrap();
```

## Sécurité

### Bonnes Pratiques

1. **Secrets Management**
   ```bash
   # ❌ Ne jamais commiter les secrets
   JWT_SECRET=my-secret-key
   
   # ✅ Utiliser des variables d'environnement
   JWT_SECRET=${JWT_SECRET}
   
   # ✅ Ou des services de gestion de secrets
   JWT_SECRET=$(aws secretsmanager get-secret-value --secret-id jwt-secret --query SecretString --output text)
   ```

2. **Rotation des Clés**
   ```bash
   # Rotation automatique des JWT secrets
   JWT_SECRET_CURRENT=${JWT_SECRET_V2}
   JWT_SECRET_PREVIOUS=${JWT_SECRET_V1}
   ```

3. **Validation des URLs**
   ```bash
   # ✅ Valider les URLs de callback OAuth2
   GOOGLE_CALLBACK_URL=https://api.romapi.com/auth/oauth/google/callback
   
   # ❌ Éviter les URLs non sécurisées en production
   GOOGLE_CALLBACK_URL=http://localhost:3001/auth/oauth/google/callback
   ```

### Variables Sensibles

Les variables suivantes contiennent des informations sensibles et doivent être protégées :

- `DATABASE_URL` - Contient les credentials de base de données
- `JWT_SECRET` - Clé de signature des tokens
- `JWT_REFRESH_SECRET` - Clé de signature des refresh tokens
- `SMTP_PASS` - Mot de passe email
- `GOOGLE_CLIENT_SECRET` - Secret OAuth2 Google
- `GITHUB_CLIENT_SECRET` - Secret OAuth2 GitHub
- `LINKEDIN_CLIENT_SECRET` - Secret OAuth2 LinkedIn
- `SERVICE_TOKEN` - Token inter-services

## Exemples de Configuration

### Docker Compose

```yaml
# docker-compose.yml
version: '3.8'

services:
  auth-service:
    build: .
    environment:
      - DATABASE_URL=postgresql://romapi:${POSTGRES_PASSWORD}@postgres:5432/romapi
      - REDIS_URL=redis://redis:6379
      - JWT_SECRET=${JWT_SECRET}
      - JWT_REFRESH_SECRET=${JWT_REFRESH_SECRET}
      - NODE_ENV=production
    env_file:
      - .env.production
    depends_on:
      - postgres
      - redis
```

### Kubernetes ConfigMap et Secret

```yaml
# k8s/auth-configmap.yml
apiVersion: v1
kind: ConfigMap
metadata:
  name: auth-config
data:
  NODE_ENV: "production"
  PORT: "3001"
  LOG_LEVEL: "info"
  RATE_LIMIT_MAX_REQUESTS: "100"
  BCRYPT_SALT_ROUNDS: "12"
  ENABLE_AUDIT_LOGS: "true"
  FRONTEND_URL: "https://app.romapi.com"

---
# k8s/auth-secret.yml
apiVersion: v1
kind: Secret
metadata:
  name: auth-secret
type: Opaque
data:
  DATABASE_URL: <base64-encoded-database-url>
  REDIS_URL: <base64-encoded-redis-url>
  JWT_SECRET: <base64-encoded-jwt-secret>
  JWT_REFRESH_SECRET: <base64-encoded-refresh-secret>
  SMTP_PASS: <base64-encoded-smtp-password>
  GOOGLE_CLIENT_SECRET: <base64-encoded-google-secret>
```

### Terraform

```hcl
# terraform/variables.tf
variable "jwt_secret" {
  description = "JWT secret key"
  type        = string
  sensitive   = true
}

variable "database_password" {
  description = "Database password"
  type        = string
  sensitive   = true
}

# terraform/main.tf
resource "kubernetes_secret" "auth_secret" {
  metadata {
    name      = "auth-secret"
    namespace = "default"
  }

  data = {
    JWT_SECRET    = var.jwt_secret
    DATABASE_URL  = "postgresql://romapi:${var.database_password}@postgres:5432/romapi"
  }
}
```

### Script de Validation

```bash
#!/bin/bash
# scripts/validate-env.sh

echo "🔍 Validating environment variables..."

# Variables obligatoires
required_vars=(
  "DATABASE_URL"
  "REDIS_URL"
  "JWT_SECRET"
  "JWT_REFRESH_SECRET"
  "NODE_ENV"
)

missing_vars=()

for var in "${required_vars[@]}"; do
  if [[ -z "${!var}" ]]; then
    missing_vars+=("$var")
  fi
done

if [[ ${#missing_vars[@]} -gt 0 ]]; then
  echo "❌ Missing required environment variables:"
  printf '   - %s\n' "${missing_vars[@]}"
  exit 1
fi

# Validation des formats
if [[ ! "$DATABASE_URL" =~ ^postgresql:// ]]; then
  echo "❌ DATABASE_URL must start with postgresql://"
  exit 1
fi

if [[ ! "$REDIS_URL" =~ ^redis:// ]]; then
  echo "❌ REDIS_URL must start with redis://"
  exit 1
fi

if [[ ${#JWT_SECRET} -lt 32 ]]; then
  echo "❌ JWT_SECRET must be at least 32 characters long"
  exit 1
fi

if [[ "$NODE_ENV" != "development" && "$NODE_ENV" != "test" && "$NODE_ENV" != "production" ]]; then
  echo "❌ NODE_ENV must be one of: development, test, production"
  exit 1
fi

echo "✅ All environment variables are valid!"
```

Cette documentation fournit une référence complète pour configurer toutes les variables d'environnement nécessaires au système d'authentification ROMAPI, avec des exemples pour différents environnements et des bonnes pratiques de sécurité.