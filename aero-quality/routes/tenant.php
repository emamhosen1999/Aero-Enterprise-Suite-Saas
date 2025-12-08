<?php

use Illuminate\Support\Facades\Route;
use Aero\Quality\Http\Controllers\QualityController;
use Aero\Quality\Http\Controllers\InspectionController;
use Aero\Quality\Http\Controllers\NCRController;

/*
|--------------------------------------------------------------------------
| Quality Management Tenant Routes
|--------------------------------------------------------------------------
*/

Route::middleware(['web', 'tenant', 'auth'])->prefix('quality')->name('quality.')->group(function () {
    // Dashboard
    Route::get('/dashboard', [QualityController::class, 'dashboard'])->name('dashboard');
    Route::get('/', [QualityController::class, 'index'])->name('index');
    
    // Inspections
    Route::resource('inspections', InspectionController::class);
    
    // Non-Conformance Reports
    Route::resource('ncrs', NCRController::class);
});
