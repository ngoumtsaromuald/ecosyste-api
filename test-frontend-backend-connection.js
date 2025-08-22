/**
 * Script de test pour vérifier la connexion entre le frontend et le backend
 * Ce script simule les appels API que le frontend ferait au backend
 */

const BACKEND_URL = 'http://localhost:3000/api/v1';
const FRONTEND_URL = 'http://localhost:3001';

// Fonction utilitaire pour faire des appels API
async function apiCall(endpoint, options = {}) {
  const url = `${BACKEND_URL}${endpoint}`;
  const config = {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Origin': FRONTEND_URL,
      ...options.headers
    },
    ...options
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json();
    
    console.log(`✅ ${config.method} ${endpoint}:`, {
      status: response.status,
      success: data.success,
      corsHeaders: {
        'Access-Control-Allow-Origin': response.headers.get('Access-Control-Allow-Origin'),
        'Access-Control-Allow-Credentials': response.headers.get('Access-Control-Allow-Credentials')
      },
      data: data.data || data.error
    });
    
    return { response, data };
  } catch (error) {
    console.error(`❌ ${config.method} ${endpoint}:`, error.message);
    return { error };
  }
}

// Tests de connectivité
async function testConnectivity() {
  console.log('🚀 Test de connectivité Frontend <-> Backend\n');
  console.log(`Frontend: ${FRONTEND_URL}`);
  console.log(`Backend: ${BACKEND_URL}\n`);

  // Test 1: Health check
  console.log('📋 Test 1: Health Check');
  await apiCall('/');
  console.log('');

  // Test 2: Liste des ressources API
  console.log('📋 Test 2: Liste des ressources API');
  await apiCall('/api-resources');
  console.log('');

  // Test 3: Recherche de ressources
  console.log('📋 Test 3: Recherche de ressources');
  await apiCall('/api-resources/search?search=test');
  console.log('');

  // Test 4: Liste des catégories
  console.log('📋 Test 4: Liste des catégories');
  await apiCall('/categories');
  console.log('');

  // Test 5: Test CORS avec différentes méthodes
  console.log('📋 Test 5: Test CORS OPTIONS');
  await apiCall('/api-resources', {
    method: 'OPTIONS',
    headers: {
      'Access-Control-Request-Method': 'GET',
      'Access-Control-Request-Headers': 'Content-Type'
    }
  });
  console.log('');

  // Test 6: Test avec paramètres de recherche avancés
  console.log('📋 Test 6: Recherche avec filtres');
  await apiCall('/api-resources/search?search=restaurant&resourceType=BUSINESS&status=ACTIVE');
  console.log('');

  console.log('✨ Tests terminés!');
}

// Fonction pour tester les fonctionnalités spécifiques du frontend
async function testFrontendFeatures() {
  console.log('\n🎯 Test des fonctionnalités Frontend\n');

  // Simulation d'une recherche utilisateur
  console.log('📋 Simulation: Recherche utilisateur "restaurant"');
  const searchResult = await apiCall('/api-resources/search?search=restaurant');
  
  if (searchResult.data && searchResult.data.success) {
    console.log(`   Résultats trouvés: ${searchResult.data.data.total}`);
    console.log(`   Ressources: ${searchResult.data.data.resources.length}`);
  }
  console.log('');

  // Simulation de navigation par catégories
  console.log('📋 Simulation: Navigation par catégories');
  const categoriesResult = await apiCall('/categories');
  
  if (categoriesResult.data && categoriesResult.data.success) {
    console.log(`   Catégories disponibles: ${categoriesResult.data.data.length}`);
    categoriesResult.data.data.forEach(cat => {
      console.log(`   - ${cat.name} (${cat.slug})`);
    });
  }
  console.log('');

  // Test de performance
  console.log('📋 Test de performance: 5 appels simultanés');
  const startTime = Date.now();
  const promises = Array(5).fill().map((_, i) => 
    apiCall(`/api-resources/search?search=test${i}`)
  );
  
  await Promise.all(promises);
  const endTime = Date.now();
  console.log(`   Temps total: ${endTime - startTime}ms`);
  console.log('');
}

// Exécution des tests
if (typeof window === 'undefined') {
  // Node.js environment
  const fetch = require('node-fetch');
  global.fetch = fetch;
  
  testConnectivity()
    .then(() => testFrontendFeatures())
    .catch(console.error);
} else {
  // Browser environment
  window.testFrontendBackendConnection = {
    testConnectivity,
    testFrontendFeatures,
    apiCall
  };
  
  console.log('Tests disponibles dans window.testFrontendBackendConnection');
}

module.exports = {
  testConnectivity,
  testFrontendFeatures,
  apiCall
};