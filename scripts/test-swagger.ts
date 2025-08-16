#!/usr/bin/env ts-node

/**
 * Script to test Swagger documentation generation and validation
 */

import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from '../src/app.module';
import { writeFileSync } from 'fs';
import { join } from 'path';

async function testSwaggerGeneration() {
  console.log('🔍 Testing Swagger documentation generation...');

  try {
    // Create the NestJS application
    const app = await NestFactory.create(AppModule, { logger: false });

    // Configure Swagger
    const config = new DocumentBuilder()
      .setTitle('ROMAPI Backend Core')
      .setDescription('Backend API Core for ROMAPI ecosystem')
      .setVersion('1.0.0')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          name: 'JWT',
          description: 'Enter JWT token',
          in: 'header',
        },
        'JWT-auth'
      )
      .addTag('Health', 'Health check and system status endpoints')
      .addTag('API Resources', 'Manage business resources, services, and data entries')
      .addTag('Categories', 'Hierarchical category management system')
      .build();

    // Generate the OpenAPI document
    const document = SwaggerModule.createDocument(app, config, {
      operationIdFactory: (controllerKey: string, methodKey: string) => methodKey,
      deepScanRoutes: true,
    });

    // Validate the document structure
    console.log('✅ Swagger document generated successfully');
    console.log(`📊 Found ${Object.keys(document.paths || {}).length} endpoints`);
    console.log(`📋 Found ${Object.keys(document.components?.schemas || {}).length} schemas`);

    // Check for required components
    const requiredEndpoints = [
      '/api-resources',
      '/api-resources/{id}',
      '/api-resources/search',
      '/api-resources/ingest',
      '/categories',
      '/categories/{id}',
    ];

    const missingEndpoints = requiredEndpoints.filter(
      endpoint => !document.paths?.[endpoint]
    );

    if (missingEndpoints.length > 0) {
      console.warn('⚠️  Missing endpoints:', missingEndpoints);
    } else {
      console.log('✅ All required endpoints documented');
    }

    // Check for required schemas (excluding query DTOs which may not appear in schemas)
    const requiredSchemas = [
      'CreateApiResourceDto',
      'ApiResourceResponseDto',
      'IngestApiResourcesDto',
      'CreateCategoryDto',
      'CategoryResponseDto',
    ];

    const missingSchemas = requiredSchemas.filter(
      schema => !document.components?.schemas?.[schema]
    );

    if (missingSchemas.length > 0) {
      console.warn('⚠️  Missing schemas:', missingSchemas);
    } else {
      console.log('✅ All required schemas documented');
    }

    // Save the OpenAPI document for inspection
    const outputPath = join(__dirname, '../dist/openapi.json');
    writeFileSync(outputPath, JSON.stringify(document, null, 2));
    console.log(`💾 OpenAPI document saved to: ${outputPath}`);

    // Generate statistics
    const stats = {
      endpoints: Object.keys(document.paths || {}).length,
      schemas: Object.keys(document.components?.schemas || {}).length,
      tags: document.tags?.length || 0,
      securitySchemes: Object.keys(document.components?.securitySchemes || {}).length,
    };

    console.log('\n📈 Documentation Statistics:');
    console.log(`   Endpoints: ${stats.endpoints}`);
    console.log(`   Schemas: ${stats.schemas}`);
    console.log(`   Tags: ${stats.tags}`);
    console.log(`   Security Schemes: ${stats.securitySchemes}`);

    // Validate endpoint documentation completeness
    let undocumentedEndpoints = 0;
    for (const [path, methods] of Object.entries(document.paths || {})) {
      for (const [method, operation] of Object.entries(methods as any)) {
        if (typeof operation === 'object' && operation !== null) {
          const op = operation as any;
          if (!op.summary || !op.description) {
            console.warn(`⚠️  Endpoint ${method.toUpperCase()} ${path} missing summary or description`);
            undocumentedEndpoints++;
          }
        }
      }
    }

    if (undocumentedEndpoints === 0) {
      console.log('✅ All endpoints have proper documentation');
    } else {
      console.warn(`⚠️  ${undocumentedEndpoints} endpoints need better documentation`);
    }

    await app.close();
    console.log('\n🎉 Swagger documentation test completed successfully!');

  } catch (error) {
    console.error('❌ Error testing Swagger documentation:', error);
    process.exit(1);
  }
}

// Run the test if this script is executed directly
if (require.main === module) {
  testSwaggerGeneration();
}

export { testSwaggerGeneration };