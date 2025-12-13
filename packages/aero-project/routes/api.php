<?php

use Illuminate\Support\Facades\Route;
use Aero\Core\Http\Middleware\InitializeTenancyIfNotCentral;

/*
|--------------------------------------------------------------------------
| Project API Routes
|--------------------------------------------------------------------------
| NOTE: InitializeTenancyIfNotCentral MUST come before 'tenant' middleware
| to gracefully return 404 on central domains instead of crashing.
*/

Route::prefix('projects')->name('projects.')->middleware(['api', InitializeTenancyIfNotCentral::class, 'tenant', 'auth:sanctum'])->group(function () {
    // API routes
});
