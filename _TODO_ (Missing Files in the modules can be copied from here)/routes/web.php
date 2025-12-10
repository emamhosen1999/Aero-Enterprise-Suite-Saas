<?php

use Aero\Platform\Http\Controllers\SystemMonitoring\SystemMonitoringController;
use App\Http\Controllers\EmailController;
use App\Http\Controllers\Settings\CustomDomainController;
use App\Http\Controllers\Settings\SystemSettingController;
use App\Http\Controllers\Shared\Auth\DeviceController;
use App\Http\Controllers\Shared\Auth\UserController;
use App\Http\Controllers\Shared\Notification\EmailController;
use App\Http\Controllers\Shared\Platform\ModuleController;
use App\Http\Controllers\Shared\Platform\RoleController;
use App\Http\Controllers\TaskController;
use App\Http\Controllers\Tenant\Dashboard\DashboardController;
use App\Http\Controllers\Tenant\FMS\FMSController;
use App\Http\Controllers\Tenant\IMS\IMSController;
use App\Http\Controllers\Tenant\POS\POSController;
use Illuminate\Support\Facades\Route;

// NOTE: Authentication routes are NOT included here.
// - For central/platform domains: auth routes are loaded via routes/platform.php
// - For tenant domains: auth routes are loaded via routes/tenant.php with tenancy middleware
// This prevents route conflicts and ensures proper database context.

// Note: The landing page route '/' is defined in routes/platform.php
// This ensures it's loaded with the proper domain context middleware

// =========================================================================
// PUBLIC CAREER PAGES
// =========================================================================
Route::prefix('careers')->name('careers.')->group(function () {
    Route::get('/', [\App\Http\Controllers\Public\CareersController::class, 'index'])->name('index');
    Route::get('/{id}', [\App\Http\Controllers\Public\CareersController::class, 'show'])->name('show');
    Route::get('/{id}/apply', [\App\Http\Controllers\Public\CareersController::class, 'apply'])->name('apply');
    Route::post('/{id}/apply', [\App\Http\Controllers\Public\CareersController::class, 'submit'])->name('submit');
});

Route::get('/session-check', function () {
    return response()->json(['authenticated' => auth()->check()]);
});

Route::get('/csrf-token', function () {
    return response()->json(['csrf_token' => csrf_token()]);
});

// Locale switching route (for dynamic translations) - client-side only, no server redirect
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

    // Return empty response - locale is handled client-side
    return response()->noContent();
})->name('locale.update');

// Team Invitation Acceptance Routes (public - no auth required)
// These routes use token-based security - the token is a secure UUID validated in the controller
Route::prefix('invitation')->group(function () {
    Route::get('/{token}', [\App\Http\Controllers\TeamMemberController::class, 'showAcceptForm'])
        ->name('team.invitation.accept');

    Route::post('/{token}', [\App\Http\Controllers\TeamMemberController::class, 'accept'])
        ->name('team.invitation.process');
});

// Device authentication is now handled globally via DeviceAuthMiddleware
// No need to apply it here - it runs on all requests automatically
$middlewareStack = ['auth', 'verified', 'require_tenant_onboarding'];

