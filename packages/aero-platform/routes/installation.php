<?php

/**
 * Unified Installation Routes (SaaS/Platform Mode)
 *
 * These routes use the unified installation UI from aero-ui package.
 * The UnifiedInstallationController detects SaaS mode automatically.
 * 
 * For SaaS mode:
 * - No license validation step (managed through platform subscriptions)
 * - Platform settings instead of System settings
 * - Creates LandlordUser instead of regular User
 */

use Aero\Core\Http\Controllers\UnifiedInstallationController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

// Check if installed using the unified lock file location
$isInstalled = file_exists(base_path('storage/framework/.installed')) 
    || file_exists(storage_path('app/aeos.installed')); // Backward compatibility

Route::prefix('install')->name('installation.')->group(function () use ($isInstalled) {
    // The /complete route should ALWAYS be accessible (to show success after installation)
    Route::get('/complete', [UnifiedInstallationController::class, 'complete'])->name('complete');
    
    if ($isInstalled) {
        // Already installed - show already installed page
        Route::get('/', fn () => redirect('/admin'))
            ->name('index');
        Route::get('/{any}', [UnifiedInstallationController::class, 'alreadyInstalled'])
            ->where('any', '.*')
            ->name('already-installed');

        return;
    }

    // Page routes (Unified UI from aero-ui)
    Route::get('/', [UnifiedInstallationController::class, 'welcome'])->name('index');
    Route::get('/requirements', [UnifiedInstallationController::class, 'requirements'])->name('requirements');
    Route::get('/database', [UnifiedInstallationController::class, 'database'])->name('database');
    Route::get('/platform', [UnifiedInstallationController::class, 'settings'])->name('platform');
    Route::get('/settings', [UnifiedInstallationController::class, 'settings'])->name('settings');
    Route::get('/admin', [UnifiedInstallationController::class, 'admin'])->name('admin');
    Route::get('/review', [UnifiedInstallationController::class, 'review'])->name('review');
    Route::get('/processing', [UnifiedInstallationController::class, 'processing'])->name('processing');
    // Note: /complete route is defined at the top to be accessible even after installation
    
    // API routes (AJAX calls from React UI)
    Route::get('/check-requirements', [UnifiedInstallationController::class, 'recheckRequirements'])->name('check-requirements');
    Route::post('/recheck-requirements', [UnifiedInstallationController::class, 'recheckRequirements'])->name('recheck-requirements');
    Route::post('/test-server', [UnifiedInstallationController::class, 'testDatabaseServer'])->name('test-server');
    Route::post('/test-database', [UnifiedInstallationController::class, 'testDatabaseServer'])->name('test-database');
    Route::post('/list-databases', [UnifiedInstallationController::class, 'listDatabases'])->name('list-databases');
    Route::post('/create-database', [UnifiedInstallationController::class, 'createDatabase'])->name('create-database');
    Route::post('/save-database', [UnifiedInstallationController::class, 'saveDatabase'])->name('save-database');
    Route::post('/save-platform', [UnifiedInstallationController::class, 'saveSettings'])->name('save-platform');
    Route::post('/save-admin', [UnifiedInstallationController::class, 'saveAdmin'])->name('save-admin');
    Route::post('/execute', [UnifiedInstallationController::class, 'execute'])->name('execute');
    Route::post('/install', [UnifiedInstallationController::class, 'execute'])->name('install');
    Route::get('/progress', [UnifiedInstallationController::class, 'progress'])->name('progress');
    Route::post('/cleanup', [UnifiedInstallationController::class, 'cleanup'])->name('cleanup');
    Route::post('/retry', [UnifiedInstallationController::class, 'retry'])->name('retry');
    Route::post('/test-email', [UnifiedInstallationController::class, 'testEmail'])->name('test-email');
});
