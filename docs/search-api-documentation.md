# Documentation API de Recherche ROMAPI

## Vue d'ensemble

L'API de recherche ROMAPI fournit des capacités de recherche avancées pour découvrir des API, entreprises et services dans l'écosystème camerounais. Elle utilise Elasticsearch pour des performances optimales et offre des fonctionnalités comme la recherche textuelle, les filtres géographiques, les suggestions auto-complete et les analytics.

## URL de base

```
https://api.romapi.com/api/v1/search
```

## Authentification

L'API de recherche est publique et ne nécessite pas d'authentification pour les opérations de lecture. Cependant, certaines fonctionnalités avancées comme la personnalisation nécessitent un token d'authentification.

```http
Authorization: Bearer YOUR_API_TOKEN
```

## Endpoints principaux

### 1. Recherche principale

**GET** `/search`

Effectue une recherche textuelle avancée avec filtres et facettes.

#### Paramètres de requête

| Paramètre | Type | Requis | Description | Exemple |
|-----------|------|--------|-------------|---------|
| `q` | string | Non | Requête de recherche textuelle | `restaurant douala` |
| `categories` | array | Non | IDs des catégories (UUID) | `123e4567-e89b-12d3-a456-426614174000` |
| `resourceTypes` | array | Non | Types de ressources | `BUSINESS,API,SERVICE` |
| `plans` | array | Non | Plans tarifaires | `FREE,PREMIUM,FEATURED` |
| `minPrice` | integer | Non | Prix minimum en FCFA | `1000` |
| `maxPrice` | integer | Non | Prix maximum en FCFA | `50000` |
| `verified` | boolean | Non | Ressources vérifiées uniquement | `true` |
| `city` | string | Non | Ville pour filtrage géographique | `Douala` |
| `region` | string | Non | Région pour filtrage géographique | `Littoral` |
| `tags` | array | Non | Tags à rechercher | `cuisine,livraison` |
| `sort` | string | Non | Champ de tri | `relevance,createdAt,rating` |
| `order` | string | Non | Ordre de tri | `asc,desc` |
| `page` | integer | Non | Numéro de page (défaut: 1) | `1` |
| `limit` | integer | Non | Résultats par page (max: 100) | `20` |
| `facets` | array | Non | Facettes à inclure | `categories,resourceTypes` |

#### Exemple de requête

```bash
curl -X GET "https://api.romapi.com/api/v1/search?q=restaurant&city=Douala&verified=true&sort=rating&order=desc&limit=10" \
  -H "Accept: application/json"
```

#### Exemple de réponse

```json
{
  "hits": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "name": "Restaurant Le Palais",
      "slug": "restaurant-le-palais",
      "description": "Cuisine camerounaise authentique au cœur de Yaoundé",
      "resourceType": "BUSINESS",
      "plan": "FREE",
      "verified": true,
      "score": 0.95,
      "category": {
        "id": "789e0123-e89b-12d3-a456-426614174000",
        "name": "Restaurants",
        "slug": "restaurants"
      },
      "address": {
        "addressLine1": "123 Avenue Kennedy",
        "city": "Yaoundé",
        "region": "Centre",
        "country": "CM",
        "latitude": 3.848,
        "longitude": 11.502
      },
      "contact": {
        "phone": "+237123456789",
        "email": "contact@lepalais.cm",
        "website": "https://www.lepalais.cm"
      },
      "tags": ["cuisine", "africaine", "livraison"],
      "rating": 4.5,
      "createdAt": "2024-01-15T10:30:00Z",
      "highlights": ["<em>Restaurant</em> Le Palais"]
    }
  ],
  "total": 150,
  "took": 45,
  "facets": [
    {
      "name": "categories",
      "values": {
        "restaurants": 45,
        "hotels": 23,
        "services": 12
      },
      "total": 80
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "totalPages": 8,
    "hasNext": true,
    "hasPrev": false
  },
  "metadata": {
    "query": "restaurant douala",
    "appliedFilters": ["city:douala", "verified:true"],
    "searchId": "search_123456789"
  }
}
```

### 2. Suggestions auto-complete

**GET** `/search/suggest`

Fournit des suggestions de recherche en temps réel.

#### Paramètres de requête

| Paramètre | Type | Requis | Description | Exemple |
|-----------|------|--------|-------------|---------|
| `q` | string | Oui | Début de requête (min 2 caractères) | `rest` |
| `limit` | integer | Non | Nombre de suggestions (max 20) | `10` |
| `userId` | string | Non | ID utilisateur pour personnalisation | `user_123` |
| `includePopular` | boolean | Non | Inclure suggestions populaires | `true` |
| `sessionId` | string | Non | ID de session pour rate limiting | `session_456` |

#### Exemple de requête

```bash
curl -X GET "https://api.romapi.com/api/v1/search/suggest?q=rest&limit=5" \
  -H "Accept: application/json"
```

#### Exemple de réponse

