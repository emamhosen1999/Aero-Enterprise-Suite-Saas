<?php

use App\Http\Controllers\Api\HealthCheckController;
use App\Http\Controllers\Api\NotificationApiController;
use App\Http\Controllers\Api\VersionController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\Platform\RegistrationPageController;
use App\Http\Controllers\SystemMonitoringController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Route;

// ============================================================================
// Health Check Routes (no auth - for load balancers and monitoring)
// ============================================================================
Route::get('/health', [HealthCheckController::class, 'index'])->name('api.health');
Route::get('/health/detailed', [HealthCheckController::class, 'detailed'])->name('api.health.detailed');

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

// Version check endpoints (no auth required for PWA functionality)
Route::get('/version', [VersionController::class, 'current'])->name('api.version.current');
Route::post('/version/check', [VersionController::class, 'check'])->name('api.version.check');

// Tenant provisioning status (public - used during registration)
Route::get('/tenants/{tenant}/status', [RegistrationPageController::class, 'provisioningStatus'])
    ->name('api.tenants.status');

// ============================================================================
// Notification API Routes (requires authentication)
// ============================================================================
Route::middleware(['web', 'auth'])->prefix('notifications')->group(function () {
    Route::get('/', [NotificationApiController::class, 'index'])->name('api.notifications.index');
    Route::get('/unread-count', [NotificationApiController::class, 'unreadCount'])->name('api.notifications.unread-count');
    Route::post('/{id}/read', [NotificationApiController::class, 'markAsRead'])->name('api.notifications.mark-read');
    Route::post('/read-all', [NotificationApiController::class, 'markAllAsRead'])->name('api.notifications.mark-all-read');
    Route::delete('/{id}', [NotificationApiController::class, 'destroy'])->name('api.notifications.destroy');
    Route::delete('/clear-read', [NotificationApiController::class, 'clearRead'])->name('api.notifications.clear-read');

    // Notification preferences
    Route::get('/preferences', [NotificationApiController::class, 'getPreferences'])->name('api.notifications.preferences');
    Route::put('/preferences', [NotificationApiController::class, 'updatePreferences'])->name('api.notifications.preferences.update');
});

// ============================================================================
// Error Logging API Routes
// ============================================================================
use App\Http\Controllers\Api\ErrorLogController;

// Public error logging endpoint (frontend errors - no auth required for error capture)
Route::post('/error-log', [ErrorLogController::class, 'store'])
    ->middleware(['web'])
    ->name('api.error-log.store');

// Authenticated error log management routes
Route::middleware(['web', 'auth'])->prefix('error-logs')->group(function () {
    Route::get('/', [ErrorLogController::class, 'index'])->name('api.error-logs.index');
    Route::get('/stats', [ErrorLogController::class, 'stats'])->name('api.error-logs.stats');
    Route::get('/{id}', [ErrorLogController::class, 'show'])->name('api.error-logs.show');
    Route::delete('/{id}', [ErrorLogController::class, 'destroy'])->name('api.error-logs.destroy');
    Route::post('/{id}/resolve', [ErrorLogController::class, 'resolve'])->name('api.error-logs.resolve');
});

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
// Registration Helper API Routes (no auth - used during registration)
// ============================================================================
Route::post('/check-subdomain', function (Request $request) {
    $request->validate([
        'subdomain' => ['required', 'string', 'max:40', 'regex:/^[a-z0-9]+(?:-[a-z0-9]+)*$/'],
    ]);

    $subdomain = strtolower($request->input('subdomain'));
    
    // Check if subdomain is taken by an active/provisioning tenant
    $exists = \App\Models\Tenant::where('subdomain', $subdomain)
        ->whereNotIn('status', [\App\Models\Tenant::STATUS_PENDING, \App\Models\Tenant::STATUS_FAILED])
        ->exists();

    return response()->json([
        'available' => !$exists,
        'message' => $exists ? 'This subdomain is already taken' : 'Subdomain is available',
    ]);
})->middleware(['web'])->name('api.check-subdomain');

// ============================================================================
// RBAC API Routes - Role and Permission Management
// ============================================================================
Route::middleware(['web', 'auth'])->prefix('roles')->group(function () {
    // Role CRUD operations
    Route::get('/', [\App\Http\Controllers\Shared\Admin\RoleController::class, 'apiIndex'])->name('api.roles.index');
    Route::post('/', [\App\Http\Controllers\Shared\Admin\RoleController::class, 'storeRole'])->name('api.roles.store');
    Route::get('/{id}', [\App\Http\Controllers\Shared\Admin\RoleController::class, 'apiShow'])->name('api.roles.show');
    Route::put('/{id}', [\App\Http\Controllers\Shared\Admin\RoleController::class, 'updateRole'])->name('api.roles.update');
    Route::delete('/{id}', [\App\Http\Controllers\Shared\Admin\RoleController::class, 'deleteRole'])->name('api.roles.destroy');

    // Role-Permission assignment
    Route::patch('/{id}/permissions', [\App\Http\Controllers\Shared\Admin\RoleController::class, 'batchUpdatePermissions'])->name('api.roles.permissions.batch');
    Route::post('/{id}/permissions/sync', [\App\Http\Controllers\Shared\Admin\RoleController::class, 'syncRolePermissions'])->name('api.roles.permissions.sync');

    // Role-Permission toggle operations
    Route::post('/toggle-permission', [\App\Http\Controllers\Shared\Admin\RoleController::class, 'togglePermission'])->name('api.roles.toggle-permission');
    Route::post('/update-module', [\App\Http\Controllers\Shared\Admin\RoleController::class, 'updateRoleModule'])->name('api.roles.update-module');
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
