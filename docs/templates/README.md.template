# Aero HRM Module

Human Resource Management module for Aero Enterprise Suite. Works as a standalone Laravel package or within the multi-tenant Aero platform.

## Features

- 👥 **Employee Management** - Complete employee lifecycle management
- 🏢 **Department Management** - Organize teams and departments
- 📊 **Designation Management** - Job titles and hierarchies
- ⏰ **Attendance Tracking** - Track employee attendance
- 🏖️ **Leave Management** - Leave requests and approvals
- 💰 **Payroll Integration** - Salary structures and payroll

## Requirements

- PHP >= 8.2
- Laravel >= 11.0
- MySQL >= 8.0 or PostgreSQL >= 13

## Installation

### Standalone Installation

For use in a regular Laravel application:

```bash
composer require aero-modules/hrm
```

Publish the configuration and migrations:

```bash
php artisan vendor:publish --tag=aero-hrm-config
php artisan vendor:publish --tag=aero-hrm-migrations
php artisan vendor:publish --tag=aero-hrm-assets
```

Run migrations:

```bash
php artisan migrate
```

### Multi-Tenant Platform Installation

If you're using this within the Aero Enterprise multi-tenant platform, the module will automatically detect the tenant context and configure itself appropriately.

```bash
composer require aero-modules/hrm
```

For tenant databases:

```bash
php artisan tenants:run migrate
```

## Configuration

The configuration file is published to `config/aero-hrm.php`.

### Basic Configuration

```php
return [
    // Route configuration
    'routes' => [
        'prefix' => 'hrm',
        'middleware' => ['web', 'auth'],
    ],
    
    // Authentication
    'auth' => [
        'user_model' => env('HRM_USER_MODEL', \App\Models\User::class),
    ],
    
    // Feature flags
    'features' => [
        'attendance' => env('HRM_ATTENDANCE_ENABLED', true),
        'payroll' => env('HRM_PAYROLL_ENABLED', true),
        'leave' => env('HRM_LEAVE_ENABLED', true),
    ],
    
    // Employee settings
    'employee' => [
        'id_prefix' => env('HRM_EMPLOYEE_ID_PREFIX', 'EMP'),
        'id_padding' => env('HRM_EMPLOYEE_ID_PADDING', 5),
    ],
];
```

### Environment Variables

Add to your `.env` file:

```env
HRM_USER_MODEL=App\Models\User
HRM_ATTENDANCE_ENABLED=true
HRM_PAYROLL_ENABLED=true
HRM_LEAVE_ENABLED=true
HRM_EMPLOYEE_ID_PREFIX=EMP
HRM_EMPLOYEE_ID_PADDING=5
```

## Usage

### Creating an Employee

```php
use AeroModules\Hrm\Models\Employee;
use AeroModules\Hrm\Models\Department;
use AeroModules\Hrm\Models\Designation;

$employee = Employee::create([
    'employee_id' => 'EMP00001',
    'user_id' => auth()->id(),
    'department_id' => $department->id,
    'designation_id' => $designation->id,
    'first_name' => 'John',
    'last_name' => 'Doe',
    'email' => 'john.doe@company.com',
    'phone' => '+1234567890',
    'date_of_birth' => '1990-01-01',
    'date_of_joining' => now(),
    'employment_type' => 'full_time',
    'status' => 'active',
]);
```

### Managing Departments

```php
use AeroModules\Hrm\Models\Department;

$department = Department::create([
    'name' => 'Engineering',
    'code' => 'ENG',
    'description' => 'Software Engineering Department',
    'manager_id' => $managerId,
]);

// Get all employees in department
$employees = $department->employees;
```

### Managing Designations

```php
use AeroModules\Hrm\Models\Designation;

$designation = Designation::create([
    'name' => 'Senior Software Engineer',
    'code' => 'SSE',
    'department_id' => $department->id,
    'level' => 3,
]);
```

### Relationships

