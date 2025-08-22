"""
Types et structures de données pour le SDK ROMAPI Search
"""

from enum import Enum
from typing import Dict, List, Optional, Union, Any
from dataclasses import dataclass, field
from datetime import datetime


class ResourceType(Enum):
    """Types de ressources disponibles"""
    API = "API"
    BUSINESS = "BUSINESS"
    SERVICE = "SERVICE"


class ResourcePlan(Enum):
    """Plans tarifaires disponibles"""
    FREE = "FREE"
    PREMIUM = "PREMIUM"
    FEATURED = "FEATURED"


class SortField(Enum):
    """Champs de tri disponibles"""
    RELEVANCE = "relevance"
    CREATED_AT = "createdAt"
    UPDATED_AT = "updatedAt"
    NAME = "name"
    POPULARITY = "popularity"
    RATING = "rating"
    DISTANCE = "distance"


class SortOrder(Enum):
    """Ordres de tri"""
    ASC = "asc"
    DESC = "desc"


class SuggestionType(Enum):
    """Types de suggestions"""
    QUERY = "query"
    CATEGORY = "category"
    RESOURCE = "resource"
    POPULAR = "popular"


@dataclass
class GeoLocation:
    """Position géographique"""
    latitude: float
    longitude: float

    def __post_init__(self):
        if not (-90 <= self.latitude <= 90):
            raise ValueError("Latitude must be between -90 and 90")
        if not (-180 <= self.longitude <= 180):
            raise ValueError("Longitude must be between -180 and 180")


@dataclass
class PriceRange:
    """Fourchette de prix"""
    min: Optional[int] = None
    max: Optional[int] = None

    def __post_init__(self):
        if self.min is not None and self.min < 0:
            raise ValueError("Minimum price cannot be negative")
        if self.max is not None and self.max < 0:
            raise ValueError("Maximum price cannot be negative")
        if (self.min is not None and self.max is not None and 
            self.min > self.max):
            raise ValueError("Minimum price cannot be greater than maximum price")


@dataclass
class Address:
    """Adresse et informations de localisation"""
    address_line1: Optional[str] = None
    address_line2: Optional[str] = None
    city: Optional[str] = None
    region: Optional[str] = None
    postal_code: Optional[str] = None
    country: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None


@dataclass
class Contact:
    """Informations de contact"""
    phone: Optional[str] = None
    email: Optional[str] = None
    website: Optional[str] = None


@dataclass
class Category:
    """Informations de catégorie"""
    id: str
    name: str
    slug: str
    description: Optional[str] = None
    icon: Optional[str] = None


@dataclass
class SearchFilters:
    """Filtres de recherche"""
    categories: Optional[List[str]] = None
    resource_types: Optional[List[ResourceType]] = None
    plans: Optional[List[ResourcePlan]] = None
    price_range: Optional[PriceRange] = None
    verified: Optional[bool] = None
    city: Optional[str] = None
    region: Optional[str] = None
    tags: Optional[List[str]] = None


@dataclass
class SortOptions:
    """Options de tri"""
    field: SortField = SortField.RELEVANCE
    order: SortOrder = SortOrder.DESC


@dataclass
class PaginationParams:
    """Paramètres de pagination"""
    page: int = 1
    limit: int = 20

    def __post_init__(self):
        if self.page < 1:
            raise ValueError("Page must be >= 1")
        if not (1 <= self.limit <= 100):
            raise ValueError("Limit must be between 1 and 100")


@dataclass
class SearchParams:
    """Paramètres de recherche complets"""
    query: Optional[str] = None
    filters: Optional[SearchFilters] = None
    sort: Optional[SortOptions] = None
    pagination: Optional[PaginationParams] = None
    facets: Optional[List[str]] = None
    user_id: Optional[str] = None
    session_id: Optional[str] = None


