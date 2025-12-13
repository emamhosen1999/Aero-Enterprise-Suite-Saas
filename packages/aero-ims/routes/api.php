<?php

use Illuminate\Support\Facades\Route;
use Aero\Core\Http\Middleware\InitializeTenancyIfNotCentral;

/*
|--------------------------------------------------------------------------
| IMS API Routes
|--------------------------------------------------------------------------
| NOTE: InitializeTenancyIfNotCentral MUST come before 'tenant' middleware
| to gracefully return 404 on central domains instead of crashing.
*/

Route::prefix('ims')->name('ims.')->middleware(['api', InitializeTenancyIfNotCentral::class, 'tenant', 'auth:sanctum'])->group(function () {
    // API routes for IMS integration
});
