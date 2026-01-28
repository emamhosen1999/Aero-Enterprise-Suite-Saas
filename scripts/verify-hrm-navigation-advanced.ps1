# HRM Navigation Route & Page Testing Script
# This script tests both JSX page existence and route functionality

param(
    [string]$BaseDir = "d:\laragon\www\Aero-Enterprise-Suite-Saas",
    [switch]$TestRoutes = $false,
    [string]$TestUrl = "http://aeos365.test"
)

Write-Host "HRM Navigation Testing Script" -ForegroundColor Green
Write-Host "============================" -ForegroundColor Green

# Function to check if a JSX file exists and get its content info
function Test-JSXPage {
    param(
        [string]$ExpectedPath,
        [string]$ComponentName,
        [array]$SearchPaths
    )
    
    foreach ($searchPath in $SearchPaths) {
        $fullSearchPath = Join-Path $BaseDir $searchPath
        $fullFilePath = Join-Path $fullSearchPath $ExpectedPath
        
        if (Test-Path $fullFilePath) {
            $content = Get-Content $fullFilePath -Raw
            
            # Check for React component structure
            $hasImports = $content -match "import.*React|import.*\{.*\}.*from"
            $hasExport = $content -match "export\s+default|export\s*\{"
            $hasFunction = $content -match "function\s+\w+|const\s+\w+\s*="
            $hasJSX = $content -match "<.*>|<\/.*>"
            
            return @{
                Exists = $true
                Path = "$searchPath/$ExpectedPath"
                Size = (Get-Item $fullFilePath).Length
                HasReactStructure = $hasImports -and $hasExport -and $hasFunction -and $hasJSX
                LastModified = (Get-Item $fullFilePath).LastWriteTime
                Lines = ($content -split "`n").Count
            }
        }
    }
    
    return @{ Exists = $false }
}

# Function to extract route definitions from route files
function Get-RouteDefinitions {
    $routeFiles = @(
        "routes/web.php",
        "routes/tenant.php", 
        "packages/aero-hrm/routes/web.php",
        "packages/aero-hrm/routes/tenant.php"
    )
    
    $routes = @{}
    
    foreach ($routeFile in $routeFiles) {
        $fullPath = Join-Path $BaseDir $routeFile
        if (Test-Path $fullPath) {
            $content = Get-Content $fullPath -Raw
            
            # Extract routes using regex
            $routeMatches = [regex]::Matches($content, "Route::(get|post|put|patch|delete)\('([^']+)'")
            foreach ($match in $routeMatches) {
                $route = $match.Groups[2].Value
                if ($route -like "/hrm*") {
                    $routes[$route] = @{
                        Method = $match.Groups[1].Value
                        File = $routeFile
                    }
                }
            }
        }
    }
    
    return $routes
}

# Function to test navigation accessibility
function Test-NavigationAccess {
    param(
        [string]$Route,
        [string]$BaseUrl
    )
    
    if (-not $TestRoutes) {
        return "Skipped"
    }
    
    try {
        # Clean route for testing
        $testRoute = $Route -replace '\{[^}]+\}', '1'  # Replace {id} with 1
        $fullUrl = "$BaseUrl$testRoute"
        
        # Simple HTTP test (this would need to be enhanced for full testing)
        $response = Invoke-WebRequest -Uri $fullUrl -Method GET -TimeoutSec 10 -UseBasicParsing
        
        if ($response.StatusCode -eq 200) {
            return "✓ Accessible"
        } else {
            return "⚠ Status: $($response.StatusCode)"
        }
    }
    catch {
        return "✗ Error: $($_.Exception.Message)"
    }
}

# Main execution
$searchPaths = @(
    "packages/aero-ui/resources/js",
    "packages/aero-hrm/resources/js", 
    "resources/js"
)

Write-Host "Loading navigation data..." -ForegroundColor Yellow
$csvPath = Join-Path $BaseDir "hrm_navigation_pages.csv"
$navigationData = Import-Csv $csvPath

Write-Host "Extracting route definitions..." -ForegroundColor Yellow
$routeDefinitions = Get-RouteDefinitions

Write-Host "Testing pages and routes..." -ForegroundColor Yellow
$results = @()
$stats = @{
    Total = 0
    PagesFound = 0
    PagesMissing = 0
    RoutesFound = 0
    RoutesMissing = 0
    Accessible = 0
}

foreach ($item in $navigationData) {
    if ($item.'Expected JSX Path' -like "N/A*") {
        continue
    }
    
    $stats.Total++
    
    # Test JSX page existence
    $pageTest = Test-JSXPage -ExpectedPath $item.'Expected JSX Path' -ComponentName $item.'Component Name' -SearchPaths $searchPaths
    
    if ($pageTest.Exists) {
        $stats.PagesFound++
    } else {
        $stats.PagesMissing++
    }
    
    # Test route definition
    $routeExists = $routeDefinitions.ContainsKey($item.Route)
    if ($routeExists) {
        $stats.RoutesFound++
    } else {
        $stats.RoutesMissing++
    }
    
    # Test navigation accessibility (if enabled)
    $accessTest = "Not Tested"
    if ($TestRoutes -and $pageTest.Exists -and $routeExists) {
        $accessTest = Test-NavigationAccess -Route $item.Route -BaseUrl $TestUrl
        if ($accessTest -like "*Accessible*") {
            $stats.Accessible++
        }
    }
    
    $results += [PSCustomObject]@{
        'Section' = $item.Section
        'Component' = $item.'Component Name'
        'Route' = $item.Route
        'Page Exists' = if ($pageTest.Exists) { "✓" } else { "✗" }
        'Page Path' = if ($pageTest.Exists) { $pageTest.Path } else { "Missing" }
        'Page Quality' = if ($pageTest.Exists) { 
            if ($pageTest.HasReactStructure) { "Good" } else { "Incomplete" }
        } else { "N/A" }
        'Route Defined' = if ($routeExists) { "✓" } else { "✗" }
        'Accessibility' = $accessTest
        'Last Modified' = if ($pageTest.Exists) { $pageTest.LastModified } else { "N/A" }
        'File Size (bytes)' = if ($pageTest.Exists) { $pageTest.Size } else { 0 }
        'Status' = if ($pageTest.Exists -and $routeExists) { "Ready" } elseif ($pageTest.Exists) { "Page Only" } elseif ($routeExists) { "Route Only" } else { "Missing Both" }
    }
    
    # Progress indicator
    $progress = [math]::Round(($stats.Total / ($navigationData.Count - 2)) * 100, 1)  # -2 for N/A items
    Write-Progress -Activity "Testing Navigation" -Status "Processing $($item.'Component Name')" -PercentComplete $progress
}

