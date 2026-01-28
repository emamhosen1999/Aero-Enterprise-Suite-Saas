# HRM Navigation Testing Summary Report
param(
    [string]$BaseDir = "d:\laragon\www\Aero-Enterprise-Suite-Saas"
)

Write-Host "HRM Navigation Testing Summary Report" -ForegroundColor Green
Write-Host "====================================" -ForegroundColor Green

# Check if verification files exist
$verificationFile = Join-Path $BaseDir "hrm_pages_verification.csv"
$routeTestFile = Join-Path $BaseDir "hrm_route_testing_results.csv"

if (-not (Test-Path $verificationFile)) {
    Write-Error "Please run hrm-verify-clean.ps1 first"
    exit 1
}

$data = Import-Csv $verificationFile

Write-Host ""
Write-Host "EXECUTIVE SUMMARY" -ForegroundColor Cyan
Write-Host "=================" -ForegroundColor Cyan

$total = $data.Count
$found = ($data | Where-Object { $_.Status -eq "Found" }).Count
$missing = $total - $found
$coverage = [math]::Round(($found / $total) * 100, 2)

Write-Host "Total HRM Navigation Items: $total" -ForegroundColor White
Write-Host "Pages Found: $found" -ForegroundColor Green
Write-Host "Pages Missing: $missing" -ForegroundColor Red
Write-Host "Coverage: $coverage%" -ForegroundColor $(if($coverage -gt 80){"Green"}elseif($coverage -gt 60){"Yellow"}else{"Red"})

# Group by section
Write-Host ""
Write-Host "SECTION BREAKDOWN" -ForegroundColor Cyan
Write-Host "=================" -ForegroundColor Cyan

$sections = $data | Group-Object Section | Sort-Object Name
foreach ($section in $sections) {
    $sectionFound = ($section.Group | Where-Object { $_.Status -eq "Found" }).Count
    $sectionTotal = $section.Group.Count
    $sectionCoverage = [math]::Round(($sectionFound / $sectionTotal) * 100, 1)
    
    $color = if ($sectionCoverage -eq 100) { "Green" } elseif ($sectionCoverage -gt 80) { "Yellow" } else { "Red" }
    Write-Host "$($section.Name): $sectionFound/$sectionTotal ($sectionCoverage%)" -ForegroundColor $color
}

Write-Host ""
Write-Host "CRITICAL MISSING PAGES" -ForegroundColor Red
Write-Host "======================" -ForegroundColor Red

$missingPages = $data | Where-Object { $_.Status -eq "Missing" } | Sort-Object Section, Component
$priorityMissing = @(
    "My Expenses",
    "Employee Directory", 
    "Attendance", 
    "Leave Management",
    "Payroll",
    "Recruitment",
    "Performance"
)

foreach ($missing in $missingPages) {
    $isPriority = $priorityMissing | Where-Object { $missing.Component -like "*$_*" -or $missing.Section -like "*$_*" }
    $marker = if ($isPriority) { "[HIGH PRIORITY]" } else { "[MEDIUM]" }
    $color = if ($isPriority) { "Red" } else { "Yellow" }
    
    Write-Host "$marker $($missing.Section) -> $($missing.Component)" -ForegroundColor $color
    Write-Host "  Expected: $($missing.'Expected Path')" -ForegroundColor Gray
    Write-Host ""
}

Write-Host ""
Write-Host "IMPLEMENTATION ROADMAP" -ForegroundColor Cyan
Write-Host "======================" -ForegroundColor Cyan

Write-Host ""
Write-Host "Phase 1 - Core Self-Service Features:" -ForegroundColor Yellow
Write-Host "- My Expenses page (employee expense claims)" -ForegroundColor White

Write-Host ""
Write-Host "Phase 2 - Employee Management:" -ForegroundColor Yellow
Write-Host "- Custom Fields management" -ForegroundColor White

Write-Host ""
Write-Host "Phase 3 - Attendance & Time Management:" -ForegroundColor Yellow
Write-Host "- Attendance Device/IP/Geo Rules" -ForegroundColor White
Write-Host "- Overtime Rules" -ForegroundColor White
Write-Host "- My Attendance (personal view)" -ForegroundColor White

Write-Host ""
Write-Host "Phase 4 - Leave Management:" -ForegroundColor Yellow
Write-Host "- Leave Balances management" -ForegroundColor White
Write-Host "- Leave Policies configuration" -ForegroundColor White

Write-Host ""
Write-Host "Phase 5 - Payroll System:" -ForegroundColor Yellow
Write-Host "- Tax Setup and IT/Tax Declarations" -ForegroundColor White
Write-Host "- Loan & Advance Management" -ForegroundColor White
Write-Host "- Bank File Generator" -ForegroundColor White

Write-Host ""
Write-Host "Phase 6 - Recruitment & Performance:" -ForegroundColor Yellow
Write-Host "- Complete Recruitment pipeline (Applicants, Interviews, Offers)" -ForegroundColor White
Write-Host "- Performance Management (Appraisals, 360° Reviews)" -ForegroundColor White

Write-Host ""
Write-Host "Phase 7 - Training & Analytics:" -ForegroundColor Yellow
Write-Host "- Training Programs and Certifications" -ForegroundColor White
Write-Host "- Workforce Analytics and Reporting" -ForegroundColor White

Write-Host ""
Write-Host "TESTING COMMANDS" -ForegroundColor Cyan
Write-Host "================" -ForegroundColor Cyan
Write-Host "To re-run the page verification:" -ForegroundColor White
Write-Host "  .\scripts\hrm-verify-clean.ps1" -ForegroundColor Gray
Write-Host ""
Write-Host "To test routes and accessibility:" -ForegroundColor White  
Write-Host "  .\scripts\test-hrm-routes.ps1" -ForegroundColor Gray
Write-Host ""
Write-Host "To run comprehensive navigation tests:" -ForegroundColor White
Write-Host "  .\scripts\verify-hrm-navigation-advanced.ps1 -TestRoutes" -ForegroundColor Gray

Write-Host ""
Write-Host "FILES GENERATED:" -ForegroundColor Cyan
Write-Host "===============" -ForegroundColor Cyan
Write-Host "- hrm_navigation_pages.csv (Master navigation list)" -ForegroundColor White
Write-Host "- hrm_pages_verification.csv (Page existence results)" -ForegroundColor White
Write-Host "- hrm_route_testing_results.csv (Route testing results)" -ForegroundColor White

$date = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
Write-Host ""
Write-Host "Report generated: $date" -ForegroundColor Gray