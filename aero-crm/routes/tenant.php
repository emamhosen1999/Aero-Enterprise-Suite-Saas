<?php

use Illuminate\Support\Facades\Route;
use Aero\Crm\Http\Controllers\CustomerController;
use Aero\Crm\Http\Controllers\DealController;
use Aero\Crm\Http\Controllers\OpportunityController;
use Aero\Crm\Http\Controllers\PipelineController;

/*
|--------------------------------------------------------------------------
| CRM Tenant Routes
|--------------------------------------------------------------------------
|
| These routes are loaded for tenant users within the CRM module.
|
*/

Route::prefix('crm')->name('crm.')->middleware(['auth', 'tenant'])->group(function () {
    // Customer routes
    Route::resource('customers', CustomerController::class);
    
    // Deal routes
    Route::resource('deals', DealController::class);
    
    // Opportunity routes
    Route::resource('opportunities', OpportunityController::class);
    
    // Pipeline routes
    Route::resource('pipelines', PipelineController::class);
});
