<?php

use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Finance Admin Routes
|--------------------------------------------------------------------------
*/

Route::prefix('admin/finance')->name('admin.finance.')->middleware(['auth', 'admin'])->group(function () {
    // Admin routes for Finance module settings
});
