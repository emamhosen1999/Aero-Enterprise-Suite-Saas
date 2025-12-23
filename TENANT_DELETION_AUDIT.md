# 🧾 Tenant Deletion & Retention Compliance Audit - CRITICAL VIOLATIONS FOUND

**System:** Aero Enterprise Suite SaaS  
**Date:** 2025-12-23  
**Auditor:** Principal Laravel SaaS Architect & Compliance Auditor  
**Phase:** Tenant Lifecycle Management (Deletion, Deactivation, Retention)

---

## ❌ CRITICAL VIOLATIONS (Must Fix Immediately)

### 1. Soft Delete Without Retention Policy
**Violation:** `TenantController::destroy()` uses soft delete but has NO retention window or restoration path.

**Why Critical:**
- Violates "deletion must be reversible unless explicitly permanent" requirement
- No retention period enforced
- No explicit purge mechanism
- Can't distinguish temporary vs permanent deletion
- No compliance with data retention regulations

**Current Implementation (WRONG):**
```php
// packages/aero-platform/src/Http/Controllers/TenantController.php
public function destroy(Request $request, Tenant $tenant): JsonResponse
{
    // Soft delete by default
    $tenant->delete(); // ❌ No retention policy, no purge mechanism

    return response()->json([
        'message' => 'Tenant archived successfully.',
    ]);
}
```

**Required Implementation:**
```php
public function deactivate(Request $request, Tenant $tenant): JsonResponse
{
    $validated = $request->validate([
        'reason' => 'required|string|max:500',
        'confirm' => 'required|accepted',
    ]);

    // Step 1: Deactivate (not delete)
    $tenant->update([
        'status' => Tenant::STATUS_ARCHIVED,
        'archived_at' => now(),
        'archived_by' => auth('landlord')->id(),
        'archived_reason' => $validated['reason'],
    ]);

    // Step 2: Log the action
    activity('tenant')
        ->performedOn($tenant)
        ->log('Tenant deactivated for deletion');

    return response()->json([
        'message' => 'Tenant scheduled for deletion. Can be restored within retention period.',
        'retention_expires_at' => now()->addDays(config('tenancy.retention_days', 30)),
    ]);
}

public function purge(Request $request, Tenant $tenant): JsonResponse
{
    // MUST require explicit intent
    if (!$tenant->archived_at) {
        abort(422, 'Tenant must be archived before purging');
    }

    $retentionDays = config('tenancy.retention_days', 30);
    if ($tenant->archived_at->addDays($retentionDays)->isFuture()) {
        abort(422, "Retention period not expired. Can purge after " . 
            $tenant->archived_at->addDays($retentionDays)->toDateString());
    }

    // Initialize tenancy to clean tenant database
    tenancy()->initialize($tenant);
    
    try {
        // Drop tenant database
        Artisan::call('tenants:delete', [
            '--tenant' => [$tenant->id],
            '--force' => true,
        ]);
    } finally {
        tenancy()->end();
    }

    // Remove tenant record
    $tenant->forceDelete();

    return response()->json([
        'message' => 'Tenant permanently purged',
    ]);
}
```

**Impact:**
- 🔴 No compliance with GDPR/data retention
- 🔴 Accidental deletion is permanent
- 🔴 No audit trail for deletion decisions
- 🔴 Missing retention window

**Files Affected:**
- `packages/aero-platform/src/Http/Controllers/TenantController.php`

---

### 2. Missing Active Tenant Enforcement Middleware
**Violation:** No middleware to prevent access to inactive/archived tenants.

**Why Critical:**
- Violates "lock access" requirement
- Archived tenants can still be accessed
- Suspended tenants not blocked from routes
- Security risk: deactivated tenant data accessible

**Current State (MISSING):**
```php
// ❌ No middleware registered to check tenant status
// ❌ Archived tenants can still route requests
// ❌ Suspended tenants not blocked
```

