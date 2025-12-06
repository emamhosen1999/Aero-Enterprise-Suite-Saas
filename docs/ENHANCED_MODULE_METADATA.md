# Enhanced Module Metadata System

**Date**: 2025-12-05  
**Version**: 1.0  
**Status**: Implemented  
**Phase**: Phase 2 - Module Reorganization

---

## Overview

Enhanced the module system with comprehensive metadata to support better plan enforcement, dependency management, versioning, and licensing control. This provides a foundation for advanced features like usage limits, feature flags, and automatic dependency resolution.

---

## New Metadata Fields

### **1. Version** (`version`)

**Type**: String (semver format)  
**Example**: `'1.0.0'`, `'2.3.1'`  
**Purpose**: Track module versions for:
- Backward compatibility checks
- Migration requirements
- Deprecation warnings
- API versioning

**Usage**:
```php
'version' => '1.0.0',
```

### **2. Minimum Plan** (`min_plan`)

**Type**: String | null  
**Options**: `null`, `'free'`, `'basic'`, `'professional'`, `'enterprise'`  
**Purpose**: Define minimum subscription plan required

**Examples**:
```php
'min_plan' => null,            // Available in all plans (core modules)
'min_plan' => 'basic',         // Requires Basic plan or higher
'min_plan' => 'professional',  // Requires Professional or Enterprise
'min_plan' => 'enterprise',    // Enterprise only
```

**Access Control**:
```php
// In middleware or service
if ($module['min_plan'] && !$tenant->hasPlan($module['min_plan'])) {
    abort(403, 'This module requires ' . $module['min_plan'] . ' plan or higher');
}
```

### **3. License Type** (`license_type`)

**Type**: String  
**Options**: `'core'`, `'standard'`, `'addon'`, `'enterprise'`  
**Purpose**: Categorize modules for licensing and pricing

**Definitions**:
- **`core`**: Essential platform features, included in all plans
- **`standard`**: Standard business modules, included in paid plans
- **`addon`**: Optional add-ons, purchased separately
- **`enterprise`**: Enterprise-only features, special licensing

**Examples**:
```php
'license_type' => 'core',       // Platform Dashboard, Tenants
'license_type' => 'standard',   // HRM, CRM (main business modules)
'license_type' => 'addon',      // DMS, Quality, Compliance
'license_type' => 'enterprise', // Advanced analytics, custom integrations
```

**Pricing Strategy**:
```
Free Plan:      core modules only
Basic Plan:     core + basic standard modules
Professional:   core + all standard + selected addons
Enterprise:     core + standard + addons + enterprise features
```

### **4. Dependencies** (`dependencies`)

**Type**: Array of module codes  
**Purpose**: Define required modules for functionality

**Examples**:
```php
'dependencies' => [],                      // No dependencies
'dependencies' => ['core'],                // Requires core module
'dependencies' => ['tenants', 'subscriptions'],  // Multiple dependencies
```

**Use Cases**:
- Automatic module activation (activate dependencies first)
- Prevent deactivation if dependents exist
- Display warnings in UI
- Installation validation

**Implementation**:
```php
// Check if dependencies are met
public function canActivateModule($moduleCode, $tenant): bool
{
    $module = $this->getModule($moduleCode);
    
    foreach ($module['dependencies'] as $dependency) {
        if (!$tenant->hasModule($dependency)) {
            return false;
        }
    }
    
    return true;
}
```

### **5. Release Date** (`release_date`)

**Type**: String (ISO date: YYYY-MM-DD)  
**Purpose**: Track when module was released

**Examples**:
```php
'release_date' => '2024-01-01',  // Original release
'release_date' => '2025-12-05',  // Newly added module
```

**Usage**:
- Show "New" badge for recently released modules
- Filter modules by release date
- Track module adoption over time
- Calculate module age for deprecation planning

---

## Module Classification

### Platform Admin Modules

