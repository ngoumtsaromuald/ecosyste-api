# Search System Scripts

Ce dossier contient tous les scripts de gestion du système de recherche ROMAPI.

## Scripts Disponibles

### 🔧 Gestion Principale
- **`search-cli.ts`** - Interface en ligne de commande complète pour la gestion du système de recherche
- **`validate-search-setup.ts`** - Validation de la configuration du système de recherche
- **`test-search-cli.ts`** - Test simple du CLI de recherche

### 🧹 Maintenance
- **`search-analytics-cleanup.ts`** - Nettoyage des données d'analytics anciennes
- **`search-backup-restore.ts`** - Sauvegarde et restauration des données de recherche
- **`search-health-monitor.ts`** - Monitoring de santé en temps réel

### 🚀 Déploiement
- **`deploy-search.sh`** - Script de déploiement des services de recherche
- **`search-indexer-cron.sh`** - Script cron pour l'indexation programmée

## Utilisation

### CLI Principal
```bash
# Statut du système
npm run search:cli status

# Gestion des index
npm run search:cli index create
npm run search:cli index stats
npm run search:cli index reindex

# Gestion du cache
npm run search:cli cache stats
npm run search:cli cache clear

# Analytics
npm run search:cli analytics --days 30

# Backup
npm run search:cli backup create
npm run search:cli backup restore /path/to/backup

# Monitoring
npm run search:cli monitor --check
```

### Scripts de Maintenance
```bash
# Validation de la configuration
npm run search:validate

# Test du CLI
npm run search:test

# Nettoyage des données
npm run search:cleanup --dry-run

# Monitoring continu
npm run search:monitor

# Backup automatique
npm run search:backup
```

### Déploiement
```bash
# Déploiement en production
npm run deploy:search:prod

# Déploiement en staging
npm run deploy:search:staging
```

## Configuration

### Variables d'Environnement
Les scripts utilisent les variables d'environnement définies dans :
- `config/environments/.env.search.production`
- `config/environments/.env.search.staging`

### Principales Variables
```bash
# Elasticsearch
ELASTICSEARCH_HOST=localhost
ELASTICSEARCH_PORT=9200
ELASTICSEARCH_INDEX_PREFIX=romapi

# Redis Search
REDIS_SEARCH_HOST=localhost
REDIS_SEARCH_PORT=6380
REDIS_SEARCH_PASSWORD=your-password

# Backup
SEARCH_BACKUPS_PATH=./backups/search
BACKUP_RETENTION_DAYS=30

# Monitoring
SEARCH_HEALTH_LOG_FILE=./logs/search/health.log
SEARCH_ALERTING_ENABLED=true
```

## Dépendances

### Packages Node.js
- `@prisma/client` - Accès à la base de données
- `redis` - Client Redis
- `@elastic/elasticsearch` - Client Elasticsearch
- `commander` - Interface CLI

### Services Externes
- **Elasticsearch 8.x** - Moteur de recherche
- **Redis 7.x** - Cache et analytics
- **PostgreSQL** - Base de données principale

## Troubleshooting

### Erreurs Communes

**Connexion Redis échouée :**
```bash
# Vérifier la configuration Redis
docker logs romapi-redis-search
```

**Elasticsearch indisponible :**
```bash
# Vérifier le statut du cluster
curl http://localhost:9200/_cluster/health
```

**Erreurs de permissions :**
```bash
# Vérifier les permissions des dossiers
chmod +x scripts/*.sh
mkdir -p logs/search backups/search
```

### Logs
- **Application** : `./logs/search/`
- **Health Monitor** : `./logs/search/health.log`
- **Déploiement** : `./logs/search-deploy-*.log`

## Développement

### Ajout de Nouvelles Commandes CLI
1. Modifier `search-cli.ts`
2. Ajouter la commande dans `setupCLI()`
3. Implémenter la méthode dans la classe `SearchCLI`
4. Tester avec `npm run search:test`

### Ajout de Scripts de Maintenance
1. Créer le nouveau script dans `scripts/`
2. Ajouter la commande dans `package.json`
3. Documenter dans ce README
4. Tester la fonctionnalité

## Support

Pour plus d'informations, consultez :
- [Guide de Maintenance](../docs/search-maintenance-guide.md)
- [Documentation API](../docs/search-api-documentation.md)
- [Guide d'Observabilité](../docs/search-observability-guide.md)