**Required Implementation:**
```php
// packages/aero-platform/src/Http/Middleware/EnsureTenantIsActive.php (NEW)
namespace Aero\Platform\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class EnsureTenantIsActive
{
    /**
     * Ensure the current tenant is active.
     * Must run AFTER tenancy initialization.
     */
    public function handle(Request $request, Closure $next)
    {
        $tenant = tenant();

        if (!$tenant) {
            // No tenant context - let InitializeTenancy handle
            return $next($request);
        }

        // Check tenant status
        if ($tenant->status === \Aero\Platform\Models\Tenant::STATUS_ARCHIVED) {
            abort(410, 'This tenant has been archived'); // 410 Gone
        }

        if ($tenant->status === \Aero\Platform\Models\Tenant::STATUS_SUSPENDED) {
            return response()->view('platform::tenant-suspended', [
                'reason' => $tenant->data['suspended_reason'] ?? 'Account suspended',
            ], 403);
        }

        if (!$tenant->isActive() && $tenant->status !== \Aero\Platform\Models\Tenant::STATUS_PROVISIONING) {
            abort(503, 'Tenant is not available');
        }

        return $next($request);
    }
}
```

**Register in Platform Service Provider:**
```php
// Middleware order (CRITICAL):
Route::middleware([
    'web',
    \Stancl\Tenancy\Middleware\InitializeTenancyByDomain::class,
    \Aero\Platform\Http\Middleware\EnsureTenantIsActive::class, // NEW - after tenancy
    'tenant',
])->group($routesPath.'/tenant.php');
```

**Impact:**
- 🔴 Archived tenants accessible
- 🔴 Suspended tenants not blocked
- 🔴 No access enforcement

---

### 3. Physical Deletion in Rollback Logic
**Violation:** `ProvisionTenant` job uses `forceDelete()` which bypasses soft deletes.

**Why Critical:**
- Violates "never physically delete by default" requirement
- Rollback permanently deletes tenant record
- No recovery path for failed provisions
- Debugging impossible after rollback

**Current Implementation (WRONG):**
```php
// packages/aero-platform/src/Jobs/ProvisionTenant.php:line ~167
if ($databaseCreated) {
    $this->logStep('🔙 Initiating database rollback', $errorContext, 'warning');
    $this->rollbackDatabase();
    $this->logStep('✅ Database rollback completed', $errorContext, 'warning');
}

// Later in rollbackDatabase():
protected function rollbackDatabase(): void
{
    try {
        // ...
        $this->tenant->domains()->delete();
        $this->tenant->forceDelete(); // ❌ WRONG: Physical deletion
    } catch (\Exception $e) {
        // ...
    }
}
```

**Required Implementation:**
```php
protected function rollbackDatabase(): void
{
    try {
        // Drop database if created
        if ($this->tenant->database()->exists()) {
            $this->tenant->database()->delete();
        }

        // Mark as failed, don't delete
        $this->tenant->update([
            'status' => Tenant::STATUS_FAILED,
            'provisioning_error' => $this->lastError ?? 'Unknown error',
            'failed_at' => now(),
        ]);

        // Do NOT forceDelete - keep record for debugging
        
    } catch (\Exception $e) {
        \Log::error('Failed to rollback tenant database', [
            'tenant_id' => $this->tenant->id,
            'error' => $e->getMessage(),
        ]);
    }
}
```

**Impact:**
- 🔴 Failed provisions permanently deleted
- 🔴 No audit trail for failures
- 🔴 Can't debug provisioning issues

---

### 4. No Retention Configuration
**Violation:** System has no `tenancy.retention_days` configuration.

**Why Critical:**
- Can't enforce retention policies
- No compliance with regulations
- Arbitrary deletion timing
- No organization policy enforcement

**Current State (MISSING):**
```php
// ❌ No config/tenancy.php with retention_days
// ❌ No way to configure retention window
// ❌ No default retention period
```

