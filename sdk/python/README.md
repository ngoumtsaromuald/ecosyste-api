# ROMAPI Search SDK - Python

SDK Python officiel pour l'API de recherche ROMAPI. Ce SDK fournit une interface Python simple et puissante pour rechercher des API, entreprises et services dans l'écosystème camerounais.

## Installation

```bash
pip install romapi-search-sdk
```

Ou pour installer avec les dépendances de développement :

```bash
pip install romapi-search-sdk[dev]
```

Pour le support asynchrone (optionnel) :

```bash
pip install romapi-search-sdk[async]
```

## Utilisation rapide

```python
from romapi_search import ROMAPISearchClient, ResourceType

# Créer un client
client = ROMAPISearchClient(
    base_url="https://api.romapi.com/api/v1",
    api_key="your-api-key"  # optionnel
)

# Recherche simple
results = client.search(
    query="restaurant douala",
    resource_types=[ResourceType.BUSINESS],
    verified=True,
    limit=10
)

print(f"Trouvé {results.total} résultats")
for hit in results.hits:
    print(f"- {hit.name} ({hit.category.name})")

# Suggestions auto-complete
suggestions = client.suggest("rest", limit=5)
for suggestion in suggestions:
    print(f"- {suggestion.text} ({suggestion.count} résultats)")
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

```python
from romapi_search import ROMAPISearchClient

client = ROMAPISearchClient(
    base_url="https://api.romapi.com/api/v1",
    api_key="your-api-key",
    timeout=30.0,
    retries=3,
    enable_cache=True,
    cache_timeout=300  # 5 minutes
)
```

### Recherche avec filtres avancés

```python
from romapi_search import ResourceType, ResourcePlan, SortField, SortOrder

results = client.search(
    query="restaurant cuisine africaine",
    categories=["123e4567-e89b-12d3-a456-426614174000"],
    resource_types=[ResourceType.BUSINESS],
    plans=[ResourcePlan.FREE, ResourcePlan.PREMIUM],
    min_price=1000,
    max_price=50000,
    verified=True,
    city="Douala",
    tags=["cuisine", "livraison"],
    sort=SortField.RATING,
    order=SortOrder.DESC,
    page=1,
    limit=20,
    facets=["categories", "resourceTypes", "plans", "verified"]
)

# Utiliser les facettes pour affichage dynamique
for facet in results.facets:
    print(f"{facet.name}:")
    for value, count in facet.values.items():
        print(f"  - {value}: {count}")
```

### Recherche géographique

```python
# Recherche dans un rayon de 5km
nearby_results = client.search_nearby(
    latitude=3.848,
    longitude=11.502,
    radius=5,
    query="restaurant",
    sort=SortField.DISTANCE,
    order=SortOrder.ASC
)

for hit in nearby_results.hits:
    print(f"{hit.name} - {hit.distance}km")
```

### Suggestions intelligentes

```python
# Suggestions basiques
suggestions = client.suggest("rest", limit=8)

# Suggestions populaires
popular_suggestions = client.get_popular_suggestions(limit=20)

# Suggestions intelligentes avec personnalisation
smart_suggestions = client.get_smart_suggestions(
    query="api",
    limit=10,
    user_id="user_123"
)

for suggestion in smart_suggestions:
    print(f"- {suggestion.text} ({suggestion.type.value})")
    if suggestion.category:
        print(f"  Catégorie: {suggestion.category.name}")
```

### Recherche par catégorie avec navigation

```python
# Recherche dans une catégorie avec sous-catégories
category_results = client.search_by_category(
    category_id="restaurants-id",
    query="cuisine africaine",
    include_subcategories=True,
    max_depth=3,
    show_counts=True
)

# Afficher le fil d'Ariane
breadcrumb_path = " > ".join([bc.name for bc in category_results.breadcrumbs])
print(f"Navigation: {breadcrumb_path}")

# Afficher les sous-catégories
print("Sous-catégories:")
for subcategory in category_results.subcategories:
    print(f"- {subcategory.name} ({subcategory.resource_count})")

# Informations SEO
if category_results.seo:
    print(f"Titre SEO: {category_results.seo.title}")
    print(f"URL canonique: {category_results.seo.canonical_url}")
```

### Recherche multi-types

```python
multi_results = client.search_multi_type(
    query="payment",
    include_types=[ResourceType.API, ResourceType.BUSINESS, ResourceType.SERVICE],
    group_by_type=True
)

# Afficher les résultats par type
for resource_type, type_results in multi_results.results_by_type.items():
    print(f"\n{resource_type} ({type_results.total} résultats):")
    for hit in type_results.hits:
        print(f"  - {hit.name}")

