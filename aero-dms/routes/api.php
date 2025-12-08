<?php

use Illuminate\Support\Facades\Route;
use Aero\Dms\Http\Controllers\DMSController;

/*
|--------------------------------------------------------------------------
| DMS API Routes
|--------------------------------------------------------------------------
|
| API routes for the Document Management System module.
|
*/

Route::middleware(['api', 'tenant', 'auth:sanctum'])->group(function () {
    Route::prefix('dms')->name('api.dms.')->group(function () {
        // Document CRUD
        Route::apiResource('documents', DMSController::class);
        
        // Search
        Route::get('/search', [DMSController::class, 'search'])->name('search');
        
        // Statistics
        Route::get('/statistics', [DMSController::class, 'statistics'])->name('statistics');
    });
});
