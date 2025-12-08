# HRM Module Extraction: Complete Step-by-Step Guide

This is a detailed, actionable guide for extracting the HRM (Human Resource Management) module from the Aero Enterprise Suite SaaS monolithic application into a separate package repository.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Phase 1: Prepare New Package Repository](#phase-1-prepare-new-package-repository)
3. [Phase 2: Copy Backend Files](#phase-2-copy-backend-files)
4. [Phase 3: Copy Frontend Files](#phase-3-copy-frontend-files)
5. [Phase 4: Copy Database Files](#phase-4-copy-database-files)
6. [Phase 5: Update Namespaces](#phase-5-update-namespaces)
7. [Phase 6: Create Service Provider](#phase-6-create-service-provider)
8. [Phase 7: Create Configuration](#phase-7-create-configuration)
9. [Phase 8: Update Routes](#phase-8-update-routes)
10. [Phase 9: Handle Dependencies](#phase-9-handle-dependencies)
11. [Phase 10: Testing](#phase-10-testing)
12. [Phase 11: Integration with Main Platform](#phase-11-integration-with-main-platform)
13. [Phase 12: Final Verification](#phase-12-final-verification)

---

## Prerequisites

### Tools Required

- [x] Git installed
- [x] Composer installed
- [x] Node.js (v18+) and npm installed
- [x] PHP 8.2+
- [x] Access to main repository
- [x] Text editor (VS Code recommended)

### Knowledge Required

- [x] Laravel package development basics
- [x] Understanding of PSR-4 autoloading
- [x] React/Inertia.js basics
- [x] Multi-tenancy concepts

### Estimated Time

- **Total Time:** 6-8 hours
- **Preparation:** 1 hour
- **File Migration:** 2 hours
- **Namespace Updates:** 1 hour
- **Configuration:** 1 hour
- **Testing:** 2-3 hours

---

## Phase 1: Prepare New Package Repository

### Step 1.1: Create Repository Directory

```bash
# Navigate to your workspace
cd ~/workspace

# Create new directory for HRM module
mkdir aero-hrm-module
cd aero-hrm-module

# Initialize git repository
git init
git branch -M main
```

### Step 1.2: Create Directory Structure

```bash
# Create all necessary directories
mkdir -p src/{Http/{Controllers,Middleware,Requests},Models,Services,Policies,Events,Listeners,Jobs,Providers,routes}
mkdir -p resources/{js/{Pages,Components,Tables,Forms,Hooks},views}
mkdir -p database/{migrations,seeders,factories}
mkdir -p tests/{Feature,Unit}
mkdir -p config
mkdir -p public/assets
```

**Verify structure:**
```bash
tree -L 2 -d
```

Expected output:
```
.
├── config
├── database
│   ├── factories
│   ├── migrations
│   └── seeders
├── public
│   └── assets
├── resources
│   ├── js
│   └── views
├── src
│   ├── Events
│   ├── Http
│   ├── Jobs
│   ├── Listeners
│   ├── Models
│   ├── Policies
│   ├── Providers
│   ├── Services
│   └── routes
└── tests
    ├── Feature
    └── Unit
```

### Step 1.3: Create composer.json

```bash
cat > composer.json << 'EOF'
{
    "name": "aero/hrm-module",
    "description": "Human Resource Management Module for Aero Enterprise Suite",
    "type": "library",
    "license": "proprietary",
    "keywords": ["laravel", "hrm", "payroll", "attendance", "leave"],
    "authors": [
        {
            "name": "Aero Development Team",
            "email": "dev@aero-erp.com"
        }
    ],
    "require": {
        "php": "^8.2",
        "laravel/framework": "^11.0",
        "inertiajs/inertia-laravel": "2.x-dev",
        "stancl/tenancy": "^3.9",
        "spatie/laravel-permission": "^6.20",
        "spatie/laravel-activitylog": "^4.10",
        "maatwebsite/excel": "^3.1",
        "barryvdh/laravel-dompdf": "^3.1"
    },
    "require-dev": {
        "phpunit/phpunit": "^11.0",
        "orchestra/testbench": "^9.0",
        "mockery/mockery": "^1.6"
    },
    "autoload": {
        "psr-4": {
            "Aero\\HRM\\": "src/"
        }
    },
    "autoload-dev": {
        "psr-4": {
            "Aero\\HRM\\Tests\\": "tests/"
        }
    },
    "extra": {
        "laravel": {
            "providers": [
                "Aero\\HRM\\Providers\\HRMServiceProvider"
            ]
        },
        "aero": {
            "module-code": "hrm",
            "module-name": "Human Resource Management",
            "platform-compatibility": "^2.0",
            "category": "human_resources"
        }
    },
    "minimum-stability": "dev",
    "prefer-stable": true
}
EOF
```

### Step 1.4: Create package.json

```bash
cat > package.json << 'EOF'
{
    "name": "@aero/hrm-module",
    "version": "1.0.0",
    "description": "HRM module frontend assets",
    "scripts": {
        "dev": "vite",
        "build": "vite build"
    },
    "dependencies": {
        "@heroicons/react": "^2.2.0",
        "@heroui/react": "^2.8.2",
        "@inertiajs/react": "^1.0.0",
        "react": "^18.2.0",
        "react-dom": "^18.2.0",
        "date-fns": "^4.1.0",
        "dayjs": "^1.11.12",
        "exceljs": "^4.4.0"
    },
    "devDependencies": {
        "@vitejs/plugin-react": "^4.2.0",
        "vite": "^5.0.0"
    }
}
EOF
```

### Step 1.5: Create .gitignore

```bash
cat > .gitignore << 'EOF'
/vendor/
/node_modules/
.env
.env.testing
.phpunit.result.cache
composer.lock
package-lock.json
/.idea/
/.vscode/
*.swp
*.swo
*~
.DS_Store
/public/hot
/public/storage
/storage/*.key
EOF
```

### Step 1.6: Create README.md

```bash
cat > README.md << 'EOF'
# Aero HRM Module

Human Resource Management module for Aero Enterprise Suite SaaS platform.

## Features

- Employee Management
- Attendance Tracking (GPS, QR Code, IP-based)
- Leave Management
- Payroll Processing
- Department & Designation Management
- Performance Management
- Document Management

## Installation

```bash
composer require aero/hrm-module
```

## Configuration

```bash
php artisan vendor:publish --tag=hrm-config
php artisan vendor:publish --tag=hrm-assets
php artisan migrate
```

## Documentation

See the main platform documentation for usage details.

## License

Proprietary
EOF
```

---

## Phase 2: Copy Backend Files

### Step 2.1: Copy Controllers

**Location in monolith:** `app/Http/Controllers/Tenant/HRM/`

```bash
# Set variables for paths
MAIN_REPO="/home/runner/work/Aero-Enterprise-Suite-Saas/Aero-Enterprise-Suite-Saas"
MODULE_REPO="$PWD"

# Copy all HRM controllers
cp -r "$MAIN_REPO/app/Http/Controllers/Tenant/HRM/"* "$MODULE_REPO/src/Http/Controllers/"

# Verify
ls -la src/Http/Controllers/
```

**Files copied:**
```
src/Http/Controllers/
├── Attendance/
│   └── AttendanceController.php
├── Leave/
│   ├── LeaveController.php
│   └── BulkLeaveController.php
├── Employee/
│   ├── EmployeeController.php
│   ├── EmployeeProfileController.php
│   ├── EmployeeDocumentController.php
│   ├── PayrollController.php
│   └── EmployeeSelfServiceController.php
└── (other HRM controllers)
```

### Step 2.2: Copy Services

**Location in monolith:** `app/Services/Tenant/HRM/`

```bash
# Copy all HRM services
cp -r "$MAIN_REPO/app/Services/Tenant/HRM/"* "$MODULE_REPO/src/Services/"

# Verify
ls -la src/Services/
```

**Files copied (22 services):**
```
src/Services/
├── AttendanceCalculationService.php
├── AttendancePunchService.php
├── AttendanceValidatorFactory.php
├── BaseAttendanceValidator.php
├── BulkLeaveService.php
├── DatabaseOptimizationService.php
├── HRMetricsAggregatorService.php
├── IpLocationValidator.php
├── LeaveApprovalService.php
├── LeaveBalanceService.php
├── LeaveCrudService.php
├── LeaveOverlapService.php
├── LeaveQueryService.php
├── LeaveSummaryService.php
├── LeaveValidationService.php
├── PayrollCalculationService.php
├── PayrollReportService.php
├── PayslipService.php
├── PolygonLocationValidator.php
├── QrCodeValidator.php
├── RouteWaypointValidator.php
└── TaxRuleEngine.php
```

### Step 2.3: Copy Models

**Location in monolith:** `app/Models/Tenant/HRM/`

```bash
# Copy all HRM models
cp -r "$MAIN_REPO/app/Models/Tenant/HRM/"* "$MODULE_REPO/src/Models/"

# Verify
ls -la src/Models/
```

**Files copied (20+ models):**
```
src/Models/
├── Employee.php
├── Department.php
├── Designation.php
├── Attendance.php
├── AttendanceType.php
├── AttendanceSetting.php
├── Leave.php
├── LeaveBalance.php
├── LeaveSetting.php
├── Payroll.php
├── PayrollAllowance.php
├── PayrollDeduction.php
├── EmployeeAddress.php
├── EmployeeBankDetail.php
├── EmployeeCertification.php
├── EmployeeDependent.php
├── EmployeeEducation.php
├── EmployeePersonalDocument.php
├── EmployeeSalaryStructure.php
└── EmployeeWorkExperience.php
```

### Step 2.4: Copy Policies

```bash
# Find and copy HRM-related policies
find "$MAIN_REPO/app/Policies" -type f \( -name "*Employee*" -o -name "*Attendance*" -o -name "*Leave*" -o -name "*Payroll*" \) -exec cp {} "$MODULE_REPO/src/Policies/" \;

# Verify
ls -la src/Policies/
```

### Step 2.5: Copy Requests (Form Validation)

```bash
# Find and copy HRM-related form requests
find "$MAIN_REPO/app/Http/Requests" -type f \( -name "*Employee*" -o -name "*Attendance*" -o -name "*Leave*" -o -name "*Payroll*" \) -exec cp {} "$MODULE_REPO/src/Http/Requests/" \;

# If they don't exist, we'll create them later
ls -la src/Http/Requests/
```

---

## Phase 3: Copy Frontend Files

### Step 3.1: Copy React Pages

```bash
# Copy Employee pages
cp -r "$MAIN_REPO/resources/js/Tenant/Pages/Employees" "$MODULE_REPO/resources/js/Pages/"

# Copy HR pages
cp -r "$MAIN_REPO/resources/js/Tenant/Pages/HR" "$MODULE_REPO/resources/js/Pages/"

# Copy individual HRM pages
cp "$MAIN_REPO/resources/js/Tenant/Pages/AttendanceAdmin.jsx" "$MODULE_REPO/resources/js/Pages/"
cp "$MAIN_REPO/resources/js/Tenant/Pages/AttendanceEmployee.jsx" "$MODULE_REPO/resources/js/Pages/"
cp "$MAIN_REPO/resources/js/Tenant/Pages/LeavesAdmin.jsx" "$MODULE_REPO/resources/js/Pages/"
cp "$MAIN_REPO/resources/js/Tenant/Pages/LeavesEmployee.jsx" "$MODULE_REPO/resources/js/Pages/"
cp "$MAIN_REPO/resources/js/Tenant/Pages/LeaveSummary.jsx" "$MODULE_REPO/resources/js/Pages/"

# Verify
ls -la resources/js/Pages/
```

### Step 3.2: Copy Components

```bash
# Find and copy HRM-related components
find "$MAIN_REPO/resources/js/Components" -type f \( -name "*Employee*" -o -name "*Attendance*" -o -name "*Leave*" -o -name "*Payroll*" \) -exec cp --parents {} "$MODULE_REPO/resources/js/" \;

# Copy specific component directories if they exist
if [ -d "$MAIN_REPO/resources/js/Components/BulkLeave" ]; then
    cp -r "$MAIN_REPO/resources/js/Components/BulkLeave" "$MODULE_REPO/resources/js/Components/"
fi

# Verify
ls -la resources/js/Components/
```

### Step 3.3: Copy Tables

```bash
# Find and copy HRM-related table components
find "$MAIN_REPO/resources/js/Tables" -type f \( -name "*Employee*" -o -name "*Attendance*" -o -name "*Leave*" -o -name "*Payroll*" -o -name "*TimeSheet*" \) -exec cp {} "$MODULE_REPO/resources/js/Tables/" \;

# Verify
ls -la resources/js/Tables/
```

### Step 3.4: Copy Forms

```bash
# Find and copy HRM-related form components
find "$MAIN_REPO/resources/js/Forms" -type f \( -name "*Employee*" -o -name "*Leave*" -o -name "*Attendance*" \) -exec cp {} "$MODULE_REPO/resources/js/Forms/" \;

# Verify
ls -la resources/js/Forms/
```

---

## Phase 4: Copy Database Files

### Step 4.1: Copy Migrations

```bash
# Find and copy HRM-related migrations
find "$MAIN_REPO/database/migrations/tenant" -type f \( -name "*employee*" -o -name "*attendance*" -o -name "*leave*" -o -name "*payroll*" -o -name "*hrm*" -o -name "*department*" -o -name "*designation*" \) -exec cp {} "$MODULE_REPO/database/migrations/" \;

# Verify
ls -la database/migrations/
```

**Expected migrations:**
```
database/migrations/
├── 2024_xx_xx_create_hrm_departments_table.php
├── 2024_xx_xx_create_hrm_designations_table.php
├── 2024_xx_xx_create_hrm_employees_table.php
├── 2024_xx_xx_create_hrm_employee_addresses_table.php
├── 2024_xx_xx_create_hrm_employee_bank_details_table.php
├── 2024_xx_xx_create_hrm_employee_certifications_table.php
├── 2024_xx_xx_create_hrm_employee_dependents_table.php
├── 2024_xx_xx_create_hrm_employee_education_table.php
├── 2024_xx_xx_create_hrm_employee_documents_table.php
├── 2024_xx_xx_create_hrm_employee_work_experience_table.php
├── 2024_xx_xx_create_hrm_employee_salary_structures_table.php
├── 2024_xx_xx_create_hrm_attendance_types_table.php
├── 2024_xx_xx_create_hrm_attendance_settings_table.php
├── 2024_xx_xx_create_hrm_attendances_table.php
├── 2024_xx_xx_create_hrm_leave_settings_table.php
├── 2024_xx_xx_create_hrm_leaves_table.php
├── 2024_xx_xx_create_hrm_leave_balances_table.php
├── 2024_xx_xx_create_hrm_payrolls_table.php
├── 2024_xx_xx_create_hrm_payroll_allowances_table.php
└── 2024_xx_xx_create_hrm_payroll_deductions_table.php
```

### Step 4.2: Copy Seeders (if any)

```bash
# Find and copy HRM-related seeders
find "$MAIN_REPO/database/seeders" -type f \( -name "*HRM*" -o -name "*Employee*" -o -name "*Department*" \) -exec cp {} "$MODULE_REPO/database/seeders/" \;

# Verify
ls -la database/seeders/
```

### Step 4.3: Copy Factories (if any)

```bash
# Find and copy HRM-related factories
find "$MAIN_REPO/database/factories" -type f \( -name "*Employee*" -o -name "*Department*" -o -name "*Attendance*" \) -exec cp {} "$MODULE_REPO/database/factories/" \;

# Verify
ls -la database/factories/
```

---

## Phase 5: Update Namespaces

### Step 5.1: Create Namespace Update Script

```bash
cat > update-namespaces.sh << 'EOF'
#!/bin/bash

# Update PHP namespaces in all files
find src -type f -name "*.php" -exec sed -i \
    -e 's/namespace App\\Http\\Controllers\\Tenant\\HRM/namespace Aero\\HRM\\Http\\Controllers/g' \
    -e 's/namespace App\\Http\\Controllers\\Tenant/namespace Aero\\HRM\\Http\\Controllers/g' \
    -e 's/namespace App\\Models\\Tenant\\HRM/namespace Aero\\HRM\\Models/g' \
    -e 's/namespace App\\Models\\Tenant/namespace Aero\\HRM\\Models/g' \
    -e 's/namespace App\\Services\\Tenant\\HRM/namespace Aero\\HRM\\Services/g' \
    -e 's/namespace App\\Services\\Tenant/namespace Aero\\HRM\\Services/g' \
    -e 's/namespace App\\Policies/namespace Aero\\HRM\\Policies/g' \
    -e 's/namespace App\\Http\\Requests/namespace Aero\\HRM\\Http\\Requests/g' \
    -e 's/namespace App\\Events/namespace Aero\\HRM\\Events/g' \
    -e 's/namespace App\\Jobs/namespace Aero\\HRM\\Jobs/g' \
    {} +

# Update use statements
find src -type f -name "*.php" -exec sed -i \
    -e 's/use App\\Http\\Controllers\\Tenant\\HRM\\/use Aero\\HRM\\Http\\Controllers\\/g' \
    -e 's/use App\\Models\\Tenant\\HRM\\/use Aero\\HRM\\Models\\/g' \
    -e 's/use App\\Services\\Tenant\\HRM\\/use Aero\\HRM\\Services\\/g' \
    -e 's/use App\\Policies\\/use Aero\\HRM\\Policies\\/g' \
    -e 's/use App\\Http\\Requests\\/use Aero\\HRM\\Http\\Requests\\/g' \
    {} +

# Preserve certain imports from main app
find src -type f -name "*.php" -exec sed -i \
    -e 's/use Aero\\HRM\\Models\\User/use App\\Models\\User/g' \
    -e 's/use Aero\\HRM\\Models\\Tenant/use App\\Models\\Tenant/g' \
    {} +

# Add base controller import if extending Controller
find src/Http/Controllers -type f -name "*.php" -exec sed -i \
    '/^namespace/a \\nuse App\\Http\\Controllers\\Controller;' \
    {} +

echo "Namespace updates completed!"
EOF

chmod +x update-namespaces.sh
```

### Step 5.2: Run Namespace Update

```bash
./update-namespaces.sh
```

### Step 5.3: Manual Verification

Open a few key files and verify namespaces are correct:

```bash
# Check Employee model
head -20 src/Models/Employee.php

# Check EmployeeController
head -20 src/Http/Controllers/Employee/EmployeeController.php

# Check LeaveService
head -20 src/Services/LeaveBalanceService.php
```

**Expected format:**
```php
<?php

namespace Aero\HRM\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\User; // Keep this from main app
// ...
```

---

## Phase 6: Create Service Provider

### Step 6.1: Create HRMServiceProvider

```bash
cat > src/Providers/HRMServiceProvider.php << 'EOF'
<?php

namespace Aero\HRM\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Gate;

class HRMServiceProvider extends ServiceProvider
{
    /**
     * Register services.
     */
    public function register(): void
    {
        // Register main HRM service
        $this->app->singleton('hrm', function ($app) {
            return new \Aero\HRM\Services\HRMetricsAggregatorService();
        });

        // Register specific services
        $this->app->singleton('hrm.leave', function ($app) {
            return new \Aero\HRM\Services\LeaveBalanceService();
        });

        $this->app->singleton('hrm.attendance', function ($app) {
            return new \Aero\HRM\Services\AttendanceCalculationService();
        });

        $this->app->singleton('hrm.payroll', function ($app) {
            return new \Aero\HRM\Services\PayrollCalculationService();
        });

        // Merge configuration
        $this->mergeConfigFrom(
            __DIR__.'/../../config/hrm.php', 'hrm'
        );
    }

    /**
     * Bootstrap services.
     */
    public function boot(): void
    {
        // Load migrations
        $this->loadMigrationsFrom(__DIR__.'/../../database/migrations');

        // Register routes
        $this->registerRoutes();

        // Register views (if using Blade)
        $this->loadViewsFrom(__DIR__.'/../../resources/views', 'hrm');

        // Publish configuration
        $this->publishes([
            __DIR__.'/../../config/hrm.php' => config_path('hrm.php'),
        ], 'hrm-config');

        // Publish frontend assets
        $this->publishes([
            __DIR__.'/../../resources/js' => resource_path('js/Modules/HRM'),
        ], 'hrm-assets');

        // Publish migrations (optional - for customization)
        $this->publishes([
            __DIR__.'/../../database/migrations' => database_path('migrations'),
        ], 'hrm-migrations');

        // Register policies
        $this->registerPolicies();

        // Register events
        $this->registerEvents();
    }

    /**
     * Register routes.
     */
    protected function registerRoutes(): void
    {
        // Web routes
        Route::middleware(['web', 'auth', 'tenant.setup'])
            ->prefix('hrm')
            ->name('hrm.')
            ->group(__DIR__.'/../routes/web.php');

        // API routes
        if (file_exists(__DIR__.'/../routes/api.php')) {
            Route::middleware(['api', 'auth:sanctum', 'tenant.setup'])
                ->prefix('api/hrm')
                ->name('api.hrm.')
                ->group(__DIR__.'/../routes/api.php');
        }
    }

    /**
     * Register policies.
     */
    protected function registerPolicies(): void
    {
        // Register model policies if they exist
        $policies = [
            \Aero\HRM\Models\Employee::class => \Aero\HRM\Policies\EmployeePolicy::class,
            \Aero\HRM\Models\Leave::class => \Aero\HRM\Policies\LeavePolicy::class,
            \Aero\HRM\Models\Attendance::class => \Aero\HRM\Policies\AttendancePolicy::class,
        ];

        foreach ($policies as $model => $policy) {
            if (class_exists($policy)) {
                Gate::policy($model, $policy);
            }
        }
    }

    /**
     * Register events and listeners.
     */
    protected function registerEvents(): void
    {
        // Register event listeners if they exist
        $events = __DIR__.'/../Events';
        $listeners = __DIR__.'/../Listeners';

        if (is_dir($events) && is_dir($listeners)) {
            // Auto-discover events and listeners
            // Laravel will handle this if following conventions
        }
    }
}
EOF
```

---

## Phase 7: Create Configuration

### Step 7.1: Create Module Configuration File

```bash
cat > config/hrm.php << 'EOF'
<?php

return [
    /*
    |--------------------------------------------------------------------------
    | HRM Module Configuration
    |--------------------------------------------------------------------------
    */

    'enabled' => env('HRM_MODULE_ENABLED', true),

    /*
    |--------------------------------------------------------------------------
    | Employee Settings
    |--------------------------------------------------------------------------
    */
    'employee' => [
        'code_prefix' => env('HRM_EMPLOYEE_CODE_PREFIX', 'EMP'),
        'code_length' => env('HRM_EMPLOYEE_CODE_LENGTH', 6),
        'probation_period' => env('HRM_PROBATION_PERIOD', 90), // days
        'default_department' => env('HRM_DEFAULT_DEPARTMENT', null),
    ],

    /*
    |--------------------------------------------------------------------------
    | Attendance Settings
    |--------------------------------------------------------------------------
    */
    'attendance' => [
        'methods' => [
            'manual' => env('HRM_ATTENDANCE_MANUAL', true),
            'qr_code' => env('HRM_ATTENDANCE_QR', true),
            'gps' => env('HRM_ATTENDANCE_GPS', true),
            'ip' => env('HRM_ATTENDANCE_IP', true),
            'route' => env('HRM_ATTENDANCE_ROUTE', true),
        ],
        'grace_period' => env('HRM_ATTENDANCE_GRACE_PERIOD', 15), // minutes
        'half_day_hours' => env('HRM_ATTENDANCE_HALF_DAY_HOURS', 4),
        'full_day_hours' => env('HRM_ATTENDANCE_FULL_DAY_HOURS', 8),
        'overtime_threshold' => env('HRM_ATTENDANCE_OVERTIME_THRESHOLD', 8), // hours
    ],

    /*
    |--------------------------------------------------------------------------
    | Leave Settings
    |--------------------------------------------------------------------------
    */
    'leave' => [
        'require_approval' => env('HRM_LEAVE_REQUIRE_APPROVAL', true),
        'approval_levels' => env('HRM_LEAVE_APPROVAL_LEVELS', 1),
        'max_consecutive_days' => env('HRM_LEAVE_MAX_CONSECUTIVE_DAYS', 30),
        'advance_notice_days' => env('HRM_LEAVE_ADVANCE_NOTICE_DAYS', 3),
        'allow_weekend_counting' => env('HRM_LEAVE_COUNT_WEEKENDS', false),
        'allow_holiday_counting' => env('HRM_LEAVE_COUNT_HOLIDAYS', false),
        
        // Default leave allocations (per year)
        'default_allocations' => [
            'annual' => env('HRM_LEAVE_ANNUAL', 15),
            'sick' => env('HRM_LEAVE_SICK', 10),
            'casual' => env('HRM_LEAVE_CASUAL', 7),
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Payroll Settings
    |--------------------------------------------------------------------------
    */
    'payroll' => [
        'currency' => env('HRM_PAYROLL_CURRENCY', 'USD'),
        'pay_frequency' => env('HRM_PAYROLL_FREQUENCY', 'monthly'), // monthly, bi-weekly, weekly
        'payment_day' => env('HRM_PAYROLL_PAYMENT_DAY', 1), // day of month
        
        // Tax settings
        'enable_tax' => env('HRM_PAYROLL_ENABLE_TAX', true),
        'tax_method' => env('HRM_PAYROLL_TAX_METHOD', 'progressive'), // flat, progressive
        
        // Deductions
        'enable_pf' => env('HRM_PAYROLL_ENABLE_PF', true), // Provident Fund
        'enable_esi' => env('HRM_PAYROLL_ENABLE_ESI', true), // Employee State Insurance
        
        // Default components
        'components' => [
            'basic_percentage' => 40, // % of gross salary
            'hra_percentage' => 30,   // % of gross salary
            'transport_allowance' => 1600,
            'special_allowance' => 'remaining', // auto-calculated
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Document Management
    |--------------------------------------------------------------------------
    */
    'documents' => [
        'max_size' => env('HRM_DOCUMENT_MAX_SIZE', 10), // MB
        'allowed_types' => ['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png'],
        'categories' => [
            'identity',
            'education',
            'certification',
            'contract',
            'other',
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Performance Management
    |--------------------------------------------------------------------------
    */
    'performance' => [
        'enabled' => env('HRM_PERFORMANCE_ENABLED', true),
        'review_frequency' => env('HRM_PERFORMANCE_REVIEW_FREQUENCY', 'yearly'), // yearly, half-yearly, quarterly
        'rating_scale' => 5, // 1-5 rating
    ],

    /*
    |--------------------------------------------------------------------------
    | Notifications
    |--------------------------------------------------------------------------
    */
    'notifications' => [
        'employee_created' => env('HRM_NOTIFY_EMPLOYEE_CREATED', true),
        'leave_requested' => env('HRM_NOTIFY_LEAVE_REQUESTED', true),
        'leave_approved' => env('HRM_NOTIFY_LEAVE_APPROVED', true),
        'attendance_marked' => env('HRM_NOTIFY_ATTENDANCE_MARKED', false),
        'payroll_generated' => env('HRM_NOTIFY_PAYROLL_GENERATED', true),
    ],

    /*
    |--------------------------------------------------------------------------
    | Integration Settings
    |--------------------------------------------------------------------------
    */
    'integrations' => [
        'biometric' => env('HRM_INTEGRATION_BIOMETRIC', false),
        'google_calendar' => env('HRM_INTEGRATION_GOOGLE_CALENDAR', false),
        'slack' => env('HRM_INTEGRATION_SLACK', false),
    ],
];
EOF
```

---

## Phase 8: Update Routes

### Step 8.1: Copy and Update Routes File

```bash
# Copy routes from main application
cp "$MAIN_REPO/routes/hr.php" src/routes/web.php
```

### Step 8.2: Update Route Namespaces

```bash
cat > src/routes/web.php << 'EOF'
<?php

use Illuminate\Support\Facades\Route;
use Aero\HRM\Http\Controllers\Employee\EmployeeController;
use Aero\HRM\Http\Controllers\Employee\EmployeeProfileController;
use Aero\HRM\Http\Controllers\Employee\EmployeeDocumentController;
use Aero\HRM\Http\Controllers\Employee\PayrollController;
use Aero\HRM\Http\Controllers\Attendance\AttendanceController;
use Aero\HRM\Http\Controllers\Leave\LeaveController;
use Aero\HRM\Http\Controllers\Leave\BulkLeaveController;

/*
|--------------------------------------------------------------------------
| HRM Module Routes
|--------------------------------------------------------------------------
|
| All routes are automatically prefixed with /hrm and have the 'hrm.' name prefix
| Middleware: ['web', 'auth', 'tenant.setup'] applied by service provider
|
*/

// Dashboard
Route::get('/dashboard', function () {
    return inertia('HRM::Dashboard');
})->name('dashboard');

// Employee Management
Route::prefix('employees')->name('employees.')->group(function () {
    Route::get('/', [EmployeeController::class, 'index'])->name('index');
    Route::get('/create', [EmployeeController::class, 'create'])->name('create');
    Route::post('/', [EmployeeController::class, 'store'])->name('store');
    Route::get('/{employee}', [EmployeeController::class, 'show'])->name('show');
    Route::get('/{employee}/edit', [EmployeeController::class, 'edit'])->name('edit');
    Route::put('/{employee}', [EmployeeController::class, 'update'])->name('update');
    Route::delete('/{employee}', [EmployeeController::class, 'destroy'])->name('destroy');
    
    // Employee profile management
    Route::prefix('{employee}')->group(function () {
        Route::get('/profile', [EmployeeProfileController::class, 'show'])->name('profile');
        Route::put('/profile', [EmployeeProfileController::class, 'update'])->name('profile.update');
        
        // Documents
        Route::get('/documents', [EmployeeDocumentController::class, 'index'])->name('documents.index');
        Route::post('/documents', [EmployeeDocumentController::class, 'store'])->name('documents.store');
        Route::delete('/documents/{document}', [EmployeeDocumentController::class, 'destroy'])->name('documents.destroy');
    });
    
    // Bulk operations
    Route::post('/bulk-import', [EmployeeController::class, 'bulkImport'])->name('bulk-import');
    Route::post('/bulk-delete', [EmployeeController::class, 'bulkDelete'])->name('bulk-delete');
});

// Department Management
Route::resource('departments', \Aero\HRM\Http\Controllers\DepartmentController::class);

// Designation Management
Route::resource('designations', \Aero\HRM\Http\Controllers\DesignationController::class);

// Attendance Management
Route::prefix('attendance')->name('attendance.')->group(function () {
    Route::get('/', [AttendanceController::class, 'index'])->name('index');
    Route::get('/admin', [AttendanceController::class, 'admin'])->name('admin');
    Route::get('/employee', [AttendanceController::class, 'employee'])->name('employee');
    Route::post('/punch-in', [AttendanceController::class, 'punchIn'])->name('punch-in');
    Route::post('/punch-out', [AttendanceController::class, 'punchOut'])->name('punch-out');
    Route::get('/{attendance}', [AttendanceController::class, 'show'])->name('show');
    Route::put('/{attendance}', [AttendanceController::class, 'update'])->name('update');
    Route::delete('/{attendance}', [AttendanceController::class, 'destroy'])->name('destroy');
    
    // Reports
    Route::get('/reports/summary', [AttendanceController::class, 'summary'])->name('reports.summary');
    Route::get('/reports/export', [AttendanceController::class, 'export'])->name('reports.export');
});

// Leave Management
Route::prefix('leaves')->name('leaves.')->group(function () {
    Route::get('/', [LeaveController::class, 'index'])->name('index');
    Route::get('/admin', [LeaveController::class, 'admin'])->name('admin');
    Route::get('/employee', [LeaveController::class, 'employee'])->name('employee');
    Route::get('/summary', [LeaveController::class, 'summary'])->name('summary');
    Route::get('/create', [LeaveController::class, 'create'])->name('create');
    Route::post('/', [LeaveController::class, 'store'])->name('store');
    Route::get('/{leave}', [LeaveController::class, 'show'])->name('show');
    Route::get('/{leave}/edit', [LeaveController::class, 'edit'])->name('edit');
    Route::put('/{leave}', [LeaveController::class, 'update'])->name('update');
    Route::delete('/{leave}', [LeaveController::class, 'destroy'])->name('destroy');
    
    // Leave actions
    Route::post('/{leave}/approve', [LeaveController::class, 'approve'])->name('approve');
    Route::post('/{leave}/reject', [LeaveController::class, 'reject'])->name('reject');
    Route::post('/{leave}/cancel', [LeaveController::class, 'cancel'])->name('cancel');
    
    // Bulk leave
    Route::prefix('bulk')->name('bulk.')->group(function () {
        Route::get('/', [BulkLeaveController::class, 'index'])->name('index');
        Route::post('/', [BulkLeaveController::class, 'store'])->name('store');
        Route::post('/approve', [BulkLeaveController::class, 'approve'])->name('approve');
    });
    
    // Leave balance
    Route::get('/balance/{employee}', [LeaveController::class, 'balance'])->name('balance');
});

// Payroll Management
Route::prefix('payroll')->name('payroll.')->group(function () {
    Route::get('/', [PayrollController::class, 'index'])->name('index');
    Route::get('/generate', [PayrollController::class, 'generate'])->name('generate');
    Route::post('/generate', [PayrollController::class, 'processGenerate'])->name('process-generate');
    Route::get('/{payroll}', [PayrollController::class, 'show'])->name('show');
    Route::get('/{payroll}/payslip', [PayrollController::class, 'payslip'])->name('payslip');
    Route::get('/{payroll}/download', [PayrollController::class, 'download'])->name('download');
    Route::post('/{payroll}/approve', [PayrollController::class, 'approve'])->name('approve');
    Route::post('/{payroll}/disburse', [PayrollController::class, 'disburse'])->name('disburse');
    
    // Bulk operations
    Route::post('/bulk-approve', [PayrollController::class, 'bulkApprove'])->name('bulk-approve');
    Route::post('/bulk-disburse', [PayrollController::class, 'bulkDisburse'])->name('bulk-disburse');
});

// Settings
Route::prefix('settings')->name('settings.')->group(function () {
    Route::get('/attendance', [\Aero\HRM\Http\Controllers\Settings\AttendanceSettingController::class, 'index'])->name('attendance');
    Route::put('/attendance', [\Aero\HRM\Http\Controllers\Settings\AttendanceSettingController::class, 'update'])->name('attendance.update');
    
    Route::get('/leave', [\Aero\HRM\Http\Controllers\Settings\LeaveSettingController::class, 'index'])->name('leave');
    Route::put('/leave', [\Aero\HRM\Http\Controllers\Settings\LeaveSettingController::class, 'update'])->name('leave.update');
    
    Route::get('/payroll', [\Aero\HRM\Http\Controllers\Settings\PayrollSettingController::class, 'index'])->name('payroll');
    Route::put('/payroll', [\Aero\HRM\Http\Controllers\Settings\PayrollSettingController::class, 'update'])->name('payroll.update');
});
EOF
```

---

## Phase 9: Handle Dependencies

### Step 9.1: Identify Shared Dependencies

Create a list of dependencies that need to remain in the main app:

```bash
cat > DEPENDENCIES.md << 'EOF'
# HRM Module Dependencies

## Dependencies on Main Application

### Models
- `App\Models\User` - User authentication model
- `App\Models\Tenant` - Tenant model (for multi-tenancy)

### Base Classes
- `App\Http\Controllers\Controller` - Base controller
- `App\Http\Middleware\*` - Core middleware

### Services
- Authentication services
- Notification services
- File upload services

### Configuration
- Multi-tenancy configuration
- Authentication configuration

## Shared Components (Consider moving to aero-core package)

- TenantService
- NotificationService
- FileUploadService
- Common traits (HasTenantScope, etc.)
- Common interfaces

## Future: Create aero-core Package

For shared functionality across all modules:
- Contracts/Interfaces
- Traits
- Base services
- Common middleware
- Shared utilities
EOF
```

### Step 9.2: Update Composer Dependencies

Ensure all required dependencies are in composer.json (already done in Step 1.3).

---

## Phase 10: Testing

### Step 10.1: Install Dependencies

```bash
# Install PHP dependencies
composer install

# Install Node dependencies
npm install
```

### Step 10.2: Create Test Configuration

```bash
# Create phpunit.xml
cat > phpunit.xml << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<phpunit xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:noNamespaceSchemaLocation="vendor/phpunit/phpunit/phpunit.xsd"
         bootstrap="vendor/autoload.php"
         colors="true">
    <testsuites>
        <testsuite name="HRM Module Test Suite">
            <directory>tests</directory>
        </testsuite>
    </testsuites>
    <php>
        <env name="APP_ENV" value="testing"/>
        <env name="DB_CONNECTION" value="sqlite"/>
        <env name="DB_DATABASE" value=":memory:"/>
    </php>
</phpunit>
EOF
```

### Step 10.3: Create Basic Tests

```bash
# Create a basic feature test
cat > tests/Feature/EmployeeTest.php << 'EOF'
<?php

namespace Aero\HRM\Tests\Feature;

use Tests\TestCase;
use Aero\HRM\Models\Employee;
use Aero\HRM\Models\Department;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

class EmployeeTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_create_employee()
    {
        $user = User::factory()->create();
        $department = Department::factory()->create();

        $response = $this->actingAs($user)->post(route('hrm.employees.store'), [
            'first_name' => 'John',
            'last_name' => 'Doe',
            'email' => 'john@example.com',
            'department_id' => $department->id,
            'join_date' => now()->toDateString(),
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('hrm_employees', [
            'email' => 'john@example.com',
        ]);
    }

    public function test_can_list_employees()
    {
        $user = User::factory()->create();
        Employee::factory()->count(5)->create();

        $response = $this->actingAs($user)->get(route('hrm.employees.index'));

        $response->assertStatus(200);
    }
}
EOF
```

### Step 10.4: Run Tests

```bash
# Run tests
vendor/bin/phpunit

# Or with verbose output
vendor/bin/phpunit --verbose
```

---

## Phase 11: Integration with Main Platform

### Step 11.1: Prepare Main Platform

In the main platform repository:

```bash
cd "$MAIN_REPO"
```

### Step 11.2: Update Main Platform composer.json

Add the HRM module as a dependency:

```bash
# Edit composer.json
cat >> composer.json << 'EOF'
{
    "repositories": [
        {
            "type": "path",
            "url": "../aero-hrm-module"
        }
    ],
    "require": {
        "aero/hrm-module": "@dev"
    }
}
EOF
```

### Step 11.3: Install HRM Module in Main Platform

```bash
# Install the module
composer require aero/hrm-module

# Publish assets
php artisan vendor:publish --tag=hrm-assets

# Publish configuration (optional)
php artisan vendor:publish --tag=hrm-config

# Run migrations (if needed - they should already exist in tenant DBs)
# php artisan migrate
```

### Step 11.4: Update Vite Configuration

Edit `vite.config.js` in main platform:

```javascript
import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
    plugins: [
        laravel({
            input: [
                'resources/js/app.jsx',
                'resources/js/Modules/HRM/index.jsx', // Add HRM module entry
            ],
            refresh: true,
        }),
        react(),
    ],
    resolve: {
        alias: {
            '@': '/resources/js',
            '@hrm': '/resources/js/Modules/HRM', // Add HRM alias
        },
    },
});
```

### Step 11.5: Update Main Platform's Inertia Configuration

Edit `resources/js/app.jsx`:

```javascript
// Add support for module namespaces
const pages = import.meta.glob([
    './Tenant/Pages/**/*.jsx',
    './Modules/*/Pages/**/*.jsx', // Support module pages
]);

createInertiaApp({
    resolve: (name) => {
        // Support module namespacing: "HRM::EmployeeList"
        if (name.includes('::')) {
            const [module, page] = name.split('::');
            const path = `./Modules/${module}/Pages/${page}.jsx`;
            return pages[path]();
        }
        
        // Regular pages
        const path = `./Tenant/Pages/${name}.jsx`;
        return pages[path]();
    },
    // ... rest of configuration
});
```

### Step 11.6: Build Assets

```bash
# Build frontend assets
npm run build

# Or for development
npm run dev
```

### Step 11.7: Update config/modules.php

Add HRM as an external package:

```php
'external_packages' => [
    'hrm' => [
        'package' => 'aero/hrm-module',
        'enabled' => true,
        'version' => '^1.0',
        'provider' => 'Aero\\HRM\\Providers\\HRMServiceProvider',
        'config_path' => 'hrm',
        'category' => 'human_resources',
    ],
],
```

---

## Phase 12: Final Verification

### Step 12.1: Clear Caches

```bash
cd "$MAIN_REPO"

# Clear all caches
php artisan cache:clear
php artisan config:clear
php artisan route:clear
php artisan view:clear

# Rebuild caches
php artisan config:cache
php artisan route:cache
php artisan optimize
```

### Step 12.2: Test Routes

```bash
# List all HRM routes
php artisan route:list --path=hrm

# Expected output should show routes like:
# GET|HEAD  hrm/employees ................ hrm.employees.index
# POST      hrm/employees ................ hrm.employees.store
# GET|HEAD  hrm/attendance ............... hrm.attendance.index
# etc.
```

### Step 12.3: Manual Testing

1. **Start development server:**
   ```bash
   php artisan serve
   ```

2. **Test in browser:**
   - Navigate to `http://localhost:8000/hrm/employees`
   - Verify employee list loads
   - Test creating a new employee
   - Test attendance functionality
   - Test leave management
   - Test payroll features

3. **Check for errors:**
   - Monitor `storage/logs/laravel.log`
   - Check browser console for JavaScript errors
   - Verify all API calls succeed

### Step 12.4: Run Integration Tests

```bash
# In main platform
php artisan test --filter=HRM

# Or run specific test suite
php artisan test tests/Feature/HRM/
```

### Step 12.5: Performance Check

```bash
# Check page load times
# Use Laravel Telescope or Debugbar if installed

# Check query count
# Ensure no N+1 query issues
```

---

## Checklist: HRM Module Extraction

### Pre-Extraction
- [ ] Reviewed HRM module structure in monolith
- [ ] Identified all HRM-related files
- [ ] Backed up main repository
- [ ] Created new package repository structure

### File Migration
- [ ] Copied all controllers (Attendance, Leave, Employee, Payroll)
- [ ] Copied all services (22 service files)
- [ ] Copied all models (20+ model files)
- [ ] Copied all policies
- [ ] Copied frontend pages (Employees, Attendance, Leaves, Payroll)
- [ ] Copied components and tables
- [ ] Copied forms
- [ ] Copied migrations (20+ migration files)
- [ ] Copied seeders and factories

### Configuration
- [ ] Created composer.json with correct autoload
- [ ] Created package.json with dependencies
- [ ] Updated all PHP namespaces
- [ ] Updated all use statements
- [ ] Created service provider
- [ ] Created module configuration file
- [ ] Updated routes file
- [ ] Created README and documentation

### Integration
- [ ] Added module to main platform composer.json
- [ ] Installed module via composer
- [ ] Published assets
- [ ] Updated Vite configuration
- [ ] Updated Inertia configuration
- [ ] Updated config/modules.php
- [ ] Built frontend assets

### Testing
- [ ] Installed dependencies (composer install)
- [ ] Ran PHPUnit tests
- [ ] Tested employee management
- [ ] Tested attendance tracking
- [ ] Tested leave management
- [ ] Tested payroll processing
- [ ] Verified all routes work
- [ ] Checked for errors in logs
- [ ] Verified frontend loads correctly

### Documentation
- [ ] Created README.md
- [ ] Documented API endpoints
- [ ] Listed dependencies
- [ ] Created CHANGELOG.md
- [ ] Added usage examples

### Version Control
- [ ] Committed all changes to module repository
- [ ] Tagged initial release (v1.0.0)
- [ ] Pushed to remote repository
- [ ] Updated main platform to use published version

---

## Troubleshooting

### Common Issues and Solutions

#### Issue 1: Class Not Found

**Error:**
```
Class 'Aero\HRM\Models\Employee' not found
```

**Solution:**
```bash
# In module repository
composer dump-autoload

# In main platform
composer dump-autoload
php artisan optimize:clear
```

#### Issue 2: Routes Not Loading

**Error:**
```
Route [hrm.employees.index] not defined
```

**Solution:**
```bash
# Clear route cache
php artisan route:clear

# Check if service provider is registered
php artisan about

# Rebuild route cache
php artisan route:cache
```

#### Issue 3: Frontend Assets Not Found

**Error:**
```
Module not found: Can't resolve '@hrm/Pages/EmployeeList'
```

**Solution:**
```bash
# Publish assets again
php artisan vendor:publish --tag=hrm-assets --force

# Rebuild frontend
npm run build
```

#### Issue 4: Namespace Errors

**Error:**
```
Class 'App\Models\Tenant\HRM\Employee' not found
```

**Solution:**
```bash
# Re-run namespace update script
cd /path/to/aero-hrm-module
./update-namespaces.sh

# Check files manually and fix remaining issues
```

#### Issue 5: Migration Already Exists

**Error:**
```
Migration already exists: create_hrm_employees_table
```

**Solution:**
```
# Don't run migrations again if they're already in tenant databases
# Only publish migrations if you want tenants to have them for customization
```

#### Issue 6: Inertia Component Not Found

**Error:**
```
Inertia page not found: HRM::EmployeeList
```

**Solution:**
1. Check assets are published: `ls resources/js/Modules/HRM/`
2. Verify Vite alias in vite.config.js
3. Update Inertia resolver to support module namespace
4. Rebuild: `npm run build`

---

## Next Steps After Extraction

### 1. Create Remote Repository

```bash
cd /path/to/aero-hrm-module

# Create repository on GitHub/GitLab
# Then add remote and push

git remote add origin https://github.com/your-org/aero-hrm-module.git
git add .
git commit -m "Initial commit: HRM module extracted from monolith"
git push -u origin main
```

### 2. Tag First Release

```bash
git tag -a v1.0.0 -m "Initial release of HRM module"
git push origin v1.0.0
```

### 3. Update Main Platform to Use Remote Package

In main platform's composer.json:

```json
{
    "repositories": [
        {
            "type": "vcs",
            "url": "https://github.com/your-org/aero-hrm-module"
        }
    ],
    "require": {
        "aero/hrm-module": "^1.0"
    }
}
```

### 4. Set Up CI/CD

Create `.github/workflows/tests.yml` in module repository:

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup PHP
        uses: shivammathur/setup-php@v2
        with:
          php-version: '8.2'
      
      - name: Install Dependencies
        run: composer install
      
      - name: Run Tests
        run: vendor/bin/phpunit
```

### 5. Documentation

Create comprehensive documentation:
- Installation guide
- Configuration reference
- API documentation
- Usage examples
- Troubleshooting guide

---

## Summary

You've successfully extracted the HRM module! The module now:

✅ Lives in its own repository  
✅ Has independent versioning  
✅ Can be developed separately  
✅ Integrates seamlessly with main platform  
✅ Maintains all functionality  
✅ Preserves multi-tenancy  
✅ Supports independent testing  
✅ Can be reused across projects  

**Total Time Invested:** 6-8 hours  
**Files Moved:** ~100+ files  
**Lines of Code:** ~20,000+ lines  
**Result:** Production-ready package  

---

**Document Version:** 1.0  
**Last Updated:** 2024-12-08  
**Module:** HRM (Human Resource Management)  
**Status:** Complete and Ready for Use
