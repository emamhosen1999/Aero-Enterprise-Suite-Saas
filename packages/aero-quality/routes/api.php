<?php

use Aero\Core\Http\Middleware\InitializeTenancyIfNotCentral;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Quality Management API Routes
|--------------------------------------------------------------------------
| NOTE: InitializeTenancyIfNotCentral MUST come before 'tenant' middleware
| to gracefully return 404 on central domains instead of crashing.
*/

Route::middleware(['api', InitializeTenancyIfNotCentral::class, 'tenant'])->prefix('api/quality')->name('api.quality.')->group(function () {
    // API endpoints will be added here
});