**Required Implementation:**
```php
// packages/aero-platform/config/tenancy.php
return [
    // ... existing config

    /*
    |--------------------------------------------------------------------------
    | Tenant Retention Policy
    |--------------------------------------------------------------------------
    |
    | When a tenant is archived (soft deleted), it enters a retention window
    | where it can be restored. After the retention period expires, it can
    | be permanently purged.
    |
    | This ensures compliance with data retention regulations and provides
    | a safety net for accidental deletions.
    |
    */
    'retention' => [
        'enabled' => env('TENANT_RETENTION_ENABLED', true),
        'days' => env('TENANT_RETENTION_DAYS', 30),
        'auto_purge' => env('TENANT_AUTO_PURGE', false),
        'notify_before_purge_days' => env('TENANT_NOTIFY_BEFORE_PURGE', 7),
    ],

    /*
    |--------------------------------------------------------------------------
    | Tenant Deletion Policy
    |--------------------------------------------------------------------------
    |
    | Controls what happens when a tenant is deleted.
    |
    */
    'deletion' => [
        'require_confirmation' => true,
        'require_reason' => true,
        'notify_tenant' => true,
        'backup_before_purge' => true,
    ],
];
```

**Impact:**
- 🔴 No retention policy enforcement
- 🔴 Can't comply with regulations
- 🔴 Arbitrary deletion windows

---

### 5. Tenant Deletion in Registration Rollback
**Violation:** `RegistrationController` deletes tenant on registration failure.

**Why Critical:**
- Violates "platform owns tenant deletion" requirement
- Registration controller shouldn't delete tenants
- Bypasses retention policy
- Lost audit trail

**Current Implementation (WRONG):**
```php
// packages/aero-platform/src/Http/Controllers/RegistrationController.php
catch (\Exception $e) {
    DB::rollBack();
    
    if (isset($tenant)) {
        $tenant->delete(); // ❌ Registration controller deleting tenant
    }
    
    // ...
}
```

**Required Implementation:**
```php
catch (\Exception $e) {
    DB::rollBack();
    
    if (isset($tenant)) {
        // Mark as failed, don't delete
        $tenant->update([
            'status' => Tenant::STATUS_FAILED,
            'registration_error' => $e->getMessage(),
        ]);
    }
    
    // ... error handling
}
```

**Impact:**
- 🔴 Registration failures delete tenants
- 🔴 No failed registration audit
- 🔴 Bypasses retention policy

---

### 6. Missing Restore Functionality
**Violation:** No method to restore soft-deleted tenants.

**Why Critical:**
- Violates "reversible unless explicitly permanent" requirement
- Soft delete is useless without restore
- No way to undo accidental deletions
- Missing from reference implementation

**Current State (MISSING):**
```php
// ❌ No restore method in TenantController
// ❌ No restore route
// ❌ No restore UI
```

**Required Implementation:**
```php
// packages/aero-platform/src/Http/Controllers/TenantController.php
public function restore(Request $request, string $tenantId): JsonResponse
{
    $tenant = Tenant::onlyTrashed()->findOrFail($tenantId);

    // Check retention window
    $retentionDays = config('tenancy.retention.days', 30);
    if ($tenant->deleted_at->addDays($retentionDays)->isPast()) {
        abort(422, 'Retention period expired. Tenant cannot be restored.');
    }

    // Restore tenant
    $tenant->restore();

    // Reactivate
    $tenant->update([
        'status' => Tenant::STATUS_ACTIVE,
        'restored_at' => now(),
        'restored_by' => auth('landlord')->id(),
    ]);

    // Log the action
    activity('tenant')
        ->performedOn($tenant)
        ->log('Tenant restored from archive');

    return response()->json([
        'data' => $tenant,
        'message' => 'Tenant restored successfully',
    ]);
}
```

**Impact:**
- 🔴 Can't undo deletions
- 🔴 Soft delete serves no purpose
- 🔴 Missing safety net

