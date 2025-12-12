<?php

use Aero\Core\Http\Controllers\Api\UserApiController;
use Aero\Core\Http\Controllers\Api\RoleApiController;
use Aero\Core\Http\Controllers\Api\ModuleApiController;
use Aero\Platform\Http\Controllers\ErrorLogController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Aero Core API Routes
|--------------------------------------------------------------------------
|
| API routes for Aero Core functionality.
| Requires Sanctum authentication.
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

// Error Reporting API - receives errors from standalone installations
Route::prefix('v1')->name('api.v1.')->group(function () {
    // POST /api/v1/error-logs - Receive error from remote installation
    Route::post('/error-logs', [ErrorLogController::class, 'receiveRemoteError'])
        ->name('error-logs.receive')
        ->middleware('throttle:60,1'); // Rate limit: 60 requests per minute
});

/*
|--------------------------------------------------------------------------
| Authenticated API Routes
|--------------------------------------------------------------------------
*/
Route::middleware(['auth:sanctum'])->group(function () {
    // User API
    Route::prefix('users')->name('users.')->group(function () {
        Route::get('/', [UserApiController::class, 'index'])->name('index');
        Route::get('/{user}', [UserApiController::class, 'show'])->name('show');
        Route::post('/', [UserApiController::class, 'store'])->name('store');
        Route::patch('/{user}', [UserApiController::class, 'update'])->name('update');
        Route::delete('/{user}', [UserApiController::class, 'destroy'])->name('destroy');
    });

    // Role API
    Route::prefix('roles')->name('roles.')->group(function () {
        Route::get('/', [RoleApiController::class, 'index'])->name('index');
        Route::get('/{role}', [RoleApiController::class, 'show'])->name('show');
        Route::get('/{role}/access-tree', [RoleApiController::class, 'getAccessTree'])->name('access-tree');
    });

    // Module Access API
    Route::prefix('modules')->name('modules.')->group(function () {
        Route::get('/', [ModuleApiController::class, 'index'])->name('index');
        Route::get('/accessible', [ModuleApiController::class, 'accessible'])->name('accessible');
        Route::get('/{module}', [ModuleApiController::class, 'show'])->name('show');
    });

    // Error Logs Admin API (authenticated)
    Route::prefix('v1/error-logs')->name('api.v1.error-logs.')->group(function () {
        Route::get('/statistics', [ErrorLogController::class, 'statistics'])->name('statistics');
        Route::get('/domain-statistics', [ErrorLogController::class, 'domainStatistics'])->name('domain-statistics');
    });
});
