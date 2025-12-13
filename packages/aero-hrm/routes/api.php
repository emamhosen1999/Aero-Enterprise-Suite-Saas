<?php

use Illuminate\Support\Facades\Route;
use Aero\Core\Http\Middleware\InitializeTenancyIfNotCentral;

/*
|--------------------------------------------------------------------------
| HRM API Routes
|--------------------------------------------------------------------------
|
| These routes are loaded for API access to the HRM module.
| NOTE: InitializeTenancyIfNotCentral MUST come before 'tenant' middleware
| to gracefully return 404 on central domains instead of crashing.
|
*/

Route::prefix('hrm')->name('hrm.')->middleware(['api', InitializeTenancyIfNotCentral::class, 'tenant', 'auth:sanctum'])->group(function () {
    // API routes will be added here as needed
    // Examples:
    // Route::get('employees', [EmployeeController::class, 'index']);
    // Route::get('attendance', [AttendanceController::class, 'index']);
});
