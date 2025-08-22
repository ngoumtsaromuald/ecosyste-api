"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SearchAnalyticsDto = exports.SearchErrorDto = exports.CategorySearchResultsDto = exports.BreadcrumbDto = exports.CategoryInfoDto = exports.MultiTypeSearchResultsDto = exports.GeoSearchParamsDto = exports.GeoLocationDto = exports.SuggestionDto = exports.SearchResultsDto = exports.SearchFacetDto = exports.SearchHitDto = exports.SearchParamsDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const client_1 = require("@prisma/client");
class SearchParamsDto {
}
exports.SearchParamsDto = SearchParamsDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Requête de recherche textuelle en langage naturel',
        example: 'restaurant douala',
        required: false,
        maxLength: 200
    }),
    __metadata("design:type", String)
], SearchParamsDto.prototype, "q", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'IDs des catégories à filtrer (séparés par virgule)',
        example: ['123e4567-e89b-12d3-a456-426614174000', '456e7890-e89b-12d3-a456-426614174001'],
        required: false,
        type: [String]
    }),
    __metadata("design:type", Array)
], SearchParamsDto.prototype, "categories", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Types de ressources à inclure',
        example: [client_1.ResourceType.BUSINESS, client_1.ResourceType.API],
        enum: client_1.ResourceType,
        enumName: 'ResourceType',
        isArray: true,
        required: false
    }),
    __metadata("design:type", Array)
], SearchParamsDto.prototype, "resourceTypes", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Plans tarifaires à filtrer',
        example: [client_1.ResourcePlan.FREE, client_1.ResourcePlan.PREMIUM],
        enum: client_1.ResourcePlan,
        enumName: 'ResourcePlan',
        isArray: true,
        required: false
    }),
    __metadata("design:type", Array)
], SearchParamsDto.prototype, "plans", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Prix minimum en FCFA',
        example: 1000,
        minimum: 0,
        required: false
    }),
    __metadata("design:type", Number)
], SearchParamsDto.prototype, "minPrice", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Prix maximum en FCFA',
        example: 50000,
        minimum: 0,
        required: false
    }),
    __metadata("design:type", Number)
], SearchParamsDto.prototype, "maxPrice", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Filtrer uniquement les ressources vérifiées',
        example: true,
        required: false
    }),
    __metadata("design:type", Boolean)
], SearchParamsDto.prototype, "verified", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Ville pour filtrage géographique',
        example: 'Douala',
        required: false
    }),
    __metadata("design:type", String)
], SearchParamsDto.prototype, "city", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Région pour filtrage géographique',
        example: 'Littoral',
        required: false
    }),
    __metadata("design:type", String)
], SearchParamsDto.prototype, "region", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Tags à rechercher (séparés par virgule)',
        example: ['cuisine', 'africaine', 'livraison'],
        type: [String],
        required: false
    }),
    __metadata("design:type", Array)
], SearchParamsDto.prototype, "tags", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Champ de tri des résultats',
        example: 'relevance',
        enum: ['relevance', 'createdAt', 'updatedAt', 'name', 'popularity', 'rating', 'distance'],
        required: false
    }),
    __metadata("design:type", String)
], SearchParamsDto.prototype, "sort", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Ordre de tri (croissant ou décroissant)',
        example: 'desc',
        enum: ['asc', 'desc'],
        required: false
    }),
    __metadata("design:type", String)
], SearchParamsDto.prototype, "order", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Numéro de page (commence à 1)',
        example: 1,
        minimum: 1,
        required: false
    }),
    __metadata("design:type", Number)
], SearchParamsDto.prototype, "page", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Nombre de résultats par page (maximum 100)',
        example: 20,
        minimum: 1,
        maximum: 100,
        required: false
    }),
    __metadata("design:type", Number)
], SearchParamsDto.prototype, "limit", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Facettes à inclure dans la réponse',
        example: ['categories', 'resourceTypes', 'plans', 'verified'],
        type: [String],
        required: false
    }),
    __metadata("design:type", Array)
], SearchParamsDto.prototype, "facets", void 0);
class SearchHitDto {
}
exports.SearchHitDto = SearchHitDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Identifiant unique de la ressource',
        example: '123e4567-e89b-12d3-a456-426614174000'
    }),
    __metadata("design:type", String)
], SearchHitDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Nom de la ressource',
        example: 'Restaurant Le Palais'
    }),
    __metadata("design:type", String)
], SearchHitDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Slug SEO-friendly',
        example: 'restaurant-le-palais'
    }),
    __metadata("design:type", String)
], SearchHitDto.prototype, "slug", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Description détaillée de la ressource',
        example: 'Cuisine camerounaise authentique au cœur de Yaoundé'
    }),
    __metadata("design:type", String)
], SearchHitDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Type de ressource',
        enum: client_1.ResourceType,
        example: client_1.ResourceType.BUSINESS
    }),
    __metadata("design:type", String)
], SearchHitDto.prototype, "resourceType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Plan tarifaire',
        enum: client_1.ResourcePlan,
        example: client_1.ResourcePlan.FREE
    }),
    __metadata("design:type", String)
], SearchHitDto.prototype, "plan", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Statut de vérification',
        example: true
    }),
    __metadata("design:type", Boolean)
], SearchHitDto.prototype, "verified", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Score de pertinence (0-1)',
        example: 0.95,
        minimum: 0,
        maximum: 1
    }),
    __metadata("design:type", Number)
], SearchHitDto.prototype, "score", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Informations de catégorie',
        type: 'object',
        example: {
            id: '789e0123-e89b-12d3-a456-426614174000',
            name: 'Restaurants',
            slug: 'restaurants'
        }
    }),
    __metadata("design:type", Object)
], SearchHitDto.prototype, "category", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
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
    }),
    __metadata("design:type", Object)
], SearchHitDto.prototype, "address", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Distance en kilomètres (si recherche géographique)',
        example: 2.5,
        required: false
    }),
    __metadata("design:type", Number)
], SearchHitDto.prototype, "distance", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Informations de contact',
        type: 'object',
        example: {
            phone: '+237123456789',
            email: 'contact@lepalais.cm',
            website: 'https://www.lepalais.cm'
        }
    }),
    __metadata("design:type", Object)
], SearchHitDto.prototype, "contact", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Tags associés',
        example: ['cuisine', 'africaine', 'livraison'],
        type: [String]
    }),
    __metadata("design:type", Array)
], SearchHitDto.prototype, "tags", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Note moyenne (1-5)',
        example: 4.5,
        minimum: 1,
        maximum: 5,
        required: false
    }),
    __metadata("design:type", Number)
], SearchHitDto.prototype, "rating", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Date de création',
        example: '2024-01-15T10:30:00Z'
    }),
    __metadata("design:type", String)
], SearchHitDto.prototype, "createdAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Extraits de texte mis en évidence',
        example: ['<em>Restaurant</em> Le Palais', 'Cuisine camerounaise <em>authentique</em>'],
        type: [String],
        required: false
    }),
    __metadata("design:type", Array)
], SearchHitDto.prototype, "highlights", void 0);
class SearchFacetDto {
}
exports.SearchFacetDto = SearchFacetDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Nom de la facette',
        example: 'categories'
    }),
    __metadata("design:type", String)
], SearchFacetDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Valeurs de la facette avec compteurs',
        type: 'object',
        example: {
            'restaurants': 45,
            'hotels': 23,
            'services': 12
        }
    }),
    __metadata("design:type", Object)
], SearchFacetDto.prototype, "values", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Nombre total d\'éléments dans cette facette',
        example: 80
    }),
    __metadata("design:type", Number)
], SearchFacetDto.prototype, "total", void 0);
class SearchResultsDto {
}
exports.SearchResultsDto = SearchResultsDto;
__decorate([
    (0, swagger_1.ApiProperty)({
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
    }),
    __metadata("design:type", Array)
], SearchResultsDto.prototype, "hits", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Nombre total de résultats trouvés',
        example: 150
    }),
    __metadata("design:type", Number)
], SearchResultsDto.prototype, "total", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Temps de traitement en millisecondes',
        example: 45
    }),
    __metadata("design:type", Number)
], SearchResultsDto.prototype, "took", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Facettes avec compteurs pour filtrage',
        type: [SearchFacetDto]
    }),
    __metadata("design:type", Array)
], SearchResultsDto.prototype, "facets", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Suggestions de correction orthographique',
        example: ['restaurant', 'restaurants'],
        type: [String],
        required: false
    }),
    __metadata("design:type", Array)
], SearchResultsDto.prototype, "suggestions", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Informations de pagination',
        type: 'object',
        example: {
            page: 1,
            limit: 20,
            totalPages: 8,
            hasNext: true,
            hasPrev: false
        }
    }),
    __metadata("design:type", Object)
], SearchResultsDto.prototype, "pagination", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Métadonnées de la requête',
        type: 'object',
        example: {
            query: 'restaurant douala',
            appliedFilters: ['categories:restaurants', 'city:douala'],
            searchId: 'search_123456789'
        }
    }),
    __metadata("design:type", Object)
], SearchResultsDto.prototype, "metadata", void 0);
class SuggestionDto {
}
exports.SuggestionDto = SuggestionDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Texte de la suggestion',
        example: 'restaurant douala'
    }),
    __metadata("design:type", String)
], SuggestionDto.prototype, "text", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Score de pertinence de la suggestion',
        example: 0.95,
        minimum: 0,
        maximum: 1
    }),
    __metadata("design:type", Number)
], SuggestionDto.prototype, "score", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Type de suggestion',
        example: 'query',
        enum: ['query', 'category', 'resource', 'popular']
    }),
    __metadata("design:type", String)
], SuggestionDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Nombre de résultats attendus',
        example: 25,
        required: false
    }),
    __metadata("design:type", Number)
], SuggestionDto.prototype, "count", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Catégorie associée (si applicable)',
        type: 'object',
        required: false,
        example: {
            id: '123e4567-e89b-12d3-a456-426614174000',
            name: 'Restaurants',
            slug: 'restaurants'
        }
    }),
    __metadata("design:type", Object)
], SuggestionDto.prototype, "category", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Texte mis en évidence pour affichage',
        example: '<em>restaurant</em> douala',
        required: false
    }),
    __metadata("design:type", String)
], SuggestionDto.prototype, "highlighted", void 0);
class GeoLocationDto {
}
exports.GeoLocationDto = GeoLocationDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Latitude en degrés décimaux',
        example: 3.848,
        minimum: -90,
        maximum: 90
    }),
    __metadata("design:type", Number)
], GeoLocationDto.prototype, "latitude", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Longitude en degrés décimaux',
        example: 11.502,
        minimum: -180,
        maximum: 180
    }),
    __metadata("design:type", Number)
], GeoLocationDto.prototype, "longitude", void 0);
class GeoSearchParamsDto extends SearchParamsDto {
}
exports.GeoSearchParamsDto = GeoSearchParamsDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Position géographique de référence',
        type: GeoLocationDto
    }),
    __metadata("design:type", GeoLocationDto)
], GeoSearchParamsDto.prototype, "location", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Rayon de recherche en kilomètres',
        example: 10,
        minimum: 0.1,
        maximum: 100
    }),
    __metadata("design:type", Number)
], GeoSearchParamsDto.prototype, "radius", void 0);
class MultiTypeSearchResultsDto {
}
exports.MultiTypeSearchResultsDto = MultiTypeSearchResultsDto;
__decorate([
    (0, swagger_1.ApiProperty)({
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
    }),
    __metadata("design:type", Object)
], MultiTypeSearchResultsDto.prototype, "resultsByType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Nombre total de résultats tous types confondus',
        example: 82
    }),
    __metadata("design:type", Number)
], MultiTypeSearchResultsDto.prototype, "totalAcrossTypes", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Temps de traitement en millisecondes',
        example: 125
    }),
    __metadata("design:type", Number)
], MultiTypeSearchResultsDto.prototype, "took", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Résultats mixtes triés par pertinence globale',
        type: [SearchHitDto],
        required: false
    }),
    __metadata("design:type", Array)
], MultiTypeSearchResultsDto.prototype, "mixedResults", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Informations de pagination par type',
        type: 'object',
        example: {
            'API': { page: 1, limit: 20, totalPages: 2, hasNext: true },
            'BUSINESS': { page: 1, limit: 20, totalPages: 3, hasNext: true },
            'SERVICE': { page: 1, limit: 20, totalPages: 1, hasNext: false }
        }
    }),
    __metadata("design:type", Object)
], MultiTypeSearchResultsDto.prototype, "paginationByType", void 0);
class CategoryInfoDto {
}
exports.CategoryInfoDto = CategoryInfoDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Identifiant de la catégorie',
        example: '123e4567-e89b-12d3-a456-426614174000'
    }),
    __metadata("design:type", String)
], CategoryInfoDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Nom de la catégorie',
        example: 'Restaurants'
    }),
    __metadata("design:type", String)
], CategoryInfoDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Slug SEO-friendly',
        example: 'restaurants'
    }),
    __metadata("design:type", String)
], CategoryInfoDto.prototype, "slug", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Description de la catégorie',
        example: 'Établissements de restauration et services alimentaires'
    }),
    __metadata("design:type", String)
], CategoryInfoDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Icône de la catégorie',
        example: 'restaurant'
    }),
    __metadata("design:type", String)
], CategoryInfoDto.prototype, "icon", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Nombre de ressources dans cette catégorie',
        example: 45
    }),
    __metadata("design:type", Number)
], CategoryInfoDto.prototype, "resourceCount", void 0);
class BreadcrumbDto {
}
exports.BreadcrumbDto = BreadcrumbDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Identifiant de la catégorie',
        example: '123e4567-e89b-12d3-a456-426614174000'
    }),
    __metadata("design:type", String)
], BreadcrumbDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Nom de la catégorie',
        example: 'Restaurants'
    }),
    __metadata("design:type", String)
], BreadcrumbDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Slug pour URL',
        example: 'restaurants'
    }),
    __metadata("design:type", String)
], BreadcrumbDto.prototype, "slug", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'URL complète de la catégorie',
        example: '/api/v1/search/categories/restaurants'
    }),
    __metadata("design:type", String)
], BreadcrumbDto.prototype, "url", void 0);
class CategorySearchResultsDto extends SearchResultsDto {
}
exports.CategorySearchResultsDto = CategorySearchResultsDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Informations sur la catégorie courante',
        type: CategoryInfoDto
    }),
    __metadata("design:type", CategoryInfoDto)
], CategorySearchResultsDto.prototype, "categoryInfo", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Fil d\'Ariane pour navigation',
        type: [BreadcrumbDto]
    }),
    __metadata("design:type", Array)
], CategorySearchResultsDto.prototype, "breadcrumbs", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Sous-catégories disponibles',
        type: [CategoryInfoDto]
    }),
    __metadata("design:type", Array)
], CategorySearchResultsDto.prototype, "subcategories", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Catégorie parente (si applicable)',
        type: CategoryInfoDto,
        required: false
    }),
    __metadata("design:type", CategoryInfoDto)
], CategorySearchResultsDto.prototype, "parentCategory", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Informations SEO pour la page',
        type: 'object',
        example: {
            title: 'Restaurants - API ROMAPI',
            description: 'Découvrez les meilleurs restaurants et services alimentaires',
            canonicalUrl: '/api/v1/search/categories/restaurants',
            shareUrl: 'https://api.romapi.com/search/categories/restaurants'
        }
    }),
    __metadata("design:type", Object)
], CategorySearchResultsDto.prototype, "seo", void 0);
class SearchErrorDto {
}
exports.SearchErrorDto = SearchErrorDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Indicateur d\'erreur',
        example: false
    }),
    __metadata("design:type", Boolean)
], SearchErrorDto.prototype, "success", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Détails de l\'erreur',
        type: 'object',
        example: {
            code: 'SEARCH_ERROR',
            message: 'Erreur lors de la recherche',
            timestamp: '2024-01-15T10:30:00Z',
            path: '/api/v1/search',
            method: 'GET'
        }
    }),
    __metadata("design:type", Object)
], SearchErrorDto.prototype, "error", void 0);
class SearchAnalyticsDto {
}
exports.SearchAnalyticsDto = SearchAnalyticsDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Termes de recherche les plus populaires',
        type: 'array',
        example: [
            { term: 'restaurant', count: 1250, percentage: 15.2 },
            { term: 'hotel', count: 890, percentage: 10.8 },
            { term: 'api', count: 675, percentage: 8.2 }
        ]
    }),
    __metadata("design:type", Array)
], SearchAnalyticsDto.prototype, "popularTerms", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Recherches sans résultats',
        type: 'array',
        example: [
            { query: 'restaurant xyz', count: 25, lastSeen: '2024-01-15T10:30:00Z' },
            { query: 'service abc', count: 18, lastSeen: '2024-01-15T09:15:00Z' }
        ]
    }),
    __metadata("design:type", Array)
], SearchAnalyticsDto.prototype, "noResultsQueries", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Métriques de performance',
        type: 'object',
        example: {
            averageResponseTime: 125,
            totalSearches: 8250,
            successRate: 98.5,
            cacheHitRate: 75.2
        }
    }),
    __metadata("design:type", Object)
], SearchAnalyticsDto.prototype, "metrics", void 0);
//# sourceMappingURL=search-schemas.js.map