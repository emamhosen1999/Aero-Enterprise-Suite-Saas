# Week 2 Implementation: Manual HRM Package Extraction Guide

**Date:** 2025-12-07  
**Module:** HRM (Human Resource Management)  
**Status:** In Progress

---

## Overview

This document guides the manual extraction of the HRM module from the monolithic Aero Enterprise Suite into an independent, distributable package.

## Step 1: Analysis Results

### HRM Module Analysis Summary

**Directory Paths:**
- Models: `app/Models/Tenant/HRM/` (77 files)
- Controllers: `app/Http/Controllers/Tenant/HRM/`
- Services: `app/Services/Tenant/HRM/`
- Migrations: `database/migrations/tenant/*hrm*` or `*employee*`
- Frontend: `resources/js/Tenant/Pages/HRM/`

**Key Findings:**
- Large module with extensive functionality
- Heavy use of shared dependencies (User, Role, Module models)
- Multi-tenant aware (under Tenant namespace)
- Requires careful dependency management

---

## Step 2: Package Structure Setup

### Directory Structure to Create

```bash
packages/aero-hrm/
├── composer.json                 # Package definition
├── README.md                     # Documentation
├── LICENSE                       # License file
├── CHANGELOG.md                  # Version history
├── phpunit.xml                   # Test configuration
├── src/
│   ├── HrmServiceProvider.php   # Smart service provider
│   ├── Models/                   # Eloquent models
│   │   ├── Employee.php
│   │   ├── Department.php
│   │   ├── Designation.php
│   │   └── ...
│   ├── Http/
│   │   ├── Controllers/          # Controllers
│   │   ├── Middleware/           # Custom middleware
│   │   └── Requests/             # Form requests
│   ├── Services/                 # Business logic
│   ├── Policies/                 # Authorization
│   └── Console/                  # Artisan commands
├── database/
│   ├── migrations/               # Database migrations
│   ├── seeders/                  # Seed data
│   └── factories/                # Model factories
├── routes/
│   └── hrm.php                   # Module routes
├── config/
│   └── aero-hrm.php             # Module configuration
├── resources/
│   ├── js/
│   │   ├── app.jsx              # Frontend entry
│   │   ├── Pages/               # Inertia pages
│   │   ├── Components/          # React components
│   │   ├── Tables/              # Data tables
│   │   └── Forms/               # Form components
│   └── views/                   # Blade views (if any)
└── tests/
    ├── TestCase.php
    ├── Feature/
    └── Unit/
```

### Commands to Create Structure

```bash
# Create root directory
mkdir -p packages/aero-hrm

# Create all subdirectories
cd packages/aero-hrm
mkdir -p src/{Models,Http/{Controllers,Middleware,Requests},Services,Policies,Console}
mkdir -p database/{migrations,seeders,factories}
mkdir -p routes
mkdir -p config
mkdir -p resources/js/{Pages,Components,Tables,Forms}
mkdir -p resources/views
mkdir -p tests/{Feature,Unit}
```

---

## Step 3: Files to Extract

### Backend Files

#### Models (from `app/Models/Tenant/HRM/`)
Extract all PHP files to `src/Models/`:
- Employee.php
- Department.php
- Designation.php
- EmployeeAddress.php
- EmployeeBankDetail.php
- EmployeeCertification.php
- EmployeeDependent.php
- EmployeeEducation.php
- EmployeePersonalDocument.php
- EmployeeSalaryStructure.php
- EmployeeWorkExperience.php
- ... (and all other files in the directory)

#### Controllers (from `app/Http/Controllers/Tenant/HRM/`)
Extract all controller files to `src/Http/Controllers/`:
- EmployeeController.php
- DepartmentController.php
- DesignationController.php
- ... (all HRM controllers)

#### Services (from `app/Services/Tenant/HRM/`)
Extract all service files to `src/Services/`:
- All HRM-related services

#### Form Requests (from `app/Http/Requests/HRM/` or similar)
Extract to `src/Http/Requests/`:
- All HRM form request validators

#### Policies (from `app/Policies/HRM/` or similar)
Extract to `src/Policies/`:
- All HRM-related policies

#### Migrations
Search for HRM/employee related migrations:
```bash
grep -l "hrm\|employee\|department\|designation" database/migrations/tenant/*.php
```
Extract to `database/migrations/`

#### Routes
Extract HRM routes from `routes/tenant.php` or `routes/hrm.php` to `routes/hrm.php`

#### Config
Extract HRM configuration from `config/modules.php` to `config/aero-hrm.php`

### Frontend Files

#### Pages (from `resources/js/Tenant/Pages/HRM/` or `/Employees/`)
Extract to `resources/js/Pages/`:
- EmployeeList.jsx
- EmployeeCreate.jsx
- EmployeeEdit.jsx
- EmployeeProfile.jsx
- DepartmentList.jsx
- DesignationList.jsx
- ... (all HRM pages)

#### Components (from `resources/js/Components/`)
Search for HRM-related components and extract to `resources/js/Components/`:
- EmployeeCard.jsx
- DepartmentSelector.jsx
- ... (any HRM-specific components)

#### Tables (from `resources/js/Tables/`)
Extract to `resources/js/Tables/`:
- EmployeeTable.jsx
- DepartmentTable.jsx
- ... (any HRM-related tables)

#### Forms (from `resources/js/Forms/`)
Extract to `resources/js/Forms/`:
- EmployeeForm.jsx
- ... (any HRM-related forms)

---

## Step 4: Namespace Updates

### Backend Namespace Transformation

**From:**
```php
namespace App\Models\Tenant\HRM;
use App\Models\Tenant\HRM\Employee;
use App\Models\Shared\User;
```

