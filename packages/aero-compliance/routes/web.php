<?php

use Aero\Compliance\Http\Controllers\AuditController;
use Aero\Compliance\Http\Controllers\ComplianceController;
use Aero\Compliance\Http\Controllers\CompliancePolicyController;
use Aero\Compliance\Http\Controllers\DocumentController;
use Aero\Compliance\Http\Controllers\JurisdictionController;
use Aero\Compliance\Http\Controllers\PermitValidationController;
use Aero\Compliance\Http\Controllers\RegulatoryRequirementController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Compliance Module Routes
|--------------------------------------------------------------------------
|
| All routes here are loaded by AbstractModuleProvider which wraps them
| with the SaaS or standalone outer middleware + prefix 'compliance' + name 'compliance.'.
| Auth and HRMAC middleware are declared inside each inner group below.
|
*/

// Compliance Dashboard
Route::middleware(['auth', 'hrmac:compliance'])->group(function () {
    Route::get('/', [ComplianceController::class, 'index'])->name('dashboard');
});

// Regulatory Requirements
Route::middleware(['auth', 'hrmac:compliance.regulatory-tracker'])->group(function () {
    Route::resource('requirements', RegulatoryRequirementController::class);
    Route::post('requirements/{id}/assess', [RegulatoryRequirementController::class, 'assess'])->name('requirements.assess');
    Route::resource('jurisdictions', JurisdictionController::class);
});

// Audits (HSE Management)
Route::middleware(['auth', 'hrmac:compliance.hse-management'])->group(function () {
    Route::resource('audits', AuditController::class);
    Route::post('audits/{id}/schedule', [AuditController::class, 'schedule'])->name('audits.schedule');
});

// Compliance Policies
Route::middleware(['auth', 'hrmac:compliance.regulatory-tracker'])->group(function () {
    Route::resource('policies', CompliancePolicyController::class);
    Route::post('policies/{id}/publish', [CompliancePolicyController::class, 'publish'])->name('policies.publish');
    Route::resource('documents', DocumentController::class);
});

// Permit Validation API (Sanctum-protected)
Route::middleware(['auth:sanctum', 'hrmac:compliance.regulatory-tracker'])->prefix('permits')->name('permits.')->group(function () {
    Route::post('validate', [PermitValidationController::class, 'validate'])->name('validate');
    Route::get('requirements', [PermitValidationController::class, 'getRequirements'])->name('requirements');
    Route::get('categories', [PermitValidationController::class, 'listCategories'])->name('categories');
});