---

## ⚠️ ARCHITECTURAL RISKS

### 1. No Archived Tenant Visibility
**Risk:** `TenantController::index()` doesn't show archived tenants.

**Impact:** Medium  
**Current Behavior:**
```php
$query = Tenant::query(); // ❌ Doesn't include soft deleted
```

**Recommendation:**
```php
$query = Tenant::query()
    ->when($request->input('include_archived'), function ($q) {
        $q->withTrashed();
    });
```

---

### 2. No Deletion Audit Trail
**Risk:** Tenant deletions not logged to activity log.

**Impact:** High  
**Current State:** No deletion logging.

**Recommendation:**
Add activity logging using `spatie/laravel-activitylog`:
```php
activity('tenant')
    ->performedOn($tenant)
    ->withProperties([
        'reason' => $reason,
        'retention_expires_at' => now()->addDays(30),
    ])
    ->log('Tenant archived');
```

---

### 3. Suspend vs Archive Confusion
**Risk:** `suspend()` and `destroy()` both change status but have different semantics.

**Impact:** Medium  
**Current State:**
- `suspend()` → Sets STATUS_SUSPENDED (temporary)
- `destroy()` → Soft deletes (permanent intent)

**Recommendation:**
Clarify distinction:
- Suspend = Temporary block (billing issue, policy violation)
- Archive = Deletion with retention (customer request, end of service)

---

### 4. No Scheduled Purge Job
**Risk:** Archived tenants must be manually purged.

**Impact:** Medium  
**Current State:** No auto-purge mechanism.

**Recommendation:**
```php
// packages/aero-platform/src/Console/Commands/PurgeExpiredTenants.php
class PurgeExpiredTenants extends Command
{
    public function handle()
    {
        if (!config('tenancy.retention.auto_purge', false)) {
            $this->info('Auto-purge disabled');
            return 0;
        }

        $retentionDays = config('tenancy.retention.days', 30);
        $expiredDate = now()->subDays($retentionDays);

        $tenants = Tenant::onlyTrashed()
            ->where('deleted_at', '<=', $expiredDate)
            ->get();

        foreach ($tenants as $tenant) {
            $this->info("Purging tenant: {$tenant->name}");
            app(TenantPurgeService::class)->purge($tenant);
        }

        return 0;
    }
}
```

---

### 5. Missing Database Cleanup Verification
**Risk:** `forceDelete()` doesn't verify database was dropped.

**Impact:** Medium  
**Current State:** Database may remain after tenant deleted.

**Recommendation:**
Add verification in purge:
```php
public function purge(Tenant $tenant): void
{
    // ... purge logic

    // Verify database dropped
    if ($tenant->database()->exists()) {
        throw new \RuntimeException('Failed to drop tenant database');
    }

    $tenant->forceDelete();
}
```

---

## ✅ COMPLIANT IMPLEMENTATIONS

### 1. Soft Deletes Enabled ✅
**Status:** COMPLIANT

Tenant model uses `SoftDeletes` trait:
```php
// packages/aero-platform/src/Models/Tenant.php
use SoftDeletes;
```

Migration adds `deleted_at` column:
```php
// packages/aero-platform/database/migrations/2025_11_30_205305_add_soft_deletes_to_tenants_table.php
$table->softDeletes();
```

---

### 2. Suspend Functionality ✅
**Status:** COMPLIANT

Suspend implementation exists and is separate from deletion:
```php
public function suspend(Request $request, Tenant $tenant): JsonResponse
{
    $tenant->update([
        'status' => Tenant::STATUS_SUSPENDED,
        'data' => array_merge($tenant->data?->getArrayCopy() ?? [], [
            'suspended_at' => now()->toIso8601String(),
            'suspended_reason' => $validated['reason'] ?? null,
        ]),
    ]);
}
```

---

### 3. Status Constants ✅
**Status:** COMPLIANT

