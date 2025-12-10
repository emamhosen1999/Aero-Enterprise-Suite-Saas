<?php

use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| DMS Public Routes
|--------------------------------------------------------------------------
|
| Public routes for the Document Management System module.
|
*/

// Public document sharing (if enabled)
Route::get('/shared/{token}', function ($token) {
    // Handle public document access
})->name('dms.public.document');
