# Asset Build Strategy

## Overview

The Aero Enterprise Suite uses a **dual-mode architecture** supporting both SaaS (multi-tenant) and Standalone (single-tenant) deployments from the same codebase.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        DEPLOYMENT MODES                                  │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                    STANDALONE MODE                               │   │
│  │                  (apps/standalone-host)                          │   │
│  │                                                                  │   │
│  │   Packages: aero-core + aero-hrm + aero-crm + ...               │   │
│  │   Database: Single database (no tenancy)                        │   │
│  │   Auth: web guard only                                          │   │
│  │   Entry: vendor/aero/core/resources/js/app.jsx                  │   │
│  │   Use Case: Self-hosted, on-premise, single organization        │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                       SAAS MODE                                  │   │
│  │                    (apps/saas-host)                              │   │
│  │                                                                  │   │
│  │   Packages: aero-platform + aero-core + aero-hrm + aero-crm     │   │
│  │                                                                  │   │
│  │   ┌─────────────────┐    ┌──────────────────────────────────┐   │   │
│  │   │ LANDLORD DOMAIN │    │     TENANT SUBDOMAINS            │   │   │
│  │   │ admin.domain.com│    │ {tenant}.domain.com              │   │   │
│  │   │                 │    │                                   │   │   │
│  │   │ • Platform UI   │    │ • Core UI (users, settings)      │   │   │
│  │   │ • Tenant mgmt   │    │ • HRM, CRM, modules              │   │   │
│  │   │ • Billing       │    │ • Tenant-scoped data             │   │   │
│  │   │ • Central DB    │    │ • Per-tenant DB                  │   │   │
│  │   │                 │    │                                   │   │   │
│  │   │ Entry: platform │    │ Entry: core/app.jsx              │   │   │
│  │   │ /app.jsx        │    │ + module pages                   │   │   │
│  │   └─────────────────┘    └──────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Package Dependency Graph

```
                    ┌─────────────────┐
                    │  aero-platform  │
                    │   (SaaS only)   │
                    │                 │
                    │ • stancl/tenancy│
                    │ • cashier       │
                    │ • Admin UI      │
                    └────────┬────────┘
                             │ requires
                             ▼
┌──────────────┐     ┌─────────────────┐     ┌──────────────┐
│   aero-hrm   │────▶│    aero-core    │◀────│   aero-crm   │
│              │     │   (foundation)   │     │              │
│ • Employees  │     │                 │     │ • Contacts   │
│ • Attendance │     │ • User model    │     │ • Deals      │
│ • Leave      │     │ • Auth/RBAC     │     │ • Pipeline   │
│ • Payroll    │     │ • Module system │     │              │
└──────────────┘     │ • Base UI       │     └──────────────┘
                     │ • Inertia setup │
                     └─────────────────┘
```

---

## Host Application Structure

### SaaS Host (`apps/saas-host/saas/`)

```json
// composer.json
{
    "require": {
        "aero/platform": "@dev",  // Multi-tenancy orchestrator
        "aero/core": "@dev",      // Foundation
        "aero/hrm": "@dev"        // Business modules
    },
    "repositories": [{
        "type": "path",
        "url": "../../../packages/*",
        "options": { "symlink": true }
    }]
}
```

### Standalone Host (`apps/standalone-host/`)

```json
// composer.json
{
    "require": {
        "aero/core": "@dev",      // Foundation (NO platform!)
        "aero/hrm": "@dev"        // Business modules
    },
    "repositories": [{
        "type": "path",
        "url": "../../packages/*",
        "options": { "symlink": true }
    }]
}
```

---

## Vite Configuration Strategy

### Key Principles

1. **Dynamic Module Discovery**: Vite configs scan `vendor/aero/*/module.json` at build time
2. **Dual Entry Points** (SaaS): Both platform and core `app.jsx` are built
3. **Single Entry Point** (Standalone): Only core `app.jsx` is built
4. **Unified Dependencies**: Host app's `node_modules` used by all packages
5. **Symlink Support**: `preserveSymlinks: true` + `fs.allow` for vendor paths

