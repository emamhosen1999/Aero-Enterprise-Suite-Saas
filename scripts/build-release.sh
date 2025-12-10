#!/bin/bash

###############################################################################
# Aero Release Build Script
# 
# This script builds production-ready distribution packages:
# 1. Aero HRM Installer (Fat Package - with vendor)
# 2. Aero Module Add-ons (Lightweight - no vendor)
#
# Usage:
#   ./build-release.sh [version]
#   Example: ./build-release.sh 1.0.0
###############################################################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
VERSION="${1:-1.0.0}"
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DIST_DIR="$ROOT_DIR/dist"
PACKAGES_DIR="$ROOT_DIR/packages"

echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║         Aero Enterprise Suite - Release Builder           ║${NC}"
echo -e "${GREEN}║                    Version: $VERSION                        ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Clean previous builds
echo -e "${YELLOW}🧹 Cleaning previous builds...${NC}"
rm -rf "$DIST_DIR"
mkdir -p "$DIST_DIR"

###############################################################################
# STEP 1: Compile Frontend Assets
###############################################################################

echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  STEP 1: Compiling Frontend Assets                        ${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""

# Build Core (Host)
echo -e "${YELLOW}📦 Building aero-core (Host Mode)...${NC}"
cd "$PACKAGES_DIR/aero-core"
if [ ! -d "node_modules" ]; then
    npm install
fi
npm run build
echo -e "${GREEN}✓ Core assets compiled to public/build/${NC}"

# Build HRM Module (Guest - Library Mode)
echo -e "${YELLOW}📦 Building aero-hrm (Library Mode)...${NC}"
cd "$PACKAGES_DIR/aero-hrm"
if [ ! -d "node_modules" ]; then
    npm install
fi
npm run build
echo -e "${GREEN}✓ HRM module compiled to dist/${NC}"

# Build CRM Module (Guest - Library Mode)
echo -e "${YELLOW}📦 Building aero-crm (Library Mode)...${NC}"
cd "$PACKAGES_DIR/aero-crm"
if [ ! -d "node_modules" ]; then
    npm install
fi
npm run build
echo -e "${GREEN}✓ CRM module compiled to dist/${NC}"

# Build other modules
for module in finance project pos scm ims compliance dms quality; do
    if [ -d "$PACKAGES_DIR/aero-$module" ] && [ -f "$PACKAGES_DIR/aero-$module/package.json" ]; then
        echo -e "${YELLOW}📦 Building aero-$module (Library Mode)...${NC}"
        cd "$PACKAGES_DIR/aero-$module"
        if [ ! -d "node_modules" ]; then
            npm install
        fi
        npm run build 2>/dev/null || echo -e "${YELLOW}⚠ No build script for aero-$module${NC}"
        echo -e "${GREEN}✓ aero-$module compiled${NC}"
    fi
done

###############################################################################
# STEP 2: Build Standalone Installer (CodeCanyon - Fat Package)
###############################################################################

echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  STEP 2: Building Standalone Installer (Fat Package)      ${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""

echo -e "${YELLOW}🏗️  Creating Aero HRM Installer structure...${NC}"

INSTALLER_DIR="$DIST_DIR/installer"
mkdir -p "$INSTALLER_DIR/modules"
mkdir -p "$INSTALLER_DIR/public/build"

# Copy Core package
echo -e "${YELLOW}📋 Copying aero-core...${NC}"
cp -r "$PACKAGES_DIR/aero-core" "$INSTALLER_DIR/modules/"
# Copy Core's compiled assets to public/build (The Host)
cp -r "$PACKAGES_DIR/aero-core/public/build/"* "$INSTALLER_DIR/public/build/" 2>/dev/null || true

# Copy HRM package
echo -e "${YELLOW}📋 Copying aero-hrm...${NC}"
cp -r "$PACKAGES_DIR/aero-hrm" "$INSTALLER_DIR/modules/"

# Copy Platform package (for SaaS features)
echo -e "${YELLOW}📋 Copying aero-platform...${NC}"
cp -r "$PACKAGES_DIR/aero-platform" "$INSTALLER_DIR/modules/"

# Copy standalone-host as base application
echo -e "${YELLOW}📋 Copying Laravel application structure...${NC}"
cd "$ROOT_DIR/apps/standalone-host"
rsync -av --exclude='node_modules' \
          --exclude='vendor' \
          --exclude='storage/logs/*' \
          --exclude='storage/framework/cache/*' \
          --exclude='storage/framework/sessions/*' \
          --exclude='storage/framework/views/*' \
          --exclude='.env' \
          --exclude='public/build' \
          . "$INSTALLER_DIR/" || cp -r . "$INSTALLER_DIR/"

# Create "Fat" composer.json that references local modules
echo -e "${YELLOW}📝 Creating installer composer.json...${NC}"
cat > "$INSTALLER_DIR/composer.json" <<'EOF'
{
    "$schema": "https://getcomposer.org/schema.json",
    "name": "aero/hrm-installer",
    "type": "project",
    "description": "Aero HRM Standalone Installer - Complete Application with Vendor Dependencies",
    "keywords": ["aero", "hrm", "erp", "laravel", "installer"],
    "license": "proprietary",
    "repositories": [
        {
            "type": "path",
            "url": "./modules/*",
            "options": {
                "symlink": false
            }
        }
    ],
    "require": {
        "php": "^8.2",
        "laravel/framework": "^11.0|^12.0",
        "laravel/tinker": "^2.10",
        "aero/core": "*",
        "aero/platform": "*",
        "aero/hrm": "*"
    },
    "require-dev": {
        "fakerphp/faker": "^1.23",
        "laravel/pint": "^1.24",
        "mockery/mockery": "^1.6",
        "nunomaduro/collision": "^8.6",
        "phpunit/phpunit": "^11.0"
    },
    "autoload": {
        "psr-4": {
            "App\\": "app/",
            "Database\\Factories\\": "database/factories/",
            "Database\\Seeders\\": "database/seeders/"
        }
    },
    "autoload-dev": {
        "psr-4": {
            "Tests\\": "tests/"
        }
    },
    "scripts": {
        "post-autoload-dump": [
            "Illuminate\\Foundation\\ComposerScripts::postAutoloadDump",
            "@php artisan package:discover --ansi"
        ],
        "post-update-cmd": [
            "@php artisan vendor:publish --tag=laravel-assets --ansi --force"
        ],
        "post-root-package-install": [
            "@php -r \"file_exists('.env') || copy('.env.example', '.env');\""
        ],
        "post-create-project-cmd": [
            "@php artisan key:generate --ansi"
        ]
    },
    "extra": {
        "laravel": {
            "dont-discover": []
        }
    },
    "config": {
        "optimize-autoloader": true,
        "preferred-install": "dist",
        "sort-packages": true,
        "allow-plugins": {
            "pestphp/pest-plugin": true,
            "php-http/discovery": true
        }
    },
    "minimum-stability": "stable",
    "prefer-stable": true
}
EOF

# Install dependencies (The Heavy Lift - Creates vendor folder)
echo -e "${YELLOW}⚙️  Installing composer dependencies (this may take a while)...${NC}"
cd "$INSTALLER_DIR"
composer install --no-dev --optimize-autoloader --ignore-platform-reqs

# Create storage directories
echo -e "${YELLOW}📁 Creating storage structure...${NC}"
mkdir -p storage/framework/{cache,sessions,views}
mkdir -p storage/logs
chmod -R 755 storage bootstrap/cache

# Create README for installer
cat > "$INSTALLER_DIR/README.md" <<EOF
# Aero HRM Standalone Installer v${VERSION}

## Installation Instructions

1. Extract this archive to your web server directory
2. Configure your web server to point to the \`public\` folder
3. Copy \`.env.example\` to \`.env\` and configure your database
4. Run the following commands:

\`\`\`bash
php artisan key:generate
php artisan migrate --seed
php artisan storage:link
\`\`\`

5. Access your application at your configured domain

## System Requirements

- PHP >= 8.2
- MySQL >= 8.0 or PostgreSQL >= 13
- Composer (already installed in vendor/)
- Node.js >= 18.x (for frontend compilation, optional)

## Documentation

Visit https://docs.aerosuite.com for full documentation.

## Support

Email: support@aerosuite.com
EOF

# Create .env.example with sensible defaults
cat > "$INSTALLER_DIR/.env.example" <<EOF
APP_NAME="Aero HRM"
APP_ENV=production
APP_KEY=
APP_DEBUG=false
APP_TIMEZONE=UTC
APP_URL=http://localhost

APP_LOCALE=en
APP_FALLBACK_LOCALE=en
APP_FAKER_LOCALE=en_US

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=aero_hrm
DB_USERNAME=root
DB_PASSWORD=

CACHE_STORE=file
SESSION_DRIVER=file
QUEUE_CONNECTION=sync
EOF

# Package the installer
echo -e "${YELLOW}📦 Creating ZIP archive...${NC}"
cd "$DIST_DIR"
zip -r "Aero_HRM_Installer_v${VERSION}.zip" installer \
    -x "*/node_modules/*" \
    -x "*/.git/*" \
    -x "*/.env" \
    -x "*/storage/logs/*" \
    -x "*/storage/framework/cache/*" \
    -x "*/storage/framework/sessions/*" \
    -x "*/storage/framework/views/*"

INSTALLER_SIZE=$(du -h "Aero_HRM_Installer_v${VERSION}.zip" | cut -f1)
echo -e "${GREEN}✓ Installer created: Aero_HRM_Installer_v${VERSION}.zip ($INSTALLER_SIZE)${NC}"

###############################################################################
# STEP 3: Build Add-on Modules (Lightweight Updates)
###############################################################################

echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  STEP 3: Building Module Add-ons (Lightweight Packages)   ${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""

# Build CRM Add-on
echo -e "${YELLOW}🔌 Building Aero CRM Add-on...${NC}"
CRM_ADDON_DIR="$DIST_DIR/crm-addon"
mkdir -p "$CRM_ADDON_DIR/aero-crm"

# Copy module files (NO VENDOR!)
cp -r "$PACKAGES_DIR/aero-crm/src" "$CRM_ADDON_DIR/aero-crm/"
cp -r "$PACKAGES_DIR/aero-crm/resources" "$CRM_ADDON_DIR/aero-crm/"
cp -r "$PACKAGES_DIR/aero-crm/config" "$CRM_ADDON_DIR/aero-crm/" 2>/dev/null || true
cp -r "$PACKAGES_DIR/aero-crm/database" "$CRM_ADDON_DIR/aero-crm/" 2>/dev/null || true
cp -r "$PACKAGES_DIR/aero-crm/routes" "$CRM_ADDON_DIR/aero-crm/" 2>/dev/null || true

# Copy compiled JS (The Compiled Guest Module)
cp -r "$PACKAGES_DIR/aero-crm/dist" "$CRM_ADDON_DIR/aero-crm/" 2>/dev/null || true

# Copy metadata
cp "$PACKAGES_DIR/aero-crm/composer.json" "$CRM_ADDON_DIR/aero-crm/"
cp "$PACKAGES_DIR/aero-crm/module.json" "$CRM_ADDON_DIR/aero-crm/" 2>/dev/null || true
cp "$PACKAGES_DIR/aero-crm/README.md" "$CRM_ADDON_DIR/aero-crm/" 2>/dev/null || true

# Create installation instructions
cat > "$CRM_ADDON_DIR/INSTALL.md" <<EOF
# Aero CRM Module Installation v${VERSION}

## Installation Instructions

1. Extract this archive to your Aero application root directory
2. Run composer install from the extracted aero-crm folder:

\`\`\`bash
cd aero-crm
composer install --no-dev
cd ..
\`\`\`

3. Register the module (if not auto-discovered):

\`\`\`bash
php artisan module:register aero-crm
php artisan migrate
\`\`\`

4. Clear caches:

\`\`\`bash
php artisan config:clear
php artisan cache:clear
php artisan view:clear
\`\`\`

## Requirements

- Existing Aero HRM installation
- aero/core >= 1.0.0
- PHP >= 8.2

## Verification

Check that \`dist/aero-crm.umd.js\` exists and contains externalized React imports.

## Support

Email: support@aerosuite.com
EOF

# Package the CRM add-on
cd "$DIST_DIR"
zip -r "Aero_CRM_Module_v${VERSION}.zip" crm-addon \
    -x "*/node_modules/*" \
    -x "*/.git/*" \
    -x "*/vendor/*"

CRM_SIZE=$(du -h "Aero_CRM_Module_v${VERSION}.zip" | cut -f1)
echo -e "${GREEN}✓ CRM Add-on created: Aero_CRM_Module_v${VERSION}.zip ($CRM_SIZE)${NC}"

# Build other module add-ons
for module in finance project pos scm ims compliance dms quality; do
    if [ -d "$PACKAGES_DIR/aero-$module" ]; then
        echo -e "${YELLOW}🔌 Building Aero ${module^^} Add-on...${NC}"
        
        MODULE_ADDON_DIR="$DIST_DIR/${module}-addon"
        mkdir -p "$MODULE_ADDON_DIR/aero-$module"
        
        # Copy module files
        cp -r "$PACKAGES_DIR/aero-$module/src" "$MODULE_ADDON_DIR/aero-$module/" 2>/dev/null || true
        cp -r "$PACKAGES_DIR/aero-$module/resources" "$MODULE_ADDON_DIR/aero-$module/" 2>/dev/null || true
        cp -r "$PACKAGES_DIR/aero-$module/config" "$MODULE_ADDON_DIR/aero-$module/" 2>/dev/null || true
        cp -r "$PACKAGES_DIR/aero-$module/database" "$MODULE_ADDON_DIR/aero-$module/" 2>/dev/null || true
        cp -r "$PACKAGES_DIR/aero-$module/routes" "$MODULE_ADDON_DIR/aero-$module/" 2>/dev/null || true
        cp -r "$PACKAGES_DIR/aero-$module/dist" "$MODULE_ADDON_DIR/aero-$module/" 2>/dev/null || true
        
        # Copy metadata
        cp "$PACKAGES_DIR/aero-$module/composer.json" "$MODULE_ADDON_DIR/aero-$module/" 2>/dev/null || true
        cp "$PACKAGES_DIR/aero-$module/module.json" "$MODULE_ADDON_DIR/aero-$module/" 2>/dev/null || true
        
        # Package
        cd "$DIST_DIR"
        zip -r "Aero_${module^^}_Module_v${VERSION}.zip" "${module}-addon" \
            -x "*/node_modules/*" \
            -x "*/.git/*" \
            -x "*/vendor/*" 2>/dev/null || true
        
        if [ -f "Aero_${module^^}_Module_v${VERSION}.zip" ]; then
            MODULE_SIZE=$(du -h "Aero_${module^^}_Module_v${VERSION}.zip" | cut -f1)
            echo -e "${GREEN}✓ ${module^^} Add-on created: Aero_${module^^}_Module_v${VERSION}.zip ($MODULE_SIZE)${NC}"
        fi
    fi
done

###############################################################################
# VERIFICATION & SUMMARY
###############################################################################

echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  Build Verification                                        ${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""

# Verify installer structure
echo -e "${YELLOW}🔍 Verifying Installer Package...${NC}"
if [ -f "$DIST_DIR/Aero_HRM_Installer_v${VERSION}.zip" ]; then
    unzip -l "$DIST_DIR/Aero_HRM_Installer_v${VERSION}.zip" | grep -q "vendor/" && \
        echo -e "${GREEN}✓ Vendor folder present in installer${NC}" || \
        echo -e "${RED}✗ Vendor folder missing in installer${NC}"
    
    unzip -l "$DIST_DIR/Aero_HRM_Installer_v${VERSION}.zip" | grep -q "modules/aero-core" && \
        echo -e "${GREEN}✓ aero-core module present${NC}" || \
        echo -e "${RED}✗ aero-core module missing${NC}"
    
    unzip -l "$DIST_DIR/Aero_HRM_Installer_v${VERSION}.zip" | grep -q "public/build" && \
        echo -e "${GREEN}✓ Core assets in public/build${NC}" || \
        echo -e "${RED}✗ Core assets missing${NC}"
fi

# Verify CRM add-on structure
echo ""
echo -e "${YELLOW}🔍 Verifying CRM Add-on Package...${NC}"
if [ -f "$DIST_DIR/Aero_CRM_Module_v${VERSION}.zip" ]; then
    unzip -l "$DIST_DIR/Aero_CRM_Module_v${VERSION}.zip" | grep -q "vendor/" && \
        echo -e "${RED}✗ WARNING: Vendor folder should NOT be in add-on!${NC}" || \
        echo -e "${GREEN}✓ No vendor folder (correct)${NC}"
    
    unzip -l "$DIST_DIR/Aero_CRM_Module_v${VERSION}.zip" | grep -q "dist/.*\.js" && \
        echo -e "${GREEN}✓ Compiled JS present in dist/${NC}" || \
        echo -e "${RED}✗ Compiled JS missing${NC}"
    
    # Check for externalized React
    if [ -f "$PACKAGES_DIR/aero-crm/dist/aero-crm.umd.js" ]; then
        grep -q "from \"react\"" "$PACKAGES_DIR/aero-crm/dist/aero-crm.umd.js" && \
            echo -e "${GREEN}✓ React is externalized (import statement found)${NC}" || \
            echo -e "${YELLOW}⚠ Could not verify React externalization${NC}"
    fi
fi

# Summary
echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                    Build Complete!                         ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}📦 Generated Packages:${NC}"
echo ""

cd "$DIST_DIR"
for file in *.zip; do
    if [ -f "$file" ]; then
        SIZE=$(du -h "$file" | cut -f1)
        echo -e "  ${GREEN}▸${NC} $file ${YELLOW}($SIZE)${NC}"
    fi
done

echo ""
echo -e "${YELLOW}📍 Output directory: $DIST_DIR${NC}"
echo ""
echo -e "${BLUE}Next Steps:${NC}"
echo -e "  1. Test the installer by extracting and running setup"
echo -e "  2. Verify the add-on installs correctly on existing installation"
echo -e "  3. Check that module JS files use externalized React"
echo ""
echo -e "${GREEN}✨ Release build completed successfully!${NC}"
echo ""
