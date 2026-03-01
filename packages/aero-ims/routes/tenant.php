<?php

use Aero\Core\Http\Middleware\InitializeTenancyIfNotCentral;
use Aero\Ims\Http\Controllers\IMSController;
use Aero\Ims\Http\Controllers\InventoryItemController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| IMS Tenant Routes
|--------------------------------------------------------------------------
| NOTE: InitializeTenancyIfNotCentral MUST come before 'tenant' middleware
| to gracefully return 404 on central domains instead of crashing.
*/

Route::prefix('ims')->name('ims.')->middleware(['web', InitializeTenancyIfNotCentral::class, 'tenant', 'auth'])->group(function () {
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