@dataclass
class GeoSearchParams(SearchParams):
    """Paramètres de recherche géographique"""
    location: Optional[GeoLocation] = None
    radius: Optional[float] = None

    def __post_init__(self):
        if self.radius is not None and not (0.1 <= self.radius <= 100):
            raise ValueError("Radius must be between 0.1 and 100 km")


@dataclass
class CategorySearchParams(SearchParams):
    """Paramètres de recherche par catégorie"""
    include_subcategories: bool = True
    max_depth: int = 3
    show_counts: bool = True

    def __post_init__(self):
        if self.max_depth < 1:
            raise ValueError("Max depth must be >= 1")


@dataclass
class MultiTypeSearchParams(SearchParams):
    """Paramètres de recherche multi-types"""
    include_types: Optional[List[ResourceType]] = None
    group_by_type: bool = True
    global_relevance_sort: bool = False


@dataclass
class SearchHit:
    """Résultat de recherche individuel"""
    id: str
    name: str
    slug: str
    description: str
    resource_type: ResourceType
    plan: ResourcePlan
    verified: bool
    score: float
    category: Category
    address: Optional[Address] = None
    contact: Optional[Contact] = None
    tags: List[str] = field(default_factory=list)
    rating: Optional[float] = None
    distance: Optional[float] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    highlights: Optional[List[str]] = None

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'SearchHit':
        """Créer un SearchHit à partir d'un dictionnaire"""
        # Convertir les dates
        created_at = None
        if data.get('createdAt'):
            created_at = datetime.fromisoformat(data['createdAt'].replace('Z', '+00:00'))
        
        updated_at = None
        if data.get('updatedAt'):
            updated_at = datetime.fromisoformat(data['updatedAt'].replace('Z', '+00:00'))

        # Convertir la catégorie
        category_data = data.get('category', {})
        category = Category(
            id=category_data.get('id', ''),
            name=category_data.get('name', ''),
            slug=category_data.get('slug', ''),
            description=category_data.get('description'),
            icon=category_data.get('icon')
        )

        # Convertir l'adresse
        address = None
        if data.get('address'):
            address_data = data['address']
            address = Address(
                address_line1=address_data.get('addressLine1'),
                address_line2=address_data.get('addressLine2'),
                city=address_data.get('city'),
                region=address_data.get('region'),
                postal_code=address_data.get('postalCode'),
                country=address_data.get('country'),
                latitude=address_data.get('latitude'),
                longitude=address_data.get('longitude')
            )

        # Convertir le contact
        contact = None
        if data.get('contact'):
            contact_data = data['contact']
            contact = Contact(
                phone=contact_data.get('phone'),
                email=contact_data.get('email'),
                website=contact_data.get('website')
            )

        return cls(
            id=data['id'],
            name=data['name'],
            slug=data['slug'],
            description=data['description'],
            resource_type=ResourceType(data['resourceType']),
            plan=ResourcePlan(data['plan']),
            verified=data['verified'],
            score=data['score'],
            category=category,
            address=address,
            contact=contact,
            tags=data.get('tags', []),
            rating=data.get('rating'),
            distance=data.get('distance'),
            created_at=created_at,
            updated_at=updated_at,
            highlights=data.get('highlights')
        )


@dataclass
class SearchFacet:
    """Facette de recherche avec compteurs"""
    name: str
    values: Dict[str, int]
    total: int

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'SearchFacet':
        return cls(
            name=data['name'],
            values=data['values'],
            total=data['total']
        )


@dataclass
class PaginationInfo:
    """Informations de pagination"""
    page: int
    limit: int
    total_pages: int
    has_next: bool
    has_prev: bool

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'PaginationInfo':
        return cls(
            page=data['page'],
            limit=data['limit'],
            total_pages=data['totalPages'],
            has_next=data['hasNext'],
            has_prev=data['hasPrev']
        )


@dataclass
class SearchMetadata:
    """Métadonnées de recherche"""
    query: Optional[str]
    applied_filters: List[str]
    search_id: str

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'SearchMetadata':
        return cls(
            query=data.get('query'),
            applied_filters=data.get('appliedFilters', []),
            search_id=data['searchId']
        )


