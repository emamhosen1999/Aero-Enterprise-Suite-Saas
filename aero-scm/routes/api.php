<?php

use Illuminate\Support\Facades\Route;

Route::prefix('scm')->name('scm.')->middleware(['auth:sanctum', 'tenant'])->group(function () {
    // API routes for SCM integration
});
