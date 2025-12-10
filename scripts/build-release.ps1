# PowerShell Script to Build Aero Release Packages
# 
# This script builds production-ready distribution packages:
# 1. Aero HRM Installer (Fat Package - with vendor)
# 2. Aero Module Add-ons (Lightweight - no vendor)
#
# Usage:
#   .\build-release.ps1 [-Version "1.0.0"]

param(
    [Parameter(Mandatory=$false)]
    [string]$Version = "1.0.0"
)

# Colors
$Green = "Green"
$Yellow = "Yellow"
$Red = "Red"
$Blue = "Cyan"

# Configuration
$RootDir = Split-Path -Parent (Split-Path -Parent $PSCommandPath)
$DistDir = Join-Path $RootDir "dist"
$PackagesDir = Join-Path $RootDir "packages"

Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor $Green
Write-Host "║         Aero Enterprise Suite - Release Builder           ║" -ForegroundColor $Green
Write-Host "║                    Version: $Version                        ║" -ForegroundColor $Green
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor $Green
Write-Host ""

# Clean previous builds
Write-Host "🧹 Cleaning previous builds..." -ForegroundColor $Yellow
if (Test-Path $DistDir) {
    Remove-Item -Path $DistDir -Recurse -Force
}
New-Item -ItemType Directory -Path $DistDir -Force | Out-Null

###############################################################################
# STEP 1: Compile Frontend Assets
###############################################################################

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor $Blue
Write-Host "  STEP 1: Compiling Frontend Assets                        " -ForegroundColor $Blue
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor $Blue
Write-Host ""

# Build Core
Write-Host "📦 Building aero-core (Host Mode)..." -ForegroundColor $Yellow
Push-Location (Join-Path $PackagesDir "aero-core")
if (-not (Test-Path "node_modules")) {
    npm install
}
npm run build
Write-Host "✓ Core assets compiled to public/build/" -ForegroundColor $Green
Pop-Location

# Build HRM
Write-Host "📦 Building aero-hrm (Library Mode)..." -ForegroundColor $Yellow
Push-Location (Join-Path $PackagesDir "aero-hrm")
if (-not (Test-Path "node_modules")) {
    npm install
}
npm run build
Write-Host "✓ HRM module compiled to dist/" -ForegroundColor $Green
Pop-Location

# Build CRM
Write-Host "📦 Building aero-crm (Library Mode)..." -ForegroundColor $Yellow
Push-Location (Join-Path $PackagesDir "aero-crm")
if (-not (Test-Path "node_modules")) {
    npm install
}
npm run build
Write-Host "✓ CRM module compiled to dist/" -ForegroundColor $Green
Pop-Location

# Build other modules
$otherModules = @("finance", "project", "pos", "scm", "ims", "compliance", "dms", "quality")
foreach ($module in $otherModules) {
    $modulePath = Join-Path $PackagesDir "aero-$module"
    if (Test-Path $modulePath) {
        $packageJson = Join-Path $modulePath "package.json"
        if (Test-Path $packageJson) {
            Write-Host "📦 Building aero-$module (Library Mode)..." -ForegroundColor $Yellow
            Push-Location $modulePath
            if (-not (Test-Path "node_modules")) {
                npm install
            }
            npm run build 2>$null
            Write-Host "✓ aero-$module compiled" -ForegroundColor $Green
            Pop-Location
        }
    }
}

###############################################################################
# STEP 2: Build Standalone Installer (Fat Package)
###############################################################################

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor $Blue
Write-Host "  STEP 2: Building Standalone Installer (Fat Package)      " -ForegroundColor $Blue
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor $Blue
Write-Host ""

Write-Host "🏗️  Creating Aero HRM Installer structure..." -ForegroundColor $Yellow

$InstallerDir = Join-Path $DistDir "installer"
New-Item -ItemType Directory -Path (Join-Path $InstallerDir "modules") -Force | Out-Null
New-Item -ItemType Directory -Path (Join-Path $InstallerDir "public\build") -Force | Out-Null

# Copy packages
Write-Host "📋 Copying aero-core..." -ForegroundColor $Yellow
Copy-Item -Path (Join-Path $PackagesDir "aero-core") -Destination (Join-Path $InstallerDir "modules\aero-core") -Recurse -Force

# Copy Core assets to public/build
$corePublicBuild = Join-Path $PackagesDir "aero-core\public\build"
if (Test-Path $corePublicBuild) {
    Copy-Item -Path "$corePublicBuild\*" -Destination (Join-Path $InstallerDir "public\build") -Recurse -Force
}

Write-Host "📋 Copying aero-hrm..." -ForegroundColor $Yellow
Copy-Item -Path (Join-Path $PackagesDir "aero-hrm") -Destination (Join-Path $InstallerDir "modules\aero-hrm") -Recurse -Force

Write-Host "📋 Copying aero-platform..." -ForegroundColor $Yellow
Copy-Item -Path (Join-Path $PackagesDir "aero-platform") -Destination (Join-Path $InstallerDir "modules\aero-platform") -Recurse -Force

# Copy standalone-host
Write-Host "📋 Copying Laravel application structure..." -ForegroundColor $Yellow
$standaloneHost = Join-Path $RootDir "apps\standalone-host"
$excludeDirs = @("node_modules", "vendor", ".env")

Get-ChildItem -Path $standaloneHost -Force | Where-Object {
    $_.Name -notin $excludeDirs
} | ForEach-Object {
    Copy-Item -Path $_.FullName -Destination $InstallerDir -Recurse -Force
}

