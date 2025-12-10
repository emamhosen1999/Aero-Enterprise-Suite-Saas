<?php

use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| HRM API Routes
|--------------------------------------------------------------------------
|
| These routes are loaded for API access to the HRM module.
|
*/

Route::prefix('hrm')->name('hrm.')->middleware(['auth:sanctum', 'tenant'])->group(function () {
    // API routes will be added here as needed
    // Examples:
    // Route::get('employees', [EmployeeController::class, 'index']);
    // Route::get('attendance', [AttendanceController::class, 'index']);
});
