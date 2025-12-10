#!/bin/bash

###############################################################################
# Aero Module Build Script
# 
# This script builds a module for Standalone mode distribution.
# It compiles the module into a UMD bundle that can be loaded at runtime
# without requiring Composer or rebuild.
###############################################################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
MODULE_NAME="${1:-aero-hrm}"
BUILD_MODE="${2:-production}"

echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║         Aero Module Build Script (Standalone)             ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Validate module exists
if [ ! -d "packages/$MODULE_NAME" ]; then
    echo -e "${RED}✗ Module not found: packages/$MODULE_NAME${NC}"
    exit 1
fi

echo -e "${YELLOW}Building module: $MODULE_NAME${NC}"
echo -e "${YELLOW}Build mode: $BUILD_MODE${NC}"
echo ""

# Navigate to module directory
cd "packages/$MODULE_NAME"

# Check if vite.config.js exists
if [ ! -f "vite.config.js" ]; then
    echo -e "${RED}✗ vite.config.js not found. Please create it with library mode configuration.${NC}"
    exit 1
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}⚙ Installing dependencies...${NC}"
    npm install
fi

# Build the module
echo -e "${YELLOW}⚙ Building module...${NC}"
if [ "$BUILD_MODE" = "production" ]; then
    npm run build
else
    npm run build -- --mode development
fi

# Verify build output
if [ ! -d "dist" ]; then
    echo -e "${RED}✗ Build failed: dist/ directory not created${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Build completed successfully${NC}"
echo ""

# Show build artifacts
echo -e "${YELLOW}Build artifacts:${NC}"
du -sh dist/*
echo ""

# Optional: Copy to public directory for testing
read -p "Copy to public/modules for testing? (y/N) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    cd ../../
    mkdir -p public/modules/$MODULE_NAME
    cp -r packages/$MODULE_NAME/dist/* public/modules/$MODULE_NAME/
    echo -e "${GREEN}✓ Copied to public/modules/$MODULE_NAME${NC}"
fi

echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                    Build Complete!                         ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Test the module in standalone mode"
echo "2. Create module.json if not exists"
echo "3. Package as ZIP for distribution"
echo ""
