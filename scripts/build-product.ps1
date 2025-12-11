# Universal Aero Product Builder
# Builds any product configuration as a fat installer

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet('hrm-standalone', 'crm-standalone', 'hrm-crm-bundle', 'erp-suite', 'custom')]
    [string]$Product,
    
    [string]$Version = "1.0.0",
    
    [string[]]$CustomModules = @()  # For custom builds: @('hrm', 'crm', 'finance')
)

$ErrorActionPreference = "Stop"

# Colors
function Write-Success { Write-Host $args[0] -ForegroundColor Green }
function Write-Info { Write-Host $args[0] -ForegroundColor Cyan }
function Write-Warning { Write-Host $args[0] -ForegroundColor Yellow }
function Write-Error { Write-Host $args[0] -ForegroundColor Red }

# Configuration
$RootDir = Split-Path -Parent $PSScriptRoot
$DistDir = Join-Path $RootDir "dist"
$PackagesDir = Join-Path $RootDir "packages"
$AppsDir = Join-Path $RootDir "apps"

# Product Configurations
$ProductConfigs = @{
    'hrm-standalone' = @{
        Name = 'Aero HRM Standalone'
        Description = 'Complete Human Resource Management System'
        AppFolder = 'hrm-standalone'
        Modules = @('core', 'hrm')
        OutputName = 'Aero_HRM_Standalone'
    }
    'crm-standalone' = @{
        Name = 'Aero CRM Standalone'
        Description = 'Complete Customer Relationship Management System'
        AppFolder = 'crm-standalone'
        Modules = @('core', 'crm')
        OutputName = 'Aero_CRM_Standalone'
    }
    'hrm-crm-bundle' = @{
        Name = 'Aero HRM+CRM Bundle'
        Description = 'Complete HR and Customer Management Solution'
        AppFolder = 'hrm-crm-bundle'
        Modules = @('core', 'hrm', 'crm')
        OutputName = 'Aero_HRM_CRM_Bundle'
    }
    'erp-suite' = @{
        Name = 'Aero ERP Suite'
        Description = 'Complete Enterprise Resource Planning System'
        AppFolder = 'erp-suite'
        Modules = @('core', 'hrm', 'crm', 'finance', 'project', 'scm', 'ims', 'pos', 'dms', 'quality', 'compliance')
        OutputName = 'Aero_ERP_Suite'
    }
}

# Get product config
if ($Product -eq 'custom') {
    if ($CustomModules.Count -eq 0) {
        Write-Error "❌ Custom build requires -CustomModules parameter"
        Write-Info "Example: .\build-product.ps1 -Product custom -CustomModules @('hrm','crm','finance')"
        exit 1
    }
    $Config = @{
        Name = "Aero Custom Build"
        Description = "Custom module configuration"
        AppFolder = "standalone-host"
        Modules = @('core') + $CustomModules
        OutputName = "Aero_Custom_Build"
    }
} else {
    $Config = $ProductConfigs[$Product]
}

Write-Info "╔════════════════════════════════════════════════════════════╗"
Write-Info "║         Aero Product Builder - $($Config.Name)"
Write-Info "║                    Version: $Version"
Write-Info "╚════════════════════════════════════════════════════════════╝"
Write-Host ""
Write-Info "📦 Product: $($Config.Name)"
Write-Info "📝 Description: $($Config.Description)"
Write-Info "🧩 Modules: $($Config.Modules -join ', ')"
Write-Host ""

# Clean previous builds
Write-Warning "🧹 Cleaning previous builds..."
if (Test-Path $DistDir) {
    Remove-Item -Path (Join-Path $DistDir $Product) -Recurse -Force -ErrorAction SilentlyContinue
}
New-Item -ItemType Directory -Path (Join-Path $DistDir $Product) -Force | Out-Null

# Step 1: Build Frontend Assets
Write-Info ""
Write-Info "═══════════════════════════════════════════════════════════"
Write-Info "  STEP 1: Building Frontend Assets"
Write-Info "═══════════════════════════════════════════════════════════"
Write-Host ""

