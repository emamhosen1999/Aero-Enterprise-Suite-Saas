# 🧪 Foundation Testing Guide

Quick guide to test the newly implemented foundation system.

## 🚀 Quick Start

### 1. Build the HRM Module

```powershell
cd packages\aero-hrm
npm install
npm run build
```

**Expected Output:**
```
dist/
├── aero-hrm.js      # ES module with externalized React
└── aero-hrm.css     # Bundled styles
```

### 2. Verify Externalization

```powershell
# Check that React is imported, not bundled
Select-String -Path "dist\aero-hrm.js" -Pattern "from ['\"]react['\"]" | Select-Object -First 1
```

**Should show:**
```javascript
import React from "react";
```

**Should NOT show** thousands of lines of React code bundled inside.

### 3. Test Module Discovery

```powershell
cd ..\..\apps\standalone-host
php artisan tinker
```

```php
// Test ModuleManager
app('aero.module')->all()

// Should return array with aero-hrm metadata
// [
//   [
//     'name' => 'aero-hrm',
//     'short_name' => 'hrm',
//     'namespace' => 'Aero\Hrm',
//     'assets' => [...],
//     ...
//   ]
// ]

// Test Module Facade
\Aero\Core\Facades\Module::count()
// Should return: 2 (aero-hrm + aero-crm)

// Test if module is enabled
\Aero\Core\Facades\Module::isEnabled('hrm')
// Should return: true
```

### 4. Test RuntimeLoader

```php
// In tinker
$loader = app(Aero\Core\Services\RuntimeLoader::class);
$loaded = $loader->getLoadedModules();
dd($loaded);

// Should show modules loaded at runtime
```

### 5. Test in Browser

```powershell
# Start development server
php artisan serve
```

**Visit:** `http://localhost:8000`

**Open Browser Console** (F12), you should see:

```
[Aero] Loading runtime modules
[Aero] Loading module: Aero HRM (hrm)
[Aero HRM] Module loaded, registering with window.Aero
[Aero HRM] Module registered successfully
```

**Check window.Aero:**
```javascript
// In browser console
console.log(window.Aero.modules);

// Should show:
// {
//   Hrm: {
//     Pages: {...},
//     resolve: function
//   }
// }
```

### 6. Test Page Resolution

```javascript
// In browser console
window.Aero.modules.Hrm.Pages

// Should show all HRM pages:
// {
//   Employees: { Index: Component, Create: Component, Edit: Component },
//   Attendance: { Index: Component, Report: Component },
//   ...
// }
```

## 🔍 Verification Checklist

### Backend Tests ✅

- [ ] `php artisan tinker` → `app('aero.module')->all()` returns modules
- [ ] Module Facade works: `\Aero\Core\Facades\Module::count()`
- [ ] RuntimeLoader loads modules: `$loader->getLoadedModules()`
- [ ] Service providers are registered
- [ ] Routes are loaded (check `php artisan route:list | grep hrm`)

### Frontend Tests ✅

- [ ] `window.Aero` exists in browser
- [ ] `window.Aero.modules.Hrm` exists
- [ ] Console shows module loading messages
- [ ] No React bundling errors
- [ ] Module CSS loads correctly

### Build Tests ✅

- [ ] `npm run build` succeeds in `packages/aero-hrm`
- [ ] `dist/aero-hrm.js` exists and is small (~10-50 KB)
- [ ] File contains `import React from "react"` not bundled React
- [ ] `dist/aero-hrm.css` exists

### Symlink Tests ✅

- [ ] `public/modules` directory exists or symlink created
- [ ] Can access: `http://localhost:8000/modules/aero-hrm/dist/aero-hrm.js`
- [ ] 200 status code (not 404)

## 🐛 Troubleshooting

### Module Not Found in Browser

**Problem:** `window.Aero.modules.Hrm` is undefined

**Solutions:**
1. Check console for JavaScript errors
2. Verify `dist/aero-hrm.js` exists
3. Check file is accessible: visit `/modules/aero-hrm/dist/aero-hrm.js`
4. Clear browser cache (Ctrl+Shift+R)

### Symlink Not Created

**Problem:** Cannot access `/modules/aero-hrm/...`

**Solutions:**
```powershell
# Windows (as Administrator)
New-Item -ItemType SymbolicLink -Path "public\modules" -Target "..\modules"

# Or copy manually
Copy-Item -Path "modules" -Destination "public\modules" -Recurse
```

### React Bundled in Module

**Problem:** `dist/aero-hrm.js` is huge (>500 KB)

**Solution:**
```javascript
// Check vite.config.js has externalization:
rollupOptions: {
  external: ['react', 'react-dom', '@inertiajs/react'],
}

// Rebuild:
npm run build
```

### Module Not Discovered

**Problem:** `Module::all()` returns empty array

**Solutions:**
1. Check `module.json` exists in `packages/aero-hrm/`
2. Check `module.json` has valid JSON syntax
3. Clear cache: `php artisan cache:clear`
4. Call: `Module::clearCache()`

## 📊 Expected Results

### Module Discovery
```php
app('aero.module')->all()
```
**Returns:**
```php
[
  [
    'name' => 'aero-hrm',
    'display_name' => 'Aero HRM',
    'short_name' => 'hrm',
    'namespace' => 'Aero\Hrm',
    'version' => '1.0.0',
    'source' => 'composer',  // or 'runtime'
    'enabled' => true,
    'assets' => [
      'js' => 'build/modules/aero-hrm/dist/aero-hrm.js',
      'css' => 'build/modules/aero-hrm/dist/aero-hrm.css',
    ],
  ],
  // ... more modules
]
```

### Browser Console
```
[Aero] Loading 1 runtime modules
[Aero] Loading module: Aero HRM (hrm)
[Aero HRM] Module loaded, registering with window.Aero
[Aero HRM] Module registered successfully
```

### window.Aero Structure
```javascript
window.Aero = {
  mode: "standalone",
  modules: {
    Hrm: {
      Pages: {
        Employees: {
          Index: Component,
          Create: Component,
          Edit: Component
        },
        // ... more pages
      },
      resolve: function(path) { ... }
    }
  },
  register: function(name, pages) { ... }
}
```

## ✅ Success Indicators

1. **No console errors** in browser
2. **Module count > 0** in `Module::count()`
3. **Files exist** in `dist/` after build
4. **Small file size** (~10-50 KB for aero-hrm.js)
5. **Import statements** visible in built JS
6. **Symlink works** - can access `/modules/aero-hrm/dist/aero-hrm.js`

## 🎯 Performance Benchmarks

| Metric | Expected | Notes |
|--------|----------|-------|
| Module JS size | < 100 KB | With externalization |
| Module CSS size | < 50 KB | Bundled styles |
| Build time | < 30s | Per module |
| Page load | < 2s | First load |
| Module registration | < 100ms | Runtime |

---

**All tests passing?** ✅ Foundation is working correctly!

**Issues?** Check troubleshooting section above or review logs.