Route::middleware($middlewareStack)->group(function () {

    // =========================================================================
    // TENANT ONBOARDING WIZARD
    // =========================================================================
    // Multi-step setup wizard for new tenants (first-time login)
    Route::prefix('onboarding')->name('onboarding.')->withoutMiddleware('require_tenant_onboarding')->group(function () {
        Route::get('/', [\App\Http\Controllers\Tenant\TenantOnboardingController::class, 'index'])->name('index');
        Route::post('/company', [\App\Http\Controllers\Tenant\TenantOnboardingController::class, 'saveCompany'])->name('company');
        Route::post('/branding', [\App\Http\Controllers\Tenant\TenantOnboardingController::class, 'saveBranding'])->name('branding');
        Route::post('/team', [\App\Http\Controllers\Tenant\TenantOnboardingController::class, 'saveTeam'])->name('team');
        Route::post('/modules', [\App\Http\Controllers\Tenant\TenantOnboardingController::class, 'saveModules'])->name('modules');
        Route::post('/complete', [\App\Http\Controllers\Tenant\TenantOnboardingController::class, 'complete'])->name('complete');
        Route::post('/skip', [\App\Http\Controllers\Tenant\TenantOnboardingController::class, 'skip'])->name('skip');
        Route::post('/step', [\App\Http\Controllers\Tenant\TenantOnboardingController::class, 'updateStep'])->name('step');
    });

    // =========================================================================
    // SUBSCRIPTION MANAGEMENT (TENANT-FACING)
    // =========================================================================
    // Self-service subscription, billing, and usage management for tenants
    Route::prefix('subscription')->name('tenant.subscription.')->group(function () {
        Route::get('/', [\App\Http\Controllers\Tenant\SubscriptionController::class, 'index'])->name('index');
        Route::get('/plans', [\App\Http\Controllers\Tenant\SubscriptionController::class, 'plans'])->name('plans');
        Route::post('/change-plan', [\App\Http\Controllers\Tenant\SubscriptionController::class, 'changePlan'])->name('change-plan');
        Route::post('/cancel', [\App\Http\Controllers\Tenant\SubscriptionController::class, 'cancel'])->name('cancel');
        Route::post('/resume', [\App\Http\Controllers\Tenant\SubscriptionController::class, 'resume'])->name('resume');
        Route::get('/usage', [\App\Http\Controllers\Tenant\SubscriptionController::class, 'usage'])->name('usage');
        Route::get('/invoices', [\App\Http\Controllers\Tenant\SubscriptionController::class, 'invoices'])->name('invoices');
        Route::get('/invoices/{invoice}/download', [\App\Http\Controllers\Tenant\SubscriptionController::class, 'downloadInvoice'])->name('invoices.download');
    });

    // Dashboard routes - require dashboard permission
    Route::middleware(['module:core,dashboard'])->group(function () {
        Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');

    });

    // Security Dashboard route - available to authenticated users
    Route::get('/security/dashboard', function () {
        return inertia('Security/Dashboard');
    })->name('security.dashboard');

    // Module Hierarchy Demo - accessible to authenticated users
    Route::get('/administration/module-hierarchy', function () {
        return inertia('Tenant/Pages/Administration/ModuleHierarchyDemo');
    })->name('administration.module-hierarchy');

    // Updates route - require updates permission
    Route::middleware(['module:core,updates'])->get('/updates', [DashboardController::class, 'updates'])->name('updates');

    // Communications routes
    Route::middleware(['module:core,communications'])->get('/emails', [EmailController::class, 'index'])->name('emails');

    // NOTE: Leave summary route moved to HRM module (aero-hrm/routes/tenant.php)
});

