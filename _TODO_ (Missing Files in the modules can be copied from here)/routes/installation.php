<?php

use Aero\Platform\Http\Controllers\InstallationController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Installation Routes
|--------------------------------------------------------------------------
|
| These routes handle the initial platform installation wizard.
| They are accessible only when the platform has not been installed yet.
| File-based sessions are enforced by ForceFileSessionForInstallation middleware.
|
*/

// Check if already installed and redirect to login
if (file_exists(storage_path('installed'))) {
    Route::get('/install', function () {
        return redirect('/login');
    });

    return;
}

Route::prefix('install')->name('installation.')->group(function () {
    // Step 1: Welcome page
    Route::get('/', [InstallationController::class, 'index'])->name('index');

    // Step 2: Secret code verification
    Route::get('/secret', [InstallationController::class, 'showSecretVerification'])->name('secret');
    Route::post('/verify-secret', [InstallationController::class, 'verifySecret'])->name('verify-secret');

    // Step 3: System requirements check
    Route::get('/requirements', [InstallationController::class, 'showRequirements'])->name('requirements');

    // Step 4: Database configuration
    Route::get('/database', [InstallationController::class, 'showDatabase'])->name('database');
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
});
