#!/usr/bin/env ts-node

/**
 * Search System Setup Validation
 * Validates that all search system components are properly configured
 */

import * as fs from 'fs';
import * as path from 'path';

interface ValidationResult {
  component: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
}

class SearchSetupValidator {
  private results: ValidationResult[] = [];

  validate(): ValidationResult[] {
    console.log('🔍 Validating Search System Setup...\n');

    this.validateConfigFiles();
    this.validateDockerFiles();
    this.validateScripts();
    this.validateEnvironmentFiles();
    this.validateDirectoryStructure();

    return this.results;
  }

  private validateConfigFiles(): void {
    const configFiles = [
      'config/elasticsearch/index-mappings.json',
      'config/redis/redis-search.conf',
    ];

    configFiles.forEach(file => {
      if (fs.existsSync(file)) {
        this.addResult(file, 'pass', 'Configuration file exists');
      } else {
        this.addResult(file, 'fail', 'Configuration file missing');
      }
    });

    // Validate Elasticsearch mappings JSON
    try {
      const mappingPath = 'config/elasticsearch/index-mappings.json';
      if (fs.existsSync(mappingPath)) {
        const content = fs.readFileSync(mappingPath, 'utf8');
        JSON.parse(content);
        this.addResult('Elasticsearch Mappings', 'pass', 'Valid JSON format');
      }
    } catch (error) {
      this.addResult('Elasticsearch Mappings', 'fail', 'Invalid JSON format');
    }
  }

  private validateDockerFiles(): void {
    const dockerFiles = [
      'docker-compose.search.yml',
      'Dockerfile.search-worker',
      'Dockerfile.search-indexer',
    ];

    dockerFiles.forEach(file => {
      if (fs.existsSync(file)) {
        this.addResult(file, 'pass', 'Docker file exists');
      } else {
        this.addResult(file, 'fail', 'Docker file missing');
      }
    });
  }

  private validateScripts(): void {
    const scripts = [
      'scripts/search-cli.ts',
      'scripts/search-analytics-cleanup.ts',
      'scripts/search-backup-restore.ts',
      'scripts/search-health-monitor.ts',
      'scripts/deploy-search.sh',
    ];

    scripts.forEach(script => {
      if (fs.existsSync(script)) {
        this.addResult(script, 'pass', 'Script exists');
      } else {
        this.addResult(script, 'fail', 'Script missing');
      }
    });
  }

  private validateEnvironmentFiles(): void {
    const envFiles = [
      'config/environments/.env.search.production',
      'config/environments/.env.search.staging',
    ];

    envFiles.forEach(file => {
      if (fs.existsSync(file)) {
        this.addResult(file, 'pass', 'Environment file exists');
      } else {
        this.addResult(file, 'warning', 'Environment file missing (template available)');
      }
    });
  }

  private validateDirectoryStructure(): void {
    const directories = [
      'config/elasticsearch',
      'config/redis',
      'config/environments',
      'scripts',
      'docs',
    ];

    directories.forEach(dir => {
      if (fs.existsSync(dir) && fs.lstatSync(dir).isDirectory()) {
        this.addResult(dir, 'pass', 'Directory exists');
      } else {
        this.addResult(dir, 'fail', 'Directory missing');
      }
    });
  }

  private addResult(component: string, status: 'pass' | 'fail' | 'warning', message: string): void {
    this.results.push({ component, status, message });
  }

  printResults(): void {
    console.log('\n📊 Validation Results:\n');

    const passed = this.results.filter(r => r.status === 'pass').length;
    const failed = this.results.filter(r => r.status === 'fail').length;
    const warnings = this.results.filter(r => r.status === 'warning').length;

    this.results.forEach(result => {
      const icon = result.status === 'pass' ? '✅' : result.status === 'fail' ? '❌' : '⚠️';
      console.log(`${icon} ${result.component}: ${result.message}`);
    });

    console.log(`\n📈 Summary:`);
    console.log(`  ✅ Passed: ${passed}`);
    console.log(`  ❌ Failed: ${failed}`);
    console.log(`  ⚠️  Warnings: ${warnings}`);
    console.log(`  📊 Total: ${this.results.length}`);

    if (failed === 0) {
      console.log('\n🎉 Search system setup validation completed successfully!');
    } else {
      console.log('\n⚠️  Some components are missing or misconfigured. Please review the failed items.');
    }
  }
}

// Main execution
async function main() {
  const validator = new SearchSetupValidator();
  const results = validator.validate();
  validator.printResults();

  const failed = results.filter(r => r.status === 'fail').length;
  process.exit(failed > 0 ? 1 : 0);
}

if (require.main === module) {
  main().catch(error => {
    console.error('❌ Validation failed:', error);
    process.exit(1);
  });
}

export { SearchSetupValidator };