### SaaS Host Vite Config

```javascript
// apps/saas-host/saas/vite.config.js
export default defineConfig({
    input: [
        // Platform entry (landlord domain)
        'vendor/aero/platform/resources/js/app.jsx',
        
        // Core entry (tenant domains)  
        'vendor/aero/core/resources/js/app.jsx',
    ],
    
    alias: {
        '@': 'vendor/aero/platform/resources/js',      // Platform (default)
        '@platform': 'vendor/aero/platform/resources/js',
        '@core': 'vendor/aero/core/resources/js',
        '@hrm': 'vendor/aero/hrm/resources/js',        // Dynamic
        '@crm': 'vendor/aero/crm/resources/js',        // Dynamic
        // ... auto-discovered from module.json
    }
});
```

### Standalone Host Vite Config

```javascript
// apps/standalone-host/vite.config.js
export default defineConfig({
    input: [
        // Core entry only (no platform)
        'vendor/aero/core/resources/js/app.jsx',
    ],
    
    alias: {
        '@': 'vendor/aero/core/resources/js',          // Core (default)
        '@core': 'vendor/aero/core/resources/js',
        '@hrm': 'vendor/aero/hrm/resources/js',        // Dynamic
        // ... auto-discovered from module.json
    }
});
```

---

## Module Contract (module.json)

Every module MUST have a `module.json` file at its root:

```json
{
    "name": "aero-hrm",
    "short_name": "hrm",
    "namespace": "Aero\\Hrm",
    "version": "1.0.0",
    "description": "Human Resource Management Module",
    "category": "business",
    
    "frontend": {
        "pages": "resources/js/Pages",
        "components": "resources/js/Components",
        "pagePrefix": "Hrm"
    },
    
    "exports": {
        "components": ["EmployeeCard", "LeaveCalendar"],
        "hooks": ["useEmployee", "useLeaveBalance"]
    },
    
    "dependencies": {
        "aero-core": "^1.0"
    },
    
    "permissions": [
        "hrm.employees.view",
        "hrm.employees.create"
    ],
    
    "config": {
        "enabled": true
    }
}
```

### Category Values

| Category | Description | Example Packages |
|----------|-------------|------------------|
| `foundation` | Core framework | aero-core |
| `landlord` | SaaS-only, platform management | aero-platform |
| `business` | Tenant-facing modules | aero-hrm, aero-crm |

---

## Build Commands

### Using the Build Script

```powershell
# Build both hosts
.\scripts\build-all.ps1

# Build SaaS host only
.\scripts\build-all.ps1 -Target saas

# Build Standalone host only  
.\scripts\build-all.ps1 -Target standalone

# Start dev server
.\scripts\build-all.ps1 -Target saas -Dev

# Install dependencies before building
.\scripts\build-all.ps1 -Install
```

### Manual Build

```bash
# SaaS Host
cd apps/saas-host/saas
composer install
npm install
npm run build

# Standalone Host
cd apps/standalone-host
composer install
npm install
npm run build
```

---

## Development Workflow

### Local Development (Monorepo)

1. **Symlinks are automatic**: Composer path repositories create symlinks
2. **HMR works**: Vite watches symlinked package files
3. **Single npm install**: Dependencies installed in host app only

```bash
# Start SaaS development
cd apps/saas-host/saas
composer install
npm install
npm run dev          # Vite dev server with HMR
php artisan serve    # Laravel server
```

### Adding a New Module

1. Create package in `packages/aero-{name}/`
2. Add `module.json` with required fields
3. Add to host's `composer.json`
4. Run `composer update`
5. Restart Vite dev server

---

## Inertia Page Resolution

### How Pages Are Resolved