print(f"\nTotal tous types: {multi_results.total_across_types}")
```

### Utilisation avec le builder de paramètres

```python
from romapi_search import SearchParamsBuilder, ResourceType, SortField, SortOrder

# Construire les paramètres avec le builder
params = (SearchParamsBuilder()
    .query("restaurant douala")
    .resource_types(ResourceType.BUSINESS)
    .verified(True)
    .city("Douala")
    .sort_by(SortField.RATING, SortOrder.DESC)
    .paginate(1, 10)
    .facets("categories", "plans", "verified")
    .build())

results = client.search(**params.__dict__)
```

### Gestion des erreurs

```python
from romapi_search import (
    ROMAPIError, 
    ValidationError, 
    RateLimitError, 
    NotFoundError, 
    ServerError
)

try:
    results = client.search(query="test")
except ValidationError as e:
    print(f"Paramètres invalides: {e.message}")
except RateLimitError as e:
    print(f"Limite de taux dépassée: {e.message}")
    if e.retry_after:
        print(f"Réessayer dans {e.retry_after} secondes")
except NotFoundError as e:
    print(f"Ressource non trouvée: {e.message}")
except ServerError as e:
    print(f"Erreur serveur: {e.message}")
except ROMAPIError as e:
    print(f"Erreur API: {e.message} (code: {e.code})")
except Exception as e:
    print(f"Erreur inattendue: {e}")
```

### Recherche avec retry automatique

```python
# Recherche avec retry automatique en cas d'échec
results = client.search_with_retry(
    query="restaurant",
    verified=True,
    max_retries=3,
    backoff_factor=1.0
)
```

### Analytics de recherche

```python
# Obtenir les analytics (nécessite une clé API)
try:
    analytics = client.get_search_analytics(period="7d")
    
    print("Termes populaires:")
    for term in analytics.popular_terms[:5]:
        print(f"- {term.term}: {term.count} ({term.percentage:.1f}%)")
    
    print("\nRequêtes sans résultats:")
    for query in analytics.no_results_queries[:3]:
        print(f"- '{query.query}': {query.count} fois")
    
    print(f"\nMétriques:")
    print(f"- Temps de réponse moyen: {analytics.metrics.average_response_time}ms")
    print(f"- Taux de succès: {analytics.metrics.success_rate:.1f}%")
    print(f"- Taux de cache: {analytics.metrics.cache_hit_rate:.1f}%")
    
except ValidationError:
    print("Clé API requise pour les analytics")
```

## Utilitaires inclus

### Géolocalisation

```python
from romapi_search import GeoUtils, GeoLocation

# Calculer la distance entre deux points
point1 = GeoLocation(latitude=3.848, longitude=11.502)
point2 = GeoLocation(latitude=4.0511, longitude=9.7679)
distance = GeoUtils.calculate_distance(point1, point2)
print(f"Distance: {distance:.2f} km")

# Vérifier si une position est valide
is_valid = GeoUtils.is_valid_location(point1)
print(f"Position valide: {is_valid}")

# Calculer une bounding box
bbox = GeoUtils.get_bounding_box(point1, radius_km=10)
print(f"Bounding box: {bbox}")
```

### Formatage

```python
from romapi_search import FormatUtils

# Formater un prix
formatted_price = FormatUtils.format_price(25000)  # "25 000 FCFA"
print(formatted_price)

# Formater une distance
formatted_distance = FormatUtils.format_distance(2.5)  # "2.5 km"
print(formatted_distance)

# Nettoyer une requête
clean_query = FormatUtils.sanitize_query("  restaurant <script>  ")  # "restaurant"
print(clean_query)

# Valider un email
is_valid_email = FormatUtils.is_valid_email("test@example.com")
print(f"Email valide: {is_valid_email}")

# Valider un numéro camerounais
is_valid_phone = FormatUtils.is_valid_cameroon_phone("+237123456789")
print(f"Téléphone valide: {is_valid_phone}")
```

### Analyse des résultats

```python
from romapi_search import ResultsUtils

# Filtrer par score minimum
high_quality_results = ResultsUtils.filter_by_min_score(results.hits, 0.8)

# Grouper par catégorie
grouped_results = ResultsUtils.group_by_category(results.hits)
for category, hits in grouped_results.items():
    print(f"{category}: {len(hits)} résultats")

# Trier par distance
sorted_by_distance = ResultsUtils.sort_by_distance(results.hits)

