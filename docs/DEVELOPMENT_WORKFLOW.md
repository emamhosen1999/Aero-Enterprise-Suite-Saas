# Development Workflow Guide

This guide explains how to develop with the Aero monorepo structure.

## 📁 Workspace Structure

```
Aero-Enterprise-Suite-Saas/
├── apps/                    # Host Applications (Simulators)
│   ├── saas-host/          # Full SaaS with all modules + multi-tenancy
│   └── standalone-host/    # Standalone HRM (Core + HRM only)
│
├── packages/                # Source Code (Packages)
│   ├── aero-core/          # Core: Auth, React Host, Base Logic
│   ├── aero-platform/      # SaaS Engine: Stancl/Tenancy, Billing
│   ├── aero-hrm/           # HRM Module
│   ├── aero-crm/           # CRM Module
│   └── ... (other modules)
│
└── scripts/                 # Build Pipeline
    ├── build-release.sh    # Production build (Bash)
    ├── build-release.ps1   # Production build (PowerShell)
    └── build-module.sh     # Individual module build
```

## 🔧 Initial Setup

### 1. Install Dependencies for Host Apps

**For SaaS Host (Full Platform):**
```bash
cd apps/saas-host
composer install
npm install
```

**For Standalone Host (HRM Only):**
```bash
cd apps/standalone-host
composer install
npm install
```

### 2. Verify Package Linking

The `composer.json` files in both hosts use **path repositories with symlinks**:

```json
"repositories": [
    {
        "type": "path",
        "url": "../../packages/*",
        "options": { "symlink": true }
    }
]
```

This means:
- ✅ Changes in `packages/aero-hrm/src/Controller.php` are **instantly reflected** in both apps
- ✅ No need to run `composer update` after every change
- ✅ All packages are symlinked from `packages/` to `apps/*/vendor/aero/`

## 🎨 Frontend Development (The Hybrid Watcher)

You need **TWO watchers** running simultaneously:

### Terminal 1: Core Watcher (The Host)

This serves the React application and core pages:

```bash
cd packages/aero-core
npm run dev
```

This runs Vite in **host mode** and:
- Serves at `http://localhost:5173`
- Provides React, ReactDOM, Inertia
- Hot-reloads core components

### Terminal 2: Module Watcher (The Guest)

This compiles modules in **library mode**:

```bash
# For HRM Module
cd packages/aero-hrm
npm run build -- --watch

# For CRM Module (in another terminal)
cd packages/aero-crm
npm run build -- --watch
```

This:
- Compiles to `dist/aero-hrm.umd.js`
- Externalizes React dependencies
- Auto-recompiles on file changes
- The core's `app.blade.php` picks up changes on refresh

### Running from a Host App

Alternatively, run the development server from a host app:

```bash
cd apps/saas-host
composer run dev
# This runs Laravel server + Queue + Vite watcher
```

## 🏗️ Module Development Pattern

### 1. Creating a New Module Component

**File:** `packages/aero-hrm/resources/js/Pages/EmployeeList.jsx`

```jsx
import React from 'react';
import { Head } from '@inertiajs/react';
import { Card, Button } from '@heroui/react';

export default function EmployeeList({ employees }) {
    return (
        <>
            <Head title="Employees" />
            <Card>
                <h1>Employee List</h1>
                {/* Your component code */}
            </Card>
        </>
    );
}
```

**Controller:** `packages/aero-hrm/src/Http/Controllers/EmployeeController.php`

```php
namespace Aero\HRM\Http\Controllers;

use Inertia\Inertia;

class EmployeeController extends Controller
{
    public function index()
    {
        return Inertia::render('HRM/EmployeeList', [
            'employees' => Employee::all()
        ]);
    }
}
```

### 2. Module Entry Point

**File:** `packages/aero-hrm/resources/js/index.jsx`

```jsx
// Export all pages for dynamic loading
export { default as EmployeeList } from './Pages/EmployeeList';
export { default as EmployeeForm } from './Pages/EmployeeForm';
// ... more exports
```

### 3. Vite Config for Library Mode

Each module needs a `vite.config.js` with externalization:

```javascript
export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      entry: path.resolve(__dirname, 'resources/js/index.jsx'),
      name: 'AeroHrm',
      formats: ['umd', 'es'],
      fileName: (format) => `aero-hrm.${format}.js`,
    },
    rollupOptions: {
      external: [
        'react',
        'react-dom',
        '@inertiajs/react',
        '@heroui/react',
      ],
      output: {
        globals: {
          'react': 'React',
          'react-dom': 'ReactDOM',
          '@inertiajs/react': 'InertiaReact',
          '@heroui/react': 'HeroUI',
        },
      },
    },
  },
});
```

## 🧪 Testing Changes

### Backend Changes
```bash
cd apps/saas-host
php artisan test --filter=EmployeeTest
```

