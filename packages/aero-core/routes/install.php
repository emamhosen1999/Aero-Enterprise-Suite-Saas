<?php

use Aero\Core\Http\Controllers\InstallationController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Installation Routes (Core Package)
|--------------------------------------------------------------------------
|
| These routes are ONLY loaded when the system is NOT installed.
| They work on ANY domain (platform, tenant, or standalone).
|
| After installation completes, these routes are no longer loaded
| and the BootstrapGuard middleware prevents access.
|
*/

Route::get('/install', [InstallationController::class, 'index'])->name('install.index');
Route::post('/install', [InstallationController::class, 'install'])->name('install.process');

// Multi-step installation routes
Route::prefix('install')->name('install.')->group(function () {
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
    Route::get('/progress', [InstallationController::class, 'progress'])->name('progress');
});
