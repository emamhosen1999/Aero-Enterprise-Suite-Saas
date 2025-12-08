<?php

use Illuminate\Support\Facades\Route;

Route::prefix('pos')->name('pos.')->middleware(['auth:sanctum', 'tenant'])->group(function () {
    // API routes for POS integration
});
