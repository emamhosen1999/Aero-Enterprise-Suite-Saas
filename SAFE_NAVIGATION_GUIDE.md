# Safe Navigation & Routing Guide

This guide provides best practices for Inertia.js navigation in the Aero Enterprise Suite SaaS application.

## Table of Contents

1. [Frontend Navigation](#frontend-navigation)
2. [Backend Redirects](#backend-redirects)
3. [Common Patterns](#common-patterns)
4. [Migration Guide](#migration-guide)
5. [Testing](#testing)

---

## Frontend Navigation

### Using SafeLink Component

**Always prefer `SafeLink` over raw `Link` when using route names:**

```jsx
import SafeLink from '@/Components/Common/SafeLink';

// ✅ CORRECT - Safe route navigation
<SafeLink route="employees.show" params={{ employee: 123 }}>
  View Employee
</SafeLink>

// ❌ INCORRECT - Unsafe, can cause undefined errors
import { Link } from '@inertiajs/react';
<Link href={route('employees.show', { employee: 123 })}>
  View Employee
</Link>
```

**When route might not exist:**

```jsx
// Show disabled state with tooltip
<SafeLink 
  route="premium.feature"
  showTooltipOnDisabled={true}
  disabledMessage="Upgrade to access this feature"
>
  Premium Feature
</SafeLink>

// Use fallback URL
<SafeLink 
  route="employees.show" 
  params={{ employee: 123 }}
  fallback="/employees"
>
  View Employee
</SafeLink>
```

### Using Route Utilities

**Safe route navigation with router:**

```jsx
import { safeNavigate } from '@/utils/routeUtils';

// ✅ CORRECT - Validates route before navigation
const handleClick = () => {
  safeNavigate('employees.create', {}, { preserveScroll: true });
};

// ❌ INCORRECT - No validation
import { router } from '@inertiajs/react';
const handleClick = () => {
  router.visit(route('employees.create'));
};
```

**Check route existence before conditional rendering:**

```jsx
import { hasRoute, getRouteOrNull } from '@/utils/routeUtils';

// Conditional rendering
{hasRoute('employees.edit') && (
  <Button onClick={() => safeNavigate('employees.edit', { employee: id })}>
    Edit
  </Button>
)}

// Get URL or null for conditional link
const editUrl = getRouteOrNull('employees.edit', { employee: id });
{editUrl && <Link href={editUrl}>Edit</Link>}
```

**Safe POST/PUT/DELETE:**

```jsx
import { safePost, safePut, safeDelete } from '@/utils/routeUtils';

// Safe form submission
const handleSubmit = () => {
  safePost('users.store', formData, {
    onSuccess: () => showToast.success('User created'),
    onError: (errors) => showToast.error('Validation failed')
  });
};

// Safe update
const handleUpdate = () => {
  safePut('users.update', { user: userId }, formData);
};

// Safe delete
const handleDelete = () => {
  safeDelete('users.destroy', { user: userId });
};
```

**Current route checking:**

```jsx
import { isCurrentRoute } from '@/utils/routeUtils';

// Highlight active navigation item
const isActive = isCurrentRoute('employees.index');
<NavLink className={isActive ? 'active' : ''}>Employees</NavLink>
```

### Axios with Route URLs

**Always validate routes before axios calls:**

```jsx
import axios from 'axios';
import { hasRoute, safeRoute } from '@/utils/routeUtils';

// ✅ CORRECT - Validate before API call
const fetchData = async () => {
  if (!hasRoute('api.employees')) {
    console.error('API route not available');
    return;
  }
  
  const url = safeRoute('api.employees');
  const response = await axios.get(url);
};

// ❌ INCORRECT - No validation
const fetchData = async () => {
  const response = await axios.get(route('api.employees'));
};
```

---

## Backend Redirects

### Using SafeRedirect Class

**Import and use in controllers:**

```php
use Aero\Core\Support\SafeRedirect;

class EmployeeController extends Controller
{
    public function store(Request $request)
    {
        // Store employee...
        
        // ✅ CORRECT - Safe redirect with validation
        return SafeRedirect::withSuccess(
            'employees.index',
            'Employee created successfully'
        );
        
        // ❌ INCORRECT - No route validation
        return redirect()->route('employees.index')
            ->with('success', 'Employee created successfully');
    }
}
```

### Safe redirect()->intended()

```php
use Aero\Core\Support\SafeRedirect;

public function store(Request $request)
{
    // Authenticate user...
    
    // ✅ CORRECT - Validates domain and has fallback
    return SafeRedirect::intended('dashboard');
    
    // ❌ INCORRECT - No domain validation
    return redirect()->intended(route('dashboard'));
}
```

### Safe back() redirects

```php
use Aero\Core\Support\SafeRedirect;

public function update(Request $request, $id)
{
    // Update logic...
    
    // ✅ CORRECT - Safe back with fallback
    return SafeRedirect::backWithSuccess(
        'Updated successfully',
        'employees.index'
    );
    
    // ❌ INCORRECT - back() without fallback
    return redirect()->back()
        ->with('success', 'Updated successfully');
}
```

### Common Patterns

**Create/Store:**
```php
public function store(Request $request)
{
    $validated = $request->validate([...]);
    $model = Model::create($validated);
    
    return SafeRedirect::withSuccess(
        'models.show',
        'Created successfully',
        ['model' => $model->id]
    );
}
```

**Update:**
```php
public function update(Request $request, $id)
{
    $validated = $request->validate([...]);
    $model = Model::findOrFail($id);
    $model->update($validated);
    
    return SafeRedirect::backWithSuccess(
        'Updated successfully',
        'models.index'
    );
}
```

**Delete:**
```php
public function destroy($id)
{
    $model = Model::findOrFail($id);
    $model->delete();
    
    return SafeRedirect::withSuccess(
        'models.index',
        'Deleted successfully'
    );
}
```

**Error handling:**
```php
public function doSomething(Request $request)
{
    try {
        // Operation...
        return SafeRedirect::withSuccess('dashboard', 'Success!');
    } catch (\Exception $e) {
        return SafeRedirect::backWithError(
            'Operation failed: ' . $e->getMessage(),
            'dashboard'
        );
    }
}
```

---

## Common Patterns

### Navigation Menus

```jsx
import SafeLink from '@/Components/Common/SafeLink';
import { hasRoute } from '@/utils/routeUtils';

const navigationItems = [
  { label: 'Dashboard', route: 'dashboard' },
  { label: 'Employees', route: 'employees.index' },
  { label: 'Reports', route: 'reports.index' },
];

// Filter out unavailable routes
const availableItems = navigationItems.filter(item => hasRoute(item.route));

// Render menu
{availableItems.map(item => (
  <SafeLink key={item.route} route={item.route}>
    {item.label}
  </SafeLink>
))}
```

### Breadcrumbs

```jsx
import SafeLink from '@/Components/Common/SafeLink';
import { hasRoute } from '@/utils/routeUtils';

const breadcrumbs = [
  { label: 'Home', route: 'dashboard' },
  { label: 'Employees', route: 'employees.index' },
  { label: 'Details', route: null }, // Current page
];

{breadcrumbs.map((crumb, index) => (
  <React.Fragment key={index}>
    {crumb.route && hasRoute(crumb.route) ? (
      <SafeLink route={crumb.route}>{crumb.label}</SafeLink>
    ) : (
      <span>{crumb.label}</span>
    )}
    {index < breadcrumbs.length - 1 && ' / '}
  </React.Fragment>
))}
```

### Action Buttons

```jsx
import { safeDelete } from '@/utils/routeUtils';
import { showToast } from '@/utils/toastUtils';

const handleDelete = (id) => {
  if (confirm('Are you sure?')) {
    safeDelete('employees.destroy', { employee: id }, {
      onSuccess: () => {
        showToast.success('Employee deleted');
        router.reload();
      },
      onError: () => {
        showToast.error('Delete failed');
      }
    });
  }
};
```

---

## Migration Guide

### Step 1: Update Imports

```diff
- import { Link } from '@inertiajs/react';
+ import SafeLink from '@/Components/Common/SafeLink';
```

### Step 2: Replace Link Components

```diff
- <Link href={route('employees.show', { employee: id })}>
+ <SafeLink route="employees.show" params={{ employee: id }}>
    View Employee
- </Link>
+ </SafeLink>
```

### Step 3: Replace router.visit() Calls

```diff
- router.visit(route('employees.create'));
+ import { safeNavigate } from '@/utils/routeUtils';
+ safeNavigate('employees.create');
```

### Step 4: Add Route Checks

```diff
- const url = route('api.employees');
+ import { hasRoute, safeRoute } from '@/utils/routeUtils';
+ if (!hasRoute('api.employees')) {
+   console.error('Route not available');
+   return;
+ }
+ const url = safeRoute('api.employees');
```

### Step 5: Update Backend Redirects

```diff
- return redirect()->route('employees.index')
-     ->with('success', 'Created successfully');
+ use Aero\Core\Support\SafeRedirect;
+ return SafeRedirect::withSuccess(
+     'employees.index',
+     'Created successfully'
+ );
```

---

## Testing

### Frontend Tests

```javascript
import { hasRoute, safeRoute } from '@/utils/routeUtils';

describe('Route Utils', () => {
  it('checks if route exists', () => {
    expect(hasRoute('dashboard')).toBe(true);
    expect(hasRoute('nonexistent.route')).toBe(false);
  });

  it('returns fallback for missing routes', () => {
    const url = safeRoute('missing.route', {}, '/fallback');
    expect(url).toBe('/fallback');
  });
});
```

### Backend Tests

```php
use Aero\Core\Support\SafeRedirect;
use Tests\TestCase;

class SafeRedirectTest extends TestCase
{
    public function test_safe_redirect_to_existing_route()
    {
        $response = SafeRedirect::toRoute('dashboard');
        
        $this->assertTrue($response->isRedirect());
        $this->assertEquals(route('dashboard'), $response->getTargetUrl());
    }

    public function test_safe_redirect_with_nonexistent_route()
    {
        $response = SafeRedirect::toRoute('nonexistent.route', [], 'dashboard');
        
        // Should redirect to fallback
        $this->assertEquals(route('dashboard'), $response->getTargetUrl());
    }
}
```

---

## Troubleshooting

### Issue: "Route not found" error

**Solution:** Always use `hasRoute()` before accessing routes:
```jsx
if (hasRoute('routeName')) {
  // Safe to use route
}
```

### Issue: Undefined href in Link component

**Solution:** Use `SafeLink` or `safeRoute()` with fallback:
```jsx
<SafeLink route="routeName" fallback="/dashboard">
  Link Text
</SafeLink>
```

### Issue: Cross-domain redirect error

**Solution:** Use `SafeRedirect::intended()` which validates domains:
```php
return SafeRedirect::intended('dashboard');
```

### Issue: JSON response on Inertia request

**Solution:** Return redirect instead of JSON for POST/PUT/PATCH/DELETE:
```php
// Instead of:
return response()->json(['success' => true]);

// Use:
return SafeRedirect::withSuccess('index.route', 'Success message');
```

---

## Best Practices Summary

✅ **DO:**
- Use `SafeLink` for all route-based links
- Use `safeNavigate()`, `safePost()`, etc. for programmatic navigation
- Validate routes with `hasRoute()` before conditional logic
- Use `SafeRedirect` class for all backend redirects
- Always provide fallback routes
- Log route validation failures for debugging

❌ **DON'T:**
- Use `route()` directly in Link href without validation
- Use `redirect()->intended()` without domain validation
- Return JSON for Inertia mutation requests
- Use `redirect()->back()` without fallback
- Cross domain boundaries with Inertia navigation
- Assume routes exist without checking

---

## Additional Resources

- [Inertia.js Documentation](https://inertiajs.com/)
- [Ziggy Documentation](https://github.com/tighten/ziggy)
- [Project Compliance Audit](/INERTIA_COMPLIANCE_AUDIT.md)