// Administrative routes - require specific permissions
Route::middleware(['auth', 'verified'])->group(function () {

    // User management routes - CONSOLIDATED & REFACTORED
    Route::middleware(['module:core,user-management'])->group(function () {
        Route::get('/users', [UserController::class, 'index'])->name('users');
        Route::get('/users/paginate', [UserController::class, 'paginate'])->name('users.paginate');
        Route::get('/users/stats', [UserController::class, 'stats'])->name('users.stats');

        // Profile search for admin usage
        // NOTE: ProfileController references moved to HRM module
    });

    Route::middleware(['module:core,user-management,user-list,create'])->group(function () {
        Route::post('/users', [UserController::class, 'store'])
            ->middleware(['precognitive'])
            ->name('users.store');
        // NOTE: Legacy ProfileController route moved to HRM module
    });

    Route::middleware(['module:core,user-management,user-list,update'])->group(function () {
        Route::put('/users/{id}', [UserController::class, 'update'])
            ->middleware(['precognitive'])
            ->name('users.update');
        Route::put('/users/{id}/toggle-status', [UserController::class, 'toggleStatus'])->name('users.toggleStatus');
        Route::post('/users/{id}/roles', [UserController::class, 'updateUserRole'])->name('users.updateRole');
        // NOTE: Employee-specific routes (attendance-type, report-to) moved to HRM module
    });

    Route::middleware(['module:core,user-management,user-list,delete'])->group(function () {
        Route::delete('/users/{id}', [UserController::class, 'destroy'])->name('users.destroy');
        // NOTE: Legacy EmployeeController routes moved to HRM module
    });

    // SECURE DEVICE MANAGEMENT ROUTES (NEW SYSTEM)
    // User's own devices
    Route::get('/my-devices', [DeviceController::class, 'index'])->name('user.devices');
    Route::delete('/my-devices/{deviceId}', [DeviceController::class, 'deactivateDevice'])->name('user.devices.deactivate');

    // Admin device management
    Route::middleware(['module:core,user-management'])->group(function () {
        Route::get('/users/{userId}/devices', [DeviceController::class, 'getUserDevices'])->name('admin.users.devices');
    });

    Route::middleware(['module:core,user-management,user-list,update'])->group(function () {
        Route::post('/users/{userId}/devices/reset', [DeviceController::class, 'resetDevices'])->name('admin.users.devices.reset');
        Route::post('/users/{userId}/devices/toggle', [DeviceController::class, 'toggleSingleDeviceLogin'])->name('admin.users.devices.toggle');
        Route::delete('/users/{userId}/devices/{deviceId}', [DeviceController::class, 'adminDeactivateDevice'])->name('admin.users.devices.deactivate');
    });

    // System settings routes (tenant)
    Route::middleware(['module:core,settings,company-settings'])->group(function () {
        Route::get('/settings/system', [SystemSettingController::class, 'index'])->name('settings.system.index');
        Route::put('/settings/system', [SystemSettingController::class, 'update'])->name('settings.system.update');
        Route::post('/settings/system/test-email', [SystemSettingController::class, 'sendTestEmail'])->name('settings.system.test-email');
        Route::post('/settings/system/test-sms', [SystemSettingController::class, 'sendTestSms'])->name('settings.system.test-sms');

        // Legacy aliases for backward compatibility
        Route::get('/company-settings', [SystemSettingController::class, 'index'])->name('admin.settings.company');
        Route::put('/update-company-settings', [SystemSettingController::class, 'update'])->name('update-company-settings');

        // Domain management routes
        Route::get('/settings/domains', [CustomDomainController::class, 'index'])->name('settings.domains.index');
        Route::post('/settings/domains', [CustomDomainController::class, 'store'])->name('settings.domains.store');
        Route::post('/settings/domains/{domain}/verify', [CustomDomainController::class, 'verify'])->name('settings.domains.verify');
        Route::post('/settings/domains/{domain}/set-primary', [CustomDomainController::class, 'setPrimary'])->name('settings.domains.set-primary');
        Route::delete('/settings/domains/{domain}', [CustomDomainController::class, 'destroy'])->name('settings.domains.destroy');

        // Usage & Billing routes
        Route::prefix('settings/usage')->name('settings.usage.')->group(function () {
            Route::get('/', [\Aero\Platform\Http\Controllers\SystemMonitoring\UsageController::class, 'index'])->name('index');
            Route::get('/summary', [\Aero\Platform\Http\Controllers\SystemMonitoring\UsageController::class, 'summary'])->name('summary');
            Route::get('/trend/{metric}', [\Aero\Platform\Http\Controllers\SystemMonitoring\UsageController::class, 'trend'])->name('trend');
            Route::get('/limits', [\Aero\Platform\Http\Controllers\SystemMonitoring\UsageController::class, 'limits'])->name('limits');
            Route::get('/check/{metric}', [\Aero\Platform\Http\Controllers\SystemMonitoring\UsageController::class, 'checkLimit'])->name('check');
        });
    });    // Legacy role routes (maintained for backward compatibility)
    Route::middleware(['module:core,roles-permissions'])->get('/roles-permissions', [RoleController::class, 'getRolesAndPermissions'])->name('roles-settings');

    // User Invitation Routes (integrated with User Management)
    Route::prefix('users')->group(function () {
        Route::post('/invite', [UserController::class, 'sendInvitation'])->name('users.invite');
        Route::get('/invitations/pending', [UserController::class, 'pendingInvitations'])->name('users.invitations.pending');
        Route::post('/invitations/{invitation}/resend', [UserController::class, 'resendInvitation'])->name('users.invitations.resend');
        Route::delete('/invitations/{invitation}', [UserController::class, 'cancelInvitation'])->name('users.invitations.cancel');
    });

    // Task management routes
    Route::middleware(['module:project-management,tasks'])->group(function () {
        Route::get('/tasks-all', [TaskController::class, 'allTasks'])->name('allTasks');
        Route::post('/tasks-filtered', [TaskController::class, 'filterTasks'])->name('filterTasks');
    });

    Route::middleware(['module:project-management,tasks,task-list,create'])->post('/task/add', [TaskController::class, 'addTask'])->name('addTask');

});

