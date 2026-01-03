<?php

use Illuminate\Support\Facades\Route;
use Aero\Core\Http\Middleware\InitializeTenancyIfNotCentral;
use Aero\Project\Http\Controllers\BoqMeasurementController;
use Aero\Project\Http\Controllers\BoqItemController;

/*
|--------------------------------------------------------------------------
| Project Tenant Routes
|--------------------------------------------------------------------------
| NOTE: InitializeTenancyIfNotCentral MUST come before 'tenant' middleware
| to gracefully return 404 on central domains instead of crashing.
*/

Route::prefix('project')->name('project.')->middleware(['web', InitializeTenancyIfNotCentral::class, 'tenant', 'auth'])->group(function () {

    // ============================================================================
    // BOQ ITEMS (PATENTABLE - Bill of Quantities Master Data)
    // ============================================================================
    Route::prefix('boq-items')->name('boq-items.')->group(function () {
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
    // ============================================================================
    Route::prefix('boq-measurements')->name('boq-measurements.')->group(function () {
        Route::get('/', [BoqMeasurementController::class, 'index'])->name('index');
        Route::get('/paginate', [BoqMeasurementController::class, 'paginate'])->name('paginate');
        Route::get('/by-boq-item/{boqItem}', [BoqMeasurementController::class, 'byBoqItem'])->name('by-boq-item');
        Route::get('/by-daily-work/{dailyWorkId}', [BoqMeasurementController::class, 'byDailyWork'])->name('by-daily-work');
        Route::post('/{measurement}/verify', [BoqMeasurementController::class, 'verify'])->name('verify');
        Route::post('/{measurement}/reject', [BoqMeasurementController::class, 'reject'])->name('reject');
        Route::get('/summary-report', [BoqMeasurementController::class, 'summaryReport'])->name('summary-report');
    });
});

// Legacy routes - keep for backward compatibility
Route::prefix('projects')->name('projects.')->middleware(['web', InitializeTenancyIfNotCentral::class, 'tenant', 'auth'])->group(function () {
    Route::resource('/', \Aero\Project\Http\Controllers\ProjectController::class)->parameters(['' => 'project']);
    Route::resource('tasks', \Aero\Project\Http\Controllers\TaskController::class);
    Route::resource('milestones', \Aero\Project\Http\Controllers\MilestoneController::class);
    Route::resource('time-tracking', \Aero\Project\Http\Controllers\TimeTrackingController::class);
    Route::resource('resources', \Aero\Project\Http\Controllers\ResourceController::class);
    Route::resource('budgets', \Aero\Project\Http\Controllers\BudgetController::class);
    Route::resource('issues', \Aero\Project\Http\Controllers\IssueController::class);
    Route::get('gantt', [\Aero\Project\Http\Controllers\GanttController::class, 'index'])->name('gantt');
});
