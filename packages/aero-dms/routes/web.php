<?php

use Aero\Dms\Http\Controllers\DMSController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| DMS Module Routes
|--------------------------------------------------------------------------
|
| All routes here are loaded by AbstractModuleProvider which wraps them
| with the SaaS or standalone outer middleware + prefix 'dms' + name 'dms.'.
| Auth and HRMAC middleware are declared inside each inner group below.
|
*/

// Dashboard
Route::middleware(['auth', 'hrmac:dms'])->group(function () {
    Route::get('/dashboard', [DMSController::class, 'index'])->name('dashboard');
});

// Documents
Route::middleware(['auth', 'hrmac:dms.documents'])->group(function () {
    Route::get('/documents', [DMSController::class, 'documents'])->name('documents');
    Route::get('/documents/create', [DMSController::class, 'create'])->name('documents.create');
    Route::post('/documents', [DMSController::class, 'store'])->name('documents.store');
    Route::get('/documents/{id}', [DMSController::class, 'show'])->name('documents.show');
    Route::put('/documents/{id}', [DMSController::class, 'update'])->name('documents.update');
    Route::delete('/documents/{id}', [DMSController::class, 'destroy'])->name('documents.destroy');
    Route::get('/documents/{id}/download', [DMSController::class, 'download'])->name('documents.download');
    Route::get('/search', [DMSController::class, 'search'])->name('search');
    Route::get('/statistics', [DMSController::class, 'statistics'])->name('statistics');
    Route::get('/analytics', [DMSController::class, 'analytics'])->name('analytics');
    Route::get('/folders', [DMSController::class, 'folders'])->name('folders');
    Route::post('/folders', [DMSController::class, 'storeFolder'])->name('folders.store');
    Route::put('/folders/{id}', [DMSController::class, 'updateFolder'])->name('folders.update');
    Route::delete('/folders/{id}', [DMSController::class, 'destroyFolder'])->name('folders.destroy');
    Route::get('/categories', [DMSController::class, 'categories'])->name('categories');
    Route::post('/categories', [DMSController::class, 'storeCategory'])->name('categories.store');
    Route::get('/templates', [DMSController::class, 'templates'])->name('templates');
    Route::post('/templates', [DMSController::class, 'storeTemplate'])->name('templates.store');
});

// Document Sharing
Route::middleware(['auth', 'hrmac:dms.sharing'])->group(function () {
    Route::post('/documents/{id}/share', [DMSController::class, 'share'])->name('documents.share');
    Route::get('/shared-documents', [DMSController::class, 'shared'])->name('shared-documents');
});

// Document Versions
Route::middleware(['auth', 'hrmac:dms.versions'])->group(function () {
    Route::get('/documents/{id}/versions', [DMSController::class, 'versions'])->name('documents.versions');
    Route::post('/documents/{id}/versions', [DMSController::class, 'createVersion'])->name('documents.versions.create');
    Route::get('/documents/{id}/versions/{versionId}/download', [DMSController::class, 'downloadVersion'])->name('documents.versions.download');
});

// Approvals
Route::middleware(['auth', 'hrmac:dms.approvals'])->group(function () {
    Route::get('/approvals', [DMSController::class, 'approvals'])->name('approvals');
    Route::post('/documents/{id}/request-approval', [DMSController::class, 'requestApproval'])->name('documents.request-approval');
    Route::post('/approvals/{id}/approve', [DMSController::class, 'approveDocument'])->name('approvals.approve');
    Route::post('/approvals/{id}/reject', [DMSController::class, 'rejectDocument'])->name('approvals.reject');
});

// Access Control (Settings)
Route::middleware(['auth', 'hrmac:dms.settings'])->group(function () {
    Route::get('/access-control', [DMSController::class, 'accessControl'])->name('access-control');
    Route::post('/access-control', [DMSController::class, 'updateAccessControl'])->name('access-control.store');
    Route::delete('/access-control/{id}', [DMSController::class, 'deleteAccessRule'])->name('access-control.destroy');
});
