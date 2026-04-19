<?php

use Aero\Scm\Http\Controllers\DemandForecastController;
use Aero\Scm\Http\Controllers\ImportExportController;
use Aero\Scm\Http\Controllers\LogisticsController;
use Aero\Scm\Http\Controllers\ProcurementController;
use Aero\Scm\Http\Controllers\ProductionPlanController;
use Aero\Scm\Http\Controllers\PurchaseController;
use Aero\Scm\Http\Controllers\ReturnManagementController;
use Aero\Scm\Http\Controllers\SupplierController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| SCM Module Routes
|--------------------------------------------------------------------------
|
| All routes here are loaded by AbstractModuleProvider which wraps them
| with the SaaS or standalone outer middleware + prefix 'scm' + name 'scm.'.
| Auth and HRMAC middleware are declared inside each inner group below.
|
*/

Route::middleware(['auth', 'hrmac:scm'])->group(function () {
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

// Public routes
