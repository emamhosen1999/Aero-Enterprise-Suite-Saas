<?php

use Aero\Compliance\Http\Controllers\AuditController;
use Aero\Compliance\Http\Controllers\ComplianceController;
use Aero\Compliance\Http\Controllers\CompliancePolicyController;
use Aero\Compliance\Http\Controllers\DocumentController;
use Aero\Compliance\Http\Controllers\JurisdictionController;
use Aero\Compliance\Http\Controllers\RegulatoryRequirementController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Compliance Tenant Routes
|--------------------------------------------------------------------------
| These routes are automatically wrapped by AbstractModuleProvider with:
| - Middleware: web, InitializeTenancyIfNotCentral, tenant (SaaS mode)
| - Prefix: /compliance
| - Name prefix: compliance.
|
| HRMAC Integration: All routes use 'module:compliance,{submodule}' middleware
| Sub-modules defined in config/module.php: hse-management, workforce-certs, regulatory-tracker
*/

// Compliance Dashboard - module level access only
Route::middleware(['auth', 'module:compliance'])->group(function () {
    Route::get('/', [ComplianceController::class, 'index'])->name('dashboard');
});

// Regulatory Requirements - maps to 'regulatory-tracker' sub-module
Route::middleware(['auth', 'module:compliance,regulatory-tracker'])->group(function () {
    Route::resource('requirements', RegulatoryRequirementController::class);
    Route::post('requirements/{id}/assess', [RegulatoryRequirementController::class, 'assess'])->name('requirements.assess');

    // Jurisdictions
    Route::resource('jurisdictions', JurisdictionController::class);
});

// Audits - maps to 'hse-management' sub-module
Route::middleware(['auth', 'module:compliance,hse-management'])->group(function () {
    Route::resource('audits', AuditController::class);
    Route::post('audits/{id}/schedule', [AuditController::class, 'schedule'])->name('audits.schedule');
});

// Compliance Policies - maps to 'regulatory-tracker' sub-module
Route::middleware(['auth', 'module:compliance,regulatory-tracker'])->group(function () {
    Route::resource('policies', CompliancePolicyController::class);
    Route::post('policies/{id}/publish', [CompliancePolicyController::class, 'publish'])->name('policies.publish');
});

// Documents - maps to 'regulatory-tracker' sub-module
Route::middleware(['auth', 'module:compliance,regulatory-tracker'])->group(function () {
    Route::resource('documents', DocumentController::class);
});
