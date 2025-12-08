# Module Extraction Architecture Diagrams

This document provides visual representations of the module extraction architecture.

## Current Monolithic Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Aero Enterprise Suite SaaS                    │
│                      (Monolithic Application)                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    Frontend (React)                       │  │
│  │  ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐        │  │
│  │  │  HRM   │  │  CRM   │  │Support │  │  DMS   │  ...   │  │
│  │  └────────┘  └────────┘  └────────┘  └────────┘        │  │
│  └──────────────────────────────────────────────────────────┘  │
│                             ▼                                    │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                   Routes Layer                            │  │
│  │  (tenant.php, hr.php, modules.php, support.php, ...)    │  │
│  └──────────────────────────────────────────────────────────┘  │
│                             ▼                                    │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                Controllers Layer                          │  │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐        │  │
│  │  │ HRM Ctrl   │  │ CRM Ctrl   │  │Support Ctrl│  ...   │  │
│  │  └────────────┘  └────────────┘  └────────────┘        │  │
│  └──────────────────────────────────────────────────────────┘  │
│                             ▼                                    │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                 Services Layer                            │  │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐        │  │
│  │  │HRM Service │  │CRM Service │  │Supp Service│  ...   │  │
│  │  └────────────┘  └────────────┘  └────────────┘        │  │
│  └──────────────────────────────────────────────────────────┘  │
│                             ▼                                    │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                   Models Layer                            │  │
│  │  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐               │  │
│  │  │Employee│  │Contact│ │Ticket│  │Document│  ...        │  │
│  │  └──────┘  └──────┘  └──────┘  └──────┘               │  │
│  └──────────────────────────────────────────────────────────┘  │
│                             ▼                                    │
└───────────────────────────┬─────────────────────────────────────┘
                             ▼
                  ┌──────────────────────┐
                  │   Multi-Tenant DB    │
                  │                      │
                  │  ┌────────────────┐ │
                  │  │ Central DB     │ │  (Tenants, Plans)
                  │  └────────────────┘ │
                  │  ┌────────────────┐ │
                  │  │ Tenant1 DB     │ │  (tenant1 data)
                  │  └────────────────┘ │
                  │  ┌────────────────┐ │
                  │  │ Tenant2 DB     │ │  (tenant2 data)
                  │  └────────────────┘ │
                  └──────────────────────┘
```

## Target Package-Based Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                    Main Platform Repository                       │
│               (Core + Module Orchestration)                       │
├──────────────────────────────────────────────────────────────────┤
│                                                                    │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │              Core Platform Services                        │  │
│  │  • Authentication • Authorization • Tenancy               │  │
│  │  • Routing • Module Registry • Events                     │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                    │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │              Composer Dependencies                         │  │
│  │  ┌──────────────────────────────────────────────────┐    │  │
│  │  │ require:                                          │    │  │
│  │  │   "aero/core": "^2.0"                            │    │  │
│  │  │   "aero/hrm-module": "^1.0"                      │    │  │
│  │  │   "aero/crm-module": "^1.0"                      │    │  │
│  │  │   "aero/support-module": "^1.0"                  │    │  │
│  │  │   "aero/dms-module": "^1.0"                      │    │  │
│  │  └──────────────────────────────────────────────────┘    │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                    │
└─────────────┬────────────────────────────────────────────────────┘
              │
              ├──────────────────┬──────────────────┬──────────────┐
              ▼                  ▼                  ▼              ▼
    ┌──────────────────┐  ┌──────────────┐  ┌──────────────┐  ┌───────┐
    │  aero-core       │  │ aero-hrm-    │  │ aero-crm-    │  │  ...  │
    │  (Shared Utils)  │  │  module      │  │  module      │  │       │
    ├──────────────────┤  ├──────────────┤  ├──────────────┤  └───────┘
    │ • Traits         │  │ • Controllers│  │ • Controllers│
    │ • Contracts      │  │ • Models     │  │ • Models     │
    │ • Services       │  │ • Services   │  │ • Services   │
    │ • Middleware     │  │ • Routes     │  │ • Routes     │
    │ • Events         │  │ • Frontend   │  │ • Frontend   │
    └──────────────────┘  │ • Migrations │  │ • Migrations │
                          │ • Tests      │  │ • Tests      │
                          └──────────────┘  └──────────────┘
                                    │                │
                                    └────────┬───────┘
                                             ▼
                                  ┌──────────────────────┐
                                  │   Multi-Tenant DB    │
                                  │  (Same as before)    │
                                  └──────────────────────┘
```

