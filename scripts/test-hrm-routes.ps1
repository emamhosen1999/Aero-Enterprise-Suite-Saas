param(
    [string]$BaseDir = "d:\laragon\www\Aero-Enterprise-Suite-Saas",
    [string]$TestUrl = "http://aeos365.test"
)

Write-Host "HRM Route Testing Script" -ForegroundColor Green
Write-Host "========================" -ForegroundColor Green

# Load the verification results
$csvPath = Join-Path $BaseDir "hrm_pages_verification.csv"
if (-not (Test-Path $csvPath)) {
    Write-Error "Please run hrm-verify-clean.ps1 first to generate verification data"
    exit 1
}

$data = Import-Csv $csvPath

# Extract routes from route files
function Get-RouteDefinitions {
    $routeFiles = @(
        "routes\web.php",
        "routes\tenant.php",
        "packages\aero-hrm\routes\web.php",
        "packages\aero-hrm\routes\tenant.php"
    )
    
    $routes = @{}
    
    foreach ($routeFile in $routeFiles) {
        $fullPath = Join-Path $BaseDir $routeFile
        if (Test-Path $fullPath) {
            Write-Host "Scanning $routeFile..." -ForegroundColor Yellow
            $content = Get-Content $fullPath -Raw -ErrorAction SilentlyContinue
            
            if ($content) {
                # Match Laravel route definitions
                $routePattern = "Route::(get|post|put|patch|delete|any)\s*\(\s*['""]([^'""]+)['""]"
                $matches = [regex]::Matches($content, $routePattern)
                
                foreach ($match in $matches) {
                    $route = $match.Groups[2].Value
                    if ($route -like "/hrm*" -or $route -like "hrm*") {
                        $cleanRoute = $route -replace "^/", "" -replace "^", "/"
                        $routes[$cleanRoute] = @{
                            Method = $match.Groups[1].Value.ToUpper()
                            File = $routeFile
                        }
                    }
                }
            }
        }
    }
    
    return $routes
}

# Test route accessibility
function Test-Route {
    param(
        [string]$Route,
        [string]$BaseUrl
    )
    
    try {
        # Clean route for testing (replace {id} with 1, etc.)
        $testRoute = $Route -replace '\{[^}]+\}', '1'
        $fullUrl = "$BaseUrl$testRoute"
        
        Write-Host "  Testing: $fullUrl" -ForegroundColor Gray
        
        # Simple HTTP test
        $response = Invoke-WebRequest -Uri $fullUrl -Method GET -TimeoutSec 5 -UseBasicParsing -ErrorAction Stop
        
        return @{
            Status = "SUCCESS"
            StatusCode = $response.StatusCode
            Message = "HTTP $($response.StatusCode)"
        }
    }
    catch {
        $statusCode = if ($_.Exception.Response) { $_.Exception.Response.StatusCode } else { "N/A" }
        
        return @{
            Status = "FAILED"
            StatusCode = $statusCode
            Message = $_.Exception.Message
        }
    }
}

Write-Host "Extracting route definitions..." -ForegroundColor Yellow
$routeDefinitions = Get-RouteDefinitions
Write-Host "Found $($routeDefinitions.Count) HRM routes" -ForegroundColor Cyan

Write-Host ""
Write-Host "Analyzing navigation completeness..." -ForegroundColor Yellow
Write-Host "====================================" -ForegroundColor Yellow

$results = @()
$pageFoundRouteFound = 0
$pageFoundRouteNotFound = 0
$pageNotFoundRouteFound = 0
$pageNotFoundRouteNotFound = 0
$totalAccessible = 0

foreach ($item in $data) {
    $routeExists = $routeDefinitions.ContainsKey($item.Route)
    $pageExists = $item.Status -eq "Found"
    
    # Categorize combinations
    if ($pageExists -and $routeExists) {
        $pageFoundRouteFound++
        $completeness = "COMPLETE"
        $color = "Green"
    } elseif ($pageExists -and -not $routeExists) {
        $pageFoundRouteNotFound++
        $completeness = "PAGE_ONLY"
        $color = "Yellow"
    } elseif (-not $pageExists -and $routeExists) {
        $pageNotFoundRouteFound++
        $completeness = "ROUTE_ONLY"  
        $color = "Yellow"
    } else {
        $pageNotFoundRouteNotFound++
        $completeness = "MISSING_BOTH"
        $color = "Red"
    }
    
    # Test accessibility if both exist
    $accessibilityTest = @{
        Status = "NOT_TESTED"
        StatusCode = "N/A"
        Message = "Skipped"
    }
    
    if ($pageExists -and $routeExists) {
        Write-Host "Testing accessibility for: $($item.Component)" -ForegroundColor Cyan
        $accessibilityTest = Test-Route -Route $item.Route -BaseUrl $TestUrl
        if ($accessibilityTest.Status -eq "SUCCESS") {
            $totalAccessible++
        }
    }
    
    Write-Host "[$completeness] $($item.Component)" -ForegroundColor $color
    
    $results += [PSCustomObject]@{
        'Section' = $item.Section
        'Component' = $item.Component
        'Route' = $item.Route
        'Page Exists' = if ($pageExists) { "YES" } else { "NO" }
        'Route Defined' = if ($routeExists) { "YES" } else { "NO" }
        'Route Method' = if ($routeExists) { $routeDefinitions[$item.Route].Method } else { "N/A" }
        'Route File' = if ($routeExists) { $routeDefinitions[$item.Route].File } else { "N/A" }
        'Completeness' = $completeness
        'Accessibility Status' = $accessibilityTest.Status
        'HTTP Status' = $accessibilityTest.StatusCode
        'Access Message' = $accessibilityTest.Message
    }
}

