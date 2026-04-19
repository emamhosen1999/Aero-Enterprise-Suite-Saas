<?php

use Aero\Ims\Http\Controllers\IMSController;
use Aero\Ims\Http\Controllers\InventoryItemController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| IMS Module Routes
|--------------------------------------------------------------------------
|
| All routes here are loaded by AbstractModuleProvider which wraps them
| with the SaaS or standalone outer middleware + prefix 'ims' + name 'ims.'.
| Auth and HRMAC middleware are declared inside each inner group below.
|
*/

Route::middleware(['auth', 'hrmac:ims'])->group(function () {
    // Main IMS Dashboard
    Route::get('/', [IMSController::class, 'index'])->name('index');

    // Inventory Items
    Route::resource('inventory', InventoryItemController::class);
    Route::post('inventory/{id}/adjust-stock', [InventoryItemController::class, 'adjustStock'])->name('inventory.adjust-stock');
});

// Public routes
