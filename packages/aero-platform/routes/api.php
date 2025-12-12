<?php

declare(strict_types=1);

use Aero\Platform\Http\Controllers\ErrorLogController;
use Aero\Platform\Http\Controllers\PlanController;
use Aero\Platform\Http\Controllers\TenantController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Aero Platform API Routes
|--------------------------------------------------------------------------
|
| API routes for Aero Platform functionality.
| These routes handle error reporting, tenant management, and platform status.
|
*/

/*
|--------------------------------------------------------------------------
| Public API Routes (No Auth Required)
|--------------------------------------------------------------------------
|
| These routes are accessible without authentication but may require
| other forms of validation (e.g., license key headers).
|
*/

Route::prefix('v1')->name('v1.')->group(function () {

    // Error Reporting API - receives errors from standalone installations
    Route::post('/error-logs', [ErrorLogController::class, 'receiveRemoteError'])
        ->name('error-logs.receive')
        ->middleware('throttle:60,1');

    // Platform health check
    Route::get('/health', function () {
        return response()->json([
            'status' => 'ok',
            'timestamp' => now()->toIso8601String(),
        ]);
    })->name('health');

    // Public plans list (for registration page)
    Route::get('/plans', [PlanController::class, 'publicIndex'])
        ->name('plans.public');

    // Check subdomain availability
    Route::post('/check-subdomain', [TenantController::class, 'checkSubdomain'])
        ->middleware('throttle:30,1')
        ->name('check-subdomain');

});

/*
|--------------------------------------------------------------------------
| Authenticated API Routes (Landlord Guard)
|--------------------------------------------------------------------------
*/
Route::middleware(['auth:landlord'])->prefix('v1')->name('v1.')->group(function () {

    // Tenant Management API
    Route::prefix('tenants')->name('tenants.')->group(function () {
        Route::get('/', [TenantController::class, 'index'])->name('index');
        Route::get('/stats', [TenantController::class, 'stats'])->name('stats');
        Route::get('/{tenant}', [TenantController::class, 'show'])->name('show');
        Route::post('/', [TenantController::class, 'store'])->name('store');
        Route::put('/{tenant}', [TenantController::class, 'update'])->name('update');
        Route::delete('/{tenant}', [TenantController::class, 'destroy'])->name('destroy');
        Route::post('/{tenant}/suspend', [TenantController::class, 'suspend'])->name('suspend');
        Route::post('/{tenant}/activate', [TenantController::class, 'activate'])->name('activate');
        Route::post('/{tenant}/archive', [TenantController::class, 'archive'])->name('archive');
    });

    // Plans Management API
    Route::prefix('plans')->name('plans.')->group(function () {
        Route::get('/', [PlanController::class, 'index'])->name('index');
        Route::get('/{plan}', [PlanController::class, 'show'])->name('show');
        Route::post('/', [PlanController::class, 'store'])->name('store');
        Route::put('/{plan}', [PlanController::class, 'update'])->name('update');
        Route::delete('/{plan}', [PlanController::class, 'destroy'])->name('destroy');
    });

    // Error Logs API
    Route::prefix('error-logs')->name('error-logs.')->group(function () {
        Route::get('/', [ErrorLogController::class, 'index'])->name('index');
        Route::get('/statistics', [ErrorLogController::class, 'statistics'])->name('statistics');
        Route::get('/domain-statistics', [ErrorLogController::class, 'domainStatistics'])->name('domain-statistics');
        Route::get('/{errorLog}', [ErrorLogController::class, 'show'])->name('show');
        Route::post('/{errorLog}/resolve', [ErrorLogController::class, 'resolve'])->name('resolve');
        Route::delete('/{errorLog}', [ErrorLogController::class, 'destroy'])->name('destroy');
        Route::post('/bulk-resolve', [ErrorLogController::class, 'bulkResolve'])->name('bulk-resolve');
        Route::post('/bulk-destroy', [ErrorLogController::class, 'bulkDestroy'])->name('bulk-destroy');
    });
});
