<?php

use Illuminate\Support\Facades\Route;
use Aero\Scm\Http\Controllers\ProcurementController;
use Aero\Scm\Http\Controllers\SupplierController;
use Aero\Scm\Http\Controllers\LogisticsController;
use Aero\Scm\Http\Controllers\ProductionPlanController;
use Aero\Scm\Http\Controllers\PurchaseController;
use Aero\Scm\Http\Controllers\DemandForecastController;
use Aero\Scm\Http\Controllers\ImportExportController;
use Aero\Scm\Http\Controllers\ReturnManagementController;
use Aero\Core\Http\Middleware\InitializeTenancyIfNotCentral;

/*
|--------------------------------------------------------------------------
| SCM Tenant Routes
|--------------------------------------------------------------------------
| NOTE: InitializeTenancyIfNotCentral MUST come before 'tenant' middleware
| to gracefully return 404 on central domains instead of crashing.
*/

Route::prefix('scm')->name('scm.')->middleware(['web', InitializeTenancyIfNotCentral::class, 'tenant', 'auth'])->group(function () {
    // Procurement
    Route::resource('procurement', ProcurementController::class);
    Route::post('procurement/{id}/approve', [ProcurementController::class, 'approve'])->name('procurement.approve');
    
    // Suppliers
    Route::resource('suppliers', SupplierController::class);
    Route::post('suppliers/{id}/rate', [SupplierController::class, 'rate'])->name('suppliers.rate');
    
    // Logistics
    Route::resource('logistics', LogisticsController::class);
    Route::get('logistics/{id}/track', [LogisticsController::class, 'track'])->name('logistics.track');
    
    // Production Planning
    Route::resource('production', ProductionPlanController::class);
    
    // Purchase Orders
    Route::resource('purchases', PurchaseController::class);
    
    // Demand Forecasting
    Route::resource('demand-forecast', DemandForecastController::class);
    
    // Import/Export
    Route::resource('import-export', ImportExportController::class);
    
    // Return Management
    Route::resource('returns', ReturnManagementController::class);
});
