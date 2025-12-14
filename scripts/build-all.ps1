# Aero Enterprise Suite - Unified Build Script
# Builds assets for SaaS Host, Standalone Host, or both
#
# Usage:
#   .\build-all.ps1              # Build both hosts
#   .\build-all.ps1 -Target saas     # Build SaaS host only
#   .\build-all.ps1 -Target standalone  # Build Standalone host only
#   .\build-all.ps1 -Dev             # Start dev server instead of build

param(
    [ValidateSet("all", "saas", "standalone")]
    [string]$Target = "all",
    [switch]$Dev,
    [switch]$Install
)

$ErrorActionPreference = "Stop"
$RootDir = Split-Path -Parent (Split-Path -Parent $PSCommandPath)
$AppsDir = Join-Path $RootDir "apps"
$SaasHostDir = Join-Path $AppsDir "saas-host" "saas"
$StandaloneHostDir = Join-Path $AppsDir "standalone-host"

Write-Host ""
Write-Host "  ╔═══════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "  ║    Aero Enterprise Suite - Build System           ║" -ForegroundColor Cyan
Write-Host "  ╚═══════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

function Build-Host {
    param(
        [string]$Name,
        [string]$Path,
        [string]$Description
    )
    
    Write-Host "  ┌─────────────────────────────────────────────────┐" -ForegroundColor Yellow
    Write-Host "  │ Building: $Name" -ForegroundColor Yellow
    Write-Host "  │ $Description" -ForegroundColor Gray
    Write-Host "  └─────────────────────────────────────────────────┘" -ForegroundColor Yellow
    
    if (-not (Test-Path $Path)) {
        Write-Host "  ✗ Directory not found: $Path" -ForegroundColor Red
        return $false
    }
    
    Push-Location $Path
    
    try {
        # Install dependencies if requested or node_modules missing
        if ($Install -or -not (Test-Path "node_modules")) {
            Write-Host "  → Installing npm dependencies..." -ForegroundColor Gray
            npm install
            if ($LASTEXITCODE -ne 0) {
                throw "npm install failed"
            }
        }
        
        # Run composer install if vendor missing
        if (-not (Test-Path "vendor")) {
            Write-Host "  → Installing composer dependencies..." -ForegroundColor Gray
            composer install --no-interaction
            if ($LASTEXITCODE -ne 0) {
                throw "composer install failed"
            }
        }
        
        if ($Dev) {
            Write-Host "  → Starting development server..." -ForegroundColor Green
            npm run dev
        } else {
            Write-Host "  → Building production assets..." -ForegroundColor Green
            npm run build
            if ($LASTEXITCODE -ne 0) {
                throw "Build failed"
            }
            Write-Host "  ✓ Build successful!" -ForegroundColor Green
        }
        
        return $true
    }
    catch {
        Write-Host "  ✗ Error: $_" -ForegroundColor Red
        return $false
    }
    finally {
        Pop-Location
    }
}

$success = $true

# Build based on target
switch ($Target) {
    "saas" {
        $result = Build-Host -Name "SaaS Host" -Path $SaasHostDir -Description "Multi-tenant mode (Platform + Core + Modules)"
        $success = $result
    }
    "standalone" {
        $result = Build-Host -Name "Standalone Host" -Path $StandaloneHostDir -Description "Single-tenant mode (Core + Modules)"
        $success = $result
    }
    "all" {
        Write-Host "  Building all host applications..." -ForegroundColor Cyan
        Write-Host ""
        
        $saasResult = Build-Host -Name "SaaS Host" -Path $SaasHostDir -Description "Multi-tenant mode (Platform + Core + Modules)"
        Write-Host ""
        
        $standaloneResult = Build-Host -Name "Standalone Host" -Path $StandaloneHostDir -Description "Single-tenant mode (Core + Modules)"
        
        $success = $saasResult -and $standaloneResult
    }
}

Write-Host ""
if ($success) {
    Write-Host "  ╔═══════════════════════════════════════════════════╗" -ForegroundColor Green
    Write-Host "  ║              Build Complete!                      ║" -ForegroundColor Green
    Write-Host "  ╚═══════════════════════════════════════════════════╝" -ForegroundColor Green
    Write-Host ""
    Write-Host "  Output locations:" -ForegroundColor Cyan
    if ($Target -eq "all" -or $Target -eq "saas") {
        Write-Host "    • SaaS Host:       apps/saas-host/saas/public/build/" -ForegroundColor Gray
    }
    if ($Target -eq "all" -or $Target -eq "standalone") {
        Write-Host "    • Standalone Host: apps/standalone-host/public/build/" -ForegroundColor Gray
    }
} else {
    Write-Host "  ╔═══════════════════════════════════════════════════╗" -ForegroundColor Red
    Write-Host "  ║              Build Failed!                        ║" -ForegroundColor Red
    Write-Host "  ╚═══════════════════════════════════════════════════╝" -ForegroundColor Red
    exit 1
}
Write-Host ""
