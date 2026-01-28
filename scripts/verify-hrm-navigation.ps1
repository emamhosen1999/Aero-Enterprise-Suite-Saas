# HRM Navigation Page Verification Script
# This script checks if each navigation route has its corresponding JSX page

param(
    [string]$BaseDir = "d:\laragon\www\Aero-Enterprise-Suite-Saas",
    [string]$CsvPath = "d:\laragon\www\Aero-Enterprise-Suite-Saas\hrm_navigation_pages.csv",
    [string]$OutputPath = "d:\laragon\www\Aero-Enterprise-Suite-Saas\hrm_navigation_verification_results.csv"
)

Write-Host "HRM Navigation Page Verification Script" -ForegroundColor Green
Write-Host "=======================================" -ForegroundColor Green

# Read the CSV file
if (-not (Test-Path $CsvPath)) {
    Write-Error "CSV file not found: $CsvPath"
    exit 1
}

$navigationData = Import-Csv $CsvPath

# Possible JSX file locations to search
$searchPaths = @(
    "packages/aero-ui/resources/js",
    "packages/aero-hrm/resources/js", 
    "resources/js"
)

$results = @()
$totalPages = 0
$foundPages = 0
$missingPages = 0
$featureOnlyCount = 0
$notImplementedCount = 0

Write-Host "`nScanning for JSX pages..." -ForegroundColor Yellow

foreach ($item in $navigationData) {
    if ($item.'Expected JSX Path' -eq "N/A (Feature)" -or $item.'Expected JSX Path' -eq "N/A (Not Implemented)") {
        if ($item.'Expected JSX Path' -eq "N/A (Feature)") {
            $featureOnlyCount++
        } else {
            $notImplementedCount++
        }
        
        $results += [PSCustomObject]@{
            'Section' = $item.Section
            'Component Code' = $item.'Component Code'
            'Component Name' = $item.'Component Name'
            'Route' = $item.Route
            'Type' = $item.Type
            'Expected JSX Path' = $item.'Expected JSX Path'
            'JSX File Exists' = $item.Status
            'Actual Path Found' = "N/A"
            'Status' = $item.Status
            'Notes' = $item.Notes
        }
        continue
    }
    
    $totalPages++
    $foundPath = $null
    $exists = $false
    
    # Search for the JSX file in multiple possible locations
    foreach ($searchPath in $searchPaths) {
        $fullSearchPath = Join-Path $BaseDir $searchPath
        $expectedPath = $item.'Expected JSX Path'
        $fullFilePath = Join-Path $fullSearchPath $expectedPath
        
        if (Test-Path $fullFilePath) {
            $foundPath = "$searchPath/$expectedPath"
            $exists = $true
            break
        }
    }
    
    # If not found in expected location, try to find similar files
    if (-not $exists) {
        $fileName = Split-Path $item.'Expected JSX Path' -Leaf
        $baseFileName = [System.IO.Path]::GetFileNameWithoutExtension($fileName)
        
        foreach ($searchPath in $searchPaths) {
            $fullSearchPath = Join-Path $BaseDir $searchPath
            if (Test-Path $fullSearchPath) {
                $foundFiles = Get-ChildItem -Path $fullSearchPath -Recurse -Filter "*.jsx" | 
                    Where-Object { $_.Name -like "*$baseFileName*" -or $_.Name -eq $fileName }
                
                if ($foundFiles.Count -gt 0) {
                    $relativePath = $foundFiles[0].FullName.Replace("$BaseDir\", "").Replace("\", "/")
                    $foundPath = $relativePath
                    $exists = $true
                    break
                }
            }
        }
    }
    
    if ($exists) {
        $foundPages++
        $status = "Found"
        Write-Host "✓ $($item.'Component Name')" -ForegroundColor Green
    } else {
        $missingPages++
        $status = "Missing"
        Write-Host "✗ $($item.'Component Name')" -ForegroundColor Red
    }
    
    $results += [PSCustomObject]@{
        'Section' = $item.Section
        'Component Code' = $item.'Component Code'
        'Component Name' = $item.'Component Name'
        'Route' = $item.Route
        'Type' = $item.Type
        'Expected JSX Path' = $item.'Expected JSX Path'
        'JSX File Exists' = if ($exists) { "Yes" } else { "No" }
        'Actual Path Found' = if ($foundPath) { $foundPath } else { "Not Found" }
        'Status' = $status
        'Notes' = if (-not $exists) { "JSX page missing - needs implementation" } else { "JSX page exists" }
    }
}

# Export results to CSV
$results | Export-Csv -Path $OutputPath -NoTypeInformation -Encoding UTF8

# Summary Report
Write-Host "`n" -ForegroundColor White
Write-Host "VERIFICATION SUMMARY" -ForegroundColor Cyan
Write-Host "===================" -ForegroundColor Cyan
Write-Host "Total Navigation Items: $($navigationData.Count)" -ForegroundColor White
Write-Host "Pages to Implement: $totalPages" -ForegroundColor White
Write-Host "Pages Found: $foundPages" -ForegroundColor Green
Write-Host "Pages Missing: $missingPages" -ForegroundColor Red
Write-Host "Feature-Only Items: $featureOnlyCount" -ForegroundColor Yellow
Write-Host "Not Implemented: $notImplementedCount" -ForegroundColor Gray
Write-Host ""
Write-Host "Coverage: $([math]::Round(($foundPages/$totalPages)*100, 2))%" -ForegroundColor $(if($foundPages/$totalPages -gt 0.8){"Green"}elseif($foundPages/$totalPages -gt 0.5){"Yellow"}else{"Red"})
Write-Host ""
Write-Host "Detailed results saved to: $OutputPath" -ForegroundColor White

# Generate missing pages report
if ($missingPages -gt 0) {
    Write-Host "`nMISSING PAGES REQUIRING IMPLEMENTATION:" -ForegroundColor Red
    Write-Host "======================================" -ForegroundColor Red
    
    $missingItems = $results | Where-Object { $_.'JSX File Exists' -eq "No" }
    foreach ($missing in $missingItems) {
        Write-Host "• $($missing.'Component Name') ($($missing.Section))" -ForegroundColor Red
        Write-Host "  Route: $($missing.Route)" -ForegroundColor Gray
        Write-Host "  Expected: $($missing.'Expected JSX Path')" -ForegroundColor Gray
        Write-Host ""
    }
}

# Generate found pages report
if ($foundPages -gt 0) {
    Write-Host "`nFOUND PAGES:" -ForegroundColor Green
    Write-Host "============" -ForegroundColor Green
    
    $foundItems = $results | Where-Object { $_.'JSX File Exists' -eq "Yes" }
    foreach ($found in $foundItems) {
        Write-Host "✓ $($found.'Component Name') ($($found.Section))" -ForegroundColor Green
        if ($found.'Actual Path Found' -ne $found.'Expected JSX Path') {
            Write-Host "  Found at: $($found.'Actual Path Found')" -ForegroundColor Yellow
        }
    }
}

Write-Host "`nVerification complete! Check $OutputPath for detailed results." -ForegroundColor Cyan