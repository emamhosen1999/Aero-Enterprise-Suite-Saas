<?php

use Illuminate\Support\Facades\Route;
use Aero\Project\Http\Controllers\BoqMeasurementController;
use Aero\Project\Http\Controllers\BoqItemController;

/*
|--------------------------------------------------------------------------
| Project Tenant Routes
|--------------------------------------------------------------------------
| These routes are automatically wrapped by AbstractModuleProvider with:
| - Middleware: web, InitializeTenancyIfNotCentral, tenant (SaaS mode)
| - Prefix: /project
| - Name prefix: project.
|
| HRMAC Integration: All routes use 'module:project,{submodule}' middleware
| Sub-modules defined in config/module.php: smart-scheduling, boq-measurements, 
| digital-engineering, site-operations, risk-intelligence, boq-items
*/

// ============================================================================
// BOQ ITEMS (PATENTABLE - Bill of Quantities Master Data)
// Maps to 'boq-items' sub-module
// ============================================================================
Route::prefix('boq-items')->name('boq-items.')->middleware(['auth', 'module:project,boq-items'])->group(function () {
    Route::get('/', [BoqItemController::class, 'index'])->name('index');
    Route::get('/paginate', [BoqItemController::class, 'paginate'])->name('paginate');
    Route::get('/list', [BoqItemController::class, 'list'])->name('list');
    Route::get('/units', [BoqItemController::class, 'getUnits'])->name('units');
    Route::get('/stats', [BoqItemController::class, 'getStats'])->name('stats');
    Route::get('/summary-by-layer', [BoqItemController::class, 'summaryByLayer'])->name('summary-by-layer');
    Route::post('/', [BoqItemController::class, 'store'])->name('store');
    Route::get('/{boqItem}', [BoqItemController::class, 'show'])->name('show');
    Route::put('/{boqItem}', [BoqItemController::class, 'update'])->name('update');
    Route::delete('/{boqItem}', [BoqItemController::class, 'destroy'])->name('destroy');
    Route::post('/{boqItem}/toggle-status', [BoqItemController::class, 'toggleStatus'])->name('toggle-status');
    Route::post('/import', [BoqItemController::class, 'import'])->name('import');
    Route::get('/export/csv', [BoqItemController::class, 'export'])->name('export');
    Route::post('/bulk-update', [BoqItemController::class, 'bulkUpdate'])->name('bulk-update');
});

// ============================================================================
// BOQ MEASUREMENTS (PATENTABLE - Auto-Quantity Derivation from Chainage)
// Maps to 'boq-measurements' sub-module
// ============================================================================
Route::prefix('boq-measurements')->name('boq-measurements.')->middleware(['auth', 'module:project,boq-measurements'])->group(function () {
    Route::get('/', [BoqMeasurementController::class, 'index'])->name('index');
    Route::get('/paginate', [BoqMeasurementController::class, 'paginate'])->name('paginate');
    Route::get('/by-boq-item/{boqItem}', [BoqMeasurementController::class, 'byBoqItem'])->name('by-boq-item');
    Route::get('/by-rfi/{rfiId}', [BoqMeasurementController::class, 'byRfi'])->name('by-rfi');
    // Legacy route alias
    Route::get('/by-daily-work/{dailyWorkId}', [BoqMeasurementController::class, 'byRfi'])->name('by-daily-work');
    Route::post('/{measurement}/verify', [BoqMeasurementController::class, 'verify'])->name('verify');
    Route::post('/{measurement}/reject', [BoqMeasurementController::class, 'reject'])->name('reject');
    Route::get('/summary-report', [BoqMeasurementController::class, 'summaryReport'])->name('summary-report');
});

// ============================================================================
// LEGACY PROJECTS ROUTES (Backward Compatibility)
// Maps to 'smart-scheduling' sub-module (general project management)
// ============================================================================
Route::prefix('projects')->name('projects.')->middleware(['auth', 'module:project,smart-scheduling'])->group(function () {
    Route::resource('/', \Aero\Project\Http\Controllers\ProjectController::class)->parameters(['' => 'project']);
    Route::resource('tasks', \Aero\Project\Http\Controllers\TaskController::class);
    Route::resource('milestones', \Aero\Project\Http\Controllers\MilestoneController::class);
    Route::resource('time-tracking', \Aero\Project\Http\Controllers\TimeTrackingController::class);
    Route::resource('resources', \Aero\Project\Http\Controllers\ResourceController::class);
    Route::resource('budgets', \Aero\Project\Http\Controllers\BudgetController::class);
    Route::resource('issues', \Aero\Project\Http\Controllers\IssueController::class);
    Route::get('gantt', [\Aero\Project\Http\Controllers\GanttController::class, 'index'])->name('gantt');
});
