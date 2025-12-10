#!/bin/bash

################################################################################
# Module Extraction Script
# 
# This script automates the extraction of a module from the monolithic
# Aero Enterprise Suite SaaS application into a separate package repository.
#
# Usage: ./extract-module.sh <module-name> <module-path>
# Example: ./extract-module.sh support Support
################################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MAIN_REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
MODULES_OUTPUT_DIR="${MODULES_OUTPUT_DIR:-$(cd "$MAIN_REPO_ROOT/.." && pwd)/extracted-modules}"

################################################################################
# Helper Functions
################################################################################

print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_step() {
    echo ""
    echo -e "${GREEN}==>${NC} $1"
    echo "----------------------------------------"
}

check_requirements() {
    print_step "Checking requirements"
    
    # Check if git is installed
    if ! command -v git &> /dev/null; then
        print_error "git is not installed"
        exit 1
    fi
    
    # Check if composer is installed
    if ! command -v composer &> /dev/null; then
        print_error "composer is not installed"
        exit 1
    fi
    
    # Check if we're in the main repository
    if [ ! -f "$MAIN_REPO_ROOT/composer.json" ]; then
        print_error "Not in Aero Enterprise Suite repository"
        exit 1
    fi
    
    print_info "All requirements satisfied"
}

################################################################################
# Main Extraction Logic
################################################################################

