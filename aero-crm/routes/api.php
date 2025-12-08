<?php

use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| CRM API Routes
|--------------------------------------------------------------------------
|
| API routes for CRM module.
|
*/

Route::prefix('api/crm')->name('api.crm.')->middleware(['api', 'auth:sanctum'])->group(function () {
    // CRM API routes will go here
});
