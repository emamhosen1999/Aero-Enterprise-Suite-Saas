# Aero Multi-Package Architecture Implementation Guide

## Overview
This guide implements the complete multi-package architecture with three independent systems:
- **aero-core**: Foundation package (User, Auth, Roles, Modules)
- **aero-hrm**: HRM Module package (depends on aero-core)
- **aero-platform**: Platform Management (independent landlord system)

## Implementation Status

### ✅ Phase 1: Directory Structure
- [x] aero-core directories created
- [ ] Core models to create
- [ ] Core services to create
- [ ] Core layouts to create
- [ ] Core config/modules.php

### 🔄 Phase 2: Core Files Creation
Due to the extensive number of files (100+ files across 3 packages), I'll create a structured implementation plan.

## Key Files to Create

### aero-core Package (Foundation)

#### 1. Core Models (src/Models/)
```
✓ User.php - Extracted from platform
✓ Role.php - Spatie role model
✓ Permission.php - Spatie permission model
✓ Module.php - Module definition
✓ Submodule.php - Submodule definition
✓ Component.php - Component definition
✓ Action.php - Action (permission) definition
✓ RoleModuleAccess.php - Role-module access pivot
```

#### 2. Service Provider (src/Providers/)
```
✓ AeroCoreServiceProvider.php - Main service provider
  - Register routes
  - Register middleware
  - Register policies
  - Publish assets
  - Publish migrations
```

#### 3. Middleware (src/Http/Middleware/)
```
✓ TenantSetupMiddleware.php - Tenant context resolution
✓ ModuleAccessMiddleware.php - Module access control
✓ EnsureUserHasRole.php - Role verification
```

#### 4. Services (src/Services/)
```
✓ ModuleAccessService.php - Module access logic
✓ RolePermissionService.php - Role permission management
✓ TenantService.php - Tenant operations
✓ AuthenticationService.php - Auth operations
```

#### 5. Traits (src/Traits/)
```
✓ TenantScoped.php - Automatic tenant scoping
✓ HasModuleAccess.php - Module access helpers
✓ HasRolePermission.php - Role permission helpers
```

#### 6. Layouts (resources/js/Layouts/)
```
✓ AuthenticatedLayout.jsx - Main authenticated layout
✓ Sidebar.jsx - Navigation sidebar
✓ Header.jsx - Top header
✓ GuestLayout.jsx - Guest layout
```

#### 7. Navigation (resources/js/)
```
✓ pages.jsx - Tenant navigation menu structure
```

#### 8. Routes (routes/)
```
✓ web.php - Core routes (auth, profile, settings)
```

#### 9. Config (config/)
```
✓ modules.php - Core module definitions
✓ aero-core.php - Package configuration
```

#### 10. Migrations (database/migrations/)
```
✓ create_users_table.php
✓ create_password_reset_tokens_table.php
✓ create_permission_tables.php (Spatie)
✓ create_modules_table.php
✓ create_submodules_table.php
✓ create_components_table.php
✓ create_actions_table.php
✓ create_role_module_access_table.php
```

### aero-hrm Package Updates

#### Files to Update
```
✓ composer.json - Add "aero/core": "^1.0" dependency
✓ All controllers - Replace App\Models\Shared\User with Aero\Core\Models\User
✓ All models - Replace App\Models\Shared\User with Aero\Core\Models\User
✓ All services - Replace App\Models\Shared\User with Aero\Core\Models\User
✓ All policies - Replace App\Models\Shared\User with Aero\Core\Models\User
```

#### Files to Create
```
✓ config/modules.php - HRM-specific module hierarchy
✓ resources/js/pages.jsx - HRM navigation menu
```

### aero-platform Package (New)

#### 1. Landlord Models (app/Models/Landlord/)
```
✓ LandlordUser.php - Platform admin user
✓ LandlordRole.php - Platform admin role
✓ LandlordPermission.php - Platform admin permission
✓ Tenant.php - Tenant management
✓ Domain.php - Domain management
✓ Plan.php - Subscription plans
✓ Subscription.php - Tenant subscriptions
✓ Invoice.php - Billing invoices
```

#### 2. Controllers (app/Http/Controllers/)
```
✓ Admin/ - Platform admin controllers
✓ Landlord/ - Billing/subscription controllers
✓ Platform/ - Public registration controllers
```

