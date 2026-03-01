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
| NOTE: InitializeTenancyIfNotCentral MUST come before 'tenant' middleware
| to gracefully return 404 on central domains instead of crashing.
|
*/

Route::prefix('crm')->name('crm.')->middleware(['web', InitializeTenancyIfNotCentral::class, 'tenant', 'auth'])->group(function () {
    // Customer routes
    Route::resource('customers', CustomerController::class);

    // Deal routes
    Route::resource('deals', DealController::class);

    // Opportunity routes
    Route::resource('opportunities', OpportunityController::class);

    // Pipeline routes
    Route::resource('pipelines', PipelineController::class);
});
