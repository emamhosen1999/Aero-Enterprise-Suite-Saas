<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Aero Core API Routes
|--------------------------------------------------------------------------
|
| API routes for the Aero Core package.
| These routes are automatically registered by the AeroCoreServiceProvider.
|
*/

// ============================================================================
// VERSION CHECK
// ============================================================================
Route::post('/version/check', function (Request $request) {
    $clientVersion = $request->input('version', '1.0.0');
    $serverVersion = config('app.version', '1.0.0');
    
    return response()->json([
        'version_match' => $clientVersion === $serverVersion,
        'client_version' => $clientVersion,
        'server_version' => $serverVersion,
        'timestamp' => now()->toIso8601String(),
    ]);
})->name('api.version.check');

// ============================================================================
// ROLE MANAGEMENT API
// ============================================================================
Route::middleware(['web', 'auth'])->prefix('roles')->group(function () {
    Route::get('/', [\Aero\Core\Http\Controllers\Admin\RoleController::class, 'index'])->name('api.roles.index');
    Route::post('/', [\Aero\Core\Http\Controllers\Admin\RoleController::class, 'storeRole'])->name('api.roles.store');
    Route::put('/{id}', [\Aero\Core\Http\Controllers\Admin\RoleController::class, 'updateRole'])->name('api.roles.update');
    Route::delete('/{id}', [\Aero\Core\Http\Controllers\Admin\RoleController::class, 'deleteRole'])->name('api.roles.delete');
    Route::get('/permissions', [\Aero\Core\Http\Controllers\Admin\RoleController::class, 'getRolesAndPermissions'])->name('api.roles.permissions');
    Route::post('/assign-user', [\Aero\Core\Http\Controllers\Admin\RoleController::class, 'assignRolesToUser'])->name('api.roles.assign-user');
    Route::get('/refresh', [\Aero\Core\Http\Controllers\Admin\RoleController::class, 'refreshData'])->name('api.roles.refresh');
    Route::get('/export', [\Aero\Core\Http\Controllers\Admin\RoleController::class, 'exportRoles'])->name('api.roles.export');
});