# Clear progress bar
Write-Progress -Activity "Testing Navigation" -Completed

# Export detailed results
$outputPath = Join-Path $BaseDir "hrm_navigation_test_results.csv"
$results | Export-Csv -Path $outputPath -NoTypeInformation -Encoding UTF8

# Generate summary report
Write-Host "`n" -ForegroundColor White
Write-Host "HRM NAVIGATION TEST RESULTS" -ForegroundColor Cyan
Write-Host "===========================" -ForegroundColor Cyan
Write-Host "Total Navigation Items: $($stats.Total)" -ForegroundColor White
Write-Host ""
Write-Host "JSX Pages:" -ForegroundColor Yellow
Write-Host "  Found: $($stats.PagesFound)" -ForegroundColor Green
Write-Host "  Missing: $($stats.PagesMissing)" -ForegroundColor Red
Write-Host "  Coverage: $([math]::Round(($stats.PagesFound/$stats.Total)*100, 1))%" -ForegroundColor $(if($stats.PagesFound/$stats.Total -gt 0.8){"Green"}elseif($stats.PagesFound/$stats.Total -gt 0.5){"Yellow"}else{"Red"})
Write-Host ""
Write-Host "Routes:" -ForegroundColor Yellow
Write-Host "  Defined: $($stats.RoutesFound)" -ForegroundColor Green
Write-Host "  Missing: $($stats.RoutesMissing)" -ForegroundColor Red
Write-Host "  Coverage: $([math]::Round(($stats.RoutesFound/$stats.Total)*100, 1))%" -ForegroundColor $(if($stats.RoutesFound/$stats.Total -gt 0.8){"Green"}elseif($stats.RoutesFound/$stats.Total -gt 0.5){"Yellow"}else{"Red"})

if ($TestRoutes) {
    Write-Host ""
    Write-Host "Accessibility:" -ForegroundColor Yellow
    Write-Host "  Accessible: $($stats.Accessible)" -ForegroundColor Green
}

# Status breakdown
Write-Host ""
Write-Host "STATUS BREAKDOWN:" -ForegroundColor Yellow
$statusGroups = $results | Group-Object Status
foreach ($group in $statusGroups) {
    $color = switch ($group.Name) {
        "Ready" { "Green" }
        "Page Only" { "Yellow" }
        "Route Only" { "Yellow" }
        "Missing Both" { "Red" }
        default { "White" }
    }
    Write-Host "  $($group.Name): $($group.Count)" -ForegroundColor $color
}

# Priority recommendations
Write-Host ""
Write-Host "PRIORITY RECOMMENDATIONS:" -ForegroundColor Cyan
Write-Host "========================" -ForegroundColor Cyan

$missingBoth = $results | Where-Object { $_.Status -eq "Missing Both" }
if ($missingBoth.Count -gt 0) {
    Write-Host ""
    Write-Host "HIGH PRIORITY - Missing Both Page & Route:" -ForegroundColor Red
    foreach ($item in $missingBoth | Select-Object -First 5) {
        Write-Host "  • $($item.Component) ($($item.Section))" -ForegroundColor Red
    }
    if ($missingBoth.Count -gt 5) {
        Write-Host "  ... and $($missingBoth.Count - 5) more" -ForegroundColor Red
    }
}

$pageOnly = $results | Where-Object { $_.Status -eq "Page Only" }
if ($pageOnly.Count -gt 0) {
    Write-Host ""
    Write-Host "MEDIUM PRIORITY - Page Exists, Route Missing:" -ForegroundColor Yellow
    foreach ($item in $pageOnly | Select-Object -First 3) {
        Write-Host "  • $($item.Component) - Add route: $($item.Route)" -ForegroundColor Yellow
    }
}

$routeOnly = $results | Where-Object { $_.Status -eq "Route Only" }
if ($routeOnly.Count -gt 0) {
    Write-Host ""
    Write-Host "MEDIUM PRIORITY - Route Exists, Page Missing:" -ForegroundColor Yellow
    foreach ($item in $routeOnly | Select-Object -First 3) {
        Write-Host "  • $($item.Component) - Create page at: $($item.'Page Path')" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "Detailed results saved to: $outputPath" -ForegroundColor White
Write-Host ""
Write-Host "To test actual navigation accessibility, run with -TestRoutes flag:" -ForegroundColor Cyan
Write-Host "  .\verify-hrm-navigation-advanced.ps1 -TestRoutes -TestUrl 'http://your-app.test'" -ForegroundColor Gray