```json
[
  {
    "text": "restaurant",
    "score": 0.95,
    "type": "query",
    "count": 125,
    "highlighted": "<em>rest</em>aurant"
  },
  {
    "text": "restaurant douala",
    "score": 0.88,
    "type": "query",
    "count": 45,
    "highlighted": "<em>rest</em>aurant douala"
  },
  {
    "text": "Restaurants",
    "score": 0.75,
    "type": "category",
    "count": 156,
    "category": {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "name": "Restaurants",
      "slug": "restaurants"
    },
    "highlighted": "<em>Rest</em>aurants"
  }
]
```

### 3. Recherche géographique

**GET** `/search/nearby`

Recherche des ressources dans un rayon géographique spécifique.

#### Paramètres de requête

| Paramètre | Type | Requis | Description | Exemple |
|-----------|------|--------|-------------|---------|
| `latitude` | float | Oui | Latitude de référence | `3.848` |
| `longitude` | float | Oui | Longitude de référence | `11.502` |
| `radius` | float | Oui | Rayon en kilomètres (max 100) | `10` |
| `q` | string | Non | Requête textuelle | `restaurant` |
| Autres | - | Non | Mêmes filtres que `/search` | - |

#### Exemple de requête

```bash
curl -X GET "https://api.romapi.com/api/v1/search/nearby?latitude=3.848&longitude=11.502&radius=5&q=restaurant" \
  -H "Accept: application/json"
```

### 4. Recherche multi-types

**GET** `/search/multi-type`

Recherche simultanée dans tous les types de ressources avec groupement.

#### Paramètres de requête

| Paramètre | Type | Requis | Description | Exemple |
|-----------|------|--------|-------------|---------|
| `q` | string | Non | Requête de recherche | `payment` |
| `includeTypes` | array | Non | Types à inclure | `API,BUSINESS,SERVICE` |
| `groupByType` | boolean | Non | Grouper par type | `true` |
| `globalRelevanceSort` | boolean | Non | Tri global par pertinence | `false` |

#### Exemple de réponse

```json
{
  "resultsByType": {
    "API": {
      "hits": [...],
      "total": 25,
      "facets": [...]
    },
    "BUSINESS": {
      "hits": [...],
      "total": 18,
      "facets": [...]
    },
    "SERVICE": {
      "hits": [...],
      "total": 12,
      "facets": [...]
    }
  },
  "totalAcrossTypes": 55,
  "took": 125,
  "paginationByType": {
    "API": {
      "page": 1,
      "limit": 10,
      "totalPages": 3,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

### 5. Recherche par catégorie

**GET** `/search/categories/{categoryId}`

Recherche dans une catégorie spécifique avec navigation hiérarchique.

#### Paramètres de chemin

| Paramètre | Type | Requis | Description |
|-----------|------|--------|-------------|
| `categoryId` | string | Oui | ID de la catégorie (UUID) |

#### Paramètres de requête

| Paramètre | Type | Requis | Description | Exemple |
|-----------|------|--------|-------------|---------|
| `includeSubcategories` | boolean | Non | Inclure sous-catégories | `true` |
| `maxDepth` | integer | Non | Profondeur hiérarchique max | `3` |
| `showCounts` | boolean | Non | Afficher compteurs | `true` |

#### Exemple de réponse

```json
{
  "hits": [...],
  "total": 28,
  "categoryInfo": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "name": "Restaurants",
    "slug": "restaurants",
    "description": "Établissements de restauration",
    "icon": "restaurant",
    "resourceCount": 156
  },
  "breadcrumbs": [
    {
      "id": "root",
      "name": "Accueil",
      "slug": "",
      "url": "/api/v1/search"
    },
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "name": "Restaurants",
      "slug": "restaurants",
      "url": "/api/v1/search/categories/restaurants"
    }
  ],
  "subcategories": [
    {
      "id": "567e8901-e89b-12d3-a456-426614174004",
      "name": "Cuisine Africaine",
      "slug": "cuisine-africaine",
      "description": "Restaurants spécialisés en cuisine africaine",
      "icon": "african-cuisine",
      "resourceCount": 28
    }
  ],
  "seo": {
    "title": "Restaurants - API ROMAPI",
    "description": "Découvrez les meilleurs restaurants au Cameroun",
    "canonicalUrl": "/api/v1/search/categories/restaurants",
    "shareUrl": "https://api.romapi.com/search/categories/restaurants"
  }
}
```

## Codes d'erreur

### Erreurs de validation (400)

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Paramètres de recherche invalides",
    "timestamp": "2024-01-15T10:30:00Z",
    "path": "/api/v1/search",
    "method": "GET",
    "details": {
      "limit": "La limite doit être entre 1 et 100",
      "radius": "Le rayon doit être entre 0.1 et 100 km"
    }
  }
}
```

### Erreurs de rate limiting (429)

```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Limite de requêtes dépassée",
    "timestamp": "2024-01-15T10:30:00Z",
    "path": "/api/v1/search/suggest",
    "method": "GET",
    "details": {
      "limit": "100 requêtes par heure",
      "resetTime": "2024-01-15T11:30:00Z",
      "retryAfter": 3600
    }
  }
}
```

### Erreurs serveur (500)

