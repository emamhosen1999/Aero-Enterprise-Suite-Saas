# Simple HRM Navigation Verification Script
param(
    [string]$BaseDir = "d:\laragon\www\Aero-Enterprise-Suite-Saas"
)

Write-Host "HRM Navigation Verification" -ForegroundColor Green
Write-Host "==========================" -ForegroundColor Green

# Read CSV data
$csvPath = Join-Path $BaseDir "hrm_navigation_pages.csv"
$data = Import-Csv $csvPath

# Search paths
$searchPaths = @(
    "packages\aero-ui\resources\js",
    "packages\aero-hrm\resources\js",
    "resources\js"
)

$results = @()
$found = 0
$missing = 0
$total = 0

foreach ($item in $data) {
    if ($item.'Expected JSX Path' -like "N/A*") {
        continue
    }
    
    $total++
    $pageExists = $false
    $actualPath = "Not Found"
    
    # Check if file exists in any search path
    foreach ($searchPath in $searchPaths) {
        $fullPath = Join-Path $BaseDir $searchPath
        $filePath = Join-Path $fullPath $item.'Expected JSX Path'
        
        if (Test-Path $filePath) {
            $pageExists = $true
            $actualPath = "$searchPath\$($item.'Expected JSX Path')"
            break
        }
    }
    
    # Search for similar files if exact match not found
    if (-not $pageExists) {
        $fileName = Split-Path $item.'Expected JSX Path' -Leaf
        $baseFileName = [System.IO.Path]::GetFileNameWithoutExtension($fileName)
        
        foreach ($searchPath in $searchPaths) {
            $fullPath = Join-Path $BaseDir $searchPath
            if (Test-Path $fullPath) {
                $foundFiles = Get-ChildItem -Path $fullPath -Recurse -Filter "*.jsx" -ErrorAction SilentlyContinue |
                    Where-Object { $_.Name -eq $fileName -or $_.Name -like "*$baseFileName*" }
                
                if ($foundFiles) {
                    $pageExists = $true
                    $relativePath = $foundFiles[0].FullName.Replace("$BaseDir\", "")
                    $actualPath = $relativePath
                    break
                }
            }
        }
    }
    
    if ($pageExists) {
        $found++
        $status = "Found"
        Write-Host "[✓] $($item.'Component Name')" -ForegroundColor Green
    } else {
        $missing++
        $status = "Missing"
        Write-Host "[✗] $($item.'Component Name')" -ForegroundColor Red
    }
    
    $results += [PSCustomObject]@{
        'Section' = $item.Section
        'Component' = $item.'Component Name'
        'Route' = $item.Route
        'Expected Path' = $item.'Expected JSX Path'
        'Actual Path' = $actualPath
        'Status' = $status
    }
}

# Export results
$outputPath = Join-Path $BaseDir "hrm_pages_verification.csv"
$results | Export-Csv -Path $outputPath -NoTypeInformation

# Summary
Write-Host ""
Write-Host "SUMMARY" -ForegroundColor Cyan
Write-Host "=======" -ForegroundColor Cyan
Write-Host "Total Pages: $total" -ForegroundColor White
Write-Host "Found: $found" -ForegroundColor Green
Write-Host "Missing: $missing" -ForegroundColor Red
$coverage = [math]::Round(($found / $total) * 100, 2)
Write-Host "Coverage: $coverage%" -ForegroundColor $(if($coverage -gt 80){"Green"}elseif($coverage -gt 60){"Yellow"}else{"Red"})

# Missing pages
if ($missing -gt 0) {
    Write-Host ""
    Write-Host "MISSING PAGES:" -ForegroundColor Red
    Write-Host "=============" -ForegroundColor Red
    $missingItems = $results | Where-Object { $_.Status -eq "Missing" }
    foreach ($item in $missingItems) {
        Write-Host "• $($item.Component) -> $($item.'Expected Path')" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "Detailed results: $outputPath" -ForegroundColor Cyan