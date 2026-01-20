<?php

use Aero\Rfi\Http\Controllers\ChainageProgressController;
use Aero\Rfi\Http\Controllers\RfiWebController;
use Aero\Rfi\Http\Controllers\RfiSummaryController;
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

    // ========================================================================
    // SELF-SERVICE ROUTES (My Workspace)
    // ========================================================================
    Route::get('/my-rfis', [RfiWebController::class, 'myRfis'])->name('my-rfis');
    Route::get('/my-inspections', [RfiWebController::class, 'myInspections'])->name('my-inspections');

    // Dashboard - module level access only (no sub-module required for dashboard)
    Route::middleware(['module:rfi'])
        ->get('/', [RfiDashboardController::class, 'index'])
        ->name('dashboard');

    // Site Diary - maps to daily-reporting sub-module
    Route::middleware(['module:rfi,daily-reporting'])
        ->get('/site-diary', [RfiDashboardController::class, 'index'])
        ->name('site-diary');

    // Hindrance Register (Daily Delays) - maps to daily-reporting sub-module
    Route::middleware(['module:rfi,daily-reporting'])
        ->get('/daily/delays', [RfiDashboardController::class, 'index'])
        ->name('daily.delays');

    // RFIs - maps to inspection-management sub-module
    Route::prefix('rfis')->name('rfis.')->middleware(['module:rfi,inspection-management'])->group(function () {
    Route::get('/', [RfiWebController::class, 'index'])->name('index');
    Route::get('/create', [RfiWebController::class, 'create'])->name('create');
    Route::post('/', [RfiWebController::class, 'store'])->name('store');
    Route::get('/{rfi}', [RfiWebController::class, 'show'])->name('show');
    Route::get('/{rfi}/edit', [RfiWebController::class, 'edit'])->name('edit');
    Route::put('/{rfi}', [RfiWebController::class, 'update'])->name('update');
    Route::delete('/{rfi}', [RfiWebController::class, 'destroy'])->name('destroy');

    // API Endpoints for pagination and filtering
    Route::get('/api/paginate', [RfiWebController::class, 'paginate'])->name('paginate');
    Route::get('/api/all', [RfiWebController::class, 'all'])->name('all');

    // Import
    Route::post('/import', [RfiWebController::class, 'import'])->name('import');
    Route::get('/template/download', [RfiWebController::class, 'downloadTemplate'])->name('template.download');

    // RFI Submission
    Route::post('/{rfi}/submit', [RfiWebController::class, 'submit'])->name('submit');

    // Inspection
    Route::post('/{rfi}/inspect', [RfiWebController::class, 'inspect'])->name('inspect');

    // Files
    Route::post('/{rfi}/files', [RfiWebController::class, 'uploadFiles'])->name('files.upload');
    Route::get('/{rfi}/files', [RfiWebController::class, 'getRfiFiles'])->name('files.list');
    Route::delete('/{rfi}/files/{mediaId}', [RfiWebController::class, 'deleteFile'])->name('files.delete');
    Route::get('/{rfi}/files/{mediaId}/download', [RfiWebController::class, 'downloadRfiFile'])->name('files.download');

    // Objection management
    Route::get('/{rfi}/objections', [RfiWebController::class, 'getObjections'])->name('objections.index');
    Route::get('/{rfi}/objections/available', [RfiWebController::class, 'getAvailableObjections'])->name('objections.available');
    Route::post('/{rfi}/objections', [RfiWebController::class, 'attachObjections'])->name('objections.attach');
    Route::delete('/{rfi}/objections', [RfiWebController::class, 'detachObjections'])->name('objections.detach');

    // Bulk operations
    Route::post('/bulk/status', [RfiWebController::class, 'bulkUpdateStatus'])->name('bulk.status');
    Route::post('/bulk/submit', [RfiWebController::class, 'bulkSubmit'])->name('bulk.submit');
    Route::post('/bulk/import-submit', [RfiWebController::class, 'bulkImportSubmit'])->name('bulk.import-submit');
    Route::get('/bulk/submit-template', [RfiWebController::class, 'downloadBulkImportTemplate'])->name('bulk.submit-template');
    Route::post('/bulk/response-status', [RfiWebController::class, 'bulkResponseStatusUpdate'])->name('bulk.response-status');
    Route::post('/bulk/import-response-status', [RfiWebController::class, 'bulkImportResponseStatus'])->name('bulk.import-response-status');
    Route::get('/bulk/response-status-template', [RfiWebController::class, 'downloadResponseStatusTemplate'])->name('bulk.response-status-template');

    // Status updates
    Route::post('/update-status', [RfiWebController::class, 'updateStatus'])->name('update-status');
    Route::post('/update-completion-time', [RfiWebController::class, 'updateCompletionTime'])->name('update-completion-time');
    Route::post('/update-submission-time', [RfiWebController::class, 'updateSubmissionTime'])->name('update-submission-time');
    Route::post('/update-inspection-details', [RfiWebController::class, 'updateInspectionDetails'])->name('update-inspection-details');
    Route::post('/update-incharge', [RfiWebController::class, 'updateIncharge'])->name('update-incharge');
    Route::post('/update-assigned', [RfiWebController::class, 'updateAssigned'])->name('update-assigned');

    // Export
    Route::get('/export/csv', [RfiWebController::class, 'export'])->name('export');
    Route::get('/export/objected', [RfiWebController::class, 'exportObjectedRfis'])->name('export.objected');
});

    // RFI Summary - maps to inspection-management sub-module
    Route::prefix('rfis-summary')->name('rfis-summary.')->middleware(['module:rfi,inspection-management'])->group(function () {
        Route::get('/', [RfiSummaryController::class, 'index'])->name('index');
        Route::post('/filter', [RfiSummaryController::class, 'filterSummary'])->name('filter');
        Route::get('/export', [RfiSummaryController::class, 'exportDailySummary'])->name('export');
        Route::get('/statistics', [RfiSummaryController::class, 'getStatistics'])->name('statistics');
        Route::post('/refresh', [RfiSummaryController::class, 'refresh'])->name('refresh');
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

    // Work Locations - maps to daily-reporting sub-module
    Route::prefix('work-locations')->name('work-locations.')->middleware(['module:rfi,daily-reporting'])->group(function () {
        Route::get('/', [WorkLocationController::class, 'index'])->name('index');
        Route::get('/create', [WorkLocationController::class, 'create'])->name('create');
        Route::post('/', [WorkLocationController::class, 'store'])->name('store');
        Route::get('/{workLocation}', [WorkLocationController::class, 'show'])->name('show');
        Route::get('/{workLocation}/edit', [WorkLocationController::class, 'edit'])->name('edit');
        Route::put('/{workLocation}', [WorkLocationController::class, 'update'])->name('update');
        Route::delete('/{workLocation}', [WorkLocationController::class, 'destroy'])->name('destroy');

        // RFIs for location
        Route::get('/{workLocation}/rfis', [WorkLocationController::class, 'rfis'])->name('rfis');

        // Find by chainage
        Route::get('/find/by-chainage', [WorkLocationController::class, 'findByChainage'])->name('find-by-chainage');
    });

    // ============================================================================
    // CHAINAGE PROGRESS MAP (PATENTABLE - Chainage-Centric Construction Ledger)
    // ============================================================================
    Route::prefix('chainage-progress')->name('chainage-progress.')->middleware(['module:rfi,linear-progress'])->group(function () {
        Route::get('/', [ChainageProgressController::class, 'index'])->name('index');
        Route::get('/api/data', [ChainageProgressController::class, 'getProgressData'])->name('data');
        Route::get('/api/gap-analysis', [ChainageProgressController::class, 'getGapAnalysis'])->name('gap-analysis');
        Route::get('/api/timeline', [ChainageProgressController::class, 'getChainageTimeline'])->name('timeline');
    });

    // ============================================================================
    // WORK LAYERS (Layer Sequencing & Prerequisites)
    // ============================================================================
    Route::prefix('work-layers')->name('work-layers.')->middleware(['module:rfi,linear-progress'])->group(function () {
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

    // Material Consumption - maps to daily-reporting sub-module
    Route::prefix('material-consumptions')->name('material-consumptions.')->middleware(['module:rfi,daily-reporting'])->group(function () {
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

    // Equipment Logs - maps to daily-reporting sub-module
    Route::prefix('equipment-logs')->name('equipment-logs.')->middleware(['module:rfi,daily-reporting'])->group(function () {
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

    // Weather Logs - maps to daily-reporting sub-module
    Route::prefix('weather-logs')->name('weather-logs.')->middleware(['module:rfi,daily-reporting'])->group(function () {
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

    // Progress Photos - maps to daily-reporting sub-module
    Route::prefix('progress-photos')->name('progress-photos.')->middleware(['module:rfi,daily-reporting'])->group(function () {
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

    // Labor Deployments - maps to daily-reporting sub-module
    Route::prefix('labor-deployments')->name('labor-deployments.')->middleware(['module:rfi,daily-reporting'])->group(function () {
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

    // Site Instructions - maps to daily-reporting sub-module
    Route::prefix('site-instructions')->name('site-instructions.')->middleware(['module:rfi,daily-reporting'])->group(function () {
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
