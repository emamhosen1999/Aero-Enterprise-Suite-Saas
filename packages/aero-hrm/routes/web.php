<?php

use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| HRM Public Web Routes
|--------------------------------------------------------------------------
|
| These routes are loaded for public web access (e.g., career pages, job applications).
|
*/

Route::prefix('careers')->name('careers.')->group(function () {
    // Public career/recruitment routes
    // Examples:
    // Route::get('/', [CareersController::class, 'index'])->name('index');
    // Route::get('jobs/{id}', [CareersController::class, 'show'])->name('jobs.show');
    // Route::post('jobs/{id}/apply', [CareersController::class, 'apply'])->name('jobs.apply');
});
