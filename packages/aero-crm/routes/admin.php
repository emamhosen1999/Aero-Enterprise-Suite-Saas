<?php

use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| CRM Admin Routes
|--------------------------------------------------------------------------
|
| These routes are loaded for admin users to manage CRM module settings.
|
*/

Route::prefix('admin/crm')->name('admin.crm.')->middleware(['auth', 'admin'])->group(function () {
    // Admin CRM settings routes will go here
});
