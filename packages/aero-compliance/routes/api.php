<?php

use Aero\Compliance\Http\Controllers\PermitValidationController;
use Aero\Core\Http\Middleware\InitializeTenancyIfNotCentral;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Compliance API Routes
|--------------------------------------------------------------------------
| NOTE: InitializeTenancyIfNotCentral MUST come before 'tenant' middleware
| to gracefully return 404 on central domains instead of crashing.
*/

Route::prefix('compliance')->name('compliance.')->middleware(['api', InitializeTenancyIfNotCentral::class, 'tenant', 'auth:sanctum'])->group(function () {
    // Permit-to-Work Validation (PATENTABLE)
    Route::prefix('permits')->name('permits.')->group(function () {
        Route::post('validate', [PermitValidationController::class, 'validate'])->name('validate');
        Route::get('requirements', [PermitValidationController::class, 'getRequirements'])->name('requirements');
        Route::get('categories', [PermitValidationController::class, 'listCategories'])->name('categories');
    });
});