| Module | License Type | Min Plan | Dependencies |
|--------|--------------|----------|--------------|
| platform-dashboard | core | null | [] |
| tenants | core | null | [] |
| platform-users | core | null | [] |
| platform-roles | core | null | [] |
| subscriptions | core | null | ['tenants'] |
| notifications | core | null | [] |
| file-manager | core | null | [] |
| audit-logs | core | null | [] |
| system-settings | core | null | [] |
| developer-tools | core | null | [] |
| platform-analytics | core | null | [] |
| platform-integrations | core | null | [] |
| platform-support | core | null | [] |
| **platform-onboarding** | **core** | **null** | **['tenants', 'subscriptions']** |

**Total Platform Modules**: 14  
**All are core**: ✅ Essential for platform operations

### Tenant Modules - Core

| Module | License Type | Min Plan | Dependencies |
|--------|--------------|----------|--------------|
| core | core | null | [] |

### Tenant Modules - Standard

| Module | License Type | Min Plan | Dependencies |
|--------|--------------|----------|--------------|
| hrm | standard | basic | ['core'] |
| crm | standard | basic | ['core'] |
| erp | standard | basic | ['core'] |
| project | standard | basic | ['core'] |
| finance | standard | basic | ['core'] |
| inventory | standard | professional | ['core'] |
| ecommerce | standard | professional | ['core'] |
| analytics | standard | professional | ['core'] |
| integrations | standard | basic | ['core'] |
| support | standard | basic | ['core'] |

### Tenant Modules - Add-ons

| Module | License Type | Min Plan | Dependencies |
|--------|--------------|----------|--------------|
| **dms** | **addon** | **professional** | **[]** |
| **quality** | **addon** | **professional** | **[]** |
| **compliance** | **addon** | **professional** | **[]** |

**Note**: Add-on modules can be purchased separately and require Professional plan or higher.

---

## Future Metadata Fields (Planned)

### **6. Feature Flags** (Phase 3)

**Purpose**: Control feature rollout and experimental features

```php
'feature_flags' => [
    'beta' => false,
    'experimental' => false,
    'early_access' => false,
    'deprecated' => false
],
```

### **7. Usage Limits** (Phase 3)

**Purpose**: Enforce plan-based usage limits

```php
'limits' => [
    'max_users' => 10,              // Max users for this module
    'max_records' => 1000,          // Max records (e.g., products)
    'max_storage_mb' => 5000,       // Storage limit
    'api_calls_per_month' => 10000, // API rate limit
    'email_sends_per_month' => 5000 // Email quota
],
```

### **8. Documentation URL** (Phase 3)

**Purpose**: Link to module documentation

```php
'documentation_url' => '/docs/hrm',
'help_url' => 'https://support.example.com/hrm',
```

### **9. Integration Metadata** (Phase 3)

**Purpose**: Define integration capabilities

```php
'integrations' => [
    'finance' => [
        'required' => false,
        'recommended' => true,
        'description' => 'Integration with Finance module for accounting',
    ]
],
```

---

## Implementation Examples

### Example 1: Check Module Access with Plan Enforcement

```php
use Illuminate\Support\Facades\Config;

class ModuleAccessService
{
    public function canAccessModule(Tenant $tenant, string $moduleCode): bool
    {
        // Get module configuration
        $modules = Config::get('modules.hierarchy');
        $module = collect($modules)->firstWhere('code', $moduleCode);
        
        if (!$module) {
            return false;
        }
        
        // Check if module is in tenant's enabled modules
        if (!in_array($moduleCode, $tenant->modules)) {
            return false;
        }
        
        // Check plan requirement
        if ($module['min_plan'] && !$this->hasSufficientPlan($tenant, $module['min_plan'])) {
            return false;
        }
        
        // Check dependencies
        foreach ($module['dependencies'] as $dependency) {
            if (!in_array($dependency, $tenant->modules)) {
                return false;
            }
        }
        
        return true;
    }
    
    private function hasSufficientPlan(Tenant $tenant, string $requiredPlan): bool
    {
        $planHierarchy = ['free', 'basic', 'professional', 'enterprise'];
        $tenantPlanIndex = array_search($tenant->plan->slug, $planHierarchy);
        $requiredPlanIndex = array_search($requiredPlan, $planHierarchy);
        
        return $tenantPlanIndex !== false && $tenantPlanIndex >= $requiredPlanIndex;
    }
}
```

