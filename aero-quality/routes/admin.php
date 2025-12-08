<?php

use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Quality Management Admin Routes
|--------------------------------------------------------------------------
*/

Route::middleware(['web', 'admin'])->prefix('admin/quality')->name('admin.quality.')->group(function () {
    // Admin-specific routes will be added here
});
