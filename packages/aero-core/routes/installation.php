<?php

/**
 * Installation Routes (Standalone Mode)
 *
 * These routes are only loaded when the application is not installed.
 * After installation, these routes are never loaded - web.php routes take over instead.
 * 
 * BootstrapGuard middleware handles:
 * - Redirecting root / to /install if not installed
 * - Forcing file-based sessions during installation
 * - Blocking normal routes until installation completes
 */

use Aero\Core\Http\Controllers\InstallationController;
use Illuminate\Support\Facades\Route;

Route::prefix('install')->name('install.')->group(function () {
    // Installation wizard routes
    Route::get('/', [InstallationController::class, 'index'])->name('index');
    Route::get('/license', [InstallationController::class, 'license'])->name('license');
    Route::post('/validate-license', [InstallationController::class, 'validateLicense'])->name('validate-license');
    Route::get('/requirements', [InstallationController::class, 'requirements'])->name('requirements');
    Route::get('/database', [InstallationController::class, 'database'])->name('database');
    Route::post('/test-database', [InstallationController::class, 'testDatabase'])->name('test-database');
    Route::get('/application', [InstallationController::class, 'application'])->name('application');
    Route::post('/save-application', [InstallationController::class, 'saveApplication'])->name('save-application');
    Route::post('/test-email', [InstallationController::class, 'testEmail'])->name('test-email');
    Route::get('/admin', [InstallationController::class, 'admin'])->name('admin');
    Route::post('/save-admin', [InstallationController::class, 'saveAdmin'])->name('save-admin');
    Route::post('/install', [InstallationController::class, 'install'])->name('process');
    Route::get('/progress', [InstallationController::class, 'progress'])->name('progress');
});
