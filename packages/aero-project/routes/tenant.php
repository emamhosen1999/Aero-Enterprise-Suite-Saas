<?php

use Illuminate\Support\Facades\Route;
use Aero\Project\Http\Controllers\BoqMeasurementController;
use Aero\Project\Http\Controllers\BoqItemController;
use Aero\Project\Http\Controllers\ProjectController;
use Aero\Project\Http\Controllers\TaskController;
use Aero\Project\Http\Controllers\MilestoneController;
use Aero\Project\Http\Controllers\TimeTrackingController;
use Aero\Project\Http\Controllers\ResourceController;
use Aero\Project\Http\Controllers\BudgetController;
use Aero\Project\Http\Controllers\IssueController;
use Aero\Project\Http\Controllers\GanttController;
use Aero\Project\Http\Controllers\TeamMemberController;

/*
|--------------------------------------------------------------------------
| Project Tenant Routes
|--------------------------------------------------------------------------
| These routes are automatically wrapped by AbstractModuleProvider with:
| - Middleware: web, InitializeTenancyIfNotCentral, tenant (SaaS mode)
| - Prefix: /project
| - Name prefix: project.
|
| HRMAC Integration:
| - 'module:project,{submodule}' - Module-level access control
| - 'project.hrmac:{path}' - Action-level authorization
| - 'project.member' - Project membership validation
|
| Permission Path Format: module.submodule.component.action
| Example: project.projects.project_list.create
*/

// ============================================================================
// PROJECT CORE ROUTES
// Maps to 'projects' sub-module
// ============================================================================
Route::prefix('projects')->name('projects.')->middleware(['auth', 'module:project,projects'])->group(function () {
    // List & Dashboard
    Route::get('/', [ProjectController::class, 'index'])->name('index')
        ->middleware('project.hrmac:projects.project_list.view');
    Route::get('/dashboard', [ProjectController::class, 'dashboard'])->name('dashboard')
        ->middleware('project.hrmac:projects.dashboard.view');

    // Analytics & Reports
    Route::get('/portfolio-analytics', [ProjectController::class, 'portfolioAnalytics'])->name('portfolio-analytics')
        ->middleware('project.hrmac:projects.analytics.view');
    Route::get('/timeline', [ProjectController::class, 'timeline'])->name('timeline')
        ->middleware('project.hrmac:projects.timeline.view');
    Route::get('/portfolio-matrix', [ProjectController::class, 'portfolioMatrix'])->name('portfolio-matrix')
        ->middleware('project.hrmac:projects.analytics.view');

    // Create
    Route::get('/create', [ProjectController::class, 'create'])->name('create')
        ->middleware('project.hrmac:projects.project_list.create');
    Route::post('/', [ProjectController::class, 'store'])->name('store')
        ->middleware('project.hrmac:projects.project_list.create');

    // Bulk Operations
    Route::post('/bulk-update', [ProjectController::class, 'bulkUpdate'])->name('bulk-update')
        ->middleware('project.hrmac:projects.project_list.update');
    Route::get('/export', [ProjectController::class, 'export'])->name('export')
        ->middleware('project.hrmac:projects.project_list.export');

    // User Preferences
    Route::post('/preferences', [ProjectController::class, 'savePreferences'])->name('preferences.save');
    Route::get('/preferences', [ProjectController::class, 'getPreferences'])->name('preferences.get');

    // Individual Project Routes (requires membership or HRMAC access)
    Route::prefix('{project}')->middleware('project.member')->group(function () {
        Route::get('/', [ProjectController::class, 'show'])->name('show');
        Route::get('/edit', [ProjectController::class, 'edit'])->name('edit')
            ->middleware('project.hrmac:projects.project_list.edit');
        Route::put('/', [ProjectController::class, 'update'])->name('update')
            ->middleware('project.hrmac:projects.project_list.update');
        Route::delete('/', [ProjectController::class, 'destroy'])->name('destroy')
            ->middleware('project.hrmac:projects.project_list.delete');
    });
});

// ============================================================================
// TASKS ROUTES
// Maps to 'tasks' sub-module
// ============================================================================
Route::prefix('tasks')->name('tasks.')->middleware(['auth', 'module:project,tasks'])->group(function () {
    Route::get('/', [TaskController::class, 'index'])->name('index')
        ->middleware('project.hrmac:tasks.task_list.view');
    Route::get('/create', [TaskController::class, 'create'])->name('create')
        ->middleware('project.hrmac:tasks.task_list.create');
    Route::post('/', [TaskController::class, 'store'])->name('store')
        ->middleware('project.hrmac:tasks.task_list.create');
    Route::get('/{task}', [TaskController::class, 'show'])->name('show')
        ->middleware('project.hrmac:tasks.task_list.view');
    Route::get('/{task}/edit', [TaskController::class, 'edit'])->name('edit')
        ->middleware('project.hrmac:tasks.task_list.edit');
    Route::put('/{task}', [TaskController::class, 'update'])->name('update')
        ->middleware('project.hrmac:tasks.task_list.update');
    Route::delete('/{task}', [TaskController::class, 'destroy'])->name('destroy')
        ->middleware('project.hrmac:tasks.task_list.delete');
    Route::post('/{task}/assign', [TaskController::class, 'assign'])->name('assign')
        ->middleware('project.hrmac:tasks.task_list.assign');
});