### Example 2: Display Module Cards with Metadata

```jsx
// React component
import { Card, Badge, Button } from '@heroui/react';

export default function ModuleCard({ module, tenant }) {
    const canAccess = useMemo(() => {
        // Check if tenant's plan meets minimum requirement
        if (module.min_plan && tenant.plan_level < getPlanLevel(module.min_plan)) {
            return false;
        }
        
        // Check dependencies
        return module.dependencies.every(dep => tenant.modules.includes(dep));
    }, [module, tenant]);
    
    const isNew = useMemo(() => {
        const releaseDate = new Date(module.release_date);
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return releaseDate > thirtyDaysAgo;
    }, [module.release_date]);
    
    return (
        <Card>
            <CardHeader>
                <div className="flex items-center gap-2">
                    <h3>{module.name}</h3>
                    {isNew && <Badge color="success">New</Badge>}
                    {module.license_type === 'addon' && <Badge color="warning">Add-on</Badge>}
                </div>
            </CardHeader>
            <CardBody>
                <p>{module.description}</p>
                
                {module.min_plan && (
                    <p className="text-sm text-default-500">
                        Requires: {module.min_plan} plan or higher
                    </p>
                )}
                
                {module.dependencies.length > 0 && (
                    <p className="text-sm text-default-500">
                        Dependencies: {module.dependencies.join(', ')}
                    </p>
                )}
            </CardBody>
            <CardFooter>
                <Button 
                    isDisabled={!canAccess}
                    color={canAccess ? 'primary' : 'default'}
                >
                    {canAccess ? 'Activate' : 'Upgrade Required'}
                </Button>
            </CardFooter>
        </Card>
    );
}
```

### Example 3: Module Dependency Resolution

```php
class ModuleDependencyResolver
{
    /**
     * Get all modules that need to be activated for a given module
     */
    public function resolveDependencies(string $moduleCode): array
    {
        $module = $this->getModule($moduleCode);
        $required = [$moduleCode];
        
        foreach ($module['dependencies'] as $dependency) {
            // Recursively resolve dependencies
            $required = array_merge($required, $this->resolveDependencies($dependency));
        }
        
        // Remove duplicates and return
        return array_unique($required);
    }
    
    /**
     * Check if a module can be deactivated (no dependents)
     */
    public function canDeactivate(Tenant $tenant, string $moduleCode): bool
    {
        $allModules = Config::get('modules.hierarchy');
        
        foreach ($allModules as $module) {
            // Skip if not active
            if (!in_array($module['code'], $tenant->modules)) {
                continue;
            }
            
            // Check if this active module depends on the one we want to deactivate
            if (in_array($moduleCode, $module['dependencies'])) {
                return false;  // Cannot deactivate, another module depends on it
            }
        }
        
        return true;
    }
}
```

---

## Migration Guide

### For Existing Modules

If you have custom modules or need to add metadata to existing modules, follow this pattern:

```php
// Before
[
    'code' => 'my-module',
    'name' => 'My Module',
    'description' => 'Description',
    'icon' => 'IconName',
    'route_prefix' => '/prefix',
    'category' => 'category',
    'priority' => 1,
    'is_core' => false,
    'is_active' => true,
]

// After (with enhanced metadata)
[
    'code' => 'my-module',
    'name' => 'My Module',
    'description' => 'Description',
    'icon' => 'IconName',
    'route_prefix' => '/prefix',
    'category' => 'category',
    'priority' => 1,
    'is_core' => false,
    'is_active' => true,
    
    // NEW: Enhanced metadata
    'version' => '1.0.0',
    'min_plan' => 'basic',  // or null for all plans
    'license_type' => 'standard',  // or 'core', 'addon', 'enterprise'
    'dependencies' => [],  // array of module codes
    'release_date' => '2024-01-01',
]
```

