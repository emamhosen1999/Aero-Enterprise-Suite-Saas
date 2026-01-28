# Enhanced HRM Route Detection Script
param(
    [string]$BaseDir = "d:\laragon\www\Aero-Enterprise-Suite-Saas"
)

Write-Host "Enhanced HRM Route Detection" -ForegroundColor Green
Write-Host "============================" -ForegroundColor Green

function Extract-HRM-Routes {
    param([string]$FilePath)
    
    if (-not (Test-Path $FilePath)) {
        return @{}
    }
    
    $content = Get-Content $FilePath -Raw
    $routes = @{}
    
    # Track current group prefixes
    $currentPrefixes = @()
    
    # Split into lines for line-by-line analysis
    $lines = $content -split "`n"
    
    for ($i = 0; $i -lt $lines.Count; $i++) {
        $line = $lines[$i].Trim()
        
        # Detect Route::group with prefix
        if ($line -match "Route::group\(\[.*?['""]prefix['""].*?=.*?['""]([^'""]+)['""]") {
            $prefix = $matches[1]
            $currentPrefixes += $prefix
            Write-Host "  Found group prefix: /$prefix" -ForegroundColor Gray
        }
        
        # Detect route definitions
        if ($line -match "Route::(get|post|put|patch|delete|any|resource)\s*\(['""]([^'""]+)['""]") {
            $method = $matches[1].ToUpper()
            $path = $matches[2]
            
            # Build full path with prefixes
            $fullPath = ""
            foreach ($prefix in $currentPrefixes) {
                $fullPath += "/$prefix"
            }
            $fullPath += "/$path"
            $fullPath = $fullPath -replace "/+", "/"  # Clean multiple slashes
            
            # Extract route name if present
            $routeName = ""
            if ($line -match "->name\(['""]([^'""]+)['""]") {
                $routeName = $matches[1]
            }
            
            $routes[$fullPath] = @{
                Method = $method
                Name = $routeName
                File = $FilePath
                Line = $i + 1
            }
            
            Write-Host "    Found: $method $fullPath" -ForegroundColor Cyan
        }
        
        # Reset prefixes when we exit a group (simplified - looks for closing braces)
        if ($line -match "^\s*\}") {
            if ($currentPrefixes.Count -gt 0) {
                $currentPrefixes = $currentPrefixes[0..($currentPrefixes.Count-2)]
            }
        }
    }
    
    return $routes
}

# Scan HRM route files
$routeFiles = @(
    "packages\aero-hrm\routes\web.php",
    "packages\aero-hrm\routes\tenant.php",
    "packages\aero-hrm\routes\api.php"
)

$allRoutes = @{}

foreach ($routeFile in $routeFiles) {
    $fullPath = Join-Path $BaseDir $routeFile
    Write-Host "`nScanning: $routeFile" -ForegroundColor Yellow
    
    $routes = Extract-HRM-Routes -FilePath $fullPath
    
    foreach ($route in $routes.Keys) {
        $allRoutes[$route] = $routes[$route]
    }
}

Write-Host "`nTOTAL HRM ROUTES FOUND: $($allRoutes.Count)" -ForegroundColor Green

# Export route definitions
$routeList = @()
foreach ($route in $allRoutes.Keys) {
    $routeInfo = $allRoutes[$route]
    $routeList += [PSCustomObject]@{
        'Path' = $route
        'Method' = $routeInfo.Method
        'Name' = $routeInfo.Name
        'File' = $routeInfo.File
        'Line' = $routeInfo.Line
    }
}

$outputPath = Join-Path $BaseDir "hrm_detected_routes.csv"
$routeList | Sort-Object Path | Export-Csv -Path $outputPath -NoTypeInformation

Write-Host "Routes exported to: $outputPath" -ForegroundColor Cyan

# Now match against navigation requirements
Write-Host "`nMATCHING AGAINST NAVIGATION REQUIREMENTS..." -ForegroundColor Yellow

$navFile = Join-Path $BaseDir "hrm_pages_verification.csv"
if (Test-Path $navFile) {
    $navData = Import-Csv $navFile
    
    $matched = 0
    $unmatched = 0
    
    Write-Host ""
    Write-Host "ROUTE MATCHING ANALYSIS:" -ForegroundColor Cyan
    Write-Host "========================" -ForegroundColor Cyan
    
    foreach ($nav in $navData) {
        $navRoute = $nav.Route
        $component = $nav.Component
        $pageExists = $nav.Status -eq "Found"
        
        # Check for exact match
        $routeFound = $allRoutes.ContainsKey($navRoute)
        
        # Check for similar routes if no exact match
        if (-not $routeFound) {
            $similarRoutes = $allRoutes.Keys | Where-Object { $_ -like "*$($navRoute.Split('/')[-1])*" }
            if ($similarRoutes) {
                Write-Host "  [SIMILAR] $component -> $navRoute (found: $($similarRoutes -join ', '))" -ForegroundColor Yellow
            }
        }
        
        if ($pageExists -and $routeFound) {
            $matched++
            Write-Host "[COMPLETE] $component" -ForegroundColor Green
        } elseif ($pageExists -and -not $routeFound) {
            $unmatched++
            Write-Host "[PAGE_ONLY] $component -> missing route: $navRoute" -ForegroundColor Yellow
        } elseif (-not $pageExists -and $routeFound) {
            Write-Host "[ROUTE_ONLY] $component -> missing page" -ForegroundColor Magenta
        } else {
            Write-Host "[MISSING_BOTH] $component" -ForegroundColor Red
        }
    }
    
    Write-Host ""
    Write-Host "MATCHING SUMMARY:" -ForegroundColor Cyan
    Write-Host "Complete (Page + Route): $matched" -ForegroundColor Green
    Write-Host "Page Only: $unmatched" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Next: Run .\scripts\test-navigation-access.ps1 to test actual accessibility" -ForegroundColor Gray