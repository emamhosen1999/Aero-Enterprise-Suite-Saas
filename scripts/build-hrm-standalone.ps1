# Aero HRM Standalone Product Builder
# Builds: Fat installer with Core + HRM only

param(
    [string]$Version = "1.0.0"
)

$ErrorActionPreference = "Stop"

# Colors
function Write-Success { Write-Host $args[0] -ForegroundColor Green }
function Write-Info { Write-Host $args[0] -ForegroundColor Cyan }
function Write-Warning { Write-Host $args[0] -ForegroundColor Yellow }

# Configuration
$RootDir = Split-Path -Parent $PSScriptRoot
$DistDir = Join-Path $RootDir "dist"
$PackagesDir = Join-Path $RootDir "packages"

Write-Info "╔════════════════════════════════════════════════════════════╗"
Write-Info "║         Aero HRM Standalone Product Builder               ║"
Write-Info "║                    Version: $Version                       ║"
Write-Info "╚════════════════════════════════════════════════════════════╝"
Write-Host ""

# Clean previous builds
Write-Warning "🧹 Cleaning previous builds..."
if (Test-Path $DistDir) {
    Remove-Item -Path $DistDir -Recurse -Force
}
New-Item -ItemType Directory -Path $DistDir | Out-Null

# Build Core
Write-Info "📦 Building aero-core..."
Set-Location (Join-Path $PackagesDir "aero-core")
if (-not (Test-Path "node_modules")) { npm install }
npm run build

# Build HRM
Write-Info "📦 Building aero-hrm..."
Set-Location (Join-Path $PackagesDir "aero-hrm")
if (-not (Test-Path "node_modules")) { npm install }
npm run build

# Create installer structure
Write-Info "🏗️  Creating HRM Standalone Installer..."
$InstallerDir = Join-Path $DistDir "hrm-standalone"
New-Item -ItemType Directory -Path "$InstallerDir\modules" | Out-Null
New-Item -ItemType Directory -Path "$InstallerDir\public\build" | Out-Null

# Copy modules
Write-Info "📋 Copying aero-core..."
Copy-Item -Path (Join-Path $PackagesDir "aero-core") -Destination "$InstallerDir\modules\" -Recurse
Copy-Item -Path (Join-Path $PackagesDir "aero-core\public\build\*") -Destination "$InstallerDir\public\build\" -Recurse -ErrorAction SilentlyContinue

Write-Info "📋 Copying aero-hrm..."
Copy-Item -Path (Join-Path $PackagesDir "aero-hrm") -Destination "$InstallerDir\modules\" -Recurse

# Copy standalone-host
Write-Info "📋 Copying Laravel application..."
$HostDir = Join-Path $RootDir "apps\standalone-host"
$ExcludeDirs = @('node_modules', 'vendor', '.git', 'storage\logs', 'storage\framework\cache', 'storage\framework\sessions', 'storage\framework\views')
Get-ChildItem -Path $HostDir | Where-Object { 
    $_.Name -notin $ExcludeDirs -and $_.Name -ne '.env' -and $_.Name -ne 'public'
} | Copy-Item -Destination $InstallerDir -Recurse -Force

# Copy public folder excluding build
Copy-Item -Path (Join-Path $HostDir "public") -Destination $InstallerDir -Recurse -Exclude "build" -Force