---

## Benefits

### For Development Team

1. **Better Code Organization**: Clear module boundaries and dependencies
2. **Easier Testing**: Mock dependencies, test in isolation
3. **Version Management**: Track breaking changes, manage migrations
4. **Documentation**: Metadata serves as inline documentation

### For Product Team

1. **Flexible Pricing**: Different license types enable creative bundling
2. **Upsell Paths**: Clear plan requirements show upgrade benefits
3. **Feature Rollout**: Foundation for feature flags and gradual rollout
4. **Analytics**: Track module adoption by plan, license type, etc.

### For Users

1. **Clear Requirements**: Know exactly what's needed to use a module
2. **Transparent Pricing**: Understand what's included in each plan
3. **No Surprises**: Dependencies and requirements shown upfront
4. **Better Experience**: New badges, version info, help links

---

## Validation & Enforcement

### Backend Validation

```php
// In module middleware
class ModuleAccessMiddleware
{
    public function handle($request, Closure $next, string $moduleAccess)
    {
        $tenant = tenant();
        $moduleCode = explode(',', $moduleAccess)[0];
        
        // Get module metadata
        $module = $this->getModuleMetadata($moduleCode);
        
        // Check plan requirement
        if ($module['min_plan'] && !$tenant->hasSufficientPlan($module['min_plan'])) {
            return response()->json([
                'error' => 'Module requires ' . $module['min_plan'] . ' plan',
                'upgrade_url' => route('billing.upgrade')
            ], 403);
        }
        
        // Check dependencies
        foreach ($module['dependencies'] as $dep) {
            if (!$tenant->hasModule($dep)) {
                return response()->json([
                    'error' => 'Missing dependency: ' . $dep,
                    'required_modules' => $module['dependencies']
                ], 403);
            }
        }
        
        return $next($request);
    }
}
```

### Frontend Validation

```javascript
// Module access helper
export function canAccessModule(module, tenant) {
    // Check if module is enabled
    if (!tenant.modules.includes(module.code)) {
        return { canAccess: false, reason: 'not_enabled' };
    }
    
    // Check plan requirement
    if (module.min_plan && !hasSufficientPlan(tenant.plan, module.min_plan)) {
        return { canAccess: false, reason: 'insufficient_plan', required: module.min_plan };
    }
    
    // Check dependencies
    const missingDeps = module.dependencies.filter(dep => !tenant.modules.includes(dep));
    if (missingDeps.length > 0) {
        return { canAccess: false, reason: 'missing_dependencies', missing: missingDeps };
    }
    
    return { canAccess: true };
}
```

---

## Roadmap

### Phase 2 (Current) - ✅ IMPLEMENTED
- [x] Add version, min_plan, license_type, dependencies, release_date
- [x] Update 10+ key modules with metadata
- [x] Create documentation and examples

### Phase 3 (Next 1-2 months)
- [ ] Add feature_flags support
- [ ] Add usage_limits enforcement
- [ ] Add documentation_url links
- [ ] Build dependency resolver service
- [ ] Create admin UI for module management

### Phase 4 (Future)
- [ ] Automatic dependency activation
- [ ] Module marketplace integration
- [ ] A/B testing with feature flags
- [ ] Usage analytics per module
- [ ] Module versioning with migrations

---

## Summary

Enhanced metadata system provides:
- ✅ **Better Plan Enforcement**: Clear min_plan requirements
- ✅ **Flexible Licensing**: Four license types for different monetization
- ✅ **Dependency Management**: Explicit dependencies prevent issues
- ✅ **Version Tracking**: Support for upgrades and migrations
- ✅ **Release Tracking**: Know when features were added

This creates a solid foundation for advanced features like usage limits, feature flags, and automatic dependency resolution in future phases.

---

**Document Version**: 1.0  
**Last Updated**: 2025-12-05  
**Status**: Implemented (10+ modules updated)  
**Next Review**: After Phase 3 implementation
