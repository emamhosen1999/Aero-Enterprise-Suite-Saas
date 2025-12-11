# 🚀 Aero Product & Module Build Guide

## Quick Reference

### Build Standalone Products (Fat Installers)
```powershell
# HRM only
.\scripts\build-product.ps1 -Product hrm-standalone -Version 1.0.0

# CRM only
.\scripts\build-product.ps1 -Product crm-standalone -Version 1.0.0

# HRM + CRM Bundle
.\scripts\build-product.ps1 -Product hrm-crm-bundle -Version 1.0.0

# Full ERP Suite
.\scripts\build-product.ps1 -Product erp-suite -Version 1.0.0

# Custom combination
.\scripts\build-product.ps1 -Product custom -CustomModules @('hrm','crm','finance') -Version 1.0.0
```

### Build Add-on Modules (Lightweight)
```powershell
# Single module
.\scripts\build-module.ps1 -Modules @('crm') -Version 1.0.0

# Multiple modules
.\scripts\build-module.ps1 -Modules @('hrm','crm','finance') -Version 1.0.0
```

---

## 📋 Complete Product Strategy

### Scenario 1: Sell HRM Standalone + CRM as Add-on

```powershell
# Step 1: Build HRM Standalone Product
.\scripts\build-product.ps1 -Product hrm-standalone -Version 1.0.0
# Output: dist/hrm-standalone/Aero_HRM_Standalone_v1.0.0.zip (~80MB)

# Step 2: Build CRM Module Add-on
.\scripts\build-module.ps1 -Modules @('crm') -Version 1.0.0
# Output: dist/modules/Aero_CRM_Module_v1.0.0.zip (~500KB)
```

**Sales Strategy:**
- Main Product: Aero HRM Standalone ($99)
- Add-on: CRM Module ($29)
- Customer can buy HRM first, then add CRM later

---

### Scenario 2: Sell HRM+CRM Bundle + Finance as Add-on

```powershell
# Step 1: Build HRM+CRM Bundle Product
.\scripts\build-product.ps1 -Product hrm-crm-bundle -Version 1.0.0
# Output: dist/hrm-crm-bundle/Aero_HRM_CRM_Bundle_v1.0.0.zip (~95MB)

# Step 2: Build Finance Module Add-on
.\scripts\build-module.ps1 -Modules @('finance') -Version 1.0.0
# Output: dist/modules/Aero_FINANCE_Module_v1.0.0.zip (~600KB)
```

**Sales Strategy:**
- Bundle Product: Aero HRM+CRM ($149)
- Add-on: Finance Module ($39)

---

### Scenario 3: Multiple Standalone Products + Cross-sell Modules

```powershell
# Build all standalone products
.\scripts\build-product.ps1 -Product hrm-standalone -Version 1.0.0
.\scripts\build-product.ps1 -Product crm-standalone -Version 1.0.0

# Build modules for cross-selling
.\scripts\build-module.ps1 -Modules @('hrm','crm','finance') -Version 1.0.0
```

**Sales Strategy:**
- HRM Standalone ($99) → Sell CRM Module ($29) as add-on
- CRM Standalone ($89) → Sell HRM Module ($29) as add-on
- Any Product → Sell Finance Module ($39) as add-on

---

## 🏗️ How to Create New Product Configurations

### Step 1: Create App Folder (One-time setup)

```powershell
# Example: Create HRM+CRM+Finance bundle
cd apps
cp -r standalone-host finance-bundle
cd finance-bundle
```

### Step 2: Configure composer.json

```json
{
    "name": "aero/finance-bundle",
    "repositories": [
        { "type": "path", "url": "../../packages/*" }
    ],
    "require": {
        "php": "^8.2",
        "laravel/framework": "^11.0|^12.0",
        "aero/core": "*",
        "aero/hrm": "*",
        "aero/crm": "*",
        "aero/finance": "*"
    }
}
```

### Step 3: Add to build-product.ps1

```powershell
# Add to $ProductConfigs in build-product.ps1
'finance-bundle' = @{
    Name = 'Aero Finance Bundle'
    Description = 'Complete HR, CRM, and Finance Management'
    AppFolder = 'finance-bundle'
    Modules = @('core', 'hrm', 'crm', 'finance')
    OutputName = 'Aero_Finance_Bundle'
}
```

### Step 4: Build the Product

```powershell
.\scripts\build-product.ps1 -Product finance-bundle -Version 1.0.0
```

---

## 📦 Output Directory Structure

