# Quick Start Guide - Aero HRM Module

This guide will help you get the HRM module running in under 10 minutes.

---

## 🚀 Quick Start: As Package in Main Platform

**Time Required:** ~5 minutes

### Step 1: Install Package (Already Done)

The package is already installed in your main platform via:
```json
// composer.json
"repositories": [
    {
        "type": "path",
        "url": "./aero-hrm"
    }
],
"require": {
    "aero/hrm": "^1.0"
}
```

### Step 2: Verify Installation

```bash
cd d:\laragon\www\Aero-Enterprise-Suite-Saas
composer dump-autoload
php artisan vendor:publish --tag=hrm-assets --force
```

### Step 3: Check Routes

```bash
php artisan route:list --path=hr
```

You should see routes like:
```
GET|HEAD  hr/dashboard ............ hr.dashboard
GET|HEAD  hr/employees ............ hr.employees.index
GET|HEAD  hr/attendance ........... hr.attendance.index
GET|HEAD  hr/leaves ............... hr.leaves.index
```

### Step 4: Build Assets

```bash
npm run build
# or for development
npm run dev
```

### Step 5: Access Module

Navigate to: `http://your-domain.test/hr/dashboard`

✅ **Done!** The module is now integrated.

---

## 🖥️ Quick Start: As Standalone Application

**Time Required:** ~10 minutes

### Step 1: Setup Environment

```bash
cd d:\laragon\www\Aero-Enterprise-Suite-Saas\aero-hrm

# Copy environment file
copy .env.example .env

# Generate application key
php artisan key:generate
```

### Step 2: Configure Database

Edit `.env`:
```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=aero_hrm_standalone
DB_USERNAME=root
DB_PASSWORD=
```

### Step 3: Create Database

```powershell
# Create database via MySQL
mysql -u root -e "CREATE DATABASE aero_hrm_standalone;"
```

### Step 4: Run Migrations

```bash
php artisan migrate
```

You should see:
```
2025_12_02_121546_create_hrm_core_tables .............. DONE
2025_12_02_133657_create_tax_configuration_tables ..... DONE
2025_12_02_134314_create_salary_components_table ...... DONE
...
```

### Step 5: Install Frontend Dependencies

```bash
npm install
```

### Step 6: Build Frontend

```bash
npm run build
# or for development with hot reload
npm run dev
```

### Step 7: Start Server

```bash
php artisan serve
```

### Step 8: Access Application

Open browser: `http://localhost:8000`

✅ **Done!** Standalone application is running.

---

## ⚡ Testing the Module

### Test Routes

```bash
php artisan route:list --path=hr
```

### Test Autoloading

```bash
composer dump-autoload
php artisan tinker
```

In tinker:
```php
use Aero\HRM\Models\Employee;
Employee::class; // Should output: "Aero\HRM\Models\Employee"
```

### Test Service Provider

```bash
php artisan about
```

Look for:
```
Providers ................
  ...
  Aero\HRM\Providers\HRMServiceProvider
```

---

## 🎯 Next Steps

### For Package Mode (In Main Platform):

1. **Add Module to Sidebar:**
   ```javascript
   // In main platform's navigation
   {
     name: 'HRM',
     href: route('hr.dashboard'),
     icon: UsersIcon,
   }
   ```

2. **Configure Permissions:**
   ```php
   // Create HRM permissions
   Permission::create(['name' => 'hrm.employees.view']);
   Permission::create(['name' => 'hrm.attendance.manage']);
   ```

3. **Test Features:**
   - Create employee
   - Mark attendance
   - Apply for leave
   - Generate payroll

### For Standalone Mode:

1. **Create Admin User:**
   ```bash
   php artisan tinker
   ```
   ```php
   $user = App\Models\User::create([
       'name' => 'Admin',
       'email' => 'admin@hrm.test',
       'password' => bcrypt('password'),
   ]);
   ```

2. **Seed Sample Data:**
   ```bash
   php artisan db:seed
   ```

3. **Configure Company Settings:**
   - Company name
   - Logo
   - Currency
   - Timezone

---

## 🐛 Quick Troubleshooting

### Issue: Class Not Found

```bash
composer dump-autoload
php artisan optimize:clear
```

### Issue: Routes Not Loading

```bash
php artisan route:clear
php artisan config:clear
php artisan cache:clear
```

### Issue: Frontend Not Loading

```bash
# For package mode
php artisan vendor:publish --tag=hrm-assets --force
npm run build

# For standalone mode
npm install
npm run build
```

### Issue: Database Connection Failed

Check `.env`:
```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=your_database_name
DB_USERNAME=root
DB_PASSWORD=
```

Then:
```bash
php artisan config:clear
php artisan migrate
```

---

## 📚 Resources

- **Full Documentation:** `README.md`
- **Verification Report:** `VERIFICATION_REPORT.md`
- **Module Extraction Guide:** `docs/HRM_MODULE_EXTRACTION_STEP_BY_STEP.md`

---

## ✅ Verification Checklist

After setup, verify:

- [ ] Routes are accessible: `php artisan route:list --path=hr`
- [ ] Models autoload: Check in tinker
- [ ] Frontend builds: `npm run build` succeeds
- [ ] Database migrations run: Check database tables exist
- [ ] Service provider loads: `php artisan about`
- [ ] Configuration loads: `php artisan config:show hrm`

---

**Quick Start Complete!** 🎉

You now have the HRM module running in either:
- ✅ Integrated mode (part of main SaaS platform)
- ✅ Standalone mode (independent HRM application)

**Need help?** Check the full `README.md` or `VERIFICATION_REPORT.md`
