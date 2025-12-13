#!/bin/bash

# Configuration
VERSION="1.0.0"
DIST_DIR="../dist"
BUILD_DIR="$DIST_DIR/temp_saas_build"
SAAS_HOST_DIR="../apps/saas-host"

# Ensure we are in the scripts directory
cd "$(dirname "$0")"

echo "🚀 Starting AERO SAAS Build Process v$VERSION..."

# ==============================================
# STEP 1: COMPILE FRONTEND (The Context Split)
# ==============================================
echo "🎨 [1/5] Compiling Frontend Assets..."

# 1. Build the Platform (Admin/Public UI)
# This builds the "Control Plane" assets
echo "   - Building Control Plane (Platform)..."
cd ../packages/aero-platform
npm install --silent
npm run build
# Output: packages/aero-platform/dist/platform.js (or public/build if integrated)

# 2. Build the Core (Tenant Host)
echo "   - Building Data Plane (Core)..."
cd ../packages/aero-core
npm install --silent
npm run build

# 3. Build Modules (Tenant Guests)
# In SaaS, we pre-compile these so tenants get them instantly
for module in aero-hrm aero-crm; do
    if [ -d "../packages/$module" ]; then
        echo "   - Building Module: $module..."
        cd ../packages/$module
        npm install --silent
        npm run build
    else
        echo "   - Module $module not found, skipping..."
    fi
done

cd ../scripts

# ==============================================
# STEP 2: PREPARE THE HOST APPLICATION
# ==============================================
echo "cV [2/5] Staging SaaS Host Application..."

# Cleanup
rm -rf $BUILD_DIR
mkdir -p $BUILD_DIR

# Copy the SaaS Host Skeleton (your simulator app)
# We exclude node_modules and tests to keep it clean
rsync -av --progress $SAAS_HOST_DIR/ $BUILD_DIR --exclude node_modules --exclude tests --exclude .git --exclude storage/*.key

# ==============================================
# STEP 3: INJECT PACKAGES
# ==============================================
echo "📦 [3/5] Injecting Aero Packages..."

mkdir -p $BUILD_DIR/modules

# Copy All Packages
cp -r ../packages/aero-core $BUILD_DIR/modules/
cp -r ../packages/aero-platform $BUILD_DIR/modules/
cp -r ../packages/aero-hrm $BUILD_DIR/modules/
# cp -r ../packages/aero-crm $BUILD_DIR/modules/ (Add others as needed)

# Clean up git/node_modules inside packages to save space
find $BUILD_DIR/modules -name ".git" -type d -exec rm -rf {} +
find $BUILD_DIR/modules -name "node_modules" -type d -exec rm -rf {} +

# ==============================================
# STEP 4: CONFIGURE COMPOSER FOR PRODUCTION
# ==============================================
echo "📝 [4/5] Configuring Composer..."

# We generate a production composer.json that forces local loading
# This ensures the SaaS app doesn't try to look for packages on Packagist
cat > $BUILD_DIR/composer.json <<EOF
{
    "name": "aero/saas-installer",
    "type": "project",
    "require": {
        "php": "^8.2",
        "laravel/framework": "^11.0",
        "stancl/tenancy": "^3.8",
        "aero/core": "*",
        "aero/platform": "*",
        "aero/hrm": "*"
    },
    "repositories": [
        {
            "type": "path",
            "url": "./modules/*"
        }
    ],
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

# Install Dependencies (The "Fat Vendor" Build)
echo "   - Installing Vendor Dependencies..."
cd $BUILD_DIR
composer install --no-dev --ignore-platform-reqs --quiet
cd ../../scripts

# ==============================================
# STEP 5: ASSET AGGREGATION & ZIPPING
# ==============================================
echo "🤐 [5/5] Finalizing SaaS Package..."

# Copy Compiled Assets from Packages to Public
# In SaaS, we want all assets ready in public/
# 1. Core Assets
cp -r ../packages/aero-core/public/build $BUILD_DIR/public/
# 2. Platform Assets (Ensure vite.config.js in platform outputs to a unique folder or handles this)
mkdir -p $BUILD_DIR/public/modules/aero-platform
cp -r ../packages/aero-platform/dist/* $BUILD_DIR/public/modules/aero-platform/
# 3. HRM Assets
mkdir -p $BUILD_DIR/public/modules/aero-hrm
cp -r ../packages/aero-hrm/dist/* $BUILD_DIR/public/modules/aero-hrm/

# ZIP
cd $DIST_DIR
zip -r -q "Aero_SaaS_Installer_v$VERSION.zip" temp_saas_build

echo "✅ SAAS BUILD COMPLETE: dist/Aero_SaaS_Installer_v$VERSION.zip"
