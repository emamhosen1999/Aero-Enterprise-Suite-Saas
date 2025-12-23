<?php

/**
 * Installation Routes
 *
 * These routes are loaded WITHOUT domain restriction to ensure the installation
 * wizard works on any domain (before PLATFORM_DOMAIN is configured).
 *
 * After installation, routes redirect to the main landing page.
 */

use Aero\Platform\Http\Controllers\InstallationController;
use Aero\Platform\Http\Middleware\EnsureInstallationVerified;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

$isInstalled = file_exists(storage_path('app/aeos.installed'));

// Complete route (always available - works after installation)
Route::get('/install/complete', [InstallationController::class, 'complete'])->name('installation.complete');

Route::prefix('install')->name('installation.')->group(function () use ($isInstalled) {
    if ($isInstalled) {
        // Already installed - redirect to landing
        Route::get('/', fn () => redirect('/'))
            ->name('index');
        Route::get('/{any}', fn () => Inertia::render('Platform/Installation/AlreadyInstalled'))
            ->where('any', '^(?!complete).*$');

        return;
    }

    // Step 1: Welcome page
    Route::get('/', [InstallationController::class, 'index'])->name('index');

    // Step 2: Secret code verification
    Route::get('/secret', [InstallationController::class, 'showSecretVerification'])->name('secret');
    Route::post('/verify-secret', [InstallationController::class, 'verifySecret'])->name('verify-secret');

    // Protected installation steps (require verified secret)
    Route::middleware([EnsureInstallationVerified::class])->group(function () {
        Route::get('/requirements', [InstallationController::class, 'showRequirements'])->name('requirements');
        Route::get('/database', [InstallationController::class, 'showDatabase'])->name('database');
        Route::post('/test-server', [InstallationController::class, 'testServerConnection'])->name('test-server');
        Route::post('/create-database', [InstallationController::class, 'createDatabase'])->name('create-database');
        Route::post('/test-database', [InstallationController::class, 'testDatabase'])->name('test-database');
        Route::get('/platform', [InstallationController::class, 'showPlatform'])->name('platform');
        Route::post('/save-platform', [InstallationController::class, 'savePlatform'])->name('save-platform');
        Route::post('/test-email', [InstallationController::class, 'testEmail'])->name('test-email');
        Route::post('/test-sms', [InstallationController::class, 'testSms'])->name('test-sms');
        Route::get('/admin', [InstallationController::class, 'showAdmin'])->name('admin');
        Route::post('/save-admin', [InstallationController::class, 'saveAdmin'])->name('save-admin');
        Route::get('/review', [InstallationController::class, 'showReview'])->name('review');
        Route::post('/install', [InstallationController::class, 'install'])->name('install');
        Route::get('/progress', [InstallationController::class, 'getInstallationProgress'])->name('progress');
    });
});