Tenant statuses well-defined:
```php
const STATUS_PENDING = 'pending';
const STATUS_PROVISIONING = 'provisioning';
const STATUS_ACTIVE = 'active';
const STATUS_FAILED = 'failed';
const STATUS_SUSPENDED = 'suspended';
const STATUS_ARCHIVED = 'archived';
```

---

## 🔧 CONCRETE FIXES REQUIRED

### Priority 1: Implement Retention Policy

**Files to Create:**
1. `packages/aero-platform/src/Services/TenantRetentionService.php`
2. `packages/aero-platform/src/Services/TenantPurgeService.php`
3. `packages/aero-platform/src/Http/Middleware/EnsureTenantIsActive.php`
4. `packages/aero-platform/src/Console/Commands/PurgeExpiredTenants.php`

**Files to Modify:**
1. `packages/aero-platform/src/Http/Controllers/TenantController.php`
   - Replace `destroy()` with `archive()`
   - Add `restore()`
   - Add `purge()`

2. `packages/aero-platform/config/tenancy.php`
   - Add retention configuration

3. `packages/aero-platform/src/Jobs/ProvisionTenant.php`
   - Remove `forceDelete()` from rollback
   - Mark as failed instead

4. `packages/aero-platform/src/AeroPlatformServiceProvider.php`
   - Register `EnsureTenantIsActive` middleware

---

### Priority 2: Add Audit Logging

Install and configure `spatie/laravel-activitylog`:
```bash
composer require spatie/laravel-activitylog
```

Add logging to all tenant lifecycle events:
- Archive
- Restore  
- Suspend
- Reactivate
- Purge

---

### Priority 3: Add Retention Metadata

Migration:
```php
Schema::table('tenants', function (Blueprint $table) {
    $table->timestamp('archived_at')->nullable();
    $table->unsignedBigInteger('archived_by')->nullable();
    $table->string('archived_reason', 500)->nullable();
    $table->timestamp('restored_at')->nullable();
    $table->unsignedBigInteger('restored_by')->nullable();
});
```

---

## 📊 COMPLIANCE SCORECARD

| Requirement | Status |
|-------------|--------|
| No physical deletion by default | ⚠️ PARTIAL (soft delete exists but forceDelete used in rollback) |
| Platform owns deletion | ❌ FAIL (registration controller deletes) |
| Phased teardown | ❌ FAIL (no retention/purge phases) |
| Reversible operations | ❌ FAIL (no restore method) |
| Access lock enforcement | ❌ FAIL (no middleware) |
| Retention policy | ❌ FAIL (no configuration or enforcement) |
| Explicit purge | ❌ FAIL (no purge method) |
| Audit trail | ❌ FAIL (no deletion logging) |
| Standalone compatibility | ✅ PASS (no tenant deletion in standalone) |

**Overall Compliance:** **1/9 FAIL** ❌

---

## 🎯 FINAL ASSESSMENT

**Production Readiness:** ❌ **NOT READY**

The system has **6 CRITICAL violations** that MUST be fixed before production:

1. ❌ Soft delete without retention policy
2. ❌ No active tenant enforcement middleware
3. ❌ Physical deletion in rollback
4. ❌ No retention configuration
5. ❌ Tenant deletion in registration
6. ❌ No restore functionality

**Risk Level:** **HIGH** 🔴

- Data loss risk from accidental deletion
- No compliance with GDPR/retention regulations
- Security risk from inactive tenant access
- Audit trail missing for deletion decisions

**Immediate Actions Required:**
1. Implement retention policy with configuration
2. Add EnsureTenantIsActive middleware
3. Remove forceDelete() from rollback
4. Add restore() method
5. Move deletion out of registration controller
6. Add audit logging

---

**Audit Completed:** 2025-12-23  
**Status:** ❌ **CRITICAL VIOLATIONS - NOT PRODUCTION READY**  
**Next Review:** After retention and purge implementation
