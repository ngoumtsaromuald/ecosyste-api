"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SearchSwaggerExamples = void 0;
exports.SearchSwaggerExamples = {
    BasicSearch: {
        Request: {
            summary: 'Recherche textuelle simple',
            description: 'Recherche basique avec requête textuelle',
            value: {
                q: 'restaurant douala',
                limit: 20,
                page: 1
            }
        },
        Response: {
            summary: 'Résultats de recherche basique',
            description: 'Réponse typique pour une recherche textuelle',
            value: {
                hits: [
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
                        },
                        address: {
                            addressLine1: '123 Avenue Kennedy',
                            city: 'Yaoundé',
                            region: 'Centre',
                            country: 'CM',
                            latitude: 3.848,
                            longitude: 11.502
                        },
                        contact: {
                            phone: '+237123456789',
                            email: 'contact@lepalais.cm',
                            website: 'https://www.lepalais.cm'
                        },
                        tags: ['cuisine', 'africaine', 'livraison'],
                        rating: 4.5,
                        createdAt: '2024-01-15T10:30:00Z',
                        highlights: ['<em>Restaurant</em> Le Palais', 'Cuisine camerounaise <em>authentique</em>']
                    }
                ],
                total: 150,
                took: 45,
                facets: [
                    {
                        name: 'categories',
                        values: {
                            'restaurants': 45,
                            'hotels': 23,
                            'services': 12
                        },
                        total: 80
                    },
                    {
                        name: 'resourceTypes',
                        values: {
                            'BUSINESS': 65,
                            'API': 25,
                            'SERVICE': 10
                        },
                        total: 100
                    }
                ],
                pagination: {
                    page: 1,
                    limit: 20,
                    totalPages: 8,
                    hasNext: true,
                    hasPrev: false
                },
                metadata: {
                    query: 'restaurant douala',
                    appliedFilters: ['city:douala'],
                    searchId: 'search_123456789'
                }
            }
        }
    },
    AdvancedSearch: {
        Request: {
            summary: 'Recherche avancée avec filtres multiples',
            description: 'Recherche avec filtres par catégorie, prix, plan et localisation',
            value: {
                q: 'restaurant',
                categories: ['123e4567-e89b-12d3-a456-426614174000'],
                resourceTypes: ['BUSINESS'],
                plans: ['FREE', 'PREMIUM'],
                minPrice: 1000,
                maxPrice: 50000,
                verified: true,
                city: 'Douala',
                region: 'Littoral',
                tags: ['cuisine', 'livraison'],
                sort: 'rating',
                order: 'desc',
                page: 1,
                limit: 20,
                facets: ['categories', 'resourceTypes', 'plans', 'verified', 'tags']
            }
        },
        Response: {
            summary: 'Résultats avec filtres appliqués',
            description: 'Réponse avec facettes détaillées et filtres appliqués',
            value: {
                hits: [
                    {
                        id: '456e7890-e89b-12d3-a456-426614174001',
                        name: 'Restaurant Premium Douala',
                        slug: 'restaurant-premium-douala',
                        description: 'Restaurant haut de gamme avec service de livraison',
                        resourceType: 'BUSINESS',
                        plan: 'PREMIUM',
                        verified: true,
                        score: 0.98,
                        category: {
                            id: '123e4567-e89b-12d3-a456-426614174000',
                            name: 'Restaurants',
                            slug: 'restaurants'
                        },
                        address: {
                            addressLine1: '456 Boulevard de la Liberté',
                            city: 'Douala',
                            region: 'Littoral',
                            country: 'CM',
                            latitude: 4.0511,
                            longitude: 9.7679
                        },
                        contact: {
                            phone: '+237987654321',
                            email: 'info@premiumbistro.cm',
                            website: 'https://www.premiumbistro.cm'
                        },
                        tags: ['cuisine', 'livraison', 'premium', 'gastronomie'],
                        rating: 4.8,
                        createdAt: '2024-01-10T14:20:00Z'
                    }
                ],
                total: 25,
                took: 67,
                facets: [
                    {
                        name: 'plans',
                        values: {
                            'PREMIUM': 15,
                            'FREE': 10
                        },
                        total: 25
                    },
                    {
                        name: 'verified',
                        values: {
                            'true': 25,
                            'false': 0
                        },
                        total: 25
                    }
                ],
                pagination: {
                    page: 1,
                    limit: 20,
                    totalPages: 2,
                    hasNext: true,
                    hasPrev: false
                },
                metadata: {
                    query: 'restaurant',
                    appliedFilters: [
                        'categories:restaurants',
                        'resourceTypes:BUSINESS',
                        'plans:FREE,PREMIUM',
                        'verified:true',
                        'city:Douala',
                        'priceRange:1000-50000'
                    ],
                    searchId: 'search_987654321'
                }
            }
        }
    },
    GeographicSearch: {
        Request: {
            summary: 'Recherche géographique avec rayon',
            description: 'Recherche dans un rayon spécifique autour d\'une position',
            value: {
                q: 'restaurant',
                latitude: 3.848,
                longitude: 11.502,
                radius: 5,
                sort: 'distance',
                order: 'asc',
                limit: 15
            }
        },
        Response: {
            summary: 'Résultats triés par distance',
            description: 'Résultats avec informations de distance',
            value: {
                hits: [
                    {
                        id: '789e0123-e89b-12d3-a456-426614174002',
                        name: 'Restaurant Proche',
                        slug: 'restaurant-proche',
                        description: 'Restaurant à proximité immédiate',
                        resourceType: 'BUSINESS',
                        plan: 'FREE',
                        verified: true,
                        score: 0.85,
                        distance: 0.8,
                        category: {
                            id: '123e4567-e89b-12d3-a456-426614174000',
                            name: 'Restaurants',
                            slug: 'restaurants'
                        },
                        address: {
                            addressLine1: '789 Rue de la Paix',
                            city: 'Yaoundé',
                            region: 'Centre',
                            country: 'CM',
                            latitude: 3.855,
                            longitude: 11.495
                        },
                        contact: {
                            phone: '+237555123456',
                            email: 'contact@proche.cm'
                        },
                        tags: ['cuisine', 'proximité'],
                        rating: 4.2,
                        createdAt: '2024-01-12T16:45:00Z'
                    }
                ],
                total: 12,
                took: 52,
                facets: [
                    {
                        name: 'distance_ranges',
                        values: {
                            '0-1km': 3,
                            '1-3km': 5,
                            '3-5km': 4
                        },
                        total: 12
                    }
                ],
                pagination: {
                    page: 1,
                    limit: 15,
                    totalPages: 1,
                    hasNext: false,
                    hasPrev: false
                },
                metadata: {
                    query: 'restaurant',
                    appliedFilters: ['location:3.848,11.502', 'radius:5km'],
                    searchId: 'search_geo_456789'
                }
            }
        }
    },
    Suggestions: {
        BasicRequest: {
            summary: 'Suggestions auto-complete basiques',
            description: 'Obtenir des suggestions pour une requête partielle',
            value: {
                q: 'rest',
                limit: 10
            }
        },
        BasicResponse: {
            summary: 'Liste de suggestions',
            description: 'Suggestions classées par pertinence',
            value: [
                {
                    text: 'restaurant',
                    score: 0.95,
                    type: 'query',
                    count: 125,
                    highlighted: '<em>rest</em>aurant'
                },
                {
                    text: 'restaurant douala',
                    score: 0.88,
                    type: 'query',
                    count: 45,
                    highlighted: '<em>rest</em>aurant douala'
                },
                {
                    text: 'restaurants yaoundé',
                    score: 0.82,
                    type: 'query',
                    count: 38,
                    highlighted: '<em>rest</em>aurants yaoundé'
                },
                {
                    text: 'Restaurants',
                    score: 0.75,
                    type: 'category',
                    count: 156,
                    category: {
                        id: '123e4567-e89b-12d3-a456-426614174000',
                        name: 'Restaurants',
                        slug: 'restaurants'
                    },
                    highlighted: '<em>Rest</em>aurants'
                }
            ]
        },
        SmartRequest: {
            summary: 'Suggestions intelligentes avec personnalisation',
            description: 'Suggestions avec stratégies multiples et personnalisation utilisateur',
            value: {
                q: 'api',
                limit: 8,
                userId: 'user_123456'
            }
        },
        SmartResponse: {
            summary: 'Suggestions personnalisées',
            description: 'Suggestions adaptées aux préférences utilisateur',
            value: [
                {
                    text: 'api payment',
                    score: 0.92,
                    type: 'query',
                    count: 67,
                    highlighted: '<em>api</em> payment'
                },
                {
                    text: 'api mobile money',
                    score: 0.89,
                    type: 'popular',
                    count: 45,
                    highlighted: '<em>api</em> mobile money'
                },
                {
                    text: 'API de Paiement MTN',
                    score: 0.85,
                    type: 'resource',
                    category: {
                        id: '456e7890-e89b-12d3-a456-426614174001',
                        name: 'APIs de Paiement',
                        slug: 'apis-paiement'
                    },
                    highlighted: '<em>API</em> de Paiement MTN'
                }
            ]
        },
        PopularRequest: {
            summary: 'Suggestions populaires',
            description: 'Obtenir les suggestions les plus recherchées',
            value: {
                limit: 20
            }
        },
        PopularResponse: {
            summary: 'Top suggestions populaires',
            description: 'Suggestions les plus fréquemment utilisées',
            value: [
                {
                    text: 'restaurant',
                    score: 1.0,
                    type: 'popular',
                    count: 1250
                },
                {
                    text: 'hotel',
                    score: 0.95,
                    type: 'popular',
                    count: 890
                },
                {
                    text: 'api payment',
                    score: 0.88,
                    type: 'popular',
                    count: 675
                },
                {
                    text: 'service livraison',
                    score: 0.82,
                    type: 'popular',
                    count: 456
                }
            ]
        }
    },
    MultiTypeSearch: {
        Request: {
            summary: 'Recherche multi-types avec groupement',
            description: 'Recherche simultanée dans tous les types de ressources',
            value: {
                q: 'payment',
                includeTypes: ['API', 'BUSINESS', 'SERVICE'],
                groupByType: true,
                globalRelevanceSort: false,
                categories: ['456e7890-e89b-12d3-a456-426614174001'],
                verified: true,
                limit: 10
            }
        },
        Response: {
            summary: 'Résultats groupés par type',
            description: 'Résultats organisés par type de ressource avec onglets',
            value: {
                resultsByType: {
                    'API': {
                        hits: [
                            {
                                id: 'api_123',
                                name: 'API de Paiement MTN',
                                slug: 'api-paiement-mtn',
                                description: 'API pour intégrer les paiements MTN Mobile Money',
                                resourceType: 'API',
                                plan: 'PREMIUM',
                                verified: true,
                                score: 0.95,
                                category: {
                                    id: '456e7890-e89b-12d3-a456-426614174001',
                                    name: 'APIs de Paiement',
                                    slug: 'apis-paiement'
                                },
                                tags: ['payment', 'mtn', 'mobile-money'],
                                rating: 4.7,
                                createdAt: '2024-01-08T11:20:00Z'
                            }
                        ],
                        total: 25,
                        facets: [
                            {
                                name: 'plans',
                                values: { 'PREMIUM': 15, 'FREE': 10 },
                                total: 25
                            }
                        ]
                    },
                    'BUSINESS': {
                        hits: [
                            {
                                id: 'business_456',
                                name: 'PayTech Solutions',
                                slug: 'paytech-solutions',
                                description: 'Entreprise spécialisée dans les solutions de paiement',
                                resourceType: 'BUSINESS',
                                plan: 'FEATURED',
                                verified: true,
                                score: 0.88,
                                category: {
                                    id: '789e0123-e89b-12d3-a456-426614174002',
                                    name: 'Fintech',
                                    slug: 'fintech'
                                },
                                address: {
                                    city: 'Douala',
                                    region: 'Littoral',
                                    country: 'CM'
                                },
                                tags: ['payment', 'fintech', 'solutions'],
                                rating: 4.5,
                                createdAt: '2024-01-05T09:15:00Z'
                            }
                        ],
                        total: 18,
                        facets: [
                            {
                                name: 'plans',
                                values: { 'FEATURED': 8, 'PREMIUM': 6, 'FREE': 4 },
                                total: 18
                            }
                        ]
                    },
                    'SERVICE': {
                        hits: [
                            {
                                id: 'service_789',
                                name: 'Service d\'Intégration Paiement',
                                slug: 'service-integration-paiement',
                                description: 'Service d\'aide à l\'intégration des APIs de paiement',
                                resourceType: 'SERVICE',
                                plan: 'PREMIUM',
                                verified: true,
                                score: 0.82,
                                category: {
                                    id: '012e3456-e89b-12d3-a456-426614174003',
                                    name: 'Services Techniques',
                                    slug: 'services-techniques'
                                },
                                tags: ['payment', 'integration', 'consulting'],
                                rating: 4.3,
                                createdAt: '2024-01-03T14:30:00Z'
                            }
                        ],
                        total: 12,
                        facets: [
                            {
                                name: 'plans',
                                values: { 'PREMIUM': 8, 'FREE': 4 },
                                total: 12
                            }
                        ]
                    }
                },
                totalAcrossTypes: 55,
                took: 125,
                paginationByType: {
                    'API': {
                        page: 1,
                        limit: 10,
                        totalPages: 3,
                        hasNext: true,
                        hasPrev: false
                    },
                    'BUSINESS': {
                        page: 1,
                        limit: 10,
                        totalPages: 2,
                        hasNext: true,
                        hasPrev: false
                    },
                    'SERVICE': {
                        page: 1,
                        limit: 10,
                        totalPages: 2,
                        hasNext: true,
                        hasPrev: false
                    }
                }
            }
        }
    },
    CategorySearch: {
        HierarchyRequest: {
            summary: 'Recherche par catégorie avec hiérarchie',
            description: 'Recherche dans une catégorie avec navigation hiérarchique',
            value: {
                categoryId: '123e4567-e89b-12d3-a456-426614174000',
                q: 'cuisine africaine',
                includeSubcategories: true,
                maxDepth: 3,
                showCounts: true,
                resourceTypes: ['BUSINESS'],
                verified: true,
                sort: 'rating',
                order: 'desc',
                limit: 15
            }
        },
        HierarchyResponse: {
            summary: 'Résultats avec navigation hiérarchique',
            description: 'Résultats enrichis avec breadcrumbs et sous-catégories',
            value: {
                hits: [
                    {
                        id: '345e6789-e89b-12d3-a456-426614174003',
                        name: 'Restaurant Africain Authentique',
                        slug: 'restaurant-africain-authentique',
                        description: 'Spécialités culinaires africaines traditionnelles',
                        resourceType: 'BUSINESS',
                        plan: 'PREMIUM',
                        verified: true,
                        score: 0.92,
                        category: {
                            id: '567e8901-e89b-12d3-a456-426614174004',
                            name: 'Cuisine Africaine',
                            slug: 'cuisine-africaine'
                        },
                        address: {
                            city: 'Yaoundé',
                            region: 'Centre',
                            country: 'CM'
                        },
                        tags: ['cuisine', 'africaine', 'traditionnel'],
                        rating: 4.6,
                        createdAt: '2024-01-07T13:25:00Z'
                    }
                ],
                total: 28,
                took: 78,
                facets: [
                    {
                        name: 'subcategories',
                        values: {
                            'cuisine-camerounaise': 15,
                            'cuisine-senegalaise': 8,
                            'cuisine-ivoirienne': 5
                        },
                        total: 28
                    }
                ],
                pagination: {
                    page: 1,
                    limit: 15,
                    totalPages: 2,
                    hasNext: true,
                    hasPrev: false
                },
                metadata: {
                    query: 'cuisine africaine',
                    appliedFilters: ['category:restaurants', 'verified:true'],
                    searchId: 'search_cat_789012'
                },
                categoryInfo: {
                    id: '123e4567-e89b-12d3-a456-426614174000',
                    name: 'Restaurants',
                    slug: 'restaurants',
                    description: 'Établissements de restauration et services alimentaires',
                    icon: 'restaurant',
                    resourceCount: 156
                },
                breadcrumbs: [
                    {
                        id: 'root',
                        name: 'Accueil',
                        slug: '',
                        url: '/api/v1/search'
                    },
                    {
                        id: '123e4567-e89b-12d3-a456-426614174000',
                        name: 'Restaurants',
                        slug: 'restaurants',
                        url: '/api/v1/search/categories/restaurants'
                    }
                ],
                subcategories: [
                    {
                        id: '567e8901-e89b-12d3-a456-426614174004',
                        name: 'Cuisine Africaine',
                        slug: 'cuisine-africaine',
                        description: 'Restaurants spécialisés en cuisine africaine',
                        icon: 'african-cuisine',
                        resourceCount: 28
                    },
                    {
                        id: '678e9012-e89b-12d3-a456-426614174005',
                        name: 'Fast Food',
                        slug: 'fast-food',
                        description: 'Restauration rapide',
                        icon: 'fast-food',
                        resourceCount: 45
                    }
                ],
                seo: {
                    title: 'Restaurants - API ROMAPI',
                    description: 'Découvrez les meilleurs restaurants et services alimentaires au Cameroun',
                    canonicalUrl: '/api/v1/search/categories/restaurants',
                    shareUrl: 'https://api.romapi.com/search/categories/restaurants',
                    breadcrumbsSchema: {
                        '@context': 'https://schema.org',
                        '@type': 'BreadcrumbList',
                        'itemListElement': [
                            {
                                '@type': 'ListItem',
                                'position': 1,
                                'name': 'Accueil',
                                'item': 'https://api.romapi.com'
                            },
                            {
                                '@type': 'ListItem',
                                'position': 2,
                                'name': 'Restaurants',
                                'item': 'https://api.romapi.com/search/categories/restaurants'
                            }
                        ]
                    }
                }
            }
        }
    },
    Errors: {
        ValidationError: {
            summary: 'Erreur de validation',
            description: 'Erreur lorsque les paramètres de recherche sont invalides',
            value: {
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Paramètres de recherche invalides',
                    timestamp: '2024-01-15T10:30:00Z',
                    path: '/api/v1/search',
                    method: 'GET',
                    details: {
                        'limit': 'La limite doit être entre 1 et 100',
                        'radius': 'Le rayon doit être entre 0.1 et 100 km'
                    }
                }
            }
        },
        SearchError: {
            summary: 'Erreur de recherche',
            description: 'Erreur lors de l\'exécution de la recherche',
            value: {
                success: false,
                error: {
                    code: 'SEARCH_ERROR',
                    message: 'Erreur lors de la recherche',
                    timestamp: '2024-01-15T10:30:00Z',
                    path: '/api/v1/search',
                    method: 'GET',
                    details: {
                        'elasticsearch': 'Service temporairement indisponible',
                        'fallback': 'Résultats depuis le cache'
                    }
                }
            }
        },
        NotFoundError: {
            summary: 'Catégorie non trouvée',
            description: 'Erreur lorsque la catégorie demandée n\'existe pas',
            value: {
                success: false,
                error: {
                    code: 'CATEGORY_NOT_FOUND',
                    message: 'Catégorie non trouvée',
                    timestamp: '2024-01-15T10:30:00Z',
                    path: '/api/v1/search/categories/invalid-slug',
                    method: 'GET',
                    details: {
                        'categorySlug': 'invalid-slug',
                        'suggestion': 'Vérifiez l\'orthographe ou consultez la liste des catégories disponibles'
                    }
                }
            }
        },
        RateLimitError: {
            summary: 'Limite de taux dépassée',
            description: 'Erreur lorsque la limite de requêtes est dépassée',
            value: {
                success: false,
                error: {
                    code: 'RATE_LIMIT_EXCEEDED',
                    message: 'Limite de requêtes dépassée',
                    timestamp: '2024-01-15T10:30:00Z',
                    path: '/api/v1/search/suggest',
                    method: 'GET',
                    details: {
                        'limit': '100 requêtes par heure',
                        'resetTime': '2024-01-15T11:30:00Z',
                        'retryAfter': 3600
                    }
                }
            }
        }
    },
    Analytics: {
        PopularTermsResponse: {
            summary: 'Termes de recherche populaires',
            description: 'Statistiques des termes les plus recherchés',
            value: {
                popularTerms: [
                    { term: 'restaurant', count: 1250, percentage: 15.2 },
                    { term: 'hotel', count: 890, percentage: 10.8 },
                    { term: 'api payment', count: 675, percentage: 8.2 },
                    { term: 'service livraison', count: 456, percentage: 5.5 },
                    { term: 'mobile money', count: 389, percentage: 4.7 }
                ],
                noResultsQueries: [
                    { query: 'restaurant xyz inexistant', count: 25, lastSeen: '2024-01-15T10:30:00Z' },
                    { query: 'api blockchain cameroun', count: 18, lastSeen: '2024-01-15T09:15:00Z' },
                    { query: 'service drone livraison', count: 12, lastSeen: '2024-01-15T08:45:00Z' }
                ],
                metrics: {
                    averageResponseTime: 125,
                    totalSearches: 8250,
                    successRate: 98.5,
                    cacheHitRate: 75.2
                }
            }
        }
    }
};
//# sourceMappingURL=search-examples.js.map