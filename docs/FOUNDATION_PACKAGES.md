# Foundation Packages Architecture

## Overview
The Aero Enterprise Suite uses a layered architecture with **foundation packages** and **product packages**.

## Foundation Packages (Hidden from UI)

Foundation packages provide core infrastructure and are NOT shown as "products" or "included modules" to users.

### 1. **aero-core**
- **Purpose**: Core framework functionality
- **Includes**: Authentication, User Management, Roles, Permissions, Dashboard, Settings, Audit Logs, Notifications
- **Scope**: `tenant` - Available in both SaaS and Standalone modes
- **Config**: `is_core => true` in `packages/aero-core/config/module.php`

### 2. **aero-platform**
- **Purpose**: Multi-tenant SaaS platform functionality
- **Includes**: Landlord admin, Tenant management, Plans, Subscriptions, Billing, Public registration
- **Scope**: `platform` - Only used in SaaS mode
- **Config**: `is_core => true` in `packages/aero-platform/config/module.php`

### 3. **aero-ui**
- **Purpose**: Shared UI components and themes
- **Includes**: React components, Inertia pages, Layouts, Theme system
- **Note**: No module config (pure UI package)

### 4. **aero-hrmac**
- **Purpose**: Human Resource Management Accounting foundation
- **Includes**: Payroll accounting integrations, salary calculations
- **Note**: No module config (foundation library for HRM)

## Product Packages (Visible in UI)

Product packages are actual business modules shown to users:

- **aero-hrm**: Human Resource Management
- **aero-crm**: Customer Relationship Management  
- **aero-finance**: Finance & Accounting
- **aero-dms**: Document Management System
- **aero-compliance**: Compliance Management
- **aero-pos**: Point of Sale
- **aero-scm**: Supply Chain Management
- **aero-project**: Project Management
- **aero-ims**: Inventory Management System
- **aero-quality**: Quality Management
- **aero-rfi**: Request for Information

Each product module has `is_core => false` in their `config/module.php`.

## Implementation

### Installation Wizard
The `UnifiedInstallationController::getInstalledModules()` method filters out foundation packages:

```php
$foundationPackages = ['core', 'platform', 'ui', 'hrmac'];

foreach ($packages as $package) {
    $name = basename($package);
    
    // Only include actual product modules
    if (!in_array($name, $foundationPackages)) {
        $modules[] = [
            'code' => $name,
            'name' => ucfirst(str_replace('-', ' ', $name)),
        ];
    }
}
```

### Module Sync
The `php artisan module:sync` command respects the `is_core` flag from `config/module.php`:
- Core modules (`is_core => true`) are always available
- Product modules (`is_core => false`) are shown in module listings

### Database Schema
The `modules` table has an `is_core` boolean column:
- Core/foundation modules: `is_core = 1`
- Product modules: `is_core = 0`

## Mode-Specific Foundation

### Standalone Mode Foundation
- aero-core ✅
- aero-ui ✅
- aero-hrmac ✅

### SaaS Mode Foundation
- aero-core ✅
- aero-platform ✅
- aero-ui ✅
- aero-hrmac ✅

## Usage Guidelines

1. **Never show foundation packages** in "Included Modules" or "Available Products" UI
2. **Foundation packages are always installed** and cannot be disabled
3. **Product packages can be enabled/disabled** based on subscription plans (SaaS) or configuration (Standalone)
4. **New foundation packages** must be added to the filter array in `UnifiedInstallationController::getInstalledModules()`
5. **New product packages** must have `is_core => false` in their `config/module.php`
