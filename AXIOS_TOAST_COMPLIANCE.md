# Axios + ToastUtils Compliance Guide

## Executive Summary
This document defines the **mandatory** axios + toastUtils pattern for all API interactions in the Aero Enterprise Suite SaaS application, ensuring consistent user feedback and error handling.

## Reference Implementation
The **Leave Management** module serves as the gold standard implementation:
- `packages/aero-ui/resources/js/Forms/HRM/LeaveForm.jsx`
- `packages/aero-ui/resources/js/Pages/HRM/LeavesAdmin.jsx`

## Mandatory Pattern

### For User-Initiated Actions (CRUD Operations)
**Always use the promise pattern with toast feedback:**

```javascript
import axios from 'axios';
import { showToast } from '@/utils/toastUtils';

const handleSubmit = async (event) => {
  event.preventDefault();
  
  const promise = new Promise(async (resolve, reject) => {
    try {
      const response = await axios.post(route('api.endpoint'), formData);
      
      if (response.status === 200 || response.status === 201) {
        // Handle success (update state, close modal, etc.)
        resolve([response.data.message || 'Operation completed successfully']);
      }
    } catch (error) {
      // Handle errors
      if (error.response?.status === 422) {
        // Validation errors
        setErrors(error.response.data.errors || {});
      }
      reject([error.response?.data?.message || 'Operation failed']);
    }
  });

  showToast.promise(promise, {
    loading: 'Processing...',
    success: (data) => data.join(', '),
    error: (data) => Array.isArray(data) ? data.join(', ') : data,
  });
};
```

### For Silent Background Operations (Polling, Status Checks)
**Use axios without toast for non-disruptive updates:**

```javascript
const fetchStatus = useCallback(async () => {
  try {
    const response = await axios.get(route('api.status'));
    const data = response.data;
    
    // Update state silently
    setStatus(data.status);
    
    // Only show toast for critical events
    if (data.has_failed) {
      showToast.error(data.error || 'Operation failed');
    }
  } catch (err) {
    console.error('Status fetch error:', err);
    // Silent failure for polling - don't disrupt UX
  }
}, [dependencies]);
```

### For Real-Time Validation (Subdomain Check, Email Validation)
**Use axios without toast for instant feedback:**

```javascript
const checkAvailability = async (value) => {
  setChecking(true);
  try {
    const response = await axios.post(route('api.check'), { value });
    setAvailable(response.data.available);
  } catch (error) {
    // Silent failure - show in UI state, not toast
    setAvailable(null);
  } finally {
    setChecking(false);
  }
};
```

## Action Message Templates
Use predefined templates from toastUtils for consistency:

```javascript
// CRUD operations
showToast.action('create', 'tenant', promise);  // "Creating tenant..."
showToast.action('update', 'user', promise);    // "Updating user..."
showToast.action('delete', 'record', promise);  // "Deleting record..."

// Status operations
showToast.action('approve', 'leave', promise);  // "Approving leave..."
showToast.action('reject', 'request', promise); // "Rejecting request..."
```

## Compliance Checklist

### ✅ Required
- [ ] All user-initiated actions use `showToast.promise()`
- [ ] All axios calls include proper error handling
- [ ] Validation errors (422) are captured and displayed in forms
- [ ] Network errors show user-friendly messages
- [ ] Loading states prevent duplicate submissions
- [ ] Success messages trigger appropriate state updates

### ❌ Prohibited
- Never use raw `fetch()` - always use axios
- Never use `showToast.success()` / `showToast.error()` directly for async operations
- Never show toast for polling/background operations (except critical failures)
- Never ignore errors silently (always log to console)

## Tenant Provisioning Compliance

### Status: ✅ COMPLIANT

#### Files Audited
1. **Provisioning.jsx** - Status polling & retry action
   - Status polling: axios without toast (✅ correct - silent polling)
   - Retry action: axios + showToast.promise() (✅ correct - user action)
   - Final redirect: window.location (✅ correct - cross-domain navigation)

2. **CancelRegistrationButton.jsx** - Cancel registration
   - Uses axios + showToast.promise() (✅ correct)

3. **VerifyEmail.jsx** - Email verification
   - Send code: axios + showToast (✅ correct)
   - Verify code: axios + showToast (✅ correct)

4. **VerifyPhone.jsx** - Phone verification
   - Send code: axios + showToast (✅ correct)
   - Verify code: axios + showToast (✅ correct)

5. **Details.jsx** - Company details & subdomain check
   - Subdomain check: axios without toast (✅ correct - real-time validation)
   - Form submit: Inertia form (✅ correct - server-side redirect)

6. **Tenants/Index.jsx** - Tenant management
   - All actions: axios + showToast.promise() (✅ correct)

### Backend Compliance
- ✅ All registration endpoints return JSON responses
- ✅ Form submissions use Laravel redirects (Inertia-compatible)
- ✅ No Blade views in tenant provisioning flow
- ✅ Proper HTTP status codes (200, 201, 422, 404, 429, 500)

## SPA Behavior Verification

### Navigation Patterns
- ✅ Internal navigation uses `safeNavigate()` / `router.visit()`
- ✅ Form submissions use Inertia forms or axios + manual redirect
- ✅ Cross-domain navigation uses `window.location` (only for tenant → platform)
- ✅ No `<a href>` for internal routes

### State Management
- ✅ Axios requests preserve Inertia headers
- ✅ CSRF token automatically included in axios
- ✅ Error responses don't trigger full page reload
- ✅ Success responses update state without reload

## Testing Checklist
- [ ] Registration flow completes without page reload
- [ ] Provisioning status polls correctly
- [ ] Retry provisioning works
- [ ] Cancel registration cleans up properly
- [ ] Tenant admin actions execute correctly
- [ ] Toast notifications appear for all user actions
- [ ] No unexpected page reloads during flow

## Migration Guide for Non-Compliant Code

### Before (❌ Non-compliant)
```javascript
try {
  const response = await axios.post(route('api.update'), data);
  showToast.success('Updated successfully');
  closeModal();
} catch (error) {
  showToast.error('Update failed');
}
```

### After (✅ Compliant)
```javascript
const promise = new Promise(async (resolve, reject) => {
  try {
    const response = await axios.post(route('api.update'), data);
    if (response.status === 200) {
      closeModal();
      resolve([response.data.message || 'Updated successfully']);
    }
  } catch (error) {
    reject([error.response?.data?.message || 'Update failed']);
  }
});

showToast.promise(promise, {
  loading: 'Updating...',
  success: (data) => data[0],
  error: (data) => data[0],
});
```

## Benefits of This Pattern

1. **Consistent UX**: All operations show loading → success/error states
2. **Better Error Handling**: Structured error extraction from API responses
3. **Reduced Boilerplate**: Single pattern for all async operations
4. **Accessibility**: Screen readers can announce state changes
5. **Debugging**: Easier to trace request/response flow
6. **Maintainability**: Clear separation of concerns

## Questions?
Refer to the Leave Management implementation or contact the platform team.
