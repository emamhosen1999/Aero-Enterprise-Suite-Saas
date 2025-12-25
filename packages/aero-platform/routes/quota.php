<?php

declare(strict_types=1);

use Aero\Platform\Http\Controllers\Admin\QuotaManagementController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Quota Management Routes (Admin)
|--------------------------------------------------------------------------
|
| These routes handle quota monitoring, enforcement configuration,
| and tenant quota management for platform administrators.
|
*/

Route::middleware(['auth:landlord', 'module:subscriptions'])->prefix('admin/quotas')->name('admin.quotas.')->group(function () {
    // Dashboard & Monitoring
    Route::get('/', [QuotaManagementController::class, 'index'])->name('index');
    Route::get('/statistics', [QuotaManagementController::class, 'statistics'])->name('statistics');
    Route::get('/tenant/{tenant}', [QuotaManagementController::class, 'show'])->name('show');
    
    // Enforcement Settings
    Route::get('/settings', [QuotaManagementController::class, 'settings'])->name('settings');
    Route::put('/settings', [QuotaManagementController::class, 'updateSettings'])->name('settings.update');
    Route::post('/settings/{quotaType}', [QuotaManagementController::class, 'createSetting'])->name('settings.create');
    
    // Tenant-Specific Overrides
    Route::post('/tenant/{tenant}/override', [QuotaManagementController::class, 'overrideQuota'])->name('override');
    Route::delete('/tenant/{tenant}/override/{quotaType}', [QuotaManagementController::class, 'removeOverride'])->name('override.remove');
    
    // Warning Management
    Route::get('/warnings', [QuotaManagementController::class, 'warnings'])->name('warnings');
    Route::post('/warnings/{warning}/dismiss', [QuotaManagementController::class, 'dismissWarning'])->name('warnings.dismiss');
    Route::post('/tenant/{tenant}/warnings/{quotaType}/dismiss', [QuotaManagementController::class, 'dismissTenantWarning'])->name('tenant.warning.dismiss');
});

/*
|--------------------------------------------------------------------------
| Quota API Routes (Tenant)
|--------------------------------------------------------------------------
|
| These routes allow tenants to view their own quota usage
| and receive quota status information.
|
*/

Route::middleware(['auth', 'tenant'])->prefix('api/tenant/quotas')->name('tenant.quotas.')->group(function () {
    // Tenant's Own Quota Information
    Route::get('/', function () {
        $tenant = tenant();
        $service = app(\Aero\Platform\Services\Quotas\EnhancedQuotaEnforcementService::class);
        
        return response()->json([
            'quotas' => $service->getTenantQuotaSummary($tenant),
            'warnings' => $tenant->quotaWarnings()
                ->where('dismissed_at', null)
                ->where('grace_period_ends_at', '>', now())
                ->get(),
        ]);
    })->name('index');
    
    Route::get('/usage/{quotaType}', function (string $quotaType) {
        $tenant = tenant();
        $service = app(\Aero\Platform\Services\QuotaEnforcementService::class);
        
        $current = $service->getCurrentUsage($tenant, $quotaType);
        $limit = $service->getQuotaLimit($tenant, $quotaType);
        
        return response()->json([
            'quota_type' => $quotaType,
            'current' => $current,
            'limit' => $limit,
            'percentage' => $limit > 0 ? round(($current / $limit) * 100, 2) : 0,
            'available' => max(0, $limit - $current),
        ]);
    })->name('usage');
});
