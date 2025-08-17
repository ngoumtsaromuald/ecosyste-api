# Guide de Déploiement et Configuration ROMAPI Auth

Ce guide fournit des instructions détaillées pour déployer et configurer le système d'authentification ROMAPI dans différents environnements.

## Table des Matières

1. [Prérequis](#prérequis)
2. [Configuration Locale](#configuration-locale)
3. [Déploiement Docker](#déploiement-docker)
4. [Déploiement Kubernetes](#déploiement-kubernetes)
5. [Déploiement Cloud](#déploiement-cloud)
6. [Configuration de Production](#configuration-de-production)
7. [Monitoring et Logs](#monitoring-et-logs)
8. [Sécurité](#sécurité)
9. [Maintenance](#maintenance)
10. [Troubleshooting](#troubleshooting)

## Prérequis

### Système

- **Node.js**: Version 18.x ou supérieure
- **PostgreSQL**: Version 13.x ou supérieure
- **Redis**: Version 6.x ou supérieure
- **Docker**: Version 20.x ou supérieure (optionnel)
- **Kubernetes**: Version 1.24 ou supérieure (optionnel)

### Services Externes

- **SMTP Provider**: SendGrid, Mailgun, ou serveur SMTP
- **OAuth2 Apps**: Google, GitHub, LinkedIn (optionnel)
- **Monitoring**: Prometheus, Grafana (optionnel)
- **Logging**: ELK Stack, Fluentd (optionnel)

## Configuration Locale

### 1. Installation des Dépendances

```bash
# Cloner le repository
git clone https://github.com/romapi/auth-service.git
cd auth-service

# Installer les dépendances
npm install

# Installer les outils globaux
npm install -g @nestjs/cli prisma
```

### 2. Configuration de la Base de Données

```bash
# Démarrer PostgreSQL localement
docker run --name postgres-dev \
  -e POSTGRES_DB=romapi_dev \
  -e POSTGRES_USER=romapi \
  -e POSTGRES_PASSWORD=password \
  -p 5432:5432 \
  -d postgres:15

# Démarrer Redis localement
docker run --name redis-dev \
  -p 6379:6379 \
  -d redis:7-alpine
```

### 3. Configuration des Variables d'Environnement

```bash
# Copier le fichier d'exemple
cp .env.example .env.development

# Éditer les variables
nano .env.development
```

```bash
# .env.development
DATABASE_URL=postgresql://romapi:password@localhost:5432/romapi_dev
REDIS_URL=redis://localhost:6379
JWT_SECRET=dev-jwt-secret-key-not-for-production-use-256-bits
JWT_REFRESH_SECRET=dev-refresh-secret-key-not-for-production-use-256-bits
NODE_ENV=development
PORT=3001
LOG_LEVEL=debug
FRONTEND_URL=http://localhost:3000
```

### 4. Initialisation de la Base de Données

```bash
# Générer le client Prisma
npx prisma generate

# Exécuter les migrations
npx prisma migrate deploy

# Seed des données de développement
npx prisma db seed
```

### 5. Démarrage du Service

```bash
# Mode développement
npm run start:dev

# Mode production
npm run build
npm run start:prod

# Tests
npm run test
npm run test:e2e
```

## Déploiement Docker

### 1. Dockerfile

```dockerfile
# Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

# Copier les fichiers de dépendances
COPY package*.json ./
COPY prisma ./prisma/

# Installer les dépendances
RUN npm ci --only=production && npm cache clean --force

# Copier le code source
COPY . .

# Build de l'application
RUN npm run build

# Générer le client Prisma
RUN npx prisma generate

# Image de production
FROM node:18-alpine AS production

WORKDIR /app

# Créer un utilisateur non-root
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nestjs -u 1001

# Copier les fichiers nécessaires
COPY --from=builder --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nestjs:nodejs /app/dist ./dist
COPY --from=builder --chown=nestjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nestjs:nodejs /app/package*.json ./

# Exposer le port
EXPOSE 3001

# Changer vers l'utilisateur non-root
USER nestjs

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3001/health || exit 1

# Commande de démarrage
CMD ["npm", "run", "start:prod"]
```

### 2. Docker Compose

```yaml
# docker-compose.yml
version: '3.8'

services:
  # Base de données
  postgres:
    image: postgres:15-alpine
    container_name: romapi-postgres
    environment:
      POSTGRES_DB: romapi
      POSTGRES_USER: romapi
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./scripts/init-db.sql:/docker-entrypoint-initdb.d/init-db.sql
    ports:
      - "5432:5432"
    networks:
      - romapi-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U romapi -d romapi"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Cache Redis
  redis:
    image: redis:7-alpine
    container_name: romapi-redis
    command: redis-server --appendonly yes --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data
      - ./config/redis/redis.conf:/usr/local/etc/redis/redis.conf
    ports:
      - "6379:6379"
    networks:
      - romapi-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "redis-cli", "--raw", "incr", "ping"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Service d'authentification
  auth-service:
    build:
      context: .
      dockerfile: Dockerfile
      target: production
    container_name: romapi-auth
    environment:
      DATABASE_URL: postgresql://romapi:${POSTGRES_PASSWORD}@postgres:5432/romapi
      REDIS_URL: redis://:${REDIS_PASSWORD}@redis:6379
      JWT_SECRET: ${JWT_SECRET}
      JWT_REFRESH_SECRET: ${JWT_REFRESH_SECRET}
      NODE_ENV: production
      PORT: 3001
    ports:
      - "3001:3001"
    networks:
      - romapi-network
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3001/health"]
      interval: 30s
      timeout: 10s
      retries: 3
    volumes:
      - ./logs:/app/logs

  # Reverse Proxy
  nginx:
    image: nginx:alpine
    container_name: romapi-nginx
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./config/nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./config/nginx/ssl:/etc/nginx/ssl
      - ./logs/nginx:/var/log/nginx
    networks:
      - romapi-network
    depends_on:
      - auth-service
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:

networks:
  romapi-network:
    driver: bridge
```

### 3. Scripts de Déploiement

```bash
#!/bin/bash
# scripts/deploy-docker.sh

set -e

echo "🚀 Starting ROMAPI Auth deployment..."

# Vérifier les variables d'environnement
if [[ -z "$POSTGRES_PASSWORD" || -z "$JWT_SECRET" || -z "$JWT_REFRESH_SECRET" ]]; then
  echo "❌ Missing required environment variables"
  echo "Please set: POSTGRES_PASSWORD, JWT_SECRET, JWT_REFRESH_SECRET"
  exit 1
fi

# Arrêter les services existants
echo "🛑 Stopping existing services..."
docker-compose down

# Construire les images
echo "🔨 Building images..."
docker-compose build --no-cache

# Démarrer les services
echo "▶️ Starting services..."
docker-compose up -d

# Attendre que les services soient prêts
echo "⏳ Waiting for services to be ready..."
sleep 30

# Exécuter les migrations
echo "🗄️ Running database migrations..."
docker-compose exec auth-service npx prisma migrate deploy

# Vérifier la santé des services
echo "🏥 Checking service health..."
docker-compose ps

# Tests de santé
echo "🧪 Running health checks..."
curl -f http://localhost:3001/health || {
  echo "❌ Health check failed"
  docker-compose logs auth-service
  exit 1
}

echo "✅ Deployment completed successfully!"
echo "🌐 Auth service available at: http://localhost:3001"
```

## Déploiement Kubernetes

### 1. Namespace et ConfigMap

```yaml
# k8s/namespace.yml
apiVersion: v1
kind: Namespace
metadata:
  name: romapi
  labels:
    name: romapi

---
# k8s/configmap.yml
apiVersion: v1
kind: ConfigMap
metadata:
  name: auth-config
  namespace: romapi
data:
  NODE_ENV: "production"
  PORT: "3001"
  LOG_LEVEL: "info"
  RATE_LIMIT_MAX_REQUESTS: "100"
  BCRYPT_SALT_ROUNDS: "12"
  ENABLE_AUDIT_LOGS: "true"
  METRICS_ENABLED: "true"
  FRONTEND_URL: "https://app.romapi.com"
  CORS_ORIGIN: "https://app.romapi.com,https://admin.romapi.com"
```

### 2. Secrets

```yaml
# k8s/secrets.yml
apiVersion: v1
kind: Secret
metadata:
  name: auth-secrets
  namespace: romapi
type: Opaque
data:
  DATABASE_URL: <base64-encoded-database-url>
  REDIS_URL: <base64-encoded-redis-url>
  JWT_SECRET: <base64-encoded-jwt-secret>
  JWT_REFRESH_SECRET: <base64-encoded-refresh-secret>
  SMTP_PASS: <base64-encoded-smtp-password>
  GOOGLE_CLIENT_SECRET: <base64-encoded-google-secret>
  GITHUB_CLIENT_SECRET: <base64-encoded-github-secret>
  LINKEDIN_CLIENT_SECRET: <base64-encoded-linkedin-secret>
```

### 3. Deployment

```yaml
# k8s/deployment.yml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: auth-service
  namespace: romapi
  labels:
    app: auth-service
    version: v1
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  selector:
    matchLabels:
      app: auth-service
  template:
    metadata:
      labels:
        app: auth-service
        version: v1
    spec:
      serviceAccountName: auth-service
      securityContext:
        runAsNonRoot: true
        runAsUser: 1001
        fsGroup: 1001
      containers:
      - name: auth-service
        image: romapi/auth-service:latest
        imagePullPolicy: Always
        ports:
        - containerPort: 3001
          name: http
          protocol: TCP
        env:
        - name: PORT
          valueFrom:
            configMapKeyRef:
              name: auth-config
              key: PORT
        - name: NODE_ENV
          valueFrom:
            configMapKeyRef:
              name: auth-config
              key: NODE_ENV
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: auth-secrets
              key: DATABASE_URL
        - name: REDIS_URL
          valueFrom:
            secretKeyRef:
              name: auth-secrets
              key: REDIS_URL
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: auth-secrets
              key: JWT_SECRET
        - name: JWT_REFRESH_SECRET
          valueFrom:
            secretKeyRef:
              name: auth-secrets
              key: JWT_REFRESH_SECRET
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3001
          initialDelaySeconds: 30
          periodSeconds: 10
          timeoutSeconds: 5
          failureThreshold: 3
        readinessProbe:
          httpGet:
            path: /health
            port: 3001
          initialDelaySeconds: 5
          periodSeconds: 5
          timeoutSeconds: 3
          failureThreshold: 3
        securityContext:
          allowPrivilegeEscalation: false
          readOnlyRootFilesystem: true
          capabilities:
            drop:
            - ALL
        volumeMounts:
        - name: tmp
          mountPath: /tmp
        - name: logs
          mountPath: /app/logs
      volumes:
      - name: tmp
        emptyDir: {}
      - name: logs
        emptyDir: {}
      nodeSelector:
        kubernetes.io/os: linux
      tolerations:
      - key: "node.kubernetes.io/not-ready"
        operator: "Exists"
        effect: "NoExecute"
        tolerationSeconds: 300
      - key: "node.kubernetes.io/unreachable"
        operator: "Exists"
        effect: "NoExecute"
        tolerationSeconds: 300
```

### 4. Service et Ingress

```yaml
# k8s/service.yml
apiVersion: v1
kind: Service
metadata:
  name: auth-service
  namespace: romapi
  labels:
    app: auth-service
spec:
  type: ClusterIP
  ports:
  - port: 3001
    targetPort: 3001
    protocol: TCP
    name: http
  selector:
    app: auth-service

---
# k8s/ingress.yml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: auth-ingress
  namespace: romapi
  annotations:
    kubernetes.io/ingress.class: nginx
    cert-manager.io/cluster-issuer: letsencrypt-prod
    nginx.ingress.kubernetes.io/rate-limit: "100"
    nginx.ingress.kubernetes.io/rate-limit-window: "1m"
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    nginx.ingress.kubernetes.io/force-ssl-redirect: "true"
spec:
  tls:
  - hosts:
    - api.romapi.com
    secretName: auth-tls
  rules:
  - host: api.romapi.com
    http:
      paths:
      - path: /auth
        pathType: Prefix
        backend:
          service:
            name: auth-service
            port:
              number: 3001
```

### 5. HorizontalPodAutoscaler

```yaml
# k8s/hpa.yml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: auth-service-hpa
  namespace: romapi
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: auth-service
  minReplicas: 3
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
  behavior:
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
      - type: Percent
        value: 10
        periodSeconds: 60
    scaleUp:
      stabilizationWindowSeconds: 60
      policies:
      - type: Percent
        value: 50
        periodSeconds: 60
```

### 6. Script de Déploiement Kubernetes

```bash
#!/bin/bash
# scripts/deploy-k8s.sh

set -e

NAMESPACE="romapi"
DEPLOYMENT="auth-service"

echo "🚀 Deploying ROMAPI Auth to Kubernetes..."

# Vérifier kubectl
if ! command -v kubectl &> /dev/null; then
    echo "❌ kubectl not found. Please install kubectl."
    exit 1
fi

# Créer le namespace
echo "📦 Creating namespace..."
kubectl apply -f k8s/namespace.yml

# Appliquer les ConfigMaps et Secrets
echo "🔧 Applying configuration..."
kubectl apply -f k8s/configmap.yml
kubectl apply -f k8s/secrets.yml

# Déployer l'application
echo "🚀 Deploying application..."
kubectl apply -f k8s/deployment.yml
kubectl apply -f k8s/service.yml
kubectl apply -f k8s/ingress.yml
kubectl apply -f k8s/hpa.yml

# Attendre le déploiement
echo "⏳ Waiting for deployment to be ready..."
kubectl rollout status deployment/$DEPLOYMENT -n $NAMESPACE --timeout=300s

# Vérifier les pods
echo "🔍 Checking pods status..."
kubectl get pods -n $NAMESPACE -l app=$DEPLOYMENT

# Vérifier les services
echo "🌐 Checking services..."
kubectl get svc -n $NAMESPACE

# Tests de santé
echo "🧪 Running health checks..."
EXTERNAL_IP=$(kubectl get ingress auth-ingress -n $NAMESPACE -o jsonpath='{.status.loadBalancer.ingress[0].ip}')
if [[ -n "$EXTERNAL_IP" ]]; then
    curl -f http://$EXTERNAL_IP/auth/health || echo "⚠️ Health check failed"
fi

echo "✅ Deployment completed successfully!"
echo "🌐 Service available at: https://api.romapi.com/auth"
```

## Déploiement Cloud

### 1. AWS ECS

```json
{
  "family": "romapi-auth",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "executionRoleArn": "arn:aws:iam::ACCOUNT:role/ecsTaskExecutionRole",
  "taskRoleArn": "arn:aws:iam::ACCOUNT:role/ecsTaskRole",
  "containerDefinitions": [
    {
      "name": "auth-service",
      "image": "ACCOUNT.dkr.ecr.REGION.amazonaws.com/romapi/auth-service:latest",
      "portMappings": [
        {
          "containerPort": 3001,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        },
        {
          "name": "PORT",
          "value": "3001"
        }
      ],
      "secrets": [
        {
          "name": "DATABASE_URL",
          "valueFrom": "arn:aws:secretsmanager:REGION:ACCOUNT:secret:romapi/database-url"
        },
        {
          "name": "JWT_SECRET",
          "valueFrom": "arn:aws:secretsmanager:REGION:ACCOUNT:secret:romapi/jwt-secret"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/romapi-auth",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      },
      "healthCheck": {
        "command": ["CMD-SHELL", "curl -f http://localhost:3001/health || exit 1"],
        "interval": 30,
        "timeout": 5,
        "retries": 3,
        "startPeriod": 60
      }
    }
  ]
}
```

### 2. Google Cloud Run

```yaml
# cloudrun.yml
apiVersion: serving.knative.dev/v1
kind: Service
metadata:
  name: romapi-auth
  annotations:
    run.googleapis.com/ingress: all
    run.googleapis.com/execution-environment: gen2
spec:
  template:
    metadata:
      annotations:
        autoscaling.knative.dev/minScale: "1"
        autoscaling.knative.dev/maxScale: "10"
        run.googleapis.com/cpu-throttling: "false"
        run.googleapis.com/memory: "1Gi"
        run.googleapis.com/cpu: "1000m"
    spec:
      serviceAccountName: romapi-auth@PROJECT.iam.gserviceaccount.com
      containers:
      - image: gcr.io/PROJECT/romapi-auth:latest
        ports:
        - containerPort: 3001
        env:
        - name: NODE_ENV
          value: production
        - name: PORT
          value: "3001"
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: database-url
              key: latest
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: jwt-secret
              key: latest
        resources:
          limits:
            memory: 1Gi
            cpu: 1000m
        livenessProbe:
          httpGet:
            path: /health
            port: 3001
          initialDelaySeconds: 30
          periodSeconds: 10
        startupProbe:
          httpGet:
            path: /health
            port: 3001
          initialDelaySeconds: 10
          periodSeconds: 5
          failureThreshold: 10
```

### 3. Azure Container Instances

```yaml
# azure-container.yml
apiVersion: 2021-03-01
location: eastus
name: romapi-auth
properties:
  containers:
  - name: auth-service
    properties:
      image: romapi.azurecr.io/auth-service:latest
      resources:
        requests:
          cpu: 0.5
          memoryInGb: 1
      ports:
      - port: 3001
        protocol: TCP
      environmentVariables:
      - name: NODE_ENV
        value: production
      - name: PORT
        value: "3001"
      - name: DATABASE_URL
        secureValue: postgresql://user:pass@server:5432/db
      - name: JWT_SECRET
        secureValue: your-jwt-secret
      livenessProbe:
        httpGet:
          path: /health
          port: 3001
        initialDelaySeconds: 30
        periodSeconds: 10
  osType: Linux
  restartPolicy: Always
  ipAddress:
    type: Public
    ports:
    - protocol: TCP
      port: 3001
    dnsNameLabel: romapi-auth
```

## Configuration de Production

### 1. Variables d'Environnement de Production

```bash
# .env.production
NODE_ENV=production
PORT=3001

# Base de données
DATABASE_URL=postgresql://romapi:${DB_PASSWORD}@db.romapi.com:5432/romapi
REDIS_URL=redis://:${REDIS_PASSWORD}@redis.romapi.com:6379

# JWT
JWT_SECRET=${JWT_SECRET}
JWT_REFRESH_SECRET=${JWT_REFRESH_SECRET}
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=7d

# Email
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=${SENDGRID_API_KEY}
EMAIL_FROM=ROMAPI <noreply@romapi.com>
FRONTEND_URL=https://app.romapi.com

# OAuth2
GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID}
GOOGLE_CLIENT_SECRET=${GOOGLE_CLIENT_SECRET}
GOOGLE_CALLBACK_URL=https://api.romapi.com/auth/oauth/google/callback

# Sécurité
BCRYPT_SALT_ROUNDS=12
MAX_LOGIN_ATTEMPTS=5
ACCOUNT_LOCK_TIME_MS=900000
CORS_ORIGIN=https://app.romapi.com,https://admin.romapi.com

# Rate limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Monitoring
LOG_LEVEL=warn
ENABLE_AUDIT_LOGS=true
METRICS_ENABLED=true
```

### 2. Configuration Nginx

```nginx
# config/nginx/nginx.conf
upstream auth_backend {
    least_conn;
    server auth-service-1:3001 max_fails=3 fail_timeout=30s;
    server auth-service-2:3001 max_fails=3 fail_timeout=30s;
    server auth-service-3:3001 max_fails=3 fail_timeout=30s;
}

server {
    listen 80;
    server_name api.romapi.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.romapi.com;

    # SSL Configuration
    ssl_certificate /etc/nginx/ssl/romapi.crt;
    ssl_certificate_key /etc/nginx/ssl/romapi.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Security Headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Rate Limiting
    limit_req_zone $binary_remote_addr zone=auth:10m rate=10r/m;
    limit_req_zone $binary_remote_addr zone=api:10m rate=100r/m;

    # Auth endpoints
    location /auth {
        limit_req zone=auth burst=20 nodelay;
        
        proxy_pass http://auth_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 30s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;
    }

    # API endpoints
    location /api {
        limit_req zone=api burst=200 nodelay;
        
        proxy_pass http://auth_backend;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Health check
    location /health {
        proxy_pass http://auth_backend;
        access_log off;
    }
}
```

### 3. Configuration Redis

```conf
# config/redis/redis.conf
# Network
bind 0.0.0.0
port 6379
protected-mode yes
requirepass ${REDIS_PASSWORD}

# General
daemonize no
supervised no
pidfile /var/run/redis_6379.pid
loglevel notice
logfile ""

# Snapshotting
save 900 1
save 300 10
save 60 10000
stop-writes-on-bgsave-error yes
rdbcompression yes
rdbchecksum yes
dbfilename dump.rdb
dir ./

# Replication
replica-serve-stale-data yes
replica-read-only yes

# Security
rename-command FLUSHDB ""
rename-command FLUSHALL ""
rename-command KEYS ""
rename-command CONFIG "CONFIG_b835c3b4e5f2a3d7"

# Memory management
maxmemory 256mb
maxmemory-policy allkeys-lru

# Append only file
appendonly yes
appendfilename "appendonly.aof"
appendfsync everysec
no-appendfsync-on-rewrite no
auto-aof-rewrite-percentage 100
auto-aof-rewrite-min-size 64mb

# Slow log
slowlog-log-slower-than 10000
slowlog-max-len 128

# Client output buffer limits
client-output-buffer-limit normal 0 0 0
client-output-buffer-limit replica 256mb 64mb 60
client-output-buffer-limit pubsub 32mb 8mb 60
```

## Monitoring et Logs

### 1. Configuration Prometheus

```yaml
# config/prometheus/prometheus.yml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  - "auth_rules.yml"

scrape_configs:
  - job_name: 'auth-service'
    static_configs:
      - targets: ['auth-service:3001']
    metrics_path: '/metrics'
    scrape_interval: 30s
    scrape_timeout: 10s

alerting:
  alertmanagers:
    - static_configs:
        - targets:
          - alertmanager:9093
```

### 2. Règles d'Alerte

```yaml
# config/prometheus/auth_rules.yml
groups:
- name: auth-service
  rules:
  - alert: AuthServiceDown
    expr: up{job="auth-service"} == 0
    for: 1m
    labels:
      severity: critical
    annotations:
      summary: "Auth service is down"
      description: "Auth service has been down for more than 1 minute"

  - alert: HighErrorRate
    expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.1
    for: 2m
    labels:
      severity: warning
    annotations:
      summary: "High error rate detected"
      description: "Error rate is {{ $value }} errors per second"

  - alert: HighResponseTime
    expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 1
    for: 5m
    labels:
      severity: warning
    annotations:
      summary: "High response time"
      description: "95th percentile response time is {{ $value }}s"

  - alert: DatabaseConnectionFailure
    expr: database_connections_failed_total > 0
    for: 1m
    labels:
      severity: critical
    annotations:
      summary: "Database connection failure"
      description: "Failed to connect to database"

  - alert: RedisConnectionFailure
    expr: redis_connections_failed_total > 0
    for: 1m
    labels:
      severity: critical
    annotations:
      summary: "Redis connection failure"
      description: "Failed to connect to Redis"
```

### 3. Configuration Grafana

```json
{
  "dashboard": {
    "title": "ROMAPI Auth Service",
    "panels": [
      {
        "title": "Request Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(http_requests_total[5m])",
            "legendFormat": "{{method}} {{status}}"
          }
        ]
      },
      {
        "title": "Response Time",
        "type": "graph",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))",
            "legendFormat": "95th percentile"
          },
          {
            "expr": "histogram_quantile(0.50, rate(http_request_duration_seconds_bucket[5m]))",
            "legendFormat": "50th percentile"
          }
        ]
      },
      {
        "title": "Active Sessions",
        "type": "singlestat",
        "targets": [
          {
            "expr": "active_sessions_total"
          }
        ]
      },
      {
        "title": "Failed Login Attempts",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(login_attempts_failed_total[5m])",
            "legendFormat": "Failed logins/sec"
          }
        ]
      }
    ]
  }
}
```

### 4. Configuration ELK Stack

```yaml
# config/logstash/logstash.conf
input {
  beats {
    port => 5044
  }
}

filter {
  if [fields][service] == "auth-service" {
    json {
      source => "message"
    }
    
    date {
      match => [ "timestamp", "ISO8601" ]
    }
    
    if [level] == "error" {
      mutate {
        add_tag => [ "error" ]
      }
    }
    
    if [action] {
      mutate {
        add_tag => [ "audit" ]
      }
    }
  }
}

output {
  elasticsearch {
    hosts => ["elasticsearch:9200"]
    index => "auth-service-%{+YYYY.MM.dd}"
  }
}
```

## Sécurité

### 1. Checklist de Sécurité

- [ ] **Secrets Management**
  - [ ] Utiliser un gestionnaire de secrets (AWS Secrets Manager, HashiCorp Vault)
  - [ ] Rotation automatique des clés JWT
  - [ ] Chiffrement des variables d'environnement

- [ ] **Network Security**
  - [ ] HTTPS uniquement en production
  - [ ] Certificats SSL/TLS valides
  - [ ] Firewall configuré (ports 80, 443 uniquement)

- [ ] **Application Security**
  - [ ] Rate limiting configuré
  - [ ] CORS configuré correctement
  - [ ] Headers de sécurité (HSTS, CSP, etc.)
  - [ ] Validation des entrées

- [ ] **Database Security**
  - [ ] Connexions chiffrées (SSL)
  - [ ] Utilisateur dédié avec permissions minimales
  - [ ] Sauvegardes chiffrées

- [ ] **Container Security**
  - [ ] Images de base sécurisées
  - [ ] Utilisateur non-root
  - [ ] Scan de vulnérabilités
  - [ ] Secrets non inclus dans l'image

### 2. Script de Validation Sécurité

```bash
#!/bin/bash
# scripts/security-check.sh

echo "🔒 Running security checks..."

# Vérifier les permissions des fichiers
echo "📁 Checking file permissions..."
find . -name "*.env*" -exec chmod 600 {} \;
find . -name "*.key" -exec chmod 600 {} \;

# Vérifier les secrets dans le code
echo "🔍 Scanning for hardcoded secrets..."
if grep -r "password\|secret\|key" --include="*.ts" --include="*.js" src/; then
  echo "⚠️ Potential hardcoded secrets found"
fi

# Vérifier les dépendances vulnérables
echo "📦 Checking for vulnerable dependencies..."
npm audit --audit-level moderate

# Vérifier la configuration SSL
echo "🔐 Checking SSL configuration..."
if [[ "$NODE_ENV" == "production" ]]; then
  if [[ -z "$HTTPS" || "$HTTPS" != "true" ]]; then
    echo "⚠️ HTTPS not enabled in production"
  fi
fi

# Vérifier les headers de sécurité
echo "🛡️ Checking security headers..."
curl -I https://api.romapi.com/health | grep -E "(X-Frame-Options|X-Content-Type-Options|Strict-Transport-Security)"

echo "✅ Security check completed"
```

## Maintenance

### 1. Sauvegardes

```bash
#!/bin/bash
# scripts/backup.sh

BACKUP_DIR="/backups/$(date +%Y%m%d_%H%M%S)"
mkdir -p $BACKUP_DIR

# Sauvegarde base de données
echo "💾 Backing up database..."
pg_dump $DATABASE_URL > $BACKUP_DIR/database.sql

# Sauvegarde Redis
echo "💾 Backing up Redis..."
redis-cli --rdb $BACKUP_DIR/redis.rdb

# Compression
echo "🗜️ Compressing backups..."
tar -czf $BACKUP_DIR.tar.gz $BACKUP_DIR
rm -rf $BACKUP_DIR

# Upload vers S3 (optionnel)
if [[ -n "$AWS_S3_BUCKET" ]]; then
  aws s3 cp $BACKUP_DIR.tar.gz s3://$AWS_S3_BUCKET/backups/
fi

echo "✅ Backup completed: $BACKUP_DIR.tar.gz"
```

### 2. Mise à Jour

```bash
#!/bin/bash
# scripts/update.sh

echo "🔄 Starting update process..."

# Sauvegarde avant mise à jour
./scripts/backup.sh

# Pull nouvelle image
docker pull romapi/auth-service:latest

# Mise à jour avec zero-downtime
docker-compose up -d --no-deps auth-service

# Vérifier la santé
sleep 30
curl -f http://localhost:3001/health || {
  echo "❌ Health check failed, rolling back..."
  docker-compose rollback auth-service
  exit 1
}

echo "✅ Update completed successfully"
```

### 3. Monitoring de Santé

```bash
#!/bin/bash
# scripts/health-monitor.sh

while true; do
  if ! curl -f http://localhost:3001/health > /dev/null 2>&1; then
    echo "❌ Health check failed at $(date)"
    
    # Redémarrer le service
    docker-compose restart auth-service
    
    # Attendre et vérifier
    sleep 30
    if curl -f http://localhost:3001/health > /dev/null 2>&1; then
      echo "✅ Service recovered at $(date)"
    else
      echo "🚨 Service still down, manual intervention required"
      # Envoyer alerte (email, Slack, etc.)
    fi
  fi
  
  sleep 60
done
```

## Troubleshooting

### 1. Problèmes Courants

#### Service ne démarre pas

```bash
# Vérifier les logs
docker-compose logs auth-service

# Vérifier les variables d'environnement
docker-compose exec auth-service env | grep -E "(DATABASE|REDIS|JWT)"

# Tester la connectivité base de données
docker-compose exec auth-service npx prisma db pull
```

#### Erreurs de connexion base de données

```bash
# Vérifier la connectivité
docker-compose exec auth-service pg_isready -h postgres -p 5432

# Vérifier les migrations
docker-compose exec auth-service npx prisma migrate status

# Réexécuter les migrations
docker-compose exec auth-service npx prisma migrate deploy
```

#### Problèmes Redis

```bash
# Vérifier la connectivité Redis
docker-compose exec auth-service redis-cli -h redis ping

# Vérifier l'utilisation mémoire
docker-compose exec redis redis-cli info memory

# Nettoyer le cache si nécessaire
docker-compose exec redis redis-cli flushall
```

### 2. Logs de Debug

```bash
# Activer les logs debug
export LOG_LEVEL=debug

# Suivre les logs en temps réel
docker-compose logs -f auth-service

# Filtrer les logs d'erreur
docker-compose logs auth-service | grep ERROR

# Exporter les logs
docker-compose logs auth-service > auth-service.log
```

### 3. Tests de Performance

```bash
# Test de charge avec Apache Bench
ab -n 1000 -c 10 http://localhost:3001/health

# Test avec wrk
wrk -t12 -c400 -d30s http://localhost:3001/auth/login

# Monitoring des ressources
docker stats auth-service
```

Ce guide fournit une base complète pour déployer et maintenir le système d'authentification ROMAPI dans différents environnements, avec des bonnes pratiques de sécurité et de monitoring.