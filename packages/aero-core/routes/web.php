<?php

use Aero\Core\Http\Controllers\Admin\CoreUserController;
use Aero\Core\Http\Controllers\Admin\ModuleController;
use Aero\Core\Http\Controllers\Admin\RoleController;
use Aero\Core\Http\Controllers\Auth\AdminSetupController;
use Aero\Core\Http\Controllers\Auth\AuthenticatedSessionController;
use Aero\Core\Http\Controllers\Auth\DeviceController;
use Aero\Core\Http\Controllers\Auth\EmailVerificationController;
use Aero\Core\Http\Controllers\Auth\NewPasswordController;
use Aero\Core\Http\Controllers\Auth\PasswordResetLinkController;
use Aero\Core\Http\Controllers\DashboardController;
use Aero\Core\Http\Controllers\Settings\SystemSettingController;
use Aero\Core\Services\PlatformErrorReporter;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

// Note: TenantOnboardingController is referenced dynamically if platform package is installed
// We don't use a 'use' statement here since it may not exist

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
| - API endpoints
|
| Route Naming Convention:
| - All route names MUST have 'core.' prefix (e.g., core.dashboard, core.users.index)
| - Paths do NOT have /core prefix (e.g., /dashboard not /core/dashboard)
|
| These routes are automatically registered by the AeroCoreServiceProvider.
|
*/

// ============================================================================
// HEALTH CHECK & INFO (Public - No Auth Required)
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
})->name('core.health')->withoutMiddleware(['auth']);

// ERROR LOGGING API - Receives frontend errors and forwards to platform (No Auth Required)
Route::post('/api/error-log', function (Request $request) {
    $reporter = app(PlatformErrorReporter::class);
    $traceId = $reporter->reportFrontendError($request->all());

    return response()->json([
        'success' => true,
        'trace_id' => $traceId,
        'message' => 'Error reported successfully',
    ]);
})->name('core.api.error-log')->middleware('throttle:30,1')->withoutMiddleware(['auth']);

// VERSION CHECK API - Public endpoint for frontend version checking (No Auth Required)
Route::post('/api/version/check', function (Request $request) {
    $clientVersion = $request->input('version', '1.0.0');
    $serverVersion = config('app.version', '1.0.0');

    return response()->json([
        'version_match' => $clientVersion === $serverVersion,
        'client_version' => $clientVersion,
        'server_version' => $serverVersion,
        'timestamp' => now()->toIso8601String(),
    ]);
})->name('core.api.version.check')->middleware('throttle:30,1')->withoutMiddleware(['auth']);

// ============================================================================
// ROOT ROUTE - Redirect to dashboard or login
// ============================================================================
Route::get('/', function () {
    return redirect('/dashboard');
})->middleware(['auth:web']);

// ============================================================================
// ADMIN SETUP ROUTES (No Auth - for newly provisioned tenants)
// ============================================================================
Route::get('admin-setup', [AdminSetupController::class, 'show'])->name('admin.setup.show');
Route::post('admin-setup', [AdminSetupController::class, 'store'])->name('admin.setup.store');

// ============================================================================
// TENANT ONBOARDING ROUTES (Auth required - after admin setup)
// ============================================================================
// Only register these routes if the platform package is installed (SaaS mode)
if (class_exists('Aero\Platform\Http\Controllers\TenantOnboardingController')) {
    Route::middleware(['auth:web'])->prefix('onboarding')->name('onboarding.')->group(function () {
        Route::get('/', [\Aero\Platform\Http\Controllers\TenantOnboardingController::class, 'index'])->name('index');
        Route::post('/company', [\Aero\Platform\Http\Controllers\TenantOnboardingController::class, 'saveCompany'])->name('company.save');
        Route::post('/branding', [\Aero\Platform\Http\Controllers\TenantOnboardingController::class, 'saveBranding'])->name('branding.save');
        Route::post('/team', [\Aero\Platform\Http\Controllers\TenantOnboardingController::class, 'saveTeam'])->name('team.save');
        Route::post('/modules', [\Aero\Platform\Http\Controllers\TenantOnboardingController::class, 'saveModules'])->name('modules.save');
        Route::post('/complete', [\Aero\Platform\Http\Controllers\TenantOnboardingController::class, 'complete'])->name('complete');
        Route::post('/skip', [\Aero\Platform\Http\Controllers\TenantOnboardingController::class, 'skip'])->name('skip');
        Route::post('/update-step', [\Aero\Platform\Http\Controllers\TenantOnboardingController::class, 'updateStep'])->name('update-step');
    });
}

