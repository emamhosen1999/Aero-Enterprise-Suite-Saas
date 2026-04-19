<?php

use Aero\Crm\Http\Controllers\CustomerController;
use Aero\Crm\Http\Controllers\DealController;
use Aero\Crm\Http\Controllers\OpportunityController;
use Aero\Crm\Http\Controllers\PipelineController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| CRM Module Routes
|--------------------------------------------------------------------------
|
| All routes here are loaded by AbstractModuleProvider which wraps them
| with the SaaS or standalone outer middleware + prefix 'crm' + name 'crm.'.
| Auth and HRMAC middleware are declared inside each inner group below.
|
*/

Route::middleware(['auth', 'hrmac:crm'])->group(function () {
    // Customer routes
    Route::middleware('hrmac:crm.customers')->resource('customers', CustomerController::class);

    // Deal routes
    Route::middleware('hrmac:crm.deals')->resource('deals', DealController::class);

    // Opportunity routes
    Route::middleware('hrmac:crm.opportunities')->resource('opportunities', OpportunityController::class);

    // Pipeline routes
    Route::middleware('hrmac:crm.pipelines')->resource('pipelines', PipelineController::class);
});
