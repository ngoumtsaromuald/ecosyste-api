/**
 * Configuration Swagger pour l'API de recherche ROMAPI
 */

import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { INestApplication } from '@nestjs/common';
import { SearchSwaggerExamples } from './search-examples';

export function setupSwagger(app: INestApplication): void {
  const config = new DocumentBuilder()
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
    .setContact(
      'ROMAPI Team',
      'https://romapi.com',
      'support@romapi.com'
    )
    .setLicense(
      'MIT',
      'https://opensource.org/licenses/MIT'
    )
    .addServer('https://api.romapi.com', 'Production')
    .addServer('https://staging-api.romapi.com', 'Staging')
    .addServer('http://localhost:3000', 'Development')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        description: 'Entrez votre token JWT',
        in: 'header',
      },
      'JWT-auth'
    )
    .addTag('Search', 'Endpoints de recherche principale')
    .addTag('Suggestions', 'Auto-complétion et suggestions')
    .addTag('Categories', 'Recherche par catégories')
    .addTag('Analytics', 'Statistiques et analytics')
    .addTag('Multi-Type', 'Recherche multi-types')
    .build();

  const document = SwaggerModule.createDocument(app, config, {
    extraModels: [],
    deepScanRoutes: true,
  });

  // Ajouter des exemples personnalisés au document
  addCustomExamples(document);

  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      filter: true,
      showExtensions: true,
      showCommonExtensions: true,
      tryItOutEnabled: true,
      requestInterceptor: (req: any) => {
        // Ajouter des headers personnalisés si nécessaire
        return req;
      },
      responseInterceptor: (res: any) => {
        // Traiter les réponses si nécessaire
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

function addCustomExamples(document: any): void {
  // Ajouter des exemples aux paths
  if (document.paths) {
    // Exemple pour la recherche principale
    if (document.paths['/search']?.get?.responses?.['200']) {
      document.paths['/search'].get.responses['200'].examples = {
        'application/json': {
          'basic-search': SearchSwaggerExamples.BasicSearch.Response,
          'advanced-search': SearchSwaggerExamples.AdvancedSearch.Response,
          'geographic-search': SearchSwaggerExamples.GeographicSearch.Response
        }
      };
    }

    // Exemple pour les suggestions
    if (document.paths['/search/suggest']?.get?.responses?.['200']) {
      document.paths['/search/suggest'].get.responses['200'].examples = {
        'application/json': {
          'basic-suggestions': SearchSwaggerExamples.Suggestions.BasicResponse,
          'smart-suggestions': SearchSwaggerExamples.Suggestions.SmartResponse
        }
      };
    }

    // Exemples d'erreurs
    const errorPaths = ['/search', '/search/suggest', '/search/multi-type'];
    errorPaths.forEach(path => {
      if (document.paths[path]?.get?.responses) {
        const responses = document.paths[path].get.responses;
        
        if (responses['400']) {
          responses['400'].examples = {
            'application/json': SearchSwaggerExamples.Errors.ValidationError
          };
        }
        
        if (responses['429']) {
          responses['429'].examples = {
            'application/json': SearchSwaggerExamples.Errors.RateLimitError
          };
        }
        
        if (responses['500']) {
          responses['500'].examples = {
            'application/json': SearchSwaggerExamples.Errors.SearchError
          };
        }
      }
    });
  }

  // Ajouter des exemples aux composants
  if (document.components?.schemas) {
    // Ajouter des exemples aux schémas principaux
    Object.keys(document.components.schemas).forEach(schemaName => {
      const schema = document.components.schemas[schemaName];
      
      // Ajouter des exemples basés sur le nom du schéma
      switch (schemaName) {
        case 'SearchResultsDto':
          schema.example = SearchSwaggerExamples.BasicSearch.Response;
          break;
        case 'SuggestionDto':
          schema.example = SearchSwaggerExamples.Suggestions.BasicResponse[0];
          break;
        case 'SearchErrorDto':
          schema.example = SearchSwaggerExamples.Errors.ValidationError;
          break;
        case 'MultiTypeSearchResultsDto':
          schema.example = SearchSwaggerExamples.MultiTypeSearch.Response;
          break;
        case 'CategorySearchResultsDto':
          schema.example = SearchSwaggerExamples.CategorySearch.HierarchyResponse;
          break;
      }
    });
  }
}

export { SearchSwaggerExamples };