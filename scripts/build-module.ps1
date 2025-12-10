# PowerShell Script to Build Aero Module for Standalone Mode

param(
    [Parameter(Mandatory=$false)]
    [string]$ModuleName = "aero-hrm",
    
    [Parameter(Mandatory=$false)]
    [ValidateSet("production", "development")]
    [string]$BuildMode = "production"
)

# Colors for output
$Green = "Green"
$Yellow = "Yellow"
$Red = "Red"

Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor $Green
Write-Host "║         Aero Module Build Script (Standalone)             ║" -ForegroundColor $Green
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor $Green
Write-Host ""

# Validate module exists
$modulePath = "packages\$ModuleName"
if (-not (Test-Path $modulePath)) {
    Write-Host "✗ Module not found: $modulePath" -ForegroundColor $Red
    exit 1
}

Write-Host "Building module: $ModuleName" -ForegroundColor $Yellow
Write-Host "Build mode: $BuildMode" -ForegroundColor $Yellow
Write-Host ""

# Navigate to module directory
Push-Location $modulePath

try {
    # Check if vite.config.js exists
    if (-not (Test-Path "vite.config.js")) {
        Write-Host "✗ vite.config.js not found. Please create it with library mode configuration." -ForegroundColor $Red
        exit 1
    }

    # Install dependencies if needed
    if (-not (Test-Path "node_modules")) {
        Write-Host "⚙ Installing dependencies..." -ForegroundColor $Yellow
        npm install
        if ($LASTEXITCODE -ne 0) {
            throw "npm install failed"
        }
    }

    # Build the module
    Write-Host "⚙ Building module..." -ForegroundColor $Yellow
    if ($BuildMode -eq "production") {
        npm run build
    } else {
        npm run build -- --mode development
    }
    
    if ($LASTEXITCODE -ne 0) {
        throw "Build failed"
    }

    # Verify build output
    if (-not (Test-Path "dist")) {
        Write-Host "✗ Build failed: dist\ directory not created" -ForegroundColor $Red
        exit 1
    }

    Write-Host "✓ Build completed successfully" -ForegroundColor $Green
    Write-Host ""

    # Show build artifacts
    Write-Host "Build artifacts:" -ForegroundColor $Yellow
    Get-ChildItem "dist" -Recurse | Where-Object { -not $_.PSIsContainer } | ForEach-Object {
        $size = [math]::Round($_.Length / 1KB, 2)
        Write-Host "  $($_.Name) - ${size}KB"
    }
    Write-Host ""

    # Optional: Copy to public directory for testing
    $response = Read-Host "Copy to public\modules for testing? (y/N)"
    if ($response -eq 'y' -or $response -eq 'Y') {
        Pop-Location
        $publicModulesPath = "public\modules\$ModuleName"
        
        if (-not (Test-Path "public\modules")) {
            New-Item -ItemType Directory -Path "public\modules" -Force | Out-Null
        }
        
        if (-not (Test-Path $publicModulesPath)) {
            New-Item -ItemType Directory -Path $publicModulesPath -Force | Out-Null
        }
        
        Copy-Item "$modulePath\dist\*" -Destination $publicModulesPath -Recurse -Force
        Write-Host "✓ Copied to $publicModulesPath" -ForegroundColor $Green
        Push-Location $modulePath
    }

    Write-Host ""
    Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor $Green
    Write-Host "║                    Build Complete!                         ║" -ForegroundColor $Green
    Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor $Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor $Yellow
    Write-Host "1. Test the module in standalone mode"
    Write-Host "2. Create module.json if not exists"
    Write-Host "3. Package as ZIP for distribution"
    Write-Host ""

} catch {
    Write-Host "✗ Error: $_" -ForegroundColor $Red
    exit 1
} finally {
    Pop-Location
}
