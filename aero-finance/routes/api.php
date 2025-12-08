<?php

use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Finance API Routes
|--------------------------------------------------------------------------
*/

Route::prefix('finance')->name('finance.')->middleware(['auth:sanctum', 'tenant'])->group(function () {
    // API routes will be added here as needed
});