# Calculer des statistiques
stats = ResultsUtils.calculate_stats(results.hits)
print(f"Score moyen: {stats['average_score']:.2f}")
print(f"Note moyenne: {stats['average_rating']:.1f}")
print(f"Ressources vérifiées: {stats['verified_count']}")
print(f"Distribution des types: {stats['type_distribution']}")
```

### Cache et performance

```python
# Vérifier la taille du cache
print(f"Entrées en cache: {client.cache.size}")

# Nettoyer le cache expiré
client.cache.cleanup()

# Vider tout le cache
client.clear_cache()

# Vérifier les limites de taux
rate_limits = client.rate_limits
if rate_limits:
    print(f"Requêtes restantes: {rate_limits['remaining']}/{rate_limits['limit']}")
```

## Classes et types principaux

### Types d'énumération

```python
from romapi_search import ResourceType, ResourcePlan, SortField, SortOrder, SuggestionType

# Types de ressources
print(list(ResourceType))  # [ResourceType.API, ResourceType.BUSINESS, ResourceType.SERVICE]

# Plans tarifaires
print(list(ResourcePlan))  # [ResourcePlan.FREE, ResourcePlan.PREMIUM, ResourcePlan.FEATURED]

# Champs de tri
print(list(SortField))  # [SortField.RELEVANCE, SortField.CREATED_AT, ...]

# Ordres de tri
print(list(SortOrder))  # [SortOrder.ASC, SortOrder.DESC]
```

### Structures de données

```python
from romapi_search import SearchHit, SearchResults, Suggestion, CategoryInfo

# Accéder aux propriétés d'un résultat
hit = results.hits[0]
print(f"ID: {hit.id}")
print(f"Nom: {hit.name}")
print(f"Type: {hit.resource_type.value}")
print(f"Plan: {hit.plan.value}")
print(f"Vérifié: {hit.verified}")
print(f"Score: {hit.score}")
print(f"Catégorie: {hit.category.name}")

if hit.address:
    print(f"Ville: {hit.address.city}")
    print(f"Coordonnées: {hit.address.latitude}, {hit.address.longitude}")

if hit.contact:
    print(f"Téléphone: {hit.contact.phone}")
    print(f"Email: {hit.contact.email}")
    print(f"Site web: {hit.contact.website}")
```

## Configuration avancée

### Client avec configuration personnalisée

```python
import requests
from romapi_search import ROMAPISearchClient

# Session HTTP personnalisée
session = requests.Session()
session.headers.update({'X-Custom-Header': 'value'})

client = ROMAPISearchClient(
    base_url="https://api.romapi.com/api/v1",
    api_key="your-api-key",
    timeout=60.0,
    retries=5,
    user_agent="MyApp/1.0.0",
    enable_cache=True,
    cache_timeout=600  # 10 minutes
)

# Remplacer la session HTTP
client.session = session
```

### Logging personnalisé

```python
import logging
from romapi_search import ROMAPISearchClient

# Configurer le logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger('romapi_search')

client = ROMAPISearchClient(api_key="your-api-key")
```

## Constantes utiles

```python
from romapi_search.utils import CAMEROON_CITIES, CAMEROON_REGIONS, COMMON_SEARCH_TERMS

print("Villes du Cameroun:", CAMEROON_CITIES)
print("Régions du Cameroun:", CAMEROON_REGIONS)
print("Termes de recherche courants:", COMMON_SEARCH_TERMS)
```

## Tests

Pour exécuter les tests :

```bash
# Tests unitaires
pytest tests/

# Tests avec couverture
pytest --cov=romapi_search tests/

# Tests d'intégration (nécessite une clé API)
ROMAPI_API_KEY=your-api-key pytest tests/integration/
```

## Développement

Pour contribuer au développement :

```bash
# Cloner le repository
git clone https://github.com/romapi/search-sdk-python.git
cd search-sdk-python

# Installer en mode développement
pip install -e .[dev]

# Formater le code
black romapi_search/
isort romapi_search/

# Vérifier le code
flake8 romapi_search/
mypy romapi_search/

# Générer la documentation
sphinx-build -b html docs/ docs/_build/
```

## Compatibilité

- Python 3.8+
- Testé sur Linux, macOS, Windows
- Support des environnements virtuels (venv, conda, pipenv)

## Licence

MIT - voir le fichier [LICENSE](LICENSE) pour plus de détails.

## Support

- Documentation : https://docs.romapi.com/sdk/python
- Issues : https://github.com/romapi/search-sdk-python/issues
- Email : support@romapi.com
- PyPI : https://pypi.org/project/romapi-search-sdk/