# Create installer composer.json
Write-Host "📝 Creating installer composer.json..." -ForegroundColor $Yellow
$composerJson = @"
{
    "`$schema": "https://getcomposer.org/schema.json",
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
    "config": {
        "optimize-autoloader": true,
        "preferred-install": "dist",
        "sort-packages": true
    },
    "minimum-stability": "stable",
    "prefer-stable": true
}
"@

Set-Content -Path (Join-Path $InstallerDir "composer.json") -Value $composerJson

# Install composer dependencies
Write-Host "⚙️  Installing composer dependencies (this may take a while)..." -ForegroundColor $Yellow
Push-Location $InstallerDir
composer install --no-dev --optimize-autoloader --ignore-platform-reqs
Pop-Location

# Create storage structure
Write-Host "📁 Creating storage structure..." -ForegroundColor $Yellow
$storagePaths = @(
    "storage\framework\cache",
    "storage\framework\sessions",
    "storage\framework\views",
    "storage\logs"
)
foreach ($path in $storagePaths) {
    New-Item -ItemType Directory -Path (Join-Path $InstallerDir $path) -Force | Out-Null
}

# Create README
$readmeContent = @"
# Aero HRM Standalone Installer v$Version

## Installation Instructions

1. Extract this archive to your web server directory
2. Configure your web server to point to the ``public`` folder
3. Copy ``.env.example`` to ``.env`` and configure your database
4. Run the following commands:

``````bash
php artisan key:generate
php artisan migrate --seed
php artisan storage:link
``````

## System Requirements

- PHP >= 8.2
- MySQL >= 8.0 or PostgreSQL >= 13
- Composer (already installed in vendor/)

## Support

Email: support@aerosuite.com
"@

Set-Content -Path (Join-Path $InstallerDir "README.md") -Value $readmeContent

# Create ZIP
Write-Host "📦 Creating ZIP archive..." -ForegroundColor $Yellow
$zipPath = Join-Path $DistDir "Aero_HRM_Installer_v$Version.zip"
Compress-Archive -Path $InstallerDir -DestinationPath $zipPath -Force

$installerSize = (Get-Item $zipPath).Length / 1MB
Write-Host "✓ Installer created: Aero_HRM_Installer_v$Version.zip ($([math]::Round($installerSize, 2)) MB)" -ForegroundColor $Green

###############################################################################
# STEP 3: Build Add-on Modules
###############################################################################

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor $Blue
Write-Host "  STEP 3: Building Module Add-ons (Lightweight Packages)   " -ForegroundColor $Blue
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor $Blue
Write-Host ""

# Build CRM Add-on
Write-Host "🔌 Building Aero CRM Add-on..." -ForegroundColor $Yellow
$CrmAddonDir = Join-Path $DistDir "crm-addon\aero-crm"
New-Item -ItemType Directory -Path $CrmAddonDir -Force | Out-Null

$crmSource = Join-Path $PackagesDir "aero-crm"
$copyItems = @("src", "resources", "config", "database", "routes", "dist")

foreach ($item in $copyItems) {
    $sourcePath = Join-Path $crmSource $item
    if (Test-Path $sourcePath) {
        Copy-Item -Path $sourcePath -Destination (Join-Path $CrmAddonDir $item) -Recurse -Force
    }
}

# Copy metadata
Copy-Item -Path (Join-Path $crmSource "composer.json") -Destination $CrmAddonDir -Force -ErrorAction SilentlyContinue
Copy-Item -Path (Join-Path $crmSource "module.json") -Destination $CrmAddonDir -Force -ErrorAction SilentlyContinue
Copy-Item -Path (Join-Path $crmSource "README.md") -Destination $CrmAddonDir -Force -ErrorAction SilentlyContinue

# Create installation instructions
$installContent = @"
# Aero CRM Module Installation v$Version

## Installation Instructions

1. Extract this archive to your Aero application root directory
2. Run: ``php artisan module:register aero-crm``
3. Run: ``php artisan migrate``
4. Clear caches: ``php artisan config:clear``

## Requirements

- Existing Aero HRM installation
- aero/core >= 1.0.0
- PHP >= 8.2
"@

Set-Content -Path (Join-Path (Split-Path $CrmAddonDir) "INSTALL.md") -Value $installContent

# Package CRM
$crmZipPath = Join-Path $DistDir "Aero_CRM_Module_v$Version.zip"
Compress-Archive -Path (Join-Path $DistDir "crm-addon") -DestinationPath $crmZipPath -Force

$crmSize = (Get-Item $crmZipPath).Length / 1KB
Write-Host "✓ CRM Add-on created: Aero_CRM_Module_v$Version.zip ($([math]::Round($crmSize, 2)) KB)" -ForegroundColor $Green

###############################################################################
# Summary
###############################################################################

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor $Green
Write-Host "║                    Build Complete!                         ║" -ForegroundColor $Green
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor $Green
Write-Host ""
Write-Host "📦 Generated Packages:" -ForegroundColor $Blue
Write-Host ""

Get-ChildItem -Path $DistDir -Filter "*.zip" | ForEach-Object {
    $size = $_.Length / 1MB
    Write-Host "  ▸ $($_.Name) ($([math]::Round($size, 2)) MB)" -ForegroundColor $Green
}

Write-Host ""
Write-Host "📍 Output directory: $DistDir" -ForegroundColor $Yellow
Write-Host ""
Write-Host "✨ Release build completed successfully!" -ForegroundColor $Green
Write-Host ""
