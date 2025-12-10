<#
.SYNOPSIS
    AERO BUILD VALIDATOR (Windows Edition)
    "The CodeCanyon Gatekeeper"
#>

# Configuration
$DIST_DIR = "../dist"
$INSTALLER_ZIP = "Aero_HRM_Installer_v1.0.zip"
$MODULE_ZIP = "Aero_CRM_Module.zip"
$MAX_MODULE_SIZE_KB = 200

# Load Zip Assembly
Add-Type -AssemblyName System.IO.Compression.FileSystem

# Helper Function for Logging
function Log-Info($Message) { Write-Host "👉 $Message" -ForegroundColor Yellow }
function Log-Pass($Message) { Write-Host "[PASS] $Message" -ForegroundColor Green }
function Log-Fail($Message) { Write-Host "[FAIL] $Message" -ForegroundColor Red }
function Log-ErrorAndExit($Message) {
    Log-Fail $Message
    exit 1
}

# Clear Screen
Clear-Host
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "   AERO BUILD VALIDATOR (Windows)         " -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

# ==========================================
# 1. CHECK INSTALLER ZIP (The Main Product)
# ==========================================
Log-Info "Checking Installer ZIP ($INSTALLER_ZIP)..."

$InstallerPath = Join-Path $DIST_DIR $INSTALLER_ZIP

if (-not (Test-Path $InstallerPath)) {
    Log-ErrorAndExit "Installer ZIP not found at: $InstallerPath"
}

try {
    $zip = [System.IO.Compression.ZipFile]::OpenRead((Resolve-Path $InstallerPath))
    $entries = $zip.Entries

    # Check for .git folder
    if ($entries | Where-Object { $_.FullName -like "*/.git/*" }) {
        $zip.Dispose()
        Log-ErrorAndExit "Installer contains .git folder! Security Risk."
    } else {
        Log-Pass "No .git artifacts found."
    }

    # Check for Vendor Folder
    if ($entries | Where-Object { $_.FullName -like "*vendor/laravel/framework*" }) {
        Log-Pass "Vendor folder is present and looks populated."
    } else {
        $zip.Dispose()
        Log-ErrorAndExit "Vendor folder missing! (Run 'composer install' before zipping)"
    }

    # Check for Compiled Assets
    if ($entries | Where-Object { $_.FullName -like "*public/build/assets/app*" }) {
        Log-Pass "Core Frontend Assets (app.js) found."
    } else {
        $zip.Dispose()
        Log-ErrorAndExit "Core Frontend Assets missing! (Run 'npm run build' in aero-core)"
    }
    $zip.Dispose()
} catch {
    Log-ErrorAndExit "Error reading Installer ZIP: $_"
}

# ==========================================
# 2. CHECK MODULE ZIP (The Add-on)
# ==========================================
Log-Info "Checking Add-on ZIP ($MODULE_ZIP)..."

$ModulePath = Join-Path $DIST_DIR $MODULE_ZIP

if (-not (Test-Path $ModulePath)) {
    Log-ErrorAndExit "Module ZIP not found at: $ModulePath"
}

try {
    $zip = [System.IO.Compression.ZipFile]::OpenRead((Resolve-Path $ModulePath))
    $entries = $zip.Entries

    # Check for Vendor Folder (Should NOT exist)
    if ($entries | Where-Object { $_.FullName -like "*vendor/*" }) {
        $zip.Dispose()
        Log-ErrorAndExit "Module ZIP contains 'vendor' folder! It must be lightweight."
    } else {
        Log-Pass "Module is lightweight (No vendor folder)."
    }

    # Check for Compiled JS
    $jsEntry = $entries | Where-Object { $_.FullName -like "*dist/crm.js" } | Select-Object -First 1
    
    if ($jsEntry) {
        Log-Pass "Module JS Bundle (dist/crm.js) found."
        
        # ==========================================
        # 3. REACT EXTERNALIZATION CHECK
        # ==========================================
        Log-Info "Checking React Externalization..."

        # Check Size
        $sizeKB = [math]::Round($jsEntry.Length / 1024, 2)
        
        if ($sizeKB -gt $MAX_MODULE_SIZE_KB) {
            $zip.Dispose()
            Log-ErrorAndExit "Module JS is too large ($sizeKB KB). Expected < $MAX_MODULE_SIZE_KB KB.`nYou likely bundled React. Check vite.config.js externalization."
        } else {
            Log-Pass "Module JS size is healthy ($sizeKB KB)."
        }

        # Extract to temp to check content
        $tempFile = [System.IO.Path]::GetTempFileName()
        try {
            [System.IO.Compression.ZipFileExtensions]::ExtractToFile($jsEntry, $tempFile, $true)
            $content = Get-Content $tempFile -Raw

            if ($content -match "import" -or $content -match "from") {
                Log-Pass "Module uses External Imports (ES Module detected)."
            } else {
                Write-Host "[WARN] No 'import' statements found. Verification weak." -ForegroundColor Yellow
            }
        } finally {
            if (Test-Path $tempFile) { Remove-Item $tempFile }
        }

    } else {
        $zip.Dispose()
        Log-ErrorAndExit "Module JS Bundle missing! (Run 'npm run build' in aero-crm)"
    }
    $zip.Dispose()
} catch {
    Log-ErrorAndExit "Error reading Module ZIP: $_"
}

# ==========================================
# SUMMARY
# ==========================================
Write-Host "`n======================================" -ForegroundColor Green
Write-Host "✅  BUILD PASSED VALIDATION" -ForegroundColor Green
Write-Host "    Ready for CodeCanyon Upload." -ForegroundColor Green
Write-Host "======================================" -ForegroundColor Green