// Enhanced Role Management Routes (with proper module-based access control)
Route::middleware(['auth', 'verified', 'module:core,roles-permissions', 'role_permission_sync'])->group(function () {
    // Role Management Interface
    Route::get('/admin/roles-management', [RoleController::class, 'index'])->name('admin.roles-management');
    Route::get('/admin/roles/audit', [RoleController::class, 'getEnhancedRoleAudit'])->name('admin.roles.audit');
    Route::get('/admin/roles/export', [RoleController::class, 'exportRoles'])->name('admin.roles.export');
    Route::get('/admin/roles/metrics', [RoleController::class, 'getRoleMetrics'])->name('admin.roles.metrics');
    Route::get('/admin/roles/snapshot', [RoleController::class, 'snapshot'])->name('admin.roles.snapshot');
});

Route::middleware(['auth', 'verified', 'module:core,roles-permissions,role-list,create'])->group(function () {
    Route::post('/admin/roles', [RoleController::class, 'storeRole'])->name('admin.roles.store');
    Route::post('/admin/roles/clone', [RoleController::class, 'cloneRole'])->name('admin.roles.clone');
});

Route::middleware(['auth', 'verified', 'module:core,roles-permissions,role-list,update'])->group(function () {
    Route::put('/admin/roles/{id}', [RoleController::class, 'updateRole'])->name('admin.roles.update');
    Route::post('/admin/roles/update-permission', [RoleController::class, 'updateRolePermission'])->name('admin.roles.update-permission');
    Route::post('/admin/roles/toggle-permission', [RoleController::class, 'togglePermission'])->name('admin.roles.toggle-permission');
    Route::post('/admin/roles/update-module', [RoleController::class, 'updateRoleModule'])->name('admin.roles.update-module');
    Route::post('/admin/roles/bulk-operation', [RoleController::class, 'bulkOperation'])->name('admin.roles.bulk-operation');
    Route::patch('/admin/roles/{role}/permissions', [RoleController::class, 'batchUpdatePermissions'])->name('admin.roles.batch-permissions');
});

Route::middleware(['auth', 'verified', 'module:core,roles-permissions,role-list,delete'])->group(function () {
    Route::delete('/admin/roles/{id}', [RoleController::class, 'deleteRole'])->name('admin.roles.delete');
});

// Super Administrator only routes
Route::middleware(['auth', 'verified', 'role:Super Administrator'])->group(function () {
    Route::post('/admin/roles/initialize-enterprise', [RoleController::class, 'initializeEnterpriseSystem'])->name('admin.roles.initialize-enterprise');
});

// Test route for role controller
Route::middleware(['auth', 'verified'])->get('/admin/roles-test', [RoleController::class, 'test'])->name('admin.roles.test');

// Module Permission Registry Management Routes (Tenant Super Admin Only)
Route::middleware(['auth', 'verified', 'tenant.super_admin'])->group(function () {
    // View operations
    Route::get('/admin/modules', [ModuleController::class, 'index'])->name('modules.index');
    Route::get('/admin/modules/api', [ModuleController::class, 'apiIndex'])->name('modules.api.index');
    Route::post('/admin/modules/check-access', [ModuleController::class, 'checkAccess'])->name('modules.check-access');
    Route::get('/admin/modules/{moduleCode}/requirements', [ModuleController::class, 'getModuleRequirements'])->name('modules.requirements');

    // Permission sync operations (tenant context only - permission requirements are per-tenant)
    Route::post('/admin/modules/{module}/sync-permissions', [ModuleController::class, 'syncModulePermissions'])->name('modules.sync-permissions');
    Route::post('/admin/modules/sub-modules/{subModule}/sync-permissions', [ModuleController::class, 'syncSubModulePermissions'])->name('modules.sub-modules.sync-permissions');
    Route::post('/admin/modules/components/{component}/sync-permissions', [ModuleController::class, 'syncComponentPermissions'])->name('modules.components.sync-permissions');
});