# Create composer.json for HRM Standalone
Write-Info "📝 Creating installer composer.json..."
$ComposerJson = @"
{
    "name": "aero/hrm-standalone",
    "type": "project",
    "description": "Aero HRM Standalone - Complete Human Resource Management System",
    "keywords": ["aero", "hrm", "hr", "human-resources", "laravel"],
    "license": "proprietary",
    "repositories": [
        {
            "type": "path",
            "url": "./modules/*",
            "options": { "symlink": false }
        }
    ],
    "require": {
        "php": "^8.2",
        "laravel/framework": "^11.0|^12.0",
        "laravel/tinker": "^2.10",
        "aero/core": "*",
        "aero/hrm": "*"
    },
    "require-dev": {
        "fakerphp/faker": "^1.23",
        "laravel/pint": "^1.24",
        "phpunit/phpunit": "^11.0"
    },
    "autoload": {
        "psr-4": {
            "App\\": "app/",
            "Database\\Factories\\": "database/factories/",
            "Database\\Seeders\\": "database/seeders/"
        }
    },
    "scripts": {
        "post-autoload-dump": [
            "Illuminate\\Foundation\\ComposerScripts::postAutoloadDump",
            "@php artisan package:discover --ansi"
        ],
        "post-root-package-install": [
            "@php -r \"file_exists('.env') || copy('.env.example', '.env');\""
        ],
        "post-create-project-cmd": [
            "@php artisan key:generate --ansi"
        ]
    },
    "config": {
        "optimize-autoloader": true,
        "preferred-install": "dist",
        "sort-packages": true
    },
    "minimum-stability": "stable"
}
"@
Set-Content -Path "$InstallerDir\composer.json" -Value $ComposerJson

# Install dependencies
Write-Info "⚙️  Installing composer dependencies..."
Set-Location $InstallerDir
composer install --no-dev --optimize-autoloader --ignore-platform-reqs

# Create storage structure
Write-Info "📁 Creating storage structure..."
New-Item -ItemType Directory -Path "storage\framework\cache" -Force | Out-Null
New-Item -ItemType Directory -Path "storage\framework\sessions" -Force | Out-Null
New-Item -ItemType Directory -Path "storage\framework\views" -Force | Out-Null
New-Item -ItemType Directory -Path "storage\logs" -Force | Out-Null

# Create README
$Readme = @"
# Aero HRM Standalone v$Version

Complete Human Resource Management System

## Features Included
- ✅ Employee Management
- ✅ Attendance & Time Tracking
- ✅ Leave Management
- ✅ Payroll Processing
- ✅ Performance Reviews
- ✅ Recruitment & Onboarding
- ✅ Training Management
- ✅ HR Analytics

## Installation
1. Extract to web server directory
2. Point web server to \`public\` folder
3. Copy \`.env.example\` to \`.env\`
4. Configure database in \`.env\`
5. Run: \`php artisan key:generate\`
6. Run: \`php artisan migrate --seed\`
7. Run: \`php artisan storage:link\`

## Requirements
- PHP >= 8.2
- MySQL >= 8.0 or PostgreSQL >= 13
- Web server (Apache/Nginx)

## Available Add-ons
Extend your HRM with these optional modules:
- 📊 CRM Module - Customer Relationship Management
- 💰 Finance Module - Billing & Invoicing
- 📋 Project Module - Project Management
- 📦 Inventory Module - Stock Management

## Support
Email: support@aerosuite.com
Docs: https://docs.aerosuite.com
"@
Set-Content -Path "$InstallerDir\README.md" -Value $Readme

# Create .env.example
$EnvExample = @"
APP_NAME="Aero HRM"
APP_ENV=production
APP_KEY=
APP_DEBUG=false
APP_URL=http://localhost

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=aero_hrm
DB_USERNAME=root
DB_PASSWORD=

CACHE_STORE=file
SESSION_DRIVER=file
QUEUE_CONNECTION=sync
"@
Set-Content -Path "$InstallerDir\.env.example" -Value $EnvExample

# Create ZIP
Write-Info "📦 Creating ZIP archive..."
Set-Location $DistDir
$ZipFile = "Aero_HRM_Standalone_v$Version.zip"
Compress-Archive -Path "hrm-standalone\*" -DestinationPath $ZipFile -Force

$Size = (Get-Item $ZipFile).Length / 1MB
Write-Success "✓ HRM Standalone created: $ZipFile ($([math]::Round($Size, 2)) MB)"

Write-Host ""
Write-Success "╔════════════════════════════════════════════════════════════╗"
Write-Success "║              HRM Standalone Build Complete!                ║"
Write-Success "╚════════════════════════════════════════════════════════════╝"
Write-Host ""
Write-Info "📍 Output: $DistDir\$ZipFile"
Write-Info "💡 This is a STANDALONE PRODUCT with Core + HRM included"
Write-Host ""
