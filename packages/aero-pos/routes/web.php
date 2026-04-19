<?php

use Aero\Pos\Http\Controllers\POSController;
use Aero\Pos\Http\Controllers\SaleController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| POS Module Routes
|--------------------------------------------------------------------------
|
| All routes here are loaded by AbstractModuleProvider which wraps them
| with the SaaS or standalone outer middleware + prefix 'pos' + name 'pos.'.
| Auth and HRMAC middleware are declared inside each inner group below.
|
*/

Route::middleware(['auth', 'hrmac:pos'])->group(function () {
    // POS Terminal
    Route::get('/', [POSController::class, 'index'])->name('index');
    Route::post('/process-sale', [POSController::class, 'processSale'])->name('process-sale');
    Route::post('/process-return', [POSController::class, 'processReturn'])->name('process-return');

    // Sales History
    Route::resource('sales', SaleController::class);
    Route::get('sales/{id}/receipt', [SaleController::class, 'printReceipt'])->name('sales.receipt');
    Route::post('sales/{id}/refund', [SaleController::class, 'processRefund'])->name('sales.refund');
});

// Public routes