// System Monitoring Routes (Super Administrator only)
Route::middleware(['auth', 'verified', 'role:Super Administrator'])->group(function () {
    Route::get('/admin/system-monitoring', [SystemMonitoringController::class, 'index'])->name('admin.system-monitoring');
    Route::post('/admin/errors/{errorId}/resolve', [SystemMonitoringController::class, 'resolveError'])->name('admin.errors.resolve');
    Route::get('/admin/system-report', [SystemMonitoringController::class, 'exportReport'])->name('admin.system-report');
    Route::get('/admin/optimization-report', [SystemMonitoringController::class, 'getOptimizationReport'])->name('admin.optimization-report');
    // CRM Module routes
    Route::middleware(['module:crm'])->prefix('crm')->group(function () {
        Route::get('/', [App\Http\Controllers\Tenant\CRM\CRMController::class, 'index'])->name('crm.index');
        Route::get('/leads', [App\Http\Controllers\Tenant\CRM\CRMController::class, 'leads'])->name('crm.leads');
        Route::post('/leads', [App\Http\Controllers\Tenant\CRM\CRMController::class, 'storeLeads'])->name('crm.leads.store')->middleware('module:crm,leads,lead-list,create');
        Route::get('/customers', [App\Http\Controllers\Tenant\CRM\CRMController::class, 'customers'])->name('crm.customers')->middleware('module:crm,customers');
        Route::get('/opportunities', [App\Http\Controllers\Tenant\CRM\CRMController::class, 'opportunities'])->name('crm.opportunities')->middleware('module:crm,opportunities');
        Route::get('/reports', [App\Http\Controllers\Tenant\CRM\CRMController::class, 'reports'])->name('crm.reports')->middleware('module:crm,reports');
        Route::get('/settings', [App\Http\Controllers\Tenant\CRM\CRMController::class, 'settings'])->name('crm.settings')->middleware('module:crm,settings');

        // Kanban Pipeline routes
        Route::middleware(['module:crm,sales-pipeline'])->prefix('pipeline')->group(function () {
            Route::get('/', [App\Http\Controllers\Tenant\CRM\PipelineController::class, 'index'])->name('crm.pipeline');
            Route::get('/{pipeline}/data', [App\Http\Controllers\Tenant\CRM\PipelineController::class, 'getData'])->name('crm.pipeline.data');
        });

        // Deal routes
        Route::middleware(['module:crm,deals'])->prefix('deals')->group(function () {
            Route::post('/', [App\Http\Controllers\Tenant\CRM\DealController::class, 'store'])->name('crm.deals.store');
            Route::post('/{deal}/move', [App\Http\Controllers\Tenant\CRM\DealController::class, 'move'])->name('crm.deals.move');
            Route::put('/{deal}', [App\Http\Controllers\Tenant\CRM\DealController::class, 'update'])->name('crm.deals.update');
            Route::post('/{deal}/won', [App\Http\Controllers\Tenant\CRM\DealController::class, 'markAsWon'])->name('crm.deals.won');
            Route::post('/{deal}/lost', [App\Http\Controllers\Tenant\CRM\DealController::class, 'markAsLost'])->name('crm.deals.lost');
            Route::post('/{deal}/reopen', [App\Http\Controllers\Tenant\CRM\DealController::class, 'reopen'])->name('crm.deals.reopen');
            Route::delete('/{deal}', [App\Http\Controllers\Tenant\CRM\DealController::class, 'destroy'])->name('crm.deals.destroy');
        });
    });

    // FMS Module routes
    Route::middleware(['module:finance'])->prefix('fms')->group(function () {
        Route::get('/', [FMSController::class, 'index'])->name('fms.index');

        // Accounts Payable
        Route::get('/accounts-payable', [FMSController::class, 'accountsPayable'])->name('fms.accounts-payable')->middleware('module:finance,accounts-payable');
        Route::post('/accounts-payable', [FMSController::class, 'storeAccountsPayable'])->name('fms.accounts-payable.store')->middleware('module:finance,accounts-payable,payable-list,create');

        // Accounts Receivable
        Route::get('/accounts-receivable', [FMSController::class, 'accountsReceivable'])->name('fms.accounts-receivable')->middleware('module:finance,accounts-receivable');
        Route::post('/accounts-receivable', [FMSController::class, 'storeAccountsReceivable'])->name('fms.accounts-receivable.store')->middleware('module:finance,accounts-receivable,receivable-list,create');

        // General Ledger
        Route::get('/general-ledger', [FMSController::class, 'generalLedger'])->name('fms.general-ledger')->middleware('module:finance,general-ledger');
        Route::post('/general-ledger', [FMSController::class, 'storeLedgerEntry'])->name('fms.general-ledger.store')->middleware('module:finance,general-ledger,ledger-entry,create');

        // Reports
        Route::get('/reports', [FMSController::class, 'reports'])->name('fms.reports')->middleware('module:finance,reports');
        Route::post('/reports/generate', [FMSController::class, 'generateReport'])->name('fms.reports.generate')->middleware('module:finance,reports,report-list,create');

        // Budgets
        Route::get('/budgets', [FMSController::class, 'budgets'])->name('fms.budgets')->middleware('module:finance,budgeting');
        Route::post('/budgets', [FMSController::class, 'storeBudget'])->name('fms.budgets.store')->middleware('module:finance,budgeting,budget-list,create');

        // Expenses
        Route::get('/expenses', [FMSController::class, 'expenses'])->name('fms.expenses')->middleware('module:finance,expense-management');
        Route::post('/expenses', [FMSController::class, 'storeExpense'])->name('fms.expenses.store')->middleware('module:finance,expense-management,expense-list,create');

        // Invoices
        Route::get('/invoices', [FMSController::class, 'invoices'])->name('fms.invoices')->middleware('module:finance,invoicing');
        Route::post('/invoices', [FMSController::class, 'storeInvoice'])->name('fms.invoices.store')->middleware('module:finance,invoicing,invoice-list,create');

        // Settings
        Route::get('/settings', [FMSController::class, 'settings'])->name('fms.settings')->middleware('module:finance,settings');
        Route::put('/settings', [FMSController::class, 'updateSettings'])->name('fms.settings.update')->middleware('module:finance,settings,setting-list,update');
    });

    // POS Module routes
    Route::middleware(['module:ecommerce,point-of-sale'])->prefix('pos')->group(function () {
        Route::get('/', [POSController::class, 'index'])->name('pos.index');

        // POS Terminal
        Route::get('/terminal', [POSController::class, 'terminal'])->name('pos.terminal')->middleware('module:ecommerce,point-of-sale,pos-terminal');

        // Sales Management
        Route::get('/sales', [POSController::class, 'sales'])->name('pos.sales')->middleware('module:ecommerce,point-of-sale');
        Route::post('/sales/process', [POSController::class, 'processSale'])->name('pos.sales.process')->middleware('module:ecommerce,point-of-sale,pos-terminal,process');

        // Product Management
        Route::get('/products', [POSController::class, 'products'])->name('pos.products')->middleware('module:ecommerce,point-of-sale');
        Route::get('/products/barcode/{barcode}', [POSController::class, 'getProductByBarcode'])->name('pos.products.barcode')->middleware('module:ecommerce,point-of-sale');

        // Customer Management
        Route::get('/customers', [POSController::class, 'customers'])->name('pos.customers')->middleware('module:ecommerce,point-of-sale');

        // Payment Management
        Route::get('/payments', [POSController::class, 'payments'])->name('pos.payments')->middleware('module:ecommerce,point-of-sale');

        // Reports
        Route::get('/reports', [POSController::class, 'reports'])->name('pos.reports')->middleware('module:ecommerce,point-of-sale');

        // Settings
        Route::get('/settings', [POSController::class, 'settings'])->name('pos.settings')->middleware('module:ecommerce,point-of-sale,pos-settings');
        Route::put('/settings', [POSController::class, 'updateSettings'])->name('pos.settings.update')->middleware('module:ecommerce,point-of-sale,pos-settings,setting-list,update');
    });

    // IMS Module routes (Inventory Management System)
    Route::middleware(['module:inventory'])->prefix('ims')->group(function () {
        Route::get('/', [IMSController::class, 'index'])->name('ims.index');

        // Products Management
        Route::get('/products', [IMSController::class, 'products'])->name('ims.products')->middleware('module:inventory,products');
        Route::post('/products', [IMSController::class, 'storeProduct'])->name('ims.products.store')->middleware('module:inventory,products,product-list,create');

        // Warehouse Management
        Route::get('/warehouse', [IMSController::class, 'warehouse'])->name('ims.warehouse')->middleware('module:inventory,warehouses');
        Route::post('/warehouse', [IMSController::class, 'storeWarehouse'])->name('ims.warehouse.store')->middleware('module:inventory,warehouses,warehouse-list,create');

        // Stock Movements
        Route::get('/stock-movements', [IMSController::class, 'stockMovements'])->name('ims.stock-movements')->middleware('module:inventory,stock-movements');
        Route::post('/stock-movements', [IMSController::class, 'createMovement'])->name('ims.stock-movements.store')->middleware('module:inventory,stock-movements,movement-list,create');

        // Suppliers
        Route::get('/suppliers', [IMSController::class, 'suppliers'])->name('ims.suppliers')->middleware('module:inventory,suppliers');
        Route::post('/suppliers', [IMSController::class, 'storeSupplier'])->name('ims.suppliers.store')->middleware('module:inventory,suppliers,supplier-list,create');

        // Purchase Orders
        Route::get('/purchase-orders', [IMSController::class, 'purchaseOrders'])->name('ims.purchase-orders')->middleware('module:inventory,purchase-orders');
        Route::post('/purchase-orders', [IMSController::class, 'storePurchaseOrder'])->name('ims.purchase-orders.store')->middleware('module:inventory,purchase-orders,order-list,create');

        // Reports
        Route::get('/reports', [IMSController::class, 'reports'])->name('ims.reports')->middleware('module:inventory,reports');

        // Settings
        Route::get('/settings', [IMSController::class, 'settings'])->name('ims.settings')->middleware('module:inventory,settings');
        Route::put('/settings', [IMSController::class, 'updateSettings'])->name('ims.settings.update')->middleware('module:inventory,settings,setting-list,update');
    });

});

