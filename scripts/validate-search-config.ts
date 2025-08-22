#!/usr/bin/env ts-node

import * as fs from 'fs';
import * as path from 'path';

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

class SearchConfigValidator {
  private errors: string[] = [];
  private warnings: string[] = [];

  async validate(): Promise<ValidationResult> {
    console.log('🔍 Validating Search Infrastructure Configuration...');
    console.log('================================================');

    try {
      // Validate configuration files
      await this.validateConfigFiles();

      // Validate environment variables
      await this.validateEnvironmentVariables();

      // Validate Docker Compose files
      await this.validateDockerComposeFiles();

      // Validate TypeScript modules
      await this.validateTypeScriptModules();

      // Validate package dependencies
      await this.validateDependencies();

      console.log('\n📊 Validation Summary:');
      console.log('======================');

      if (this.errors.length === 0) {
        console.log('✅ Configuration validation passed!');
        if (this.warnings.length > 0) {
          console.log(`⚠️  ${this.warnings.length} warnings found:`);
          this.warnings.forEach(warning => console.log(`   - ${warning}`));
        }
      } else {
        console.log(`❌ ${this.errors.length} errors found:`);
        this.errors.forEach(error => console.log(`   - ${error}`));
        
        if (this.warnings.length > 0) {
          console.log(`⚠️  ${this.warnings.length} warnings found:`);
          this.warnings.forEach(warning => console.log(`   - ${warning}`));
        }
      }

      return {
        isValid: this.errors.length === 0,
        errors: this.errors,
        warnings: this.warnings,
      };

    } catch (error) {
      this.errors.push(`Validation failed: ${error.message}`);
      return {
        isValid: false,
        errors: this.errors,
        warnings: this.warnings,
      };
    }
  }

  private async validateConfigFiles(): Promise<void> {
    console.log('\n1️⃣  Validating configuration files...');

    const configFiles = [
      'config/elasticsearch/elasticsearch.yml',
      'config/elasticsearch/index-mappings.json',
      'config/redis/redis-search.conf',
    ];

    for (const configFile of configFiles) {
      if (!fs.existsSync(configFile)) {
        this.errors.push(`Configuration file missing: ${configFile}`);
      } else {
        console.log(`✅ Found: ${configFile}`);
        
        // Validate JSON files
        if (configFile.endsWith('.json')) {
          try {
            const content = fs.readFileSync(configFile, 'utf8');
            JSON.parse(content);
            console.log(`✅ Valid JSON: ${configFile}`);
          } catch (error) {
            this.errors.push(`Invalid JSON in ${configFile}: ${error.message}`);
          }
        }
      }
    }

    // Validate index mappings structure
    await this.validateIndexMappings();
  }

  private async validateIndexMappings(): Promise<void> {
    const mappingsPath = 'config/elasticsearch/index-mappings.json';
    
    if (fs.existsSync(mappingsPath)) {
      try {
        const mappings = JSON.parse(fs.readFileSync(mappingsPath, 'utf8'));
        
        // Check required sections
        if (!mappings.settings) {
          this.errors.push('Index mappings missing settings section');
        }
        
        if (!mappings.mappings) {
          this.errors.push('Index mappings missing mappings section');
        }
        
        // Check French analyzer
        if (!mappings.settings?.analysis?.analyzer?.french_analyzer) {
          this.errors.push('French analyzer not configured in index mappings');
        }
        
        // Check required fields
        const requiredFields = ['name', 'description', 'category', 'location', 'resourceType'];
        const properties = mappings.mappings?.properties || {};
        
        for (const field of requiredFields) {
          if (!properties[field]) {
            this.errors.push(`Required field '${field}' missing from index mappings`);
          }
        }
        
        console.log('✅ Index mappings structure validated');
        
      } catch (error) {
        this.errors.push(`Failed to validate index mappings: ${error.message}`);
      }
    }
  }

  private async validateEnvironmentVariables(): Promise<void> {
    console.log('\n2️⃣  Validating environment variables...');

    const requiredEnvVars = [
      'ELASTICSEARCH_HOST',
      'ELASTICSEARCH_PORT',
      'ELASTICSEARCH_INDEX_PREFIX',
      'REDIS_HOST',
      'REDIS_PORT',
      'QUEUE_REDIS_DB',
    ];

    const optionalEnvVars = [
      'ELASTICSEARCH_USERNAME',
      'ELASTICSEARCH_PASSWORD',
      'REDIS_PASSWORD',
      'SEARCH_CACHE_TTL',
      'INDEXING_QUEUE_CONCURRENCY',
    ];

    // Check .env.development file
    const envFile = '.env.development';
    if (!fs.existsSync(envFile)) {
      this.warnings.push(`Environment file not found: ${envFile}`);
    } else {
      const envContent = fs.readFileSync(envFile, 'utf8');
      
      for (const envVar of requiredEnvVars) {
        if (!envContent.includes(`${envVar}=`)) {
          this.errors.push(`Required environment variable missing: ${envVar}`);
        } else {
          console.log(`✅ Found: ${envVar}`);
        }
      }
      
      for (const envVar of optionalEnvVars) {
        if (!envContent.includes(`${envVar}=`)) {
          this.warnings.push(`Optional environment variable missing: ${envVar}`);
        } else {
          console.log(`✅ Found: ${envVar}`);
        }
      }
    }
  }

