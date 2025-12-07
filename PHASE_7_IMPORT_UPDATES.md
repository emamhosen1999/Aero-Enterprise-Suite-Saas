# Phase 7: Import Updates - Implementation Guide

## Overview
This document outlines the remaining work needed to complete the Platform/Tenant/Shared reorganization. Phase 7 involves updating thousands of import statements across the codebase to reference the new file locations.

## Completed Phases (1-6)

### Phase 1-3: Controllers ✅
- 148 controllers moved and namespaces updated
- 14 route files updated
- **Status**: Routes reference new locations, but controllers may import old model/service paths

### Phase 4: Models ✅
- 223 models moved and namespaces updated
- **Status**: Model relationships may reference old paths

### Phase 5: Services ✅
- 64 services moved and namespaces updated
- **Status**: Services may import old model/controller/service paths

### Phase 6: Policies ✅
- 25 policies moved and namespaces updated
- **Status**: Policy imports should be updated in AuthServiceProvider

## Phase 7: Required Import Updates

### 7.1 Controller Imports

**Location**: `app/Http/Controllers/Platform/`, `Tenant/`, `Shared/`

**Update Required:**
```php
// OLD imports in controllers
use App\Models\Employee;
use App\Models\Leave;
use App\Services\LeaveService;
use App\Policies\LeavePolicy;

// NEW imports
use App\Models\Tenant\HRM\Employee;
use App\Models\Tenant\HRM\Leave;
use App\Services\Tenant\HRM\LeaveService;
use App\Policies\Tenant\HRM\LeavePolicy;
```

**Scope**: All 148 controller files
**Estimated Impact**: 1000+ import statements

### 7.2 Service Imports

**Location**: `app/Services/Platform/`, `Tenant/`, `Shared/`

**Update Required:**
```php
// OLD imports in services
use App\Models\Employee;
use App\Services\NotificationService;
use App\Models\Attendance;

// NEW imports
use App\Models\Tenant\HRM\Employee;
use App\Services\Shared\Notification\NotificationService;
use App\Models\Tenant\HRM\Attendance;
```

**Scope**: All 64 service files
**Estimated Impact**: 500+ import statements

### 7.3 Model Imports (Relationships)

**Location**: `app/Models/Platform/`, `Tenant/`, `Shared/`

**Update Required:**
```php
// OLD relationship imports
use App\Models\Department;
use App\Models\User;
use App\Models\Leave;

// NEW relationship imports
use App\Models\Tenant\HRM\Department;
use App\Models\Shared\User;
use App\Models\Tenant\HRM\Leave;
```

**Scope**: All 223 model files
**Estimated Impact**: 2000+ relationship references

### 7.4 Policy Registration

**Location**: `app/Providers/AuthServiceProvider.php`

**Update Required:**
```php
// OLD policy registration
use App\Models\Leave;
use App\Policies\LeavePolicy;

protected $policies = [
    Leave::class => LeavePolicy::class,
];

// NEW policy registration
use App\Models\Tenant\HRM\Leave;
use App\Policies\Tenant\HRM\LeavePolicy;

protected $policies = [
    \App\Models\Tenant\HRM\Leave::class => \App\Policies\Tenant\HRM\LeavePolicy::class,
];
```

### 7.5 Middleware Imports

**Location**: `app/Http/Middleware/`

**Update Required**: Update any middleware that references models or services

### 7.6 Form Request Imports

**Location**: `app/Http/Requests/`

**Update Required**: Update imports for models used in validation rules

### 7.7 Test Imports

**Location**: `tests/Feature/`, `tests/Unit/`

**Update Required**: Update all test files to reference new model/service/controller locations

### 7.8 Database Factories & Seeders

**Location**: `database/factories/`, `database/seeders/`

**Update Required:**
```php
// OLD factory
use App\Models\Employee;

// NEW factory
use App\Models\Tenant\HRM\Employee;
```

## Implementation Strategy

### Option A: Automated Approach (Faster, Riskier)

**Step 1**: Create mapping file
```php
$importMappings = [
    'App\\Models\\Employee' => 'App\\Models\\Tenant\\HRM\\Employee',
    'App\\Models\\Leave' => 'App\\Models\\Tenant\\HRM\\Leave',
    // ... 200+ more mappings
];
```

**Step 2**: Run search-and-replace script across all PHP files

**Step 3**: Test thoroughly

**Pros**: Fast, comprehensive
**Cons**: May break edge cases, requires extensive testing

### Option B: Manual Incremental Approach (Slower, Safer)

**Step 1**: Start with critical paths (auth, core features)
**Step 2**: Update imports for one module at a time
**Step 3**: Test after each module
**Step 4**: Continue until all modules updated

**Pros**: Safer, easier to rollback
**Cons**: Time-consuming, labor-intensive

### Option C: IDE-Assisted Approach (Recommended)

**Step 1**: Open project in PhpStorm or VS Code
**Step 2**: Use "Find and Replace in Path" with regex
**Step 3**: Use IDE's "Optimize Imports" feature
**Step 4**: Use IDE's refactoring tools for namespace changes

