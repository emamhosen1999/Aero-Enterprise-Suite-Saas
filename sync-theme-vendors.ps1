# Theme Files Vendor Sync Script
# Run this script after closing VS Code to complete the vendor sync
# This copies all consolidated theme files from aero-ui package to vendor directories

$ErrorActionPreference = "Stop"

$sourceBase = "d:\laragon\www\Aero-Enterprise-Suite-Saas\packages\aero-ui\resources\js"
$vendors = @(
    "d:\laragon\www\aeos365\vendor\aero\ui\resources\js",
    "d:\laragon\www\dbedc-erp\vendor\aero\ui\resources\js"
)

$filesToSync = @(
    @{ Src = "utils\safeTheme.js"; Dest = "utils\safeTheme.js" },
    @{ Src = "theme\cardStyles.js"; Dest = "theme\cardStyles.js" },
    @{ Src = "theme\index.js"; Dest = "theme\index.js" },
    @{ Src = "Context\ThemeContext.jsx"; Dest = "Context\ThemeContext.jsx" },
    @{ Src = "Components\UI\ThemedCard.jsx"; Dest = "Components\UI\ThemedCard.jsx" },
    @{ Src = "Components\UI\ThemeSelector.jsx"; Dest = "Components\UI\ThemeSelector.jsx" },
    @{ Src = "Components\ThemeSettingDrawer.jsx"; Dest = "Components\ThemeSettingDrawer.jsx" }
)

Write-Host "`n=== Theme Files Vendor Sync ===" -ForegroundColor Cyan
Write-Host "Source: $sourceBase`n" -ForegroundColor Gray

$totalSynced = 0
$totalFailed = 0

foreach ($vendor in $vendors) {
    $vendorName = if ($vendor -match "aeos365") { "aeos365" } else { "dbedc-erp" }
    Write-Host "`nSyncing to $vendorName..." -ForegroundColor Yellow
    
    $synced = 0
    $failed = 0
    
    foreach ($file in $filesToSync) {
        $srcPath = Join-Path $sourceBase $file.Src
        $destPath = Join-Path $vendor $file.Dest
        
        try {
            if (!(Test-Path $srcPath)) {
                throw "Source file not found: $srcPath"
            }
            
            $destDir = Split-Path $destPath -Parent
            if (!(Test-Path $destDir)) {
                New-Item -ItemType Directory -Path $destDir -Force | Out-Null
            }
            
            Copy-Item $srcPath $destPath -Force
            Write-Host "  ✓ $($file.Src)" -ForegroundColor Green
            $synced++
        }
        catch {
            Write-Host "  ✗ $($file.Src) - $_" -ForegroundColor Red
            $failed++
        }
    }
    
    Write-Host "  $synced synced, $failed failed" -ForegroundColor $(if ($failed -eq 0) { "Green" } else { "Yellow" })
    $totalSynced += $synced
    $totalFailed += $failed
}

Write-Host "`n=== Summary ===" -ForegroundColor Cyan
Write-Host "Total synced: $totalSynced files" -ForegroundColor Green
Write-Host "Total failed: $totalFailed files" -ForegroundColor $(if ($totalFailed -eq 0) { "Green" } else { "Red" })

if ($totalFailed -eq 0) {
    Write-Host "`n✅ All theme files successfully synced to both vendors!" -ForegroundColor Green
} else {
    Write-Host "`nSome files failed to sync. Check the errors above." -ForegroundColor Yellow
}
