<?php

use App\Http\Controllers\DMSController;
use Illuminate\Support\Facades\Route;

// DMS (Document Management System) Routes
Route::middleware(['auth', 'verified'])->prefix('dms')->name('dms.')->group(function () {

    // Dashboard and main views
    Route::get('/', [DMSController::class, 'index'])->name('index');

    // Document management routes
    Route::middleware(['permission:dms.view'])->group(function () {
        Route::get('/documents', [DMSController::class, 'documents'])->name('documents');
        Route::get('/documents/{document}', [DMSController::class, 'show'])->name('documents.show');
        Route::get('/documents/{document}/download', [DMSController::class, 'download'])->name('documents.download');
        Route::get('/shared', [DMSController::class, 'shared'])->name('shared');
        Route::get('/analytics', [DMSController::class, 'analytics'])->name('analytics');
    });

    // Document creation and upload
    Route::middleware(['permission:dms.create'])->group(function () {
        Route::get('/documents/create', [DMSController::class, 'create'])->name('documents.create');
        Route::post('/documents', [DMSController::class, 'store'])->name('documents.store');
    });

    // Document editing
    Route::middleware(['permission:dms.update'])->group(function () {
        Route::put('/documents/{document}', [DMSController::class, 'update'])->name('documents.update');
        Route::post('/documents/{document}/share', [DMSController::class, 'share'])->name('documents.share');
    });

    // Document deletion
    Route::middleware(['permission:dms.delete'])->group(function () {
        Route::delete('/documents/{document}', [DMSController::class, 'destroy'])->name('documents.destroy');
    });

    // Category and folder management
    Route::middleware(['permission:dms.manage'])->group(function () {
        Route::get('/categories', [DMSController::class, 'categories'])->name('categories');
        Route::post('/categories', [DMSController::class, 'storeCategory'])->name('categories.store');
        Route::put('/categories/{category}', [DMSController::class, 'updateCategory'])->name('categories.update');
        Route::delete('/categories/{category}', [DMSController::class, 'destroyCategory'])->name('categories.destroy');

        Route::get('/folders', [DMSController::class, 'folders'])->name('folders');
        Route::post('/folders', [DMSController::class, 'storeFolder'])->name('folders.store');
        Route::put('/folders/{folder}', [DMSController::class, 'updateFolder'])->name('folders.update');
        Route::delete('/folders/{folder}', [DMSController::class, 'destroyFolder'])->name('folders.destroy');
    });

    // Admin routes
    Route::middleware(['permission:dms.admin'])->group(function () {
        Route::get('/access-control', [DMSController::class, 'accessControl'])->name('access-control');
        Route::post('/access-control/update', [DMSController::class, 'updateAccessControl'])->name('access-control.update');
    });
});