**Pros**: Fast + relatively safe, IDE helps catch errors
**Cons**: Requires good IDE setup

## Detailed Import Mapping

### Platform Models
```
App\Models\Tenant → App\Models\Platform\Tenant
App\Models\Domain → App\Models\Platform\Domain
App\Models\Plan → App\Models\Platform\Plan
App\Models\Subscription → App\Models\Platform\Subscription
App\Models\LandlordUser → App\Models\Platform\LandlordUser
App\Models\PlatformSetting → App\Models\Platform\PlatformSetting
App\Models\ErrorLog → App\Models\Platform\ErrorLog
```

### Shared Models
```
App\Models\User → App\Models\Shared\User
App\Models\Role → App\Models\Shared\Role
App\Models\Module → App\Models\Shared\Module
App\Models\ModuleComponent → App\Models\Shared\ModuleComponent
App\Models\RoleModuleAccess → App\Models\Shared\RoleModuleAccess
```

### Tenant HRM Models
```
App\Models\Employee → App\Models\Tenant\HRM\Employee
App\Models\Department → App\Models\Tenant\HRM\Department
App\Models\Designation → App\Models\Tenant\HRM\Designation
App\Models\Leave → App\Models\Tenant\HRM\Leave
App\Models\Attendance → App\Models\Tenant\HRM\Attendance
App\Models\Payroll → App\Models\Tenant\HRM\Payroll
App\Models\HRM\* → App\Models\Tenant\HRM\*
```

### Tenant Other Modules
```
App\Models\CRM\* → App\Models\Tenant\CRM\*
App\Models\Finance\* → App\Models\Tenant\Finance\*
App\Models\SCM\* → App\Models\Tenant\SCM\*
App\Models\POS\* → App\Models\Tenant\POS\*
App\Models\Quality* → App\Models\Tenant\Quality\*
App\Models\Compliance\* → App\Models\Tenant\Compliance\*
App\Models\Project* → App\Models\Tenant\ProjectManagement\*
```

### Services
```
App\Services\TenantProvisioner → App\Services\Platform\Monitoring\Tenant\TenantProvisioner
App\Services\Leave\* → App\Services\Tenant\HRM\*
App\Services\Attendance\* → App\Services\Tenant\HRM\*
App\Services\Auth\* → App\Services\Shared\Auth\*
App\Services\Module\* → App\Services\Shared\Module\*
```

### Policies
```
App\Policies\LeavePolicy → App\Policies\Tenant\HRM\LeavePolicy
App\Policies\UserPolicy → App\Policies\Shared\UserPolicy
App\Policies\RolePolicy → App\Policies\Shared\RolePolicy
App\Policies\Quality* → App\Policies\Tenant\Quality\*
```

## Testing Strategy

### Unit Tests
1. Run all unit tests after import updates
2. Fix any failures related to incorrect imports
3. Ensure all models, services load correctly

### Integration Tests
1. Test authentication flow
2. Test employee/HR workflows
3. Test leave management
4. Test attendance tracking
5. Test each major module

### Manual Testing Checklist
- [ ] User login/logout
- [ ] Dashboard loads
- [ ] Employee list/create/edit
- [ ] Leave request/approval
- [ ] Attendance check-in/out
- [ ] Department/Designation management
- [ ] Role/Permission assignment
- [ ] Each module's main features

## Risk Mitigation

### Backup Strategy
1. Current state is in version control
2. Can revert entire reorganization if needed
3. Branch strategy allows safe testing

### Rollback Plan
If Phase 7 causes too many issues:
1. Revert commits 9153d06, 2af4940, 25df75b, 2af4940
2. Return to commit 9f318b6 (after route updates)
3. Or start fresh from commit 6e31e84 (policy compliance only)

### Incremental Deployment
1. Deploy to dev environment first
2. Extensive testing in dev
3. Deploy to staging
4. User acceptance testing in staging
5. Production deployment only after full validation

## Estimated Effort

- **Automated approach**: 4-8 hours coding + 8-16 hours testing
- **Manual approach**: 20-40 hours total
- **IDE-assisted**: 8-12 hours total

## Success Criteria

Phase 7 is complete when:
1. ✅ No "Class not found" errors
2. ✅ All unit tests pass
3. ✅ All integration tests pass
4. ✅ Application loads without errors
5. ✅ All major features functional
6. ✅ No import warnings in IDE

## Next Steps

1. **Decision**: Choose implementation approach
2. **Backup**: Ensure current state is committed
3. **Implement**: Execute chosen approach
4. **Test**: Run comprehensive test suite
5. **Validate**: Manual testing of key features
6. **Document**: Update any additional documentation
7. **Deploy**: Staged rollout to environments

## Notes

- This is a breaking change that will require coordination
- Consider doing Phase 7 in a separate PR for easier review
- May want to temporarily disable certain features during migration
- Plan for potential downtime during deployment
