# Universal Aero Module Builder
# Builds lightweight add-on modules (NO vendor/)

param(
    [Parameter(Mandatory=$true)]
    [string[]]$Modules,  # Can build multiple: @('hrm', 'crm', 'finance')
    
    [string]$Version = "1.0.0"
)

$ErrorActionPreference = "Stop"

# Colors
function Write-Success { Write-Host $args[0] -ForegroundColor Green }
function Write-Info { Write-Host $args[0] -ForegroundColor Cyan }
function Write-Warning { Write-Host $args[0] -ForegroundColor Yellow }

# Configuration
$RootDir = Split-Path -Parent $PSScriptRoot
$DistDir = Join-Path $RootDir "dist\modules"
$PackagesDir = Join-Path $RootDir "packages"

Write-Info "╔════════════════════════════════════════════════════════════╗"
Write-Info "║         Aero Module Builder (Lightweight Add-ons)         ║"
Write-Info "║                    Version: $Version                       ║"
Write-Info "╚════════════════════════════════════════════════════════════╝"
Write-Host ""
Write-Info "🧩 Building modules: $($Modules -join ', ')"
Write-Host ""

# Clean previous builds
if (Test-Path $DistDir) {
    Remove-Item -Path $DistDir -Recurse -Force
}
New-Item -ItemType Directory -Path $DistDir -Force | Out-Null

