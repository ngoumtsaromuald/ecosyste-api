#!/usr/bin/env ts-node

/**
 * Compilation Check Script
 * Verifies that all TypeScript files compile without errors
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

class CompilationChecker {
  private scriptsToCheck = [
    'search-cli.ts',
    'search-analytics-cleanup.ts',
    'search-backup-restore.ts',
    'search-health-monitor.ts',
    'test-search-cli.ts',
    'validate-search-setup.ts',
  ];

  async checkCompilation(): Promise<void> {
    console.log('🔍 Checking TypeScript compilation...\n');

    let allPassed = true;

    for (const script of this.scriptsToCheck) {
      try {
        console.log(`📋 Checking ${script}...`);
        
        // Check if file exists
        if (!fs.existsSync(script)) {
          console.log(`❌ File not found: ${script}`);
          allPassed = false;
          continue;
        }

        // Try to compile with TypeScript
        execSync(`npx tsc --noEmit --project tsconfig.json ${script}`, {
          stdio: 'pipe',
          cwd: __dirname,
        });

        console.log(`✅ ${script} compiles successfully`);

      } catch (error) {
        console.log(`❌ ${script} has compilation errors:`);
        console.log(error.stdout?.toString() || error.message);
        allPassed = false;
      }
    }

    console.log('\n📊 Compilation Summary:');
    if (allPassed) {
      console.log('🎉 All scripts compile successfully!');
    } else {
      console.log('⚠️  Some scripts have compilation errors. Please review and fix.');
      process.exit(1);
    }
  }
}

// Main execution
async function main() {
  const checker = new CompilationChecker();
  await checker.checkCompilation();
}

if (require.main === module) {
  main().catch(error => {
    console.error('❌ Compilation check failed:', error);
    process.exit(1);
  });
}