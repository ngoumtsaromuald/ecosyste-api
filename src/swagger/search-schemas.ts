/**
 * Comprehensive Swagger schemas for Search API documentation
 */

import { ApiProperty } from '@nestjs/swagger';
import { ResourceType, ResourcePlan } from '@prisma/client';

// Base Search Schemas
export class SearchParamsDto {
  @ApiProperty({
    description: 'Requête de recherche textuelle en langage naturel',
    example: 'restaurant douala',
    required: false,
    maxLength: 200
  })
  q?: string;

  @ApiProperty({
    description: 'IDs des catégories à filtrer (séparés par virgule)',
    example: ['123e4567-e89b-12d3-a456-426614174000', '456e7890-e89b-12d3-a456-426614174001'],
    required: false,
    type: [String]
  })
  categories?: string[];

  @ApiProperty({
    description: 'Types de ressources à inclure',
    example: [ResourceType.BUSINESS, ResourceType.API],
    enum: ResourceType,
    enumName: 'ResourceType',
    isArray: true,
    required: false
  })
  resourceTypes?: ResourceType[];

  @ApiProperty({
    description: 'Plans tarifaires à filtrer',
    example: [ResourcePlan.FREE, ResourcePlan.PREMIUM],
    enum: ResourcePlan,
    enumName: 'ResourcePlan',
    isArray: true,
    required: false
  })
  plans?: ResourcePlan[];

  @ApiProperty({
    description: 'Prix minimum en FCFA',
    example: 1000,
    minimum: 0,
    required: false
  })
  minPrice?: number;

  @ApiProperty({
    description: 'Prix maximum en FCFA',
    example: 50000,
    minimum: 0,
    required: false
  })
  maxPrice?: number;

  @ApiProperty({
    description: 'Filtrer uniquement les ressources vérifiées',
    example: true,
    required: false
  })
  verified?: boolean;

  @ApiProperty({
    description: 'Ville pour filtrage géographique',
    example: 'Douala',
    required: false
  })
  city?: string;

  @ApiProperty({
    description: 'Région pour filtrage géographique',
    example: 'Littoral',
    required: false
  })
  region?: string;

  @ApiProperty({
    description: 'Tags à rechercher (séparés par virgule)',
    example: ['cuisine', 'africaine', 'livraison'],
    type: [String],
    required: false
  })
  tags?: string[];

  @ApiProperty({
    description: 'Champ de tri des résultats',
    example: 'relevance',
    enum: ['relevance', 'createdAt', 'updatedAt', 'name', 'popularity', 'rating', 'distance'],
    required: false
  })
  sort?: string;

  @ApiProperty({
    description: 'Ordre de tri (croissant ou décroissant)',
    example: 'desc',
    enum: ['asc', 'desc'],
    required: false
  })
  order?: string;

  @ApiProperty({
    description: 'Numéro de page (commence à 1)',
    example: 1,
    minimum: 1,
    required: false
  })
  page?: number;

  @ApiProperty({
    description: 'Nombre de résultats par page (maximum 100)',
    example: 20,
    minimum: 1,
    maximum: 100,
    required: false
  })
  limit?: number;

  @ApiProperty({
    description: 'Facettes à inclure dans la réponse',
    example: ['categories', 'resourceTypes', 'plans', 'verified'],
    type: [String],
    required: false
  })
  facets?: string[];
}

