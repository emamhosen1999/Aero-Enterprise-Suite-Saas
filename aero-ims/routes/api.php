<?php

use Illuminate\Support\Facades\Route;

Route::prefix('ims')->name('ims.')->middleware(['auth:sanctum', 'tenant'])->group(function () {
    // API routes for IMS integration
});