@dataclass
class SearchResults:
    """Résultats de recherche complets"""
    hits: List[SearchHit]
    total: int
    took: int
    facets: List[SearchFacet]
    suggestions: Optional[List[str]] = None
    pagination: Optional[PaginationInfo] = None
    metadata: Optional[SearchMetadata] = None

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'SearchResults':
        """Créer SearchResults à partir d'un dictionnaire"""
        hits = [SearchHit.from_dict(hit_data) for hit_data in data.get('hits', [])]
        facets = [SearchFacet.from_dict(facet_data) for facet_data in data.get('facets', [])]
        
        pagination = None
        if data.get('pagination'):
            pagination = PaginationInfo.from_dict(data['pagination'])
        
        metadata = None
        if data.get('metadata'):
            metadata = SearchMetadata.from_dict(data['metadata'])

        return cls(
            hits=hits,
            total=data['total'],
            took=data['took'],
            facets=facets,
            suggestions=data.get('suggestions'),
            pagination=pagination,
            metadata=metadata
        )


@dataclass
class Suggestion:
    """Suggestion de recherche"""
    text: str
    score: float
    type: SuggestionType
    count: Optional[int] = None
    category: Optional[Category] = None
    highlighted: Optional[str] = None

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'Suggestion':
        category = None
        if data.get('category'):
            category_data = data['category']
            category = Category(
                id=category_data['id'],
                name=category_data['name'],
                slug=category_data['slug'],
                description=category_data.get('description'),
                icon=category_data.get('icon')
            )

        return cls(
            text=data['text'],
            score=data['score'],
            type=SuggestionType(data['type']),
            count=data.get('count'),
            category=category,
            highlighted=data.get('highlighted')
        )


@dataclass
class CategoryInfo:
    """Informations détaillées de catégorie"""
    id: str
    name: str
    slug: str
    description: str
    icon: str
    resource_count: int

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'CategoryInfo':
        return cls(
            id=data['id'],
            name=data['name'],
            slug=data['slug'],
            description=data['description'],
            icon=data['icon'],
            resource_count=data['resourceCount']
        )


@dataclass
class Breadcrumb:
    """Élément de fil d'Ariane"""
    id: str
    name: str
    slug: str
    url: str

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'Breadcrumb':
        return cls(
            id=data['id'],
            name=data['name'],
            slug=data['slug'],
            url=data['url']
        )


@dataclass
class SEOInfo:
    """Informations SEO"""
    title: str
    description: str
    canonical_url: str
    share_url: str
    breadcrumbs_schema: Optional[Dict[str, Any]] = None

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'SEOInfo':
        return cls(
            title=data['title'],
            description=data['description'],
            canonical_url=data['canonicalUrl'],
            share_url=data['shareUrl'],
            breadcrumbs_schema=data.get('breadcrumbsSchema')
        )


@dataclass
class CategorySearchResults(SearchResults):
    """Résultats de recherche par catégorie avec navigation"""
    category_info: CategoryInfo
    breadcrumbs: List[Breadcrumb]
    subcategories: List[CategoryInfo]
    parent_category: Optional[CategoryInfo] = None
    seo: Optional[SEOInfo] = None

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'CategorySearchResults':
        # Hériter des champs de SearchResults
        base_results = SearchResults.from_dict(data)
        
        # Ajouter les champs spécifiques
        category_info = CategoryInfo.from_dict(data['categoryInfo'])
        breadcrumbs = [Breadcrumb.from_dict(bc) for bc in data.get('breadcrumbs', [])]
        subcategories = [CategoryInfo.from_dict(sc) for sc in data.get('subcategories', [])]
        
        parent_category = None
        if data.get('parentCategory'):
            parent_category = CategoryInfo.from_dict(data['parentCategory'])
        
        seo = None
        if data.get('seo'):
            seo = SEOInfo.from_dict(data['seo'])

        return cls(
            hits=base_results.hits,
            total=base_results.total,
            took=base_results.took,
            facets=base_results.facets,
            suggestions=base_results.suggestions,
            pagination=base_results.pagination,
            metadata=base_results.metadata,
            category_info=category_info,
            breadcrumbs=breadcrumbs,
            subcategories=subcategories,
            parent_category=parent_category,
            seo=seo
        )


