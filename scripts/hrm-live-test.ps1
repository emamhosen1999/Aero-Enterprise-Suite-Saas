# HRM Navigation Live Testing Script
# This script tests actual navigation accessibility by checking HTTP responses

param(
    [string]$BaseUrl = "http://aeos365.test",
    [string]$BaseDir = "d:\laragon\www\Aero-Enterprise-Suite-Saas",
    [switch]$DetailedOutput = $false
)

Write-Host "HRM Live Navigation Testing" -ForegroundColor Green  
Write-Host "===========================" -ForegroundColor Green
Write-Host "Testing against: $BaseUrl" -ForegroundColor Cyan

# Load verification data
$verificationFile = Join-Path $BaseDir "hrm_pages_verification.csv"
if (-not (Test-Path $verificationFile)) {
    Write-Error "Please run hrm-verify-clean.ps1 first"
    exit 1
}

$data = Import-Csv $verificationFile

# Filter to only test pages that exist
$pagesToTest = $data | Where-Object { $_.Status -eq "Found" }
Write-Host "Testing $($pagesToTest.Count) existing pages..." -ForegroundColor Yellow

$results = @()
$accessible = 0  
$inaccessible = 0
$errors = 0

foreach ($page in $pagesToTest) {
    $route = $page.Route
    $component = $page.Component
    
    # Skip routes with parameters for now
    if ($route -like "*{*}*") {
        if ($DetailedOutput) {
            Write-Host "[SKIP] $component - Route has parameters: $route" -ForegroundColor Gray
        }
        continue
    }
    
    # Construct full URL
    $fullUrl = "$BaseUrl$route"
    
    try {
        if ($DetailedOutput) {
            Write-Host "Testing: $fullUrl" -ForegroundColor Gray  
        }
        
        # Make HTTP request with timeout
        $response = Invoke-WebRequest -Uri $fullUrl -Method GET -TimeoutSec 10 -UseBasicParsing -ErrorAction Stop
        
        if ($response.StatusCode -eq 200) {
            $accessible++
            $status = "ACCESSIBLE"
            $message = "HTTP 200 OK"
            $color = "Green"
        } else {
            $inaccessible++
            $status = "WARNING"
            $message = "HTTP $($response.StatusCode)"
            $color = "Yellow"
        }
        
        if ($DetailedOutput -or $response.StatusCode -ne 200) {
            Write-Host "[$status] $component -> $message" -ForegroundColor $color
        } else {
            Write-Host "." -NoNewline -ForegroundColor Green
        }
        
    } catch {
        $errors++
        $status = "ERROR"
        
        # Extract useful error info
        if ($_.Exception.Response) {
            $statusCode = [int]$_.Exception.Response.StatusCode
            $statusText = $_.Exception.Response.StatusDescription
            $message = "HTTP $statusCode $statusText"
            
            # Different colors for different error types
            $color = switch ($statusCode) {
                404 { "Red" }      # Not Found - route missing
                500 { "Magenta" }  # Server Error - application error
                401 { "Yellow" }   # Unauthorized - authentication issue
                403 { "Yellow" }   # Forbidden - permission issue
                default { "Red" }
            }
        } else {
            $message = $_.Exception.Message
            $color = "Red"
        }
        
        if ($DetailedOutput -or $statusCode -ne 404) {
            Write-Host "[$status] $component -> $message" -ForegroundColor $color
        } else {
            Write-Host "x" -NoNewline -ForegroundColor Red
        }
    }
    
    $results += [PSCustomObject]@{
        'Section' = $page.Section
        'Component' = $component
        'Route' = $route
        'URL' = $fullUrl
        'Status' = $status
        'Message' = $message
    }
    
    # Small delay to avoid overwhelming server
    Start-Sleep -Milliseconds 100
}

# Export results
$outputPath = Join-Path $BaseDir "hrm_live_navigation_results.csv"
$results | Export-Csv -Path $outputPath -NoTypeInformation

# Summary
Write-Host ""
Write-Host ""
Write-Host "LIVE NAVIGATION TEST RESULTS" -ForegroundColor Cyan
Write-Host "============================" -ForegroundColor Cyan
Write-Host "Pages Tested: $($results.Count)" -ForegroundColor White
Write-Host "Accessible: $accessible" -ForegroundColor Green
Write-Host "Inaccessible: $inaccessible" -ForegroundColor Yellow
Write-Host "Errors: $errors" -ForegroundColor Red

if ($accessible -gt 0) {
    $successRate = [math]::Round(($accessible / $results.Count) * 100, 2)
    Write-Host "Success Rate: $successRate%" -ForegroundColor $(if($successRate -gt 80){"Green"}elseif($successRate -gt 60){"Yellow"}else{"Red"})
}

# Show error breakdown
if ($errors -gt 0) {
    Write-Host ""
    Write-Host "ERROR BREAKDOWN:" -ForegroundColor Red
    Write-Host "===============" -ForegroundColor Red
    
    $errorResults = $results | Where-Object { $_.Status -eq "ERROR" }
    $errorGroups = $errorResults | Group-Object { $_.Message -replace "HTTP \d+", "HTTP XXX" }
    
    foreach ($group in $errorGroups) {
        Write-Host "$($group.Count) pages: $($group.Name)" -ForegroundColor Red
    }
}

# Show accessible pages by section  
if ($accessible -gt 0) {
    Write-Host ""
    Write-Host "ACCESSIBLE PAGES BY SECTION:" -ForegroundColor Green
    Write-Host "============================" -ForegroundColor Green
    
    $accessiblePages = $results | Where-Object { $_.Status -eq "ACCESSIBLE" }
    $sectionGroups = $accessiblePages | Group-Object Section | Sort-Object Name
    
    foreach ($section in $sectionGroups) {
        Write-Host "$($section.Name): $($section.Count) pages" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "Detailed results saved to: $outputPath" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor White
Write-Host "1. Review error pages - may need route definitions" -ForegroundColor Gray
Write-Host "2. Check authentication/permission issues" -ForegroundColor Gray
Write-Host "3. Test parametric routes manually" -ForegroundColor Gray
Write-Host ""
Write-Host "To run with detailed output: .\scripts\hrm-live-test.ps1 -DetailedOutput" -ForegroundColor Gray