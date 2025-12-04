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
    // =========================================================================
    Route::get('/dashboard', function () {
        return Inertia::render('Admin/Dashboard');
    })->name('admin.dashboard');

    Route::get('/system-health', function () {
        return Inertia::render('Admin/SystemHealth');
    })->name('admin.system-health');

    // =========================================================================
    // 2. TENANT MANAGEMENT MODULE (tenants)
    // =========================================================================
    Route::middleware(['platform.super_admin'])->prefix('tenants')->name('admin.tenants.')->group(function () {
        Route::get('/', function () {
            return Inertia::render('Admin/Tenants/Index');
        })->name('index');

        Route::get('/create', function () {
            return Inertia::render('Admin/Tenants/Create');
        })->name('create');

        Route::get('/{tenant}', function ($tenant) {
            return Inertia::render('Admin/Tenants/Show', ['tenantId' => $tenant]);
        })->name('show');

        Route::get('/{tenant}/edit', function ($tenant) {
            return Inertia::render('Admin/Tenants/Edit', ['tenantId' => $tenant]);
        })->name('edit');

        // Domain Management
        Route::get('/domains', function () {
            return Inertia::render('Admin/Tenants/Domains');
        })->name('domains');

        // Database Management
        Route::get('/databases', function () {
            return Inertia::render('Admin/Tenants/Databases');
        })->name('databases');

        // Tenant Impersonation
        Route::post('/{tenant}/impersonate', [ImpersonationController::class, 'impersonate'])
            ->name('impersonate');
    });

    // =========================================================================
    // 3. USERS & AUTHENTICATION MODULE (platform-users)
    // =========================================================================
    Route::middleware(['platform.super_admin'])->prefix('users')->name('admin.users.')->group(function () {
        Route::get('/', function () {
            return Inertia::render('Admin/Users/Index');
        })->name('index');

        Route::get('/create', function () {
            return Inertia::render('Admin/Users/Create');
        })->name('create');

        Route::get('/{user}', function ($user) {
            return Inertia::render('Admin/Users/Show', ['userId' => $user]);
        })->name('show');

        Route::get('/{user}/edit', function ($user) {
            return Inertia::render('Admin/Users/Edit', ['userId' => $user]);
        })->name('edit');
    });

    // Authentication Settings
    Route::get('/authentication', function () {
        return Inertia::render('Admin/Authentication/Index');
    })->middleware(['platform.super_admin'])->name('admin.authentication');

    // Active Sessions
    Route::get('/sessions', function () {
        return Inertia::render('Admin/Sessions/Index');
    })->middleware(['platform.super_admin'])->name('admin.sessions');

    // =========================================================================
    // 4. ROLES & ACCESS CONTROL MODULE (platform-roles)
    // =========================================================================
    Route::middleware(['platform.super_admin'])->prefix('roles')->name('admin.roles.')->group(function () {
        Route::get('/', [\App\Http\Controllers\Shared\Admin\RoleController::class, 'index'])->name('index');
        Route::post('/', [\App\Http\Controllers\Shared\Admin\RoleController::class, 'storeRole'])->name('store');
        Route::put('/{id}', [\App\Http\Controllers\Shared\Admin\RoleController::class, 'updateRole'])->name('update');
        Route::delete('/{id}', [\App\Http\Controllers\Shared\Admin\RoleController::class, 'deleteRole'])->name('destroy');
        Route::patch('/{id}/permissions', [\App\Http\Controllers\Shared\Admin\RoleController::class, 'batchUpdatePermissions'])->name('permissions.batch');
        Route::post('/toggle-permission', [\App\Http\Controllers\Shared\Admin\RoleController::class, 'togglePermission'])->name('toggle-permission');
        Route::post('/update-module', [\App\Http\Controllers\Shared\Admin\RoleController::class, 'updateRoleModule'])->name('update-module');
        Route::post('/clone/{id}', [\App\Http\Controllers\Shared\Admin\RoleController::class, 'cloneRole'])->name('clone');
        Route::get('/export', [\App\Http\Controllers\Shared\Admin\RoleController::class, 'exportRoles'])->name('export');
        Route::get('/snapshot', [\App\Http\Controllers\Shared\Admin\RoleController::class, 'snapshot'])->name('snapshot');
        Route::get('/admin/modules', [ModuleController::class, 'index'])->name('modules.index');
    });

    // Modules Management (Module Access)
    Route::middleware(['platform.super_admin'])->prefix('modules')->name('admin.modules.')->group(function () {
        // Main module management page (shared controller)
        Route::get('/', [\App\Http\Controllers\Shared\Admin\ModuleController::class, 'index'])->name('index');
        Route::get('/api', [\App\Http\Controllers\Shared\Admin\ModuleController::class, 'apiIndex'])->name('api.index');

        // Module CRUD (structure management - platform admin only)
        Route::post('/', [\App\Http\Controllers\Shared\Admin\ModuleController::class, 'storeModule'])->name('store');
        Route::put('/{module}', [\App\Http\Controllers\Shared\Admin\ModuleController::class, 'updateModule'])->name('update');
        Route::delete('/{module}', [\App\Http\Controllers\Shared\Admin\ModuleController::class, 'destroyModule'])->name('destroy');

        // Sub-module CRUD
        Route::post('/{module}/sub-modules', [\App\Http\Controllers\Shared\Admin\ModuleController::class, 'storeSubModule'])->name('sub-modules.store');
        Route::put('/sub-modules/{subModule}', [\App\Http\Controllers\Shared\Admin\ModuleController::class, 'updateSubModule'])->name('sub-modules.update');
        Route::delete('/sub-modules/{subModule}', [\App\Http\Controllers\Shared\Admin\ModuleController::class, 'destroySubModule'])->name('sub-modules.destroy');

        // Component CRUD
        Route::post('/sub-modules/{subModule}/components', [\App\Http\Controllers\Shared\Admin\ModuleController::class, 'storeComponent'])->name('components.store');
        Route::put('/components/{component}', [\App\Http\Controllers\Shared\Admin\ModuleController::class, 'updateComponent'])->name('components.update');
        Route::delete('/components/{component}', [\App\Http\Controllers\Shared\Admin\ModuleController::class, 'destroyComponent'])->name('components.destroy');

        // Module access check
        Route::post('/check-access', [\App\Http\Controllers\Shared\Admin\ModuleController::class, 'checkAccess'])->name('check-access');

        // Module requirements
        Route::get('/{moduleCode}/requirements', [\App\Http\Controllers\Shared\Admin\ModuleController::class, 'getModuleRequirements'])->name('requirements');

        // Module Catalog API (for plan configuration)
        Route::get('/catalog', [\App\Http\Controllers\Admin\PlanModuleController::class, 'getModules'])->name('catalog');

        // Role Module Access Management
        Route::prefix('role-access')->name('role-access.')->group(function () {
            Route::get('/roles', [\App\Http\Controllers\Shared\Admin\ModuleController::class, 'getRolesWithAccessCounts'])->name('roles');
            Route::get('/{roleId}', [\App\Http\Controllers\Shared\Admin\ModuleController::class, 'getRoleAccess'])->name('show');
            Route::post('/{roleId}/sync', [\App\Http\Controllers\Shared\Admin\ModuleController::class, 'syncRoleAccess'])->name('sync');
            Route::post('/{roleId}/grant/{moduleId}', [\App\Http\Controllers\Shared\Admin\ModuleController::class, 'grantModuleAccess'])->name('grant');
            Route::post('/{roleId}/revoke/{moduleId}', [\App\Http\Controllers\Shared\Admin\ModuleController::class, 'revokeModuleAccess'])->name('revoke');
        });
    });

    // Permission Management (Platform Super Admin Only)
    Route::middleware(['platform.super_admin'])->prefix('permissions')->name('admin.permissions.')->group(function () {
        Route::get('/', [\App\Http\Controllers\Shared\Admin\PermissionController::class, 'index'])->name('index');
        Route::post('/', [\App\Http\Controllers\Shared\Admin\PermissionController::class, 'store'])->name('store');
        Route::get('/grouped', [\App\Http\Controllers\Shared\Admin\PermissionController::class, 'groupedByModule'])->name('grouped');
        Route::get('/{id}', [\App\Http\Controllers\Shared\Admin\PermissionController::class, 'show'])->name('show');
        Route::put('/{id}', [\App\Http\Controllers\Shared\Admin\PermissionController::class, 'update'])->name('update');
        Route::delete('/{id}', [\App\Http\Controllers\Shared\Admin\PermissionController::class, 'destroy'])->name('destroy');
        Route::post('/{id}/sync-roles', [\App\Http\Controllers\Shared\Admin\PermissionController::class, 'syncRoles'])->name('sync-roles');
    });

    // =========================================================================
    // 5. SUBSCRIPTIONS & BILLING MODULE (subscriptions)
    // =========================================================================
    // Subscription Plans
    Route::middleware(['platform.super_admin'])->prefix('plans')->name('admin.plans.')->group(function () {
        Route::get('/', function () {
            return Inertia::render('Admin/Plans/Index');
        })->name('index');

        Route::get('/create', function () {
            return Inertia::render('Admin/Plans/Create');
        })->name('create');

        // Plan-Module Management API
        Route::get('/{plan}/modules', [\App\Http\Controllers\Admin\PlanModuleController::class, 'getPlanModules'])->name('modules.index');
        Route::post('/{plan}/modules', [\App\Http\Controllers\Admin\PlanModuleController::class, 'attachModules'])->name('modules.attach');
        Route::delete('/{plan}/modules', [\App\Http\Controllers\Admin\PlanModuleController::class, 'detachModules'])->name('modules.detach');
        Route::put('/{plan}/modules/sync', [\App\Http\Controllers\Admin\PlanModuleController::class, 'syncModules'])->name('modules.sync');
        Route::put('/{plan}/modules/{module}', [\App\Http\Controllers\Admin\PlanModuleController::class, 'updateModuleConfig'])->name('modules.update');
    });

    // Plans API
    Route::get('/api/plans', [\App\Http\Controllers\Admin\PlanController::class, 'index'])->name('api.plans.index');

    // Billing & Invoices
    Route::prefix('billing')->name('admin.billing.')->group(function () {
        Route::get('/', function () {
            return Inertia::render('Admin/Billing/Index');
        })->name('index');

        // Subscriptions Overview
        Route::get('/subscriptions', function () {
            return Inertia::render('Admin/Billing/Subscriptions');
        })->name('subscriptions');

        Route::get('/invoices', function () {
            return Inertia::render('Admin/Billing/Invoices');
        })->name('invoices');

        // Tenant-specific billing management
        Route::get('/tenants/{tenant}', [\App\Http\Controllers\Landlord\BillingController::class, 'index'])->name('tenant');
        Route::post('/tenants/{tenant}/subscribe/{plan}', [\App\Http\Controllers\Landlord\BillingController::class, 'subscribe'])->name('tenant.subscribe');
        Route::post('/tenants/{tenant}/change-plan', [\App\Http\Controllers\Landlord\BillingController::class, 'changePlan'])->name('tenant.change-plan');
        Route::post('/tenants/{tenant}/cancel', [\App\Http\Controllers\Landlord\BillingController::class, 'cancel'])->name('tenant.cancel');
        Route::post('/tenants/{tenant}/resume', [\App\Http\Controllers\Landlord\BillingController::class, 'resume'])->name('tenant.resume');
        Route::post('/tenants/{tenant}/portal', [\App\Http\Controllers\Landlord\BillingController::class, 'portal'])->name('tenant.portal');
        Route::get('/tenants/{tenant}/invoices', [\App\Http\Controllers\Landlord\BillingController::class, 'invoices'])->name('tenant.invoices');
        Route::get('/tenants/{tenant}/invoices/{invoice}', [\App\Http\Controllers\Landlord\BillingController::class, 'downloadInvoice'])->name('tenant.invoice.download');
        Route::put('/tenants/{tenant}/billing-address', [\App\Http\Controllers\Landlord\BillingController::class, 'updateBillingAddress'])->name('tenant.billing-address');
    });

    // Stripe Checkout (for new subscriptions via registration flow)
    Route::post('/checkout/{plan}', [\App\Http\Controllers\Landlord\BillingController::class, 'checkout'])->name('admin.checkout');

    // =========================================================================
    // 6. NOTIFICATIONS MODULE (notifications)
    // =========================================================================
    Route::middleware(['platform.super_admin'])->prefix('notifications')->name('admin.notifications.')->group(function () {
        // Notification Channels
        Route::get('/channels', function () {
            return Inertia::render('Admin/Notifications/Channels');
        })->name('channels');

        // Notification Templates
        Route::get('/templates', function () {
            return Inertia::render('Admin/Notifications/Templates');
        })->name('templates');

        // Broadcasts
        Route::get('/broadcasts', function () {
            return Inertia::render('Admin/Notifications/Broadcasts');
        })->name('broadcasts');
    });

    // =========================================================================
    // 7. FILE MANAGER MODULE (file-manager)
    // =========================================================================
    Route::middleware(['platform.super_admin'])->prefix('files')->name('admin.files.')->group(function () {
        // Storage Management
        Route::get('/storage', function () {
            return Inertia::render('Admin/Files/Storage');
        })->name('storage');

        // Storage Quotas
        Route::get('/quotas', function () {
            return Inertia::render('Admin/Files/Quotas');
        })->name('quotas');

        // Media Library
        Route::get('/media', function () {
            return Inertia::render('Admin/Files/Media');
        })->name('media');
    });

    // =========================================================================
    // 8. AUDIT & ACTIVITY LOGS MODULE (audit-logs)
    // =========================================================================
    Route::middleware(['platform.super_admin'])->prefix('logs')->name('admin.logs.')->group(function () {
        // Activity Logs
        Route::get('/activity', function () {
            return Inertia::render('Admin/Logs/Activity');
        })->name('activity');

        // Security Logs
        Route::get('/security', function () {
            return Inertia::render('Admin/Logs/Security');
        })->name('security');

        // System Logs
        Route::get('/system', function () {
            return Inertia::render('Admin/Logs/System');
        })->name('system');
    });

    // Legacy Audit Logs routes (for backward compatibility)
    Route::prefix('audit-logs')->name('admin.audit-logs.')->group(function () {
        Route::get('/', [\App\Http\Controllers\AuditLogController::class, 'index'])->name('index');
        Route::get('/export', [\App\Http\Controllers\AuditLogController::class, 'export'])->name('export');
        Route::get('/statistics', [\App\Http\Controllers\AuditLogController::class, 'statistics'])->name('statistics');
        Route::get('/{activity}', [\App\Http\Controllers\AuditLogController::class, 'show'])->name('show');
    });

    // =========================================================================
    // 9. SYSTEM SETTINGS MODULE (system-settings)
    // =========================================================================
    Route::middleware(['platform.super_admin'])->prefix('settings')->name('admin.settings.')->group(function () {
        // General Settings
        Route::get('/', function () {
            return Inertia::render('Admin/Settings/Index');
        })->name('index');

        // Branding Settings
        Route::get('/branding', function () {
            return Inertia::render('Admin/Settings/Branding');
        })->name('branding');

        // Localization Settings
        Route::get('/localization', function () {
            return Inertia::render('Admin/Settings/Localization');
        })->name('localization');

        // Email Settings
        Route::get('/email', function () {
            return Inertia::render('Admin/Settings/Email');
        })->name('email');

        // Integrations
        Route::get('/integrations', function () {
            return Inertia::render('Admin/Settings/Integrations');
        })->name('integrations');

        // Payment Gateways
        Route::get('/payment-gateways', function () {
            return Inertia::render('Admin/Settings/PaymentGateways');
        })->name('payment-gateways');

        // Platform Settings API
        Route::get('/platform', [PlatformSettingController::class, 'index'])->name('platform.index');
        Route::put('/platform', [PlatformSettingController::class, 'update'])->name('platform.update');
        Route::post('/platform', [PlatformSettingController::class, 'update'])->name('platform.store');
        Route::post('/platform/test-email', [PlatformSettingController::class, 'sendTestEmail'])->name('platform.test-email');
        Route::post('/platform/test-sms', [PlatformSettingController::class, 'sendTestSms'])->name('platform.test-sms');

        // System Maintenance
        Route::get('/maintenance', [MaintenanceController::class, 'index'])->name('maintenance.index');
        Route::put('/maintenance', [MaintenanceController::class, 'update'])->name('maintenance.update');
        Route::post('/maintenance/toggle', [MaintenanceController::class, 'toggle'])->name('maintenance.toggle');
    });

    // =========================================================================
    // 10. DEVELOPER TOOLS MODULE (developer-tools)
    // =========================================================================
    Route::middleware(['platform.super_admin'])->prefix('developer')->name('admin.developer.')->group(function () {
        // API Management
        Route::get('/api', function () {
            return Inertia::render('Admin/Developer/Api');
        })->name('api');

        // Webhooks
        Route::get('/webhooks', function () {
            return Inertia::render('Admin/Developer/Webhooks');
        })->name('webhooks');

        // Debug Tools
        Route::get('/debug', function () {
            return Inertia::render('Admin/Developer/Debug');
        })->name('debug');

        // Queue Management
        Route::get('/queues', function () {
            return Inertia::render('Admin/Developer/Queues');
        })->name('queues');

        // Cache Management
        Route::get('/cache', function () {
            return Inertia::render('Admin/Developer/Cache');
        })->name('cache');

        // Maintenance Mode
        Route::get('/maintenance', function () {
            return Inertia::render('Admin/Developer/Maintenance');
        })->name('maintenance');
    });

    // =========================================================================
    // ANALYTICS & REPORTS (Quick Access)
    // =========================================================================
    Route::prefix('analytics')->name('admin.analytics.')->group(function () {
        Route::get('/', function () {
            return Inertia::render('Admin/Analytics/Index');
        })->name('index');

        Route::get('/revenue', function () {
            return Inertia::render('Admin/Analytics/Revenue');
        })->name('revenue');

        Route::get('/usage', function () {
            return Inertia::render('Admin/Analytics/Usage');
        })->name('usage');

        // Module Analytics API
        Route::get('/modules', [\App\Http\Controllers\Admin\ModuleAnalyticsController::class, 'index'])->name('modules.index');
        Route::get('/modules/{module}', [\App\Http\Controllers\Admin\ModuleAnalyticsController::class, 'show'])->name('modules.show');
        Route::get('/modules-trends', [\App\Http\Controllers\Admin\ModuleAnalyticsController::class, 'trends'])->name('modules.trends');
    });

    // =========================================================================
    // SUPPORT & TICKETS (Quick Access)
    // =========================================================================
    Route::prefix('support')->name('admin.support.')->group(function () {
        Route::get('/', function () {
            return Inertia::render('Admin/Support/Index');
        })->name('index');

        Route::get('/{ticket}', function ($ticket) {
            return Inertia::render('Admin/Support/Show', ['ticketId' => $ticket]);
        })->name('show');
    });
});
