<?php

use Aero\Core\Http\Middleware\InitializeTenancyIfNotCentral;
use Aero\Pos\Http\Controllers\POSController;
use Aero\Pos\Http\Controllers\SaleController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| POS Tenant Routes
|--------------------------------------------------------------------------
| NOTE: InitializeTenancyIfNotCentral MUST come before 'tenant' middleware
| to gracefully return 404 on central domains instead of crashing.
*/

Route::prefix('pos')->name('pos.')->middleware(['web', InitializeTenancyIfNotCentral::class, 'tenant', 'auth'])->group(function () {
    // POS Terminal
    Route::get('/', [POSController::class, 'index'])->name('index');
    Route::post('/process-sale', [POSController::class, 'processSale'])->name('process-sale');
    Route::post('/process-return', [POSController::class, 'processReturn'])->name('process-return');

    // Sales History
    Route::resource('sales', SaleController::class);
    Route::get('sales/{id}/receipt', [SaleController::class, 'printReceipt'])->name('sales.receipt');
    Route::post('sales/{id}/refund', [SaleController::class, 'processRefund'])->name('sales.refund');
});
