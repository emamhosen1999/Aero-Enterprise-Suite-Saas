# HRM Module Integration Guide - Developer Quick Start

## Table of Contents
1. [How to Add a New Feature to HRM](#how-to-add-a-new-feature-to-hrm)
2. [How to Modify Existing Features](#how-to-modify-existing-features)
3. [How to Test in Both Modes](#how-to-test-in-both-modes)
4. [How to Handle Permissions](#how-to-handle-permissions)
5. [Common Troubleshooting](#common-troubleshooting)

---

## How to Add a New Feature to HRM

### Example: Adding "Employee Skills" Feature

#### Step 1: Create Migration (in aero-hrm package)

```bash
cd aero-hrm
php artisan make:migration create_employee_skills_table --path=database/migrations
```

```php
// database/migrations/xxxx_create_employee_skills_table.php
public function up()
{
    Schema::create('employee_skills', function (Blueprint $table) {
        $table->id();
        $table->foreignId('employee_id')->constrained()->onDelete('cascade');
        $table->string('skill_name');
        $table->enum('proficiency', ['beginner', 'intermediate', 'advanced', 'expert']);
        $table->integer('years_experience')->nullable();
        $table->timestamps();
    });
}
```

#### Step 2: Create Model (in aero-hrm package)

```bash
php artisan make:model Models/EmployeeSkill --no-migration
```

```php
// src/Models/EmployeeSkill.php
namespace Aero\HRM\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EmployeeSkill extends Model
{
    use TenantScoped;

    protected $fillable = [
        'employee_id',
        'skill_name',
        'proficiency',
        'years_experience',
    ];

    protected function casts(): array
    {
        return [
            'proficiency' => 'string',
            'years_experience' => 'integer',
        ];
    }

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }
}
```

#### Step 3: Create Controller (in aero-hrm package)

```bash
php artisan make:controller Http/Controllers/EmployeeSkillController --resource --no-test
```

```php
// src/Http/Controllers/EmployeeSkillController.php
namespace Aero\HRM\Http\Controllers;

use App\Http\Controllers\Controller;
use Aero\HRM\Models\EmployeeSkill;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class EmployeeSkillController extends Controller
{
    public function index(): Response
    {
        $skills = EmployeeSkill::with('employee')
            ->orderBy('created_at', 'desc')
            ->paginate(20);

        return Inertia::render('HRM/Skills/SkillsList', [
            'skills' => $skills,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'employee_id' => 'required|exists:employees,id',
            'skill_name' => 'required|string|max:255',
            'proficiency' => 'required|in:beginner,intermediate,advanced,expert',
            'years_experience' => 'nullable|integer|min:0',
        ]);

        EmployeeSkill::create($validated);

        return back()->with('success', 'Skill added successfully');
    }

    public function update(Request $request, EmployeeSkill $skill)
    {
        $validated = $request->validate([
            'skill_name' => 'required|string|max:255',
            'proficiency' => 'required|in:beginner,intermediate,advanced,expert',
            'years_experience' => 'nullable|integer|min:0',
        ]);

        $skill->update($validated);

        return back()->with('success', 'Skill updated successfully');
    }

    public function destroy(EmployeeSkill $skill)
    {
        $skill->delete();

        return back()->with('success', 'Skill deleted successfully');
    }
}
```

#### Step 4: Add Routes (in aero-hrm package)

```php
// src/routes/web.php

use Aero\HRM\Http\Controllers\EmployeeSkillController;

Route::middleware(['web', 'auth', 'tenant.setup'])
    ->prefix('hrm')
    ->name('hrm.')
    ->group(function () {
        // ... existing routes ...

        // Employee Skills
        Route::prefix('skills')->name('skills.')->group(function () {
            Route::get('/', [EmployeeSkillController::class, 'index'])->name('index');
            Route::post('/', [EmployeeSkillController::class, 'store'])->name('store');
            Route::put('/{skill}', [EmployeeSkillController::class, 'update'])->name('update');
            Route::delete('/{skill}', [EmployeeSkillController::class, 'destroy'])->name('destroy');
        });
    });
```

#### Step 5: Create Frontend Component (in aero-hrm package)

```jsx
// resources/js/Pages/HRM/Skills/SkillsList.jsx
import { useState } from 'react';
import { router } from '@inertiajs/react';
import { Card, CardBody, CardHeader, Table, TableHeader, TableColumn, 
         TableBody, TableRow, TableCell, Button, Chip } from '@heroui/react';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import PageHeader from '@/Components/PageHeader';
import { showToast } from '@/utils/toastUtils';

export default function SkillsList({ skills, auth }) {
  const canCreate = auth.permissions?.includes('hrm.skills.skill-management.create');
  const canEdit = auth.permissions?.includes('hrm.skills.skill-management.update');
  const canDelete = auth.permissions?.includes('hrm.skills.skill-management.delete');

  const proficiencyColor = {
    beginner: 'default',
    intermediate: 'primary',
    advanced: 'success',
    expert: 'warning'
  };

  const handleDelete = (skillId) => {
    if (!confirm('Are you sure you want to delete this skill?')) return;

    const promise = new Promise((resolve, reject) => {
      router.delete(route('hrm.skills.destroy', skillId), {
        onSuccess: () => resolve(['Skill deleted successfully']),
        onError: (errors) => reject(errors),
      });
    });

    showToast.promise(promise, {
      loading: 'Deleting skill...',
      success: (data) => data[0],
      error: 'Failed to delete skill',
    });
  };

  return (
    <Card 
      className="transition-all duration-200"
      style={{
        border: `var(--borderWidth, 2px) solid transparent`,
        borderRadius: `var(--borderRadius, 12px)`,
        background: `linear-gradient(135deg, 
          var(--theme-content1, #FAFAFA) 20%, 
          var(--theme-content2, #F4F4F5) 10%, 
          var(--theme-content3, #F1F3F4) 20%)`,
      }}
    >
      <CardHeader style={{ borderBottom: `1px solid var(--theme-divider, #E4E4E7)` }}>
        <PageHeader title="Employee Skills" />
        {canCreate && (
          <Button 
            color="primary" 
            startContent={<PlusIcon className="w-5 h-5" />}
            onPress={() => router.visit(route('hrm.skills.create'))}
          >
            Add Skill
          </Button>
        )}
      </CardHeader>

      <CardBody>
        <Table
          aria-label="Employee skills table"
          classNames={{
            wrapper: "shadow-none border border-divider rounded-lg",
            th: "bg-default-100 text-default-600 font-semibold",
          }}
        >
          <TableHeader>
            <TableColumn>EMPLOYEE</TableColumn>
            <TableColumn>SKILL</TableColumn>
            <TableColumn>PROFICIENCY</TableColumn>
            <TableColumn>EXPERIENCE</TableColumn>
            {(canEdit || canDelete) && <TableColumn>ACTIONS</TableColumn>}
          </TableHeader>
          
          <TableBody emptyContent="No skills found">
            {skills.data.map((skill) => (
              <TableRow key={skill.id}>
                <TableCell>{skill.employee.full_name}</TableCell>
                <TableCell>{skill.skill_name}</TableCell>
                <TableCell>
                  <Chip color={proficiencyColor[skill.proficiency]} variant="flat">
                    {skill.proficiency}
                  </Chip>
                </TableCell>
                <TableCell>{skill.years_experience || 0} years</TableCell>
                {(canEdit || canDelete) && (
                  <TableCell>
                    <div className="flex gap-2">
                      {canEdit && (
                        <Button 
                          size="sm" 
                          isIconOnly 
                          variant="light"
                          onPress={() => router.visit(route('hrm.skills.edit', skill.id))}
                        >
                          <PencilIcon className="w-4 h-4" />
                        </Button>
                      )}
                      {canDelete && (
                        <Button 
                          size="sm" 
                          isIconOnly 
                          variant="light"
                          color="danger"
                          onPress={() => handleDelete(skill.id)}
                        >
                          <TrashIcon className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardBody>
    </Card>
  );
}
```

#### Step 6: Register Component in Module Hierarchy (Main Platform)

**Edit `config/modules.php` in main platform:**

```php
// Find the 'hrm' module in 'hierarchy' array
'submodules' => [
    // ... existing submodules (employees, attendance, etc.) ...
    
    // Add new submodule
    [
        'code' => 'skills',
        'name' => 'Skills Management',
        'description' => 'Track and manage employee skills and proficiency levels',
        'icon' => 'StarIcon',
        'route' => '/tenant/hr/skills',
        'priority' => 9,

        'components' => [
            [
                'code' => 'skill-management',
                'name' => 'Skill Management',
                'type' => 'page',
                'route' => '/tenant/hr/skills',
                'actions' => [
                    ['code' => 'view', 'name' => 'View Skills'],
                    ['code' => 'create', 'name' => 'Create Skill'],
                    ['code' => 'update', 'name' => 'Update Skill'],
                    ['code' => 'delete', 'name' => 'Delete Skill'],
                ],
            ],
        ],
    ],
],
```

#### Step 7: Run Migrations & Reseed

```bash
# From main platform root
php artisan migrate
php artisan db:seed --class=ModuleSeeder
```

#### Step 8: Verify Integration

**Check routes:**
```bash
php artisan route:list --name=hrm.skills
```

**Expected output:**
```
GET|HEAD   tenant/hr/skills .............. hrm.skills.index
POST       tenant/hr/skills .............. hrm.skills.store
PUT|PATCH  tenant/hr/skills/{skill} ..... hrm.skills.update
DELETE     tenant/hr/skills/{skill} ..... hrm.skills.destroy
```

**Check module hierarchy:**
```bash
php artisan tinker
>>> \App\Models\Module::where('code', 'hrm')->first()->submodules()->pluck('code');
```

**Expected output:**
```php
[
  "employees",
  "attendance",
  "leaves",
  // ...
  "skills"  // ← New submodule appears!
]
```

**Check navigation automatically includes it:**
- Login as tenant user with HRM access
- Navigate to `/tenant/hr`
- ✅ "Skills Management" appears in sidebar under Human Resources

---

## How to Modify Existing Features

### Example: Adding "Department Filter" to Employee List

#### Step 1: Update Controller (aero-hrm package)

```php
// src/Http/Controllers/EmployeeController.php

public function index(Request $request)
{
    $query = Employee::with(['department', 'designation']);

    // Add department filter
    if ($request->filled('department')) {
        $query->where('department_id', $request->department);
    }

    $employees = $query->paginate(20);

    return Inertia::render('HRM/Employees/EmployeeList', [
        'employees' => $employees,
        'departments' => Department::all(),  // ← Pass departments
        'filters' => $request->only(['department']),  // ← Pass current filters
    ]);
}
```

#### Step 2: Update Frontend Component (aero-hrm package)

```jsx
// resources/js/Pages/HRM/Employees/EmployeeList.jsx

import { Select, SelectItem } from '@heroui/react';

export default function EmployeeList({ employees, departments, filters }) {
  const [selectedDepartment, setSelectedDepartment] = useState(filters.department || 'all');

  const handleDepartmentChange = (dept) => {
    setSelectedDepartment(dept);
    router.get(route('hrm.employees.index'), { department: dept }, { preserveState: true });
  };

  return (
    <Card>
      <CardBody>
        {/* Filter section */}
        <div className="flex gap-3 mb-4">
          <Select
            label="Department"
            placeholder="All Departments"
            selectedKeys={selectedDepartment !== 'all' ? [selectedDepartment] : []}
            onSelectionChange={(keys) => handleDepartmentChange(Array.from(keys)[0] || 'all')}
            classNames={{ trigger: "bg-default-100" }}
          >
            <SelectItem key="all">All Departments</SelectItem>
            {departments.map(dept => (
              <SelectItem key={dept.id}>{dept.name}</SelectItem>
            ))}
          </Select>
        </div>

        {/* Table */}
        <EmployeeTable employees={employees} />
      </CardBody>
    </Card>
  );
}
```

#### Step 3: Test Changes

**Standalone mode:**
```bash
cd aero-hrm
php artisan serve
# Visit http://localhost:8000/hrm/employees
```

**Platform integration mode:**
```bash
cd ..
php artisan serve
# Visit http://localhost:8000/tenant/hr/employees
```

✅ Filter works in both modes without additional configuration!

---

## How to Test in Both Modes

### Standalone Mode Testing

```bash
cd aero-hrm

# Setup test database
php artisan migrate --database=testing

# Run unit tests
php artisan test --filter=EmployeeTest

# Run feature tests
php artisan test --filter=EmployeeControllerTest
```

**Example Test:**
```php
// tests/Feature/EmployeeControllerTest.php
namespace Tests\Feature;

use Tests\TestCase;
use Aero\HRM\Models\Employee;
use Illuminate\Foundation\Testing\RefreshDatabase;

class EmployeeControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_view_employee_list()
    {
        $this->actingAs($this->createUser());
        
        Employee::factory()->count(5)->create();

        $response = $this->get(route('hrm.employees.index'));

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => 
            $page->component('HRM/Employees/EmployeeList')
                ->has('employees.data', 5)
        );
    }

    public function test_can_create_employee()
    {
        $this->actingAs($this->createUser());
        
        $data = [
            'first_name' => 'John',
            'last_name' => 'Doe',
            'email' => 'john@example.com',
            'phone' => '1234567890',
        ];

        $response = $this->post(route('hrm.employees.store'), $data);

        $response->assertRedirect();
        $this->assertDatabaseHas('employees', ['email' => 'john@example.com']);
    }
}
```

### Platform Integration Testing

```bash
# From main platform root
php artisan test --filter=HRMIntegrationTest
```

**Example Integration Test:**
```php
// tests/Feature/Modules/HRMIntegrationTest.php
namespace Tests\Feature\Modules;

use Tests\TestCase;
use App\Models\Tenant;
use App\Models\Shared\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

class HRMIntegrationTest extends TestCase
{
    use RefreshDatabase;

    public function test_hrm_module_is_auto_discovered()
    {
        $providers = app()->getProviders('Aero\\HRM\\Providers\\HRMServiceProvider');
        
        $this->assertNotEmpty($providers, 'HRM service provider not auto-discovered');
    }

    public function test_hrm_routes_are_registered()
    {
        $this->assertTrue(
            \Route::has('hrm.employees.index'),
            'HRM routes not registered'
        );
    }

    public function test_tenant_with_hrm_access_can_view_employees()
    {
        $tenant = Tenant::factory()->create();
        $user = User::factory()->create([
            'tenant_id' => $tenant->id,
        ]);
        $user->givePermissionTo('hrm.employees.employee-directory.view');

        $this->actingAs($user);
        $response = $this->get('/tenant/hr/employees');

        $response->assertStatus(200);
    }

    public function test_tenant_without_hrm_access_cannot_view_employees()
    {
        $tenant = Tenant::factory()->create();
        $user = User::factory()->create([
            'tenant_id' => $tenant->id,
        ]);
        // User has no HRM permissions

        $this->actingAs($user);
        $response = $this->get('/tenant/hr/employees');

        $response->assertStatus(403);
    }
}
```

---

## How to Handle Permissions

### Permission Naming Convention

```
{module}.{submodule}.{component}.{action}
```

**Examples:**
```
hrm.employees.employee-directory.view
hrm.employees.employee-directory.create
hrm.employees.employee-directory.update
hrm.employees.employee-directory.delete
hrm.attendance.daily-attendance.mark
hrm.leaves.leave-requests.approve
```

### Checking Permissions in Controllers

```php
// src/Http/Controllers/EmployeeController.php

use Illuminate\Support\Facades\Gate;

public function store(Request $request)
{
    // Automatic check via middleware (recommended)
    // Platform's ModuleAccessMiddleware handles this
    
    // Manual check (if needed)
    if (!Gate::allows('hrm.employees.employee-directory.create')) {
        abort(403, 'You do not have permission to create employees');
    }

    $validated = $request->validate([/* ... */]);
    Employee::create($validated);

    return redirect()->route('hrm.employees.index');
}
```

### Checking Permissions in Frontend

```jsx
// resources/js/Pages/HRM/Employees/EmployeeList.jsx

import { usePage } from '@inertiajs/react';

export default function EmployeeList({ employees }) {
  const { auth } = usePage().props;
  
  // Check single permission
  const canCreate = auth.permissions?.includes('hrm.employees.employee-directory.create');
  const canEdit = auth.permissions?.includes('hrm.employees.employee-directory.update');
  const canDelete = auth.permissions?.includes('hrm.employees.employee-directory.delete');

  // Check multiple permissions (any)
  const canManage = auth.permissions?.some(p => 
    ['hrm.employees.employee-directory.update', 
     'hrm.employees.employee-directory.delete'].includes(p)
  );

  return (
    <div>
      {canCreate && (
        <Button onPress={() => router.visit(route('hrm.employees.create'))}>
          Add Employee
        </Button>
      )}

      <Table>
        {employees.map(employee => (
          <TableRow key={employee.id}>
            <TableCell>{employee.name}</TableCell>
            {canManage && (
              <TableCell>
                {canEdit && <EditButton />}
                {canDelete && <DeleteButton />}
              </TableCell>
            )}
          </TableRow>
        ))}
      </Table>
    </div>
  );
}
```

### Creating Custom Policies (Optional)

If you need more complex authorization logic:

```php
// src/Policies/EmployeePolicy.php
namespace Aero\HRM\Policies;

use App\Models\Shared\User;
use Aero\HRM\Models\Employee;

class EmployeePolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasPermissionTo('hrm.employees.employee-directory.view');
    }

    public function create(User $user): bool
    {
        return $user->hasPermissionTo('hrm.employees.employee-directory.create');
    }

    public function update(User $user, Employee $employee): bool
    {
        // Complex logic: Can edit if has permission AND is same department
        return $user->hasPermissionTo('hrm.employees.employee-directory.update')
            && $user->department_id === $employee->department_id;
    }

    public function delete(User $user, Employee $employee): bool
    {
        return $user->hasPermissionTo('hrm.employees.employee-directory.delete')
            && $employee->id !== $user->id; // Can't delete self
    }
}
```

**Register policy in HRMServiceProvider:**
```php
// src/Providers/HRMServiceProvider.php

protected $policies = [
    Employee::class => EmployeePolicy::class,
];

public function boot()
{
    $this->registerPolicies();
}
```

---

## Common Troubleshooting

### Issue 1: Routes Not Found (404)

**Problem:** Accessing `/tenant/hr/employees` returns 404

**Solutions:**

1. **Check route registration:**
   ```bash
   php artisan route:list --name=hrm
   ```
   If no routes appear → Service provider not loaded

2. **Clear route cache:**
   ```bash
   php artisan route:clear
   php artisan config:clear
   ```

3. **Verify service provider registered:**
   ```bash
   php artisan tinker
   >>> app()->getProviders('Aero\\HRM\\Providers\\HRMServiceProvider');
   ```

4. **Check composer autoload:**
   ```bash
   composer dump-autoload
   ```

### Issue 2: Permission Denied (403)

**Problem:** User gets 403 when accessing HRM module

**Solutions:**

1. **Check user has HRM permission:**
   ```bash
   php artisan tinker
   >>> $user = \App\Models\Shared\User::find(1);
   >>> $user->getAllPermissions()->pluck('name');
   ```

2. **Check subscription plan includes HRM:**
   ```bash
   php artisan tinker
   >>> $tenant = \App\Models\Tenant::find(1);
   >>> $tenant->subscription->plan->modules;
   ```

3. **Assign permission manually:**
   ```bash
   php artisan tinker
   >>> $user = \App\Models\Shared\User::find(1);
   >>> $user->givePermissionTo('hrm.employees.employee-directory.view');
   ```

4. **Reseed module permissions:**
   ```bash
   php artisan db:seed --class=ModuleSeeder
   ```

### Issue 3: Module Not Appearing in Navigation

**Problem:** HRM not showing in sidebar

**Solutions:**

1. **Check module enabled in config:**
   ```php
   // config/modules.php
   'external_packages' => [
       'hrm' => [
           'enabled' => true,  // ← Must be true
       ],
   ],
   ```

2. **Check module seeded in database:**
   ```bash
   php artisan tinker
   >>> \App\Models\Module::where('code', 'hrm')->first();
   ```

3. **Reseed modules:**
   ```bash
   php artisan db:seed --class=ModuleSeeder
   ```

4. **Clear cache:**
   ```bash
   php artisan cache:clear
   php artisan config:clear
   npm run build
   ```

### Issue 4: Tenant Context Not Working

**Problem:** Getting "No tenant selected" or tenant data not available

**Solutions:**

1. **Check tenant.setup middleware applied:**
   ```php
   // src/routes/web.php
   Route::middleware(['web', 'auth', 'tenant.setup'])  // ← Must include tenant.setup
   ```

2. **Check tenant resolution:**
   ```bash
   php artisan tinker
   >>> tenant();  // Should return current tenant
   ```

3. **Check domain configuration:**
   ```bash
   php artisan tenants:list
   ```

4. **Verify TenantScoped trait on models:**
   ```php
   // src/Models/Employee.php
   use Aero\HRM\Traits\TenantScoped;

   class Employee extends Model
   {
       use TenantScoped;  // ← Must have this trait
   }
   ```

### Issue 5: Frontend Components Not Loading

**Problem:** Inertia pages show blank or "Component not found"

**Solutions:**

1. **Check component path:**
   ```php
   // Controller
   return Inertia::render('HRM/Employees/EmployeeList', [/* ... */]);
   
   // File must exist at:
   // resources/js/Pages/HRM/Employees/EmployeeList.jsx
   ```

2. **Rebuild frontend:**
   ```bash
   npm run build
   # or
   npm run dev
   ```

3. **Check Vite config includes HRM pages:**
   ```js
   // vite.config.js
   export default defineConfig({
       plugins: [
           laravel({
               input: ['resources/js/app.jsx'],
               refresh: true,
           }),
       ],
   });
   ```

4. **Clear Vite manifest:**
   ```bash
   rm public/build/manifest.json
   npm run build
   ```

### Issue 6: Database Migrations Failing

**Problem:** Migrations throw errors about existing tables

**Solutions:**

1. **Check migration order:**
   ```bash
   php artisan migrate:status
   ```

2. **Rollback and re-run:**
   ```bash
   php artisan migrate:rollback --step=1
   php artisan migrate
   ```

3. **Fresh migration (⚠️ DELETES ALL DATA):**
   ```bash
   php artisan migrate:fresh --seed
   ```

4. **Check for duplicate migrations:**
   ```bash
   ls database/migrations/ | grep "create_employees_table"
   ```

---

## Best Practices Summary

### ✅ Do

- ✅ Use `route()` helper for all URLs
- ✅ Check permissions in both controller and frontend
- ✅ Follow HeroUI component patterns
- ✅ Use CSS custom properties for theming
- ✅ Apply `tenant.setup` middleware to all routes
- ✅ Use `TenantScoped` trait on all models
- ✅ Test in both standalone and integrated modes
- ✅ Update `config/modules.php` when adding features
- ✅ Use Laravel Form Requests for validation
- ✅ Use promise-based toasts for async operations

### ❌ Don't

- ❌ Hardcode URLs (use `route()` helper)
- ❌ Skip permission checks (security risk)
- ❌ Mix Tailwind and inline styles
- ❌ Forget to run migrations in both packages
- ❌ Remove `tenant.setup` middleware
- ❌ Query without tenant scope
- ❌ Duplicate code from platform
- ❌ Skip updating module hierarchy
- ❌ Use inline validation in controllers
- ❌ Use basic success/error messages

---

## Quick Commands Reference

```bash
# HRM Package Development
cd aero-hrm
php artisan make:migration CreateTableName
php artisan make:model Models/ModelName
php artisan make:controller Http/Controllers/ControllerName --resource
php artisan migrate
php artisan test

# Platform Integration
cd ..
composer dump-autoload
php artisan migrate
php artisan db:seed --class=ModuleSeeder
php artisan route:list --name=hrm
npm run build

# Debugging
php artisan route:clear
php artisan config:clear
php artisan cache:clear
php artisan tinker

# Testing
php artisan test --filter=HRM
php artisan test --filter=EmployeeTest
```

---

## Need Help?

1. Check `INTEGRATION_ARCHITECTURE.md` for detailed architecture explanation
2. Check `VERIFICATION_REPORT.md` for current status
3. Check `README.md` for installation instructions
4. Check platform's `config/modules.php` for existing patterns
5. Check existing HRM controllers for code examples
