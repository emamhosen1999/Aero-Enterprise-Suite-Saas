<?php

use Aero\Platform\Http\Controllers\InstallationController;
use Aero\Platform\Http\Middleware\EnsureInstallationVerified;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Installation Routes
|--------------------------------------------------------------------------
|
| These routes handle the initial platform installation wizard.
|
*/

// Check if already installed
$isInstalled = file_exists(storage_path('installed'));

// Always register the complete route OUTSIDE the conditional (so it works after installation)
Route::prefix('install')->name('installation.')->group(function () {
    Route::get('/complete', [InstallationController::class, 'complete'])->name('complete');
});

// Handle the rest of the installation routes
Route::prefix('install')->name('installation.')->group(function () use ($isInstalled) {
    // If already installed, redirect main install route to login
    if ($isInstalled) {
        Route::get('/', function () {
            return redirect()->route('login');
        })->name('index');
        
        // Show "Already Installed" page for other install routes (except complete which is registered above)
        Route::get('/{any}', function () {
            return \Inertia\Inertia::render('Platform/Installation/AlreadyInstalled');
        })->where('any', '^(?!complete).*$');
        
        return;
    }
    
    /* * PUBLIC STAGE
     * Accessible without verification
     */
    
    // Step 1: Welcome page
    Route::get('/', [InstallationController::class, 'index'])->name('index');

    // Step 2: Secret code verification
    Route::get('/secret', [InstallationController::class, 'showSecretVerification'])->name('secret');
    Route::post('/verify-secret', [InstallationController::class, 'verifySecret'])->name('verify-secret');

    /* * PROTECTED STAGE
     * Requires 'installation_verified' session key via Middleware
     */
    Route::middleware([EnsureInstallationVerified::class])->group(function () {
        
        // Step 3: System requirements check
        Route::get('/requirements', [InstallationController::class, 'showRequirements'])->name('requirements');

        // Step 4: Database configuration
        Route::get('/database', [InstallationController::class, 'showDatabase'])->name('database');
        Route::post('/test-server', [InstallationController::class, 'testServerConnection'])->name('test-server');
        Route::post('/create-database', [InstallationController::class, 'createDatabase'])->name('create-database');
        Route::post('/test-database', [InstallationController::class, 'testDatabase'])->name('test-database');

        // Step 5: Platform settings
        Route::get('/platform', [InstallationController::class, 'showPlatform'])->name('platform');
        Route::post('/save-platform', [InstallationController::class, 'savePlatform'])->name('save-platform');
        Route::post('/test-email', [InstallationController::class, 'testEmail'])->name('test-email');
        Route::post('/test-sms', [InstallationController::class, 'testSms'])->name('test-sms');

        // Step 6: Admin account creation
        Route::get('/admin', [InstallationController::class, 'showAdmin'])->name('admin');
        Route::post('/save-admin', [InstallationController::class, 'saveAdmin'])->name('save-admin');

        // Step 7: Review and install
        Route::get('/review', [InstallationController::class, 'showReview'])->name('review');
        Route::post('/install', [InstallationController::class, 'install'])->name('install');

        // Step 8: Installation complete (already registered above, no duplicate needed)

        // API: Get installation progress (for recovery)
        Route::get('/progress', [InstallationController::class, 'getInstallationProgress'])->name('progress');
    });
});