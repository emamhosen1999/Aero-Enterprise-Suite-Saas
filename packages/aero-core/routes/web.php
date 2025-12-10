<?php

use Aero\Core\Http\Controllers\Admin\RoleController;
use Aero\Core\Http\Controllers\Admin\CoreUserController;
use Aero\Core\Http\Controllers\Admin\ModuleController;
use Aero\Core\Http\Controllers\Auth\DeviceController;
use Aero\Core\Http\Controllers\Auth\SimpleLoginController;
use Aero\Core\Http\Controllers\DashboardController;
use Aero\Core\Http\Controllers\Settings\SystemSettingController;
use Aero\Core\Http\Controllers\Settings\CustomDomainController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Aero Core Routes
|--------------------------------------------------------------------------
|
| All routes for the Aero Core package including:
| - Authentication (login, logout)
| - Dashboard
| - User Management
| - Role Management
| - Settings & Profile
|
| These routes are automatically registered by the AeroCoreServiceProvider.
|
*/

// ============================================================================
// HEALTH CHECK & INFO
// ============================================================================
Route::get('/aero-core/health', function () {
    return response()->json([
        'status' => 'ok',
        'package' => 'aero/core',
        'version' => '1.0.0',
        'services' => [
            'UserRelationshipRegistry' => app()->bound('Aero\Core\Services\UserRelationshipRegistry'),
            'NavigationRegistry' => app()->bound('Aero\Core\Services\NavigationRegistry'),
            'ModuleRegistry' => app()->bound('Aero\Core\Services\ModuleRegistry'),
            'ModuleAccessService' => app()->bound('Aero\Core\Services\ModuleAccessService'),
        ],
        'timestamp' => now()->toIso8601String(),
    ]);
})->name('health')->withoutMiddleware(['auth']);

// ============================================================================
// ROOT ROUTE - Redirect to dashboard or login
// ============================================================================
Route::get('/', function () {
    if (auth()->check()) {
        return redirect()->route('dashboard');
    }
    return redirect()->route('login');
})->name('root');

// ============================================================================
// AUTHENTICATION ROUTES (Guest)
// ============================================================================
Route::middleware('guest')->group(function () {
    Route::get('login', [SimpleLoginController::class, 'create'])->name('login');
    Route::post('login', [SimpleLoginController::class, 'store']);
});

// ============================================================================
// AUTHENTICATION ROUTES (Authenticated)
// ============================================================================
Route::middleware('auth')->group(function () {
    Route::post('logout', [SimpleLoginController::class, 'destroy'])->name('logout');
});

