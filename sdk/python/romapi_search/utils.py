"""
Utilitaires pour le SDK ROMAPI Search
"""

import time
import hashlib
import json
import math
from typing import Dict, List, Optional, Any, Union
from urllib.parse import urlencode

from .types import (
    SearchParams,
    SearchFilters,
    ResourceType,
    ResourcePlan,
    SortField,
    SortOrder,
    GeoLocation,
    SearchHit,
    PaginationParams,
    SortOptions,
    PriceRange,
)


class SearchParamsBuilder:
    """
    Builder pour construire facilement des paramètres de recherche
    
    Example:
        >>> builder = SearchParamsBuilder()
        >>> params = (builder
        ...     .query("restaurant douala")
        ...     .categories("123e4567-e89b-12d3-a456-426614174000")
        ...     .resource_types(ResourceType.BUSINESS)
        ...     .verified(True)
        ...     .paginate(1, 10)
        ...     .build())
    """
    
    def __init__(self):
        self._params = SearchParams()
        self._filters = SearchFilters()
    
    def query(self, q: str) -> 'SearchParamsBuilder':
        """Définir la requête textuelle"""
        self._params.query = q.strip() if q else None
        return self
    
    def categories(self, *category_ids: str) -> 'SearchParamsBuilder':
        """Ajouter des filtres par catégorie"""
        if not self._filters.categories:
            self._filters.categories = []
        self._filters.categories.extend(category_ids)
        return self
    
    def resource_types(self, *types: ResourceType) -> 'SearchParamsBuilder':
        """Filtrer par types de ressources"""
        if not self._filters.resource_types:
            self._filters.resource_types = []
        self._filters.resource_types.extend(types)
        return self
    
    def plans(self, *plans: ResourcePlan) -> 'SearchParamsBuilder':
        """Filtrer par plans tarifaires"""
        if not self._filters.plans:
            self._filters.plans = []
        self._filters.plans.extend(plans)
        return self
    
    def price_range(self, min_price: Optional[int] = None, max_price: Optional[int] = None) -> 'SearchParamsBuilder':
        """Définir une fourchette de prix"""
        self._filters.price_range = PriceRange(min=min_price, max=max_price)
        return self
    
    def verified(self, is_verified: bool = True) -> 'SearchParamsBuilder':
        """Filtrer par ressources vérifiées"""
        self._filters.verified = is_verified
        return self
    
    def city(self, city_name: str) -> 'SearchParamsBuilder':
        """Filtrer par ville"""
        self._filters.city = city_name
        return self
    
    def region(self, region_name: str) -> 'SearchParamsBuilder':
        """Filtrer par région"""
        self._filters.region = region_name
        return self
    
    def tags(self, *tags: str) -> 'SearchParamsBuilder':
        """Ajouter des tags"""
        if not self._filters.tags:
            self._filters.tags = []
        self._filters.tags.extend(tags)
        return self
    
    def sort_by(self, field: SortField, order: SortOrder = SortOrder.DESC) -> 'SearchParamsBuilder':
        """Définir le tri"""
        self._params.sort = SortOptions(field=field, order=order)
        return self
    
    def paginate(self, page: int, limit: int = 20) -> 'SearchParamsBuilder':
        """Définir la pagination"""
        self._params.pagination = PaginationParams(page=page, limit=limit)
        return self
    
    def facets(self, *facet_names: str) -> 'SearchParamsBuilder':
        """Définir les facettes à inclure"""
        self._params.facets = list(facet_names)
        return self
    
    def user_id(self, user_id: str) -> 'SearchParamsBuilder':
        """Définir l'ID utilisateur pour personnalisation"""
        self._params.user_id = user_id
        return self
    
    def session_id(self, session_id: str) -> 'SearchParamsBuilder':
        """Définir l'ID de session"""
        self._params.session_id = session_id
        return self
    
    def build(self) -> SearchParams:
        """Construire les paramètres finaux"""
        # Assigner les filtres s'ils ne sont pas vides
        if any([
            self._filters.categories,
            self._filters.resource_types,
            self._filters.plans,
            self._filters.price_range,
            self._filters.verified is not None,
            self._filters.city,
            self._filters.region,
            self._filters.tags
        ]):
            self._params.filters = self._filters
        
        return self._params
    
    def reset(self) -> 'SearchParamsBuilder':
        """Réinitialiser le builder"""
        self._params = SearchParams()
        self._filters = SearchFilters()
        return self


