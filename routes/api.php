<?php

use App\Http\Controllers\Api\VersionController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\SystemMonitoringController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Route;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

// Version check endpoints (no auth required for PWA functionality)
Route::get('/version', [VersionController::class, 'current'])->name('api.version.current');
Route::post('/version/check', [VersionController::class, 'check'])->name('api.version.check');

// Error logging endpoint
Route::post('/log-error', function (Request $request) {
    try {
        $validated = $request->validate([
            'error_id' => 'required|string',
            'message' => 'required|string',
            'stack' => 'nullable|string',
            'component_stack' => 'nullable|string',
            'url' => 'required|string',
            'user_agent' => 'nullable|string',
            'timestamp' => 'required|string',
        ]);

        DB::table('error_logs')->insert([
            'error_id' => $validated['error_id'],
            'message' => $validated['message'],
            'stack_trace' => $validated['stack'] ?? null,
            'component_stack' => $validated['component_stack'] ?? null,
            'url' => $validated['url'],
            'user_agent' => $validated['user_agent'] ?? null,
            'user_id' => auth()->id(),
            'ip_address' => $request->ip(),
            'metadata' => json_encode([
                'timestamp' => $validated['timestamp'],
                'session_id' => session()->getId(),
            ]),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return response()->json(['success' => true]);
    } catch (\Exception $e) {
        Log::error('Failed to log frontend error: '.$e->getMessage());

        return response()->json(['success' => false], 500);
    }
})->middleware(['web']);

// Performance logging endpoint

// Notification token endpoint
Route::post('/notification-token', [NotificationController::class, 'storeToken'])->middleware(['auth:sanctum']);
Route::post('/log-performance', function (Request $request) {
    try {
        $validated = $request->validate([
            'metric_type' => 'required|string|in:page_load,api_response,query_execution,render_time',
            'identifier' => 'required|string',
            'execution_time_ms' => 'required|numeric',
            'metadata' => 'nullable|array',
        ]);

        DB::table('performance_metrics')->insert([
            'metric_type' => $validated['metric_type'],
            'identifier' => $validated['identifier'],
            'execution_time_ms' => $validated['execution_time_ms'],
            'metadata' => json_encode($validated['metadata'] ?? []),
            'user_id' => auth()->id(),
            'ip_address' => $request->ip(),
            'created_at' => now(),
        ]);

        return response()->json(['success' => true]);
    } catch (\Exception $e) {
        Log::error('Failed to log performance metric: '.$e->getMessage());

        return response()->json(['success' => false], 500);
    }
})->middleware(['web']);

// System monitoring API routes
Route::middleware(['web', 'auth'])->group(function () {
    Route::get('/system-monitoring/metrics', [SystemMonitoringController::class, 'getMetrics'])->name('api.system-monitoring.metrics');
    Route::get('/system-monitoring/overview', [SystemMonitoringController::class, 'getSystemOverview'])->name('api.system-monitoring.overview');
});

// Locale API routes
Route::prefix('locale')->group(function () {
    Route::get('/', [\App\Http\Controllers\Api\LocaleController::class, 'index'])->name('api.locale.index');
    Route::post('/', [\App\Http\Controllers\Api\LocaleController::class, 'update'])->name('api.locale.update');
    Route::get('/translations/{namespace?}', [\App\Http\Controllers\Api\LocaleController::class, 'translations'])->name('api.locale.translations');
});

// ============================================================================
// RBAC API Routes - Role and Permission Management
// ============================================================================
Route::middleware(['web', 'auth'])->prefix('roles')->group(function () {
    // Role CRUD operations
    Route::get('/', [\App\Http\Controllers\RoleController::class, 'apiIndex'])->name('api.roles.index');
    Route::post('/', [\App\Http\Controllers\RoleController::class, 'storeRole'])->name('api.roles.store');
    Route::get('/{id}', [\App\Http\Controllers\RoleController::class, 'apiShow'])->name('api.roles.show');
    Route::put('/{id}', [\App\Http\Controllers\RoleController::class, 'updateRole'])->name('api.roles.update');
    Route::delete('/{id}', [\App\Http\Controllers\RoleController::class, 'deleteRole'])->name('api.roles.destroy');

    // Role-Permission assignment
    Route::patch('/{id}/permissions', [\App\Http\Controllers\RoleController::class, 'batchUpdatePermissions'])->name('api.roles.permissions.batch');
    Route::post('/{id}/permissions/sync', [\App\Http\Controllers\RoleController::class, 'syncRolePermissions'])->name('api.roles.permissions.sync');
});

Route::middleware(['web', 'auth'])->prefix('permissions')->group(function () {
    // Permission CRUD operations
    Route::get('/', [\App\Http\Controllers\PermissionController::class, 'index'])->name('api.permissions.index');
    Route::post('/', [\App\Http\Controllers\PermissionController::class, 'store'])->name('api.permissions.store');
    Route::get('/{id}', [\App\Http\Controllers\PermissionController::class, 'show'])->name('api.permissions.show');
    Route::put('/{id}', [\App\Http\Controllers\PermissionController::class, 'update'])->name('api.permissions.update');
    Route::delete('/{id}', [\App\Http\Controllers\PermissionController::class, 'destroy'])->name('api.permissions.destroy');

    // Permission grouping
    Route::get('/grouped/modules', [\App\Http\Controllers\PermissionController::class, 'groupedByModule'])->name('api.permissions.grouped');
});

Route::middleware(['web', 'auth'])->prefix('users')->group(function () {
    // User-Role assignment
    Route::get('/{id}/roles', [\App\Http\Controllers\UserController::class, 'getUserRoles'])->name('api.users.roles.index');
    Route::post('/{id}/roles', [\App\Http\Controllers\UserController::class, 'updateUserRole'])->name('api.users.roles.sync');

    // User-Permission direct assignment
    Route::get('/{id}/permissions', [\App\Http\Controllers\UserController::class, 'getUserPermissions'])->name('api.users.permissions.index');
    Route::post('/{id}/permissions', [\App\Http\Controllers\UserController::class, 'syncUserPermissions'])->name('api.users.permissions.sync');
    Route::post('/{id}/permissions/give', [\App\Http\Controllers\UserController::class, 'giveUserPermission'])->name('api.users.permissions.give');
    Route::post('/{id}/permissions/revoke', [\App\Http\Controllers\UserController::class, 'revokeUserPermission'])->name('api.users.permissions.revoke');
});
