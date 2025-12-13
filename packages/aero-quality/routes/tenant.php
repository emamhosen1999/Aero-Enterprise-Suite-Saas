<?php

use Illuminate\Support\Facades\Route;
use Aero\Quality\Http\Controllers\QualityController;
use Aero\Quality\Http\Controllers\InspectionController;
use Aero\Quality\Http\Controllers\NCRController;
use Aero\Core\Http\Middleware\InitializeTenancyIfNotCentral;

/*
|--------------------------------------------------------------------------
| Quality Management Tenant Routes
|--------------------------------------------------------------------------
| NOTE: InitializeTenancyIfNotCentral MUST come before 'tenant' middleware
| to gracefully return 404 on central domains instead of crashing.
*/

Route::middleware(['web', InitializeTenancyIfNotCentral::class, 'tenant', 'auth'])->prefix('quality')->name('quality.')->group(function () {
    // Dashboard
    Route::get('/dashboard', [QualityController::class, 'dashboard'])->name('dashboard');
    Route::get('/', [QualityController::class, 'index'])->name('index');
    
    // Inspections
    Route::resource('inspections', InspectionController::class);
    
    // Non-Conformance Reports
    Route::resource('ncrs', NCRController::class);
});
