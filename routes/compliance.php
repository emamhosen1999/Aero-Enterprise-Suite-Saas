<?php

use App\Http\Controllers\Compliance\AuditController;
use App\Http\Controllers\Compliance\DocumentController;
use App\Http\Controllers\Compliance\RequirementController;
use Illuminate\Support\Facades\Route;

// Compliance Routes
Route::middleware(['auth', 'verified'])->prefix('compliance')->name('compliance.')->group(function () {
    // Compliance Dashboard

    // Documents
    Route::middleware(['permission:compliance.documents.view'])->group(function () {
        Route::get('/documents', [DocumentController::class, 'index'])->name('documents.index');
        Route::get('/documents/create', [DocumentController::class, 'create'])->name('documents.create');
        Route::get('/documents/{document}', [DocumentController::class, 'show'])->name('documents.show');
        Route::get('/documents/{document}/edit', [DocumentController::class, 'edit'])->name('documents.edit');
        Route::get('/documents/{document}/download', [DocumentController::class, 'download'])->name('documents.download');
    });

    Route::middleware(['permission:compliance.documents.create'])->post('/documents', [DocumentController::class, 'store'])->name('documents.store');
    Route::middleware(['permission:compliance.documents.update'])->put('/documents/{document}', [DocumentController::class, 'update'])->name('documents.update');
    Route::middleware(['permission:compliance.documents.delete'])->delete('/documents/{document}', [DocumentController::class, 'destroy'])->name('documents.destroy');

    // Audits
    Route::middleware(['permission:compliance.audits.view'])->group(function () {
        Route::get('/audits', [AuditController::class, 'index'])->name('audits.index');
        Route::get('/audits/create', [AuditController::class, 'create'])->name('audits.create');
        Route::get('/audits/{audit}', [AuditController::class, 'show'])->name('audits.show');
        Route::get('/audits/{audit}/edit', [AuditController::class, 'edit'])->name('audits.edit');
    });

    Route::middleware(['permission:compliance.audits.create'])->post('/audits', [AuditController::class, 'store'])->name('audits.store');
    Route::middleware(['permission:compliance.audits.update'])->group(function () {
        Route::put('/audits/{audit}', [AuditController::class, 'update'])->name('audits.update');
        Route::post('/audits/{audit}/findings', [AuditController::class, 'storeFinding'])->name('audits.findings.store');
        Route::put('/findings/{finding}', [AuditController::class, 'updateFinding'])->name('findings.update');
        Route::delete('/findings/{finding}', [AuditController::class, 'destroyFinding'])->name('findings.destroy');
    });
    Route::middleware(['permission:compliance.audits.delete'])->delete('/audits/{audit}', [AuditController::class, 'destroy'])->name('audits.destroy');

    // Requirements
    Route::middleware(['permission:compliance.requirements.view'])->group(function () {
        Route::get('/requirements', [RequirementController::class, 'index'])->name('requirements.index');
        Route::get('/requirements/create', [RequirementController::class, 'create'])->name('requirements.create');
        Route::get('/requirements/{requirement}', [RequirementController::class, 'show'])->name('requirements.show');
        Route::get('/requirements/{requirement}/edit', [RequirementController::class, 'edit'])->name('requirements.edit');
    });

    Route::middleware(['permission:compliance.requirements.create'])->post('/requirements', [RequirementController::class, 'store'])->name('requirements.store');
    Route::middleware(['permission:compliance.requirements.update'])->put('/requirements/{requirement}', [RequirementController::class, 'update'])->name('requirements.update');
    Route::middleware(['permission:compliance.requirements.delete'])->delete('/requirements/{requirement}', [RequirementController::class, 'destroy'])->name('requirements.destroy');
});
