<?php

use Illuminate\Support\Facades\Route;
use Aero\Core\Http\Middleware\InitializeTenancyIfNotCentral;

/*
|--------------------------------------------------------------------------
| Project Tenant Routes
|--------------------------------------------------------------------------
| NOTE: InitializeTenancyIfNotCentral MUST come before 'tenant' middleware
| to gracefully return 404 on central domains instead of crashing.
*/

Route::prefix('projects')->name('projects.')->middleware(['web', InitializeTenancyIfNotCentral::class, 'tenant', 'auth'])->group(function () {
    // Projects
    Route::resource('/', \Aero\Project\Http\Controllers\ProjectController::class)->parameters(['' => 'project']);
    Route::resource('tasks', \Aero\Project\Http\Controllers\TaskController::class);
    Route::resource('milestones', \Aero\Project\Http\Controllers\MilestoneController::class);
    Route::resource('time-tracking', \Aero\Project\Http\Controllers\TimeTrackingController::class);
    Route::resource('resources', \Aero\Project\Http\Controllers\ResourceController::class);
    Route::resource('budgets', \Aero\Project\Http\Controllers\BudgetController::class);
    Route::resource('issues', \Aero\Project\Http\Controllers\IssueController::class);
    Route::get('gantt', [\Aero\Project\Http\Controllers\GanttController::class, 'index'])->name('gantt');
});