// Search Results Schemas
export class SearchHitDto {
  @ApiProperty({
    description: 'Identifiant unique de la ressource',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  id: string;

  @ApiProperty({
    description: 'Nom de la ressource',
    example: 'Restaurant Le Palais'
  })
  name: string;

  @ApiProperty({
    description: 'Slug SEO-friendly',
    example: 'restaurant-le-palais'
  })
  slug: string;

  @ApiProperty({
    description: 'Description détaillée de la ressource',
    example: 'Cuisine camerounaise authentique au cœur de Yaoundé'
  })
  description: string;

  @ApiProperty({
    description: 'Type de ressource',
    enum: ResourceType,
    example: ResourceType.BUSINESS
  })
  resourceType: ResourceType;

  @ApiProperty({
    description: 'Plan tarifaire',
    enum: ResourcePlan,
    example: ResourcePlan.FREE
  })
  plan: ResourcePlan;

  @ApiProperty({
    description: 'Statut de vérification',
    example: true
  })
  verified: boolean;

  @ApiProperty({
    description: 'Score de pertinence (0-1)',
    example: 0.95,
    minimum: 0,
    maximum: 1
  })
  score: number;

  @ApiProperty({
    description: 'Informations de catégorie',
    type: 'object',
    example: {
      id: '789e0123-e89b-12d3-a456-426614174000',
      name: 'Restaurants',
      slug: 'restaurants'
    }
  })
  category: {
    id: string;
    name: string;
    slug: string;
  };

  @ApiProperty({
    description: 'Adresse et localisation',
    type: 'object',
    example: {
      addressLine1: '123 Avenue Kennedy',
      city: 'Yaoundé',
      region: 'Centre',
      country: 'CM',
      latitude: 3.848,
      longitude: 11.502
    }
  })
  address?: {
    addressLine1?: string;
    city?: string;
    region?: string;
    country?: string;
    latitude?: number;
    longitude?: number;
  };

  @ApiProperty({
    description: 'Distance en kilomètres (si recherche géographique)',
    example: 2.5,
    required: false
  })
  distance?: number;

  @ApiProperty({
    description: 'Informations de contact',
    type: 'object',
    example: {
      phone: '+237123456789',
      email: 'contact@lepalais.cm',
      website: 'https://www.lepalais.cm'
    }
  })
  contact?: {
    phone?: string;
    email?: string;
    website?: string;
  };

  @ApiProperty({
    description: 'Tags associés',
    example: ['cuisine', 'africaine', 'livraison'],
    type: [String]
  })
  tags: string[];

  @ApiProperty({
    description: 'Note moyenne (1-5)',
    example: 4.5,
    minimum: 1,
    maximum: 5,
    required: false
  })
  rating?: number;

  @ApiProperty({
    description: 'Date de création',
    example: '2024-01-15T10:30:00Z'
  })
  createdAt: string;

  @ApiProperty({
    description: 'Extraits de texte mis en évidence',
    example: ['<em>Restaurant</em> Le Palais', 'Cuisine camerounaise <em>authentique</em>'],
    type: [String],
    required: false
  })
  highlights?: string[];
}

export class SearchFacetDto {
  @ApiProperty({
    description: 'Nom de la facette',
    example: 'categories'
  })
  name: string;

  @ApiProperty({
    description: 'Valeurs de la facette avec compteurs',
    type: 'object',
    example: {
      'restaurants': 45,
      'hotels': 23,
      'services': 12
    }
  })
  values: Record<string, number>;

  @ApiProperty({
    description: 'Nombre total d\'éléments dans cette facette',
    example: 80
  })
  total: number;
}

export class SearchResultsDto {
  @ApiProperty({
    description: 'Liste des résultats de recherche',
    type: [SearchHitDto],
    example: [
      {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Restaurant Le Palais',
        slug: 'restaurant-le-palais',
        description: 'Cuisine camerounaise authentique au cœur de Yaoundé',
        resourceType: 'BUSINESS',
        plan: 'FREE',
        verified: true,
        score: 0.95,
        category: {
          id: '789e0123-e89b-12d3-a456-426614174000',
          name: 'Restaurants',
          slug: 'restaurants'
        }
      }
    ]
  })
  hits: SearchHitDto[];

  @ApiProperty({
    description: 'Nombre total de résultats trouvés',
    example: 150
  })
  total: number;

  @ApiProperty({
    description: 'Temps de traitement en millisecondes',
    example: 45
  })
  took: number;

  @ApiProperty({
    description: 'Facettes avec compteurs pour filtrage',
    type: [SearchFacetDto]
  })
  facets: SearchFacetDto[];

  @ApiProperty({
    description: 'Suggestions de correction orthographique',
    example: ['restaurant', 'restaurants'],
    type: [String],
    required: false
  })
  suggestions?: string[];

  @ApiProperty({
    description: 'Informations de pagination',
    type: 'object',
    example: {
      page: 1,
      limit: 20,
      totalPages: 8,
      hasNext: true,
      hasPrev: false
    }
  })
  pagination: {
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };

  @ApiProperty({
    description: 'Métadonnées de la requête',
    type: 'object',
    example: {
      query: 'restaurant douala',
      appliedFilters: ['categories:restaurants', 'city:douala'],
      searchId: 'search_123456789'
    }
  })
  metadata: {
    query?: string;
    appliedFilters: string[];
    searchId: string;
  };
}

// Suggestion Schemas
export class SuggestionDto {
  @ApiProperty({
    description: 'Texte de la suggestion',
    example: 'restaurant douala'
  })
  text: string;

  @ApiProperty({
    description: 'Score de pertinence de la suggestion',
    example: 0.95,
    minimum: 0,
    maximum: 1
  })
  score: number;

  @ApiProperty({
    description: 'Type de suggestion',
    example: 'query',
    enum: ['query', 'category', 'resource', 'popular']
  })
  type: string;

  @ApiProperty({
    description: 'Nombre de résultats attendus',
    example: 25,
    required: false
  })
  count?: number;

  @ApiProperty({
    description: 'Catégorie associée (si applicable)',
    type: 'object',
    required: false,
    example: {
      id: '123e4567-e89b-12d3-a456-426614174000',
      name: 'Restaurants',
      slug: 'restaurants'
    }
  })
  category?: {
    id: string;
    name: string;
    slug: string;
  };

  @ApiProperty({
    description: 'Texte mis en évidence pour affichage',
    example: '<em>restaurant</em> douala',
    required: false
  })
  highlighted?: string;
}

// Geographic Search Schemas
export class GeoLocationDto {
  @ApiProperty({
    description: 'Latitude en degrés décimaux',
    example: 3.848,
    minimum: -90,
    maximum: 90
  })
  latitude: number;

  @ApiProperty({
    description: 'Longitude en degrés décimaux',
    example: 11.502,
    minimum: -180,
    maximum: 180
  })
  longitude: number;
}

export class GeoSearchParamsDto extends SearchParamsDto {
  @ApiProperty({
    description: 'Position géographique de référence',
    type: GeoLocationDto
  })
  location: GeoLocationDto;

  @ApiProperty({
    description: 'Rayon de recherche en kilomètres',
    example: 10,
    minimum: 0.1,
    maximum: 100
  })
  radius: number;
}

// Multi-type Search Schemas
export class MultiTypeSearchResultsDto {
  @ApiProperty({
    description: 'Résultats groupés par type de ressource',
    type: 'object',
    example: {
      'API': {
        hits: [],
        total: 25,
        facets: []
      },
      'BUSINESS': {
        hits: [],
        total: 45,
        facets: []
      },
      'SERVICE': {
        hits: [],
        total: 12,
        facets: []
      }
    }
  })
  resultsByType: Record<string, {
    hits: SearchHitDto[];
    total: number;
    facets: SearchFacetDto[];
  }>;

  @ApiProperty({
    description: 'Nombre total de résultats tous types confondus',
    example: 82
  })
  totalAcrossTypes: number;

  @ApiProperty({
    description: 'Temps de traitement en millisecondes',
    example: 125
  })
  took: number;

  @ApiProperty({
    description: 'Résultats mixtes triés par pertinence globale',
    type: [SearchHitDto],
    required: false
  })
  mixedResults?: SearchHitDto[];

  @ApiProperty({
    description: 'Informations de pagination par type',
    type: 'object',
    example: {
      'API': { page: 1, limit: 20, totalPages: 2, hasNext: true },
      'BUSINESS': { page: 1, limit: 20, totalPages: 3, hasNext: true },
      'SERVICE': { page: 1, limit: 20, totalPages: 1, hasNext: false }
    }
  })
  paginationByType: Record<string, {
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  }>;
}

// Category Search Schemas
export class CategoryInfoDto {
  @ApiProperty({
    description: 'Identifiant de la catégorie',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  id: string;

  @ApiProperty({
    description: 'Nom de la catégorie',
    example: 'Restaurants'
  })
  name: string;

  @ApiProperty({
    description: 'Slug SEO-friendly',
    example: 'restaurants'
  })
  slug: string;

  @ApiProperty({
    description: 'Description de la catégorie',
    example: 'Établissements de restauration et services alimentaires'
  })
  description: string;

  @ApiProperty({
    description: 'Icône de la catégorie',
    example: 'restaurant'
  })
  icon: string;

  @ApiProperty({
    description: 'Nombre de ressources dans cette catégorie',
    example: 45
  })
  resourceCount: number;
}

export class BreadcrumbDto {
  @ApiProperty({
    description: 'Identifiant de la catégorie',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  id: string;

  @ApiProperty({
    description: 'Nom de la catégorie',
    example: 'Restaurants'
  })
  name: string;

  @ApiProperty({
    description: 'Slug pour URL',
    example: 'restaurants'
  })
  slug: string;

  @ApiProperty({
    description: 'URL complète de la catégorie',
    example: '/api/v1/search/categories/restaurants'
  })
  url: string;
}

export class CategorySearchResultsDto extends SearchResultsDto {
  @ApiProperty({
    description: 'Informations sur la catégorie courante',
    type: CategoryInfoDto
  })
  categoryInfo: CategoryInfoDto;

  @ApiProperty({
    description: 'Fil d\'Ariane pour navigation',
    type: [BreadcrumbDto]
  })
  breadcrumbs: BreadcrumbDto[];

  @ApiProperty({
    description: 'Sous-catégories disponibles',
    type: [CategoryInfoDto]
  })
  subcategories: CategoryInfoDto[];

  @ApiProperty({
    description: 'Catégorie parente (si applicable)',
    type: CategoryInfoDto,
    required: false
  })
  parentCategory?: CategoryInfoDto;

  @ApiProperty({
    description: 'Informations SEO pour la page',
    type: 'object',
    example: {
      title: 'Restaurants - API ROMAPI',
      description: 'Découvrez les meilleurs restaurants et services alimentaires',
      canonicalUrl: '/api/v1/search/categories/restaurants',
      shareUrl: 'https://api.romapi.com/search/categories/restaurants'
    }
  })
  seo: {
    title: string;
    description: string;
    canonicalUrl: string;
    shareUrl: string;
    breadcrumbsSchema?: any;
  };
}

// Error Response Schemas
export class SearchErrorDto {
  @ApiProperty({
    description: 'Indicateur d\'erreur',
    example: false
  })
  success: boolean;

  @ApiProperty({
    description: 'Détails de l\'erreur',
    type: 'object',
    example: {
      code: 'SEARCH_ERROR',
      message: 'Erreur lors de la recherche',
      timestamp: '2024-01-15T10:30:00Z',
      path: '/api/v1/search',
      method: 'GET'
    }
  })
  error: {
    code: string;
    message: string;
    timestamp: string;
    path: string;
    method: string;
    details?: any;
  };
}

// Analytics Schemas
export class SearchAnalyticsDto {
  @ApiProperty({
    description: 'Termes de recherche les plus populaires',
    type: 'array',
    example: [
      { term: 'restaurant', count: 1250, percentage: 15.2 },
      { term: 'hotel', count: 890, percentage: 10.8 },
      { term: 'api', count: 675, percentage: 8.2 }
    ]
  })
  popularTerms: Array<{
    term: string;
    count: number;
    percentage: number;
  }>;

  @ApiProperty({
    description: 'Recherches sans résultats',
    type: 'array',
    example: [
      { query: 'restaurant xyz', count: 25, lastSeen: '2024-01-15T10:30:00Z' },
      { query: 'service abc', count: 18, lastSeen: '2024-01-15T09:15:00Z' }
    ]
  })
  noResultsQueries: Array<{
    query: string;
    count: number;
    lastSeen: string;
  }>;

  @ApiProperty({
    description: 'Métriques de performance',
    type: 'object',
    example: {
      averageResponseTime: 125,
      totalSearches: 8250,
      successRate: 98.5,
      cacheHitRate: 75.2
    }
  })
  metrics: {
    averageResponseTime: number;
    totalSearches: number;
    successRate: number;
    cacheHitRate: number;
  };
}