# Inertia.js Routing & Navigation Compliance Audit Report

**Date:** 2025-12-24  
**System:** Aero Enterprise Suite SaaS (Laravel 11 + Inertia.js v2 + React 18)  
**Architecture:** Multi-tenant, Multi-domain (Central, Admin, Tenant)

---

## Executive Summary

This audit identifies critical compliance issues with Inertia.js navigation patterns, controller responses, and routing safety that could lead to runtime errors such as:
- `Cannot read properties of undefined (reading 'toString')`
- Invalid Inertia redirects
- Broken navigation links
- Silent 404 failures

---

## CRITICAL FINDINGS

### ❌ 1. UNSAFE ROUTE USAGE IN FRONTEND (HIGH PRIORITY)

**Issue:** Frontend components use `route()` helper without checking route existence, leading to potential undefined errors.

**Affected Files:**
- `packages/aero-ui/resources/js/Widgets/RFI/*.jsx` - Multiple widgets
- `packages/aero-ui/resources/js/Tables/HRM/*.jsx` - Multiple tables
- `packages/aero-ui/resources/js/Components/**/*.jsx` - Various components
- `packages/aero-ui/resources/js/Pages/**/*.jsx` - Various pages

**Examples:**
```javascript
// UNSAFE - No guard
router.visit(route('rfi.index', { filter: 'overdue' }));

// UNSAFE - No guard
href={route('profile', { user: user.id })}

// UNSAFE - axios call without route check
await axios.get(route('core.dashboard.widget', { widgetKey: 'rfi.overdue' }));
```

**Risk:** If route doesn't exist on current domain or is renamed, `route()` returns undefined, causing:
- `router.visit(undefined)` → Inertia error
- `href={undefined}` → Broken links
- `axios.get(undefined)` → Network error

**Required Fix:**
```javascript
// SAFE - With guard
if (route().has('rfi.index')) {
    router.visit(route('rfi.index', { filter: 'overdue' }));
}

// SAFE - With fallback
const profileUrl = route().has('profile') ? route('profile', { user: user.id }) : '#';
<Link href={profileUrl}>Profile</Link>
```

---

### ❌ 2. MISSING REDIRECT FALLBACKS IN `redirect()->intended()`

**Issue:** Multiple authentication controllers use `redirect()->intended()` without safe fallback routes.

**Affected Files:**
- `packages/aero-core/src/Http/Controllers/Auth/VerificationController.php`
- `packages/aero-core/src/Http/Controllers/Auth/EmailVerificationController.php`
- `packages/aero-core/src/Http/Controllers/Auth/AuthenticatedSessionController.php`
- `packages/aero-core/src/Http/Controllers/Auth/LoginController.php`
- `packages/aero-platform/src/Http/Controllers/Auth/*` (duplicated issues)

**Current Pattern:**
```php
// RISKY - intended URL might be invalid cross-domain
return redirect()->intended(route('dashboard'));
```

**Problem:** In multi-domain architecture, the "intended" URL stored in session might point to:
- A different domain (admin → tenant crossing)
- A route that doesn't exist in current context
- An unauthorized route

**Risk Level:** Medium (causes redirect loops or 404s)

**Required Fix:**
```php
// SAFE - Validate intended URL domain
$intended = session()->get('url.intended');
$currentDomain = request()->getHost();

if ($intended && parse_url($intended, PHP_URL_HOST) === $currentDomain) {
    return redirect()->to($intended);
}

// Fallback based on domain context
return redirect()->route('dashboard');
```

---

### ⚠️ 3. POTENTIAL JSON RESPONSES ON INERTIA ROUTES

**Issue:** Some controller methods mixing JSON and Inertia responses without proper request type detection.

**Affected Files:**
- `packages/aero-hrm/src/Http/Controllers/Leave/LeaveController.php::delete()`
- `packages/aero-hrm/src/Http/Controllers/Employee/LetterController.php::update()`
- Various API controllers mixed with web controllers

**Pattern:**
```php
public function delete(Request $request): \Illuminate\Http\JsonResponse
{
    // This method returns JSON but might be called from Inertia form
    // Inertia expects redirect response for POST/DELETE
    return response()->json(['success' => true]);
}
```

**Risk:** When Inertia makes a DELETE/POST request, it expects either:
1. `Inertia::render()` (for validation errors - rare)
2. `redirect()` response
3. **NOT** `response()->json()`

If JSON is returned, Inertia doesn't know how to handle it.

**Required Fix:**
```php
public function delete(Request $request)
{
    // Delete logic...
    
    // Check if it's an Inertia request
    if ($request->header('X-Inertia')) {
        return redirect()->route('leaves.index')
            ->with('success', 'Leave deleted successfully');
    }
    
    // API/AJAX request
    return response()->json(['success' => true]);
}
```

---

### ⚠️ 4. UNSAFE `back()` USAGE

**Issue:** Several controllers use `redirect()->back()` which can fail in Inertia context.

**Pattern:**
```php
return redirect()->back()->with('error', 'Something went wrong');
```