foreach ($module in $Config.Modules) {
    $ModulePath = Join-Path $PackagesDir "aero-$module"
    if (Test-Path $ModulePath) {
        Write-Info "📦 Building aero-$module..."
        Set-Location $ModulePath
        
        if (Test-Path "package.json") {
            if (-not (Test-Path "node_modules")) {
                npm install --silent
            }
            npm run build --silent
            Write-Success "  ✓ aero-$module built successfully"
        } else {
            Write-Warning "  ⚠ No package.json for aero-$module"
        }
    } else {
        Write-Warning "  ⚠ Module aero-$module not found"
    }
}

# Step 2: Create Installer Structure
Write-Info ""
Write-Info "═══════════════════════════════════════════════════════════"
Write-Info "  STEP 2: Creating Installer Structure"
Write-Info "═══════════════════════════════════════════════════════════"
Write-Host ""

$InstallerDir = Join-Path $DistDir "$Product\installer"
New-Item -ItemType Directory -Path "$InstallerDir\modules" -Force | Out-Null
New-Item -ItemType Directory -Path "$InstallerDir\public\build" -Force | Out-Null

# Copy Laravel Application Base
Write-Info "📋 Copying Laravel application base..."
$AppPath = Join-Path $AppsDir $Config.AppFolder
if (-not (Test-Path $AppPath)) {
    Write-Warning "  ⚠ App folder not found, using standalone-host as base"
    $AppPath = Join-Path $AppsDir "standalone-host"
}

$ExcludeDirs = @('node_modules', 'vendor', '.git', 'storage\logs', 'storage\framework\cache', 'storage\framework\sessions', 'storage\framework\views', 'public\build')
Get-ChildItem -Path $AppPath | Where-Object { 
    $_.Name -notin $ExcludeDirs -and $_.Name -ne '.env'
} | Copy-Item -Destination $InstallerDir -Recurse -Force

# Copy modules
Write-Info "📋 Copying modules..."
foreach ($module in $Config.Modules) {
    $ModulePath = Join-Path $PackagesDir "aero-$module"
    if (Test-Path $ModulePath) {
        Write-Info "  → aero-$module"
        Copy-Item -Path $ModulePath -Destination "$InstallerDir\modules\" -Recurse -Force
        
        # Copy Core's compiled assets to public/build (Host mode)
        if ($module -eq 'core') {
            $BuildPath = Join-Path $ModulePath "public\build"
            if (Test-Path $BuildPath) {
                Copy-Item -Path "$BuildPath\*" -Destination "$InstallerDir\public\build\" -Recurse -Force -ErrorAction SilentlyContinue
                Write-Success "    ✓ Core assets copied to public/build"
            }
        }
    }
}

# Step 3: Create composer.json
Write-Info ""
Write-Info "📝 Creating composer.json..."

$ModuleRequirements = $Config.Modules | ForEach-Object {
    "        `"aero/$_`": `"*`""
} | Out-String