// ============================================================================
// AUTHENTICATED ROUTES - Core Features
// ============================================================================
Route::middleware('auth')->group(function () {
    
    // Dashboard Routes
    Route::get('dashboard', [DashboardController::class, 'index'])->name('dashboard');
    Route::get('dashboard/stats', [DashboardController::class, 'stats'])->name('dashboard.stats');
    
    // Session & Auth Check Routes
    Route::get('/session-check', function () {
        return response()->json(['authenticated' => auth()->check()]);
    })->name('session-check');

    // Locale Switching
    Route::post('/locale', function (\Illuminate\Http\Request $request) {
        $locale = $request->input('locale', 'en');
        $supportedLocales = ['en', 'bn', 'ar', 'es', 'fr', 'de', 'hi', 'zh-CN', 'zh-TW'];

        if (in_array($locale, $supportedLocales)) {
            session(['locale' => $locale]);
            app()->setLocale($locale);

            if (auth()->check()) {
                auth()->user()->update(['locale' => $locale]);
            }
        }

        return response()->noContent();
    })->name('locale.update');
    
    // ========================================================================
    // USER MANAGEMENT ROUTES
    // ========================================================================
    Route::prefix('users')->name('users.')->group(function () {
        // List & View
        Route::get('/', [CoreUserController::class, 'index'])->name('index');
        Route::get('/paginate', [CoreUserController::class, 'paginate'])->name('paginate');
        Route::get('/stats', [CoreUserController::class, 'stats'])->name('stats');
        
        // Create
        Route::post('/', [CoreUserController::class, 'store'])
            ->middleware(['precognitive'])
            ->name('store');
        
        // Update
        Route::put('/{id}', [CoreUserController::class, 'update'])
            ->middleware(['precognitive'])
            ->name('update');
        Route::put('/{id}/toggle-status', [CoreUserController::class, 'toggleStatus'])->name('toggleStatus');
        Route::post('/{id}/roles', [CoreUserController::class, 'updateUserRole'])->name('updateRole');
        
        // Delete
        Route::delete('/{id}', [CoreUserController::class, 'destroy'])->name('destroy');
        
        // Bulk operations
        Route::post('/bulk/toggle-status', [CoreUserController::class, 'bulkToggleStatus'])->name('bulk.toggleStatus');
        Route::post('/bulk/assign-roles', [CoreUserController::class, 'bulkAssignRoles'])->name('bulk.assignRoles');
        Route::post('/bulk/delete', [CoreUserController::class, 'bulkDelete'])->name('bulk.delete');
        
        // Export
        Route::post('/export', [CoreUserController::class, 'exportUsers'])->name('export');
        
        // Restore
        Route::post('/{id}/restore', [CoreUserController::class, 'restoreUser'])->name('restore');
        
        // Account Security
        Route::post('/{id}/lock', [CoreUserController::class, 'lockAccount'])->name('lock');
        Route::post('/{id}/unlock', [CoreUserController::class, 'unlockAccount'])->name('unlock');
        Route::post('/{id}/force-password-reset', [CoreUserController::class, 'forcePasswordReset'])->name('forcePasswordReset');
        
        // Email Verification
        Route::post('/{id}/resend-verification', [CoreUserController::class, 'resendEmailVerification'])->name('resendVerification');
        
        // Invitations
        Route::post('/invite', [CoreUserController::class, 'sendInvitation'])->name('invite');
        Route::get('/invitations/pending', [CoreUserController::class, 'pendingInvitations'])->name('invitations.pending');
        Route::post('/invitations/{invitation}/resend', [CoreUserController::class, 'resendInvitation'])->name('invitations.resend');
        Route::delete('/invitations/{invitation}', [CoreUserController::class, 'cancelInvitation'])->name('invitations.cancel');
    });

    // ========================================================================
    // DEVICE MANAGEMENT ROUTES (Security)
    // ========================================================================
    // User's own devices
    Route::get('/my-devices', [DeviceController::class, 'index'])->name('devices.index');
    Route::delete('/my-devices/{deviceId}', [DeviceController::class, 'deactivateDevice'])->name('devices.deactivate');
    
    // Admin device management
    Route::prefix('users/{userId}/devices')->name('devices.admin.')->group(function () {
        Route::get('/', [DeviceController::class, 'getUserDevices'])->name('list');
        Route::post('/reset', [DeviceController::class, 'resetDevices'])->name('reset');
        Route::post('/toggle', [DeviceController::class, 'toggleSingleDeviceLogin'])->name('toggle');
        Route::delete('/{deviceId}', [DeviceController::class, 'adminDeactivateDevice'])->name('deactivate');
    });
    
    // ========================================================================
    // ROLE & PERMISSIONS MANAGEMENT
    // ========================================================================
    Route::prefix('roles')->name('roles.')->group(function () {
        // View
        Route::get('/', [RoleController::class, 'index'])->name('index');
        Route::get('/export', [RoleController::class, 'exportRoles'])->name('export');
        Route::get('/permissions', [RoleController::class, 'getRolesAndPermissions'])->name('permissions');
        Route::get('/refresh', [RoleController::class, 'refreshData'])->name('refresh');
        
        // Create
        Route::post('/', [RoleController::class, 'storeRole'])->name('store');
        
        // Update
        Route::put('/{id}', [RoleController::class, 'updateRole'])->name('update');
        Route::post('/assign-user', [RoleController::class, 'assignRolesToUser'])->name('assign-user');
        
        // Delete
        Route::delete('/{id}', [RoleController::class, 'deleteRole'])->name('delete');
    });
    
    // ========================================================================
    // MODULE REGISTRY MANAGEMENT
    // ========================================================================
    Route::prefix('modules')->name('modules.')->group(function () {
        // View
        Route::get('/', [ModuleController::class, 'index'])->name('index');
        Route::get('/api', [ModuleController::class, 'apiIndex'])->name('api.index');
        Route::post('/check-access', [ModuleController::class, 'checkAccess'])->name('check-access');
        Route::get('/{moduleCode}/requirements', [ModuleController::class, 'getModuleRequirements'])->name('requirements');
        
        // Permission Sync
        Route::post('/{module}/sync-permissions', [ModuleController::class, 'syncModulePermissions'])->name('sync-permissions');
        Route::post('/sub-modules/{subModule}/sync-permissions', [ModuleController::class, 'syncSubModulePermissions'])->name('sub-modules.sync-permissions');
        Route::post('/components/{component}/sync-permissions', [ModuleController::class, 'syncComponentPermissions'])->name('components.sync-permissions');
    });
    
    // ========================================================================
    // SYSTEM SETTINGS
    // ========================================================================
    Route::prefix('settings')->name('settings.')->group(function () {
        // System Settings
        Route::get('/system', [SystemSettingController::class, 'index'])->name('system.index');
        Route::put('/system', [SystemSettingController::class, 'update'])->name('system.update');
        Route::post('/system/test-email', [SystemSettingController::class, 'sendTestEmail'])->name('system.test-email');
        Route::post('/system/test-sms', [SystemSettingController::class, 'sendTestSms'])->name('system.test-sms');
        
        // Domain Management
        Route::prefix('domains')->name('domains.')->group(function () {
            Route::get('/', [CustomDomainController::class, 'index'])->name('index');
            Route::post('/', [CustomDomainController::class, 'store'])->name('store');
            Route::post('/{domain}/verify', [CustomDomainController::class, 'verify'])->name('verify');
            Route::post('/{domain}/set-primary', [CustomDomainController::class, 'setPrimary'])->name('set-primary');
            Route::delete('/{domain}', [CustomDomainController::class, 'destroy'])->name('destroy');
        });
        
        // Usage & Billing (if Platform package installed)
        Route::prefix('usage')->name('usage.')->group(function () {
            Route::get('/', function () {
                if (class_exists('Aero\Platform\Http\Controllers\SystemMonitoring\UsageController')) {
                    return app('Aero\Platform\Http\Controllers\SystemMonitoring\UsageController')->index();
                }
                return response()->json(['message' => 'Usage tracking not available'], 404);
            })->name('index');
        });
    });
    
    // ========================================================================
    // PROFILE ROUTES
    // ========================================================================
    Route::prefix('profile')->name('profile.')->group(function () {
        Route::get('/', function () {
            return inertia('Core/Profile/Index', [
                'title' => 'My Profile',
                'user' => auth()->user(),
            ]);
        })->name('index');
    });
    
    // ========================================================================
    // API ROUTES (for dropdowns, lookups, etc.)
    // ========================================================================
    Route::prefix('api')->name('api.')->group(function () {
        Route::get('/users/managers/list', function () {
            if (!class_exists('App\Models\User')) {
                return response()->json([]);
            }
            return response()->json(\App\Models\User::whereHas('roles', function ($query) {
                $query->whereIn('name', [
                    'Super Administrator',
                    'Administrator',
                    'HR Manager',
                    'Project Manager',
                    'Department Manager',
                    'Team Lead',
                ]);
            })
                ->select('id', 'name')
                ->get());
        })->name('users.managers.list');
    });
    
    // FCM Token Update
    Route::post('/update-fcm-token', [CoreUserController::class, 'updateFcmToken'])->name('updateFcmToken');
});
