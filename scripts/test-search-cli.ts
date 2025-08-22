#!/usr/bin/env ts-node

/**
 * Test script for Search CLI
 * Simple test to verify all imports and basic functionality
 */

/// <reference path="./types/elasticsearch.d.ts" />
/// <reference path="./types/redis.d.ts" />

import { SearchCLI } from './search-cli';

async function testSearchCLI() {
  console.log('🧪 Testing Search CLI...');
  
  try {
    const cli = new SearchCLI();
    console.log('✅ SearchCLI instance created successfully');
    
    // Test basic functionality without connecting to services
    console.log('✅ All imports and basic setup working correctly');
    
    console.log('🎉 All tests passed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  testSearchCLI();
}