<?php

use Aero\Core\Http\Controllers\Api\UserApiController;
use Aero\Core\Http\Controllers\Api\RoleApiController;
use Aero\Core\Http\Controllers\Api\ModuleApiController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Aero Core API Routes
|--------------------------------------------------------------------------
|
| API routes for Aero Core functionality.
| Requires Sanctum authentication.
|
*/

Route::middleware(['auth:sanctum'])->group(function () {
    // User API
    Route::prefix('users')->name('users.')->group(function () {
        Route::get('/', [UserApiController::class, 'index'])->name('index');
        Route::get('/{user}', [UserApiController::class, 'show'])->name('show');
        Route::post('/', [UserApiController::class, 'store'])->name('store');
        Route::patch('/{user}', [UserApiController::class, 'update'])->name('update');
        Route::delete('/{user}', [UserApiController::class, 'destroy'])->name('destroy');
    });

    // Role API
    Route::prefix('roles')->name('roles.')->group(function () {
        Route::get('/', [RoleApiController::class, 'index'])->name('index');
        Route::get('/{role}', [RoleApiController::class, 'show'])->name('show');
        Route::get('/{role}/access-tree', [RoleApiController::class, 'getAccessTree'])->name('access-tree');
    });

    // Module Access API
    Route::prefix('modules')->name('modules.')->group(function () {
        Route::get('/', [ModuleApiController::class, 'index'])->name('index');
        Route::get('/accessible', [ModuleApiController::class, 'accessible'])->name('accessible');
        Route::get('/{module}', [ModuleApiController::class, 'show'])->name('show');
    });
});