  private async validateDockerComposeFiles(): Promise<void> {
    console.log('\n3️⃣  Validating Docker Compose files...');

    const composeFiles = [
      'docker-compose.yml',
      'docker-compose.dev.yml',
      'docker-compose.search.yml',
    ];

    for (const composeFile of composeFiles) {
      if (!fs.existsSync(composeFile)) {
        if (composeFile === 'docker-compose.search.yml') {
          this.warnings.push(`Optional Docker Compose file missing: ${composeFile}`);
        } else {
          this.errors.push(`Docker Compose file missing: ${composeFile}`);
        }
      } else {
        console.log(`✅ Found: ${composeFile}`);
        
        // Basic validation - check for required services
        const content = fs.readFileSync(composeFile, 'utf8');
        
        if (composeFile.includes('dev') || composeFile.includes('search')) {
          const requiredServices = ['elasticsearch', 'redis'];
          
          for (const service of requiredServices) {
            if (!content.includes(`${service}:`)) {
              this.warnings.push(`Service '${service}' not found in ${composeFile}`);
            }
          }
        }
      }
    }
  }

  private async validateTypeScriptModules(): Promise<void> {
    console.log('\n4️⃣  Validating TypeScript modules...');

    const moduleFiles = [
      'src/modules/search/search.module.ts',
      'src/modules/search/services/elasticsearch.service.ts',
      'src/modules/search/services/indexing.service.ts',
      'src/modules/search/services/search-cache.service.ts',
      'src/modules/search/processors/indexing.processor.ts',
      'src/config/elasticsearch.config.ts',
      'src/config/queue.config.ts',
    ];

    for (const moduleFile of moduleFiles) {
      if (!fs.existsSync(moduleFile)) {
        this.errors.push(`TypeScript module missing: ${moduleFile}`);
      } else {
        console.log(`✅ Found: ${moduleFile}`);
        
        // Basic syntax validation
        try {
          const content = fs.readFileSync(moduleFile, 'utf8');
          
          // Check for basic TypeScript/NestJS patterns
          if (moduleFile.includes('.module.ts') && !content.includes('@Module')) {
            this.warnings.push(`Module decorator missing in ${moduleFile}`);
          }
          
          if (moduleFile.includes('.service.ts') && !content.includes('@Injectable')) {
            this.warnings.push(`Injectable decorator missing in ${moduleFile}`);
          }
          
          if (moduleFile.includes('.processor.ts') && !content.includes('@Processor')) {
            this.warnings.push(`Processor decorator missing in ${moduleFile}`);
          }
          
        } catch (error) {
          this.warnings.push(`Could not read ${moduleFile}: ${error.message}`);
        }
      }
    }
  }

  private async validateDependencies(): Promise<void> {
    console.log('\n5️⃣  Validating package dependencies...');

    const packageJsonPath = 'package.json';
    if (!fs.existsSync(packageJsonPath)) {
      this.errors.push('package.json not found');
      return;
    }

    try {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };

      const requiredDeps = [
        '@elastic/elasticsearch',
        'ioredis',
        '@nestjs/bull',
        'bull',
        '@nestjs/config',
      ];

      for (const dep of requiredDeps) {
        if (!dependencies[dep]) {
          this.errors.push(`Required dependency missing: ${dep}`);
        } else {
          console.log(`✅ Found dependency: ${dep}@${dependencies[dep]}`);
        }
      }

      // Check for potential version conflicts
      if (dependencies['@nestjs/bull'] && dependencies['bull']) {
        console.log('✅ Bull queue dependencies found');
      }

    } catch (error) {
      this.errors.push(`Failed to validate dependencies: ${error.message}`);
    }
  }
}

// CLI interface
async function main() {
  const validator = new SearchConfigValidator();
  const result = await validator.validate();

  if (result.isValid) {
    console.log('\n🎉 Configuration is ready for search infrastructure setup!');
    console.log('\nNext steps:');
    console.log('1. Start Docker services: docker-compose -f docker-compose.dev.yml up -d');
    console.log('2. Run setup: npm run search:setup');
    console.log('3. Start application: npm run start:dev');
    process.exit(0);
  } else {
    console.log('\n❌ Configuration validation failed. Please fix the errors above.');
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(console.error);
}

export { SearchConfigValidator };