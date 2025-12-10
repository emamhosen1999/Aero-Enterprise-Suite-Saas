<?php

use Illuminate\Support\Facades\Route;
use Aero\Ims\Http\Controllers\IMSController;
use Aero\Ims\Http\Controllers\InventoryItemController;

/*
|--------------------------------------------------------------------------
| IMS Tenant Routes
|--------------------------------------------------------------------------
*/

Route::prefix('ims')->name('ims.')->middleware(['auth', 'tenant'])->group(function () {
    // Main IMS Dashboard
    Route::get('/', [IMSController::class, 'index'])->name('index');
    
    // Inventory Items
    Route::resource('inventory', InventoryItemController::class);
    Route::post('inventory/{id}/adjust-stock', [InventoryItemController::class, 'adjustStock'])->name('inventory.adjust-stock');
    
    // Warehouses (if specific controller exists)
    // Route::resource('warehouses', WarehouseController::class);
    
    // Stock Movements
    // Route::resource('stock-movements', StockMovementController::class);
});
