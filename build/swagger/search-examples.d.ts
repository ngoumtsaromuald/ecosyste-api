export declare const SearchSwaggerExamples: {
    BasicSearch: {
        Request: {
            summary: string;
            description: string;
            value: {
                q: string;
                limit: number;
                page: number;
            };
        };
        Response: {
            summary: string;
            description: string;
            value: {
                hits: {
                    id: string;
                    name: string;
                    slug: string;
                    description: string;
                    resourceType: string;
                    plan: string;
                    verified: boolean;
                    score: number;
                    category: {
                        id: string;
                        name: string;
                        slug: string;
                    };
                    address: {
                        addressLine1: string;
                        city: string;
                        region: string;
                        country: string;
                        latitude: number;
                        longitude: number;
                    };
                    contact: {
                        phone: string;
                        email: string;
                        website: string;
                    };
                    tags: string[];
                    rating: number;
                    createdAt: string;
                    highlights: string[];
                }[];
                total: number;
                took: number;
                facets: ({
                    name: string;
                    values: {
                        restaurants: number;
                        hotels: number;
                        services: number;
                        BUSINESS?: undefined;
                        API?: undefined;
                        SERVICE?: undefined;
                    };
                    total: number;
                } | {
                    name: string;
                    values: {
                        BUSINESS: number;
                        API: number;
                        SERVICE: number;
                        restaurants?: undefined;
                        hotels?: undefined;
                        services?: undefined;
                    };
                    total: number;
                })[];
                pagination: {
                    page: number;
                    limit: number;
                    totalPages: number;
                    hasNext: boolean;
                    hasPrev: boolean;
                };
                metadata: {
                    query: string;
                    appliedFilters: string[];
                    searchId: string;
                };
            };
        };
    };
    AdvancedSearch: {
        Request: {
            summary: string;
            description: string;
            value: {
                q: string;
                categories: string[];
                resourceTypes: string[];
                plans: string[];
                minPrice: number;
                maxPrice: number;
                verified: boolean;
                city: string;
                region: string;
                tags: string[];
                sort: string;
                order: string;
                page: number;
                limit: number;
                facets: string[];
            };
        };
        Response: {
            summary: string;
            description: string;
            value: {
                hits: {
                    id: string;
                    name: string;
                    slug: string;
                    description: string;
                    resourceType: string;
                    plan: string;
                    verified: boolean;
                    score: number;
                    category: {
                        id: string;
                        name: string;
                        slug: string;
                    };
                    address: {
                        addressLine1: string;
                        city: string;
                        region: string;
                        country: string;
                        latitude: number;
                        longitude: number;
                    };
                    contact: {
                        phone: string;
                        email: string;
                        website: string;
                    };
                    tags: string[];
                    rating: number;
                    createdAt: string;
                }[];
                total: number;
                took: number;
                facets: ({
                    name: string;
                    values: {
                        PREMIUM: number;
                        FREE: number;
                        true?: undefined;
                        false?: undefined;
                    };
                    total: number;
                } | {
                    name: string;
                    values: {
                        true: number;
                        false: number;
                        PREMIUM?: undefined;
                        FREE?: undefined;
                    };
                    total: number;
                })[];
                pagination: {
                    page: number;
                    limit: number;
                    totalPages: number;
                    hasNext: boolean;
                    hasPrev: boolean;
                };
                metadata: {
                    query: string;
                    appliedFilters: string[];
                    searchId: string;
                };
            };
        };
    };
    GeographicSearch: {
        Request: {
            summary: string;
            description: string;
            value: {
                q: string;
                latitude: number;
                longitude: number;
                radius: number;
                sort: string;
                order: string;
                limit: number;
            };
        };
        Response: {
            summary: string;
            description: string;
            value: {
                hits: {
                    id: string;
                    name: string;
                    slug: string;
                    description: string;
                    resourceType: string;
                    plan: string;
                    verified: boolean;
                    score: number;
                    distance: number;
                    category: {
                        id: string;
                        name: string;
                        slug: string;
                    };
                    address: {
                        addressLine1: string;
                        city: string;
                        region: string;
                        country: string;
                        latitude: number;
                        longitude: number;
                    };
                    contact: {
                        phone: string;
                        email: string;
                    };
                    tags: string[];
                    rating: number;
                    createdAt: string;
                }[];
                total: number;
                took: number;
                facets: {
                    name: string;
                    values: {
                        '0-1km': number;
                        '1-3km': number;
                        '3-5km': number;
                    };
                    total: number;
                }[];
                pagination: {
                    page: number;
                    limit: number;
                    totalPages: number;
                    hasNext: boolean;
                    hasPrev: boolean;
                };
                metadata: {
                    query: string;
                    appliedFilters: string[];
                    searchId: string;
                };
            };
        };
    };
    Suggestions: {
        BasicRequest: {
            summary: string;
            description: string;
            value: {
                q: string;
                limit: number;
            };
        };
        BasicResponse: {
            summary: string;
            description: string;
            value: ({
                text: string;
                score: number;
                type: string;
                count: number;
                highlighted: string;
                category?: undefined;
            } | {
                text: string;
                score: number;
                type: string;
                count: number;
                category: {
                    id: string;
                    name: string;
                    slug: string;
                };
                highlighted: string;
            })[];
        };
        SmartRequest: {
            summary: string;
            description: string;
            value: {
                q: string;
                limit: number;
                userId: string;
            };
        };
        SmartResponse: {
            summary: string;
            description: string;
            value: ({
                text: string;
                score: number;
                type: string;
                count: number;
                highlighted: string;
                category?: undefined;
            } | {
                text: string;
                score: number;
                type: string;
                category: {
                    id: string;
                    name: string;
                    slug: string;
                };
                highlighted: string;
                count?: undefined;
            })[];
        };
        PopularRequest: {
            summary: string;
            description: string;
            value: {
                limit: number;
            };
        };
        PopularResponse: {
            summary: string;
            description: string;
            value: {
                text: string;
                score: number;
                type: string;
                count: number;
            }[];
        };
    };
    MultiTypeSearch: {
        Request: {
            summary: string;
            description: string;
            value: {
                q: string;
                includeTypes: string[];
                groupByType: boolean;
                globalRelevanceSort: boolean;
                categories: string[];
                verified: boolean;
                limit: number;
            };
        };
        Response: {
            summary: string;
            description: string;
            value: {
                resultsByType: {
                    API: {
                        hits: {
                            id: string;
                            name: string;
                            slug: string;
                            description: string;
                            resourceType: string;
                            plan: string;
                            verified: boolean;
                            score: number;
                            category: {
                                id: string;
                                name: string;
                                slug: string;
                            };
                            tags: string[];
                            rating: number;
                            createdAt: string;
                        }[];
                        total: number;
                        facets: {
                            name: string;
                            values: {
                                PREMIUM: number;
                                FREE: number;
                            };
                            total: number;
                        }[];
                    };
                    BUSINESS: {
                        hits: {
                            id: string;
                            name: string;
                            slug: string;
                            description: string;
                            resourceType: string;
                            plan: string;
                            verified: boolean;
                            score: number;
                            category: {
                                id: string;
                                name: string;
                                slug: string;
                            };
                            address: {
                                city: string;
                                region: string;
                                country: string;
                            };
                            tags: string[];
                            rating: number;
                            createdAt: string;
                        }[];
                        total: number;
                        facets: {
                            name: string;
                            values: {
                                FEATURED: number;
                                PREMIUM: number;
                                FREE: number;
                            };
                            total: number;
                        }[];
                    };
                    SERVICE: {
                        hits: {
                            id: string;
                            name: string;
                            slug: string;
                            description: string;
                            resourceType: string;
                            plan: string;
                            verified: boolean;
                            score: number;
                            category: {
                                id: string;
                                name: string;
                                slug: string;
                            };
                            tags: string[];
                            rating: number;
                            createdAt: string;
                        }[];
                        total: number;
                        facets: {
                            name: string;
                            values: {
                                PREMIUM: number;
                                FREE: number;
                            };
                            total: number;
                        }[];
                    };
                };
                totalAcrossTypes: number;
                took: number;
                paginationByType: {
                    API: {
                        page: number;
                        limit: number;
                        totalPages: number;
                        hasNext: boolean;
                        hasPrev: boolean;
                    };
                    BUSINESS: {
                        page: number;
                        limit: number;
                        totalPages: number;
                        hasNext: boolean;
                        hasPrev: boolean;
                    };
                    SERVICE: {
                        page: number;
                        limit: number;
                        totalPages: number;
                        hasNext: boolean;
                        hasPrev: boolean;
                    };
                };
            };
        };
    };
    CategorySearch: {
        HierarchyRequest: {
            summary: string;
            description: string;
            value: {
                categoryId: string;
                q: string;
                includeSubcategories: boolean;
                maxDepth: number;
                showCounts: boolean;
                resourceTypes: string[];
                verified: boolean;
                sort: string;
                order: string;
                limit: number;
            };
        };
        HierarchyResponse: {
            summary: string;
            description: string;
            value: {
                hits: {
                    id: string;
                    name: string;
                    slug: string;
                    description: string;
                    resourceType: string;
                    plan: string;
                    verified: boolean;
                    score: number;
                    category: {
                        id: string;
                        name: string;
                        slug: string;
                    };
                    address: {
                        city: string;
                        region: string;
                        country: string;
                    };
                    tags: string[];
                    rating: number;
                    createdAt: string;
                }[];
                total: number;
                took: number;
                facets: {
                    name: string;
                    values: {
                        'cuisine-camerounaise': number;
                        'cuisine-senegalaise': number;
                        'cuisine-ivoirienne': number;
                    };
                    total: number;
                }[];
                pagination: {
                    page: number;
                    limit: number;
                    totalPages: number;
                    hasNext: boolean;
                    hasPrev: boolean;
                };
                metadata: {
                    query: string;
                    appliedFilters: string[];
                    searchId: string;
                };
                categoryInfo: {
                    id: string;
                    name: string;
                    slug: string;
                    description: string;
                    icon: string;
                    resourceCount: number;
                };
                breadcrumbs: {
                    id: string;
                    name: string;
                    slug: string;
                    url: string;
                }[];
                subcategories: {
                    id: string;
                    name: string;
                    slug: string;
                    description: string;
                    icon: string;
                    resourceCount: number;
                }[];
                seo: {
                    title: string;
                    description: string;
                    canonicalUrl: string;
                    shareUrl: string;
                    breadcrumbsSchema: {
                        '@context': string;
                        '@type': string;
                        itemListElement: {
                            '@type': string;
                            position: number;
                            name: string;
                            item: string;
                        }[];
                    };
                };
            };
        };
    };
    Errors: {
        ValidationError: {
            summary: string;
            description: string;
            value: {
                success: boolean;
                error: {
                    code: string;
                    message: string;
                    timestamp: string;
                    path: string;
                    method: string;
                    details: {
                        limit: string;
                        radius: string;
                    };
                };
            };
        };
        SearchError: {
            summary: string;
            description: string;
            value: {
                success: boolean;
                error: {
                    code: string;
                    message: string;
                    timestamp: string;
                    path: string;
                    method: string;
                    details: {
                        elasticsearch: string;
                        fallback: string;
                    };
                };
            };
        };
        NotFoundError: {
            summary: string;
            description: string;
            value: {
                success: boolean;
                error: {
                    code: string;
                    message: string;
                    timestamp: string;
                    path: string;
                    method: string;
                    details: {
                        categorySlug: string;
                        suggestion: string;
                    };
                };
            };
        };
        RateLimitError: {
            summary: string;
            description: string;
            value: {
                success: boolean;
                error: {
                    code: string;
                    message: string;
                    timestamp: string;
                    path: string;
                    method: string;
                    details: {
                        limit: string;
                        resetTime: string;
                        retryAfter: number;
                    };
                };
            };
        };
    };
    Analytics: {
        PopularTermsResponse: {
            summary: string;
            description: string;
            value: {
                popularTerms: {
                    term: string;
                    count: number;
                    percentage: number;
                }[];
                noResultsQueries: {
                    query: string;
                    count: number;
                    lastSeen: string;
                }[];
                metrics: {
                    averageResponseTime: number;
                    totalSearches: number;
                    successRate: number;
                    cacheHitRate: number;
                };
            };
        };
    };
};
