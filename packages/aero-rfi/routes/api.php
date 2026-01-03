<?php

use Illuminate\Support\Facades\Route;
use Aero\Rfi\Http\Controllers\LinearContinuityController;

/*
|--------------------------------------------------------------------------
| RFI API Routes - PATENTABLE CORE IP
|--------------------------------------------------------------------------
|
| API endpoints for GPS validation, layer continuity checking, and
| permit validation. These routes power the patentable features.
|
*/

Route::prefix('api/rfi')->middleware(['auth:sanctum'])->name('rfi.')->group(function () {
    
    // Linear Continuity Validation (CORE IP)
    Route::prefix('linear-continuity')->name('linear-continuity.')->group(function () {
        Route::get('grid', [LinearContinuityController::class, 'getCompletionGrid'])->name('grid');
        Route::post('validate', [LinearContinuityController::class, 'validateContinuity'])->name('validate');
        Route::post('suggest-location', [LinearContinuityController::class, 'suggestNextLocation'])->name('suggest-location');
        Route::get('coverage', [LinearContinuityController::class, 'analyzeCoverage'])->name('coverage');
        Route::get('stats', [LinearContinuityController::class, 'getStats'])->name('stats');
    });

    // GPS Geofencing Validation (Anti-Fraud)
    Route::prefix('geofencing')->name('geofencing.')->group(function () {
        Route::post('validate', [LinearContinuityController::class, 'validateGPS'])->name('validate');
    });
});