// ============================================================================
// MILESTONES ROUTES
// Maps to 'milestones' sub-module
// ============================================================================
Route::prefix('milestones')->name('milestones.')->middleware(['auth', 'module:project,milestones'])->group(function () {
    Route::get('/', [MilestoneController::class, 'index'])->name('index')
        ->middleware('project.hrmac:milestones.milestone_list.view');
    Route::get('/create', [MilestoneController::class, 'create'])->name('create')
        ->middleware('project.hrmac:milestones.milestone_list.create');
    Route::post('/', [MilestoneController::class, 'store'])->name('store')
        ->middleware('project.hrmac:milestones.milestone_list.create');
    Route::get('/{milestone}', [MilestoneController::class, 'show'])->name('show')
        ->middleware('project.hrmac:milestones.milestone_list.view');
    Route::put('/{milestone}', [MilestoneController::class, 'update'])->name('update')
        ->middleware('project.hrmac:milestones.milestone_list.update');
    Route::delete('/{milestone}', [MilestoneController::class, 'destroy'])->name('destroy')
        ->middleware('project.hrmac:milestones.milestone_list.delete');
});

// ============================================================================
// TIME TRACKING ROUTES
// Maps to 'time_tracking' sub-module
// ============================================================================
Route::prefix('time-tracking')->name('time-tracking.')->middleware(['auth', 'module:project,time_tracking'])->group(function () {
    Route::get('/', [TimeTrackingController::class, 'index'])->name('index')
        ->middleware('project.hrmac:time_tracking.time_entries.view');
    Route::get('/create', [TimeTrackingController::class, 'create'])->name('create')
        ->middleware('project.hrmac:time_tracking.time_entries.create');
    Route::post('/', [TimeTrackingController::class, 'store'])->name('store')
        ->middleware('project.hrmac:time_tracking.time_entries.create');
    Route::get('/{timeEntry}', [TimeTrackingController::class, 'show'])->name('show')
        ->middleware('project.hrmac:time_tracking.time_entries.view');
    Route::put('/{timeEntry}', [TimeTrackingController::class, 'update'])->name('update')
        ->middleware('project.hrmac:time_tracking.time_entries.update');
    Route::delete('/{timeEntry}', [TimeTrackingController::class, 'destroy'])->name('destroy')
        ->middleware('project.hrmac:time_tracking.time_entries.delete');
});

// ============================================================================
// RESOURCES ROUTES
// Maps to 'resources' sub-module
// ============================================================================
Route::prefix('resources')->name('resources.')->middleware(['auth', 'module:project,resources'])->group(function () {
    Route::get('/', [ResourceController::class, 'index'])->name('index')
        ->middleware('project.hrmac:resources.resource_list.view');
    Route::post('/', [ResourceController::class, 'store'])->name('store')
        ->middleware('project.hrmac:resources.resource_list.create');
    Route::put('/{resource}', [ResourceController::class, 'update'])->name('update')
        ->middleware('project.hrmac:resources.resource_list.update');
    Route::delete('/{resource}', [ResourceController::class, 'destroy'])->name('destroy')
        ->middleware('project.hrmac:resources.resource_list.delete');
});

// ============================================================================
// BUDGET ROUTES
// Maps to 'budgets' sub-module
// ============================================================================
Route::prefix('budgets')->name('budgets.')->middleware(['auth', 'module:project,budgets'])->group(function () {
    Route::get('/', [BudgetController::class, 'index'])->name('index')
        ->middleware('project.hrmac:budgets.budget_list.view');
    Route::post('/', [BudgetController::class, 'store'])->name('store')
        ->middleware('project.hrmac:budgets.budget_list.create');
    Route::put('/{budget}', [BudgetController::class, 'update'])->name('update')
        ->middleware('project.hrmac:budgets.budget_list.update');
    Route::delete('/{budget}', [BudgetController::class, 'destroy'])->name('destroy')
        ->middleware('project.hrmac:budgets.budget_list.delete');
});

// ============================================================================
// ISSUES ROUTES
// Maps to 'issues' sub-module
// ============================================================================
Route::prefix('issues')->name('issues.')->middleware(['auth', 'module:project,issues'])->group(function () {
    Route::get('/', [IssueController::class, 'index'])->name('index')
        ->middleware('project.hrmac:issues.issue_list.view');
    Route::get('/create', [IssueController::class, 'create'])->name('create')
        ->middleware('project.hrmac:issues.issue_list.create');
    Route::post('/', [IssueController::class, 'store'])->name('store')
        ->middleware('project.hrmac:issues.issue_list.create');
    Route::get('/{issue}', [IssueController::class, 'show'])->name('show')
        ->middleware('project.hrmac:issues.issue_list.view');
    Route::put('/{issue}', [IssueController::class, 'update'])->name('update')
        ->middleware('project.hrmac:issues.issue_list.update');
    Route::delete('/{issue}', [IssueController::class, 'destroy'])->name('destroy')
        ->middleware('project.hrmac:issues.issue_list.delete');
});