**Problem:** 
- `back()` relies on HTTP Referer header
- Referer might be from different domain
- Referer might be missing
- Results in redirect to `/` (root)

**Risk:** User redirected to unexpected location, losing context.

**Required Fix:**
```php
// SAFE - With explicit fallback
return redirect()->back()->fallbackRoute('dashboard')
    ->with('error', 'Something went wrong');

// OR use intended destination
return redirect()->route('specific.index')
    ->with('error', 'Something went wrong');
```

---

### ✅ 5. CONTROLLER RESPONSE PATTERNS (COMPLIANT)

**Finding:** Most controllers correctly use:
- `Inertia::render()` for GET requests
- `redirect()->route()` for POST/PUT/PATCH/DELETE

**Example (Compliant):**
```php
// GET - renders page
public function index()
{
    return Inertia::render('HRM/EmployeeList', [
        'employees' => $employees
    ]);
}

// POST - redirects
public function store(Request $request)
{
    // Store logic...
    return redirect()->route('employees.index')
        ->with('success', 'Employee created');
}
```

---

### ⚠️ 6. MIDDLEWARE RESPONSE ISSUES

**Issue:** Some middleware might return JSON for Inertia requests.

**Files to Review:**
- `packages/aero-platform/src/Http/Middleware/IdentifyDomainContext.php`
- Authentication middleware
- Tenant middleware

**Required Pattern:**
```php
// In middleware handling Inertia requests
if ($request->header('X-Inertia')) {
    // Return redirect, not JSON
    return redirect()->route('login');
}

// For non-Inertia
return response()->json(['error' => 'Unauthorized'], 401);
```

---

### ⚠️ 7. ZIGGY ROUTE FILTERING (NEEDS VERIFICATION)

**Issue:** Need to verify that Ziggy only exposes domain-appropriate routes.

**Current Implementation:**
- Core's HandleInertiaRequests shares routes via Ziggy
- Platform's HandleInertiaRequests shares routes via Ziggy

**Concern:** Admin routes might be exposed to tenant frontend, or vice versa.

**Required Verification:**
- Check Ziggy configuration
- Verify route filtering by domain context
- Test route availability in different contexts

---

### ⚠️ 8. LINK COMPONENT SAFETY

**Issue:** Many `<Link>` components don't validate href before rendering.

**Pattern:**
```jsx
// UNSAFE
<Link href={route('some.route')}>Navigate</Link>

// If 'some.route' doesn't exist, href becomes undefined
```

**Required Fix:**
```jsx
// SAFE
const safeHref = route().has('some.route') ? route('some.route') : '#';
<Link href={safeHref}>Navigate</Link>

// OR conditionally render
{route().has('some.route') && (
    <Link href={route('some.route')}>Navigate</Link>
)}
```

---

### ✅ 9. ROOT ROUTE HANDLING (COMPLIANT)

**Finding:** Root route "/" properly handled in middleware:

**Core (HandleInertiaRequests.php lines 62-68):**
```php
if ($request->is('/') || $request->path() === '/') {
    if (Auth::check()) {
        return redirect('/dashboard');
    }
    return redirect('/login');
}
```

**Platform (routes/admin.php lines 88-94):**
```php
Route::get('/', function () {
    if (Auth::guard('landlord')->check()) {
        return redirect()->route('admin.dashboard');
    }
    return redirect()->route('admin.login');
})->name('admin.root');
```

---

### ❌ 10. CROSS-DOMAIN NAVIGATION RISK

**Issue:** No explicit guards prevent Inertia navigation from crossing domain boundaries.

**Scenario:**
```javascript
// User on tenant.platform.com
router.visit('/admin/dashboard'); // Tries to visit admin route

// Result: 404 or middleware redirect, but Inertia doesn't handle gracefully
```

**Required Fix:**
Create navigation guard that validates domain context before navigation.

---

## COMPLIANCE MATRIX

| Checkpoint | Status | Priority | Notes |
|------------|--------|----------|-------|
| Route Definition Existence | ⚠️ Partial | HIGH | Routes defined but not validated in frontend |
| Frontend Navigation Safety | ❌ Non-Compliant | CRITICAL | Missing route guards |
| Controller GET Responses | ✅ Compliant | - | Proper Inertia::render() usage |
| Controller POST/PUT/PATCH/DELETE | ⚠️ Mostly Compliant | MEDIUM | Some JSON responses mixed |
| Redirect Safety | ⚠️ Needs Improvement | MEDIUM | Missing fallbacks |
| Middleware Responses | ⚠️ Needs Review | MEDIUM | Potential JSON responses |
| Ziggy Integration | ⚠️ Needs Verification | MEDIUM | Route filtering unclear |
| 404 & Error Handling | ⚠️ Needs Review | MEDIUM | Need explicit error pages |
| Root Route Handling | ✅ Compliant | - | Properly handled |
| Cross-Domain Guards | ❌ Missing | HIGH | No protection |

---

## RECOMMENDED FIXES (Priority Order)