1. Laravel controller returns: `Inertia::render('Hrm/Employees/Index', [...])`
2. Vite builds all pages from discovered modules
3. Frontend resolver matches `Hrm/Employees/Index` to the correct component

### Page Naming Convention

```
{ModulePrefix}/{FeatureGroup}/{PageName}
     │              │            │
     │              │            └── Index, Create, Edit, Show
     │              └── Employees, Attendance, Leave
     └── Hrm, Crm, Core (from module.json pagePrefix)
```

### Example Resolution

```javascript
// Inertia page name: "Hrm/Employees/Index"
// Resolved from: vendor/aero/hrm/resources/js/Pages/Employees/Index.jsx
```

---

## Cross-Module Imports

Modules can import from each other using the alias system:

```jsx
// In aero-crm component, importing from aero-core
import { PageHeader } from '@core/Components/PageHeader';

// In aero-crm component, importing from aero-hrm
import { EmployeeCard } from '@hrm/Components/EmployeeCard';

// WRONG: Never use relative paths to other packages
import { EmployeeCard } from '../../../aero-hrm/resources/js/Components/EmployeeCard';
```

---

## Troubleshooting

### Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| `Cannot find module '@hrm/...'` | Module not installed | Run `composer install` |
| HMR not working on vendor files | Symlinks not followed | Check `server.watch.followSymlinks: true` |
| Duplicate React instances | Package bundles own React | Add react to `resolve.alias` |
| Module not discovered | Missing `module.json` | Create file in package root |
| Build fails with fs errors | Vite can't access vendor | Add to `server.fs.allow` |

### Verify Setup

```bash
# Check symlinks are created
ls -la vendor/aero/

# Check modules are discovered
node -e "console.log(require('./scripts/discover-modules.js').discoverModules('vendor/aero'))"
```

# 4. Build assets
npm run build

# 5. Optimize Laravel
php artisan config:cache
php artisan route:cache
php artisan view:cache

# 6. Set permissions
chmod -R 755 storage bootstrap/cache
```

**Deploy:**
- `vendor/` (Composer packages with symlinks)
- `public/build/` (compiled assets)
- `.env` (environment config)

### **For Standalone Mode**

```bash
# 1-5: Same as SaaS

# 6. Copy pre-built module libraries to public
cp vendor/aero/hrm/dist/aero-hrm.js public/modules/
cp vendor/aero/crm/dist/aero-crm.js public/modules/
# ... other modules

# 7. Runtime module loading handles the rest
```

---

## **Development Commands**

### **In Monorepo**
```bash
# Build all packages
./scripts/build-all.ps1

# Build specific package
cd packages/aero-platform && npm run build

# Dev mode for specific package
cd packages/aero-core && npm run dev
```

### **In Host App**
```bash
# Development with hot reload
php artisan aero:build-assets --watch
# or
npm run dev

# Production build
php artisan aero:build-assets --production
# or
npm run build
```

---

## **Key Takeaways**

1. **Package builds** are for monorepo development
2. **Host app builds** are for deployment
3. Each package has its own vite.config.js for isolation
4. Host app has ONE vite.config.js that reads from all packages
5. Modules can be compiled OR loaded at runtime
6. No manual asset copying needed - Vite handles everything through aliases

---

## **Troubleshooting**

### Assets not found in host app
```bash
# Ensure packages are installed
composer install

# Ensure symlinks are working
ls -la vendor/aero/

# Rebuild assets
php artisan aero:build-assets --production
php artisan optimize:clear
```

### Vite can't resolve module
```bash
# Check vite.config.js aliases
# Ensure all packages are in vendor/aero/
# Verify package.json has all dependencies
npm install
```

### Hot reload not working
```bash
# Kill any processes on the port
lsof -ti:5173 | xargs kill -9  # Linux/Mac
Get-Process -Id (Get-NetTCPConnection -LocalPort 5173).OwningProcess | Stop-Process  # Windows

# Start fresh
npm run dev
```
