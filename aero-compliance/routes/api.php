<?php

use Illuminate\Support\Facades\Route;

Route::prefix('compliance')->name('compliance.')->middleware(['auth:sanctum', 'tenant'])->group(function () {
    // API routes for Compliance integration
});
