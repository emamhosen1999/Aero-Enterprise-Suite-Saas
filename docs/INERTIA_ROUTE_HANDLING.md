# Inertia.js v2 Route Handling Guide

## Overview
This guide explains the proper way to use Ziggy's `route()` helper with Inertia.js v2 to prevent "Cannot read properties of undefined (reading 'toString')" errors.

## The Problem

When using Inertia.js v2's `useForm` hook, methods like `post()`, `put()`, and `delete()` expect a **valid URL string**. If `route()` returns `undefined` (because the route doesn't exist or Ziggy hasn't loaded), Inertia tries to call `.toString()` on undefined, causing a crash:

```javascript
// ❌ BAD - Can cause crash if route doesn't exist
const { post } = useForm({ ... });
post(route('users.store'));  // Error: Cannot read properties of undefined
```

## The Solution

Always validate that the route exists before using it:

```javascript
// ✅ GOOD - Safe with validation
import { hasRoute } from '@/utils/routeUtils';
import { showToast } from '@/utils/toastUtils';

const handleSubmit = (event) => {
  event.preventDefault();
  
  // Validate route exists
  if (!hasRoute('users.store')) {
    console.error('Route users.store not found');
    showToast.error('Navigation route not found. Please contact support.');
    return;
  }
  
  // Store URL in variable before passing to post
  const url = route('users.store');
  post(url);
};
```

## Best Practices

### 1. Always Import Required Utilities

```javascript
import { useForm } from '@inertiajs/react';
import { hasRoute } from '@/utils/routeUtils';
import { showToast } from '@/utils/toastUtils';
```

### 2. Validate Before Using route()

```javascript
// For static routes
if (!hasRoute('route.name')) {
  console.error('Route route.name not found');
  showToast.error('Navigation route not found. Please contact support.');
  return;
}

// For dynamic routes with parameters
if (!hasRoute('route.name')) {
  console.error(`Route route.name not found`);
  showToast.error('Navigation route not found. Please contact support.');
  return;
}
```

### 3. Store URL Before Passing to Inertia Methods

```javascript
// ✅ Correct pattern
const url = route('users.store');
post(url);

// ✅ With parameters
const url = route('users.update', { user: userId });
put(url, { data });

// ✅ Dynamic route names
const routeName = isEditing ? 'users.update' : 'users.store';
if (!hasRoute(routeName)) { /* handle error */ }
const url = route(routeName, params);
post(url);
```

### 4. Alternative: Use Safe Utilities

For even simpler usage, use the safe wrapper functions:

```javascript
import { safePost, safePut, safeDelete } from '@/utils/routeUtils';

// Automatically validates route and shows error toast
safePost('users.store', formData);
safePut('users.update', { user: userId }, formData);
safeDelete('users.destroy', { user: userId });
```

## Common Patterns

### Form Submission

```javascript
const { data, setData, post, processing, errors } = useForm({
  name: '',
  email: '',
});

const handleSubmit = (event) => {
  event.preventDefault();
  
  if (!hasRoute('users.store')) {
    console.error('Route users.store not found');
    showToast.error('Navigation route not found. Please contact support.');
    return;
  }
  
  const url = route('users.store');
  post(url);
};
```

### Update with Parameters

```javascript
const handleUpdate = (event) => {
  event.preventDefault();
  
  if (!hasRoute('users.update')) {
    console.error('Route users.update not found');
    showToast.error('Navigation route not found. Please contact support.');
    return;
  }
  
  const url = route('users.update', { user: userId });
  put(url, {
    preserveScroll: true,
    onSuccess: () => showToast.success('User updated!'),
  });
};
```

### Delete with Confirmation

```javascript
const handleDelete = () => {
  if (!confirm('Are you sure?')) return;
  
  if (!hasRoute('users.destroy')) {
    console.error('Route users.destroy not found');
    showToast.error('Navigation route not found. Please contact support.');
    return;
  }
  
  const url = route('users.destroy', { user: userId });
  del(url, {
    onSuccess: () => showToast.success('User deleted!'),
  });
};
```

## Why This Matters

1. **Prevents Crashes**: Graceful error handling instead of application crashes
2. **Better UX**: Users see helpful error messages instead of blank screens
3. **Easier Debugging**: Console logs help identify missing routes
4. **Type Safety**: TypeScript definitions provide better IDE support
5. **Future Proof**: Works correctly even when routes are added/removed

## Technical Background

### Ziggy Route Helper
Ziggy generates a JavaScript object containing all Laravel routes and provides a helper function to generate URLs. The helper is injected via the `@routes` Blade directive in `app.blade.php`.

### Inertia v2 Changes
Inertia.js v2 expects URL parameters to be strings. Internally, it calls `.toString()` on the URL. If the URL is undefined, this causes a TypeError.

### Our Solution
By validating route existence first and storing the result in a variable, we ensure Inertia always receives a valid string, preventing the undefined error.

## Related Files

- `/packages/aero-ui/resources/js/utils/routeUtils.js` - Safe route utilities
- `/packages/aero-ui/resources/js/utils/toastUtils.jsx` - Toast notifications
- `/packages/aero-ui/resources/js/types/global.d.ts` - TypeScript definitions
- `/packages/aero-ui/resources/js/bootstrap.js` - Route helper documentation

## Migration Checklist

When updating existing code:

- [ ] Import `hasRoute` from `@/utils/routeUtils`
- [ ] Import `showToast` from `@/utils/toastUtils`
- [ ] Add route validation before `post()`/`put()`/`delete()` calls
- [ ] Store route URL in variable before passing to Inertia methods
- [ ] Add error handling with user-friendly messages
- [ ] Test the form submission to ensure it works

## Examples in Codebase

See these files for reference implementations:
- `packages/aero-ui/resources/js/Pages/Platform/Public/Register/SelectPlan.jsx`
- `packages/aero-ui/resources/js/Pages/Platform/Public/Register/AccountType.jsx`
- `packages/aero-ui/resources/js/Pages/Onboarding/Index.jsx`
- `packages/aero-ui/resources/js/Pages/Core/Settings/SystemSettings.jsx`
