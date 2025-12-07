<?php

declare(strict_types=1);

use App\Http\Controllers\Admin\MaintenanceController;
use App\Http\Controllers\Admin\PlatformSettingController;
use App\Http\Controllers\Landlord\Auth\AuthenticatedSessionController;
use App\Http\Controllers\Landlord\ImpersonationController;
use App\Http\Controllers\Shared\Admin\ModuleController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

/*
|--------------------------------------------------------------------------
| Admin Routes (admin.platform.com)
|--------------------------------------------------------------------------
|
| Uses central/platform database with LANDLORD GUARD.
| These routes are for super admins managing the multi-tenant platform.
|
| Route structure matches config/modules.php platform_hierarchy:
| 1. Dashboard (platform-dashboard)
| 2. Tenants (tenants)
| 3. Users & Auth (platform-users)
| 4. Access Control (platform-roles)
| 5. Billing (subscriptions)
| 6. Notifications (notifications)
| 7. File Manager (file-manager)
| 8. Audit Logs (audit-logs)
| 9. Settings (system-settings)
| 10. Developer Tools (developer-tools)
| 11. Platform Analytics (platform-analytics)
| 12. Platform Integrations (platform-integrations)
|
| Access Control:
| - Routes use 'module:' middleware for granular access control
| - Access paths match admin_pages.jsx and config/modules.php platform_hierarchy
| - Super Administrators bypass all module access checks
|
| IMPORTANT: All routes use 'auth:landlord' middleware, NOT 'auth'.
| This ensures authentication is checked against the landlord_users table
| in the central database, not the tenant users table.
|
*/

// =========================================================================
// LANDLORD AUTHENTICATION ROUTES
// =========================================================================

Route::middleware('guest:landlord')->group(function () {
    Route::get('/login', [AuthenticatedSessionController::class, 'create'])
        ->name('login'); // Use 'login' for the framework's redirectGuestsTo

    Route::post('/login', [AuthenticatedSessionController::class, 'store']);
});

Route::post('/logout', [AuthenticatedSessionController::class, 'destroy'])
    ->middleware('auth:landlord')
    ->name('admin.logout');

// Root redirects to dashboard (or login if not authenticated)
Route::get('/', function () {
    return redirect('/dashboard');
})->middleware('auth:landlord');

// =========================================================================
// PROTECTED ADMIN ROUTES (Require Landlord Authentication)
// =========================================================================