#### 3. Layouts (resources/js/Admin/Layouts/)
```
✓ AdminLayout.jsx - Platform admin layout
✓ AdminSidebar.jsx - Admin navigation
✓ AdminHeader.jsx - Admin header
```

#### 4. Navigation (resources/js/Admin/)
```
✓ admin_pages.jsx - Platform admin navigation menu
```

#### 5. Routes (routes/)
```
✓ admin.php - Platform admin routes
✓ landlord.php - Billing/subscription routes
✓ platform.php - Public registration routes
```

#### 6. Config (config/)
```
✓ modules.php - Platform module registry (includes aero-core + modules)
✓ landlord.php - Landlord-specific configuration
```

#### 7. Migrations (database/migrations/)
```
✓ create_landlord_users_table.php
✓ create_landlord_permission_tables.php (Spatie)
✓ create_tenants_table.php
✓ create_domains_table.php
✓ create_plans_table.php
✓ create_subscriptions_table.php
✓ create_invoices_table.php
```

## Next Steps

### Immediate Actions Needed:

1. **Create Core User Model**
   - Extract from platform/app/Models/Shared/User.php
   - Place in aero-core/src/Models/User.php
   - Change namespace to Aero\Core\Models

2. **Create Core Service Provider**
   - Register routes, middleware, policies
   - Publish assets and migrations

3. **Create Module System Models**
   - Module, Submodule, Component, Action
   - With proper relationships

4. **Extract Layouts to aero-core**
   - Sidebar.jsx, Header.jsx from platform
   - Place in aero-core/resources/js/Layouts/

5. **Create Navigation Files**
   - pages.jsx for aero-core
   - pages.jsx for aero-hrm (HRM-specific)
   - admin_pages.jsx for aero-platform

6. **Create Module Configs**
   - config/modules.php for aero-core (core modules)
   - config/modules.php for aero-hrm (HRM modules)
   - config/modules.php for aero-platform (all modules registry)

7. **Update aero-hrm Dependencies**
   - Find/replace all User model references
   - Update composer.json

8. **Create Landlord System**
   - Independent auth for platform admins
   - Separate models, controllers, layouts

## File Count Estimate

- **aero-core**: ~80 files
- **aero-hrm updates**: ~50 files
- **aero-platform**: ~100 files

**Total**: ~230 files to create/modify

## Execution Plan

Given the extensive scope, I recommend:

1. ✅ **Start with aero-core foundation** (highest priority)
2. ⏳ **Update aero-hrm** to use aero-core (enables standalone HRM)
3. ⏳ **Create aero-platform** (enables multi-module platform)

Would you like me to:
A) Continue creating files systematically (will take multiple iterations)
B) Create a comprehensive migration script
C) Focus on critical path files first

## Critical Path Files (Priority Order)

### Priority 1: Core Foundation
1. aero-core/src/Models/User.php
2. aero-core/src/Providers/AeroCoreServiceProvider.php
3. aero-core/src/Traits/TenantScoped.php
4. aero-core/config/modules.php

### Priority 2: Module System
5. aero-core/src/Models/Module.php
6. aero-core/src/Models/Submodule.php
7. aero-core/src/Models/Component.php
8. aero-core/src/Models/Action.php
9. aero-core/src/Services/ModuleAccessService.php

### Priority 3: Layouts & Navigation
10. aero-core/resources/js/Layouts/Sidebar.jsx
11. aero-core/resources/js/Layouts/Header.jsx
12. aero-core/resources/js/pages.jsx
13. aero-core/routes/web.php

### Priority 4: HRM Updates
14. aero-hrm/composer.json (add aero-core dependency)
15. aero-hrm/config/modules.php
16. aero-hrm/resources/js/pages.jsx
17. Find/replace User model references (36 files)

### Priority 5: Platform Creation
18. aero-platform structure
19. Landlord models
20. Admin layouts
21. admin_pages.jsx

## Implementation Strategy

Due to the large number of files, I'll create them in logical groups:

**Batch 1**: Core models + service provider
**Batch 2**: Module system models + services
**Batch 3**: Middleware + traits
**Batch 4**: Layouts + navigation
**Batch 5**: HRM updates
**Batch 6**: Platform creation

Should I proceed with Batch 1 (Core models + service provider)?
