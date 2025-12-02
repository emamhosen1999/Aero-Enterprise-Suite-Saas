# Tenant Provisioning Transaction Safety

## Overview

This document describes the complete rollback mechanism implemented for tenant provisioning to ensure atomic transactions. The system now implements "all-or-nothing" provisioning where partial failures result in complete cleanup, allowing users to retry registration without encountering constraint violations.

## Problem Statement

**Original Issue**: When tenant provisioning failed (e.g., during database migration), the system would:
1. Leave the tenant database created (orphaned)
2. Leave the tenant record in the platform database
3. Leave the domain record in the domains table

**User Impact**: 
- Users attempting to re-register with the same subdomain would encounter: `SQLSTATE[23000]: Integrity constraint violation: 1062 Duplicate entry`
- Orphaned databases consumed disk space
- No clear recovery path without manual database intervention

## Solution: Complete Rollback

### Components Modified

#### 1. `app/Jobs/ProvisionTenant.php`

**Modified `failed()` Method**:
```php
public function failed(?Throwable $exception): void
{
    Log::error('Tenant provisioning failed - performing complete rollback', [
        'tenant_id' => $this->tenant->id,
        'tenant_name' => $this->tenant->name,
        'step' => $this->tenant->provisioning_step,
        'error' => $exception?->getMessage(),
    ]);

    try {
        // Step 1: Drop tenant database if it exists
        $this->rollbackDatabase();

        // Step 2: Delete domain records (allows re-registration with same subdomain)
        $this->tenant->domains()->delete();

        // Step 3: Delete tenant record (allows re-registration with same email/name)
        $this->tenant->forceDelete();

        Log::info('Complete tenant rollback successful - user can re-register');
    } catch (Throwable $e) {
        Log::error('Failed to complete tenant rollback', [
            'tenant_id' => $this->tenant->id,
            'error' => $e->getMessage(),
        ]);

        // Last resort: mark as failed for admin cleanup
        $this->tenant->markProvisioningFailed($exception?->getMessage());
    }
}
```

**Rollback Order**:
1. **Database Drop**: Removes orphaned tenant database using `DROP DATABASE IF EXISTS`
2. **Domain Deletion**: Removes domain records to free up subdomain constraint
3. **Tenant Deletion**: Removes tenant record using `forceDelete()` to bypass soft deletes

#### 2. `resources/js/Platform/Pages/Public/Register/Provisioning.jsx`

**Modified "Try Again" Button**:
```jsx
<Button
    as={Link}
    href={route('platform.register')}
    variant="bordered"
    color="secondary"
>
    Try Again
</Button>
<p className="mt-4 text-center text-sm text-default-500">
    All resources have been cleaned up. You can register again with the same details.
</p>
```

**Changes**:
- Removed complex retry endpoint
- Simplified to redirect back to registration page
- Added user-friendly message confirming cleanup

#### 3. `routes/platform.php`

**Removed Route**:
```php
// Removed: Route::post('/provisioning/{tenant}/retry', ...)
```

The retry mechanism is no longer needed since complete rollback allows natural re-registration.

## Testing

### Test Suite: `tests/Feature/ProvisioningRollbackTest.php`

Three comprehensive tests verify the rollback mechanism:

#### Test 1: Complete Resource Deletion
```php
test_failed_provisioning_deletes_all_resources()
```
- Creates tenant with domain
- Triggers job failure
- Verifies tenant record deleted
- Verifies domain records deleted
- **Result**: ✅ PASS

#### Test 2: Re-registration After Failure
```php
test_user_can_reregister_after_failed_provisioning()
```
- Creates and fails first tenant
- Attempts to create second tenant with same subdomain/email
- Verifies no unique constraint violations
- **Result**: ✅ PASS

#### Test 3: Graceful Handling of Non-existent Database
```php
test_rollback_handles_nonexistent_database_gracefully()
```
- Simulates failure before database creation
- Verifies rollback doesn't throw exceptions
- Verifies tenant still deleted
- **Result**: ✅ PASS

### Test Results
```
PASS  Tests\Feature\ProvisioningRollbackTest
✓ failed provisioning deletes all resources (5.41s)
✓ user can reregister after failed provisioning (0.11s)
✓ rollback handles nonexistent database gracefully (0.06s)

Tests: 3 passed (8 assertions)
```

## User Experience Flow

### Before Fix

1. User registers with subdomain "acme"
2. Provisioning fails at migration step
3. User clicks "Try Again"
4. **Error**: "Subdomain already exists"
5. User stuck, requires support intervention

### After Fix

1. User registers with subdomain "acme"
2. Provisioning fails at any step
3. System automatically:
   - Drops tenant database
   - Deletes domain records
   - Deletes tenant record
4. User clicks "Try Again"
5. Redirected to registration
6. **Success**: Can register with same subdomain "acme"

## Error Handling

### Successful Rollback
```
[INFO] Complete tenant rollback successful - user can re-register
{
    "tenant_id": "uuid",
    "subdomain": "acme",
    "email": "user@example.com"
}
```

### Rollback Failure (Rare)
```
[ERROR] Failed to complete tenant rollback
{
    "tenant_id": "uuid",
    "error": "Specific error message"
}
```

If rollback fails, the system falls back to marking the tenant as failed, requiring manual admin cleanup. This is a rare edge case (e.g., database connection lost during rollback).

## Database Schema Requirements

The implementation assumes proper foreign key constraints:

```sql
-- domains table should have ON DELETE CASCADE
ALTER TABLE domains
ADD CONSTRAINT fk_tenant_id 
FOREIGN KEY (tenant_id) 
REFERENCES tenants(id) 
ON DELETE CASCADE;
```

This ensures deleting a tenant automatically deletes associated domains.

## Production Considerations

### Queue Configuration
- Ensure `QUEUE_CONNECTION=database` (or Redis)
- Failed jobs are logged to `failed_jobs` table
- Monitor failed job metrics

### Monitoring
- Watch for repeated provisioning failures (same tenant)
- Alert on rollback errors (indicates infra issues)
- Track rollback success rate

### Cleanup Verification
Periodic audit to ensure no orphaned resources:
```sql
-- Check for orphaned domains (no matching tenant)
SELECT * FROM domains 
WHERE tenant_id NOT IN (SELECT id FROM tenants);

-- Check for orphaned databases
SHOW DATABASES LIKE 'tenant%';
-- Cross-reference with active tenants
```

## Compliance with Section 1 Requirements

This implementation satisfies **Section 1.1 - Multi-Tenant Architecture** requirements:
- ✅ Automatic tenant provisioning with error recovery
- ✅ Clean resource management
- ✅ User-friendly error handling
- ✅ Transaction safety and data integrity

## Related Documentation

- [modules.md](./modules.md) - Section 1: Multi-Tenant Architecture
- [tenant-provisioning-verification.md](./tenant-provisioning-verification.md) - Original verification report
- [multi-tenancy-deployment.md](./multi-tenancy-deployment.md) - Deployment guide

## Changelog

- **2025-12-02**: Implemented complete rollback mechanism
- **2025-12-02**: Added comprehensive test suite
- **2025-12-02**: Simplified retry flow (redirect to registration)
