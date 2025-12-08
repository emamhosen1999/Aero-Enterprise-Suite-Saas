<?php

use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| HRM Admin Routes
|--------------------------------------------------------------------------
|
| These routes are loaded for admin/landlord access to HRM module settings.
|
*/

Route::prefix('admin/hrm')->name('admin.hrm.')->middleware(['auth', 'admin'])->group(function () {
    // Admin routes for HRM module settings
    // Examples:
    // Route::get('settings', [HrmSettingsController::class, 'index'])->name('settings');
    // Route::put('settings', [HrmSettingsController::class, 'update'])->name('settings.update');
});
