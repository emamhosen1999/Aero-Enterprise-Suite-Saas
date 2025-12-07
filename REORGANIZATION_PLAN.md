# Project Reorganization Plan: Tenant/Platform/Shared Context

## Overview
Reorganize the codebase to clearly separate tenant-scoped, platform-scoped, and shared functionality based on the module hierarchy defined in `config/modules.php`.

## Context Definitions

### Platform Context
**Purpose**: Platform administration and management (landlord features)
**Users**: Platform administrators managing the entire SaaS infrastructure
**Modules**: 
- Platform Dashboard
- Tenant Management
- Platform Users
- Domains
- Database Management
- System Authentication (MFA/SSO)
- Billing & Subscriptions (platform-level)

### Tenant Context  
**Purpose**: Tenant-specific business operations
**Users**: Tenant users (employees, managers, admins within an organization)
**Modules**:
- HRM (employees, leave, attendance, recruitment, performance, training, payroll)
- CRM
- Project Management
- Finance
- SCM (Supply Chain)
- POS (Point of Sale)
- Quality Management
- Compliance
- DMS (Document Management)
- IMS (Inventory Management)
- LMS (Learning Management)
- FMS (Fleet Management)

### Shared Context
**Purpose**: Common functionality used by both platform and tenant contexts
**Components**:
- Authentication base (login, logout, password reset)
- Profile management
- Notifications
- File uploads
- Common UI components
- Utilities and helpers

## Backend Reorganization

### Phase 1: Controllers
```
app/Http/Controllers/
├── Platform/              (Platform admin controllers)
│   ├── Dashboard/
│   ├── TenantManagement/
│   ├── UserManagement/
│   ├── Domain/
│   ├── Database/
│   ├── Authentication/    (MFA/SSO settings)
│   ├── Billing/
│   └── SystemMonitoring/
├── Tenant/                (Tenant business controllers)
│   ├── Dashboard/
│   ├── HRM/
│   │   ├── Employee/
│   │   ├── Leave/
│   │   ├── Attendance/
│   │   ├── Recruitment/
│   │   ├── Performance/
│   │   ├── Training/
│   │   └── Payroll/
│   ├── CRM/
│   ├── Finance/
│   ├── ProjectManagement/
│   ├── SCM/
│   ├── POS/
│   ├── Quality/
│   ├── Compliance/
│   ├── DMS/
│   ├── IMS/
│   ├── LMS/
│   └── FMS/
└── Shared/                (Common controllers)
    ├── Auth/
    ├── Profile/
    ├── Notification/
    └── Upload/
```

### Phase 2: Models
```
app/Models/
├── Platform/              (Platform models)
│   ├── Tenant.php
│   ├── Domain.php
│   ├── Plan.php
│   ├── Subscription.php
│   ├── PlatformUser.php
│   └── PlatformSetting.php
├── Tenant/                (Tenant business models)
│   ├── HRM/
│   ├── CRM/
│   ├── Finance/
│   ├── ProjectManagement/
│   ├── SCM/
│   ├── POS/
│   ├── Quality/
│   ├── Compliance/
│   ├── DMS/
│   ├── IMS/
│   ├── LMS/
│   └── FMS/
└── Shared/                (Shared models)
    ├── User.php
    ├── Role.php
    ├── Module.php
    └── Permission.php
```

### Phase 3: Services
```
app/Services/
├── Platform/
│   ├── TenantProvisioner.php
│   ├── BillingService.php
│   └── SystemMonitoringService.php
├── Tenant/
│   ├── HRM/
│   ├── CRM/
│   └── ...
└── Shared/
    ├── Auth/
    ├── Notification/
    └── Module/
```

### Phase 4: Policies
```
app/Policies/
├── Platform/
│   ├── TenantPolicy.php
│   ├── PlanPolicy.php
│   └── DomainPolicy.php
├── Tenant/
│   ├── HRM/
│   └── ...
└── Shared/
    ├── UserPolicy.php
    └── RolePolicy.php
```

## Frontend Reorganization

### Already Organized
- resources/js/Platform/ (exists)
- resources/js/Tenant/ (exists)
- resources/js/Shared/ (exists)

### Needs Review
Ensure all components in `resources/js/Components/` are properly categorized into Platform/Tenant/Shared.

## Implementation Strategy

### Step 1: Create New Directory Structure
Create all necessary subdirectories in Platform/Tenant/Shared contexts.

### Step 2: Move Files Incrementally
Move files in small batches:
1. Start with controllers
2. Then models
3. Then services
4. Finally policies

### Step 3: Update Namespaces
Update namespace declarations in moved files:
- `App\Http\Controllers\Platform\...`
- `App\Http\Controllers\Tenant\...`
- `App\Http\Controllers\Shared\...`

### Step 4: Update Imports
Update all import statements across the codebase to reflect new locations.

### Step 5: Update Routes
Update route files to use new controller namespaces.

### Step 6: Test
Test each phase thoroughly before proceeding to the next.

## Migration Guidelines

### Controllers to Move to Platform
- All controllers in `Admin/`
- All controllers in `Landlord/`
- Controllers in `Platform/` (already there)
- SystemMonitoringController.php

### Controllers to Move to Tenant
- AttendanceController.php
- LeaveController.php
- EmployeeController.php
- DepartmentController.php
- DesignationController.php
- Controllers in `HR/`
- Controllers in `CRM/`
- Controllers in `Finance/`
- Controllers in `SCM/`
- Controllers in `POS/`
- Controllers in `Quality/`
- Controllers in `Compliance/`
- Controllers in `ProjectManagement/`
- All module-specific controllers

### Controllers to Move to Shared
- Controllers in `Auth/` (base auth)
- ProfileController.php
- NotificationController.php
- ChunkedUploadController.php
- Controllers in `Public/`

## Risk Mitigation

1. **Incremental Approach**: Move files in small batches
2. **Testing**: Test after each batch
3. **Rollback Plan**: Git commits allow easy rollback
4. **Documentation**: Update documentation as we go
5. **Team Communication**: Inform team of changes

## Timeline

- Phase 1 (Controllers): 2-3 commits
- Phase 2 (Models): 2-3 commits  
- Phase 3 (Services): 1-2 commits
- Phase 4 (Policies): 1 commit
- Frontend Review: 1 commit
- Final Testing: 1 commit

Total: ~10-12 commits over this reorganization effort
