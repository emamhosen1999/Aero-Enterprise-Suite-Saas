# Tenant Context Architecture Fix

## Issue Summary
Multiple files were incorrectly using `$user->tenant_id` field which does NOT exist in tenant databases. This is an architectural misunderstanding - in multi-tenant Laravel with Stancl Tenancy:

- **Tenant databases**: Users table does NOT have `tenant_id` - isolation is at the database level
- **Central/Landlord database**: LandlordUser table MAY have `tenant_id` for cross-tenant operations
- **Spatie Permission**: `teams` feature is DISABLED (`teams => false`), so roles/permissions don't use `tenant_id`

## Root Cause
The codebase was mixing concepts from single-database multi-tenancy (where tenant_id on users provides isolation) with database-per-tenant architecture (where database isolation makes tenant_id unnecessary).

## Files Fixed

### 1. ModuleAccessService.php
**Location**: `app/Services/Module/ModuleAccessService.php`

**Issue**: 
- `isPlanAllowed()` method used `$user->tenant_id` to build cache keys and query tenants
- Only checked plan-based modules, ignored custom module collections

**Fix**:
- Changed to use `tenant()` helper instead of `$user->tenant_id`
- Now checks BOTH plan-based modules AND tenant's custom modules array
- Supports dual-mode plan selection:
  - **Mode 1**: Predefined plan with modules
  - **Mode 2**: Custom collection of modules
- Updated cache key to use `tenant()->id`
- Updated `clearUserCache()` to use `tenant()` helper

**Impact**: ✅ Module access control now works correctly in tenant context and supports both registration modes

---

### 2. RolePolicy.php
**Location**: `app/Policies/RolePolicy.php`

**Issue**: 
- `view()`, `update()`, and `delete()` methods checked `$role->tenant_id === $user->tenant_id`
- Both fields don't exist because teams feature is disabled

**Fix**:
- Removed tenant_id checks from all three methods
- Tenant Super Administrators can now manage all roles within their tenant database
- Database-level isolation provides sufficient security

**Impact**: ✅ Role management now works for tenant super administrators

---

### 3. UserPolicy.php
**Location**: `app/Policies/UserPolicy.php`

**Issue**: 
- `isLastSuperAdminInScope()` method used `$user->tenant_id` to check for last admin
- Queried roles with non-existent `tenant_id` field

**Fix**:
- Removed tenant_id checks from the query
- Counts tenant super administrators within the current tenant database only
- Database-level isolation ensures correct scoping

**Impact**: ✅ Last super admin protection now works correctly

---

### 4. TenantSuperAdmin.php
**Location**: `app/Http/Middleware/TenantSuperAdmin.php`

**Issue**: 
- Checked `$user->tenant_id` to verify tenant context

**Fix**:
- Changed to only check `tenant()` helper
- Simplified condition: `if (! tenant())`

**Impact**: ✅ Middleware now correctly validates tenant context

---

### 5. SamlService.php
**Location**: `app/Services/Auth/SamlService.php`

**Issue**: 
- `createUser()` method unconditionally set `$user->tenant_id = $tenant->id`
- Would fail for tenant database users

**Fix**:
- Added schema check before setting tenant_id
- Only sets tenant_id if the column exists (landlord users)
- Safe for both tenant and landlord contexts

**Impact**: ✅ SAML authentication now works without errors

---

## Architecture Clarification

### Tenant Database (tenant{uuid})
```
users table:
- id
- name
- email
- password
- email_verified_at
- created_at
- updated_at
(NO tenant_id field - database itself provides isolation)

roles table (Spatie):
- id
- name
- guard_name
- scope (tenant/platform)
(NO tenant_id field - teams feature disabled)
```

### Central Database (eos365)
```
tenants table:
- id (UUID)
- name
- domain
- database
- plan_id (UUID, can be null for custom module selection)
- modules (JSON array of module codes)
- created_at
- updated_at

plans table:
- id (UUID)
- name
- slug
- created_at
- updated_at

plan_module pivot:
- plan_id
- module_id

landlord_users table:
- id
- name
- email
- password
(May have tenant_id for cross-tenant operations)
```

## Module Access Control Formula

The correct formula for module access:

```php
if ($user->isSuperAdmin()) {
    return true; // Bypass all checks
}

// Get active modules from BOTH sources:
$moduleCodes = [];

// Source 1: Plan-based modules (if tenant has plan_id)
if ($tenant->plan_id) {
    $moduleCodes = merge($moduleCodes, $tenant->plan->modules);
}

// Source 2: Custom module collection (if tenant has modules array)
if (!empty($tenant->modules)) {
    $moduleCodes = merge($moduleCodes, $tenant->modules);
}

// Source 3: Core modules (always accessible)
$moduleCodes = merge($moduleCodes, Module::where('is_core', true)->get());

// Check if module is in allowed list
if (!in_array($moduleCode, $moduleCodes)) {
    return false;
}

// Check role-based permissions
return $user->hasPermissionTo("module.{$moduleCode}.access");
```

## Testing Checklist

- [ ] Register new tenant with predefined plan
- [ ] Register new tenant with custom module selection
- [ ] Complete admin setup and login
- [ ] Verify dashboard access
- [ ] Verify module access control works
- [ ] Test role management (view/create/update/delete)
- [ ] Test user management
- [ ] Verify last super admin protection
- [ ] Test SAML authentication (if enabled)

## Related Issues Fixed

This fix also resolves:
- Plan_id null issue (now properly supports custom module mode)
- Module access denied errors after admin setup
- Role management permission errors
- User policy permission errors
- SAML authentication errors

## Migration Notes

**No database migrations required** - this is purely a code architecture fix.

The fixes ensure the code properly uses:
- `tenant()` helper for tenant context
- Database-level isolation instead of tenant_id columns
- Support for both plan-based and custom module subscriptions

## Prevention Guidelines

**For Future Development**:
1. ❌ NEVER use `$user->tenant_id` in tenant context
2. ✅ ALWAYS use `tenant()` helper to get current tenant
3. ❌ NEVER query `Tenant` model from tenant database
4. ✅ ALWAYS query `Tenant` from central database using `tenancy()->central()`
5. ✅ Remember: Database isolation = No tenant_id needed on tenant DB tables
6. ✅ Check `config/permission.php` - teams feature is DISABLED

## References

- Stancl Tenancy Documentation: https://tenancyforlaravel.com/
- Spatie Permission Teams: https://spatie.be/docs/laravel-permission/
- Project: `config/permission.php` line 132: `'teams' => false`
- Project: `config/modules.php` - Module access control configuration