extract_module() {
    local MODULE_NAME=$1
    local MODULE_PATH=${2:-$(echo "$MODULE_NAME" | sed 's/\b\(.\)/\u\1/g')} # Capitalize first letter
    
    print_step "Starting extraction of module: $MODULE_NAME"
    
    # Create module repository directory
    local MODULE_REPO_DIR="$MODULES_OUTPUT_DIR/aero-${MODULE_NAME}-module"
    
    if [ -d "$MODULE_REPO_DIR" ]; then
        print_warning "Module directory already exists: $MODULE_REPO_DIR"
        read -p "Do you want to overwrite it? (y/N) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            print_info "Extraction cancelled"
            exit 0
        fi
        rm -rf "$MODULE_REPO_DIR"
    fi
    
    # Create directory structure
    print_step "Creating directory structure"
    mkdir -p "$MODULE_REPO_DIR"
    cd "$MODULE_REPO_DIR"
    
    mkdir -p src/{Http/{Controllers,Middleware,Requests},Models,Services,Policies,Events,Listeners,Jobs,Providers,routes}
    mkdir -p resources/{js/{Pages,Components,Tables,Forms},views}
    mkdir -p database/{migrations,seeders,factories}
    mkdir -p tests/{Feature,Unit}
    mkdir -p config
    mkdir -p public/assets
    
    print_info "Directory structure created"
    
    # Initialize git
    print_step "Initializing git repository"
    git init
    git branch -M main
    
    # Create .gitignore
    cat > .gitignore << 'EOF'
/vendor/
/node_modules/
.env
.env.testing
.phpunit.result.cache
composer.lock
package-lock.json
/.idea/
/.vscode/
*.swp
*.swo
*~
.DS_Store
EOF
    
    # Copy files from main repository
    print_step "Copying files from main repository"
    
    # Backend files
    if [ -d "$MAIN_REPO_ROOT/app/Http/Controllers/Tenant/$MODULE_PATH" ]; then
        print_info "Copying controllers"
        cp -r "$MAIN_REPO_ROOT/app/Http/Controllers/Tenant/$MODULE_PATH/"* src/Http/Controllers/ 2>/dev/null || true
    fi
    
    # Services
    if [ -d "$MAIN_REPO_ROOT/app/Services/Tenant/$MODULE_PATH" ]; then
        print_info "Copying services"
        cp -r "$MAIN_REPO_ROOT/app/Services/Tenant/$MODULE_PATH/"* src/Services/ 2>/dev/null || true
    fi
    
    # Models (search for module-specific models)
    print_info "Searching for related models"
    find "$MAIN_REPO_ROOT/app/Models" -type f -name "*${MODULE_PATH}*.php" -exec cp {} src/Models/ \; 2>/dev/null || true
    
    # Policies
    find "$MAIN_REPO_ROOT/app/Policies" -type f -name "*${MODULE_PATH}*.php" -exec cp {} src/Policies/ \; 2>/dev/null || true
    
    # Routes
    if [ -f "$MAIN_REPO_ROOT/routes/${MODULE_NAME}.php" ]; then
        print_info "Copying routes"
        cp "$MAIN_REPO_ROOT/routes/${MODULE_NAME}.php" src/routes/web.php
    fi
    
    # Frontend files
    if [ -d "$MAIN_REPO_ROOT/resources/js/Tenant/Pages/$MODULE_PATH" ]; then
        print_info "Copying frontend pages"
        cp -r "$MAIN_REPO_ROOT/resources/js/Tenant/Pages/$MODULE_PATH" resources/js/Pages/
    fi
    
    # Migrations
    print_info "Copying migrations"
    find "$MAIN_REPO_ROOT/database/migrations/tenant" -type f -name "*${MODULE_NAME}*" -exec cp {} database/migrations/ \; 2>/dev/null || true
    
    # Create composer.json
    print_step "Creating composer.json"
    cat > composer.json << EOF
{
    "name": "aero/${MODULE_NAME}-module",
    "description": "${MODULE_PATH} Module for Aero Enterprise Suite",
    "type": "library",
    "license": "proprietary",
    "authors": [
        {
            "name": "Aero Development Team",
            "email": "dev@aero-erp.com"
        }
    ],
    "require": {
        "php": "^8.2",
        "laravel/framework": "^11.0",
        "inertiajs/inertia-laravel": "2.x-dev",
        "stancl/tenancy": "^3.9",
        "spatie/laravel-permission": "^6.20"
    },
    "require-dev": {
        "phpunit/phpunit": "^11.0",
        "orchestra/testbench": "^9.0",
        "mockery/mockery": "^1.6"
    },
    "autoload": {
        "psr-4": {
            "Aero\\\\${MODULE_PATH}\\\\": "src/"
        }
    },
    "autoload-dev": {
        "psr-4": {
            "Aero\\\\${MODULE_PATH}\\\\Tests\\\\": "tests/"
        }
    },
    "extra": {
        "laravel": {
            "providers": [
                "Aero\\\\${MODULE_PATH}\\\\Providers\\\\${MODULE_PATH}ServiceProvider"
            ]
        },
        "aero": {
            "module-code": "${MODULE_NAME}",
            "platform-compatibility": "^2.0"
        }
    },
    "minimum-stability": "dev",
    "prefer-stable": true
}
EOF
    
    # Create package.json
    print_step "Creating package.json"
    cat > package.json << EOF
{
    "name": "@aero/${MODULE_NAME}-module",
    "version": "1.0.0",
    "description": "${MODULE_PATH} module frontend assets",
    "scripts": {
        "dev": "vite",
        "build": "vite build"
    },
    "dependencies": {
        "@heroicons/react": "^2.2.0",
        "@heroui/react": "^2.8.2",
        "@inertiajs/react": "^1.0.0",
        "react": "^18.2.0",
        "react-dom": "^18.2.0"
    },
    "devDependencies": {
        "@vitejs/plugin-react": "^4.2.0",
        "vite": "^5.0.0"
    }
}
EOF
    
    # Update namespaces
    print_step "Updating namespaces"
    ./update_namespaces.sh "$MODULE_NAME" "$MODULE_PATH" 2>/dev/null || print_warning "Namespace update script not found, skipping..."
    
    # Create service provider
    print_step "Creating service provider"
    create_service_provider "$MODULE_NAME" "$MODULE_PATH"
    
    # Create README
    print_step "Creating README.md"
    cat > README.md << EOF
# Aero ${MODULE_PATH} Module

${MODULE_PATH} module for Aero Enterprise Suite SaaS platform.

## Installation

\`\`\`bash
composer require aero/${MODULE_NAME}-module
\`\`\`

## Configuration

Publish configuration:

\`\`\`bash
php artisan vendor:publish --tag=${MODULE_NAME}-config
\`\`\`

Publish assets:

\`\`\`bash
php artisan vendor:publish --tag=${MODULE_NAME}-assets
\`\`\`

Run migrations:

\`\`\`bash
php artisan migrate
\`\`\`

## Usage

Documentation coming soon.

## Testing

\`\`\`bash
composer test
\`\`\`

## License

Proprietary
EOF
    
    # Create CHANGELOG
    print_step "Creating CHANGELOG.md"
    cat > CHANGELOG.md << EOF
# Changelog

All notable changes to this project will be documented in this file.

## [1.0.0] - $(date +%Y-%m-%d)

### Added
- Initial release
- Extracted from monolithic Aero Enterprise Suite
EOF
    
    # Initial commit
    print_step "Creating initial commit"
    git add .
    git commit -m "Initial commit: Extract ${MODULE_PATH} module from monolithic app"
    
    print_step "Module extraction completed!"
    print_info "Module repository created at: $MODULE_REPO_DIR"
    print_info ""
    print_info "Next steps:"
    print_info "1. Review the extracted files"
    print_info "2. Update namespaces if needed"
    print_info "3. Create remote repository"
    print_info "4. Push to remote: git remote add origin <url> && git push -u origin main"
    print_info "5. Install in main platform: composer require aero/${MODULE_NAME}-module"
}

create_service_provider() {
    local MODULE_NAME=$1
    local MODULE_PATH=$2
    local PROVIDER_FILE="src/Providers/${MODULE_PATH}ServiceProvider.php"
    
    cat > "$PROVIDER_FILE" << 'EOFPHP'
<?php

namespace Aero\MODULE_PATH\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Route;

class MODULE_PATHServiceProvider extends ServiceProvider
{
    /**
     * Register services.
     */
    public function register(): void
    {
        // Merge configuration
        $this->mergeConfigFrom(
            __DIR__.'/../../config/MODULE_NAME.php', 'MODULE_NAME'
        );
    }

    /**
     * Bootstrap services.
     */
    public function boot(): void
    {
        // Load migrations
        $this->loadMigrationsFrom(__DIR__.'/../../database/migrations');

        // Register routes
        $this->registerRoutes();

        // Register views
        $this->loadViewsFrom(__DIR__.'/../../resources/views', 'MODULE_NAME');

        // Publish configuration
        $this->publishes([
            __DIR__.'/../../config/MODULE_NAME.php' => config_path('MODULE_NAME.php'),
        ], 'MODULE_NAME-config');

        // Publish frontend assets
        $this->publishes([
            __DIR__.'/../../resources/js' => resource_path('js/Modules/MODULE_PATH'),
        ], 'MODULE_NAME-assets');
    }

    /**
     * Register routes.
     */
    protected function registerRoutes(): void
    {
        Route::middleware(['web', 'auth', 'tenant.setup'])
            ->prefix('MODULE_NAME')
            ->name('MODULE_NAME.')
            ->group(__DIR__.'/../../src/routes/web.php');
    }
}
EOFPHP
    
    # Replace placeholders
    sed -i "s/MODULE_PATH/$MODULE_PATH/g" "$PROVIDER_FILE"
    sed -i "s/MODULE_NAME/$MODULE_NAME/g" "$PROVIDER_FILE"
    
    print_info "Service provider created"
}

################################################################################
# Script Entry Point
################################################################################

main() {
    if [ $# -lt 1 ]; then
        echo "Usage: $0 <module-name> [module-path]"
        echo "Example: $0 support Support"
        echo "Example: $0 hrm HRM"
        exit 1
    fi
    
    check_requirements
    extract_module "$1" "$2"
}

# Run main function
main "$@"
