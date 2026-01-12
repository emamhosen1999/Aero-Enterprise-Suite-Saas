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
use Aero\Project\Http\Controllers\ProjectRiskController;
use Aero\Project\Http\Controllers\ProjectSprintController;
use Aero\Project\Http\Controllers\ProjectLabelController;
use Aero\Project\Http\Controllers\ProjectAttachmentController;
use Aero\Project\Http\Controllers\ProjectActivityController;
use Aero\Project\Http\Controllers\ProjectWatcherController;

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

// ============================================================================
// RISKS & ISSUES ROUTES
// Maps to 'risks' sub-module - Enhanced risk/issue management
// ============================================================================
Route::prefix('projects/{project}/risks')->name('risks.')->middleware(['auth', 'module:project,risks', 'project.member'])->group(function () {
    Route::get('/', [ProjectRiskController::class, 'index'])->name('index')
        ->middleware('project.hrmac:risks.risk_list.view');
    Route::get('/create', [ProjectRiskController::class, 'create'])->name('create')
        ->middleware('project.hrmac:risks.risk_list.create');
    Route::post('/', [ProjectRiskController::class, 'store'])->name('store')
        ->middleware('project.hrmac:risks.risk_list.create');
    Route::get('/{risk}', [ProjectRiskController::class, 'show'])->name('show')
        ->middleware('project.hrmac:risks.risk_list.view');
    Route::get('/{risk}/edit', [ProjectRiskController::class, 'edit'])->name('edit')
        ->middleware('project.hrmac:risks.risk_list.edit');
    Route::put('/{risk}', [ProjectRiskController::class, 'update'])->name('update')
        ->middleware('project.hrmac:risks.risk_list.update');
    Route::delete('/{risk}', [ProjectRiskController::class, 'destroy'])->name('destroy')
        ->middleware('project.hrmac:risks.risk_list.delete');
    Route::post('/{risk}/convert-to-issue', [ProjectRiskController::class, 'convertToIssue'])->name('convert-to-issue')
        ->middleware('project.hrmac:risks.risk_list.update');
});

// ============================================================================
// SPRINTS ROUTES (Agile Methodology)
// Maps to 'sprints' sub-module
// ============================================================================
Route::prefix('projects/{project}/sprints')->name('sprints.')->middleware(['auth', 'module:project,sprints', 'project.member'])->group(function () {
    Route::get('/', [ProjectSprintController::class, 'index'])->name('index')
        ->middleware('project.hrmac:sprints.sprint_list.view');
    Route::get('/create', [ProjectSprintController::class, 'create'])->name('create')
        ->middleware('project.hrmac:sprints.sprint_list.create');
    Route::post('/', [ProjectSprintController::class, 'store'])->name('store')
        ->middleware('project.hrmac:sprints.sprint_list.create');
    Route::get('/{sprint}', [ProjectSprintController::class, 'show'])->name('show')
        ->middleware('project.hrmac:sprints.sprint_list.view');
    Route::get('/{sprint}/edit', [ProjectSprintController::class, 'edit'])->name('edit')
        ->middleware('project.hrmac:sprints.sprint_list.edit');
    Route::put('/{sprint}', [ProjectSprintController::class, 'update'])->name('update')
        ->middleware('project.hrmac:sprints.sprint_list.update');
    Route::delete('/{sprint}', [ProjectSprintController::class, 'destroy'])->name('destroy')
        ->middleware('project.hrmac:sprints.sprint_list.delete');
    // Sprint actions
    Route::post('/{sprint}/start', [ProjectSprintController::class, 'start'])->name('start')
        ->middleware('project.hrmac:sprints.sprint_list.update');
    Route::post('/{sprint}/complete', [ProjectSprintController::class, 'complete'])->name('complete')
        ->middleware('project.hrmac:sprints.sprint_list.update');
    Route::post('/{sprint}/add-tasks', [ProjectSprintController::class, 'addTasks'])->name('add-tasks')
        ->middleware('project.hrmac:sprints.sprint_list.update');
    Route::delete('/{sprint}/tasks/{taskId}', [ProjectSprintController::class, 'removeTask'])->name('remove-task')
        ->middleware('project.hrmac:sprints.sprint_list.update');
    Route::get('/{sprint}/burndown', [ProjectSprintController::class, 'burndown'])->name('burndown')
        ->middleware('project.hrmac:sprints.sprint_list.view');
});

