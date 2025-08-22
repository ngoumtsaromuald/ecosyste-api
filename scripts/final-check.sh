#!/bin/bash

# Final Check Script for Search System
# Runs all validation and test scripts

set -e

echo "🚀 Running Final Search System Check..."
echo "======================================"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to run command and check result
run_check() {
    local name="$1"
    local command="$2"
    
    echo -e "\n${YELLOW}📋 Running: $name${NC}"
    echo "Command: $command"
    
    if eval "$command"; then
        echo -e "${GREEN}✅ $name: PASSED${NC}"
        return 0
    else
        echo -e "${RED}❌ $name: FAILED${NC}"
        return 1
    fi
}

# Initialize counters
total_checks=0
passed_checks=0

# Run validation checks
echo -e "\n${YELLOW}🔍 Phase 1: Configuration Validation${NC}"

if run_check "Search Setup Validation" "npm run search:validate"; then
    ((passed_checks++))
fi
((total_checks++))

# Run compilation checks
echo -e "\n${YELLOW}🔧 Phase 2: Compilation Check${NC}"

if run_check "TypeScript Compilation" "npm run search:compile-check"; then
    ((passed_checks++))
fi
((total_checks++))

# Run basic tests
echo -e "\n${YELLOW}🧪 Phase 3: Basic Tests${NC}"

if run_check "Search CLI Test" "npm run search:test"; then
    ((passed_checks++))
fi
((total_checks++))

# Check Docker files
echo -e "\n${YELLOW}🐳 Phase 4: Docker Configuration${NC}"

if run_check "Docker Compose Validation" "docker-compose -f docker-compose.search.yml config"; then
    ((passed_checks++))
fi
((total_checks++))

# Summary
echo -e "\n======================================"
echo -e "${YELLOW}📊 Final Check Summary${NC}"
echo "======================================"
echo "Total Checks: $total_checks"
echo "Passed: $passed_checks"
echo "Failed: $((total_checks - passed_checks))"

if [ $passed_checks -eq $total_checks ]; then
    echo -e "\n${GREEN}🎉 ALL CHECKS PASSED!${NC}"
    echo -e "${GREEN}✅ Search system is ready for deployment${NC}"
    exit 0
else
    echo -e "\n${RED}⚠️  SOME CHECKS FAILED${NC}"
    echo -e "${RED}❌ Please review and fix the issues above${NC}"
    exit 1
fi