<?php

use Illuminate\Support\Facades\Route;
use Aero\Dms\Http\Controllers\DMSController;
use Aero\Core\Http\Middleware\InitializeTenancyIfNotCentral;

/*
|--------------------------------------------------------------------------
| DMS Tenant Routes
|--------------------------------------------------------------------------
|
| Here are the tenant-scoped routes for the Document Management System module.
| NOTE: InitializeTenancyIfNotCentral MUST come before 'tenant' middleware
| to gracefully return 404 on central domains instead of crashing.
|
*/

Route::middleware(['web', InitializeTenancyIfNotCentral::class, 'tenant', 'auth'])->group(function () {
    Route::prefix('dms')->name('tenant.dms.')->group(function () {
        // Dashboard
        Route::get('/dashboard', [DMSController::class, 'index'])->name('dashboard');
        
        // Documents
        Route::get('/documents', [DMSController::class, 'documents'])->name('documents');
        Route::post('/documents', [DMSController::class, 'store'])->name('documents.store');
        Route::get('/documents/{id}', [DMSController::class, 'show'])->name('documents.show');
        Route::put('/documents/{id}', [DMSController::class, 'update'])->name('documents.update');
        Route::delete('/documents/{id}', [DMSController::class, 'destroy'])->name('documents.destroy');
        Route::get('/documents/{id}/download', [DMSController::class, 'download'])->name('documents.download');
        Route::post('/documents/{id}/share', [DMSController::class, 'share'])->name('documents.share');
        
        // Document Versions
        Route::get('/documents/{id}/versions', [DMSController::class, 'versions'])->name('documents.versions');
        Route::post('/documents/{id}/versions', [DMSController::class, 'createVersion'])->name('documents.versions.create');
        Route::get('/documents/{id}/versions/{versionId}/download', [DMSController::class, 'downloadVersion'])->name('documents.versions.download');
        
        // Folders
        Route::get('/folders', [DMSController::class, 'folders'])->name('folders');
        Route::post('/folders', [DMSController::class, 'storeFolder'])->name('folders.store');
        Route::put('/folders/{id}', [DMSController::class, 'updateFolder'])->name('folders.update');
        Route::delete('/folders/{id}', [DMSController::class, 'destroyFolder'])->name('folders.destroy');
        
        // Categories
        Route::get('/categories', [DMSController::class, 'categories'])->name('categories');
        Route::post('/categories', [DMSController::class, 'storeCategory'])->name('categories.store');
        
        // Templates
        Route::get('/templates', [DMSController::class, 'templates'])->name('templates');
        Route::post('/templates', [DMSController::class, 'storeTemplate'])->name('templates.store');
        
        // Approvals
        Route::get('/approvals', [DMSController::class, 'approvals'])->name('approvals');
        Route::post('/documents/{id}/request-approval', [DMSController::class, 'requestApproval'])->name('documents.request-approval');
        Route::post('/approvals/{id}/approve', [DMSController::class, 'approveDocument'])->name('approvals.approve');
        Route::post('/approvals/{id}/reject', [DMSController::class, 'rejectDocument'])->name('approvals.reject');
    });
});