// ============================================================================
// LABELS ROUTES
// Maps to 'labels' sub-module
// ============================================================================
Route::prefix('projects/{project}/labels')->name('labels.')->middleware(['auth', 'module:project,labels', 'project.member'])->group(function () {
    Route::get('/', [ProjectLabelController::class, 'index'])->name('index')
        ->middleware('project.hrmac:labels.label_list.view');
    Route::post('/', [ProjectLabelController::class, 'store'])->name('store')
        ->middleware('project.hrmac:labels.label_list.create');
    Route::put('/{label}', [ProjectLabelController::class, 'update'])->name('update')
        ->middleware('project.hrmac:labels.label_list.update');
    Route::delete('/{label}', [ProjectLabelController::class, 'destroy'])->name('destroy')
        ->middleware('project.hrmac:labels.label_list.delete');
    Route::post('/{label}/assign', [ProjectLabelController::class, 'assignToTask'])->name('assign')
        ->middleware('project.hrmac:labels.label_list.update');
    Route::post('/{label}/remove', [ProjectLabelController::class, 'removeFromTask'])->name('remove')
        ->middleware('project.hrmac:labels.label_list.update');
});

// ============================================================================
// ATTACHMENTS ROUTES
// Maps to 'attachments' sub-module
// ============================================================================
Route::prefix('projects/{project}/attachments')->name('attachments.')->middleware(['auth', 'module:project,attachments', 'project.member'])->group(function () {
    Route::get('/', [ProjectAttachmentController::class, 'index'])->name('index')
        ->middleware('project.hrmac:attachments.attachment_list.view');
    Route::post('/', [ProjectAttachmentController::class, 'store'])->name('store')
        ->middleware('project.hrmac:attachments.attachment_list.create');
    Route::get('/{attachment}', [ProjectAttachmentController::class, 'show'])->name('show')
        ->middleware('project.hrmac:attachments.attachment_list.view');
    Route::get('/{attachment}/download', [ProjectAttachmentController::class, 'download'])->name('download')
        ->middleware('project.hrmac:attachments.attachment_list.view');
    Route::put('/{attachment}', [ProjectAttachmentController::class, 'update'])->name('update')
        ->middleware('project.hrmac:attachments.attachment_list.update');
    Route::delete('/{attachment}', [ProjectAttachmentController::class, 'destroy'])->name('destroy')
        ->middleware('project.hrmac:attachments.attachment_list.delete');
    Route::post('/bulk-delete', [ProjectAttachmentController::class, 'bulkDestroy'])->name('bulk-delete')
        ->middleware('project.hrmac:attachments.attachment_list.delete');
    Route::get('/storage/usage', [ProjectAttachmentController::class, 'storageUsage'])->name('storage-usage')
        ->middleware('project.hrmac:attachments.attachment_list.view');
});

// ============================================================================
// ACTIVITY LOG ROUTES (Read-only)
// Maps to 'activity' sub-module
// ============================================================================
Route::prefix('projects/{project}/activity')->name('activity.')->middleware(['auth', 'module:project,activity', 'project.member'])->group(function () {
    Route::get('/', [ProjectActivityController::class, 'index'])->name('index')
        ->middleware('project.hrmac:activity.activity_list.view');
    Route::get('/entity', [ProjectActivityController::class, 'forEntity'])->name('for-entity')
        ->middleware('project.hrmac:activity.activity_list.view');
    Route::get('/summary', [ProjectActivityController::class, 'summary'])->name('summary')
        ->middleware('project.hrmac:activity.activity_list.view');
});

// ============================================================================
// WATCHERS ROUTES
// Global watcher endpoints (not project-scoped)
// ============================================================================
Route::prefix('watchers')->name('watchers.')->middleware(['auth'])->group(function () {
    Route::get('/status', [ProjectWatcherController::class, 'status'])->name('status');
    Route::post('/toggle', [ProjectWatcherController::class, 'toggle'])->name('toggle');
    Route::post('/watch', [ProjectWatcherController::class, 'watch'])->name('watch');
    Route::post('/unwatch', [ProjectWatcherController::class, 'unwatch'])->name('unwatch');
    Route::get('/list', [ProjectWatcherController::class, 'watchers'])->name('list');
    Route::get('/my-watches/{project}', [ProjectWatcherController::class, 'myWatches'])->name('my-watches');
});