### Frontend Changes
1. Save your file in `packages/aero-hrm/resources/js/Pages/`
2. Module watcher auto-compiles to `dist/`
3. Refresh browser at `http://localhost:5173`
4. Changes appear instantly (with HMR)

## 📦 Building for Production

### Build All Assets

```bash
# Linux/Mac
./scripts/build-release.sh 1.0.0

# Windows
.\scripts\build-release.ps1 -Version "1.0.0"
```

This creates:
- `dist/Aero_HRM_Installer_v1.0.0.zip` - Full installer with vendor (50+ MB)
- `dist/Aero_CRM_Module_v1.0.0.zip` - Lightweight add-on (< 1 MB)

### Build Individual Module

```bash
# Linux/Mac
./scripts/build-module.sh aero-hrm

# Windows
.\scripts\build-module.ps1 -ModuleName "aero-hrm"
```

## 🔍 Verification Checklist

### After Building a Module Add-on:

1. **Extract the ZIP:**
   ```bash
   unzip dist/Aero_CRM_Module_v1.0.0.zip -d test/
   ```

2. **Verify NO vendor folder:**
   ```bash
   ls test/aero-crm/vendor  # Should not exist
   ```

3. **Verify compiled JS exists:**
   ```bash
   ls test/aero-crm/dist/aero-crm.umd.js  # Should exist
   ```

4. **Verify React is externalized:**
   ```bash
   grep 'import.*from "react"' test/aero-crm/dist/aero-crm.umd.js
   # Should find: import ... from "react"
   # Should NOT find: massive minified React code block
   ```

### After Building Installer:

1. **Extract the ZIP:**
   ```bash
   unzip dist/Aero_HRM_Installer_v1.0.0.zip -d test-installer/
   ```

2. **Verify vendor folder exists:**
   ```bash
   ls test-installer/installer/vendor  # Should exist with packages
   ```

3. **Verify modules exist:**
   ```bash
   ls test-installer/installer/modules/aero-core
   ls test-installer/installer/modules/aero-hrm
   ```

4. **Verify core assets:**
   ```bash
   ls test-installer/installer/public/build/assets/app-*.js
   ```

## 🐛 Troubleshooting

### "Module not found" Error

**Problem:** Import errors in browser console

**Solution:**
```bash
cd packages/aero-hrm
npm install
npm run build
```

### Changes Not Appearing

**Problem:** Edited code not showing in browser

**Solutions:**
1. Check if module watcher is running: `npm run build -- --watch`
2. Hard refresh browser: `Ctrl+Shift+R` (Windows) / `Cmd+Shift+R` (Mac)
3. Clear Laravel cache: `php artisan config:clear`

### Composer Symlinks Not Working

**Problem:** Changes in packages not reflected in apps

**Solution:**
```bash
cd apps/saas-host
rm -rf vendor/aero
composer install
```

### Vite Manifest Error

**Problem:** `Unable to locate file in Vite manifest`

**Solution:**
```bash
cd packages/aero-core
npm run build

cd apps/saas-host
php artisan config:clear
```

## 📚 Additional Resources

- [Module Extraction Guide](../docs/MODULE_EXTRACTION_GUIDE.md)
- [Integration Architecture](../packages/aero-hrm/INTEGRATION_ARCHITECTURE.md)
- [Quick Start](../packages/aero-hrm/QUICK_START.md)

## 💡 Pro Tips

1. **Use concurrently for multiple watchers:**
   ```bash
   npm install -g concurrently
   concurrently "cd packages/aero-core && npm run dev" "cd packages/aero-hrm && npm run build -- --watch"
   ```

2. **Create shell aliases:**
   ```bash
   alias aero-dev="cd ~/Aero-Enterprise-Suite-Saas/apps/saas-host && composer run dev"
   alias aero-build="cd ~/Aero-Enterprise-Suite-Saas && ./scripts/build-release.sh"
   ```

3. **Use VS Code workspace:**
   Create `.vscode/workspace.code-workspace`:
   ```json
   {
     "folders": [
       { "path": "packages/aero-core" },
       { "path": "packages/aero-hrm" },
       { "path": "apps/saas-host" }
     ]
   }
   ```

## 🎯 Summary

| Task | Command | Location |
|------|---------|----------|
| **Dev Server** | `npm run dev` | `packages/aero-core` |
| **Watch Module** | `npm run build -- --watch` | `packages/aero-hrm` |
| **Test** | `php artisan test` | `apps/saas-host` |
| **Build Release** | `./scripts/build-release.sh 1.0.0` | Project root |
| **Build Module** | `./scripts/build-module.sh aero-hrm` | Project root |

---

**Remember:** The key to this architecture is that packages are **symlinked**, not copied. Every change in `packages/` is instantly available in `apps/*/vendor/aero/`.
