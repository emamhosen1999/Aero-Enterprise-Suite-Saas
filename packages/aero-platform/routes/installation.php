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
 *
 * Security notes:
 * - Installation status is checked per-request in the controller methods,
 *   NOT at route-registration time, so route:cache is safe.
 * - All POST endpoints are rate-limited to prevent brute-force / enumeration.
 * - The canonical lock file is storage/app/aeos.installed (single source of truth).
 */

use Aero\Core\Http\Controllers\UnifiedInstallationController;
use Illuminate\Support\Facades\Route;

Route::prefix('install')->name('installation.')->group(function () {
    // -------------------------------------------------------------------------
    // Routes accessible regardless of installation state
    // -------------------------------------------------------------------------

    // /complete is only reachable post-install; the controller redirects to the
    // install wizard if accessed before installation completes.
    Route::get('/complete', [UnifiedInstallationController::class, 'complete'])->name('complete');

    // -------------------------------------------------------------------------
    // Installation wizard page routes (controller redirects away if installed)
    // -------------------------------------------------------------------------
    Route::get('/', [UnifiedInstallationController::class, 'welcome'])->name('index');
    Route::get('/requirements', [UnifiedInstallationController::class, 'requirements'])->name('requirements');
    Route::get('/database', [UnifiedInstallationController::class, 'database'])->name('database');
    Route::get('/platform', [UnifiedInstallationController::class, 'settings'])->name('platform');
    Route::get('/settings', [UnifiedInstallationController::class, 'settings'])->name('settings');
    Route::get('/admin', [UnifiedInstallationController::class, 'admin'])->name('admin');
    Route::get('/review', [UnifiedInstallationController::class, 'review'])->name('review');
    Route::get('/processing', [UnifiedInstallationController::class, 'processing'])->name('processing');

    // -------------------------------------------------------------------------
    // AJAX / API routes — all rate-limited to prevent brute-force & enumeration
    // -------------------------------------------------------------------------
    Route::middleware('throttle:30,1')->group(function () {
        Route::get('/check-requirements', [UnifiedInstallationController::class, 'recheckRequirements'])->name('check-requirements');
        Route::get('/progress', [UnifiedInstallationController::class, 'progress'])->name('progress');
    });

    Route::middleware('throttle:10,1')->group(function () {
        Route::post('/recheck-requirements', [UnifiedInstallationController::class, 'recheckRequirements'])->name('recheck-requirements');
        Route::post('/test-server', [UnifiedInstallationController::class, 'testDatabaseServer'])->name('test-server');
        Route::post('/test-database', [UnifiedInstallationController::class, 'testDatabaseServer'])->name('test-database');
        Route::post('/list-databases', [UnifiedInstallationController::class, 'listDatabases'])->name('list-databases');
        Route::post('/create-database', [UnifiedInstallationController::class, 'createDatabase'])->name('create-database');
        Route::post('/save-database', [UnifiedInstallationController::class, 'saveDatabase'])->name('save-database');
        Route::post('/save-platform', [UnifiedInstallationController::class, 'saveSettings'])->name('save-platform');
        Route::post('/save-admin', [UnifiedInstallationController::class, 'saveAdmin'])->name('save-admin');
        Route::post('/retry', [UnifiedInstallationController::class, 'retry'])->name('retry');
        Route::post('/test-email', [UnifiedInstallationController::class, 'testEmail'])->name('test-email');
        Route::post('/cleanup', [UnifiedInstallationController::class, 'cleanup'])->name('cleanup');
    });

    // Execute and install are strictly limited — 5 attempts per minute per IP
    Route::middleware('throttle:5,1')->group(function () {
        Route::post('/execute', [UnifiedInstallationController::class, 'execute'])->name('execute');
        Route::post('/install', [UnifiedInstallationController::class, 'execute'])->name('install');
    });

    // Already-installed fallback — wildcard MUST be registered last so it only
    // catches unknown sub-paths (e.g. /install/some-old-url).
    Route::get('/{any}', [UnifiedInstallationController::class, 'alreadyInstalled'])
        ->where('any', '.*')
        ->name('already-installed');
});