class GeoUtils:
    """Utilitaires de géolocalisation"""
    
    @staticmethod
    def calculate_distance(point1: GeoLocation, point2: GeoLocation) -> float:
        """
        Calculer la distance entre deux points géographiques (formule de Haversine)
        
        Args:
            point1: Premier point géographique
            point2: Deuxième point géographique
            
        Returns:
            float: Distance en kilomètres
        """
        R = 6371  # Rayon de la Terre en km
        
        lat1_rad = math.radians(point1.latitude)
        lat2_rad = math.radians(point2.latitude)
        delta_lat = math.radians(point2.latitude - point1.latitude)
        delta_lon = math.radians(point2.longitude - point1.longitude)
        
        a = (math.sin(delta_lat / 2) ** 2 +
             math.cos(lat1_rad) * math.cos(lat2_rad) *
             math.sin(delta_lon / 2) ** 2)
        
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
        
        return R * c
    
    @staticmethod
    def is_valid_location(location: GeoLocation) -> bool:
        """
        Vérifier si une position géographique est valide
        
        Args:
            location: Position à vérifier
            
        Returns:
            bool: True si la position est valide
        """
        return (-90 <= location.latitude <= 90 and
                -180 <= location.longitude <= 180)
    
    @staticmethod
    def get_bounding_box(center: GeoLocation, radius_km: float) -> Dict[str, float]:
        """
        Calculer la bounding box pour un point et un rayon donnés
        
        Args:
            center: Point central
            radius_km: Rayon en kilomètres
            
        Returns:
            Dict: Bounding box avec min/max lat/lon
        """
        # Approximation simple (pas précise aux pôles)
        lat_delta = radius_km / 111.0  # ~111 km par degré de latitude
        lon_delta = radius_km / (111.0 * math.cos(math.radians(center.latitude)))
        
        return {
            'min_lat': center.latitude - lat_delta,
            'max_lat': center.latitude + lat_delta,
            'min_lon': center.longitude - lon_delta,
            'max_lon': center.longitude + lon_delta
        }


class FormatUtils:
    """Utilitaires de formatage et validation"""
    
    @staticmethod
    def format_price(price: int, currency: str = 'FCFA') -> str:
        """
        Formater un prix
        
        Args:
            price: Prix en centimes
            currency: Devise (défaut: FCFA)
            
        Returns:
            str: Prix formaté
        """
        if currency == 'FCFA':
            return f"{price:,} FCFA".replace(',', ' ')
        return f"{price:,} {currency}"
    
    @staticmethod
    def format_distance(distance: float) -> str:
        """
        Formater une distance
        
        Args:
            distance: Distance en kilomètres
            
        Returns:
            str: Distance formatée
        """
        if distance < 1:
            return f"{int(distance * 1000)} m"
        return f"{distance:.1f} km"
    
    @staticmethod
    def sanitize_query(query: str) -> str:
        """
        Nettoyer et valider une requête de recherche
        
        Args:
            query: Requête à nettoyer
            
        Returns:
            str: Requête nettoyée
        """
        if not query:
            return ""
        
        # Nettoyer la requête
        cleaned = query.strip()
        cleaned = ' '.join(cleaned.split())  # Normaliser les espaces
        cleaned = cleaned.replace('<', '').replace('>', '')  # Supprimer les caractères dangereux
        
        # Limiter la longueur
        return cleaned[:200]
    
    @staticmethod
    def is_valid_email(email: str) -> bool:
        """Valider un email"""
        import re
        pattern = r'^[^\s@]+@[^\s@]+\.[^\s@]+$'
        return re.match(pattern, email) is not None
    
    @staticmethod
    def is_valid_cameroon_phone(phone: str) -> bool:
        """Valider un numéro de téléphone camerounais"""
        import re
        # Supprimer les espaces
        clean_phone = phone.replace(' ', '').replace('-', '')
        # Pattern pour numéros camerounais
        pattern = r'^(\+237|237)?[2368]\d{8}$'
        return re.match(pattern, clean_phone) is not None


class CacheUtils:
    """Utilitaires de cache local"""
    
    def __init__(self):
        self._cache: Dict[str, Dict[str, Any]] = {}
    
    def generate_cache_key(self, url: str, params: Dict[str, Any]) -> str:
        """
        Générer une clé de cache à partir d'une URL et de paramètres
        
        Args:
            url: URL de base
            params: Paramètres de requête
            
        Returns:
            str: Clé de cache unique
        """
        # Trier les paramètres pour une clé cohérente
        sorted_params = sorted(params.items()) if params else []
        cache_string = f"{url}?{urlencode(sorted_params)}"
        return hashlib.md5(cache_string.encode()).hexdigest()
    
    def set(self, key: str, data: Any, ttl_seconds: int = 300) -> None:
        """
        Mettre en cache avec TTL
        
        Args:
            key: Clé de cache
            data: Données à mettre en cache
            ttl_seconds: Durée de vie en secondes
        """
        self._cache[key] = {
            'data': data,
            'timestamp': time.time(),
            'ttl': ttl_seconds
        }
    
    def get(self, key: str) -> Optional[Any]:
        """
        Récupérer du cache
        
        Args:
            key: Clé de cache
            
        Returns:
            Any: Données en cache ou None si expirées/inexistantes
        """
        if key not in self._cache:
            return None
        
        entry = self._cache[key]
        if time.time() - entry['timestamp'] > entry['ttl']:
            del self._cache[key]
            return None
        
        return entry['data']
    
    def clear(self) -> None:
        """Vider tout le cache"""
        self._cache.clear()
    
    def cleanup(self) -> None:
        """Nettoyer les entrées expirées"""
        current_time = time.time()
        expired_keys = [
            key for key, entry in self._cache.items()
            if current_time - entry['timestamp'] > entry['ttl']
        ]
        
        for key in expired_keys:
            del self._cache[key]
    
    @property
    def size(self) -> int:
        """Nombre d'entrées en cache"""
        return len(self._cache)


