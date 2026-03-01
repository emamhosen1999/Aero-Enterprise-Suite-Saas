<?php

use Aero\Core\Http\Middleware\InitializeTenancyIfNotCentral;
use Aero\Dms\Http\Controllers\DMSController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| DMS API Routes
|--------------------------------------------------------------------------
|
| API routes for the Document Management System module.
| NOTE: InitializeTenancyIfNotCentral MUST come before 'tenant' middleware
| to gracefully return 404 on central domains instead of crashing.
|
*/

Route::middleware(['api', InitializeTenancyIfNotCentral::class, 'tenant', 'auth:sanctum'])->group(function () {
    Route::prefix('dms')->name('api.dms.')->group(function () {
        // Document CRUD
        Route::apiResource('documents', DMSController::class);

        // Search
        Route::get('/search', [DMSController::class, 'search'])->name('search');

        // Statistics
        Route::get('/statistics', [DMSController::class, 'statistics'])->name('statistics');
    });
});
