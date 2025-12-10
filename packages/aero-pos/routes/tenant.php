<?php

use Illuminate\Support\Facades\Route;
use Aero\Pos\Http\Controllers\POSController;
use Aero\Pos\Http\Controllers\SaleController;

/*
|--------------------------------------------------------------------------
| POS Tenant Routes
|--------------------------------------------------------------------------
*/

Route::prefix('pos')->name('pos.')->middleware(['auth', 'tenant'])->group(function () {
    // POS Terminal
    Route::get('/', [POSController::class, 'index'])->name('index');
    Route::post('/process-sale', [POSController::class, 'processSale'])->name('process-sale');
    Route::post('/process-return', [POSController::class, 'processReturn'])->name('process-return');
    
    // Sales History
    Route::resource('sales', SaleController::class);
    Route::get('sales/{id}/receipt', [SaleController::class, 'printReceipt'])->name('sales.receipt');
    Route::post('sales/{id}/refund', [SaleController::class, 'processRefund'])->name('sales.refund');
});