```json
{
  "success": false,
  "error": {
    "code": "SEARCH_ERROR",
    "message": "Erreur lors de la recherche",
    "timestamp": "2024-01-15T10:30:00Z",
    "path": "/api/v1/search",
    "method": "GET",
    "details": {
      "elasticsearch": "Service temporairement indisponible",
      "fallback": "Résultats depuis le cache"
    }
  }
}
```

## Limites et quotas

### Rate limiting

- **Recherche principale** : 1000 requêtes/heure par utilisateur authentifié, 100/heure par IP
- **Suggestions** : 500 requêtes/heure par utilisateur, 50/heure par IP
- **Analytics** : 100 requêtes/heure par utilisateur authentifié

### Limites de pagination

- **Limite maximale** : 100 résultats par page
- **Page maximale** : 100 (10 000 résultats max)
- **Timeout** : 30 secondes par requête

### Limites de requête

- **Longueur de requête** : 200 caractères maximum
- **Nombre de filtres** : 50 maximum par requête
- **Rayon géographique** : 100 km maximum

## Optimisations et bonnes pratiques

### Performance

1. **Utilisez la pagination** : Limitez les résultats avec `limit` et `page`
2. **Cache intelligent** : Les requêtes identiques sont mises en cache 5 minutes
3. **Filtres spécifiques** : Plus les filtres sont précis, plus la recherche est rapide
4. **Facettes sélectives** : Ne demandez que les facettes nécessaires

### Suggestions

1. **Debouncing** : Attendez 300ms entre les frappes clavier
2. **Limite raisonnable** : 5-10 suggestions suffisent généralement
3. **Cache local** : Mettez en cache les suggestions populaires côté client

### Recherche géographique

1. **Rayon optimal** : 5-20 km pour les zones urbaines
2. **Tri par distance** : Utilisez `sort=distance&order=asc` pour les résultats géographiques
3. **Fallback** : Prévoyez un fallback si la géolocalisation échoue

## Exemples d'intégration

### JavaScript/TypeScript

```javascript
class ROMAPISearchClient {
  constructor(baseUrl = 'https://api.romapi.com/api/v1') {
    this.baseUrl = baseUrl;
  }

  async search(params) {
    const url = new URL(`${this.baseUrl}/search`);
    Object.entries(params).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        url.searchParams.set(key, value.join(','));
      } else if (value !== undefined) {
        url.searchParams.set(key, value);
      }
    });

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Search failed: ${response.statusText}`);
    }
    return response.json();
  }

  async suggest(query, options = {}) {
    const url = new URL(`${this.baseUrl}/search/suggest`);
    url.searchParams.set('q', query);
    
    Object.entries(options).forEach(([key, value]) => {
      if (value !== undefined) {
        url.searchParams.set(key, value);
      }
    });

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Suggestions failed: ${response.statusText}`);
    }
    return response.json();
  }
}

// Utilisation
const client = new ROMAPISearchClient();

// Recherche simple
const results = await client.search({
  q: 'restaurant douala',
  verified: true,
  limit: 10
});

// Suggestions
const suggestions = await client.suggest('rest', {
  limit: 5,
  includePopular: true
});
```

### Python

```python
import requests
from typing import Dict, List, Optional, Any

class ROMAPISearchClient:
    def __init__(self, base_url: str = "https://api.romapi.com/api/v1"):
        self.base_url = base_url
        self.session = requests.Session()

    def search(self, **params) -> Dict[str, Any]:
        """Effectue une recherche avec les paramètres donnés."""
        # Convertir les listes en chaînes séparées par des virgules
        for key, value in params.items():
            if isinstance(value, list):
                params[key] = ','.join(map(str, value))
        
        response = self.session.get(f"{self.base_url}/search", params=params)
        response.raise_for_status()
        return response.json()

    def suggest(self, query: str, limit: int = 10, **options) -> List[Dict[str, Any]]:
        """Obtient des suggestions pour une requête."""
        params = {"q": query, "limit": limit, **options}
        response = self.session.get(f"{self.base_url}/search/suggest", params=params)
        response.raise_for_status()
        return response.json()

    def search_nearby(self, latitude: float, longitude: float, radius: float, **params) -> Dict[str, Any]:
        """Recherche géographique dans un rayon donné."""
        params.update({
            "latitude": latitude,
            "longitude": longitude,
            "radius": radius
        })
        response = self.session.get(f"{self.base_url}/search/nearby", params=params)
        response.raise_for_status()
        return response.json()

# Utilisation
client = ROMAPISearchClient()

# Recherche simple
results = client.search(
    q="restaurant douala",
    verified=True,
    resourceTypes=["BUSINESS"],
    limit=10
)

# Recherche géographique
nearby_results = client.search_nearby(
    latitude=3.848,
    longitude=11.502,
    radius=5,
    q="restaurant"
)

# Suggestions
suggestions = client.suggest("rest", limit=5)
```

## Support et ressources

- **Documentation Swagger** : https://api.romapi.com/docs
- **Exemples GitHub** : https://github.com/romapi/examples
- **Support technique** : support@romapi.com
- **Status page** : https://status.romapi.com