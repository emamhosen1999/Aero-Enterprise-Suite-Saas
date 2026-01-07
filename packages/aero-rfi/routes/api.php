<?php

use Aero\Rfi\Http\Controllers\LinearContinuityController;
use Aero\Rfi\Http\Controllers\RfiController;
use Illuminate\Support\Facades\Route;

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

    // RFI CRUD endpoints
    Route::get('/', [RfiController::class, 'index'])->name('index');
    Route::post('/', [RfiController::class, 'store'])->name('store');
    Route::get('{rfi}', [RfiController::class, 'show'])->name('show');
    Route::put('{rfi}', [RfiController::class, 'update'])->name('update');
    Route::delete('{rfi}', [RfiController::class, 'destroy'])->name('destroy');
    Route::post('{rfi}/approve', [RfiController::class, 'approve'])->name('approve');
    Route::post('{rfi}/reject', [RfiController::class, 'reject'])->name('reject');
    Route::post('{rfi}/override-continuity', [RfiController::class, 'overrideContinuity'])->name('override-continuity');

    // Standalone validation endpoints (PATENTABLE)
    Route::post('validate-gps', [RfiController::class, 'validateGps'])->name('validate-gps');
    Route::post('validate-continuity', [RfiController::class, 'validateContinuity'])->name('validate-continuity');

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
