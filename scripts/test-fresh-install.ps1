# Test Fresh Laravel Installation with HRM Module

param(
    [string]$AppName = "aero-test-hrm",
    [string]$InstallPath = "C:\laragon\www"
)

$ErrorActionPreference = "Stop"
$AppPath = Join-Path $InstallPath $AppName

Write-Host "====================================" -ForegroundColor Cyan
Write-Host " Aero Fresh Install Test Script" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan
Write-Host ""

if (Test-Path $AppPath) {
    Write-Host "[!] App already exists at: $AppPath" -ForegroundColor Yellow
    $response = Read-Host "Delete and recreate? (y/N)"
    if ($response -eq "y") {
        Write-Host "[*] Removing existing app..." -ForegroundColor Yellow
        Remove-Item -Path $AppPath -Recurse -Force
    } else {
        Write-Host "[X] Aborted." -ForegroundColor Red
        exit 1
    }
}

Write-Host "[+] Creating new Laravel app: $AppName" -ForegroundColor Green
Set-Location $InstallPath
composer create-project laravel/laravel $AppName --prefer-dist --no-interaction

if (-not (Test-Path $AppPath)) {
    Write-Host "[X] Failed to create Laravel app" -ForegroundColor Red
    exit 1
}

Set-Location $AppPath
Write-Host "[OK] Laravel app created" -ForegroundColor Green
Write-Host ""

Write-Host "[+] Configuring database..." -ForegroundColor Green
# Convert hyphens to underscores for MySQL database name
$dbName = $AppName -replace '-', '_'
$envContent = Get-Content ".env"
$envContent = $envContent -replace "DB_DATABASE=.*", "DB_DATABASE=$dbName"
$envContent = $envContent -replace "DB_USERNAME=.*", "DB_USERNAME=root"
$envContent = $envContent -replace "DB_PASSWORD=.*", "DB_PASSWORD="
Set-Content ".env" $envContent

Write-Host "[+] Creating database..." -ForegroundColor Green
# Try multiple common Laragon MySQL paths
$mysqlPaths = @(
    "D:\laragon\bin\mysql\mysql-8.4.3-winx64\bin\mysql.exe",
    "C:\laragon\bin\mysql\mysql-8.0.30-winx64\bin\mysql.exe",
    "D:\laragon\bin\mysql\mysql-8.0.30-winx64\bin\mysql.exe"
)

$mysqlPath = $null
foreach ($path in $mysqlPaths) {
    if (Test-Path $path) {
        $mysqlPath = $path
        break
    }
}

if ($mysqlPath) {
    & $mysqlPath -u root -e "DROP DATABASE IF EXISTS ``$dbName``; CREATE DATABASE ``$dbName`` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
    Write-Host "[OK] Database created: $dbName" -ForegroundColor Green
} else {
    Write-Host "[!] MySQL not found, create database manually" -ForegroundColor Yellow
}
Write-Host ""

Write-Host "[+] Adding Aero packages to composer..." -ForegroundColor Green
$composerJson = Get-Content "composer.json" | ConvertFrom-Json
if (-not $composerJson.repositories) {
    $composerJson | Add-Member -MemberType NoteProperty -Name repositories -Value @()
}
$composerJson.repositories = @(
    @{
        type = "path"
        url = "../Aero-Enterprise-Suite-Saas/packages/*"
        options = @{ symlink = $true }
    }
)
# Set minimum-stability to dev to allow dev dependencies
$composerJson.'minimum-stability' = "dev"
$composerJson.'prefer-stable' = $true
$composerJson | ConvertTo-Json -Depth 10 | Set-Content "composer.json"
Write-Host "[OK] Composer configured" -ForegroundColor Green
Write-Host ""

Write-Host "[+] Installing Aero packages..." -ForegroundColor Green
composer require aero/core:@dev aero/hrm:@dev --no-interaction
Write-Host "[OK] Packages installed" -ForegroundColor Green
Write-Host ""

Write-Host "[+] Removing test app migrations (using package migrations only)..." -ForegroundColor Green
Remove-Item -Path "database/migrations/*" -Force -ErrorAction SilentlyContinue
Write-Host "[OK] Test app migrations removed" -ForegroundColor Green
Write-Host ""

Write-Host "[+] Publishing configurations..." -ForegroundColor Green
php artisan vendor:publish --tag=aero-core-config --force
php artisan vendor:publish --tag=aero-hrm-config --force
Write-Host "[OK] Configurations published" -ForegroundColor Green
Write-Host ""

Write-Host "[+] Running migrations..." -ForegroundColor Green
php artisan migrate --force
Write-Host "[OK] Migrations completed" -ForegroundColor Green
Write-Host ""

Write-Host "[+] Publishing Core assets..." -ForegroundColor Green
php artisan vendor:publish --tag=aero-core-assets --force
Write-Host "[OK] Core assets published" -ForegroundColor Green
Write-Host ""

Write-Host "[+] Installing frontend dependencies..." -ForegroundColor Green
if (Test-Path "package.json") {
    npm install
    Write-Host "[OK] Frontend dependencies installed" -ForegroundColor Green
} else {
    Write-Host "[!] No package.json found, skipping npm install" -ForegroundColor Yellow
}
Write-Host ""

Write-Host "[+] Building frontend assets..." -ForegroundColor Green
if (Test-Path "vite.config.js") {
    npm run build
    Write-Host "[OK] Frontend assets built" -ForegroundColor Green
} else {
    Write-Host "[!] No vite.config.js found, skipping build" -ForegroundColor Yellow
}
Write-Host ""

Write-Host "[+] Creating admin user..." -ForegroundColor Green
Write-Host "[i] Core seeders will be called automatically by the package" -ForegroundColor Cyan
php artisan db:seed --force
Write-Host ""
Write-Host "[i] Creating admin user manually with Core User model..." -ForegroundColor Cyan
php artisan tinker --execute="\Aero\Core\Models\User::create(['name' => 'Admin User', 'user_name' => 'admin', 'email' => 'admin@example.com', 'password' => bcrypt('password'), 'email_verified_at' => now(), 'is_active' => true])"
Write-Host "[OK] Admin user created (admin@example.com / password)" -ForegroundColor Green
Write-Host ""

Write-Host "====================================" -ForegroundColor Cyan
Write-Host " Installation Complete!" -ForegroundColor Green
Write-Host "====================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "App: $AppPath" -ForegroundColor White
Write-Host "Database: $AppName" -ForegroundColor White
Write-Host ""
Write-Host "Next: cd $AppPath && php artisan serve" -ForegroundColor Yellow
Write-Host ""
