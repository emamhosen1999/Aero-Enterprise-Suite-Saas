# Build Core and All Module Packages
$ErrorActionPreference = "Stop"
$RootDir = Split-Path -Parent $PSCommandPath
$PackagesDir = Join-Path $RootDir ".." "packages"

Write-Host "`n" -ForegroundColor Green
Write-Host "   Aero Enterprise Suite - Build All         " -ForegroundColor Green  
Write-Host "`n" -ForegroundColor Green

# Build Core
Write-Host "" -ForegroundColor Cyan
Write-Host "  Building aero-core (Host Application)       " -ForegroundColor Cyan
Write-Host "" -ForegroundColor Cyan
Push-Location (Join-Path $PackagesDir "aero-core")
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host " Core build failed" -ForegroundColor Red
    Pop-Location
    exit 1
}
Write-Host " Core built successfully`n" -ForegroundColor Green
Pop-Location

# Build Modules
$modules = @("hrm", "crm", "finance", "project", "pos", "scm", "ims", "compliance", "dms", "quality")
foreach ($module in $modules) {
    $modulePath = Join-Path $PackagesDir "aero-$module"
    if (Test-Path $modulePath) {
        $packageJson = Join-Path $modulePath "package.json"
        if (Test-Path $packageJson) {
            Write-Host "" -ForegroundColor Yellow
            Write-Host "  Building aero-$module" -ForegroundColor Yellow
            Write-Host "" -ForegroundColor Yellow
            Push-Location $modulePath
            npm run build 2>$null
            if ($LASTEXITCODE -eq 0) {
                Write-Host " aero-$module built successfully" -ForegroundColor Green
            } else {
                Write-Host " aero-$module build failed (skipping)" -ForegroundColor Yellow
            }
            Pop-Location
        }
    }
}

Write-Host "`n" -ForegroundColor Green
Write-Host "   Build Complete!                            " -ForegroundColor Green
Write-Host "`n" -ForegroundColor Green
Write-Host " Core assets: packages/aero-core/public/build/" -ForegroundColor Cyan
Write-Host " Module bundles: packages/aero-*/dist/`n" -ForegroundColor Cyan
