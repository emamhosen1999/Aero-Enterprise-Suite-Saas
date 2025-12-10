<?php

use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Quality Management API Routes
|--------------------------------------------------------------------------
*/

Route::middleware(['api', 'tenant'])->prefix('api/quality')->name('api.quality.')->group(function () {
    // API endpoints will be added here
});
