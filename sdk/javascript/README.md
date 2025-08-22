# ROMAPI Search SDK - JavaScript/TypeScript

SDK JavaScript/TypeScript officiel pour l'API de recherche ROMAPI. Ce SDK fournit une interface simple et puissante pour rechercher des API, entreprises et services dans l'écosystème camerounais.

## Installation

```bash
npm install @romapi/search-sdk
```

ou avec yarn :

```bash
yarn add @romapi/search-sdk
```

## Utilisation rapide

```typescript
import { ROMAPISearchClient, ResourceType } from '@romapi/search-sdk';

// Créer un client
const client = new ROMAPISearchClient({
  baseUrl: 'https://api.romapi.com/api/v1',
  apiKey: 'your-api-key' // optionnel
});

// Recherche simple
const results = await client.search({
  query: 'restaurant douala',
  filters: {
    resourceTypes: [ResourceType.BUSINESS],
    verified: true
  },
  pagination: { page: 1, limit: 10 }
});

console.log(`Trouvé ${results.total} résultats`);
results.hits.forEach(hit => {
  console.log(`- ${hit.name} (${hit.category.name})`);
});

// Suggestions auto-complete
const suggestions = await client.suggest('rest', { limit: 5 });
suggestions.forEach(suggestion => {
  console.log(`- ${suggestion.text} (${suggestion.count} résultats)`);
});
```

## Fonctionnalités principales

### 🔍 Recherche textuelle avancée
- Recherche en langage naturel avec correction orthographique
- Filtrage par catégorie, type, plan tarifaire
- Tri par pertinence, date, popularité, note
- Facettes avec compteurs pour affinage

### 📍 Recherche géographique
- Recherche dans un rayon spécifique
- Tri par distance
- Support des coordonnées GPS

### 💡 Suggestions intelligentes
- Auto-complétion en temps réel
- Suggestions basées sur la popularité
- Personnalisation utilisateur
- Debouncing intégré

### 🏷️ Recherche par catégories
- Navigation hiérarchique
- URLs SEO-friendly
- Breadcrumbs automatiques

### 🔄 Recherche multi-types
- Recherche simultanée dans tous les types
- Groupement par type avec onglets
- Tri par pertinence globale

## Exemples détaillés

### Configuration du client

```typescript
import { ROMAPISearchClient } from '@romapi/search-sdk';

const client = new ROMAPISearchClient({
  baseUrl: 'https://api.romapi.com/api/v1',
  apiKey: 'your-api-key',
  timeout: 30000,
  retries: 3,
  enableCache: true,
  cacheTimeout: 300000 // 5 minutes
});
```

### Recherche avec filtres avancés

```typescript
import { ResourceType, ResourcePlan, SortField, SortOrder } from '@romapi/search-sdk';

const results = await client.search({
  query: 'restaurant cuisine africaine',
  filters: {
    categories: ['123e4567-e89b-12d3-a456-426614174000'],
    resourceTypes: [ResourceType.BUSINESS],
    plans: [ResourcePlan.FREE, ResourcePlan.PREMIUM],
    priceRange: { min: 1000, max: 50000 },
    verified: true,
    city: 'Douala',
    tags: ['cuisine', 'livraison']
  },
  sort: {
    field: SortField.RATING,
    order: SortOrder.DESC
  },
  pagination: { page: 1, limit: 20 },
  facets: ['categories', 'resourceTypes', 'plans', 'verified']
});

// Utiliser les facettes pour affichage dynamique
results.facets.forEach(facet => {
  console.log(`${facet.name}:`);
  Object.entries(facet.values).forEach(([value, count]) => {
    console.log(`  - ${value}: ${count}`);
  });
});
```

### Recherche géographique

```typescript
// Recherche dans un rayon de 5km
const nearbyResults = await client.searchNearby({
  location: { latitude: 3.848, longitude: 11.502 },
  radius: 5,
  query: 'restaurant',
  sort: { field: SortField.DISTANCE, order: SortOrder.ASC }
});

nearbyResults.hits.forEach(hit => {
  console.log(`${hit.name} - ${hit.distance}km`);
});
```

### Suggestions avec debouncing

```typescript
// Suggestions avec debouncing pour éviter trop de requêtes
const getSuggestions = async (query: string) => {
  if (query.length < 2) return [];
  
  return await client.suggestWithDebounce(query, {
    limit: 8,
    includePopular: true
  }, 300); // 300ms de debounce
};

// Utilisation dans un composant de recherche
const handleInputChange = async (event) => {
  const query = event.target.value;
  const suggestions = await getSuggestions(query);
  // Afficher les suggestions
};
```

### Recherche par catégorie avec navigation

```typescript
// Recherche dans une catégorie avec sous-catégories
const categoryResults = await client.searchByCategory('restaurants-id', {
  query: 'cuisine africaine',
  includeSubcategories: true,
  maxDepth: 3,
  showCounts: true
});

// Afficher le fil d'Ariane
categoryResults.breadcrumbs.forEach(breadcrumb => {
  console.log(`${breadcrumb.name} > `);
});

// Afficher les sous-catégories
categoryResults.subcategories.forEach(subcategory => {
  console.log(`- ${subcategory.name} (${subcategory.resourceCount})`);
});
```

### Recherche multi-types

