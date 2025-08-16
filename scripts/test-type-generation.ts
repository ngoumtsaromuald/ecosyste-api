#!/usr/bin/env ts-node

/**
 * Script to test TypeScript type generation with API changes
 */

import { generateTypes } from './generate-types';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';

interface TestResult {
  name: string;
  success: boolean;
  message: string;
  duration: number;
}

async function runTests(): Promise<void> {
  console.log('🧪 Testing TypeScript type generation with API changes...\n');

  const results: TestResult[] = [];

  // Test 1: Basic type generation
  results.push(await testBasicGeneration());

  // Test 2: Type compilation
  results.push(await testTypeCompilation());

  // Test 3: Generated file structure
  results.push(await testGeneratedFileStructure());

  // Test 4: Type validation
  results.push(await testTypeValidation());

  // Test 5: API client types
  results.push(await testApiClientTypes());

  // Print results
  console.log('\n📊 Test Results:');
  console.log('================');

  let passed = 0;
  let failed = 0;

  results.forEach(result => {
    const status = result.success ? '✅' : '❌';
    const duration = `(${result.duration}ms)`;
    console.log(`${status} ${result.name} ${duration}`);
    if (!result.success) {
      console.log(`   Error: ${result.message}`);
    }
    
    if (result.success) passed++;
    else failed++;
  });

  console.log(`\n📈 Summary: ${passed} passed, ${failed} failed`);

  if (failed > 0) {
    console.log('\n❌ Some tests failed. Please check the errors above.');
    process.exit(1);
  } else {
    console.log('\n🎉 All tests passed! Type generation is working correctly.');
  }
}

async function testBasicGeneration(): Promise<TestResult> {
  const startTime = Date.now();
  
  try {
    await generateTypes();
    
    // Check if main files exist
    const requiredFiles = [
      'src/types/api.ts',
      'src/types/api-utils.ts',
      'src/types/validators.ts',
      'src/types/client.ts'
    ];

    for (const file of requiredFiles) {
      if (!existsSync(join(__dirname, '..', file))) {
        throw new Error(`Required file ${file} was not generated`);
      }
    }

    return {
      name: 'Basic Type Generation',
      success: true,
      message: 'All required files generated successfully',
      duration: Date.now() - startTime
    };
  } catch (error) {
    return {
      name: 'Basic Type Generation',
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error',
      duration: Date.now() - startTime
    };
  }
}

async function testTypeCompilation(): Promise<TestResult> {
  const startTime = Date.now();
  
  try {
    // Create a test file that imports and uses the generated types
    const testFile = join(__dirname, '../src/types/test-compilation.ts');
    const testContent = `
import type { 
  ApiResourceResponse, 
  CreateApiResourceRequest,
  CategoryResponse,
  ApiResponse,
  PaginatedResponse 
} from './api-utils';
import { TypeValidators } from './validators';
import type { RomapiClient } from './client';

// Test type usage
const testApiResource: ApiResourceResponse = {} as any;
const testCreateRequest: CreateApiResourceRequest = {} as any;
const testCategory: CategoryResponse = {} as any;
const testResponse: ApiResponse<ApiResourceResponse> = {} as any;
const testPaginatedResponse: PaginatedResponse<ApiResourceResponse> = {} as any;

// Test validators
const isValidResourceType = TypeValidators.isResourceType('BUSINESS');
const isValidUUID = TypeValidators.isUUID('123e4567-e89b-12d3-a456-426614174000');

// Test client interface
const testClient: RomapiClient = {} as any;

export { testApiResource, testCreateRequest, testCategory, testResponse, testPaginatedResponse };
`;

    writeFileSync(testFile, testContent);

    // Try to compile the test file
    execSync(`npx tsc --noEmit --skipLibCheck "${testFile}"`, {
      cwd: join(__dirname, '..'),
      stdio: 'pipe'
    });

    // Clean up
    try {
      const fs = require('fs');
      fs.unlinkSync(testFile);
    } catch (e) {
      // Ignore cleanup errors
    }

    return {
      name: 'Type Compilation',
      success: true,
      message: 'Generated types compile successfully',
      duration: Date.now() - startTime
    };
  } catch (error) {
    return {
      name: 'Type Compilation',
      success: false,
      message: error instanceof Error ? error.message : 'Compilation failed',
      duration: Date.now() - startTime
    };
  }
}

