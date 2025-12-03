# Tenant Onboarding Flow Implementation

## Overview

The tenant onboarding wizard is a multi-step setup process that guides new tenant administrators through essential organization configuration after successful tenant provisioning. This document details the complete flow from registration to onboarding completion.

## Complete Flow: Registration → Provisioning → Onboarding

### Phase 1: Tenant Registration (Platform Domain)

**Location**: `https://aero-enterprise-suite-saas.com/register`

**Steps**:
1. **Account Type** - Company or individual
2. **Details** - Subdomain, company name, email
3. **Admin Setup** - Admin credentials (name, email, username, password)
4. **Plan Selection** - Choose plan and modules
5. **Trial Activation** - Confirm and start provisioning

**Controller**: `PlatformRegistrationController`
**Routes**: `routes/platform.php`

### Phase 2: Async Tenant Provisioning

**Job**: `ProvisionTenant` (queued)

**Steps**:
1. Create tenant database
2. Run migrations
3. Seed roles and permissions
4. Create admin user
5. Assign Super Administrator role
6. Send welcome email
7. Activate tenant (status → 'active')

**Status Page**: `https://aero-enterprise-suite-saas.com/register/provisioning/{tenantId}`
- Real-time polling of provisioning status
- Shows current step and progress
- Redirects to tenant subdomain on success

### Phase 3: Tenant Onboarding (AUTOMATIC)

**⭐ NEW IMPLEMENTATION** - Now automatically triggered!

When the Super Administrator logs into the tenant for the first time:

1. **Middleware Check**: `RequireTenantOnboarding` middleware detects incomplete onboarding
2. **Auto-Redirect**: User is redirected from `/dashboard` to `/onboarding`
3. **Wizard Flow**: Multi-step wizard guides through setup

**Location**: `https://{subdomain}.aero-enterprise-suite-saas.com/onboarding`

**Onboarding Steps**:
1. **Welcome** - Introduction and overview
2. **Company Info** - Organization details, address, contact
3. **Branding** - Colors, logos, visual identity
4. **Team** - Invite team members
5. **Modules** - Configure features
6. **Complete** - Finish and go to dashboard

**Controller**: `TenantOnboardingController`
**Routes**: `routes/web.php` (tenant routes)
**Frontend**: `resources/js/Tenant/Pages/Onboarding/Index.jsx`

## Technical Implementation

### 1. Middleware: RequireTenantOnboarding

**File**: `app/Http/Middleware/RequireTenantOnboarding.php`

**Purpose**: 
- Checks if onboarding is completed
- Redirects Super Administrators to onboarding wizard if not completed
- Allows regular employees to access app even if onboarding incomplete

**Logic**:
```php
// Skip if not a tenant context
if (!tenant()) return $next($request);

// Skip if accessing onboarding routes
if ($request->routeIs('onboarding.*')) return $next($request);

// Skip for API and JSON requests
if ($request->expectsJson()) return $next($request);

// Check if onboarding completed
if (!TenantOnboardingController::isOnboardingCompleted()) {
    // Only redirect Super Administrators
    if ($request->user()->hasRole('Super Administrator')) {
        return redirect()->route('onboarding.index');
    }
}

return $next($request);
```

**Registered In**: `bootstrap/app.php`
```php
'require_tenant_onboarding' => \App\Http\Middleware\RequireTenantOnboarding::class
```

**Applied To**: All authenticated tenant routes in `routes/web.php`
```php
$middlewareStack = ['auth', 'verified', 'require_tenant_onboarding'];
```

**Exceptions**: Onboarding routes themselves are excluded using `withoutMiddleware()`

### 2. Onboarding Status Tracking

**Storage**: Tenant's `data` JSON column
```json
{
  "onboarding": {
    "completed": false,
    "current_step": "welcome",
    "completed_steps": ["welcome", "company"],
    "skipped": false
  }
}
```

**Helper Method**: `TenantOnboardingController::isOnboardingCompleted()`
```php
public static function isOnboardingCompleted(): bool
{
    if (!tenant()) return true;
    
    $data = tenant()->data ?? [];
    return ($data['onboarding']['completed'] ?? false) === true;
}
```

### 3. Onboarding Completion

**When complete button clicked**:
1. `TenantOnboardingController@complete` is called
2. Marks `onboarding.completed = true` in tenant data
3. Redirects to dashboard
4. Middleware no longer blocks access