class ResultsUtils:
    """Utilitaires de traitement des résultats"""
    
    @staticmethod
    def filter_by_min_score(hits: List[SearchHit], min_score: float) -> List[SearchHit]:
        """Filtrer les résultats par score minimum"""
        return [hit for hit in hits if hit.score >= min_score]
    
    @staticmethod
    def group_by_category(hits: List[SearchHit]) -> Dict[str, List[SearchHit]]:
        """Grouper les résultats par catégorie"""
        groups: Dict[str, List[SearchHit]] = {}
        
        for hit in hits:
            category_name = hit.category.name
            if category_name not in groups:
                groups[category_name] = []
            groups[category_name].append(hit)
        
        return groups
    
    @staticmethod
    def sort_by_distance(hits: List[SearchHit]) -> List[SearchHit]:
        """Trier les résultats par distance (si disponible)"""
        return sorted(
            [hit for hit in hits if hit.distance is not None],
            key=lambda x: x.distance or 0
        )
    
    @staticmethod
    def extract_highlights(hits: List[SearchHit]) -> List[str]:
        """Extraire tous les highlights uniques"""
        highlights = set()
        for hit in hits:
            if hit.highlights:
                highlights.update(hit.highlights)
        return list(highlights)
    
    @staticmethod
    def calculate_stats(hits: List[SearchHit]) -> Dict[str, Any]:
        """
        Calculer des statistiques sur les résultats
        
        Returns:
            Dict: Statistiques incluant scores moyens, distribution des types, etc.
        """
        if not hits:
            return {
                'average_score': 0,
                'average_rating': 0,
                'verified_count': 0,
                'type_distribution': {}
            }
        
        total_score = sum(hit.score for hit in hits)
        ratings = [hit.rating for hit in hits if hit.rating is not None]
        verified_count = sum(1 for hit in hits if hit.verified)
        
        type_distribution = {}
        for hit in hits:
            resource_type = hit.resource_type.value
            type_distribution[resource_type] = type_distribution.get(resource_type, 0) + 1
        
        return {
            'average_score': total_score / len(hits),
            'average_rating': sum(ratings) / len(ratings) if ratings else 0,
            'verified_count': verified_count,
            'type_distribution': type_distribution,
            'total_hits': len(hits),
            'verified_percentage': (verified_count / len(hits)) * 100
        }


class AsyncUtils:
    """Utilitaires pour opérations asynchrones"""
    
    @staticmethod
    def retry_with_backoff(
        func,
        max_retries: int = 3,
        backoff_factor: float = 1.0,
        max_delay: float = 10.0
    ):
        """
        Décorateur pour retry avec backoff exponentiel
        
        Args:
            func: Fonction à décorer
            max_retries: Nombre maximum de tentatives
            backoff_factor: Facteur de backoff
            max_delay: Délai maximum entre tentatives
        """
        def wrapper(*args, **kwargs):
            last_exception = None
            
            for attempt in range(max_retries + 1):
                try:
                    return func(*args, **kwargs)
                except Exception as e:
                    last_exception = e
                    
                    if attempt == max_retries:
                        break
                    
                    # Calculer le délai avec backoff exponentiel
                    delay = min(backoff_factor * (2 ** attempt), max_delay)
                    time.sleep(delay)
            
            raise last_exception
        
        return wrapper


# Constantes utiles
CAMEROON_CITIES = [
    'Yaoundé', 'Douala', 'Garoua', 'Bamenda', 'Maroua', 'Bafoussam',
    'Ngaoundéré', 'Bertoua', 'Loum', 'Kumba', 'Nkongsamba', 'Buea',
    'Limbe', 'Dschang', 'Foumban', 'Ebolowa', 'Kribi', 'Tiko'
]

CAMEROON_REGIONS = [
    'Adamaoua', 'Centre', 'Est', 'Extrême-Nord', 'Littoral',
    'Nord', 'Nord-Ouest', 'Ouest', 'Sud', 'Sud-Ouest'
]

COMMON_SEARCH_TERMS = [
    'restaurant', 'hotel', 'api', 'service', 'business',
    'payment', 'mobile money', 'delivery', 'transport',
    'fintech', 'ecommerce', 'healthcare', 'education'
]


# Factory functions
def create_search_builder() -> SearchParamsBuilder:
    """Créer un nouveau builder de paramètres de recherche"""
    return SearchParamsBuilder()


def create_geo_location(latitude: float, longitude: float) -> GeoLocation:
    """Créer une position géographique avec validation"""
    return GeoLocation(latitude=latitude, longitude=longitude)