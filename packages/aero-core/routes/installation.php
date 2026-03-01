<?php

/**
 * Unified Installation Routes
 *
 * These routes handle the installation wizard for both SaaS (Platform) and
 * Standalone (Core) modes. The controller automatically detects the mode
 * and renders the appropriate UI from the aero-ui package.
 *
 * Mode Detection:
 * - 'saas': When aero-platform package is installed and AERO_MODE=saas
 * - 'standalone': Default mode for single-tenant installations
 *
 * After installation, these routes are protected by the InstallationGuard middleware.
 */

use Aero\Core\Http\Controllers\UnifiedInstallationController;
use Illuminate\Support\Facades\Route;

Route::prefix('install')->group(function () {

    // ==========================================================================
    // Page routes (render Inertia pages from aero-ui)
    // ==========================================================================

    // Main entry point - uses 'installation.' prefix for consistency with Platform
    Route::get('/', [UnifiedInstallationController::class, 'welcome'])->name('installation.index');
    Route::get('/license', [UnifiedInstallationController::class, 'license'])->name('installation.license');
    Route::get('/requirements', [UnifiedInstallationController::class, 'requirements'])->name('installation.requirements');
    Route::get('/database', [UnifiedInstallationController::class, 'database'])->name('installation.database');
    Route::get('/settings', [UnifiedInstallationController::class, 'settings'])->name('installation.settings');
    Route::get('/platform', [UnifiedInstallationController::class, 'settings'])->name('installation.platform');
    Route::get('/admin', [UnifiedInstallationController::class, 'admin'])->name('installation.admin');
    Route::get('/review', [UnifiedInstallationController::class, 'review'])->name('installation.review');
    Route::get('/processing', [UnifiedInstallationController::class, 'processing'])->name('installation.processing');
    Route::get('/complete', [UnifiedInstallationController::class, 'complete'])->name('installation.complete');

    // ==========================================================================
    // API routes (AJAX calls from React UI)
    // ==========================================================================

    Route::post('/validate-license', [UnifiedInstallationController::class, 'validateLicense'])->name('installation.validate-license');
    Route::get('/check-requirements', [UnifiedInstallationController::class, 'recheckRequirements'])->name('installation.check-requirements');
    Route::post('/recheck-requirements', [UnifiedInstallationController::class, 'recheckRequirements'])->name('installation.recheck-requirements');
    Route::post('/test-server', [UnifiedInstallationController::class, 'testDatabaseServer'])->name('installation.test-server');
    Route::post('/test-database', [UnifiedInstallationController::class, 'testDatabaseServer'])->name('installation.test-database');
    Route::post('/list-databases', [UnifiedInstallationController::class, 'listDatabases'])->name('installation.list-databases');
    Route::post('/create-database', [UnifiedInstallationController::class, 'createDatabase'])->name('installation.create-database');
    Route::post('/save-database', [UnifiedInstallationController::class, 'saveDatabase'])->name('installation.save-database');
    Route::post('/save-platform', [UnifiedInstallationController::class, 'saveSettings'])->name('installation.save-platform');
    Route::post('/save-settings', [UnifiedInstallationController::class, 'saveSettings'])->name('installation.save-settings');
    Route::post('/save-admin', [UnifiedInstallationController::class, 'saveAdmin'])->name('installation.save-admin');
    Route::post('/execute', [UnifiedInstallationController::class, 'execute'])->name('installation.execute');
    Route::post('/install', [UnifiedInstallationController::class, 'execute'])->name('installation.install');
    Route::get('/progress', [UnifiedInstallationController::class, 'progress'])->name('installation.progress');
    Route::post('/cleanup', [UnifiedInstallationController::class, 'cleanup'])->name('installation.cleanup');
    Route::post('/retry', [UnifiedInstallationController::class, 'retry'])->name('installation.retry');
    Route::post('/test-email', [UnifiedInstallationController::class, 'testEmail'])->name('installation.test-email');

    // ==========================================================================
    // Legacy route aliases (backward compatibility with old install.* names)
    // ==========================================================================

    Route::get('/', [UnifiedInstallationController::class, 'welcome'])->name('install.index');
    Route::get('/license', [UnifiedInstallationController::class, 'license'])->name('install.license');
    Route::get('/requirements', [UnifiedInstallationController::class, 'requirements'])->name('install.requirements');
    Route::get('/database', [UnifiedInstallationController::class, 'database'])->name('install.database');
    Route::get('/application', [UnifiedInstallationController::class, 'settings'])->name('install.application');
    Route::get('/admin', [UnifiedInstallationController::class, 'admin'])->name('install.admin');
    Route::get('/complete', [UnifiedInstallationController::class, 'complete'])->name('install.complete');
    Route::post('/validate-license', [UnifiedInstallationController::class, 'validateLicense'])->name('install.validate-license');
    Route::post('/test-database', [UnifiedInstallationController::class, 'testDatabaseServer'])->name('install.test-database');
    Route::post('/save-application', [UnifiedInstallationController::class, 'saveSettings'])->name('install.save-application');
    Route::post('/save-admin', [UnifiedInstallationController::class, 'saveAdmin'])->name('install.save-admin');
    Route::post('/', [UnifiedInstallationController::class, 'execute'])->name('install.process');
    Route::get('/progress', [UnifiedInstallationController::class, 'progress'])->name('install.progress');
    Route::post('/test-email', [UnifiedInstallationController::class, 'testEmail'])->name('install.test-email');
});