$ComposerJson = @"
{
    "name": "aero/$($Product)",
    "type": "project",
    "description": "$($Config.Description)",
    "keywords": ["aero", "erp", "laravel"],
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
$ModuleRequirements
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

# Step 4: Install Composer Dependencies
Write-Info ""
Write-Info "═══════════════════════════════════════════════════════════"
Write-Info "  STEP 3: Installing Composer Dependencies (Fat Package)"
Write-Info "═══════════════════════════════════════════════════════════"
Write-Host ""

Set-Location $InstallerDir
composer install --no-dev --optimize-autoloader --ignore-platform-reqs --quiet

# Step 5: Create Storage Structure
Write-Info ""
Write-Info "📁 Creating storage structure..."
New-Item -ItemType Directory -Path "storage\framework\cache" -Force | Out-Null
New-Item -ItemType Directory -Path "storage\framework\sessions" -Force | Out-Null
New-Item -ItemType Directory -Path "storage\framework\views" -Force | Out-Null
New-Item -ItemType Directory -Path "storage\logs" -Force | Out-Null

# Step 6: Create Documentation
Write-Info "📝 Creating README..."
$Readme = @"
# $($Config.Name) v$Version

$($Config.Description)

## Modules Included
$($Config.Modules | ForEach-Object { "- ✅ $_" } | Out-String)

## Installation Steps

1. **Extract Files**
   Extract this archive to your web server directory

2. **Web Server Configuration**
   Point your web server (Apache/Nginx) to the \`public\` folder

3. **Environment Configuration**
   ```bash
   cp .env.example .env
   # Edit .env and configure your database
   ```

4. **Application Setup**
   ```bash
   php artisan key:generate
   php artisan migrate --seed
   php artisan storage:link
   ```

5. **Access Application**
   Navigate to your configured domain

## System Requirements

- PHP >= 8.2
- MySQL >= 8.0 or PostgreSQL >= 13
- Web Server (Apache/Nginx)
- 512MB RAM minimum

## Available Add-on Modules

Extend your installation with these modules:
$($ProductConfigs.Keys | Where-Object { $_ -ne $Product } | ForEach-Object {
    $otherConfig = $ProductConfigs[$_]
    $missingModules = $otherConfig.Modules | Where-Object { $_ -notin $Config.Modules -and $_ -ne 'core' }
    if ($missingModules) {
        $missingModules | ForEach-Object { "- 📦 $_ Module" }
    }
} | Out-String)

## Support

- 📧 Email: support@aerosuite.com
- 📚 Documentation: https://docs.aerosuite.com
- 💬 Community: https://community.aerosuite.com

## License

Proprietary - Licensed to CodeCanyon purchaser
"@
Set-Content -Path "$InstallerDir\README.md" -Value $Readme

# Create .env.example
$EnvExample = @"
APP_NAME="$($Config.Name)"
APP_ENV=production
APP_KEY=
APP_DEBUG=false
APP_URL=http://localhost

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=aero_app
DB_USERNAME=root
DB_PASSWORD=

CACHE_STORE=file
SESSION_DRIVER=file
QUEUE_CONNECTION=sync
"@
Set-Content -Path "$InstallerDir\.env.example" -Value $EnvExample

# Step 7: Create ZIP Package
Write-Info ""
Write-Info "═══════════════════════════════════════════════════════════"
Write-Info "  STEP 4: Creating Distribution Package"
Write-Info "═══════════════════════════════════════════════════════════"
Write-Host ""

Set-Location (Join-Path $DistDir $Product)
$ZipFile = "$($Config.OutputName)_v$Version.zip"
Compress-Archive -Path "installer\*" -DestinationPath $ZipFile -Force

$Size = (Get-Item $ZipFile).Length / 1MB
Write-Success "✓ Package created: $ZipFile ($([math]::Round($Size, 2)) MB)"

# Verification
Write-Info ""
Write-Info "═══════════════════════════════════════════════════════════"
Write-Info "  Verification"
Write-Info "═══════════════════════════════════════════════════════════"
Write-Host ""

Add-Type -AssemblyName System.IO.Compression.FileSystem
$zip = [System.IO.Compression.ZipFile]::OpenRead((Join-Path (Join-Path $DistDir $Product) $ZipFile))

$hasVendor = $zip.Entries | Where-Object { $_.FullName -like "vendor/*" } | Select-Object -First 1
if ($hasVendor) {
    Write-Success "✓ Vendor folder present (Fat Package)"
} else {
    Write-Error "✗ Vendor folder missing!"
}

foreach ($module in $Config.Modules) {
    $hasModule = $zip.Entries | Where-Object { $_.FullName -like "modules/aero-$module/*" } | Select-Object -First 1
    if ($hasModule) {
        Write-Success "✓ Module aero-$module present"
    } else {
        Write-Warning "⚠ Module aero-$module missing"
    }
}

$zip.Dispose()

# Summary
Write-Host ""
Write-Success "╔════════════════════════════════════════════════════════════╗"
Write-Success "║              Product Build Complete!                       ║"
Write-Success "╚════════════════════════════════════════════════════════════╝"
Write-Host ""
Write-Info "📦 Product: $($Config.Name)"
Write-Info "📍 Output: $(Join-Path $DistDir $Product)\$ZipFile"
Write-Info "📊 Size: $([math]::Round($Size, 2)) MB"
Write-Info "🧩 Modules: $($Config.Modules -join ', ')"
Write-Host ""
Write-Info "💡 This is a STANDALONE PRODUCT with all dependencies included"
Write-Info "   Customers can extract and install without additional downloads"
Write-Host ""