async function testGeneratedFileStructure(): Promise<TestResult> {
  const startTime = Date.now();
  
  try {
    // Check main API types file
    const apiTypesPath = join(__dirname, '../src/types/api.ts');
    const apiTypesContent = readFileSync(apiTypesPath, 'utf-8');
    
    if (!apiTypesContent.includes('export interface paths')) {
      throw new Error('Main API types file missing paths interface');
    }
    
    if (!apiTypesContent.includes('export interface components')) {
      throw new Error('Main API types file missing components interface');
    }

    // Check utility types file
    const utilsPath = join(__dirname, '../src/types/api-utils.ts');
    const utilsContent = readFileSync(utilsPath, 'utf-8');
    
    if (!utilsContent.includes('ApiResponse')) {
      throw new Error('Utility types file missing ApiResponse type');
    }
    
    if (!utilsContent.includes('PaginatedResponse')) {
      throw new Error('Utility types file missing PaginatedResponse type');
    }

    // Check validators file
    const validatorsPath = join(__dirname, '../src/types/validators.ts');
    const validatorsContent = readFileSync(validatorsPath, 'utf-8');
    
    if (!validatorsContent.includes('TypeValidators')) {
      throw new Error('Validators file missing TypeValidators class');
    }

    // Check client types file
    const clientPath = join(__dirname, '../src/types/client.ts');
    const clientContent = readFileSync(clientPath, 'utf-8');
    
    if (!clientContent.includes('RomapiClient')) {
      throw new Error('Client types file missing RomapiClient interface');
    }

    return {
      name: 'Generated File Structure',
      success: true,
      message: 'All generated files have correct structure',
      duration: Date.now() - startTime
    };
  } catch (error) {
    return {
      name: 'Generated File Structure',
      success: false,
      message: error instanceof Error ? error.message : 'Structure validation failed',
      duration: Date.now() - startTime
    };
  }
}

async function testTypeValidation(): Promise<TestResult> {
  const startTime = Date.now();
  
  try {
    // Import and test validators
    const validatorsPath = join(__dirname, '../src/types/validators.ts');
    
    // Create a simple test to verify validators work
    const testValidatorFile = join(__dirname, '../src/types/test-validators.ts');
    const testValidatorContent = `
import { TypeValidators } from './validators';

// Test validators
const tests = [
  TypeValidators.isResourceType('BUSINESS'),
  TypeValidators.isResourceStatus('ACTIVE'),
  TypeValidators.isUUID('123e4567-e89b-12d3-a456-426614174000'),
  TypeValidators.isEmail('test@example.com'),
  TypeValidators.isSlug('valid-slug'),
  TypeValidators.isLatitude(45.5),
  TypeValidators.isLongitude(-73.6)
];

const allPassed = tests.every(test => test === true);
if (!allPassed) {
  throw new Error('Some validator tests failed');
}

console.log('All validator tests passed');
`;

    writeFileSync(testValidatorFile, testValidatorContent);

    // Run the validator test
    execSync(`npx ts-node "${testValidatorFile}"`, {
      cwd: join(__dirname, '..'),
      stdio: 'pipe'
    });

    // Clean up
    try {
      const fs = require('fs');
      fs.unlinkSync(testValidatorFile);
    } catch (e) {
      // Ignore cleanup errors
    }

    return {
      name: 'Type Validation',
      success: true,
      message: 'Type validators work correctly',
      duration: Date.now() - startTime
    };
  } catch (error) {
    return {
      name: 'Type Validation',
      success: false,
      message: error instanceof Error ? error.message : 'Validation test failed',
      duration: Date.now() - startTime
    };
  }
}

async function testApiClientTypes(): Promise<TestResult> {
  const startTime = Date.now();
  
  try {
    // Check that client types include all expected endpoints
    const clientPath = join(__dirname, '../src/types/client.ts');
    const clientContent = readFileSync(clientPath, 'utf-8');
    
    const expectedEndpoints = [
      'getApiResources',
      'createApiResource',
      'getApiResourceById',
      'updateApiResource',
      'deleteApiResource',
      'ingestApiResources',
      'searchApiResources',
      'getCategories',
      'createCategory',
      'getCategoryById',
      'updateCategory',
      'deleteCategory'
    ];

    for (const endpoint of expectedEndpoints) {
      if (!clientContent.includes(endpoint)) {
        throw new Error(`Client types missing endpoint: ${endpoint}`);
      }
    }

    // Check for essential interfaces
    const expectedInterfaces = [
      'ApiClient',
      'RomapiClient',
      'ApiResourcesEndpoints',
      'CategoriesEndpoints',
      'HealthEndpoints'
    ];

    for (const interfaceName of expectedInterfaces) {
      if (!clientContent.includes(interfaceName)) {
        throw new Error(`Client types missing interface: ${interfaceName}`);
      }
    }

    return {
      name: 'API Client Types',
      success: true,
      message: 'API client types include all expected endpoints and interfaces',
      duration: Date.now() - startTime
    };
  } catch (error) {
    return {
      name: 'API Client Types',
      success: false,
      message: error instanceof Error ? error.message : 'Client types test failed',
      duration: Date.now() - startTime
    };
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  runTests().catch(error => {
    console.error('❌ Test execution failed:', error);
    process.exit(1);
  });
}

export { runTests };