<?php

use Aero\Rfi\Http\Controllers\DailyWorkController;
use Aero\Rfi\Http\Controllers\ObjectionController;
use Aero\Rfi\Http\Controllers\RfiDashboardController;
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
*/

// Dashboard
Route::get('/', [RfiDashboardController::class, 'index'])->name('dashboard');

// Daily Works (RFIs)
Route::prefix('daily-works')->name('daily-works.')->group(function () {
    Route::get('/', [DailyWorkController::class, 'index'])->name('index');
    Route::get('/create', [DailyWorkController::class, 'create'])->name('create');
    Route::post('/', [DailyWorkController::class, 'store'])->name('store');
    Route::get('/{dailyWork}', [DailyWorkController::class, 'show'])->name('show');
    Route::get('/{dailyWork}/edit', [DailyWorkController::class, 'edit'])->name('edit');
    Route::put('/{dailyWork}', [DailyWorkController::class, 'update'])->name('update');
    Route::delete('/{dailyWork}', [DailyWorkController::class, 'destroy'])->name('destroy');

    // RFI Submission
    Route::post('/{dailyWork}/submit', [DailyWorkController::class, 'submit'])->name('submit');

    // Inspection
    Route::post('/{dailyWork}/inspect', [DailyWorkController::class, 'inspect'])->name('inspect');

    // Files
    Route::post('/{dailyWork}/files', [DailyWorkController::class, 'uploadFiles'])->name('files.upload');
    Route::delete('/{dailyWork}/files/{mediaId}', [DailyWorkController::class, 'deleteFile'])->name('files.delete');

    // Objection management
    Route::post('/{dailyWork}/objections', [DailyWorkController::class, 'attachObjections'])->name('objections.attach');
    Route::delete('/{dailyWork}/objections', [DailyWorkController::class, 'detachObjections'])->name('objections.detach');

    // Summary
    Route::get('/summary/view', [DailyWorkController::class, 'summary'])->name('summary');

    // Bulk operations
    Route::post('/bulk/status', [DailyWorkController::class, 'bulkUpdateStatus'])->name('bulk.status');

    // Export
    Route::get('/export/csv', [DailyWorkController::class, 'export'])->name('export');
});

// Objections
Route::prefix('objections')->name('objections.')->group(function () {
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
Route::prefix('work-locations')->name('work-locations.')->group(function () {
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
