# Aero HRM Module

**Human Resource Management System** - A comprehensive, modular HRM solution for the Aero Enterprise Suite SaaS platform.

## 🌟 Features

### Core Modules
- **Employee Management** - Complete employee lifecycle management
- **Attendance Tracking** - Multi-method attendance (GPS, QR Code, IP, Manual, Route-based)
- **Leave Management** - Leave requests, approvals, balance tracking
- **Payroll Processing** - Automated payroll calculation with tax support
- **Performance Management** - Employee performance reviews and KPIs
- **Recruitment** - Job postings, applicant tracking, kanban board
- **Training & Development** - Training programs, materials, enrollments
- **Document Management** - Secure employee document vault
- **Onboarding** - Structured employee onboarding process
- **Analytics & Reporting** - Comprehensive HR metrics and dashboards

### Key Capabilities
✅ Multi-tenant architecture support  
✅ Role-based access control (RBAC)  
✅ Configurable workflows  
✅ REST API support  
✅ Export to Excel/PDF  
✅ Real-time notifications  
✅ Activity logging  
✅ Dark mode support  

---

## 📦 Installation

### Option 1: As a Laravel Package (Recommended for SaaS Platform)

**Step 1: Install via Composer**

```bash
composer require aero/hrm
```

**Step 2: Publish Assets and Configuration**

```bash
# Publish frontend assets to main application
php artisan vendor:publish --tag=hrm-assets

# Publish configuration (optional - for customization)
php artisan vendor:publish --tag=hrm-config

# Publish migrations (optional - if you need to customize)
php artisan vendor:publish --tag=hrm-migrations
```

**Step 3: Run Migrations**

```bash
php artisan migrate
```

**Step 4: Configure Vite (Main Platform)**

Add HRM module to your `vite.config.js`:

```javascript
export default defineConfig({
    plugins: [
        laravel({
            input: [
                'resources/js/app.jsx',
                'resources/js/Modules/HRM/index.jsx', // Add this
            ],
            refresh: true,
        }),
    ],
    resolve: {
        alias: {
            '@': '/resources/js',
            '@hrm': '/resources/js/Modules/HRM', // Add this
        },
    },
});
```

**Step 5: Update Inertia Resolver (Main Platform)**

Edit `resources/js/app.jsx` to support module namespacing:

```javascript
const pages = import.meta.glob([
    './Tenant/Pages/**/*.jsx',
    './Modules/*/Pages/**/*.jsx', // Support module pages
]);

createInertiaApp({
    resolve: (name) => {
        // Support "HRM::PageName" syntax
        if (name.includes('::')) {
            const [module, page] = name.split('::');
            return pages[`./Modules/${module}/Pages/${page}.jsx`]();
        }
        return pages[`./Tenant/Pages/${name}.jsx`]();
    },
    // ... rest of configuration
});
```

**Step 6: Build Assets**

```bash
npm run build
# or for development
npm run dev
```

**Step 7: Access HRM Routes**

All routes are prefixed with `/hrm`:

- Dashboard: `http://your-app.test/hrm/dashboard`
- Employees: `http://your-app.test/hrm/employees`
- Attendance: `http://your-app.test/hrm/attendance`
- Leaves: `http://your-app.test/hrm/leaves`
- Payroll: `http://your-app.test/hrm/payroll`

---

### Option 2: As a Standalone Application

**Step 1: Clone Repository**

```bash
git clone https://github.com/aero/hrm.git aero-hrm
cd aero-hrm
```

**Step 2: Install Dependencies**

```bash
# Install PHP dependencies
composer install

# Install Node.js dependencies
npm install
```

**Step 3: Environment Setup**

```bash
# Copy environment file
cp .env.example .env

# Generate application key
php artisan key:generate

# Configure database in .env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=aero_hrm
DB_USERNAME=root
DB_PASSWORD=
```

**Step 4: Database Setup**

```bash
# Create database
mysql -u root -p -e "CREATE DATABASE aero_hrm;"

# Run migrations
php artisan migrate

# (Optional) Seed sample data
php artisan db:seed
```

**Step 5: Build Frontend Assets**

```bash
npm run build
# or for development
npm run dev
```

**Step 6: Start Development Server**

```bash
php artisan serve
```

Access the application at: `http://localhost:8000`

---

## ⚙️ Configuration

### Core Configuration (`config/hrm.php`)

