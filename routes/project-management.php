<?php

use App\Http\Controllers\ProjectManagement\BudgetController;
use App\Http\Controllers\ProjectManagement\GanttController;
use App\Http\Controllers\ProjectManagement\IssueController;
use App\Http\Controllers\ProjectManagement\MilestoneController;
use App\Http\Controllers\ProjectManagement\ProjectController;
use App\Http\Controllers\ProjectManagement\ResourceController;
use App\Http\Controllers\ProjectManagement\TaskController;
use App\Http\Controllers\ProjectManagement\TimeTrackingController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Project Management Routes
|--------------------------------------------------------------------------
|
| Here is where you can register project management routes for your application.
|
*/

Route::middleware(['auth', 'verified'])->prefix('project-management')->name('project-management.')->group(function () {
    // Dashboard
    Route::middleware(['permission:project-management.dashboard.view'])->get('/dashboard', [ProjectController::class, 'dashboard'])->name('dashboard');

    // Global Views (All items across all projects)
    Route::middleware(['permission:project-management.tasks.view'])->get('/tasks', [TaskController::class, 'globalIndex'])->name('tasks.global');
    Route::middleware(['permission:project-management.milestones.view'])->get('/milestones', [MilestoneController::class, 'globalIndex'])->name('milestones.global');
    Route::middleware(['permission:project-management.issues.view'])->get('/issues', [IssueController::class, 'globalIndex'])->name('issues.global');
    Route::middleware(['permission:project-management.resources.view'])->get('/resources', [ResourceController::class, 'globalIndex'])->name('resources.global');

    // Projects
    Route::middleware(['permission:project-management.projects.view'])->group(function () {
        Route::get('/projects', [ProjectController::class, 'index'])->name('projects.index');
        Route::get('/projects/create', [ProjectController::class, 'create'])->name('projects.create');
        Route::get('/projects/{project}/edit', [ProjectController::class, 'edit'])->name('projects.edit');
        Route::get('/projects/{project}', [ProjectController::class, 'show'])->name('projects.show');
    });

    Route::middleware(['permission:project-management.projects.create'])->post('/projects', [ProjectController::class, 'store'])->name('projects.store');
    Route::middleware(['permission:project-management.projects.update'])->put('/projects/{project}', [ProjectController::class, 'update'])->name('projects.update');
    Route::middleware(['permission:project-management.projects.delete'])->delete('/projects/{project}', [ProjectController::class, 'destroy'])->name('projects.destroy');

    // Project Milestones
    Route::middleware(['permission:project-management.milestones.view'])->group(function () {
        Route::get('/projects/{project}/milestones', [MilestoneController::class, 'index'])->name('milestones.index');
        Route::get('/projects/{project}/milestones/create', [MilestoneController::class, 'create'])->name('milestones.create');
        Route::get('/projects/{project}/milestones/{milestone}/edit', [MilestoneController::class, 'edit'])->name('milestones.edit');
    });

    Route::middleware(['permission:project-management.milestones.create'])->post('/projects/{project}/milestones', [MilestoneController::class, 'store'])->name('milestones.store');
    Route::middleware(['permission:project-management.milestones.update'])->put('/projects/{project}/milestones/{milestone}', [MilestoneController::class, 'update'])->name('milestones.update');
    Route::middleware(['permission:project-management.milestones.delete'])->delete('/projects/{project}/milestones/{milestone}', [MilestoneController::class, 'destroy'])->name('milestones.destroy');

    // Project Tasks
    Route::middleware(['permission:project-management.tasks.view'])->group(function () {
        Route::get('/projects/{project}/tasks', [TaskController::class, 'index'])->name('tasks.index');
        Route::get('/projects/{project}/tasks/create', [TaskController::class, 'create'])->name('tasks.create');
        Route::get('/projects/{project}/tasks/{task}/edit', [TaskController::class, 'edit'])->name('tasks.edit');
        Route::get('/projects/{project}/tasks/{task}', [TaskController::class, 'show'])->name('tasks.show');
    });

    Route::middleware(['permission:project-management.tasks.create'])->post('/projects/{project}/tasks', [TaskController::class, 'store'])->name('tasks.store');
    Route::middleware(['permission:project-management.tasks.update'])->put('/projects/{project}/tasks/{task}', [TaskController::class, 'update'])->name('tasks.update');
    Route::middleware(['permission:project-management.tasks.delete'])->delete('/projects/{project}/tasks/{task}', [TaskController::class, 'destroy'])->name('tasks.destroy');
    Route::middleware(['permission:project-management.tasks.assign'])->post('/projects/{project}/tasks/{task}/assign', [TaskController::class, 'assign'])->name('tasks.assign');

    // Project Issues
    Route::middleware(['permission:project-management.issues.view'])->group(function () {
        Route::get('/projects/{project}/issues', [IssueController::class, 'index'])->name('issues.index');
        Route::get('/projects/{project}/issues/create', [IssueController::class, 'create'])->name('issues.create');
        Route::get('/projects/{project}/issues/{issue}/edit', [IssueController::class, 'edit'])->name('issues.edit');
        Route::get('/projects/{project}/issues/{issue}', [IssueController::class, 'show'])->name('issues.show');
    });

    Route::middleware(['permission:project-management.issues.create'])->post('/projects/{project}/issues', [IssueController::class, 'store'])->name('issues.store');
    Route::middleware(['permission:project-management.issues.update'])->put('/projects/{project}/issues/{issue}', [IssueController::class, 'update'])->name('issues.update');
    Route::middleware(['permission:project-management.issues.delete'])->delete('/projects/{project}/issues/{issue}', [IssueController::class, 'destroy'])->name('issues.destroy');

    // Project Resources
    Route::middleware(['permission:project-management.resources.view'])->get('/projects/{project}/resources', [ResourceController::class, 'index'])->name('resources.index');
    Route::middleware(['permission:project-management.resources.assign'])->post('/projects/{project}/resources', [ResourceController::class, 'store'])->name('resources.store');
    Route::middleware(['permission:project-management.resources.assign'])->put('/projects/{project}/resources/{resource}', [ResourceController::class, 'update'])->name('resources.update');
    Route::middleware(['permission:project-management.resources.assign'])->delete('/projects/{project}/resources/{resource}', [ResourceController::class, 'destroy'])->name('resources.destroy');

    // Time Tracking
    Route::middleware(['permission:project-management.time-tracking.view'])->group(function () {
        Route::get('/time-tracking', [TimeTrackingController::class, 'index'])->name('time-tracking.index');
        Route::get('/time-tracking/create', [TimeTrackingController::class, 'create'])->name('time-tracking.create');
        Route::get('/time-tracking/{timeEntry}/edit', [TimeTrackingController::class, 'edit'])->name('time-tracking.edit');
        Route::get('/time-tracking/{timeEntry}', [TimeTrackingController::class, 'show'])->name('time-tracking.show');
        Route::get('/time-tracking/reports', [TimeTrackingController::class, 'reports'])->name('time-tracking.reports');
    });

    Route::middleware(['permission:project-management.time-tracking.create'])->post('/time-tracking', [TimeTrackingController::class, 'store'])->name('time-tracking.store');
    Route::middleware(['permission:project-management.time-tracking.update'])->put('/time-tracking/{timeEntry}', [TimeTrackingController::class, 'update'])->name('time-tracking.update');
    Route::middleware(['permission:project-management.time-tracking.delete'])->delete('/time-tracking/{timeEntry}', [TimeTrackingController::class, 'destroy'])->name('time-tracking.destroy');
    Route::middleware(['permission:project-management.time-tracking.approve'])->post('/time-tracking/{timeEntry}/approve', [TimeTrackingController::class, 'approve'])->name('time-tracking.approve');
    Route::middleware(['permission:project-management.time-tracking.approve'])->post('/time-tracking/{timeEntry}/unapprove', [TimeTrackingController::class, 'unapprove'])->name('time-tracking.unapprove');
    Route::middleware(['permission:project-management.time-tracking.approve'])->post('/time-tracking/bulk-approve', [TimeTrackingController::class, 'bulkApprove'])->name('time-tracking.bulk-approve');

    // Project Budget
    Route::middleware(['permission:project-management.budget.view'])->group(function () {
        Route::get('/budgets', [BudgetController::class, 'index'])->name('project-budgets.index');
        Route::get('/budgets/create', [BudgetController::class, 'create'])->name('project-budgets.create');
        Route::get('/budgets/{projectBudget}/edit', [BudgetController::class, 'edit'])->name('project-budgets.edit');
        Route::get('/budgets/{projectBudget}', [BudgetController::class, 'show'])->name('project-budgets.show');
        Route::get('/budgets/{projectBudget}/expenses', [BudgetController::class, 'expenses'])->name('project-budgets.expenses');
        Route::get('/budgets/reports', [BudgetController::class, 'reports'])->name('project-budgets.reports');
    });

    Route::middleware(['permission:project-management.budget.create'])->post('/budgets', [BudgetController::class, 'store'])->name('project-budgets.store');
    Route::middleware(['permission:project-management.budget.update'])->put('/budgets/{projectBudget}', [BudgetController::class, 'update'])->name('project-budgets.update');
    Route::middleware(['permission:project-management.budget.delete'])->delete('/budgets/{projectBudget}', [BudgetController::class, 'destroy'])->name('project-budgets.destroy');
    Route::middleware(['permission:project-management.budget.create'])->post('/budgets/{projectBudget}/expenses', [BudgetController::class, 'addExpense'])->name('project-budgets.add-expense');
    Route::middleware(['permission:project-management.budget.approve'])->post('/budgets/expenses/{expense}/approve', [BudgetController::class, 'approveExpense'])->name('project-budgets.approve-expense');

    // Gantt Charts
    Route::middleware(['permission:project-management.gantt.view'])->group(function () {
        Route::get('/gantt', [GanttController::class, 'index'])->name('gantt.index');
        Route::get('/projects/{project}/timeline', [GanttController::class, 'getProjectTimeline'])->name('gantt.timeline');
        Route::get('/projects/{project}/critical-path', [GanttController::class, 'getCriticalPath'])->name('gantt.critical-path');
    });

    Route::middleware(['permission:project-management.gantt.update'])->group(function () {
        Route::put('/gantt/tasks/{task}/dates', [GanttController::class, 'updateTaskDates'])->name('gantt.update-task-dates');
        Route::put('/gantt/milestones/{milestone}/dates', [GanttController::class, 'updateMilestoneDates'])->name('gantt.update-milestone-dates');
        Route::post('/gantt/dependencies', [GanttController::class, 'createDependency'])->name('gantt.create-dependency');
        Route::delete('/gantt/dependencies', [GanttController::class, 'deleteDependency'])->name('gantt.delete-dependency');
    });

    // Enhanced Project Management API Endpoints
    Route::middleware(['permission:project-management.projects.view'])->group(function () {
        Route::get('/projects/analytics', [ProjectController::class, 'portfolioAnalytics'])->name('projects.analytics');
        Route::get('/projects/timeline', [ProjectController::class, 'timeline'])->name('projects.timeline');
        Route::get('/projects/matrix', [ProjectController::class, 'portfolioMatrix'])->name('projects.matrix');
        Route::get('/projects/preferences', [ProjectController::class, 'getPreferences'])->name('projects.preferences');
    });

    Route::middleware(['permission:project-management.projects.update'])->group(function () {
        Route::post('/projects/bulk-update', [ProjectController::class, 'bulkUpdate'])->name('projects.bulk-update');
        Route::post('/projects/preferences', [ProjectController::class, 'savePreferences'])->name('projects.save-preferences');
    });

    Route::middleware(['permission:project-management.projects.export'])->group(function () {
        Route::post('/projects/export', [ProjectController::class, 'export'])->name('projects.export');
    });
});