```
dist/
├── hrm-standalone/
│   └── Aero_HRM_Standalone_v1.0.0.zip         (80MB - Fat)
│
├── crm-standalone/
│   └── Aero_CRM_Standalone_v1.0.0.zip         (75MB - Fat)
│
├── hrm-crm-bundle/
│   └── Aero_HRM_CRM_Bundle_v1.0.0.zip         (95MB - Fat)
│
├── erp-suite/
│   └── Aero_ERP_Suite_v1.0.0.zip              (150MB - Fat)
│
└── modules/
    ├── Aero_HRM_Module_v1.0.0.zip             (500KB - Light)
    ├── Aero_CRM_Module_v1.0.0.zip             (450KB - Light)
    ├── Aero_FINANCE_Module_v1.0.0.zip         (600KB - Light)
    └── Aero_PROJECT_Module_v1.0.0.zip         (550KB - Light)
```

---

## 🎯 CodeCanyon Sales Strategy

### Product Listings

1. **Aero HRM Standalone** - $99
   - Full installation package
   - File: Aero_HRM_Standalone_v1.0.0.zip
   - Description: "Complete HR Management System with employee, attendance, payroll, and performance tracking"

2. **Aero CRM Standalone** - $89
   - Full installation package
   - File: Aero_CRM_Standalone_v1.0.0.zip
   - Description: "Complete Customer Relationship Management with pipeline, deals, and analytics"

3. **Aero HRM+CRM Bundle** - $149 (Save $39!)
   - Full installation package
   - File: Aero_HRM_CRM_Bundle_v1.0.0.zip
   - Description: "Complete HR and Customer Management solution"

### Add-on Module Listings

1. **CRM Module for Aero HRM** - $29
   - Lightweight add-on
   - File: Aero_CRM_Module_v1.0.0.zip
   - Requirements: "Requires Aero HRM Standalone v1.0+"

2. **HRM Module for Aero CRM** - $29
   - Lightweight add-on
   - File: Aero_HRM_Module_v1.0.0.zip
   - Requirements: "Requires Aero CRM Standalone v1.0+"

3. **Finance Module** - $39
   - Lightweight add-on
   - File: Aero_FINANCE_Module_v1.0.0.zip
   - Requirements: "Requires any Aero product v1.0+"

---

## ✅ Build Checklist

### Before Building

- [ ] All modules have proper `module.json`
- [ ] Frontend assets built (`npm run build` in each package)
- [ ] Migrations tested
- [ ] Routes registered correctly
- [ ] README.md updated with version

### After Building

- [ ] Extract ZIP and test installation
- [ ] Verify vendor/ folder in products (should exist)
- [ ] Verify NO vendor/ folder in modules (should NOT exist)
- [ ] Test module installation on existing product
- [ ] Check file sizes (products ~80-150MB, modules ~500KB)
- [ ] Verify React externalization in modules

### Quality Checks

```powershell
# Check product has vendor/
Expand-Archive dist/hrm-standalone/Aero_HRM_Standalone_v1.0.0.zip -Destination temp
Test-Path temp/vendor  # Should be TRUE

# Check module has NO vendor/
Expand-Archive dist/modules/Aero_CRM_Module_v1.0.0.zip -Destination temp2
Test-Path temp2/*/vendor  # Should be FALSE

# Cleanup
Remove-Item temp,temp2 -Recurse -Force
```

---

## 🔄 Update Strategy

### Releasing Updates

```powershell
# Version 1.1.0 release
$NewVersion = "1.1.0"

# Rebuild all products
.\scripts\build-product.ps1 -Product hrm-standalone -Version $NewVersion
.\scripts\build-product.ps1 -Product crm-standalone -Version $NewVersion
.\scripts\build-product.ps1 -Product hrm-crm-bundle -Version $NewVersion

# Rebuild all modules
.\scripts\build-module.ps1 -Modules @('hrm','crm','finance','project') -Version $NewVersion
```

### For Existing Customers

- **Full Product Updates:** Provide full ZIP (they reinstall)
- **Module Updates:** Provide lightweight module ZIP only
- **Minor Patches:** Can provide just changed files

---

## 💡 Tips & Best Practices

1. **Always build modules after products** - Ensures they work with latest product build
2. **Test module installation** - Install module on product to verify compatibility
3. **Keep module sizes small** - Remove dev dependencies, compress images
4. **Version consistently** - Use same version across all products/modules in a release
5. **Document breaking changes** - Clearly mark if module requires specific product version

---

## 🆘 Troubleshooting

### Module too large
```powershell
# Check what's in the module
Expand-Archive dist/modules/Aero_CRM_Module_v1.0.0.zip -Destination temp
Get-ChildItem temp -Recurse | Measure-Object -Property Length -Sum
# Remove unnecessary files from package
```

### Product missing modules
```powershell
# Verify modules are being copied
# Check build-product.ps1 output for "Copying modules..."
# Ensure module exists in packages/ directory
```

### Dependencies not installing
```powershell
# Clear composer cache
composer clear-cache
# Remove composer.lock and vendor/
Remove-Item composer.lock,vendor -Recurse -Force
composer install
```

---

**Last Updated:** December 11, 2025  
**Build System Version:** 2.0
