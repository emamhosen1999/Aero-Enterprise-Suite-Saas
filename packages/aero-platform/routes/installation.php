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

// Early exit if already installed
if (file_exists(storage_path('installed'))) {
    Route::get('/install', function () {
        return redirect()->route('login');
    });
    // Stop processing if this file is included directly
    return;
}

Route::prefix('install')->name('installation.')->group(function () {
    
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

        // Step 8: Installation complete
        Route::get('/complete', [InstallationController::class, 'complete'])->name('complete');

        // API: Get installation progress (for recovery)
        Route::get('/progress', [InstallationController::class, 'getInstallationProgress'])->name('progress');
    });
});