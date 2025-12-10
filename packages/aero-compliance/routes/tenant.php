<?php

use Illuminate\Support\Facades\Route;
use Aero\Compliance\Http\Controllers\ComplianceController;
use Aero\Compliance\Http\Controllers\RegulatoryRequirementController;
use Aero\Compliance\Http\Controllers\AuditController;
use Aero\Compliance\Http\Controllers\CompliancePolicyController;
use Aero\Compliance\Http\Controllers\JurisdictionController;
use Aero\Compliance\Http\Controllers\DocumentController;

/*
|--------------------------------------------------------------------------
| Compliance Tenant Routes
|--------------------------------------------------------------------------
*/

Route::prefix('compliance')->name('compliance.')->middleware(['auth', 'tenant'])->group(function () {
    // Compliance Dashboard
    Route::get('/', [ComplianceController::class, 'index'])->name('dashboard');
    
    // Regulatory Requirements
    Route::resource('requirements', RegulatoryRequirementController::class);
    Route::post('requirements/{id}/assess', [RegulatoryRequirementController::class, 'assess'])->name('requirements.assess');
    
    // Audits
    Route::resource('audits', AuditController::class);
    Route::post('audits/{id}/schedule', [AuditController::class, 'schedule'])->name('audits.schedule');
    
    // Compliance Policies
    Route::resource('policies', CompliancePolicyController::class);
    Route::post('policies/{id}/publish', [CompliancePolicyController::class, 'publish'])->name('policies.publish');
    
    // Jurisdictions
    Route::resource('jurisdictions', JurisdictionController::class);
    
    // Documents
    Route::resource('documents', DocumentController::class);
});
