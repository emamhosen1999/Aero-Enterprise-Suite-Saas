#!/bin/bash

################################################################################
# Namespace Update Script
# 
# Updates PHP namespaces from monolithic structure to package structure
#
# Usage: ./update-namespaces.sh <module-name> <module-path> <directory>
# Example: ./update-namespaces.sh support Support ./src
################################################################################

set -e

MODULE_NAME=${1:-support}
MODULE_PATH=${2:-Support}
TARGET_DIR=${3:-.}

echo "Updating namespaces for module: $MODULE_NAME ($MODULE_PATH)"
echo "Target directory: $TARGET_DIR"

# Update namespace declarations
find "$TARGET_DIR" -type f -name "*.php" -exec sed -i \
    -e "s/namespace App\\\\Http\\\\Controllers\\\\Tenant\\\\${MODULE_PATH}/namespace Aero\\\\${MODULE_PATH}\\\\Http\\\\Controllers/g" \
    -e "s/namespace App\\\\Http\\\\Controllers\\\\Tenant/namespace Aero\\\\${MODULE_PATH}\\\\Http\\\\Controllers/g" \
    -e "s/namespace App\\\\Models/namespace Aero\\\\${MODULE_PATH}\\\\Models/g" \
    -e "s/namespace App\\\\Services\\\\Tenant\\\\${MODULE_PATH}/namespace Aero\\\\${MODULE_PATH}\\\\Services/g" \
    -e "s/namespace App\\\\Services\\\\Tenant/namespace Aero\\\\${MODULE_PATH}\\\\Services/g" \
    -e "s/namespace App\\\\Policies/namespace Aero\\\\${MODULE_PATH}\\\\Policies/g" \
    -e "s/namespace App\\\\Events/namespace Aero\\\\${MODULE_PATH}\\\\Events/g" \
    -e "s/namespace App\\\\Listeners/namespace Aero\\\\${MODULE_PATH}\\\\Listeners/g" \
    -e "s/namespace App\\\\Jobs/namespace Aero\\\\${MODULE_PATH}\\\\Jobs/g" \
    -e "s/namespace App\\\\Http\\\\Middleware/namespace Aero\\\\${MODULE_PATH}\\\\Http\\\\Middleware/g" \
    -e "s/namespace App\\\\Http\\\\Requests/namespace Aero\\\\${MODULE_PATH}\\\\Http\\\\Requests/g" \
    {} +

# Update use statements
find "$TARGET_DIR" -type f -name "*.php" -exec sed -i \
    -e "s/use App\\\\Http\\\\Controllers\\\\Tenant\\\\${MODULE_PATH}\\\\/use Aero\\\\${MODULE_PATH}\\\\Http\\\\Controllers\\\\/g" \
    -e "s/use App\\\\Models\\\\/use Aero\\\\${MODULE_PATH}\\\\Models\\\\/g" \
    -e "s/use App\\\\Services\\\\Tenant\\\\${MODULE_PATH}\\\\/use Aero\\\\${MODULE_PATH}\\\\Services\\\\/g" \
    -e "s/use App\\\\Policies\\\\/use Aero\\\\${MODULE_PATH}\\\\Policies\\\\/g" \
    -e "s/use App\\\\Events\\\\/use Aero\\\\${MODULE_PATH}\\\\Events\\\\/g" \
    -e "s/use App\\\\Listeners\\\\/use Aero\\\\${MODULE_PATH}\\\\Listeners\\\\/g" \
    -e "s/use App\\\\Jobs\\\\/use Aero\\\\${MODULE_PATH}\\\\Jobs\\\\/g" \
    -e "s/use App\\\\Http\\\\Middleware\\\\/use Aero\\\\${MODULE_PATH}\\\\Http\\\\Middleware\\\\/g" \
    -e "s/use App\\\\Http\\\\Requests\\\\/use Aero\\\\${MODULE_PATH}\\\\Http\\\\Requests\\\\/g" \
    {} +

# Special case: Keep certain use statements pointing to main app
# (like User model, base controllers, etc.)
find "$TARGET_DIR" -type f -name "*.php" -exec sed -i \
    -e "s/use Aero\\\\${MODULE_PATH}\\\\Models\\\\User/use App\\\\Models\\\\User/g" \
    -e "s/namespace Aero\\\\${MODULE_PATH}\\\\Http\\\\Controllers;/namespace Aero\\\\${MODULE_PATH}\\\\Http\\\\Controllers;\n\nuse App\\\\Http\\\\Controllers\\\\Controller;/g" \
    {} +

# Update Inertia render calls
find "$TARGET_DIR" -type f -name "*.php" -exec sed -i \
    -e "s/Inertia::render('Tenant\\/Pages\\/${MODULE_PATH}\\//Inertia::render('${MODULE_PATH}::/g" \
    {} +

echo "Namespace updates completed!"
echo ""
echo "Please review the changes manually to ensure:"
echo "1. All namespaces are correctly updated"
echo "2. Shared dependencies still point to App\\ namespace (User, base controllers, etc.)"
echo "3. Inertia::render() calls use the correct format"