## Module Package Internal Structure

```
aero-hrm-module/
│
├─── Composer Package Definition ────────────────────────────────┐
│    composer.json                                                │
│    {                                                            │
│      "name": "aero/hrm-module",                                │
│      "autoload": {"psr-4": {"Aero\\HRM\\": "src/"}},          │
│      "extra": {                                                 │
│        "laravel": {                                            │
│          "providers": ["Aero\\HRM\\Providers\\HRMServiceProvider"]│
│        }                                                        │
│      }                                                          │
│    }                                                            │
└─────────────────────────────────────────────────────────────────┘
│
├─── Backend (PHP/Laravel) ──────────────────────────────────────┐
│                                                                  │
│    src/                                                         │
│    ├── Http/                                                    │
│    │   ├── Controllers/     ← Module controllers               │
│    │   ├── Middleware/      ← Module middleware                │
│    │   └── Requests/        ← Form validations                 │
│    │                                                            │
│    ├── Models/              ← Eloquent models                  │
│    │   ├── Employee.php                                        │
│    │   ├── Attendance.php                                      │
│    │   └── Leave.php                                           │
│    │                                                            │
│    ├── Services/            ← Business logic                   │
│    │   ├── LeaveService.php                                    │
│    │   ├── AttendanceService.php                               │
│    │   └── PayrollService.php                                  │
│    │                                                            │
│    ├── Policies/            ← Authorization                    │
│    │   └── EmployeePolicy.php                                  │
│    │                                                            │
│    ├── Events/              ← Domain events                    │
│    │   └── EmployeeCreated.php                                 │
│    │                                                            │
│    ├── Providers/           ← Service provider                 │
│    │   └── HRMServiceProvider.php  ← Auto-discovered          │
│    │                                                            │
│    └── routes/              ← Module routes                    │
│        ├── web.php                                             │
│        └── api.php                                             │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
│
├─── Frontend (React/Inertia) ───────────────────────────────────┐
│                                                                  │
│    resources/js/                                                │
│    ├── Pages/               ← Inertia pages                    │
│    │   ├── EmployeeList.jsx                                    │
│    │   ├── Attendance.jsx                                      │
│    │   └── Payroll.jsx                                         │
│    │                                                            │
│    ├── Components/          ← Reusable components              │
│    │   ├── EmployeeCard.jsx                                    │
│    │   └── AttendanceWidget.jsx                                │
│    │                                                            │
│    ├── Tables/              ← Table components                 │
│    │   └── EmployeeTable.jsx                                   │
│    │                                                            │
│    └── Forms/               ← Form components                  │
│        └── EmployeeForm.jsx                                    │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
│
├─── Database ────────────────────────────────────────────────────┐
│                                                                  │
│    database/                                                    │
│    ├── migrations/          ← Tenant-scoped migrations         │
│    │   ├── 2024_01_01_create_hrm_employees_table.php          │
│    │   ├── 2024_01_02_create_hrm_attendance_table.php         │
│    │   └── ...                                                 │
│    │                                                            │
│    ├── seeders/             ← Data seeders                     │
│    │   └── HRMSeeder.php                                       │
│    │                                                            │
│    └── factories/           ← Model factories (testing)        │
│        └── EmployeeFactory.php                                 │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
│
├─── Testing ─────────────────────────────────────────────────────┐
│                                                                  │
│    tests/                                                       │
│    ├── Feature/             ← Feature tests                    │
│    │   ├── EmployeeTest.php                                    │
│    │   └── LeaveTest.php                                       │
│    │                                                            │
│    ├── Unit/                ← Unit tests                       │
│    │   └── LeaveServiceTest.php                                │
│    │                                                            │
│    └── TestCase.php         ← Base test case                   │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
│
└─── Configuration ───────────────────────────────────────────────┐
                                                                   │
     config/hrm.php           ← Module configuration              │
     {                                                             │
       "enabled" => true,                                          │
       "features" => [...],                                        │
       "settings" => [...]                                         │
     }                                                             │
                                                                   │
─────────────────────────────────────────────────────────────────┘
```