```php
// Employee relationships
$employee->department;  // belongsTo Department
$employee->designation; // belongsTo Designation
$employee->user;        // belongsTo User
$employee->attendances; // hasMany Attendance
$employee->leaves;      // hasMany Leave
$employee->salaries;    // hasMany Salary

// Department relationships
$department->employees;     // hasMany Employee
$department->designations;  // hasMany Designation
$department->manager;       // belongsTo Employee

// Designation relationships
$designation->department;  // belongsTo Department
$designation->employees;   // hasMany Employee
```

## Frontend Integration

### Inertia.js Pages

The package includes Inertia.js pages for React:

```javascript
// Import HRM pages
import EmployeeList from '@/vendor/aero-hrm/Pages/EmployeeList';
import EmployeeCreate from '@/vendor/aero-hrm/Pages/EmployeeCreate';
import EmployeeEdit from '@/vendor/aero-hrm/Pages/EmployeeEdit';
```

### React Components

```javascript
// Import HRM components
import EmployeeCard from '@/vendor/aero-hrm/Components/EmployeeCard';
import DepartmentSelector from '@/vendor/aero-hrm/Components/DepartmentSelector';
```

## API Endpoints

### Employees

```
GET    /hrm/employees              # List all employees
POST   /hrm/employees              # Create employee
GET    /hrm/employees/{id}         # Show employee
PUT    /hrm/employees/{id}         # Update employee
DELETE /hrm/employees/{id}         # Delete employee
```

### Departments

```
GET    /hrm/departments            # List all departments
POST   /hrm/departments            # Create department
GET    /hrm/departments/{id}       # Show department
PUT    /hrm/departments/{id}       # Update department
DELETE /hrm/departments/{id}       # Delete department
```

### Designations

```
GET    /hrm/designations           # List all designations
POST   /hrm/designations           # Create designation
GET    /hrm/designations/{id}      # Show designation
PUT    /hrm/designations/{id}      # Update designation
DELETE /hrm/designations/{id}      # Delete designation
```

## Testing

Run the test suite:

```bash
./vendor/bin/phpunit
```

With coverage:

```bash
./vendor/bin/phpunit --coverage-html coverage
```

## Multi-Tenant Support

This package automatically detects if it's running in a multi-tenant environment and configures itself accordingly.

### Tenant Context

When running within a tenant context:
- All queries are automatically scoped to the current tenant
- Migrations run in tenant databases
- Routes include tenant middleware

### Standalone Context

When running as standalone:
- Works like a regular Laravel package
- No tenant scoping applied
- Standard middleware stack

## Security

### Access Control

The package integrates with Laravel's authorization system:

```php
// Check permissions
Gate::allows('view-employees');
Gate::allows('create-employee');
Gate::allows('update-employee');
Gate::allows('delete-employee');
```

### Policy Registration

Policies are automatically registered:

```php
// EmployeePolicy
$this->authorize('view', $employee);
$this->authorize('update', $employee);
$this->authorize('delete', $employee);
```

## Troubleshooting

### Issue: Migrations not running

**Solution:** Ensure you've published the migrations:
```bash
php artisan vendor:publish --tag=aero-hrm-migrations
php artisan migrate
```

### Issue: Routes not found

**Solution:** Clear route cache:
```bash
php artisan route:clear
php artisan optimize:clear
```

### Issue: Frontend assets not loading

**Solution:** Publish and rebuild assets:
```bash
php artisan vendor:publish --tag=aero-hrm-assets
npm run build
```

### Issue: Tenant database not connecting

**Solution:** Verify tenant middleware is registered:
```php
// In route definition
Route::middleware(['web', 'auth', InitializeTenancyByDomain::class])
    ->group(function () {
        // HRM routes
    });
```

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for version history.

## License

Proprietary. © Aero Enterprise Suite

## Support

- Documentation: https://docs.aero-enterprise.com/modules/hrm
- Issues: https://github.com/aero-enterprise/hrm/issues
- Email: support@aero-enterprise.com

## Credits

Developed by the Aero Development Team.
