<?php

use Aero\Rfi\Http\Controllers\ChainageProgressController;
use Aero\Rfi\Http\Controllers\DailyWorkController;
use Aero\Rfi\Http\Controllers\DailyWorkSummaryController;
use Aero\Rfi\Http\Controllers\EquipmentLogController;
use Aero\Rfi\Http\Controllers\LaborDeploymentController;
use Aero\Rfi\Http\Controllers\MaterialConsumptionController;
use Aero\Rfi\Http\Controllers\ObjectionController;
use Aero\Rfi\Http\Controllers\ProgressPhotoController;
use Aero\Rfi\Http\Controllers\RfiDashboardController;
use Aero\Rfi\Http\Controllers\SiteInstructionController;
use Aero\Rfi\Http\Controllers\WeatherLogController;
use Aero\Rfi\Http\Controllers\WorkLayerController;
use Aero\Rfi\Http\Controllers\WorkLocationController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| RFI Module Routes
|--------------------------------------------------------------------------
|
| All routes are prefixed with /rfi and use the rfi.* naming convention.
| These routes require authentication via tenant middleware.
|
| Authentication is handled by aero-core package.
| All routes require 'auth' and 'verified' middleware.
|
*/

// ============================================================================
// AUTHENTICATED RFI ROUTES
// ============================================================================
// Note: Service provider adds 'rfi.' prefix and '/rfi' path automatically
Route::middleware(['auth', 'verified'])->group(function () {

    // Dashboard
    Route::middleware(['module:rfi,dashboard'])
        ->get('/', [RfiDashboardController::class, 'index'])
        ->name('dashboard');

    // Daily Works (RFIs)
    Route::prefix('daily-works')->name('daily-works.')->middleware(['module:rfi,daily-works'])->group(function () {
    Route::get('/', [DailyWorkController::class, 'index'])->name('index');
    Route::get('/create', [DailyWorkController::class, 'create'])->name('create');
    Route::post('/', [DailyWorkController::class, 'store'])->name('store');
    Route::get('/{dailyWork}', [DailyWorkController::class, 'show'])->name('show');
    Route::get('/{dailyWork}/edit', [DailyWorkController::class, 'edit'])->name('edit');
    Route::put('/{dailyWork}', [DailyWorkController::class, 'update'])->name('update');
    Route::delete('/{dailyWork}', [DailyWorkController::class, 'destroy'])->name('destroy');

    // API Endpoints for pagination and filtering
    Route::get('/api/paginate', [DailyWorkController::class, 'paginate'])->name('paginate');
    Route::get('/api/all', [DailyWorkController::class, 'all'])->name('all');

    // Import
    Route::post('/import', [DailyWorkController::class, 'import'])->name('import');
    Route::get('/template/download', [DailyWorkController::class, 'downloadTemplate'])->name('template.download');

    // RFI Submission
    Route::post('/{dailyWork}/submit', [DailyWorkController::class, 'submit'])->name('submit');

    // Inspection
    Route::post('/{dailyWork}/inspect', [DailyWorkController::class, 'inspect'])->name('inspect');

    // Files
    Route::post('/{dailyWork}/files', [DailyWorkController::class, 'uploadFiles'])->name('files.upload');
    Route::get('/{dailyWork}/files', [DailyWorkController::class, 'getRfiFiles'])->name('files.list');
    Route::delete('/{dailyWork}/files/{mediaId}', [DailyWorkController::class, 'deleteFile'])->name('files.delete');
    Route::get('/{dailyWork}/files/{mediaId}/download', [DailyWorkController::class, 'downloadRfiFile'])->name('files.download');

    // Objection management
    Route::post('/{dailyWork}/objections', [DailyWorkController::class, 'attachObjections'])->name('objections.attach');
    Route::delete('/{dailyWork}/objections', [DailyWorkController::class, 'detachObjections'])->name('objections.detach');

    // Bulk operations
    Route::post('/bulk/status', [DailyWorkController::class, 'bulkUpdateStatus'])->name('bulk.status');
    Route::post('/bulk/submit', [DailyWorkController::class, 'bulkSubmit'])->name('bulk.submit');
    Route::post('/bulk/import-submit', [DailyWorkController::class, 'bulkImportSubmit'])->name('bulk.import-submit');
    Route::get('/bulk/submit-template', [DailyWorkController::class, 'downloadBulkImportTemplate'])->name('bulk.submit-template');
    Route::post('/bulk/response-status', [DailyWorkController::class, 'bulkResponseStatusUpdate'])->name('bulk.response-status');
    Route::post('/bulk/import-response-status', [DailyWorkController::class, 'bulkImportResponseStatus'])->name('bulk.import-response-status');
    Route::get('/bulk/response-status-template', [DailyWorkController::class, 'downloadResponseStatusTemplate'])->name('bulk.response-status-template');

    // Status updates
    Route::post('/update-status', [DailyWorkController::class, 'updateStatus'])->name('update-status');
    Route::post('/update-completion-time', [DailyWorkController::class, 'updateCompletionTime'])->name('update-completion-time');
    Route::post('/update-submission-time', [DailyWorkController::class, 'updateSubmissionTime'])->name('update-submission-time');
    Route::post('/update-inspection-details', [DailyWorkController::class, 'updateInspectionDetails'])->name('update-inspection-details');
    Route::post('/update-incharge', [DailyWorkController::class, 'updateIncharge'])->name('update-incharge');
    Route::post('/update-assigned', [DailyWorkController::class, 'updateAssigned'])->name('update-assigned');

    // Export
    Route::get('/export/csv', [DailyWorkController::class, 'export'])->name('export');
    Route::get('/export/objected', [DailyWorkController::class, 'exportObjectedRfis'])->name('export.objected');
});

    // Daily Work Summary
    Route::prefix('daily-works-summary')->name('daily-works-summary.')->middleware(['module:rfi,daily-works'])->group(function () {
        Route::get('/', [DailyWorkSummaryController::class, 'index'])->name('index');
        Route::post('/filter', [DailyWorkSummaryController::class, 'filterSummary'])->name('filter');
        Route::get('/export', [DailyWorkSummaryController::class, 'exportDailySummary'])->name('export');
        Route::get('/statistics', [DailyWorkSummaryController::class, 'getStatistics'])->name('statistics');
        Route::post('/refresh', [DailyWorkSummaryController::class, 'refresh'])->name('refresh');
    });

    // Objections
    Route::prefix('objections')->name('objections.')->middleware(['module:rfi,objections'])->group(function () {
        Route::get('/', [ObjectionController::class, 'index'])->name('index');
        Route::get('/create', [ObjectionController::class, 'create'])->name('create');
        Route::post('/', [ObjectionController::class, 'store'])->name('store');
        Route::get('/{objection}', [ObjectionController::class, 'show'])->name('show');
        Route::get('/{objection}/edit', [ObjectionController::class, 'edit'])->name('edit');
        Route::put('/{objection}', [ObjectionController::class, 'update'])->name('update');
        Route::delete('/{objection}', [ObjectionController::class, 'destroy'])->name('destroy');

        // Workflow actions
        Route::post('/{objection}/submit', [ObjectionController::class, 'submit'])->name('submit');
        Route::post('/{objection}/start-review', [ObjectionController::class, 'startReview'])->name('start-review');
        Route::post('/{objection}/resolve', [ObjectionController::class, 'resolve'])->name('resolve');
        Route::post('/{objection}/reject', [ObjectionController::class, 'reject'])->name('reject');

        // Files
        Route::post('/{objection}/files', [ObjectionController::class, 'uploadFiles'])->name('files.upload');
        Route::delete('/{objection}/files/{mediaId}', [ObjectionController::class, 'deleteFile'])->name('files.delete');

        // RFI attachment
        Route::post('/{objection}/rfis', [ObjectionController::class, 'attachToRfis'])->name('rfis.attach');
        Route::delete('/{objection}/rfis', [ObjectionController::class, 'detachFromRfis'])->name('rfis.detach');

        // Suggestions
        Route::get('/{objection}/suggest-rfis', [ObjectionController::class, 'suggestRfis'])->name('suggest-rfis');

        // Review queue
        Route::get('/review/pending', [ObjectionController::class, 'pendingReview'])->name('review.pending');

        // Statistics
        Route::get('/statistics/summary', [ObjectionController::class, 'statistics'])->name('statistics');
    });

    // Work Locations
    Route::prefix('work-locations')->name('work-locations.')->middleware(['module:rfi,work-locations'])->group(function () {
        Route::get('/', [WorkLocationController::class, 'index'])->name('index');
        Route::get('/create', [WorkLocationController::class, 'create'])->name('create');
        Route::post('/', [WorkLocationController::class, 'store'])->name('store');
        Route::get('/{workLocation}', [WorkLocationController::class, 'show'])->name('show');
        Route::get('/{workLocation}/edit', [WorkLocationController::class, 'edit'])->name('edit');
        Route::put('/{workLocation}', [WorkLocationController::class, 'update'])->name('update');
        Route::delete('/{workLocation}', [WorkLocationController::class, 'destroy'])->name('destroy');

        // Daily works for location
        Route::get('/{workLocation}/daily-works', [WorkLocationController::class, 'dailyWorks'])->name('daily-works');

        // Find by chainage
        Route::get('/find/by-chainage', [WorkLocationController::class, 'findByChainage'])->name('find-by-chainage');
    });

    // ============================================================================
    // CHAINAGE PROGRESS MAP (PATENTABLE - Chainage-Centric Construction Ledger)
    // ============================================================================
    Route::prefix('chainage-progress')->name('chainage-progress.')->middleware(['module:rfi,chainage-progress'])->group(function () {
        Route::get('/', [ChainageProgressController::class, 'index'])->name('index');
        Route::get('/api/data', [ChainageProgressController::class, 'getProgressData'])->name('data');
        Route::get('/api/gap-analysis', [ChainageProgressController::class, 'getGapAnalysis'])->name('gap-analysis');
        Route::get('/api/timeline', [ChainageProgressController::class, 'getChainageTimeline'])->name('timeline');
    });

    // ============================================================================
    // WORK LAYERS (Layer Sequencing & Prerequisites)
    // ============================================================================
    Route::prefix('work-layers')->name('work-layers.')->middleware(['module:rfi,work-layers'])->group(function () {
        Route::get('/', [WorkLayerController::class, 'index'])->name('index');
        Route::get('/api/list', [WorkLayerController::class, 'list'])->name('list');
        Route::post('/', [WorkLayerController::class, 'store'])->name('store');
        Route::get('/{workLayer}', [WorkLayerController::class, 'show'])->name('show');
        Route::put('/{workLayer}', [WorkLayerController::class, 'update'])->name('update');
        Route::delete('/{workLayer}', [WorkLayerController::class, 'destroy'])->name('destroy');
        Route::post('/reorder', [WorkLayerController::class, 'reorder'])->name('reorder');
    });

    // ============================================================================
    // CONSTRUCTION TRACKING (Enhanced Industry Features)
    // ============================================================================

    // Material Consumption
    Route::prefix('material-consumptions')->name('material-consumptions.')->middleware(['module:rfi,construction-tracking'])->group(function () {
        Route::get('/', [MaterialConsumptionController::class, 'index'])->name('index');
        Route::post('/', [MaterialConsumptionController::class, 'store'])->name('store');
        Route::get('/{materialConsumption}', [MaterialConsumptionController::class, 'show'])->name('show');
        Route::put('/{materialConsumption}', [MaterialConsumptionController::class, 'update'])->name('update');
        Route::delete('/{materialConsumption}', [MaterialConsumptionController::class, 'destroy'])->name('destroy');

        // Analytics endpoints
        Route::get('/summary/by-material', [MaterialConsumptionController::class, 'summaryByMaterial'])->name('summary.by-material');
        Route::get('/summary/by-chainage', [MaterialConsumptionController::class, 'summaryByChainage'])->name('summary.by-chainage');
        Route::get('/reports/wastage', [MaterialConsumptionController::class, 'wastageReport'])->name('reports.wastage');
        Route::get('/reports/quality', [MaterialConsumptionController::class, 'qualityReport'])->name('reports.quality');
    });

    // Equipment Logs
    Route::prefix('equipment-logs')->name('equipment-logs.')->middleware(['module:rfi,construction-tracking'])->group(function () {
        Route::get('/', [EquipmentLogController::class, 'index'])->name('index');
        Route::post('/', [EquipmentLogController::class, 'store'])->name('store');
        Route::get('/{equipmentLog}', [EquipmentLogController::class, 'show'])->name('show');
        Route::put('/{equipmentLog}', [EquipmentLogController::class, 'update'])->name('update');
        Route::delete('/{equipmentLog}', [EquipmentLogController::class, 'destroy'])->name('destroy');

        // Analytics endpoints
        Route::get('/reports/utilization', [EquipmentLogController::class, 'utilizationReport'])->name('reports.utilization');
        Route::get('/reports/fuel-analysis', [EquipmentLogController::class, 'fuelAnalysis'])->name('reports.fuel-analysis');
        Route::get('/alerts/maintenance', [EquipmentLogController::class, 'maintenanceAlerts'])->name('alerts.maintenance');
        Route::get('/reports/breakdowns', [EquipmentLogController::class, 'breakdownReport'])->name('reports.breakdowns');
    });

    // Weather Logs
    Route::prefix('weather-logs')->name('weather-logs.')->middleware(['module:rfi,construction-tracking'])->group(function () {
        Route::get('/', [WeatherLogController::class, 'index'])->name('index');
        Route::post('/', [WeatherLogController::class, 'store'])->name('store');
        Route::get('/{weatherLog}', [WeatherLogController::class, 'show'])->name('show');
        Route::put('/{weatherLog}', [WeatherLogController::class, 'update'])->name('update');
        Route::delete('/{weatherLog}', [WeatherLogController::class, 'destroy'])->name('destroy');

        // Analytics endpoints
        Route::get('/summary/impact', [WeatherLogController::class, 'impactSummary'])->name('summary.impact');
        Route::get('/summary/work-suitable-days', [WeatherLogController::class, 'workSuitableDays'])->name('summary.work-suitable-days');
        Route::get('/history', [WeatherLogController::class, 'weatherHistory'])->name('history');
    });

    // Progress Photos
    Route::prefix('progress-photos')->name('progress-photos.')->middleware(['module:rfi,construction-tracking'])->group(function () {
        Route::get('/', [ProgressPhotoController::class, 'index'])->name('index');
        Route::post('/', [ProgressPhotoController::class, 'store'])->name('store');
        Route::get('/{progressPhoto}', [ProgressPhotoController::class, 'show'])->name('show');
        Route::put('/{progressPhoto}', [ProgressPhotoController::class, 'update'])->name('update');
        Route::delete('/{progressPhoto}', [ProgressPhotoController::class, 'destroy'])->name('destroy');

        // Workflow actions
        Route::post('/{progressPhoto}/submit', [ProgressPhotoController::class, 'submit'])->name('submit');
        Route::post('/{progressPhoto}/approve', [ProgressPhotoController::class, 'approve'])->name('approve');

        // Analytics endpoints
        Route::get('/by-chainage', [ProgressPhotoController::class, 'byChainage'])->name('by-chainage');
        Route::get('/timeline', [ProgressPhotoController::class, 'timeline'])->name('timeline');
    });

    // Labor Deployments
    Route::prefix('labor-deployments')->name('labor-deployments.')->middleware(['module:rfi,construction-tracking'])->group(function () {
        Route::get('/', [LaborDeploymentController::class, 'index'])->name('index');
        Route::post('/', [LaborDeploymentController::class, 'store'])->name('store');
        Route::get('/{laborDeployment}', [LaborDeploymentController::class, 'show'])->name('show');
        Route::put('/{laborDeployment}', [LaborDeploymentController::class, 'update'])->name('update');
        Route::delete('/{laborDeployment}', [LaborDeploymentController::class, 'destroy'])->name('destroy');

        // Analytics endpoints
        Route::get('/reports/productivity', [LaborDeploymentController::class, 'productivityAnalysis'])->name('reports.productivity');
        Route::get('/reports/man-hours', [LaborDeploymentController::class, 'manHoursSummary'])->name('reports.man-hours');
        Route::get('/reports/skill-distribution', [LaborDeploymentController::class, 'skillDistribution'])->name('reports.skill-distribution');
        Route::get('/reports/safety', [LaborDeploymentController::class, 'safetyReport'])->name('reports.safety');
    });

    // Site Instructions
    Route::prefix('site-instructions')->name('site-instructions.')->middleware(['module:rfi,construction-tracking'])->group(function () {
        Route::get('/', [SiteInstructionController::class, 'index'])->name('index');
        Route::post('/', [SiteInstructionController::class, 'store'])->name('store');
        Route::get('/{siteInstruction}', [SiteInstructionController::class, 'show'])->name('show');
        Route::put('/{siteInstruction}', [SiteInstructionController::class, 'update'])->name('update');
        Route::delete('/{siteInstruction}', [SiteInstructionController::class, 'destroy'])->name('destroy');

        // Workflow actions
        Route::post('/{siteInstruction}/status', [SiteInstructionController::class, 'updateStatus'])->name('status');
        Route::post('/{siteInstruction}/response', [SiteInstructionController::class, 'addResponse'])->name('response');

        // Analytics endpoints
        Route::get('/overdue', [SiteInstructionController::class, 'overdueInstructions'])->name('overdue');
        Route::get('/by-chainage', [SiteInstructionController::class, 'byChainage'])->name('by-chainage');
        Route::get('/reports/impact', [SiteInstructionController::class, 'impactAnalysis'])->name('reports.impact');
        Route::get('/reports/completion', [SiteInstructionController::class, 'completionReport'])->name('reports.completion');
    });

}); // End of auth middleware group