// ============================================================================
// AUTHENTICATION ROUTES (Guest)
// ============================================================================
Route::middleware('guest:web')->group(function () {
    Route::get('login', [AuthenticatedSessionController::class, 'create'])->name('login');
    Route::post('login', [AuthenticatedSessionController::class, 'store']);

    Route::get('forgot-password', [PasswordResetLinkController::class, 'create'])->name('password.request');
    Route::post('forgot-password', [PasswordResetLinkController::class, 'store'])->name('password.email');

    Route::get('reset-password/{token}', [NewPasswordController::class, 'create'])->name('password.reset');
    Route::post('reset-password', [NewPasswordController::class, 'store'])->name('password.store');
});

// ============================================================================
// AUTHENTICATION ROUTES (Authenticated)
// ============================================================================
// ============================================================================
// AUTHENTICATED ROUTES - Core Features
// ============================================================================
Route::middleware('auth:web')->group(function () {

    // Logout
    Route::post('logout', [AuthenticatedSessionController::class, 'destroy'])->name('logout');

    // Email Verification
    Route::get('verify-email', [EmailVerificationController::class, 'prompt'])
        ->name('core.verification.notice');
    Route::get('verify-email/{id}/{hash}', [EmailVerificationController::class, 'verify'])
        ->middleware(['signed', 'throttle:6,1'])
        ->name('core.verification.verify');
    Route::post('email/verification-notification', [EmailVerificationController::class, 'send'])
        ->middleware(['throttle:6,1'])
        ->name('core.verification.send');

    // Dashboard Routes
    // Named 'dashboard' for backward compatibility (previously 'core.dashboard')
    // This allows route('dashboard') to work for tenant login redirects
    Route::get('dashboard', [DashboardController::class, 'index'])->name('dashboard');
    Route::get('dashboard/stats', [DashboardController::class, 'stats'])->name('core.dashboard.stats');
    Route::get('dashboard/widget/{widgetKey}', [DashboardController::class, 'widgetData'])->name('core.dashboard.widget');

    // Session & Auth Check Routes
    Route::get('/session-check', function () {
        return response()->json(['authenticated' => auth()->check()]);
    })->name('core.session-check');

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
    })->name('core.locale.update');

    // ========================================================================
    // USER MANAGEMENT ROUTES
    // ========================================================================
    Route::prefix('users')->name('core.users.')->group(function () {
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
    Route::get('/my-devices', [DeviceController::class, 'index'])->name('core.devices.index');
    Route::delete('/my-devices/{deviceId}', [DeviceController::class, 'deactivateDevice'])->name('core.devices.deactivate');

    // Admin device management
    Route::prefix('users/{userId}/devices')->name('core.devices.admin.')->group(function () {
        Route::get('/', [DeviceController::class, 'getUserDevices'])->name('list');
        Route::post('/reset', [DeviceController::class, 'resetDevices'])->name('reset');
        Route::post('/toggle', [DeviceController::class, 'toggleSingleDeviceLogin'])->name('toggle');
        Route::delete('/{deviceId}', [DeviceController::class, 'adminDeactivateDevice'])->name('deactivate');
    });

    // ========================================================================
    // ROLE & PERMISSIONS MANAGEMENT
    // ========================================================================
    Route::prefix('roles')->name('core.roles.')->group(function () {
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
    Route::prefix('modules')->name('core.modules.')->group(function () {
        // View
        Route::get('/', [ModuleController::class, 'index'])->name('index');
        Route::get('/api', [ModuleController::class, 'apiIndex'])->name('api.index');
        Route::post('/check-access', [ModuleController::class, 'checkAccess'])->name('check-access');
        Route::get('/{moduleCode}/requirements', [ModuleController::class, 'getModuleRequirements'])->name('requirements');

        // Role Access Management
        Route::get('/role-access/{roleId}', [ModuleController::class, 'getRoleAccess'])->name('role-access.show');
        Route::post('/role-access/{roleId}', [ModuleController::class, 'syncRoleAccess'])->name('role-access.sync');

        // Permission Sync
        Route::post('/{module}/sync-permissions', [ModuleController::class, 'syncModulePermissions'])->name('sync-permissions');
        Route::post('/sub-modules/{subModule}/sync-permissions', [ModuleController::class, 'syncSubModulePermissions'])->name('sub-modules.sync-permissions');
        Route::post('/components/{component}/sync-permissions', [ModuleController::class, 'syncComponentPermissions'])->name('components.sync-permissions');
    });

    // ========================================================================
    // AUDIT LOGS
    // ========================================================================
    Route::prefix('audit-logs')->name('core.audit-logs.')->group(function () {
        Route::get('/', [\Aero\Core\Http\Controllers\Admin\AuditLogController::class, 'index'])->name('index');
        Route::get('/activity', [\Aero\Core\Http\Controllers\Admin\AuditLogController::class, 'activityLogs'])->name('activity');
        Route::get('/security', [\Aero\Core\Http\Controllers\Admin\AuditLogController::class, 'securityLogs'])->name('security');
        Route::get('/stats', [\Aero\Core\Http\Controllers\Admin\AuditLogController::class, 'stats'])->name('stats');
        Route::post('/activity/export', [\Aero\Core\Http\Controllers\Admin\AuditLogController::class, 'exportActivityLogs'])->name('activity.export');
        Route::post('/security/export', [\Aero\Core\Http\Controllers\Admin\AuditLogController::class, 'exportSecurityLogs'])->name('security.export');
    });

    // ========================================================================
    // NOTIFICATIONS MANAGEMENT
    // ========================================================================
    Route::prefix('notifications')->name('core.notifications.')->group(function () {
        Route::get('/', [\Aero\Core\Http\Controllers\Notification\NotificationController::class, 'index'])->name('index');
        Route::get('/list', [\Aero\Core\Http\Controllers\Notification\NotificationController::class, 'list'])->name('list');
        Route::post('/{id}/read', [\Aero\Core\Http\Controllers\Notification\NotificationController::class, 'markAsRead'])->name('read');
        Route::post('/read-all', [\Aero\Core\Http\Controllers\Notification\NotificationController::class, 'markAllAsRead'])->name('read-all');
        Route::delete('/{id}', [\Aero\Core\Http\Controllers\Notification\NotificationController::class, 'destroy'])->name('destroy');
    });

    // ========================================================================
    // FILE MANAGER
    // ========================================================================
    Route::prefix('files')->name('core.files.')->group(function () {
        Route::get('/', [\Aero\Core\Http\Controllers\Upload\FileManagerController::class, 'index'])->name('index');
        Route::get('/browse', [\Aero\Core\Http\Controllers\Upload\FileManagerController::class, 'browse'])->name('browse');
        Route::post('/upload', [\Aero\Core\Http\Controllers\Upload\FileManagerController::class, 'upload'])->name('upload');
        Route::delete('/{id}', [\Aero\Core\Http\Controllers\Upload\FileManagerController::class, 'destroy'])->name('destroy');
        Route::get('/stats', [\Aero\Core\Http\Controllers\Upload\FileManagerController::class, 'stats'])->name('stats');
    });

    // ========================================================================
    // SYSTEM SETTINGS
    // ========================================================================
    Route::prefix('settings')->name('core.settings.')->group(function () {
        // System Settings
        Route::get('/system', [SystemSettingController::class, 'index'])->name('system.index');
        Route::put('/system', [SystemSettingController::class, 'update'])->name('system.update');
        Route::post('/system/test-email', [SystemSettingController::class, 'sendTestEmail'])->name('system.test-email');
        Route::post('/system/test-sms', [SystemSettingController::class, 'sendTestSms'])->name('system.test-sms');

        // Domain Management (SaaS mode only - requires aero-platform)
        Route::prefix('domains')->name('domains.')->group(function () {
            // Only register domain routes if Platform is installed
            if (class_exists('Aero\Platform\Http\Controllers\Settings\CustomDomainController')) {
                $controller = 'Aero\Platform\Http\Controllers\Settings\CustomDomainController';
                Route::get('/', [$controller, 'index'])->name('index');
                Route::post('/', [$controller, 'store'])->name('store');
                Route::post('/{domain}/verify', [$controller, 'verify'])->name('verify');
                Route::post('/{domain}/set-primary', [$controller, 'setPrimary'])->name('set-primary');
                Route::delete('/{domain}', [$controller, 'destroy'])->name('destroy');
            } else {
                // In standalone mode, domain management is not available
                Route::get('/', function () {
                    return response()->json(['message' => 'Domain management is only available in SaaS mode'], 404);
                })->name('index');
            }
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
    Route::prefix('profile')->name('core.profile.')->group(function () {
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
    Route::prefix('api')->name('core.api.')->group(function () {
        // User Managers List
        Route::get('/users/managers/list', function () {
            if (! class_exists('Aero\Core\Models\User')) {
                return response()->json([]);
            }

            return response()->json(\Aero\Core\Models\User::whereHas('roles', function ($query) {
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

        // Role Management API (Merged from api.php)
        Route::prefix('roles')->name('roles.')->group(function () {
            Route::get('/', [RoleController::class, 'index'])->name('index');
            Route::post('/', [RoleController::class, 'storeRole'])->name('store');
            Route::put('/{id}', [RoleController::class, 'updateRole'])->name('update');
            Route::delete('/{id}', [RoleController::class, 'deleteRole'])->name('delete');
            Route::get('/permissions', [RoleController::class, 'getRolesAndPermissions'])->name('permissions');
            Route::post('/assign-user', [RoleController::class, 'assignRolesToUser'])->name('assign-user');
            Route::get('/refresh', [RoleController::class, 'refreshData'])->name('refresh');
            Route::get('/export', [RoleController::class, 'exportRoles'])->name('export');
        });
    });

    // ========================================================================
    // EXTENSIONS MARKETPLACE
    // ========================================================================
    Route::prefix('extensions')->name('core.extensions.')->group(function () {
        Route::get('/', [\Aero\Core\Http\Controllers\Admin\ExtensionsController::class, 'index'])->name('index');
        Route::post('/{moduleCode}/toggle', [\Aero\Core\Http\Controllers\Admin\ExtensionsController::class, 'toggle'])->name('toggle');
        Route::post('/upload', [\Aero\Core\Http\Controllers\Admin\ExtensionsController::class, 'upload'])->name('upload');
        Route::get('/check-updates', [\Aero\Core\Http\Controllers\Admin\ExtensionsController::class, 'checkUpdates'])->name('checkUpdates');
        Route::get('/{moduleCode}/settings', [\Aero\Core\Http\Controllers\Admin\ExtensionsController::class, 'settings'])->name('settings');
    });

    // FCM Token Update
    Route::post('/update-fcm-token', [CoreUserController::class, 'updateFcmToken'])->name('core.updateFcmToken');
});