# Export detailed results
$outputPath = Join-Path $BaseDir "hrm_route_testing_results.csv"
$results | Export-Csv -Path $outputPath -NoTypeInformation

Write-Host ""
Write-Host "NAVIGATION COMPLETENESS ANALYSIS" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan
Write-Host "Total Navigation Items: $($data.Count)" -ForegroundColor White
Write-Host ""
Write-Host "COMPLETE (Page + Route): $pageFoundRouteFound" -ForegroundColor Green
Write-Host "PAGE ONLY: $pageFoundRouteNotFound" -ForegroundColor Yellow  
Write-Host "ROUTE ONLY: $pageNotFoundRouteFound" -ForegroundColor Yellow
Write-Host "MISSING BOTH: $pageNotFoundRouteNotFound" -ForegroundColor Red
Write-Host ""
Write-Host "ACCESSIBILITY TESTED: $totalAccessible successful" -ForegroundColor Green

# Priority recommendations
Write-Host ""
Write-Host "IMPLEMENTATION PRIORITIES:" -ForegroundColor Cyan
Write-Host "=========================" -ForegroundColor Cyan

# High priority - missing both
$missingBoth = $results | Where-Object { $_.Completeness -eq "MISSING_BOTH" }
if ($missingBoth.Count -gt 0) {
    Write-Host ""
    Write-Host "HIGH PRIORITY - Missing Both Page & Route ($($missingBoth.Count) items):" -ForegroundColor Red
    $missingBoth | Select-Object -First 5 | ForEach-Object {
        Write-Host "  • $($_.Component) -> $($_.Route)" -ForegroundColor Red
    }
    if ($missingBoth.Count -gt 5) {
        Write-Host "  ... and $($missingBoth.Count - 5) more" -ForegroundColor Gray
    }
}

# Medium priority - page only  
$pageOnly = $results | Where-Object { $_.Completeness -eq "PAGE_ONLY" }
if ($pageOnly.Count -gt 0) {
    Write-Host ""
    Write-Host "MEDIUM PRIORITY - Page Exists, Route Missing ($($pageOnly.Count) items):" -ForegroundColor Yellow
    $pageOnly | Select-Object -First 3 | ForEach-Object {
        Write-Host "  • Add route: $($_.Route) -> $($_.Component)" -ForegroundColor Yellow
    }
}

# Medium priority - route only
$routeOnly = $results | Where-Object { $_.Completeness -eq "ROUTE_ONLY" }
if ($routeOnly.Count -gt 0) {
    Write-Host ""
    Write-Host "MEDIUM PRIORITY - Route Exists, Page Missing ($($routeOnly.Count) items):" -ForegroundColor Yellow
    $routeOnly | Select-Object -First 3 | ForEach-Object {
        Write-Host "  • Create page for: $($_.Route) -> $($_.Component)" -ForegroundColor Yellow
    }
}

# Accessibility issues
$accessFailed = $results | Where-Object { $_.'Accessibility Status' -eq "FAILED" }
if ($accessFailed.Count -gt 0) {
    Write-Host ""
    Write-Host "ACCESSIBILITY ISSUES - Complete but not accessible ($($accessFailed.Count) items):" -ForegroundColor Red
    foreach ($item in $accessFailed) {
        Write-Host "  • $($item.Component) -> $($item.'Access Message')" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "Detailed results saved to: $outputPath" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor White
Write-Host "1. Implement missing pages for MISSING_BOTH items" -ForegroundColor Gray
Write-Host "2. Add routes for PAGE_ONLY items" -ForegroundColor Gray  
Write-Host "3. Create pages for ROUTE_ONLY items" -ForegroundColor Gray
Write-Host "4. Fix accessibility issues for complete items" -ForegroundColor Gray