Route::middleware(['auth:landlord'])->group(function () {

    // =========================================================================
    // 1. DASHBOARD MODULE (platform-dashboard)
    // Access: platform-dashboard, platform-dashboard.overview, platform-dashboard.system-health
    // =========================================================================
    Route::get('/dashboard', function () {
        return Inertia::render('Admin/Dashboard');
    })->middleware(['module:platform-dashboard,overview'])->name('admin.dashboard');

    Route::get('/system-health', function () {
        return Inertia::render('Admin/SystemHealth');
    })->middleware(['module:platform-dashboard,system-health'])->name('admin.system-health');

    // =========================================================================
    // 2. TENANT MANAGEMENT MODULE (tenants)
    // Access: tenants, tenants.tenant-list, tenants.domains, tenants.databases
    // =========================================================================
    Route::middleware(['module:tenants'])->prefix('tenants')->name('admin.tenants.')->group(function () {
        Route::get('/', function () {
            return Inertia::render('Admin/Tenants/Index');
        })->middleware(['module:tenants,tenant-list'])->name('index');

        Route::get('/create', function () {
            return Inertia::render('Admin/Tenants/Create');
        })->middleware(['module:tenants,tenant-list,tenant-management,create'])->name('create');

        Route::get('/{tenant}', function ($tenant) {
            return Inertia::render('Admin/Tenants/Show', ['tenantId' => $tenant]);
        })->middleware(['module:tenants,tenant-list,tenant-management,view'])->name('show');

        Route::get('/{tenant}/edit', function ($tenant) {
            return Inertia::render('Admin/Tenants/Edit', ['tenantId' => $tenant]);
        })->middleware(['module:tenants,tenant-list,tenant-management,update'])->name('edit');

        // Domain Management
        Route::get('/domains', function () {
            return Inertia::render('Admin/Tenants/Domains');
        })->middleware(['module:tenants,domains'])->name('domains');

        // Database Management
        Route::get('/databases', function () {
            return Inertia::render('Admin/Tenants/Databases');
        })->middleware(['module:tenants,databases'])->name('databases');

        // Tenant Impersonation
        Route::post('/{tenant}/impersonate', [ImpersonationController::class, 'impersonate'])
            ->middleware(['module:tenants,tenant-list,tenant-management,impersonate'])
            ->name('impersonate');
    });

    // =========================================================================
    // 3. USERS & AUTHENTICATION MODULE (platform-users)
    // Access: platform-users, platform-users.admin-users, platform-users.authentication, platform-users.sessions
    // =========================================================================
    Route::middleware(['module:platform-users'])->prefix('users')->name('admin.users.')->group(function () {
        // Main index page (uses shared controller)
        Route::get('/', [\App\Http\Controllers\Shared\Admin\UserController::class, 'adminIndex'])
            ->middleware(['module:platform-users,admin-users'])
            ->name('index');

        // API routes for user management
        Route::get('/paginate', function (\Illuminate\Http\Request $request) {
            return app(\App\Http\Controllers\Shared\Admin\UserController::class)->paginate($request, 'admin');
        })->middleware(['module:platform-users,admin-users,user-list,view'])->name('paginate');

        Route::get('/stats', function (\Illuminate\Http\Request $request) {
            return app(\App\Http\Controllers\Shared\Admin\UserController::class)->stats($request, 'admin');
        })->middleware(['module:platform-users,admin-users,user-list,view'])->name('stats');

        Route::post('/', function (\Illuminate\Http\Request $request) {
            return app(\App\Http\Controllers\Shared\Admin\UserController::class)->store($request, 'admin');
        })->middleware(['module:platform-users,admin-users,user-list,create'])->name('store');

        Route::put('/{user}', function (\Illuminate\Http\Request $request, $user) {
            return app(\App\Http\Controllers\Shared\Admin\UserController::class)->update($request, $user, 'admin');
        })->middleware(['module:platform-users,admin-users,user-list,update'])->name('update');

        Route::delete('/{user}', function ($user) {
            return app(\App\Http\Controllers\Shared\Admin\UserController::class)->destroy($user, 'admin');
        })->middleware(['module:platform-users,admin-users,user-list,delete'])->name('destroy');

        Route::patch('/{user}/toggle-status', function (\Illuminate\Http\Request $request, $user) {
            return app(\App\Http\Controllers\Shared\Admin\UserController::class)->toggleStatus($request, $user, 'admin');
        })->middleware(['module:platform-users,admin-users,user-list,update'])->name('toggle-status');

        Route::patch('/{user}/roles', function (\Illuminate\Http\Request $request, $user) {
            return app(\App\Http\Controllers\Shared\Admin\UserController::class)->updateRoles($request, $user, 'admin');
        })->middleware(['module:platform-users,admin-users,user-list,update'])->name('update-roles');

        Route::get('/{user}', function ($user) {
            return Inertia::render('Admin/Users/Show', ['userId' => $user]);
        })->middleware(['module:platform-users,admin-users,user-list,view'])->name('show');

        Route::get('/{user}/edit', function ($user) {
            return Inertia::render('Admin/Users/Edit', ['userId' => $user]);
        })->middleware(['module:platform-users,admin-users,user-list,update'])->name('edit');
    });

    // Authentication Settings
    Route::get('/authentication', function () {
        return Inertia::render('Admin/Authentication/Index');
    })->middleware(['module:platform-users,authentication'])->name('admin.authentication');

    // Active Sessions
    Route::get('/sessions', function () {
        return Inertia::render('Admin/Sessions/Index');
    })->middleware(['module:platform-users,sessions'])->name('admin.sessions');

    // =========================================================================
    // 4. ROLES & ACCESS CONTROL MODULE (platform-roles)
    // Access: platform-roles, platform-roles.role-management, platform-roles.module-permissions
    // =========================================================================
    Route::middleware(['module:platform-roles'])->prefix('roles')->name('admin.roles.')->group(function () {
        Route::get('/', [\App\Http\Controllers\Shared\Admin\RoleController::class, 'index'])
            ->middleware(['module:platform-roles,role-management'])
            ->name('index');
        Route::post('/', [\App\Http\Controllers\Shared\Admin\RoleController::class, 'storeRole'])
            ->middleware(['module:platform-roles,role-management,role-list,create'])
            ->name('store');
        Route::put('/{id}', [\App\Http\Controllers\Shared\Admin\RoleController::class, 'updateRole'])
            ->middleware(['module:platform-roles,role-management,role-list,update'])
            ->name('update');
        Route::delete('/{id}', [\App\Http\Controllers\Shared\Admin\RoleController::class, 'deleteRole'])
            ->middleware(['module:platform-roles,role-management,role-list,delete'])
            ->name('destroy');
        Route::patch('/{id}/permissions', [\App\Http\Controllers\Shared\Admin\RoleController::class, 'batchUpdatePermissions'])
            ->middleware(['module:platform-roles,role-management,role-list,update'])
            ->name('permissions.batch');
        Route::post('/toggle-permission', [\App\Http\Controllers\Shared\Admin\RoleController::class, 'togglePermission'])
            ->middleware(['module:platform-roles,role-management,role-list,update'])
            ->name('toggle-permission');
        Route::post('/update-module', [\App\Http\Controllers\Shared\Admin\RoleController::class, 'updateRoleModule'])
            ->middleware(['module:platform-roles,role-management,role-list,update'])
            ->name('update-module');
        Route::post('/clone/{id}', [\App\Http\Controllers\Shared\Admin\RoleController::class, 'cloneRole'])
            ->middleware(['module:platform-roles,role-management,role-list,create'])
            ->name('clone');
        Route::get('/export', [\App\Http\Controllers\Shared\Admin\RoleController::class, 'exportRoles'])
            ->middleware(['module:platform-roles,role-management,role-list,view'])
            ->name('export');
        Route::get('/snapshot', [\App\Http\Controllers\Shared\Admin\RoleController::class, 'snapshot'])
            ->middleware(['module:platform-roles,role-management,role-list,view'])
            ->name('snapshot');
        Route::get('/admin/modules', [ModuleController::class, 'index'])
            ->middleware(['module:platform-roles,module-permissions'])
            ->name('modules.index');
    });

    // Modules Management (Module Access)
    Route::middleware(['module:platform-roles,module-permissions'])->prefix('modules')->name('admin.modules.')->group(function () {
        // Main module management page (shared controller)
        Route::get('/', [\App\Http\Controllers\Shared\Admin\ModuleController::class, 'index'])->name('index');
        Route::get('/api', [\App\Http\Controllers\Shared\Admin\ModuleController::class, 'apiIndex'])->name('api.index');

        // Module CRUD (structure management - platform admin only)
        Route::post('/', [\App\Http\Controllers\Shared\Admin\ModuleController::class, 'storeModule'])
            ->middleware(['module:platform-roles,module-permissions,module-list,create'])
            ->name('store');
        Route::put('/{module}', [\App\Http\Controllers\Shared\Admin\ModuleController::class, 'updateModule'])
            ->middleware(['module:platform-roles,module-permissions,module-list,update'])
            ->name('update');
        Route::delete('/{module}', [\App\Http\Controllers\Shared\Admin\ModuleController::class, 'destroyModule'])
            ->middleware(['module:platform-roles,module-permissions,module-list,delete'])
            ->name('destroy');

        // Sub-module CRUD
        Route::post('/{module}/sub-modules', [\App\Http\Controllers\Shared\Admin\ModuleController::class, 'storeSubModule'])
            ->middleware(['module:platform-roles,module-permissions,module-list,create'])
            ->name('sub-modules.store');
        Route::put('/sub-modules/{subModule}', [\App\Http\Controllers\Shared\Admin\ModuleController::class, 'updateSubModule'])
            ->middleware(['module:platform-roles,module-permissions,module-list,update'])
            ->name('sub-modules.update');
        Route::delete('/sub-modules/{subModule}', [\App\Http\Controllers\Shared\Admin\ModuleController::class, 'destroySubModule'])
            ->middleware(['module:platform-roles,module-permissions,module-list,delete'])
            ->name('sub-modules.destroy');

        // Component CRUD
        Route::post('/sub-modules/{subModule}/components', [\App\Http\Controllers\Shared\Admin\ModuleController::class, 'storeComponent'])
            ->middleware(['module:platform-roles,module-permissions,module-list,create'])
            ->name('components.store');
        Route::put('/components/{component}', [\App\Http\Controllers\Shared\Admin\ModuleController::class, 'updateComponent'])
            ->middleware(['module:platform-roles,module-permissions,module-list,update'])
            ->name('components.update');
        Route::delete('/components/{component}', [\App\Http\Controllers\Shared\Admin\ModuleController::class, 'destroyComponent'])
            ->middleware(['module:platform-roles,module-permissions,module-list,delete'])
            ->name('components.destroy');

        // Module access check
        Route::post('/check-access', [\App\Http\Controllers\Shared\Admin\ModuleController::class, 'checkAccess'])->name('check-access');

        // Module requirements
        Route::get('/{moduleCode}/requirements', [\App\Http\Controllers\Shared\Admin\ModuleController::class, 'getModuleRequirements'])->name('requirements');

        // Module Catalog API (for plan configuration)
        Route::get('/catalog', [\App\Http\Controllers\Admin\PlanModuleController::class, 'getModules'])
            ->middleware(['module:subscriptions,plans'])
            ->name('catalog');

        // Role Module Access Management
        Route::prefix('role-access')->name('role-access.')->group(function () {
            Route::get('/roles', [\App\Http\Controllers\Shared\Admin\ModuleController::class, 'getRolesWithAccessCounts'])
                ->middleware(['module:platform-roles,module-permissions,role-access,view'])
                ->name('roles');
            Route::get('/{roleId}', [\App\Http\Controllers\Shared\Admin\ModuleController::class, 'getRoleAccess'])
                ->middleware(['module:platform-roles,module-permissions,role-access,view'])
                ->name('show');
            Route::post('/{roleId}/sync', [\App\Http\Controllers\Shared\Admin\ModuleController::class, 'syncRoleAccess'])
                ->middleware(['module:platform-roles,module-permissions,role-access,manage'])
                ->name('sync');
            Route::post('/{roleId}/grant/{moduleId}', [\App\Http\Controllers\Shared\Admin\ModuleController::class, 'grantModuleAccess'])
                ->middleware(['module:platform-roles,module-permissions,role-access,manage'])
                ->name('grant');
            Route::post('/{roleId}/revoke/{moduleId}', [\App\Http\Controllers\Shared\Admin\ModuleController::class, 'revokeModuleAccess'])
                ->middleware(['module:platform-roles,module-permissions,role-access,manage'])
                ->name('revoke');
        });
    });



    // =========================================================================
    // 5. SUBSCRIPTIONS & BILLING MODULE (subscriptions)
    // Access: subscriptions, subscriptions.plans, subscriptions.tenant-subscriptions, subscriptions.invoices
    // =========================================================================
    // Subscription Plans
    Route::middleware(['module:subscriptions'])->prefix('plans')->name('admin.plans.')->group(function () {
        Route::get('/', function () {
            return Inertia::render('Admin/Plans/Index');
        })->middleware(['module:subscriptions,plans'])->name('index');

        Route::get('/create', function () {
            return Inertia::render('Admin/Plans/Create');
        })->middleware(['module:subscriptions,plans,plan-list,create'])->name('create');

        // Plan-Module Management API
        Route::get('/{plan}/modules', [\App\Http\Controllers\Admin\PlanModuleController::class, 'getPlanModules'])
            ->middleware(['module:subscriptions,plans,plan-list,view'])
            ->name('modules.index');
        Route::post('/{plan}/modules', [\App\Http\Controllers\Admin\PlanModuleController::class, 'attachModules'])
            ->middleware(['module:subscriptions,plans,plan-list,update'])
            ->name('modules.attach');
        Route::delete('/{plan}/modules', [\App\Http\Controllers\Admin\PlanModuleController::class, 'detachModules'])
            ->middleware(['module:subscriptions,plans,plan-list,update'])
            ->name('modules.detach');
        Route::put('/{plan}/modules/sync', [\App\Http\Controllers\Admin\PlanModuleController::class, 'syncModules'])
            ->middleware(['module:subscriptions,plans,plan-list,update'])
            ->name('modules.sync');
        Route::put('/{plan}/modules/{module}', [\App\Http\Controllers\Admin\PlanModuleController::class, 'updateModuleConfig'])
            ->middleware(['module:subscriptions,plans,plan-list,update'])
            ->name('modules.update');
    });

    // Plans API
    Route::get('/api/plans', [\App\Http\Controllers\Admin\PlanController::class, 'index'])
        ->middleware(['module:subscriptions,plans'])
        ->name('api.plans.index');

    // Billing & Invoices
    Route::middleware(['module:subscriptions'])->prefix('billing')->name('admin.billing.')->group(function () {
        Route::get('/', function () {
            return Inertia::render('Admin/Billing/Index');
        })->middleware(['module:subscriptions,tenant-subscriptions'])->name('index');

        // Subscriptions Overview
        Route::get('/subscriptions', function () {
            return Inertia::render('Admin/Billing/Subscriptions');
        })->middleware(['module:subscriptions,tenant-subscriptions'])->name('subscriptions');

        Route::get('/invoices', function () {
            return Inertia::render('Admin/Billing/Invoices');
        })->middleware(['module:subscriptions,invoices'])->name('invoices');

        // Tenant-specific billing management
        Route::get('/tenants/{tenant}', [\App\Http\Controllers\Landlord\BillingController::class, 'index'])
            ->middleware(['module:subscriptions,tenant-subscriptions,subscription-list,view'])
            ->name('tenant');
        Route::post('/tenants/{tenant}/subscribe/{plan}', [\App\Http\Controllers\Landlord\BillingController::class, 'subscribe'])
            ->middleware(['module:subscriptions,tenant-subscriptions,subscription-list,create'])
            ->name('tenant.subscribe');
        Route::post('/tenants/{tenant}/change-plan', [\App\Http\Controllers\Landlord\BillingController::class, 'changePlan'])
            ->middleware(['module:subscriptions,tenant-subscriptions,subscription-list,update'])
            ->name('tenant.change-plan');
        Route::post('/tenants/{tenant}/cancel', [\App\Http\Controllers\Landlord\BillingController::class, 'cancel'])
            ->middleware(['module:subscriptions,tenant-subscriptions,subscription-list,update'])
            ->name('tenant.cancel');
        Route::post('/tenants/{tenant}/resume', [\App\Http\Controllers\Landlord\BillingController::class, 'resume'])
            ->middleware(['module:subscriptions,tenant-subscriptions,subscription-list,update'])
            ->name('tenant.resume');
        Route::post('/tenants/{tenant}/portal', [\App\Http\Controllers\Landlord\BillingController::class, 'portal'])
            ->middleware(['module:subscriptions,tenant-subscriptions,subscription-list,view'])
            ->name('tenant.portal');
        Route::get('/tenants/{tenant}/invoices', [\App\Http\Controllers\Landlord\BillingController::class, 'invoices'])
            ->middleware(['module:subscriptions,invoices,invoice-list,view'])
            ->name('tenant.invoices');
        Route::get('/tenants/{tenant}/invoices/{invoice}', [\App\Http\Controllers\Landlord\BillingController::class, 'downloadInvoice'])
            ->middleware(['module:subscriptions,invoices,invoice-list,download'])
            ->name('tenant.invoice.download');
        Route::put('/tenants/{tenant}/billing-address', [\App\Http\Controllers\Landlord\BillingController::class, 'updateBillingAddress'])
            ->middleware(['module:subscriptions,tenant-subscriptions,subscription-list,update'])
            ->name('tenant.billing-address');
    });

    // Stripe Checkout (for new subscriptions via registration flow)
    Route::post('/checkout/{plan}', [\App\Http\Controllers\Landlord\BillingController::class, 'checkout'])
        ->middleware(['module:subscriptions,payment-gateways'])
        ->name('admin.checkout');

    // =========================================================================
    // 6. NOTIFICATIONS MODULE (notifications)
    // Access: notifications, notifications.channels, notifications.templates, notifications.broadcasts
    // =========================================================================
    Route::middleware(['module:notifications'])->prefix('notifications')->name('admin.notifications.')->group(function () {
        // Notification Channels
        Route::get('/channels', function () {
            return Inertia::render('Admin/Notifications/Channels');
        })->middleware(['module:notifications,channels'])->name('channels');

        // Notification Templates
        Route::get('/templates', function () {
            return Inertia::render('Admin/Notifications/Templates');
        })->middleware(['module:notifications,templates'])->name('templates');

        // Broadcasts
        Route::get('/broadcasts', function () {
            return Inertia::render('Admin/Notifications/Broadcasts');
        })->middleware(['module:notifications,broadcasts'])->name('broadcasts');
    });

    // =========================================================================
    // 7. FILE MANAGER MODULE (file-manager)
    // Access: file-manager, file-manager.storage, file-manager.quotas, file-manager.media-library
    // =========================================================================
    Route::middleware(['module:file-manager'])->prefix('files')->name('admin.files.')->group(function () {
        // Storage Management
        Route::get('/storage', function () {
            return Inertia::render('Admin/Files/Storage');
        })->middleware(['module:file-manager,storage'])->name('storage');

        // Storage Quotas
        Route::get('/quotas', function () {
            return Inertia::render('Admin/Files/Quotas');
        })->middleware(['module:file-manager,quotas'])->name('quotas');

        // Media Library
        Route::get('/media', function () {
            return Inertia::render('Admin/Files/Media');
        })->middleware(['module:file-manager,media-library'])->name('media');
    });

    // =========================================================================
    // 8. AUDIT & ACTIVITY LOGS MODULE (audit-logs)
    // Access: audit-logs, audit-logs.activity-logs, audit-logs.security-logs, audit-logs.system-logs
    // =========================================================================
    Route::middleware(['module:audit-logs'])->prefix('logs')->name('admin.logs.')->group(function () {
        // Activity Logs
        Route::get('/activity', function () {
            return Inertia::render('Admin/Logs/Activity');
        })->middleware(['module:audit-logs,activity-logs'])->name('activity');

        // Security Logs
        Route::get('/security', function () {
            return Inertia::render('Admin/Logs/Security');
        })->middleware(['module:audit-logs,security-logs'])->name('security');

        // System Logs
        Route::get('/system', function () {
            return Inertia::render('Admin/Logs/System');
        })->middleware(['module:audit-logs,system-logs'])->name('system');
    });

    // Legacy Audit Logs routes (for backward compatibility)
    Route::middleware(['module:audit-logs,activity-logs'])->prefix('audit-logs')->name('admin.audit-logs.')->group(function () {
        Route::get('/', [\App\Http\Controllers\AuditLogController::class, 'index'])->name('index');
        Route::get('/export', [\App\Http\Controllers\AuditLogController::class, 'export'])
            ->middleware(['module:audit-logs,activity-logs,log-list,export'])
            ->name('export');
        Route::get('/statistics', [\App\Http\Controllers\AuditLogController::class, 'statistics'])->name('statistics');
        Route::get('/{activity}', [\App\Http\Controllers\AuditLogController::class, 'show'])->name('show');
    });

    // Error Logs routes (part of Audit Logs module)
    Route::middleware(['module:audit-logs'])->prefix('error-logs')->name('admin.error-logs.')->group(function () {
        Route::get('/', [\App\Http\Controllers\Admin\ErrorLogController::class, 'index'])->name('index');
        Route::get('/statistics', [\App\Http\Controllers\Admin\ErrorLogController::class, 'statistics'])->name('statistics');
        Route::get('/{errorLog}', [\App\Http\Controllers\Admin\ErrorLogController::class, 'show'])->name('show');
        Route::post('/{errorLog}/resolve', [\App\Http\Controllers\Admin\ErrorLogController::class, 'resolve'])->name('resolve');
        Route::delete('/{errorLog}', [\App\Http\Controllers\Admin\ErrorLogController::class, 'destroy'])->name('destroy');
        Route::post('/bulk-resolve', [\App\Http\Controllers\Admin\ErrorLogController::class, 'bulkResolve'])->name('bulk-resolve');
        Route::post('/bulk-destroy', [\App\Http\Controllers\Admin\ErrorLogController::class, 'bulkDestroy'])->name('bulk-destroy');
    });

    // =========================================================================
    // 9. SYSTEM SETTINGS MODULE (system-settings)
    // Access: system-settings, system-settings.general-settings, system-settings.branding, etc.
    // =========================================================================
    Route::middleware(['module:system-settings'])->prefix('settings')->name('admin.settings.')->group(function () {
        // General Settings
        Route::get('/', function () {
            return Inertia::render('Admin/Settings/Index');
        })->middleware(['module:system-settings,general-settings'])->name('index');

        // Branding Settings
        Route::get('/branding', function () {
            return Inertia::render('Admin/Settings/Branding');
        })->middleware(['module:system-settings,branding'])->name('branding');

        // Localization Settings
        Route::get('/localization', function () {
            return Inertia::render('Admin/Settings/Localization');
        })->middleware(['module:system-settings,localization'])->name('localization');

        // Email Settings
        Route::get('/email', function () {
            return Inertia::render('Admin/Settings/Email');
        })->middleware(['module:system-settings,email-settings'])->name('email');

        // Integrations
        Route::get('/integrations', function () {
            return Inertia::render('Admin/Settings/Integrations');
        })->middleware(['module:system-settings,integrations'])->name('integrations');

        // Payment Gateways
        Route::get('/payment-gateways', function () {
            return Inertia::render('Admin/Settings/PaymentGateways');
        })->middleware(['module:subscriptions,payment-gateways'])->name('payment-gateways');

        // Platform Settings API
        Route::get('/platform', [PlatformSettingController::class, 'index'])
            ->middleware(['module:system-settings,general-settings,platform-settings,view'])
            ->name('platform.index');
        Route::put('/platform', [PlatformSettingController::class, 'update'])
            ->middleware(['module:system-settings,general-settings,platform-settings,update'])
            ->name('platform.update');
        Route::post('/platform', [PlatformSettingController::class, 'update'])
            ->middleware(['module:system-settings,general-settings,platform-settings,update'])
            ->name('platform.store');
        Route::post('/platform/test-email', [PlatformSettingController::class, 'sendTestEmail'])
            ->middleware(['module:system-settings,email-settings,email-config,test'])
            ->name('platform.test-email');
        Route::post('/platform/test-sms', [PlatformSettingController::class, 'sendTestSms'])
            ->middleware(['module:system-settings,general-settings,platform-settings,update'])
            ->name('platform.test-sms');

        // System Maintenance
        Route::get('/maintenance', [MaintenanceController::class, 'index'])
            ->middleware(['module:developer-tools,maintenance'])
            ->name('maintenance.index');
        Route::put('/maintenance', [MaintenanceController::class, 'update'])
            ->middleware(['module:developer-tools,maintenance,maintenance-controls,update'])
            ->name('maintenance.update');
        Route::post('/maintenance/toggle', [MaintenanceController::class, 'toggle'])
            ->middleware(['module:developer-tools,maintenance,maintenance-controls,update'])
            ->name('maintenance.toggle');
    });

    // =========================================================================
    // 10. DEVELOPER TOOLS MODULE (developer-tools)
    // Access: developer-tools, developer-tools.api-management, developer-tools.webhooks, etc.
    // =========================================================================
    Route::middleware(['module:developer-tools'])->prefix('developer')->name('admin.developer.')->group(function () {
        // API Management
        Route::get('/api', function () {
            return Inertia::render('Admin/Developer/Api');
        })->middleware(['module:developer-tools,api-management'])->name('api');

        // Webhooks
        Route::get('/webhooks', function () {
            return Inertia::render('Admin/Developer/Webhooks');
        })->middleware(['module:developer-tools,webhooks'])->name('webhooks');

        // Debug Tools
        Route::get('/debug', function () {
            return Inertia::render('Admin/Developer/Debug');
        })->middleware(['module:developer-tools,debug-tools'])->name('debug');

        // Queue Management
        Route::get('/queues', function () {
            return Inertia::render('Admin/Developer/Queues');
        })->middleware(['module:developer-tools,queue-jobs'])->name('queues');

        // Cache Management
        Route::get('/cache', function () {
            return Inertia::render('Admin/Developer/Cache');
        })->middleware(['module:developer-tools,cache-management'])->name('cache');

        // Maintenance Mode
        Route::get('/maintenance', [MaintenanceController::class, 'index'])
            ->middleware(['module:developer-tools,maintenance'])
            ->name('maintenance');
        Route::put('/maintenance', [MaintenanceController::class, 'update'])
            ->middleware(['module:developer-tools,maintenance'])
            ->name('maintenance.update');
        Route::post('/maintenance/toggle', [MaintenanceController::class, 'toggle'])
            ->middleware(['module:developer-tools,maintenance'])
            ->name('maintenance.toggle');
    });

    // =========================================================================
    // 11. PLATFORM ANALYTICS MODULE (platform-analytics)
    // Access: platform-analytics, platform-analytics.platform-overview, platform-analytics.revenue-analytics, etc.
    // =========================================================================
    Route::middleware(['module:platform-analytics'])->prefix('analytics')->name('admin.analytics.')->group(function () {
        Route::get('/', function () {
            return Inertia::render('Admin/Analytics/Index');
        })->middleware(['module:platform-analytics,platform-overview'])->name('index');

        Route::get('/revenue', function () {
            return Inertia::render('Admin/Analytics/Revenue');
        })->middleware(['module:platform-analytics,revenue-analytics'])->name('revenue');

        Route::get('/tenants', function () {
            return Inertia::render('Admin/Analytics/Tenants');
        })->middleware(['module:platform-analytics,tenant-analytics'])->name('tenants');

        Route::get('/usage', function () {
            return Inertia::render('Admin/Analytics/Usage');
        })->middleware(['module:platform-analytics,usage-analytics'])->name('usage');

        Route::get('/performance', function () {
            return Inertia::render('Admin/Analytics/Performance');
        })->middleware(['module:platform-analytics,system-performance'])->name('performance');

        Route::get('/reports', function () {
            return Inertia::render('Admin/Analytics/Reports');
        })->middleware(['module:platform-analytics,platform-reports'])->name('reports');

        // Module Analytics API
        Route::get('/modules', [\App\Http\Controllers\Admin\ModuleAnalyticsController::class, 'index'])
            ->middleware(['module:platform-analytics,usage-analytics'])
            ->name('modules.index');
        Route::get('/modules/{module}', [\App\Http\Controllers\Admin\ModuleAnalyticsController::class, 'show'])
            ->middleware(['module:platform-analytics,usage-analytics,api-usage,view'])
            ->name('modules.show');
        Route::get('/modules-trends', [\App\Http\Controllers\Admin\ModuleAnalyticsController::class, 'trends'])
            ->middleware(['module:platform-analytics,usage-analytics,feature-usage,view'])
            ->name('modules.trends');
    });

    // =========================================================================
    // 14. PLATFORM ONBOARDING MODULE (platform-onboarding)
    // Access: platform-onboarding, platform-onboarding.registration-dashboard, etc.
    // =========================================================================
    Route::middleware(['module:platform-onboarding'])->prefix('onboarding')->name('admin.onboarding.')->group(function () {
        // 14.1 Registration Dashboard
        Route::get('/', function () {
            return Inertia::render('Admin/Onboarding/Dashboard');
        })->middleware(['module:platform-onboarding,registration-dashboard'])->name('dashboard');

        // 14.2 Pending Registrations
        Route::get('/pending', function () {
            return Inertia::render('Admin/Onboarding/Pending');
        })->middleware(['module:platform-onboarding,pending-registrations'])->name('pending');

        // 14.3 Provisioning Queue
        Route::get('/provisioning', function () {
            return Inertia::render('Admin/Onboarding/Provisioning');
        })->middleware(['module:platform-onboarding,provisioning-queue'])->name('provisioning');

        // 14.4 Trial Management
        Route::get('/trials', function () {
            return Inertia::render('Admin/Onboarding/Trials');
        })->middleware(['module:platform-onboarding,trial-management'])->name('trials');

        // 14.5 Welcome Automation
        Route::get('/automation', function () {
            return Inertia::render('Admin/Onboarding/Automation');
        })->middleware(['module:platform-onboarding,welcome-automation'])->name('automation');

        // 14.6 Onboarding Analytics
        Route::get('/analytics', function () {
            return Inertia::render('Admin/Onboarding/Analytics');
        })->middleware(['module:platform-onboarding,onboarding-analytics'])->name('analytics');

        // 14.7 Settings
        Route::get('/settings', function () {
            return Inertia::render('Admin/Onboarding/Settings');
        })->middleware(['module:platform-onboarding,onboarding-settings'])->name('settings');
    });

    // =========================================================================
    // 12. PLATFORM INTEGRATIONS MODULE (platform-integrations)
    // Access: platform-integrations, platform-integrations.global-connectors, etc.
    // =========================================================================
    Route::middleware(['module:platform-integrations'])->prefix('integrations')->name('admin.integrations.')->group(function () {
        Route::get('/', function () {
            return Inertia::render('Admin/Integrations/Index');
        })->middleware(['module:platform-integrations,global-connectors'])->name('index');

        // Global Connectors
        Route::get('/connectors', function () {
            return Inertia::render('Admin/Integrations/Connectors');
        })->middleware(['module:platform-integrations,global-connectors'])->name('connectors');

        Route::get('/api', function () {
            return Inertia::render('Admin/Integrations/Api');
        })->middleware(['module:platform-integrations,api-management'])->name('api');

        Route::get('/webhooks', function () {
            return Inertia::render('Admin/Integrations/Webhooks');
        })->middleware(['module:platform-integrations,webhook-management'])->name('webhooks');

        Route::get('/tenants', function () {
            return Inertia::render('Admin/Integrations/Tenants');
        })->middleware(['module:platform-integrations,tenant-integrations-overview'])->name('tenants');

        // Third-Party Apps
        Route::get('/apps', function () {
            return Inertia::render('Admin/Integrations/Apps');
        })->middleware(['module:platform-integrations,third-party-apps'])->name('apps');

        Route::get('/logs', function () {
            return Inertia::render('Admin/Integrations/Logs');
        })->middleware(['module:platform-integrations,integration-logs'])->name('logs');
    });

    // =========================================================================
    // 13. SUPPORT & TICKETING MODULE (platform-support)
    // Access: platform-support, platform-support.ticket-management, etc.
    // =========================================================================
    Route::middleware(['module:platform-support'])->prefix('support')->name('admin.support.')->group(function () {

        // 13.1 Ticket Management
        Route::prefix('tickets')->name('tickets.')->group(function () {
            Route::get('/', function () {
                return Inertia::render('Admin/Support/Tickets/Index');
            })->middleware(['module:platform-support,ticket-management'])->name('index');

            Route::get('/sla-violations', function () {
                return Inertia::render('Admin/Support/Tickets/SlaViolations');
            })->middleware(['module:platform-support,ticket-management,sla-violations,view'])->name('sla-violations');

            Route::get('/categories', function () {
                return Inertia::render('Admin/Support/Tickets/Categories');
            })->middleware(['module:platform-support,ticket-management,ticket-categories,view'])->name('categories');

            Route::get('/priorities', function () {
                return Inertia::render('Admin/Support/Tickets/Priorities');
            })->middleware(['module:platform-support,ticket-management,ticket-priorities,view'])->name('priorities');

            Route::get('/{ticket}', function ($ticket) {
                return Inertia::render('Admin/Support/Tickets/Show', ['ticketId' => $ticket]);
            })->middleware(['module:platform-support,ticket-management,ticket-detail,view'])->name('show');
        });

        // 13.2 Department & Agent Management
        Route::prefix('departments')->name('departments.')->group(function () {
            Route::get('/', function () {
                return Inertia::render('Admin/Support/Departments/Index');
            })->middleware(['module:platform-support,department-agent,departments,view'])->name('index');
        });

        Route::prefix('agents')->name('agents.')->group(function () {
            Route::get('/', function () {
                return Inertia::render('Admin/Support/Agents/Index');
            })->middleware(['module:platform-support,department-agent,agents,view'])->name('index');
        });

        Route::prefix('schedules')->name('schedules.')->group(function () {
            Route::get('/', function () {
                return Inertia::render('Admin/Support/Schedules/Index');
            })->middleware(['module:platform-support,department-agent,schedules,view'])->name('index');
        });

        Route::prefix('auto-assign')->name('auto-assign.')->group(function () {
            Route::get('/', function () {
                return Inertia::render('Admin/Support/AutoAssign/Index');
            })->middleware(['module:platform-support,department-agent,auto-assign,view'])->name('index');
        });

        // 13.3 Routing & SLA
        Route::prefix('sla')->name('sla.')->group(function () {
            Route::get('/', function () {
                return Inertia::render('Admin/Support/Sla/Index');
            })->middleware(['module:platform-support,routing-sla'])->name('index');

            Route::get('/policies', function () {
                return Inertia::render('Admin/Support/Sla/Policies');
            })->middleware(['module:platform-support,routing-sla,sla-policies,view'])->name('policies');

            Route::get('/routing', function () {
                return Inertia::render('Admin/Support/Sla/Routing');
            })->middleware(['module:platform-support,routing-sla,routing-rules,view'])->name('routing');

            Route::get('/escalation', function () {
                return Inertia::render('Admin/Support/Sla/Escalation');
            })->middleware(['module:platform-support,routing-sla,escalation-rules,view'])->name('escalation');
        });

        // 13.4 Knowledge Base
        Route::prefix('kb')->name('kb.')->group(function () {
            Route::get('/', function () {
                return Inertia::render('Admin/Support/Kb/Index');
            })->middleware(['module:platform-support,knowledge-base'])->name('index');

            Route::get('/categories', function () {
                return Inertia::render('Admin/Support/Kb/Categories');
            })->middleware(['module:platform-support,knowledge-base,kb-categories,view'])->name('categories');

            Route::get('/articles', function () {
                return Inertia::render('Admin/Support/Kb/Articles');
            })->middleware(['module:platform-support,knowledge-base,kb-articles,view'])->name('articles');

            Route::get('/templates', function () {
                return Inertia::render('Admin/Support/Kb/Templates');
            })->middleware(['module:platform-support,knowledge-base,article-templates,view'])->name('templates');
        });

        // 13.5 Canned Responses
        Route::prefix('canned')->name('canned.')->group(function () {
            Route::get('/', function () {
                return Inertia::render('Admin/Support/Canned/Index');
            })->middleware(['module:platform-support,canned-responses'])->name('index');

            Route::get('/templates', function () {
                return Inertia::render('Admin/Support/Canned/Templates');
            })->middleware(['module:platform-support,canned-responses,response-templates,view'])->name('templates');

            Route::get('/categories', function () {
                return Inertia::render('Admin/Support/Canned/Categories');
            })->middleware(['module:platform-support,canned-responses,macro-categories,view'])->name('categories');
        });

        // 13.6 Reporting & Analytics
        Route::prefix('analytics')->name('analytics.')->group(function () {
            Route::get('/', function () {
                return Inertia::render('Admin/Support/Analytics/Index');
            })->middleware(['module:platform-support,support-analytics'])->name('index');

            Route::get('/volume', function () {
                return Inertia::render('Admin/Support/Analytics/Volume');
            })->middleware(['module:platform-support,support-analytics,ticket-volume,view'])->name('volume');

            Route::get('/agents', function () {
                return Inertia::render('Admin/Support/Analytics/Agents');
            })->middleware(['module:platform-support,support-analytics,agent-performance,view'])->name('agents');

            Route::get('/sla', function () {
                return Inertia::render('Admin/Support/Analytics/Sla');
            })->middleware(['module:platform-support,support-analytics,sla-compliance,view'])->name('sla');

            Route::get('/csat', function () {
                return Inertia::render('Admin/Support/Analytics/Csat');
            })->middleware(['module:platform-support,support-analytics,csat-reports,view'])->name('csat');
        });

        // 13.7 Customer Feedback
        Route::prefix('feedback')->name('feedback.')->group(function () {
            Route::get('/', function () {
                return Inertia::render('Admin/Support/Feedback/Index');
            })->middleware(['module:platform-support,customer-feedback'])->name('index');

            Route::get('/ratings', function () {
                return Inertia::render('Admin/Support/Feedback/Ratings');
            })->middleware(['module:platform-support,customer-feedback,csat-ratings,view'])->name('ratings');

            Route::get('/forms', function () {
                return Inertia::render('Admin/Support/Feedback/Forms');
            })->middleware(['module:platform-support,customer-feedback,feedback-forms,view'])->name('forms');
        });

        // 13.8 Multi-Channel Support
        Route::prefix('channels')->name('channels.')->group(function () {
            Route::get('/', function () {
                return Inertia::render('Admin/Support/Channels/Index');
            })->middleware(['module:platform-support,multi-channel'])->name('index');

            Route::get('/email', function () {
                return Inertia::render('Admin/Support/Channels/Email');
            })->middleware(['module:platform-support,multi-channel,email-channel,view'])->name('email');

            Route::get('/chat', function () {
                return Inertia::render('Admin/Support/Channels/Chat');
            })->middleware(['module:platform-support,multi-channel,chat-widget,view'])->name('chat');

            Route::get('/whatsapp', function () {
                return Inertia::render('Admin/Support/Channels/Whatsapp');
            })->middleware(['module:platform-support,multi-channel,whatsapp-channel,view'])->name('whatsapp');

            Route::get('/sms', function () {
                return Inertia::render('Admin/Support/Channels/Sms');
            })->middleware(['module:platform-support,multi-channel,sms-channel,view'])->name('sms');

            Route::get('/logs', function () {
                return Inertia::render('Admin/Support/Channels/Logs');
            })->middleware(['module:platform-support,multi-channel,channel-logs,view'])->name('logs');
        });

        // 13.9 Admin Tools
        Route::prefix('tools')->name('tools.')->group(function () {
            Route::get('/', function () {
                return Inertia::render('Admin/Support/Tools/Index');
            })->middleware(['module:platform-support,support-admin-tools'])->name('index');

            Route::get('/tags', function () {
                return Inertia::render('Admin/Support/Tools/Tags');
            })->middleware(['module:platform-support,support-admin-tools,ticket-tags,view'])->name('tags');

            Route::get('/fields', function () {
                return Inertia::render('Admin/Support/Tools/Fields');
            })->middleware(['module:platform-support,support-admin-tools,custom-fields,view'])->name('fields');

            Route::get('/forms', function () {
                return Inertia::render('Admin/Support/Tools/Forms');
            })->middleware(['module:platform-support,support-admin-tools,ticket-forms,view'])->name('forms');
        });
    });
});