@dataclass
class TypedSearchResults:
    """Résultats de recherche pour un type spécifique"""
    hits: List[SearchHit]
    total: int
    facets: List[SearchFacet]

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'TypedSearchResults':
        hits = [SearchHit.from_dict(hit_data) for hit_data in data.get('hits', [])]
        facets = [SearchFacet.from_dict(facet_data) for facet_data in data.get('facets', [])]
        
        return cls(
            hits=hits,
            total=data['total'],
            facets=facets
        )


@dataclass
class MultiTypeSearchResults:
    """Résultats de recherche multi-types"""
    results_by_type: Dict[str, TypedSearchResults]
    total_across_types: int
    took: int
    mixed_results: Optional[List[SearchHit]] = None
    pagination_by_type: Optional[Dict[str, PaginationInfo]] = None

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'MultiTypeSearchResults':
        results_by_type = {}
        for type_name, type_data in data.get('resultsByType', {}).items():
            results_by_type[type_name] = TypedSearchResults.from_dict(type_data)
        
        mixed_results = None
        if data.get('mixedResults'):
            mixed_results = [SearchHit.from_dict(hit) for hit in data['mixedResults']]
        
        pagination_by_type = None
        if data.get('paginationByType'):
            pagination_by_type = {}
            for type_name, pagination_data in data['paginationByType'].items():
                pagination_by_type[type_name] = PaginationInfo.from_dict(pagination_data)

        return cls(
            results_by_type=results_by_type,
            total_across_types=data['totalAcrossTypes'],
            took=data['took'],
            mixed_results=mixed_results,
            pagination_by_type=pagination_by_type
        )


@dataclass
class PopularTerm:
    """Terme de recherche populaire"""
    term: str
    count: int
    percentage: float

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'PopularTerm':
        return cls(
            term=data['term'],
            count=data['count'],
            percentage=data['percentage']
        )


@dataclass
class NoResultsQuery:
    """Requête sans résultats"""
    query: str
    count: int
    last_seen: datetime

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'NoResultsQuery':
        last_seen = datetime.fromisoformat(data['lastSeen'].replace('Z', '+00:00'))
        return cls(
            query=data['query'],
            count=data['count'],
            last_seen=last_seen
        )


@dataclass
class SearchMetrics:
    """Métriques de performance de recherche"""
    average_response_time: float
    total_searches: int
    success_rate: float
    cache_hit_rate: float

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'SearchMetrics':
        return cls(
            average_response_time=data['averageResponseTime'],
            total_searches=data['totalSearches'],
            success_rate=data['successRate'],
            cache_hit_rate=data['cacheHitRate']
        )


@dataclass
class SearchAnalytics:
    """Analytics de recherche complètes"""
    popular_terms: List[PopularTerm]
    no_results_queries: List[NoResultsQuery]
    metrics: SearchMetrics

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'SearchAnalytics':
        popular_terms = [PopularTerm.from_dict(term) for term in data.get('popularTerms', [])]
        no_results_queries = [NoResultsQuery.from_dict(query) for query in data.get('noResultsQueries', [])]
        metrics = SearchMetrics.from_dict(data['metrics'])

        return cls(
            popular_terms=popular_terms,
            no_results_queries=no_results_queries,
            metrics=metrics
        )


# Types utilitaires
ClientConfig = Dict[str, Any]
RequestOptions = Dict[str, Any]
CacheEntry = Dict[str, Any]
RateLimitInfo = Dict[str, Any]