```typescript
const multiResults = await client.searchMultiType({
  query: 'payment',
  includeTypes: [ResourceType.API, ResourceType.BUSINESS, ResourceType.SERVICE],
  groupByType: true
});

// Afficher les résultats par type
Object.entries(multiResults.resultsByType).forEach(([type, typeResults]) => {
  console.log(`\n${type} (${typeResults.total} résultats):`);
  typeResults.hits.forEach(hit => {
    console.log(`  - ${hit.name}`);
  });
});
```

### Utilisation avec le builder de paramètres

```typescript
import { createSearchBuilder, ResourceType } from '@romapi/search-sdk';

const params = createSearchBuilder()
  .query('restaurant douala')
  .resourceTypes(ResourceType.BUSINESS)
  .verified(true)
  .city('Douala')
  .sortBy(SortField.RATING, SortOrder.DESC)
  .paginate(1, 10)
  .facets('categories', 'plans', 'verified')
  .build();

const results = await client.search(params);
```

### Gestion des erreurs

```typescript
import { ROMAPIError, ValidationError, RateLimitError } from '@romapi/search-sdk';

try {
  const results = await client.search({ query: 'test' });
} catch (error) {
  if (error instanceof ValidationError) {
    console.error('Paramètres invalides:', error.message);
  } else if (error instanceof RateLimitError) {
    console.error('Limite de taux dépassée:', error.message);
    // Attendre avant de réessayer
    setTimeout(() => {
      // Réessayer la requête
    }, error.retryAfter * 1000);
  } else if (error instanceof ROMAPIError) {
    console.error('Erreur API:', error.message, error.code);
  } else {
    console.error('Erreur inattendue:', error);
  }
}
```

### Recherche avec retry automatique

```typescript
// Recherche avec retry automatique en cas d'échec
const results = await client.searchWithRetry({
  query: 'restaurant',
  verified: true
}, 3); // 3 tentatives maximum
```

### Événements et monitoring

```typescript
// Écouter les événements de recherche
client.on('search', (event) => {
  console.log(`Recherche effectuée en ${event.data.took}ms`);
});

client.on('error', (event) => {
  console.error('Erreur de recherche:', event.data.error);
});

// Vérifier les limites de taux
const rateLimits = client.rateLimits;
if (rateLimits) {
  console.log(`Requêtes restantes: ${rateLimits.remaining}/${rateLimits.limit}`);
}
```

## Utilitaires inclus

### Géolocalisation

```typescript
import { GeoUtils } from '@romapi/search-sdk';

// Calculer la distance entre deux points
const distance = GeoUtils.calculateDistance(
  { latitude: 3.848, longitude: 11.502 },
  { latitude: 4.0511, longitude: 9.7679 }
);

// Obtenir la position actuelle (navigateur uniquement)
try {
  const position = await GeoUtils.getCurrentPosition();
  console.log(`Position: ${position.latitude}, ${position.longitude}`);
} catch (error) {
  console.error('Géolocalisation non disponible');
}
```

### Formatage

```typescript
import { FormatUtils } from '@romapi/search-sdk';

// Formater un prix
const formattedPrice = FormatUtils.formatPrice(25000); // "25 000 FCFA"

// Formater une distance
const formattedDistance = FormatUtils.formatDistance(2.5); // "2.5 km"

// Nettoyer une requête
const cleanQuery = FormatUtils.sanitizeQuery('  restaurant <script>  '); // "restaurant"
```

### Analyse des résultats

```typescript
import { ResultsUtils } from '@romapi/search-sdk';

// Filtrer par score minimum
const highQualityResults = ResultsUtils.filterByMinScore(results.hits, 0.8);

// Grouper par catégorie
const groupedResults = ResultsUtils.groupByCategory(results.hits);

// Calculer des statistiques
const stats = ResultsUtils.calculateStats(results.hits);
console.log(`Score moyen: ${stats.averageScore}`);
console.log(`Note moyenne: ${stats.averageRating}`);
console.log(`Ressources vérifiées: ${stats.verifiedCount}`);
```

## Configuration avancée

### Intercepteurs de requête/réponse

```typescript
const client = new ROMAPISearchClient({
  interceptors: {
    request: [
      (url, options) => {
        // Modifier la requête avant envoi
        options.headers['X-Custom-Header'] = 'value';
        return options;
      }
    ],
    response: [
      (response) => {
        // Traiter la réponse
        console.log('Réponse reçue:', response);
        return response;
      }
    ]
  }
});
```

### Logger personnalisé

```typescript
const client = new ROMAPISearchClient({
  logger: {
    debug: (message, ...args) => console.debug(`[DEBUG] ${message}`, ...args),
    info: (message, ...args) => console.info(`[INFO] ${message}`, ...args),
    warn: (message, ...args) => console.warn(`[WARN] ${message}`, ...args),
    error: (message, ...args) => console.error(`[ERROR] ${message}`, ...args)
  }
});
```

## Types TypeScript

Le SDK est entièrement typé avec TypeScript. Tous les types sont exportés :

```typescript
import {
  SearchParams,
  SearchResults,
  SearchHit,
  Suggestion,
  ResourceType,
  ResourcePlan,
  SortField,
  SortOrder,
  // ... autres types
} from '@romapi/search-sdk';
```

## Support des navigateurs

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+
- Node.js 14+

## Licence

MIT - voir le fichier [LICENSE](LICENSE) pour plus de détails.

## Support

- Documentation : https://docs.romapi.com/sdk/javascript
- Issues : https://github.com/romapi/search-sdk-js/issues
- Email : support@romapi.com