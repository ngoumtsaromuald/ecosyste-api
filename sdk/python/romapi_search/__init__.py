"""
SDK Python officiel pour l'API de recherche ROMAPI

Ce SDK fournit une interface Python simple et puissante pour interagir
avec l'API de recherche ROMAPI, permettant de rechercher des API, 
entreprises et services dans l'écosystème camerounais.

Example:
    >>> from romapi_search import ROMAPISearchClient, ResourceType
    >>> 
    >>> client = ROMAPISearchClient(api_key="your-api-key")
    >>> 
    >>> # Recherche simple
    >>> results = client.search(
    ...     query="restaurant douala",
    ...     resource_types=[ResourceType.BUSINESS],
    ...     verified=True,
    ...     limit=10
    ... )
    >>> 
    >>> # Suggestions
    >>> suggestions = client.suggest("rest", limit=5)
"""

from .client import ROMAPISearchClient
from .types import (
    ResourceType,
    ResourcePlan,
    SortField,
    SortOrder,
    SuggestionType,
    SearchParams,
    SearchResults,
    SearchHit,
    Suggestion,
    GeoLocation,
    SearchFilters,
    CategorySearchResults,
    MultiTypeSearchResults,
    SearchAnalytics,
)
from .exceptions import (
    ROMAPIError,
    ValidationError,
    RateLimitError,
    NotFoundError,
    ServerError,
)
from .utils import (
    SearchParamsBuilder,
    GeoUtils,
    FormatUtils,
    CacheUtils,
)

__version__ = "1.0.0"
__author__ = "ROMAPI Team"
__email__ = "dev@romapi.com"
__license__ = "MIT"

# Exports principaux
__all__ = [
    # Client principal
    "ROMAPISearchClient",
    
    # Types et enums
    "ResourceType",
    "ResourcePlan", 
    "SortField",
    "SortOrder",
    "SuggestionType",
    
    # Structures de données
    "SearchParams",
    "SearchResults",
    "SearchHit",
    "Suggestion",
    "GeoLocation",
    "SearchFilters",
    "CategorySearchResults",
    "MultiTypeSearchResults",
    "SearchAnalytics",
    
    # Exceptions
    "ROMAPIError",
    "ValidationError",
    "RateLimitError",
    "NotFoundError",
    "ServerError",
    
    # Utilitaires
    "SearchParamsBuilder",
    "GeoUtils",
    "FormatUtils",
    "CacheUtils",
    
    # Métadonnées
    "__version__",
    "__author__",
    "__email__",
    "__license__",
]

# Configuration par défaut
DEFAULT_BASE_URL = "https://api.romapi.com/api/v1"
DEFAULT_TIMEOUT = 30.0
DEFAULT_RETRIES = 3
DEFAULT_LIMIT = 20