// API routes for dropdown data
Route::middleware(['auth', 'verified'])->group(function () {

    Route::get('/api/users/managers/list', function () {
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

Route::post('/update-fcm-token', [UserController::class, 'updateFcmToken'])->name('updateFcmToken');

// Service worker route for development
Route::get('/service-worker.js', function () {
    $filePath = public_path('service-worker.js');
    if (file_exists($filePath)) {
        return response()->file($filePath, [
            'Content-Type' => 'application/javascript',
            'Service-Worker-Allowed' => '/',
        ]);
    }
    abort(404);
})->name('service-worker');

// NOTE: Test route for employee deletion removed - HRM module handles its own testing

// Event Management Public Routes (no authentication required)
Route::prefix('events')->group(function () {
    Route::get('/', [\App\Http\Controllers\PublicEventController::class, 'index'])->name('public.events.index');
    Route::get('/{slug}', [\App\Http\Controllers\PublicEventController::class, 'show'])->name('public.events.show');
    Route::post('/{slug}/register', [\App\Http\Controllers\PublicEventController::class, 'register'])->name('public.events.register');
    Route::get('/{slug}/registration-success/{token}', [\App\Http\Controllers\PublicEventController::class, 'registrationSuccess'])->name('public.events.registration-success');
    Route::get('/check-registration', [\App\Http\Controllers\PublicEventController::class, 'checkRegistration'])->name('public.events.check-registration');
    Route::get('/token/{token}/download', [\App\Http\Controllers\PublicEventController::class, 'downloadToken'])->name('public.events.download-token');
});

// Event Management Admin Routes (require authentication and permissions)
Route::middleware(['auth', 'verified'])->prefix('admin/events')->group(function () {
    // Create route must come before {event} routes to avoid matching "create" as an event ID
    Route::middleware(['module:event-management,events,event-list,create'])->group(function () {
        Route::get('/create', [\App\Http\Controllers\EventController::class, 'create'])->name('events.create');
        Route::post('/', [\App\Http\Controllers\EventController::class, 'store'])->name('events.store');
    });

    // Event CRUD - View routes
    Route::middleware(['module:event-management,events'])->group(function () {
        Route::get('/', [\App\Http\Controllers\EventController::class, 'index'])->name('events.index');
        Route::get('/{event}/analytics', [\App\Http\Controllers\EventController::class, 'analytics'])->name('events.analytics');
        Route::get('/{event}', [\App\Http\Controllers\EventController::class, 'show'])->name('events.show');
    });

    Route::middleware(['module:event-management,events,event-list,create'])->group(function () {
        Route::post('/{event}/duplicate', [\App\Http\Controllers\EventController::class, 'duplicate'])->name('events.duplicate');
    });

    Route::middleware(['module:event-management,events,event-list,update'])->group(function () {
        Route::get('/{event}/edit', [\App\Http\Controllers\EventController::class, 'edit'])->name('events.edit');
        Route::put('/{event}', [\App\Http\Controllers\EventController::class, 'update'])->name('events.update');
        Route::post('/{event}/toggle-publish', [\App\Http\Controllers\EventController::class, 'togglePublish'])->name('events.toggle-publish');
    });

    Route::middleware(['module:event-management,events,event-list,delete'])->group(function () {
        Route::delete('/{event}', [\App\Http\Controllers\EventController::class, 'destroy'])->name('events.destroy');
    });

    // Sub-Events Management
    Route::middleware(['module:event-management,events,event-list,update'])->group(function () {
        Route::post('/{event}/sub-events', [\App\Http\Controllers\SubEventController::class, 'store'])->name('sub-events.store');
        Route::put('/{event}/sub-events/{subEvent}', [\App\Http\Controllers\SubEventController::class, 'update'])->name('sub-events.update');
        Route::delete('/{event}/sub-events/{subEvent}', [\App\Http\Controllers\SubEventController::class, 'destroy'])->name('sub-events.destroy');
        Route::post('/{event}/sub-events/reorder', [\App\Http\Controllers\SubEventController::class, 'reorder'])->name('sub-events.reorder');
        Route::post('/{event}/sub-events/{subEvent}/toggle-active', [\App\Http\Controllers\SubEventController::class, 'toggleActive'])->name('sub-events.toggle-active');
    });

    // Registration Management
    Route::middleware(['module:event-management,registrations'])->group(function () {
        Route::get('/{event}/registrations', [\App\Http\Controllers\EventRegistrationController::class, 'index'])->name('events.registrations.index');
        Route::get('/{event}/registrations/{registration}', [\App\Http\Controllers\EventRegistrationController::class, 'show'])->name('events.registrations.show');
        Route::post('/{event}/registrations/{registration}/approve', [\App\Http\Controllers\EventRegistrationController::class, 'approve'])->name('events.registrations.approve');
        Route::post('/{event}/registrations/{registration}/reject', [\App\Http\Controllers\EventRegistrationController::class, 'reject'])->name('events.registrations.reject');
        Route::post('/{event}/registrations/{registration}/cancel', [\App\Http\Controllers\EventRegistrationController::class, 'cancel'])->name('events.registrations.cancel');
        Route::post('/{event}/registrations/{registration}/verify-payment', [\App\Http\Controllers\EventRegistrationController::class, 'verifyPayment'])->name('events.registrations.verify-payment');
        Route::post('/{event}/registrations/bulk-approve', [\App\Http\Controllers\EventRegistrationController::class, 'bulkApprove'])->name('events.registrations.bulk-approve');
        Route::post('/{event}/registrations/bulk-reject', [\App\Http\Controllers\EventRegistrationController::class, 'bulkReject'])->name('events.registrations.bulk-reject');
        Route::get('/{event}/registrations/export/csv', [\App\Http\Controllers\EventRegistrationController::class, 'exportCsv'])->name('events.registrations.export-csv');
        Route::get('/{event}/registrations/export/pdf', [\App\Http\Controllers\EventRegistrationController::class, 'exportPdf'])->name('events.registrations.export-pdf');
        Route::get('/{event}/registrations/{registration}/print-token', [\App\Http\Controllers\EventRegistrationController::class, 'printToken'])->name('events.registrations.print-token');
    });
});

// Include all module routes
require __DIR__.'/modules.php';
require __DIR__.'/compliance.php';
require __DIR__.'/quality.php';
require __DIR__.'/analytics.php';
require __DIR__.'/project-management.php';

require __DIR__.'/dms.php';
require __DIR__.'/support.php';

// NOTE: Auth routes are loaded via platform.php (central) and tenant.php (tenants)
// to ensure proper database context. Do not include auth.php here.