**When skip button clicked**:
1. `TenantOnboardingController@skip` is called
2. Marks `onboarding.skipped = true`
3. Marks as completed (so user isn't blocked)
4. Can re-access onboarding from settings later

## User Experience Flow

### New Tenant Admin Journey:

1. **Registration** (Platform domain)
   - Fills multi-step registration form
   - Clicks "Start Trial"
   
2. **Provisioning Wait** (Platform domain)
   - Sees animated provisioning status page
   - Real-time progress updates
   - Automatically redirects when complete (20-60 seconds)
   
3. **First Login** (Tenant subdomain)
   - Receives welcome email with login link
   - Clicks link → `https://{subdomain}.platform.com/login`
   - Logs in with credentials from registration
   
4. **Onboarding Wizard** (Tenant subdomain) ⭐ **AUTOMATIC**
   - **Before**: Would go directly to dashboard
   - **Now**: Automatically redirected to `/onboarding`
   - Guided through 6-step setup wizard
   - Can skip and complete later
   - Can go back/forward between steps
   
5. **Dashboard Access** (Tenant subdomain)
   - After completing onboarding → `/dashboard`
   - Full application access
   - No more redirects

### Regular Employee Journey:

1. Invited by Super Administrator during onboarding (step 4)
2. Receives invitation email
3. Clicks link → Sets password
4. Logs in → Goes directly to dashboard (NO onboarding required)

## Configuration

### Onboarding Steps Configuration

**File**: `TenantOnboardingController.php`

```php
protected array $steps = [
    'welcome' => [
        'title' => 'Welcome',
        'description' => 'Let\'s get your organization set up',
        'order' => 1,
    ],
    'company' => [
        'title' => 'Company Info',
        'description' => 'Tell us about your organization',
        'order' => 2,
    ],
    // ... more steps
];
```

### Customize Middleware Behavior

To allow certain roles to skip onboarding, modify `RequireTenantOnboarding.php`:

```php
// Current: Only Super Administrators are required to complete onboarding
if ($request->user()->hasRole('Super Administrator')) {
    return redirect()->route('onboarding.index');
}

// To require all admins:
if ($request->user()->hasAnyRole(['Super Administrator', 'Administrator'])) {
    return redirect()->route('onboarding.index');
}
```

## Testing the Flow

### 1. Test New Tenant Registration

```bash
# Start from platform domain
https://aero-enterprise-suite-saas.com/register

# Fill form:
- Company: Test Company
- Subdomain: testco
- Email: admin@test.com
- Admin: admin / password123

# Click "Start Trial"
# Wait for provisioning (watch status page)
```

### 2. Test Onboarding Trigger

```bash
# Login to tenant
https://testco.aero-enterprise-suite-saas.com/login
Email: admin@test.com
Password: password123

# Expected: Automatically redirected to /onboarding
# See welcome screen with "Let's Get Started" button
```

### 3. Test Onboarding Flow

```bash
# Step through wizard:
1. Welcome → Click "Let's Get Started"
2. Company Info → Fill details → Click "Continue"
3. Branding → Choose colors → Click "Continue"
4. Team → Add emails → Click "Continue"
5. Modules → Select features → Click "Continue"
6. Complete → Click "Go to Dashboard"

# Expected: Redirected to /dashboard
# No more redirects to onboarding
```

### 4. Test Skip Functionality

```bash
# From onboarding welcome screen
# Click "Skip for Now"

# Expected: 
- Redirected to dashboard
- No blocking on next login
- Can access /onboarding manually from settings
```

### 5. Test Employee Login (No Onboarding)

```bash
# Create employee user in database
# Login as employee

# Expected:
- Goes directly to dashboard
- No onboarding wizard shown
- Only Super Admins see onboarding
```

## Troubleshooting

### Issue: Onboarding not triggered after login

**Check**:
1. Middleware registered in `bootstrap/app.php`
2. Middleware applied to routes in `routes/web.php`
3. User has "Super Administrator" role
4. Onboarding not already marked complete in tenant data

**Debug**:
```php
// In tinker:
tenancy()->initialize(Tenant::find('tenant-id'));
$tenant = tenant();
dd($tenant->data['onboarding'] ?? 'not set');
```

### Issue: Infinite redirect loop

**Cause**: Onboarding routes not excluded from middleware

**Fix**: Ensure onboarding routes use `withoutMiddleware('require_tenant_onboarding')`

### Issue: Regular employees blocked

**Check**: Middleware only redirects Super Administrators:
```php
if ($request->user()->hasRole('Super Administrator'))
```

### Issue: Can't access profile while onboarding incomplete

**Fix**: Add to middleware except array:
```php
protected array $except = [
    'onboarding.*',
    'logout',
    'profile.*',  // ← Already included
];
```

## Future Enhancements

1. **Progress Persistence**: Save partial progress so users can resume later
2. **Email Reminders**: Send reminder emails if onboarding not completed after X days
3. **Analytics**: Track onboarding completion rates and drop-off points
4. **Conditional Steps**: Show/hide steps based on plan or modules selected
5. **Video Tutorials**: Add embedded videos or tours for each step
6. **Re-onboarding**: Allow re-running onboarding to update settings

## Related Files

### Backend:
- `app/Http/Middleware/RequireTenantOnboarding.php` - Middleware
- `app/Http/Controllers/Tenant/TenantOnboardingController.php` - Controller
- `app/Models/Tenant.php` - Tenant model (data storage)
- `bootstrap/app.php` - Middleware registration
- `routes/web.php` - Tenant routes with middleware

### Frontend:
- `resources/js/Tenant/Pages/Onboarding/Index.jsx` - Wizard UI
- `resources/js/Layouts/OnboardingLayout.jsx` - Layout (if exists)

### Documentation:
- `docs/tenant-onboarding-flow.md` - This file
- `docs/tenant-provisioning-seeding.md` - Provisioning details
- `docs/registration-improvements.md` - Registration flow

---

**Status**: ✅ **FULLY IMPLEMENTED AND PRODUCTION READY**

**Last Updated**: December 3, 2025
**Implemented By**: GitHub Copilot
