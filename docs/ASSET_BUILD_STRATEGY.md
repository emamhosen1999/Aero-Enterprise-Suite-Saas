# Asset Build Strategy

## Overview
The Aero monorepo supports two distinct build strategies depending on the deployment context.

---

## **Strategy 1: Monorepo Package-Level Builds**

Used when developing within the monorepo (`Aero-Enterprise-Suite-Saas/`).

### Package Build Configurations

#### **aero-core** (Tenant Applications)
```javascript
// packages/aero-core/vite.config.js
{
  input: ['resources/css/app.css', 'resources/js/app.jsx'],
  publicDirectory: '../../apps/standalone-host/public',
  outDir: '../../apps/standalone-host/public/build',
  port: 5173
}
```

**Usage:**
```bash
cd packages/aero-core
npm install
npm run dev   # Dev server on port 5173
npm run build # Build to apps/standalone-host/public/build
```

#### **aero-platform** (SaaS Admin)
```javascript
// packages/aero-platform/vite.config.js
{
  input: ['resources/css/app.css', 'resources/js/app.jsx'],
  publicDirectory: '../../apps/saas-host/public',
  outDir: '../../apps/saas-host/public/build',
  port: 5174
}
```

**Usage:**
```bash
cd packages/aero-platform
npm install
npm run dev   # Dev server on port 5174
npm run build # Build to apps/saas-host/public/build
```

#### **aero-hrm** (Module - Library Mode)
```javascript
// packages/aero-hrm/vite.config.js
{
  lib: {
    entry: 'resources/js/index.jsx',
    name: 'AeroHrm',
    formats: ['es'],
    fileName: 'aero-hrm.js'
  },
  outDir: 'dist',
  external: ['react', 'react-dom', '@inertiajs/react', '@heroui/react']
}
```

**Usage:**
```bash
cd packages/aero-hrm
npm install
npm run build # Build to dist/aero-hrm.js (ES module)
```

### When to Use Package-Level Builds
- ✅ Developing features within a specific package
- ✅ Testing package in isolation
- ✅ Working on monorepo's `apps/saas-host` or `apps/standalone-host`
- ✅ CI/CD pipelines that build packages separately

---

## **Strategy 2: Host App Unified Build**

Used when deploying to external host applications (like `aeos365`).

### Host App Configuration

The host app has a **single vite.config.js** that reads from ALL packages:

```javascript
// aeos365/vite.config.js
{
  input: [
    'vendor/aero/platform/resources/css/app.css',
    'vendor/aero/platform/resources/js/app.jsx'  // Entry point
  ],
  
  alias: {
    '@': 'vendor/aero/platform/resources/js',      // Platform
    '@core': 'vendor/aero/core/resources/js',      // Core (tenants)
    '@hrm': 'vendor/aero/hrm/resources/js',        // HRM module
    // ... other modules
  },
  
  // Output to host app's public directory
  outDir: 'public/build'
}
```

### Build Process

**1. Install Dependencies**
```bash
cd aeos365
composer install  # Symlinks vendor/aero/* packages
npm install       # Installs all frontend dependencies
```

**2. Build Assets**
```bash
# Option A: Use Laravel command
php artisan aero:build-assets

# Option B: Direct npm
npm run build

# Option C: Development mode with hot reload
php artisan aero:build-assets --watch
# or
npm run dev
```

**3. Result**
- Vite reads source files from `vendor/aero/*/resources`
- Compiles everything to `public/build/`
- Single manifest: `public/build/manifest.json`
- All assets bundled together optimally

### When to Use Host App Build
- ✅ Deploying to production
- ✅ Testing the complete SaaS application
- ✅ External host apps (outside monorepo)
- ✅ Docker containers
- ✅ Shared hosting environments

---

## **Comparison**

| Aspect | Package-Level | Host App Unified |
|--------|--------------|------------------|
| **Location** | `packages/aero-*/` | `aeos365/` (or any host) |
| **Entry Point** | Package's app.jsx | Platform's app.jsx |
| **Output** | `apps/*/public/build` | `public/build` |
| **Modules** | Build separately | Import via aliases |
| **Use Case** | Development | Deployment |
| **Speed** | Faster (smaller scope) | Slower (full app) |
| **Dependencies** | Package's package.json | Host's package.json |

---

## **Module Loading**

Modules (HRM, CRM, etc.) can be loaded two ways:

### **1. Compile-Time (SaaS Mode)**
Modules are bundled during build via aliases:
```javascript
// Host vite.config.js
alias: {
  '@hrm': 'vendor/aero/hrm/resources/js'
}

// Usage in components
import { EmployeeList } from '@hrm/Pages/EmployeeList';
```

### **2. Runtime (Standalone Mode)**
Modules are loaded dynamically as pre-built libraries:
```javascript
// Load HRM module at runtime
const hrmModule = await import('/modules/aero-hrm.js');
```

---

## **Deployment Workflow**

### **For SaaS (aeos365 or similar)**

```bash
# 1. Clone/pull repository
git clone [repo] aeos365
cd aeos365

# 2. Install backend dependencies
composer install --no-dev --optimize-autoloader

# 3. Install frontend dependencies
npm ci --production

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