// ============================================================================
// TEAM MEMBERS ROUTES
// Maps to 'team' sub-module
// ============================================================================
Route::prefix('team')->name('team.')->middleware(['auth', 'module:project,team'])->group(function () {
    Route::get('/{project}', [TeamMemberController::class, 'index'])->name('index')
        ->middleware('project.hrmac:team.member_list.view');
    Route::post('/{project}', [TeamMemberController::class, 'store'])->name('store')
        ->middleware('project.hrmac:team.member_list.create');
    Route::put('/{project}/{member}', [TeamMemberController::class, 'update'])->name('update')
        ->middleware('project.hrmac:team.member_list.update');
    Route::delete('/{project}/{member}', [TeamMemberController::class, 'destroy'])->name('destroy')
        ->middleware('project.hrmac:team.member_list.delete');
});

// ============================================================================
// GANTT CHART ROUTES
// Maps to 'smart-scheduling' sub-module
// ============================================================================
Route::prefix('gantt')->name('gantt.')->middleware(['auth', 'module:project,smart-scheduling'])->group(function () {
    Route::get('/', [GanttController::class, 'index'])->name('index')
        ->middleware('project.hrmac:smart-scheduling.gantt-cpm.view');
    Route::get('/data', [GanttController::class, 'data'])->name('data')
        ->middleware('project.hrmac:smart-scheduling.gantt-cpm.view');
});

// ============================================================================
// BOQ ITEMS (PATENTABLE - Bill of Quantities Master Data)
// Maps to 'boq-items' sub-module
// ============================================================================
Route::prefix('boq-items')->name('boq-items.')->middleware(['auth', 'module:project,boq-items'])->group(function () {
    Route::get('/', [BoqItemController::class, 'index'])->name('index')
        ->middleware('project.hrmac:boq-items.measurement-list.view');
    Route::get('/paginate', [BoqItemController::class, 'paginate'])->name('paginate');
    Route::get('/list', [BoqItemController::class, 'list'])->name('list');
    Route::get('/units', [BoqItemController::class, 'getUnits'])->name('units');
    Route::get('/stats', [BoqItemController::class, 'getStats'])->name('stats');
    Route::get('/summary-by-layer', [BoqItemController::class, 'summaryByLayer'])->name('summary-by-layer');
    Route::post('/', [BoqItemController::class, 'store'])->name('store')
        ->middleware('project.hrmac:boq-items.measurement-list.create');
    Route::get('/{boqItem}', [BoqItemController::class, 'show'])->name('show');
    Route::put('/{boqItem}', [BoqItemController::class, 'update'])->name('update')
        ->middleware('project.hrmac:boq-items.measurement-list.update');
    Route::delete('/{boqItem}', [BoqItemController::class, 'destroy'])->name('destroy')
        ->middleware('project.hrmac:boq-items.measurement-list.delete');
    Route::post('/{boqItem}/toggle-status', [BoqItemController::class, 'toggleStatus'])->name('toggle-status');
    Route::post('/import', [BoqItemController::class, 'import'])->name('import')
        ->middleware('project.hrmac:boq-items.measurement-list.import');
    Route::get('/export/csv', [BoqItemController::class, 'export'])->name('export')
        ->middleware('project.hrmac:boq-items.measurement-list.export');
    Route::post('/bulk-update', [BoqItemController::class, 'bulkUpdate'])->name('bulk-update')
        ->middleware('project.hrmac:boq-items.measurement-list.update');
});

// ============================================================================
// BOQ MEASUREMENTS (PATENTABLE - Auto-Quantity Derivation from Chainage)
// Maps to 'boq-measurements' sub-module
// ============================================================================
Route::prefix('boq-measurements')->name('boq-measurements.')->middleware(['auth', 'module:project,boq-measurements'])->group(function () {
    Route::get('/', [BoqMeasurementController::class, 'index'])->name('index')
        ->middleware('project.hrmac:boq-measurements.measurement-list.view');
    Route::get('/paginate', [BoqMeasurementController::class, 'paginate'])->name('paginate');
    Route::get('/by-boq-item/{boqItem}', [BoqMeasurementController::class, 'byBoqItem'])->name('by-boq-item');
    Route::get('/by-rfi/{rfiId}', [BoqMeasurementController::class, 'byRfi'])->name('by-rfi');
    // Legacy route alias
    Route::get('/by-daily-work/{dailyWorkId}', [BoqMeasurementController::class, 'byRfi'])->name('by-daily-work');
    Route::post('/{measurement}/verify', [BoqMeasurementController::class, 'verify'])->name('verify')
        ->middleware('project.hrmac:boq-measurements.measurement-list.verify');
    Route::post('/{measurement}/reject', [BoqMeasurementController::class, 'reject'])->name('reject')
        ->middleware('project.hrmac:boq-measurements.measurement-list.reject');
    Route::get('/summary-report', [BoqMeasurementController::class, 'summaryReport'])->name('summary-report')
        ->middleware('project.hrmac:boq-measurements.earned-value.view');
});