```php
return [
    'enabled' => env('HRM_MODULE_ENABLED', true),
    
    'employee' => [
        'code_prefix' => env('HRM_EMPLOYEE_CODE_PREFIX', 'EMP'),
        'code_length' => env('HRM_EMPLOYEE_CODE_LENGTH', 6),
        'probation_period' => env('HRM_PROBATION_PERIOD', 90),
    ],
    
    'attendance' => [
        'methods' => [
            'manual' => true,
            'qr_code' => true,
            'gps' => true,
            'ip' => true,
            'route' => true,
        ],
        'grace_period' => 15, // minutes
        'full_day_hours' => 8,
    ],
    
    'leave' => [
        'require_approval' => true,
        'default_allocations' => [
            'annual' => 15,
            'sick' => 10,
            'casual' => 7,
        ],
    ],
    
    'payroll' => [
        'currency' => 'USD',
        'pay_frequency' => 'monthly',
        'enable_tax' => true,
    ],
];
```

### Environment Variables

```env
# HRM Module
HRM_MODULE_ENABLED=true
HRM_EMPLOYEE_CODE_PREFIX=EMP
HRM_EMPLOYEE_CODE_LENGTH=6
HRM_PROBATION_PERIOD=90

# Attendance
HRM_ATTENDANCE_GRACE_PERIOD=15
HRM_ATTENDANCE_FULL_DAY_HOURS=8
HRM_ATTENDANCE_OVERTIME_THRESHOLD=8

# Leave
HRM_LEAVE_REQUIRE_APPROVAL=true
HRM_LEAVE_ANNUAL=15
HRM_LEAVE_SICK=10
HRM_LEAVE_CASUAL=7

# Payroll
HRM_PAYROLL_CURRENCY=USD
HRM_PAYROLL_FREQUENCY=monthly
HRM_PAYROLL_ENABLE_TAX=true
```

---

## 🗂️ Project Structure

```
aero-hrm/
├── src/
│   ├── Http/
│   │   └── Controllers/        # All controllers
│   │       ├── Employee/       # Employee management
│   │       ├── Attendance/     # Attendance tracking
│   │       ├── Leave/          # Leave management
│   │       ├── Performance/    # Performance reviews
│   │       └── Recruitment/    # Recruitment module
│   ├── Models/                 # Eloquent models
│   ├── Services/               # Business logic services
│   ├── Policies/               # Authorization policies
│   ├── Providers/              # Service providers
│   └── routes/                 # Route definitions
├── resources/
│   └── js/
│       ├── Pages/              # Inertia.js pages
│       ├── Components/         # Reusable React components
│       ├── Tables/             # Data table components
│       ├── Forms/              # Form components
│       └── Hooks/              # Custom React hooks
├── database/
│   ├── migrations/             # Database migrations
│   ├── seeders/                # Database seeders
│   └── factories/              # Model factories
├── config/                     # Configuration files
├── tests/                      # PHPUnit tests
├── bootstrap/                  # Application bootstrap
├── public/                     # Public assets
└── composer.json               # PHP dependencies
```

---

## 🚀 Usage

### Creating Employees

```php
use Aero\HRM\Models\Employee;

$employee = Employee::create([
    'user_id' => $user->id,
    'employee_code' => 'EMP000123',
    'department_id' => 1,
    'designation_id' => 2,
    'date_of_joining' => now(),
    'employment_type' => 'full_time',
    'status' => 'active',
    'basic_salary' => 50000,
]);
```

### Attendance Tracking

```php
use Aero\HRM\Services\AttendancePunchService;

$service = app(AttendancePunchService::class);

// Punch in
$attendance = $service->punchIn($employee, [
    'type' => 'gps',
    'latitude' => 40.7128,
    'longitude' => -74.0060,
]);

// Punch out
$service->punchOut($attendance);
```

### Leave Management

```php
use Aero\HRM\Services\LeaveBalanceService;

$service = app(LeaveBalanceService::class);

// Check leave balance
$balance = $service->getBalance($employee, 'annual');

// Apply for leave
$leave = $service->apply($employee, [
    'leave_type' => 'annual',
    'from_date' => '2025-01-10',
    'to_date' => '2025-01-12',
    'reason' => 'Family vacation',
]);
```

### Payroll Processing

```php
use Aero\HRM\Services\PayrollCalculationService;

$service = app(PayrollCalculationService::class);

// Generate payroll
$payroll = $service->calculate($employee, '2025-01');

// Get payslip
$payslip = $service->generatePayslip($payroll);
```