### 1. Create Route Safety Utility (CRITICAL)
Create `packages/aero-ui/resources/js/utils/routeUtils.js`:
```javascript
/**
 * Safely get a route URL with fallback
 */
export function safeRoute(name, params = {}, fallback = '#') {
    try {
        if (route().has(name)) {
            return route(name, params);
        }
    } catch (error) {
        console.warn(`Route "${name}" not found`, error);
    }
    return fallback;
}

/**
 * Safely navigate with route validation
 */
export function safeNavigate(routeName, params = {}, options = {}) {
    const { router } = useInertiaRouter();
    
    if (!route().has(routeName)) {
        console.error(`Cannot navigate: route "${routeName}" does not exist`);
        showToast.error(`Navigation failed: Invalid route`);
        return;
    }
    
    router.visit(route(routeName, params), options);
}

/**
 * Check if route exists and is accessible
 */
export function canNavigateTo(routeName) {
    return route().has(routeName);
}
```

### 2. Create SafeLink Component (CRITICAL)
```jsx
// packages/aero-ui/resources/js/Components/SafeLink.jsx
import { Link } from '@inertiajs/react';
import { safeRoute } from '@/utils/routeUtils';

export default function SafeLink({ route: routeName, params = {}, fallback = '#', children, ...props }) {
    const href = safeRoute(routeName, params, fallback);
    
    // Don't render link if route doesn't exist and no fallback
    if (href === '#' && fallback === '#' && !props.onClick) {
        return <span className="cursor-not-allowed opacity-50">{children}</span>;
    }
    
    return <Link href={href} {...props}>{children}</Link>;
}
```

### 3. Fix redirect()->intended() Calls (HIGH)
Create helper in Core package:
```php
// packages/aero-core/src/Helpers/RedirectHelpers.php
function safe_redirect_intended($default, $validateDomain = true) {
    $intended = session()->get('url.intended');
    
    if (!$intended) {
        return redirect()->route($default);
    }
    
    if ($validateDomain) {
        $intendedDomain = parse_url($intended, PHP_URL_HOST);
        $currentDomain = request()->getHost();
        
        if ($intendedDomain !== $currentDomain) {
            return redirect()->route($default);
        }
    }
    
    // Additional validation: check if route exists
    // This is approximate - may need refinement
    return redirect()->to($intended);
}
```

### 4. Create Inertia Response Validator Middleware (MEDIUM)
```php
// packages/aero-core/src/Http/Middleware/ValidateInertiaResponse.php
class ValidateInertiaResponse
{
    public function handle($request, Closure $next)
    {
        $response = $next($request);
        
        // Only validate Inertia requests
        if (!$request->header('X-Inertia')) {
            return $response;
        }
        
        // Check if response is JSON when it should be redirect
        if ($request->isMethod(['POST', 'PUT', 'PATCH', 'DELETE'])) {
            if ($response instanceof JsonResponse) {
                \Log::error('Invalid Inertia response: JSON returned for mutation request', [
                    'url' => $request->fullUrl(),
                    'method' => $request->method()
                ]);
            }
        }
        
        return $response;
    }
}
```

### 5. Add 404 Handler for Inertia (MEDIUM)
```php
// In Exception Handler
public function render($request, Throwable $e)
{
    if ($e instanceof NotFoundHttpException && $request->header('X-Inertia')) {
        return Inertia::render('Errors/404', [
            'message' => 'Page not found'
        ])->toResponse($request)->setStatusCode(404);
    }
    
    return parent::render($request, $e);
}
```

---

## TESTING CHECKLIST

- [ ] Test navigation between tenant/admin/platform domains
- [ ] Test route() helper with non-existent routes
- [ ] Test redirect()->intended() with cross-domain URLs
- [ ] Test POST/DELETE with JSON responses
- [ ] Test 404 handling in Inertia context
- [ ] Test middleware redirect responses
- [ ] Verify Ziggy route filtering per domain
- [ ] Test Link components with invalid routes
- [ ] Test back() redirect in various contexts
- [ ] Test error page rendering

---

## CONCLUSION

The system has a **partially compliant** Inertia.js implementation with several critical risks that must be addressed:

**Critical Issues (Must Fix):**
1. Missing route guards in frontend navigation
2. Unsafe `route()` helper usage
3. Cross-domain navigation lacks protection

**High Priority (Should Fix Soon):**
4. Missing fallbacks in `redirect()->intended()`
5. Mixed JSON/Inertia responses in some controllers

**Medium Priority (Fix in Next Sprint):**
6. Middleware response validation
7. 404 error handling
8. Ziggy route filtering verification

**Production Readiness Assessment:** ⚠️ **NOT PRODUCTION READY** until Critical and High Priority issues are fixed.

---

## NEXT STEPS

1. Implement route safety utilities
2. Create SafeLink component
3. Audit and fix all frontend route() calls
4. Fix redirect()->intended() usage
5. Add response validation middleware
6. Implement proper 404 handling
7. Add comprehensive tests
8. Document safe navigation patterns for developers
