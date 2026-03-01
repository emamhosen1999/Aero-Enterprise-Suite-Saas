<?php

use Aero\Project\Http\Controllers\ProjectDashboardController;
use Illuminate\Support\Facades\Route;

// Dashboard route
Route::middleware(['auth:web'])->group(function () {
    Route::get('/project/dashboard', [ProjectDashboardController::class, 'index'])->name('project.dashboard');
});

// Public routes
