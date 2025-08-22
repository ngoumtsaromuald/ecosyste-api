"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SearchSwaggerExamples = void 0;
exports.setupSwagger = setupSwagger;
const swagger_1 = require("@nestjs/swagger");
const search_examples_1 = require("./search-examples");
Object.defineProperty(exports, "SearchSwaggerExamples", { enumerable: true, get: function () { return search_examples_1.SearchSwaggerExamples; } });
function setupSwagger(app) {
    const config = new swagger_1.DocumentBuilder()
        .setTitle('ROMAPI Search API')
        .setDescription(`
    API de recherche avancée pour l'écosystème ROMAPI
    
    Cette API permet de rechercher des API, entreprises et services dans l'écosystème camerounais
    avec des fonctionnalités avancées comme la recherche géographique, les suggestions intelligentes
    et les analytics détaillées.
    
    ## Fonctionnalités principales
    
    - **Recherche textuelle avancée** avec correction orthographique
    - **Recherche géographique** dans un rayon spécifique
    - **Suggestions auto-complete** en temps réel
    - **Recherche par catégories** avec navigation hiérarchique
    - **Recherche multi-types** avec groupement
    - **Analytics détaillées** pour les administrateurs
    
    ## Exemples d'utilisation
    
    ### Recherche simple
    \`\`\`
    GET /api/v1/search?q=restaurant+douala&limit=10
    \`\`\`
    
    ### Recherche avec filtres
    \`\`\`
    GET /api/v1/search?q=restaurant&city=Douala&verified=true&resourceTypes=BUSINESS&sort=rating&order=desc
    \`\`\`
    
    ### Suggestions
    \`\`\`
    GET /api/v1/search/suggest?q=rest&limit=5
    \`\`\`
    
    ### Recherche géographique
    \`\`\`
    GET /api/v1/search/nearby?latitude=3.848&longitude=11.502&radius=5&q=restaurant
    \`\`\`
    
    ## Rate Limiting
    
    - **Recherche** : 1000 requêtes/heure par utilisateur authentifié, 100/heure par IP
    - **Suggestions** : 500 requêtes/heure par utilisateur, 50/heure par IP
    - **Analytics** : 100 requêtes/heure par utilisateur authentifié
    
    ## Support
    
    - Documentation complète : https://docs.romapi.com
    - Support technique : support@romapi.com
    - Status page : https://status.romapi.com
    `)
        .setVersion('1.0.0')
        .setContact('ROMAPI Team', 'https://romapi.com', 'support@romapi.com')
        .setLicense('MIT', 'https://opensource.org/licenses/MIT')
        .addServer('https://api.romapi.com', 'Production')
        .addServer('https://staging-api.romapi.com', 'Staging')
        .addServer('http://localhost:3000', 'Development')
        .addBearerAuth({
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        description: 'Entrez votre token JWT',
        in: 'header',
    }, 'JWT-auth')
        .addTag('Search', 'Endpoints de recherche principale')
        .addTag('Suggestions', 'Auto-complétion et suggestions')
        .addTag('Categories', 'Recherche par catégories')
        .addTag('Analytics', 'Statistiques et analytics')
        .addTag('Multi-Type', 'Recherche multi-types')
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, config, {
        extraModels: [],
        deepScanRoutes: true,
    });
    addCustomExamples(document);
    swagger_1.SwaggerModule.setup('docs', app, document, {
        swaggerOptions: {
            persistAuthorization: true,
            displayRequestDuration: true,
            filter: true,
            showExtensions: true,
            showCommonExtensions: true,
            tryItOutEnabled: true,
            requestInterceptor: (req) => {
                return req;
            },
            responseInterceptor: (res) => {
                return res;
            }
        },
        customSiteTitle: 'ROMAPI Search API Documentation',
        customfavIcon: '/favicon.ico',
        customJs: [
            'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui-bundle.min.js',
        ],
        customCssUrl: [
            'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui.min.css',
        ],
    });
}
function addCustomExamples(document) {
    if (document.paths) {
        if (document.paths['/search']?.get?.responses?.['200']) {
            document.paths['/search'].get.responses['200'].examples = {
                'application/json': {
                    'basic-search': search_examples_1.SearchSwaggerExamples.BasicSearch.Response,
                    'advanced-search': search_examples_1.SearchSwaggerExamples.AdvancedSearch.Response,
                    'geographic-search': search_examples_1.SearchSwaggerExamples.GeographicSearch.Response
                }
            };
        }
        if (document.paths['/search/suggest']?.get?.responses?.['200']) {
            document.paths['/search/suggest'].get.responses['200'].examples = {
                'application/json': {
                    'basic-suggestions': search_examples_1.SearchSwaggerExamples.Suggestions.BasicResponse,
                    'smart-suggestions': search_examples_1.SearchSwaggerExamples.Suggestions.SmartResponse
                }
            };
        }
        const errorPaths = ['/search', '/search/suggest', '/search/multi-type'];
        errorPaths.forEach(path => {
            if (document.paths[path]?.get?.responses) {
                const responses = document.paths[path].get.responses;
                if (responses['400']) {
                    responses['400'].examples = {
                        'application/json': search_examples_1.SearchSwaggerExamples.Errors.ValidationError
                    };
                }
                if (responses['429']) {
                    responses['429'].examples = {
                        'application/json': search_examples_1.SearchSwaggerExamples.Errors.RateLimitError
                    };
                }
                if (responses['500']) {
                    responses['500'].examples = {
                        'application/json': search_examples_1.SearchSwaggerExamples.Errors.SearchError
                    };
                }
            }
        });
    }
    if (document.components?.schemas) {
        Object.keys(document.components.schemas).forEach(schemaName => {
            const schema = document.components.schemas[schemaName];
            switch (schemaName) {
                case 'SearchResultsDto':
                    schema.example = search_examples_1.SearchSwaggerExamples.BasicSearch.Response;
                    break;
                case 'SuggestionDto':
                    schema.example = search_examples_1.SearchSwaggerExamples.Suggestions.BasicResponse[0];
                    break;
                case 'SearchErrorDto':
                    schema.example = search_examples_1.SearchSwaggerExamples.Errors.ValidationError;
                    break;
                case 'MultiTypeSearchResultsDto':
                    schema.example = search_examples_1.SearchSwaggerExamples.MultiTypeSearch.Response;
                    break;
                case 'CategorySearchResultsDto':
                    schema.example = search_examples_1.SearchSwaggerExamples.CategorySearch.HierarchyResponse;
                    break;
            }
        });
    }
}
//# sourceMappingURL=swagger-config.js.map