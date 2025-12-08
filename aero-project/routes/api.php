<?php

use Illuminate\Support\Facades\Route;

Route::prefix('projects')->name('projects.')->middleware(['auth:sanctum', 'tenant'])->group(function () {
    // API routes
});
