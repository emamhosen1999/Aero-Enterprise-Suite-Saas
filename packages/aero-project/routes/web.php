<?php
use Illuminate\Support\Facades\Route;
use Aero\Project\Http\Controllers\ProjectDashboardController;

// Dashboard route
Route::middleware(['auth:web'])->group(function () {
    Route::get('/project/dashboard', [ProjectDashboardController::class, 'index'])->name('project.dashboard');
});

// Public routes
