# 🚀 Quick Reference - Aero Monorepo

## 📁 Structure

```
apps/               → Host Applications (run these)
packages/           → Source Code (edit these)
scripts/            → Build Pipeline (ship these)
```

## 🎯 Host Applications

| App | Purpose | Packages Included |
|-----|---------|-------------------|
| **saas-host** | Full SaaS Platform | Core + Platform + All Modules |
| **standalone-host** | Standalone HRM | Core + HRM only |

## ⚡ Development Commands

### Start Development

```bash
# Terminal 1 - Core (React Host)
cd packages/aero-core
npm run dev

# Terminal 2 - Module (Library Mode)
cd packages/aero-hrm
npm run build -- --watch
```

### Or Run from Host
```bash
cd apps/saas-host
composer run dev
```

## 🔨 Build Commands

### Build Production Release
```bash
# Linux/Mac
./scripts/build-release.sh 1.0.0

# Windows
.\scripts\build-release.ps1 -Version "1.0.0"
```

### Build Individual Module
```bash
# Linux/Mac
./scripts/build-module.sh aero-hrm

# Windows
.\scripts\build-module.ps1 -ModuleName "aero-hrm"
```

## 📦 Build Outputs

| Package | Size | Purpose |
|---------|------|---------|
| **Aero_HRM_Installer_v*.zip** | ~50-80 MB | New buyer - includes vendor/ |
| **Aero_CRM_Module_v*.zip** | ~300-500 KB | Existing user - no vendor/ |

## 🔍 Verification

### Verify Installer (Should have vendor/)
```bash
unzip -l dist/Aero_HRM_Installer_v1.0.0.zip | grep vendor/
# Should show many files ✅
```

### Verify Add-on (Should NOT have vendor/)
```bash
unzip -l dist/Aero_CRM_Module_v1.0.0.zip | grep vendor/
# Should show nothing ✅
```

### Verify React Externalization
```bash
grep 'from "react"' packages/aero-crm/dist/aero-crm.umd.js
# Should show: import ... from "react" ✅
```

## 🛠️ Common Tasks

| Task | Command | Location |
|------|---------|----------|
| Install host | `composer install` | `apps/saas-host/` |
| Update packages | `composer update` | `apps/saas-host/` |
| Run tests | `php artisan test` | `apps/saas-host/` |
| Clear cache | `php artisan config:clear` | `apps/saas-host/` |
| Build assets | `npm run build` | `packages/aero-core/` |
| Watch module | `npm run build -- --watch` | `packages/aero-hrm/` |

## 🐛 Troubleshooting

### Changes not appearing?
```bash
cd packages/aero-hrm
npm run build
# Hard refresh: Ctrl+Shift+R
```

### Symlinks broken?
```bash
cd apps/saas-host
rm -rf vendor/aero
composer install
```

### Vite errors?
```bash
cd packages/aero-core
npm run build
cd apps/saas-host
php artisan config:clear
```

## 📚 Documentation

- **Full Dev Guide:** `docs/DEVELOPMENT_WORKFLOW.md`
- **Compliance:** `COMPLIANCE_VERIFICATION.md`
- **Module Guide:** `docs/MODULE_EXTRACTION_GUIDE.md`

## 🎯 Key Principles

1. ✅ **Packages are symlinked** - changes are instant
2. ✅ **Core = Host** - serves React application
3. ✅ **Modules = Guests** - externalize dependencies
4. ✅ **Installer = Fat** - includes vendor/
5. ✅ **Add-ons = Light** - no vendor/, just code + compiled JS

---

**Need Help?** Check `docs/DEVELOPMENT_WORKFLOW.md`