---

## 🔌 API Endpoints

All API endpoints are prefixed with `/api/hrm`:

### Employees

```
GET    /api/hrm/employees          # List all employees
POST   /api/hrm/employees          # Create new employee
GET    /api/hrm/employees/{id}     # Get employee details
PUT    /api/hrm/employees/{id}     # Update employee
DELETE /api/hrm/employees/{id}     # Delete employee
```

### Attendance

```
GET    /api/hrm/attendance          # List attendance records
POST   /api/hrm/attendance/punch-in # Punch in
POST   /api/hrm/attendance/punch-out # Punch out
GET    /api/hrm/attendance/summary  # Attendance summary
```

### Leaves

```
GET    /api/hrm/leaves             # List leave requests
POST   /api/hrm/leaves             # Create leave request
GET    /api/hrm/leaves/{id}        # Get leave details
POST   /api/hrm/leaves/{id}/approve # Approve leave
POST   /api/hrm/leaves/{id}/reject  # Reject leave
```

---

## 🧪 Testing

```bash
# Run all tests
php artisan test

# Run specific test file
php artisan test tests/Feature/EmployeeTest.php

# Run with coverage
php artisan test --coverage
```

---

## 🔐 Security

- All routes protected by authentication middleware
- Role-based access control (RBAC) via Spatie Permission
- CSRF protection enabled
- SQL injection prevention via Eloquent ORM
- XSS protection via React escaping
- Activity logging for audit trails

---

## 🤝 Integration with Main Platform

The HRM module is designed to work seamlessly with the Aero Enterprise Suite platform:

### Multi-Tenancy Support

```php
// Automatic tenant context isolation
Route::middleware(['tenant.setup'])->group(function () {
    // All routes automatically scoped to current tenant
});
```

### Module Access Control

```php
// Routes protected by module permissions
Route::middleware(['module:hrm,employees'])->group(function () {
    // Only accessible if user has HRM employee module access
});
```

### Shared Components

- Uses `App\Models\Shared\User` from main platform
- Integrates with platform's permission system
- Shares authentication guards and middleware

---

## 📝 Development

### Code Style

```bash
# Format code using Laravel Pint
vendor/bin/pint --dirty
```

### Running in Development Mode

```bash
# Watch for frontend changes
npm run dev

# Start Laravel server
php artisan serve

# Watch tests
php artisan test --watch
```

---

## 🐛 Troubleshooting

### Issue: Class Not Found

```bash
composer dump-autoload
php artisan optimize:clear
```

### Issue: Routes Not Loading

```bash
php artisan route:clear
php artisan route:cache
```

### Issue: Frontend Assets Not Found

```bash
php artisan vendor:publish --tag=hrm-assets --force
npm run build
```

### Issue: Migrations Already Exist

If migrations already exist in your main platform (for existing tenants), skip publishing migrations:

```bash
# Don't run this if migrations already in main platform
# php artisan vendor:publish --tag=hrm-migrations
```

---

## 📚 Documentation

- [Module Extraction Guide](docs/HRM_MODULE_EXTRACTION_STEP_BY_STEP.md)
- [API Documentation](docs/API.md)
- [Configuration Reference](docs/CONFIGURATION.md)
- [Development Guide](docs/DEVELOPMENT.md)

---

## 🔄 Version History

### v1.0.0 (2025-12-08)
- Initial release
- Complete HRM functionality extracted from monolith
- Support for both standalone and package modes
- Multi-tenant support
- 36 controllers, 20+ models, 22 services

---

## 📄 License

Proprietary - Aero Enterprise Suite

---

## 🙋‍♂️ Support

For issues, questions, or contributions:

- **Email:** support@aeos365.com
- **Documentation:** https://docs.aeos365.com/hrm
- **Issues:** https://github.com/aero/hrm/issues

---

## ✨ Credits

Developed by the Aero Development Team

---

## 🚀 Roadmap

- [ ] Integration with biometric devices
- [ ] Mobile app (React Native)
- [ ] Advanced analytics dashboard
- [ ] AI-powered leave predictions
- [ ] Integration with Google Calendar
- [ ] Slack notifications
- [ ] Multi-language support
- [ ] Custom workflow builder

---

**Made with ❤️ for the Aero Enterprise Suite Platform**
