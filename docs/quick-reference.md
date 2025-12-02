# Module Hierarchy Quick Reference

## 🎯 Access Control Formula
```
User Access = Plan Access (subscription) ∩ Permission Match (RBAC)
```

## 📊 Hierarchy Structure
```
Level 1: Modules      (e.g., hrm, crm, project, finance)
  └─ Level 2: Submodules    (e.g., employees, leave, attendance)
      └─ Level 3: Components    (e.g., employee-list, leave-calendar)
          └─ Level 4: Actions    (e.g., view, create, update, delete)
```

## 🔒 Route Protection

### Syntax
```php
->middleware('module:module,submodule,component,action')
```

### Examples
```php
// Module level
Route::get('/hr', [HRController::class, 'index'])
    ->middleware('module:hrm');

// Submodule level
Route::get('/hr/employees', [EmployeeController::class, 'index'])
    ->middleware('module:hrm,employees');

// Component level
Route::get('/hr/employees/list', [EmployeeController::class, 'list'])
    ->middleware('module:hrm,employees,employee-list');

// Action level (most granular)
Route::post('/hr/employees', [EmployeeController::class, 'store'])
    ->middleware('module:hrm,employees,employee-list,create');
```

## 💻 Backend Usage

### Check Access in Controllers
```php
use App\Services\Module\ModuleAccessService;

class EmployeeController extends Controller
{
    public function __construct(
        private ModuleAccessService $accessService
    ) {}

    public function destroy($id)
    {
        $result = $this->accessService->canPerformAction(
            auth()->user(),
            'hrm',
            'employees', 
            'employee-list',
            'delete'
        );
        
        if (!$result['allowed']) {
            abort(403, $result['message']);
        }
        
        // Proceed with deletion
    }
}
```

### Response Structure
```php
[
    'allowed' => bool,      // true/false
    'reason' => string,     // 'success', 'plan_restriction', 'insufficient_permissions', 'not_found'
    'message' => string     // Human-readable message
]
```

### Available Methods
```php
$accessService->canAccessModule($user, 'hrm');
$accessService->canAccessSubModule($user, 'hrm', 'employees');
$accessService->canAccessComponent($user, 'hrm', 'employees', 'employee-list');
$accessService->canPerformAction($user, 'hrm', 'employees', 'employee-list', 'view');
```

## 🎨 Frontend Usage

### Access Hierarchy Data
```jsx
import { usePage } from '@inertiajs/react';

export default function MyComponent() {
    const { moduleHierarchy } = usePage().props;
    
    // moduleHierarchy is always available (lazy-loaded)
}
```

### Display Hierarchy Tree
```jsx
import ModuleHierarchyTree from '@/Components/ModuleHierarchyTree';

<ModuleHierarchyTree
    moduleHierarchy={moduleHierarchy}
    selectable={false}
    showInactive={true}
/>
```

### With Selection
```jsx
const [selectedItems, setSelectedItems] = useState([]);

<ModuleHierarchyTree
    moduleHierarchy={moduleHierarchy}
    selectable={true}
    selectedItems={selectedItems}
    onSelectionChange={(items) => setSelectedItems(items)}
    onItemClick={(type, item) => console.log(type, item)}
/>
```

### Check Specific Permission
```jsx
// Find if user can create employees
const canCreate = moduleHierarchy
    .find(m => m.code === 'hrm')
    ?.submodules?.find(s => s.code === 'employees')
    ?.components?.find(c => c.code === 'employee-list')
    ?.actions?.some(a => a.code === 'create');

{canCreate && <Button>Create Employee</Button>}
```

## 🔧 Configuration

### Add New Module
Edit `config/modules.php`:
```php
[
    'code' => 'inventory',
    'name' => 'Inventory Management',
    'icon' => 'cube',
    'route_prefix' => 'inventory',
    'default_required_permissions' => ['inventory.access'],
    'submodules' => [
        [
            'code' => 'products',
            'name' => 'Products',
            'components' => [
                [
                    'code' => 'product-list',
                    'name' => 'Product List',
                    'route' => 'inventory.products.index',
                    'actions' => [
                        ['code' => 'view', 'name' => 'View', 'default_required_permissions' => ['inventory.products.view']],
                        ['code' => 'create', 'name' => 'Create', 'default_required_permissions' => ['inventory.products.create']],
                    ]
                ]
            ]
        ]
    ]
]
```

Then run:
```bash
php artisan db:seed --class=ModuleSeeder
```

## 📦 HTTP Status Codes

| Code | Reason | Meaning |
|------|--------|---------|
| 401 | Not authenticated | User not logged in or no tenant |
| 402 | Plan restriction | Module not in subscription plan |
| 403 | Insufficient permissions | User lacks required permission |
| 404 | Not found | Module/submodule/component/action doesn't exist |

## 🗄️ Database Queries

### Get User's Accessible Modules
```php
$accessService->getAccessibleModules($user);
```

### Check Plan Includes Module
```php
$tenant = $user->tenant;
$subscription = $tenant->currentSubscription;
$moduleCodes = $subscription->plan->modules()->pluck('code')->toArray();
```

### Clear Caches
```php
use App\Models\Module;

Module::clearCache();
$accessService->clearUserCache($user);
```

## 🎪 Demo Page

Visit: `/administration/module-hierarchy`

Shows:
- Live statistics (counts at each level)
- Complete interactive tree
- System explanation
- Usage examples

## 🐛 Troubleshooting

### Module not appearing?
1. Check if seeded: `SELECT * FROM modules WHERE code = 'hrm';`
2. Check `is_active` flag
3. Check in plan: `SELECT * FROM plan_module WHERE module_id = ?;`
4. Clear cache: `php artisan cache:clear`

### Permission denied unexpectedly?
1. Verify user has role: `$user->roles`
2. Check permission exists: `php artisan permission:show`
3. Check module_permissions link
4. Clear user cache: `$accessService->clearUserCache($user)`

### moduleHierarchy empty in frontend?
1. Check HandleInertiaRequests is sharing it
2. Verify ModuleSeeder ran successfully
3. Check browser console for errors
4. Clear Laravel cache

## 📚 Related Files

**Backend:**
- `app/Services/Module/ModuleAccessService.php`
- `app/Http/Middleware/CheckModuleAccess.php`
- `config/modules.php`
- `database/seeders/ModuleSeeder.php`

**Frontend:**
- `resources/js/Components/ModuleHierarchyTree.jsx`
- `resources/js/Tenant/Pages/Administration/ModuleHierarchyDemo.jsx`
- `resources/js/Tenant/Pages/Errors/Forbidden.jsx`

**Documentation:**
- `docs/hierarchical-module-access-control.md`
- `docs/implementation-summary.md`

---

**Quick Start:** Check out `/administration/module-hierarchy` to see the system in action! 🚀
