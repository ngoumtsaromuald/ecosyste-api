"""
Client principal pour l'API de recherche ROMAPI
"""

import json
import time
from typing import Dict, List, Optional, Any, Union
from urllib.parse import urlencode, urljoin
import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

from .types import (
    SearchParams,
    SearchResults,
    GeoSearchParams,
    CategorySearchParams,
    CategorySearchResults,
    MultiTypeSearchParams,
    MultiTypeSearchResults,
    Suggestion,
    SearchAnalytics,
    GeoLocation,
    ResourceType,
    SortField,
    SortOrder,
    PaginationParams,
    SearchFilters,
    SortOptions,
)
from .exceptions import (
    ROMAPIError,
    ValidationError,
    RateLimitError,
    NotFoundError,
    ServerError,
)
from .utils import CacheUtils


class ROMAPISearchClient:
    """
    Client principal pour l'API de recherche ROMAPI
    
    Ce client fournit une interface Python simple pour interagir avec
    l'API de recherche ROMAPI, incluant la recherche textuelle, les suggestions,
    la recherche géographique et les analytics.
    
    Args:
        base_url: URL de base de l'API (défaut: https://api.romapi.com/api/v1)
        api_key: Clé API pour l'authentification (optionnel)
        timeout: Timeout des requêtes en secondes (défaut: 30.0)
        retries: Nombre de tentatives en cas d'échec (défaut: 3)
        user_agent: User-Agent personnalisé
        enable_cache: Activer le cache local (défaut: True)
        cache_timeout: Durée de vie du cache en secondes (défaut: 300)
        
    Example:
        >>> client = ROMAPISearchClient(api_key="your-api-key")
        >>> results = client.search(query="restaurant douala", limit=10)
        >>> suggestions = client.suggest("rest")
    """

    def __init__(
        self,
        base_url: str = "https://api.romapi.com/api/v1",
        api_key: Optional[str] = None,
        timeout: float = 30.0,
        retries: int = 3,
        user_agent: Optional[str] = None,
        enable_cache: bool = True,
        cache_timeout: int = 300,
        **kwargs
    ):
        self.base_url = base_url.rstrip('/')
        self.api_key = api_key
        self.timeout = timeout
        self.retries = retries
        self.user_agent = user_agent or "romapi-search-sdk-python/1.0.0"
        self.enable_cache = enable_cache
        self.cache_timeout = cache_timeout
        
        # Configuration de la session HTTP
        self.session = requests.Session()
        self.session.headers.update({
            'Accept': 'application/json',
            'User-Agent': self.user_agent,
        })
        
        if self.api_key:
            self.session.headers['Authorization'] = f'Bearer {self.api_key}'
        
        # Configuration des retries
        retry_strategy = Retry(
            total=self.retries,
            backoff_factor=1,
            status_forcelist=[429, 500, 502, 503, 504],
            allowed_methods=["GET", "POST"]
        )
        adapter = HTTPAdapter(max_retries=retry_strategy)
        self.session.mount("http://", adapter)
        self.session.mount("https://", adapter)
        
        # Cache local
        self.cache = CacheUtils() if self.enable_cache else None
        
        # Informations de rate limiting
        self.rate_limit_info: Optional[Dict[str, Any]] = None

    def search(
        self,
        query: Optional[str] = None,
        categories: Optional[List[str]] = None,
        resource_types: Optional[List[ResourceType]] = None,
        plans: Optional[List[str]] = None,
        min_price: Optional[int] = None,
        max_price: Optional[int] = None,
        verified: Optional[bool] = None,
        city: Optional[str] = None,
        region: Optional[str] = None,
        tags: Optional[List[str]] = None,
        sort: Optional[SortField] = None,
        order: Optional[SortOrder] = None,
        page: int = 1,
        limit: int = 20,
        facets: Optional[List[str]] = None,
        user_id: Optional[str] = None,
        session_id: Optional[str] = None,
        **kwargs
    ) -> SearchResults:
        """
        Effectue une recherche textuelle avec filtres avancés
        
        Args:
            query: Requête de recherche textuelle
            categories: Liste des IDs de catégories à filtrer
            resource_types: Types de ressources à inclure
            plans: Plans tarifaires à filtrer
            min_price: Prix minimum en FCFA
            max_price: Prix maximum en FCFA
            verified: Filtrer uniquement les ressources vérifiées
            city: Ville pour filtrage géographique
            region: Région pour filtrage géographique
            tags: Tags à rechercher
            sort: Champ de tri
            order: Ordre de tri (asc/desc)
            page: Numéro de page (commence à 1)
            limit: Nombre de résultats par page (max 100)
            facets: Facettes à inclure dans la réponse
            user_id: ID utilisateur pour personnalisation
            session_id: ID de session pour analytics
            
        Returns:
            SearchResults: Résultats de recherche avec facettes et pagination
            
        Raises:
            ValidationError: Si les paramètres sont invalides
            RateLimitError: Si la limite de taux est dépassée
            ServerError: En cas d'erreur serveur
        """
        # Validation des paramètres
        if limit > 100:
            raise ValidationError("Limit cannot exceed 100")
        if page < 1:
            raise ValidationError("Page must be >= 1")
        if query and len(query) > 200:
            raise ValidationError("Query cannot exceed 200 characters")
        
        # Construction des paramètres
        params = {}
        if query:
            params['q'] = query.strip()
        if categories:
            params['categories'] = ','.join(categories)
        if resource_types:
            params['resourceTypes'] = ','.join([rt.value for rt in resource_types])
        if plans:
            params['plans'] = ','.join(plans)
        if min_price is not None:
            params['minPrice'] = min_price
        if max_price is not None:
            params['maxPrice'] = max_price
        if verified is not None:
            params['verified'] = str(verified).lower()
        if city:
            params['city'] = city
        if region:
            params['region'] = region
        if tags:
            params['tags'] = ','.join(tags)
        if sort:
            params['sort'] = sort.value
        if order:
            params['order'] = order.value
        if page:
            params['page'] = page
        if limit:
            params['limit'] = limit
        if facets:
            params['facets'] = ','.join(facets)
        if user_id:
            params['userId'] = user_id
        if session_id:
            params['sessionId'] = session_id
        
        # Effectuer la requête
        response_data = self._make_request('GET', '/search', params=params)
        return SearchResults.from_dict(response_data)

    def suggest(
        self,
        query: str,
        limit: int = 10,
        user_id: Optional[str] = None,
        include_popular: bool = True,
        session_id: Optional[str] = None,
        **kwargs
    ) -> List[Suggestion]:
        """
        Obtient des suggestions de recherche auto-complete
        
        Args:
            query: Début de la requête (minimum 2 caractères)
            limit: Nombre maximum de suggestions (max 20)
            user_id: ID utilisateur pour personnalisation
            include_popular: Inclure les suggestions populaires
            session_id: ID de session pour rate limiting
            
        Returns:
            List[Suggestion]: Liste des suggestions classées par pertinence
            
        Raises:
            ValidationError: Si la requête est trop courte
            RateLimitError: Si la limite de taux est dépassée
        """
        if not query or len(query.strip()) < 2:
            return []
        
        if limit > 20:
            raise ValidationError("Limit cannot exceed 20 for suggestions")
        
        params = {
            'q': query.strip(),
            'limit': limit,
        }
        
        if user_id:
            params['userId'] = user_id
        if include_popular is not None:
            params['includePopular'] = str(include_popular).lower()
        if session_id:
            params['sessionId'] = session_id
        
        response_data = self._make_request('GET', '/search/suggest', params=params)
        return [Suggestion.from_dict(item) for item in response_data]

    def get_popular_suggestions(self, limit: int = 20) -> List[Suggestion]:
        """
        Obtient les suggestions les plus populaires
        
        Args:
            limit: Nombre maximum de suggestions (max 50)
            
        Returns:
            List[Suggestion]: Suggestions populaires
        """
        if limit > 50:
            raise ValidationError("Limit cannot exceed 50 for popular suggestions")
        
        params = {'limit': limit}
        response_data = self._make_request('GET', '/search/suggest/popular', params=params)
        return [Suggestion.from_dict(item) for item in response_data]

    def get_smart_suggestions(
        self,
        query: str,
        limit: int = 10,
        user_id: Optional[str] = None
    ) -> List[Suggestion]:
        """
        Obtient des suggestions intelligentes avec stratégies multiples
        
        Args:
            query: Requête pour suggestions
            limit: Nombre maximum de suggestions
            user_id: ID utilisateur pour personnalisation
            
        Returns:
            List[Suggestion]: Suggestions intelligentes
        """
        if not query or len(query.strip()) < 2:
            return []
        
        params = {
            'q': query.strip(),
            'limit': limit,
        }
        
        if user_id:
            params['userId'] = user_id
        
        response_data = self._make_request('GET', '/search/suggest/smart', params=params)
        return [Suggestion.from_dict(item) for item in response_data]

    def search_nearby(
        self,
        latitude: float,
        longitude: float,
        radius: float,
        query: Optional[str] = None,
        **kwargs
    ) -> SearchResults:
        """
        Recherche géographique dans un rayon spécifique
        
        Args:
            latitude: Latitude de référence
            longitude: Longitude de référence
            radius: Rayon de recherche en kilomètres (max 100)
            query: Requête textuelle optionnelle
            **kwargs: Autres paramètres de recherche
            
        Returns:
            SearchResults: Résultats triés par distance
            
        Raises:
            ValidationError: Si les coordonnées ou le rayon sont invalides
        """
        # Validation
        if not (-90 <= latitude <= 90):
            raise ValidationError("Latitude must be between -90 and 90")
        if not (-180 <= longitude <= 180):
            raise ValidationError("Longitude must be between -180 and 180")
        if not (0.1 <= radius <= 100):
            raise ValidationError("Radius must be between 0.1 and 100 km")
        
        # Ajouter les paramètres géographiques
        kwargs.update({
            'latitude': latitude,
            'longitude': longitude,
            'radius': radius
        })
        
        if query:
            kwargs['query'] = query
        
        # Utiliser la méthode search avec les paramètres géographiques
        params = self._build_search_params(**kwargs)
        response_data = self._make_request('GET', '/search/nearby', params=params)
        return SearchResults.from_dict(response_data)

    def search_by_category(
        self,
        category_id: str,
        query: Optional[str] = None,
        include_subcategories: bool = True,
        max_depth: int = 3,
        show_counts: bool = True,
        **kwargs
    ) -> CategorySearchResults:
        """
        Recherche dans une catégorie spécifique avec navigation hiérarchique
        
        Args:
            category_id: ID de la catégorie
            query: Requête textuelle optionnelle
            include_subcategories: Inclure les sous-catégories
            max_depth: Profondeur maximale de la hiérarchie
            show_counts: Afficher les compteurs de ressources
            **kwargs: Autres paramètres de recherche
            
        Returns:
            CategorySearchResults: Résultats avec navigation hiérarchique
        """
        params = self._build_search_params(query=query, **kwargs)
        params.update({
            'includeSubcategories': str(include_subcategories).lower(),
            'maxDepth': max_depth,
            'showCounts': str(show_counts).lower()
        })
        
        endpoint = f'/search/categories/{category_id}/hierarchy'
        response_data = self._make_request('GET', endpoint, params=params)
        return CategorySearchResults.from_dict(response_data)

    def search_by_category_slug(
        self,
        slug: str,
        query: Optional[str] = None,
        **kwargs
    ) -> CategorySearchResults:
        """
        Recherche par slug de catégorie (SEO-friendly)
        
        Args:
            slug: Slug de la catégorie
            query: Requête textuelle optionnelle
            **kwargs: Autres paramètres de recherche
            
        Returns:
            CategorySearchResults: Résultats avec informations SEO
        """
        params = self._build_search_params(query=query, **kwargs)
        endpoint = f'/search/categories/{slug}'
        response_data = self._make_request('GET', endpoint, params=params)
        return CategorySearchResults.from_dict(response_data)

    def search_multi_type(
        self,
        query: Optional[str] = None,
        include_types: Optional[List[ResourceType]] = None,
        group_by_type: bool = True,
        global_relevance_sort: bool = False,
        **kwargs
    ) -> MultiTypeSearchResults:
        """
        Recherche simultanée dans tous les types de ressources
        
        Args:
            query: Requête de recherche
            include_types: Types de ressources à inclure
            group_by_type: Grouper les résultats par type
            global_relevance_sort: Tri par pertinence globale
            **kwargs: Autres paramètres de recherche
            
        Returns:
            MultiTypeSearchResults: Résultats groupés par type
        """
        params = self._build_search_params(query=query, **kwargs)
        
        if include_types:
            params['includeTypes'] = ','.join([rt.value for rt in include_types])
        params['groupByType'] = str(group_by_type).lower()
        params['globalRelevanceSort'] = str(global_relevance_sort).lower()
        
        response_data = self._make_request('GET', '/search/multi-type', params=params)
        return MultiTypeSearchResults.from_dict(response_data)

    def get_category_hierarchy(
        self,
        category_id: Optional[str] = None,
        include_resource_counts: bool = True,
        max_depth: int = 5
    ) -> Dict[str, Any]:
        """
        Obtient la hiérarchie complète des catégories
        
        Args:
            category_id: ID de la catégorie courante pour contexte
            include_resource_counts: Inclure les compteurs de ressources
            max_depth: Profondeur maximale
            
        Returns:
            Dict: Hiérarchie des catégories
        """
        params = {
            'includeResourceCounts': str(include_resource_counts).lower(),
            'maxDepth': max_depth
        }
        
        if category_id:
            params['categoryId'] = category_id
        
        return self._make_request('GET', '/search/categories/hierarchy', params=params)

    def get_search_analytics(self, period: str = '7d') -> SearchAnalytics:
        """
        Obtient les analytics de recherche (nécessite authentification)
        
        Args:
            period: Période d'analyse (7d, 30d, 90d)
            
        Returns:
            SearchAnalytics: Statistiques de recherche
            
        Raises:
            ValidationError: Si aucune clé API n'est configurée
        """
        if not self.api_key:
            raise ValidationError("API key required for analytics")
        
        params = {'period': period}
        response_data = self._make_request('GET', '/search/analytics', params=params)
        return SearchAnalytics.from_dict(response_data)

    def search_with_retry(
        self,
        max_retries: int = 3,
        backoff_factor: float = 1.0,
        **search_params
    ) -> SearchResults:
        """
        Recherche avec retry automatique et backoff exponentiel
        
        Args:
            max_retries: Nombre maximum de tentatives
            backoff_factor: Facteur de backoff
            **search_params: Paramètres de recherche
            
        Returns:
            SearchResults: Résultats de recherche
        """
        last_exception = None
        
        for attempt in range(max_retries + 1):
            try:
                return self.search(**search_params)
            except (ServerError, requests.RequestException) as e:
                last_exception = e
                
                if attempt == max_retries:
                    break
                
                # Attendre avant de réessayer (backoff exponentiel)
                delay = backoff_factor * (2 ** attempt)
                time.sleep(min(delay, 10))  # Max 10 secondes
        
        raise last_exception

    def _build_search_params(self, **kwargs) -> Dict[str, Any]:
        """Construit les paramètres de requête pour la recherche"""
        params = {}
        
        # Mapping des paramètres
        param_mapping = {
            'query': 'q',
            'categories': 'categories',
            'resource_types': 'resourceTypes',
            'plans': 'plans',
            'min_price': 'minPrice',
            'max_price': 'maxPrice',
            'verified': 'verified',
            'city': 'city',
            'region': 'region',
            'tags': 'tags',
            'sort': 'sort',
            'order': 'order',
            'page': 'page',
            'limit': 'limit',
            'facets': 'facets',
            'user_id': 'userId',
            'session_id': 'sessionId',
            'latitude': 'latitude',
            'longitude': 'longitude',
            'radius': 'radius'
        }
        
        for key, value in kwargs.items():
            if value is not None and key in param_mapping:
                param_key = param_mapping[key]
                
                if isinstance(value, list):
                    if key == 'resource_types':
                        params[param_key] = ','.join([rt.value for rt in value])
                    else:
                        params[param_key] = ','.join(map(str, value))
                elif isinstance(value, (SortField, SortOrder)):
                    params[param_key] = value.value
                elif isinstance(value, bool):
                    params[param_key] = str(value).lower()
                else:
                    params[param_key] = value
        
        return params

    def _make_request(
        self,
        method: str,
        endpoint: str,
        params: Optional[Dict[str, Any]] = None,
        data: Optional[Dict[str, Any]] = None,
        **kwargs
    ) -> Any:
        """
        Effectue une requête HTTP avec gestion d'erreurs et cache
        
        Args:
            method: Méthode HTTP (GET, POST, etc.)
            endpoint: Endpoint de l'API
            params: Paramètres de requête
            data: Données du corps de requête
            
        Returns:
            Any: Réponse JSON désérialisée
            
        Raises:
            ROMAPIError: En cas d'erreur API
        """
        url = urljoin(self.base_url, endpoint.lstrip('/'))
        
        # Vérifier le cache pour les requêtes GET
        cache_key = None
        if method == 'GET' and self.cache:
            cache_key = self.cache.generate_cache_key(url, params or {})
            cached_result = self.cache.get(cache_key)
            if cached_result:
                return cached_result
        
        try:
            response = self.session.request(
                method=method,
                url=url,
                params=params,
                json=data,
                timeout=self.timeout,
                **kwargs
            )
            
            # Mettre à jour les informations de rate limiting
            self._update_rate_limit_info(response)
            
            # Vérifier le statut de la réponse
            if response.status_code == 400:
                error_data = response.json()
                raise ValidationError(error_data.get('error', {}).get('message', 'Validation error'))
            elif response.status_code == 404:
                error_data = response.json()
                raise NotFoundError(error_data.get('error', {}).get('message', 'Resource not found'))
            elif response.status_code == 429:
                error_data = response.json()
                raise RateLimitError(error_data.get('error', {}).get('message', 'Rate limit exceeded'))
            elif response.status_code >= 500:
                error_data = response.json() if response.content else {}
                raise ServerError(error_data.get('error', {}).get('message', 'Server error'))
            elif not response.ok:
                error_data = response.json() if response.content else {}
                raise ROMAPIError(error_data.get('error', {}).get('message', f'HTTP {response.status_code}'))
            
            result = response.json()
            
            # Mettre en cache pour les requêtes GET
            if method == 'GET' and self.cache and cache_key:
                self.cache.set(cache_key, result, self.cache_timeout)
            
            return result
            
        except requests.RequestException as e:
            raise ROMAPIError(f"Request failed: {str(e)}")

    def _update_rate_limit_info(self, response: requests.Response) -> None:
        """Met à jour les informations de rate limiting"""
        headers = response.headers
        if 'X-RateLimit-Limit' in headers:
            self.rate_limit_info = {
                'limit': int(headers.get('X-RateLimit-Limit', 0)),
                'remaining': int(headers.get('X-RateLimit-Remaining', 0)),
                'reset_time': int(headers.get('X-RateLimit-Reset', 0))
            }

    @property
    def rate_limits(self) -> Optional[Dict[str, Any]]:
        """Informations de rate limiting actuelles"""
        return self.rate_limit_info

    def clear_cache(self) -> None:
        """Vide le cache local"""
        if self.cache:
            self.cache.clear()

    def set_api_key(self, api_key: str) -> None:
        """Définit la clé API"""
        self.api_key = api_key
        self.session.headers['Authorization'] = f'Bearer {api_key}'

    def set_timeout(self, timeout: float) -> None:
        """Définit le timeout des requêtes"""
        self.timeout = timeout