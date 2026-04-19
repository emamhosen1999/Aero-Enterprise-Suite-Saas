<?php

use Aero\Core\Http\Middleware\InitializeTenancyIfNotCentral;
use Aero\Crm\Http\Controllers\CustomerController;
use Aero\Crm\Http\Controllers\DealController;
use Aero\Crm\Http\Controllers\OpportunityController;
use Aero\Crm\Http\Controllers\PipelineController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| CRM Tenant Routes
|--------------------------------------------------------------------------
|
| These routes are loaded for tenant users within the CRM module.
| All routes are protected by HRMAC middleware using dot-notation paths
| matching config/module.php hierarchy.
|
| NOTE: InitializeTenancyIfNotCentral MUST come before 'tenant' middleware
| to gracefully return 404 on central domains instead of crashing.
|
*/

Route::prefix('crm')->name('crm.')->middleware(['web', InitializeTenancyIfNotCentral::class, 'tenant', 'auth', 'hrmac:crm'])->group(function () {
    // Customer routes
    Route::middleware('hrmac:crm.customers')->resource('customers', CustomerController::class);

    // Deal routes
    Route::middleware('hrmac:crm.deals')->resource('deals', DealController::class);

    // Opportunity routes
    Route::middleware('hrmac:crm.opportunities')->resource('opportunities', OpportunityController::class);

    // Pipeline routes
    Route::middleware('hrmac:crm.pipelines')->resource('pipelines', PipelineController::class);
});