**To:**
```php
namespace AeroModules\Hrm\Models;
use AeroModules\Hrm\Models\Employee;
use App\Models\Shared\User; // Keep shared dependencies as-is for now
```

### Update Pattern

1. **In all model files:**
   - Change `namespace App\Models\Tenant\HRM;` to `namespace AeroModules\Hrm\Models;`
   - Update all `use App\Models\Tenant\HRM\` to `use AeroModules\Hrm\Models\`

2. **In all controller files:**
   - Change `namespace App\Http\Controllers\Tenant\HRM;` to `namespace AeroModules\Hrm\Http\Controllers;`
   - Update imports accordingly

3. **In all service files:**
   - Change `namespace App\Services\Tenant\HRM;` to `namespace AeroModules\Hrm\Services;`
   - Update imports accordingly

### Search & Replace Commands

```bash
# In the extracted package directory
cd packages/aero-hrm

# Replace namespace declarations
find src -type f -name "*.php" -exec sed -i 's/namespace App\\Models\\Tenant\\HRM/namespace AeroModules\\Hrm\\Models/g' {} +
find src -type f -name "*.php" -exec sed -i 's/namespace App\\Http\\Controllers\\Tenant\\HRM/namespace AeroModules\\Hrm\\Http\\Controllers/g' {} +
find src -type f -name "*.php" -exec sed -i 's/namespace App\\Services\\Tenant\\HRM/namespace AeroModules\\Hrm\\Services/g' {} +

# Replace use statements
find src -type f -name "*.php" -exec sed -i 's/use App\\Models\\Tenant\\HRM\\/use AeroModules\\Hrm\\Models\\/g' {} +
find src -type f -name "*.php" -exec sed -i 's/use App\\Http\\Controllers\\Tenant\\HRM\\/use AeroModules\\Hrm\\Http\\Controllers\\/g' {} +
find src -type f -name "*.php" -exec sed -i 's/use App\\Services\\Tenant\\HRM\\/use AeroModules\\Hrm\\Services\\/g' {} +
```

---

## Step 5: Create Package Files

### 1. composer.json

See `docs/templates/composer.json.template` for the complete template.

Key points:
- Package name: `aero-modules/hrm`
- Namespace: `AeroModules\\Hrm\\`
- Dependencies: Laravel 11, aero-modules/core (if created)
- Service provider auto-discovery

### 2. Service Provider

See `docs/templates/HrmServiceProvider.php.template` for the complete template.

Key features:
- Mode detection (standalone/platform/tenant)
- Route registration
- Migration loading
- Config publishing
- Asset publishing

### 3. README.md

See `docs/templates/README.md.template` for the complete template.

Sections:
- Installation
- Requirements
- Configuration
- Usage examples
- API documentation
- Troubleshooting

### 4. LICENSE

Choose appropriate license (proprietary or open source)

### 5. CHANGELOG.md

Initial entry for version 1.0.0

---

## Step 6: Validation

After manual extraction and namespace updates:

```bash
# Run validator
php ../../tools/module-analysis/validate.php . --save

# Review validation report
cat validation-reports/validation-report-*.txt

# Fix any errors found
```

---

## Step 7: Testing

### Install Dependencies

```bash
cd packages/aero-hrm
composer install
```

### Run Tests

```bash
./vendor/bin/phpunit
```

### Test in Platform

Add to main application's composer.json:

```json
{
    "repositories": [
        {
            "type": "path",
            "url": "../packages/aero-hrm"
        }
    ]
}
```

Install:

```bash
composer require aero-modules/hrm:@dev
```

---

## Step 8: Documentation

### Document Extraction Process

Create `packages/aero-hrm/EXTRACTION_NOTES.md` documenting:
- Challenges encountered
- Decisions made
- Dependencies handled
- Breaking changes from monolith

---

## Notes

### Shared Dependencies Strategy

**Decision:** Keep shared model references (User, Role, Module) as-is initially.

**Rationale:**
- These are truly shared across all modules
- Will be moved to `aero-core` package later
- Allows HRM package to work in platform context

**Future:** Create `aero-core` package with shared models/services.

### Configuration Strategy

**Module-specific config:** `config/aero-hrm.php`
```php
return [
    'routes' => [
        'prefix' => 'hrm',
        'middleware' => ['web', 'auth'],
    ],
    'auth' => [
        'user_model' => env('HRM_USER_MODEL', \App\Models\User::class),
    ],
    'features' => [
        'attendance' => env('HRM_ATTENDANCE_ENABLED', true),
        'payroll' => env('HRM_PAYROLL_ENABLED', true),
        'leave' => env('HRM_LEAVE_ENABLED', true),
    ],
];
```

---

## Checklist

- [ ] Package structure created
- [ ] Models extracted and namespaces updated
- [ ] Controllers extracted and namespaces updated
- [ ] Services extracted and namespaces updated
- [ ] Policies extracted and namespaces updated
- [ ] Requests extracted and namespaces updated
- [ ] Migrations extracted
- [ ] Routes extracted
- [ ] Config extracted
- [ ] Frontend pages extracted
- [ ] Frontend components extracted
- [ ] Frontend tables extracted
- [ ] Frontend forms extracted
- [ ] composer.json created
- [ ] Service Provider created
- [ ] README.md created
- [ ] LICENSE created
- [ ] CHANGELOG.md created
- [ ] phpunit.xml created
- [ ] Tests created
- [ ] Validation passed
- [ ] Tests passing
- [ ] Documented lessons learned

---

## Status

**Current Phase:** Setup and Planning  
**Next Step:** Create package structure and templates  
**Estimated Completion:** Week 2 end