## Integration Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                     HTTP Request Flow                            │
└─────────────────────────────────────────────────────────────────┘

    User Request
        │
        ├─► https://{tenant}.domain.com/hrm/employees
        │
        ▼
┌──────────────────┐
│ Main Platform    │ 1. Route resolution
│ (Laravel App)    │────► /hrm/* → HRM Module
└────────┬─────────┘
         │
         │ 2. Tenancy middleware
         ├─► InitializeTenancyByDomain
         │   • Identifies tenant from subdomain
         │   • Switches to tenant database
         │
         │ 3. Auth & permissions
         ├─► auth, tenant.setup
         │   • Checks user authentication
         │   • Validates module access
         │
         ▼
┌──────────────────┐
│  HRM Module      │ 4. Module routing
│  (Package)       │────► HRMServiceProvider registers routes
└────────┬─────────┘
         │
         │ 5. Controller execution
         ├─► EmployeeController@index
         │
         │ 6. Service layer
         ├─► EmployeeService::getEmployees()
         │
         │ 7. Model & database
         ├─► Employee::query()->tenant()->get()
         │
         ▼
┌──────────────────┐
│  Tenant Database │ 8. Data retrieval
└────────┬─────────┘      (tenant-scoped)
         │
         │ 9. Response rendering
         ├─► Inertia::render('HRM::EmployeeList', $data)
         │
         ▼
┌──────────────────┐
│  React Frontend  │ 10. Component rendering
│  (Inertia.js)    │────► EmployeeList.jsx
└──────────────────┘
         │
         ▼
    User sees rendered page
```

## Event-Driven Communication

```
┌─────────────────────────────────────────────────────────────────┐
│          Inter-Module Communication via Events                   │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────┐                        ┌──────────────────┐
│   HRM Module     │                        │   CRM Module     │
│                  │                        │                  │
│  EmployeeCtrl    │                        │  ContactCtrl     │
│      │           │                        │      │           │
│      │ creates   │                        │      │           │
│      ▼           │                        │      │           │
│  Employee        │                        │                  │
│      │           │                        │                  │
│      │ fires     │                        │                  │
│      ▼           │                        │                  │
└──────┼───────────┘                        └──────┼───────────┘
       │                                           │
       │                                           │
       ├──► Event: EmployeeCreated ───────────────┤
       │           {                               │
       │             employee_id,                  │
       │             tenant_id,                    │
       │             data: {...}                   │
       │           }                               │
       │                                           │
       │                    ▼                      ▼
       │              ┌─────────────────────────────────┐
       │              │    Laravel Event Bus             │
       │              │  (Platform Event Dispatcher)     │
       │              └─────────────────────────────────┘
       │                           │
       │                           │ dispatches to
       │                           │ registered listeners
       │                           ▼
       │              ┌─────────────────────────────────┐
       │              │  CreateContactFromEmployee      │
       │              │  (CRM Module Listener)          │
       │              └─────────────────────────────────┘
       │                           │
       │                           │ creates
       │                           ▼
       │                     ┌──────────┐
       └─────────────────────┤ Contact  │
                             └──────────┘

Benefits:
✓ Loose coupling between modules
✓ Async processing possible
✓ Easy to add new listeners
✓ Testable independently
```

## Deployment Pipeline

```
┌─────────────────────────────────────────────────────────────────┐
│                    CI/CD Pipeline Flow                           │
└─────────────────────────────────────────────────────────────────┘

Module Repository (aero-hrm-module)
    │
    │ git push
    ▼
┌──────────────────┐
│  GitHub Actions  │
│                  │
│  1. Run tests    │────✓ PHPUnit tests
│  2. Code quality │────✓ PHP CS Fixer, PHPStan
│  3. Build assets │────✓ npm run build
│  4. Tag release  │────✓ v1.2.3
└────────┬─────────┘
         │
         │ Release created
         ▼
┌──────────────────┐
│ Package Registry │ (GitHub Packages / Private Packagist)
│  aero/hrm-module │
│  v1.2.3          │
└────────┬─────────┘
         │
         │ composer require aero/hrm-module:^1.2
         ▼
Main Platform Repository
    │
    │ composer update
    ▼
┌──────────────────┐
│  Platform CI/CD  │
│                  │
│  1. Install deps │────✓ composer install
│  2. Run tests    │────✓ All module tests
│  3. Build assets │────✓ npm run build (includes modules)
│  4. Deploy       │────✓ Deploy to servers
└──────────────────┘
         │
         │ Deployment
         ▼
┌──────────────────┐
│  Production      │
│  Environment     │
│                  │
│  • Main Platform │
│  • HRM Module    │ v1.2.3
│  • CRM Module    │ v1.1.0
│  • ...           │
└──────────────────┘
```

## Version Compatibility Matrix

```
┌─────────────────────────────────────────────────────────────────┐
│          Module Version Compatibility Matrix                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Platform      │  Core      │  HRM       │  CRM       │  Support│
│  Version       │  Package   │  Module    │  Module    │  Module │
│  ─────────────────────────────────────────────────────────────  │
│  v2.0.x        │  ^2.0      │  ^1.0      │  ^1.0      │  ^1.0   │
│  v2.1.x        │  ^2.1      │  ^1.1      │  ^1.0      │  ^1.1   │
│  v2.2.x        │  ^2.2      │  ^1.2      │  ^1.1      │  ^1.1   │
│  v3.0.x        │  ^3.0      │  ^2.0      │  ^2.0      │  ^2.0   │
│                                                                   │
│  Legend:                                                          │
│  ^1.0  = Compatible with 1.x.x (excludes breaking 2.0)          │
│  ^2.0  = Compatible with 2.x.x (excludes breaking 3.0)          │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘

Example composer.json for Platform v2.1:
{
    "require": {
        "aero/core": "^2.1",
        "aero/hrm-module": "^1.1",
        "aero/crm-module": "^1.0",
        "aero/support-module": "^1.1"
    }
}
```

## Directory Mapping

```
┌─────────────────────────────────────────────────────────────────┐
│         Before Extraction → After Extraction                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Monolithic Repository                Module Package             │
│  ──────────────────────────────────  ─────────────────────────  │
│                                                                   │
│  app/Http/Controllers/Tenant/HRM/  → src/Http/Controllers/      │
│  app/Services/Tenant/HRM/          → src/Services/              │
│  app/Models/Employee.php           → src/Models/Employee.php    │
│  app/Policies/EmployeePolicy.php   → src/Policies/EmployeePolicy│
│  routes/hr.php                     → src/routes/web.php         │
│  resources/js/Tenant/Pages/HRM/    → resources/js/Pages/        │
│  database/migrations/tenant/*hrm*  → database/migrations/       │
│  tests/Feature/HRM/                → tests/Feature/             │
│                                                                   │
│  New Files Created:                                              │
│  ──────────────────                                              │
│  (none)                            → composer.json               │
│  (none)                            → package.json                │
│  (none)                            → src/Providers/HRMServiceProvider.php│
│  (none)                            → config/hrm.php              │
│  (none)                            → README.md                   │
│  (none)                            → CHANGELOG.md                │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

**Note:** These diagrams are text-based for version control compatibility. For presentation purposes, they can be converted to visual diagrams using tools like:
- Draw.io / diagrams.net
- Lucidchart
- PlantUML
- Mermaid.js

**Last Updated:** 2024-12-08  
**Version:** 1.0