foreach ($module in $Modules) {
    Write-Info ""
    Write-Info "═══════════════════════════════════════════════════════════"
    Write-Info "  Building: aero-$module Module"
    Write-Info "═══════════════════════════════════════════════════════════"
    Write-Host ""
    
    $ModulePath = Join-Path $PackagesDir "aero-$module"
    
    if (-not (Test-Path $ModulePath)) {
        Write-Warning "⚠ Module aero-$module not found, skipping..."
        continue
    }
    
    # Step 1: Build Frontend
    Write-Info "📦 Building frontend assets..."
    Set-Location $ModulePath
    
    if (Test-Path "package.json") {
        if (-not (Test-Path "node_modules")) {
            Write-Info "  → Installing npm dependencies..."
            npm install --silent
        }
        npm run build --silent
        Write-Success "  ✓ Frontend built"
    } else {
        Write-Warning "  ⚠ No package.json found"
    }
    
    # Step 2: Create Module Package Structure
    Write-Info "📋 Creating module package..."
    $ModuleAddonDir = Join-Path $DistDir "$module-addon\aero-$module"
    New-Item -ItemType Directory -Path $ModuleAddonDir -Force | Out-Null
    
    # Copy module files (NO VENDOR!)
    $FoldersToCopy = @('src', 'resources', 'config', 'database', 'routes', 'dist', 'public')
    
    foreach ($folder in $FoldersToCopy) {
        $SourcePath = Join-Path $ModulePath $folder
        if (Test-Path $SourcePath) {
            Copy-Item -Path $SourcePath -Destination $ModuleAddonDir -Recurse -Force
            Write-Info "  → Copied $folder/"
        }
    }
    
    # Copy metadata files
    $FilesToCopy = @('composer.json', 'module.json', 'README.md', 'CHANGELOG.md', 'LICENSE')
    foreach ($file in $FilesToCopy) {
        $SourceFile = Join-Path $ModulePath $file
        if (Test-Path $SourceFile) {
            Copy-Item -Path $SourceFile -Destination $ModuleAddonDir -Force
            Write-Info "  → Copied $file"
        }
    }
    
    # Step 3: Create Installation Instructions
    Write-Info "📝 Creating installation instructions..."
    $InstallMd = @"
# Aero $($module.ToUpper()) Module v$Version

Add-on module for existing Aero installations

## Prerequisites

- Existing Aero installation (any product)
- aero/core >= 1.0.0
- PHP >= 8.2

## Installation Methods

### Method 1: Upload via Admin Panel (Recommended)

1. Log in to your Aero admin panel
2. Navigate to **Settings → Modules**
3. Click **Upload Module**
4. Select this ZIP file
5. Click **Install & Activate**

### Method 2: Manual Installation

1. Extract this archive to your Aero root directory:
   ```
   your-aero-install/
   └── modules/
       └── aero-$module/
   ```

2. Install module dependencies:
   ```bash
   cd modules/aero-$module
   composer install --no-dev
   cd ../..
   ```

3. Register the module:
   ```bash
   php artisan module:register aero-$module
   ```

4. Run migrations:
   ```bash
   php artisan migrate
   ```

5. Clear caches:
   ```bash
   php artisan config:clear
   php artisan cache:clear
   php artisan view:clear
   ```

6. Rebuild assets (if using SaaS mode):
   ```bash
   npm run build
   ```

### Method 3: Runtime Loading (Standalone Mode)

1. Extract to \`modules/\` directory
2. Module will be auto-discovered on next page load
3. No rebuild required!

## Verification

1. Check module is registered:
   ```bash
   php artisan module:list
   ```

2. Verify routes are loaded:
   ```bash
   php artisan route:list | grep $module
   ```

3. Check frontend assets:
   - Verify \`dist/aero-$module.js\` exists
   - Check browser console for module registration

## Features Included

[Module-specific features will be listed here]

## Troubleshooting

### Module not appearing
- Run: \`php artisan module:discover\`
- Check: \`config/modules.php\`
- Verify: Module permissions in database

### Routes not working
- Run: \`php artisan route:clear\`
- Check: Web server configuration
- Verify: Middleware in routes file

### Assets not loading
- Check: \`public/modules/\` symlink exists
- Run: \`php artisan storage:link\`
- Verify: File permissions (755 for directories, 644 for files)

## Support

- 📧 Email: support@aerosuite.com
- 📚 Documentation: https://docs.aerosuite.com/modules/$module
- 🐛 Bug Reports: https://github.com/aero/issues

## License

Proprietary - Licensed module add-on
"@
    Set-Content -Path (Join-Path $DistDir "$module-addon\INSTALL.md") -Value $InstallMd
    
    # Step 4: Create module.json if it doesn't exist
    $ModuleJsonPath = Join-Path $ModuleAddonDir "module.json"
    if (-not (Test-Path $ModuleJsonPath)) {
        Write-Info "📝 Creating module.json..."
        $ModuleJson = @"
{
    "name": "aero-$module",
    "short_name": "$module",
    "version": "$Version",
    "description": "Aero $($module.ToUpper()) Module",
    "namespace": "Aero\\$($module.Substring(0,1).ToUpper() + $module.Substring(1))",
    "providers": [
        "Aero\\$($module.Substring(0,1).ToUpper() + $module.Substring(1))\\Aero$($module.Substring(0,1).ToUpper() + $module.Substring(1))ServiceProvider"
    ],
    "middleware": ["web", "auth"],
    "dependencies": {
        "aero-core": "^1.0"
    },
    "routes": {
        "web": "routes/web.php",
        "api": "routes/api.php"
    },
    "assets": {
        "js": "dist/aero-$module.js",
        "css": "dist/aero-$module.css"
    },
    "config": {
        "enabled": true,
        "auto_register": true,
        "priority": 10
    }
}
"@
        Set-Content -Path $ModuleJsonPath -Value $ModuleJson
    }
    
    # Step 5: Create ZIP Package
    Write-Info "📦 Creating ZIP package..."
    Set-Location $DistDir
    $ZipFile = "Aero_$($module.ToUpper())_Module_v$Version.zip"
    Compress-Archive -Path "$module-addon\*" -DestinationPath $ZipFile -Force
    
    $Size = (Get-Item $ZipFile).Length / 1KB
    Write-Success "✓ Module created: $ZipFile ($([math]::Round($Size, 2)) KB)"
    
    # Verification
    Write-Info ""
    Write-Info "🔍 Verifying package..."
    Add-Type -AssemblyName System.IO.Compression.FileSystem
    $zip = [System.IO.Compression.ZipFile]::OpenRead((Join-Path $DistDir $ZipFile))
    
    # Check NO vendor folder
    $hasVendor = $zip.Entries | Where-Object { $_.FullName -like "*/vendor/*" } | Select-Object -First 1
    if ($hasVendor) {
        Write-Warning "⚠ WARNING: Vendor folder found (should be lightweight!)"
    } else {
        Write-Success "✓ No vendor folder (correct for add-on)"
    }
    
    # Check dist folder
    $hasDist = $zip.Entries | Where-Object { $_.FullName -like "*/dist/*.js" } | Select-Object -First 1
    if ($hasDist) {
        Write-Success "✓ Compiled assets present"
    } else {
        Write-Warning "⚠ No compiled assets found"
    }
    
    # Check module.json
    $hasModuleJson = $zip.Entries | Where-Object { $_.FullName -like "*/module.json" } | Select-Object -First 1
    if ($hasModuleJson) {
        Write-Success "✓ module.json present"
    } else {
        Write-Warning "⚠ module.json missing"
    }
    
    $zip.Dispose()
}

# Summary
Write-Host ""
Write-Success "╔════════════════════════════════════════════════════════════╗"
Write-Success "║              Module Build Complete!                        ║"
Write-Success "╚════════════════════════════════════════════════════════════╝"
Write-Host ""
Write-Info "📦 Built $($Modules.Count) module(s)"
Write-Info "📍 Output: $DistDir"
Write-Host ""

Get-ChildItem -Path $DistDir -Filter "*.zip" | ForEach-Object {
    $Size = $_.Length / 1KB
    Write-Info "  ▸ $($_.Name) ($([math]::Round($Size, 2)) KB)"
}

Write-Host ""
Write-Info "💡 These are LIGHTWEIGHT ADD-ON modules"
Write-Info "   - No vendor/ folder (customers use existing dependencies)"
Write-Info "   - Can be uploaded via admin panel or extracted to modules/"
Write-Info "   - Auto-discovered in Standalone mode"
Write-Host ""
