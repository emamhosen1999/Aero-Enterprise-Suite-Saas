# Tenant Provisioning Flow Documentation

## Overview
This document describes the complete tenant provisioning flow from registration through onboarding in the Aero Enterprise Suite SaaS platform.

## Complete Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                     REGISTRATION FLOW (Platform Domain)              │
└─────────────────────────────────────────────────────────────────────┘

Step 1: Account Type Selection
├─ Route: platform.register.index
├─ Controller: RegistrationPageController@accountType
├─ User selects: Company or Individual
└─ Session: stores 'account' step data

Step 2: Company Details
├─ Route: platform.register.details
├─ Controller: RegistrationController@storeDetails
├─ Input: name, email, phone, subdomain, team_size, industry
├─ Creates/Updates: Pending Tenant record (status = 'pending')
└─ Session: stores 'details' step data

Step 3: Email Verification (Company Email)
├─ Route: platform.register.verify-email
├─ Controller: RegistrationController@sendEmailVerification
├─ Sends: 6-digit verification code to company email
├─ Rate Limited: 1 code per minute
└─ Validates: Code and marks company_email_verified_at

Step 4: Phone Verification (Company Phone)
├─ Route: platform.register.verify-phone
├─ Controller: RegistrationController@sendPhoneVerification
├─ Sends: 6-digit verification code to company phone
├─ Rate Limited: 1 code per minute
└─ Validates: Code and marks company_phone_verified_at

Step 5: Plan & Module Selection
├─ Route: platform.register.plan
├─ Controller: RegistrationController@storePlan
├─ Options: Select pre-built plan OR individual modules
├─ Updates: Tenant with plan_id and modules array
└─ Session: stores 'plan' step data

Step 6: Review & Accept Terms
├─ Route: platform.register.payment
├─ Controller: RegistrationPageController@payment
├─ Shows: Summary of selections, trial terms, total cost
└─ User: Accepts terms and conditions

Step 7: Trial Activation & Provisioning Dispatch
├─ Route: platform.register.trial.activate
├─ Controller: RegistrationController@activateTrial
├─ Transaction:
│  ├─ Creates/Updates: Tenant record with complete data
│  ├─ Sets: trial_ends_at = now + trial_days
│  ├─ Creates: Domain record (subdomain.platform_domain)
│  └─ Status: 'pending'
├─ Dispatches: ProvisionTenant job to queue
└─ Redirects: platform.register.provisioning (waiting room)

┌─────────────────────────────────────────────────────────────────────┐
│              PROVISIONING FLOW (Background Queue Job)                │
└─────────────────────────────────────────────────────────────────────┘

Job: ProvisionTenant (runs in queue)
├─ Retries: 3 attempts with backoff [30s, 60s, 120s]
└─ Steps:

Step 0: Pre-flight Validation ✨ NEW
├─ Validates: Tenant has subdomain and domain
├─ Validates: Database connection is working
├─ Validates: Plan has modules (or warns)
├─ Validates: Migration paths exist
└─ Throws: RuntimeException if validation fails

Step 1: Mark as Provisioning
├─ Updates: status = 'provisioning'
├─ Updates: provisioning_step = 'creating_db'
└─ Broadcasts: TenantProvisioningStepCompleted event

Step 2: Create Tenant Database
├─ Job: CreateDatabase (Stancl\Tenancy)
├─ Creates: MySQL database named tenant{uuid}
├─ Verifies: Database exists in INFORMATION_SCHEMA ✨ NEW
└─ Status: provisioning_step = 'creating_db'

Step 3: Run Migrations
├─ Status: provisioning_step = 'migrating'
├─ Resolves Migration Paths: ✨ IMPROVED
│  ├─ Core: vendor/aero/core/database/migrations (or packages/aero-core/... in dev)
│  ├─ Plan Modules: vendor/aero/{module}/database/migrations
│  ├─ Fallback: packages/aero-{module}/database/migrations (dev)
│  └─ App Tenant: database/migrations/tenant
├─ Runs Within Tenant Context: tenancy()->runForMultiple()
├─ Creates: migrations table
├─ Executes: Each migration file in sorted order
├─ Records: Migration name and batch number
└─ Idempotent: Skips already-ran migrations

Step 4: Sync Module Hierarchy
├─ Status: provisioning_step = 'syncing_modules'
├─ Command: aero:sync-module --fresh --force
├─ Creates Records In:
│  ├─ modules (top level)
│  ├─ sub_modules (second level)
│  ├─ module_components (third level)
│  └─ module_component_actions (leaf level)
└─ Scope: Tenant context = tenant modules only

Step 5: Seed Default Roles
├─ Status: provisioning_step = 'seeding_roles'
├─ Creates Roles (using Spatie Permission):
│  ├─ Super Administrator (is_protected = true)
│  ├─ Administrator
│  ├─ HR Manager
│  └─ Employee
└─ Note: Permissions NOT seeded (role-based access only)

Step 6: Verify Provisioning ✨ NEW
├─ Status: provisioning_step = 'verifying'
├─ Validates Required Tables Exist:
│  ├─ users
│  ├─ roles
│  ├─ model_has_roles
│  ├─ modules
│  ├─ sub_modules
│  ├─ module_components
│  └─ module_component_actions
├─ Validates Roles: Count > 0 AND 'Super Administrator' exists
├─ Validates Modules: Count > 0 (warns if 0)
└─ Throws: RuntimeException if validation fails

Step 7: Activate Tenant
├─ Updates: status = 'active'
├─ Clears: provisioning_step = null
├─ Clears: admin_data = null (security)
└─ Ready For: Admin setup on tenant domain

Step 8: Send Welcome Email
├─ To: Company email (tenant.email)
├─ Contains: Link to tenant domain for admin setup
├─ Uses: MailService (fails silently if not configured)
└─ Log: Warning if email fails (doesn't fail provisioning)

┌─────────────────────────────────────────────────────────────────────┐
│              PROVISIONING STATUS POLLING (Frontend)                  │
└─────────────────────────────────────────────────────────────────────┘

Component: Provisioning.jsx (waiting room page)
├─ Route: platform.register.provisioning/{tenant}
├─ Polls: GET /api/tenants/{tenant}/provisioning-status (every 2 seconds)
├─ Displays: Current provisioning step with progress indicator
└─ Auto-redirects When Complete:
   ├─ If admin_setup_completed = false: https://{subdomain}.{domain}/admin-setup
   └─ If admin_setup_completed = true: https://{subdomain}.{domain}/login

┌─────────────────────────────────────────────────────────────────────┐
│                ADMIN SETUP FLOW (Tenant Domain)                      │
└─────────────────────────────────────────────────────────────────────┘

Route: /admin-setup (tenant domain)
├─ Middleware: RedirectIfNoAdmin (blocks /login until admin created)
├─ Controller: AdminSetupController (aero-core package)
└─ Flow:

Step 1: Show Admin Setup Form
├─ Route: admin.setup.show
├─ Checks: If user already exists → redirect to login
├─ Shows: Form for admin user details
└─ Fields: name, user_name, email, phone, password

Step 2: Create Admin User
├─ Route: admin.setup.store
├─ Validates: Unique username and email
├─ Creates: User record
│  ├─ active = true
│  ├─ email_verified_at = now() (no verification needed)
│  └─ phone_verified_at = now() (if phone provided)
├─ Assigns: 'Super Administrator' role
├─ Creates Role If Missing: Fallback safety mechanism
├─ Marks: tenant.data.admin_setup_completed = true
├─ Logs In: Auto-login with remember = true
└─ Redirects: core.dashboard

┌─────────────────────────────────────────────────────────────────────┐
│              ONBOARDING FLOW (Tenant Domain)                         │
└─────────────────────────────────────────────────────────────────────┘

Status: ⚠️  PARTIALLY IMPLEMENTED

Middleware: RequireTenantOnboarding
├─ Checks: TenantOnboardingController::isOnboardingCompleted()
├─ Enforces: Super Administrators must complete onboarding
└─ Redirects: route('onboarding.index') if incomplete

Controller: TenantOnboardingController
├─ Location: ⚠️  In _TODO_ directory (not in packages)
├─ Needed: Move to aero-platform package
└─ Should Cover:
   ├─ Welcome & Overview
   ├─ Company Profile Completion
   ├─ Department Structure Setup
   ├─ First Employees Creation
   ├─ Module Configuration
   └─ Integration Setup (optional)

Current Behavior: ❌
├─ Admin setup completes → redirects to dashboard
└─ No onboarding wizard shown

┌─────────────────────────────────────────────────────────────────────┐
│                    ERROR HANDLING & ROLLBACK                         │
└─────────────────────────────────────────────────────────────────────┘

If Provisioning Fails:
├─ Method: ProvisionTenant::failed()
├─ Sends: Failure notification email to company email
├─ Logs: Complete error trace and context
└─ Rollback Strategy (NEW):

Development Mode (PRESERVE_FAILED_TENANTS = true):
├─ Marks: tenant.status = 'failed'
├─ Stores: Error message in tenant.data.provisioning_error
├─ Drops: Tenant database (if created)
├─ Preserves: Tenant and domain records for debugging
└─ Admin: Can retry provisioning from admin panel

Production Mode (PRESERVE_FAILED_TENANTS = false):
├─ Marks: tenant.status = 'failed'
├─ Drops: Tenant database (if created)
├─ Deletes: Domain records
├─ Deletes: Tenant record completely
└─ User: Can re-register with same email/subdomain

Retry Provisioning:
├─ Route: platform.register.provisioning/{tenant}/retry
├─ Controller: RegistrationController@retryProvisioning
├─ Validates: Only failed tenants can be retried
├─ Cleans: Orphaned database if exists
├─ Resets: status = 'pending', provisioning_step = null
├─ Dispatches: New ProvisionTenant job
└─ Note: Admin credentials not available on retry (must be created manually)
```

## Key Configuration

### Platform Configuration (`config/platform.php`)
```php
'trial_days' => env('PLATFORM_TRIAL_DAYS', 14),
'central_domain' => env('PLATFORM_DOMAIN', 'localhost'),
'preserve_failed_tenants' => env('PRESERVE_FAILED_TENANTS', env('APP_DEBUG', false)),
```

### Tenant Status States
- `pending`: Awaiting provisioning
- `provisioning`: Currently being provisioned
- `active`: Provisioned and ready for use
- `failed`: Provisioning failed
- `suspended`: Manually suspended by admin
- `archived`: Soft deleted / deactivated

### Provisioning Steps (for tracking)
- `creating_db`: Creating tenant database
- `migrating`: Running migrations
- `syncing_modules`: Syncing module hierarchy
- `seeding_roles`: Seeding default roles
- `verifying`: Verifying provisioning (NEW)

## Security Notes

1. **Company Email Verification**: Verifies the company contact email (not admin email)
2. **Company Phone Verification**: Verifies the company contact phone (not admin phone)
3. **Admin Credentials**: NOT stored in central database during registration
4. **Admin User Creation**: Happens AFTER provisioning on tenant domain
5. **Auto-Login**: Admin is logged in after account creation (security: generate session)
6. **Password Policy**: Min 8 chars, mixed case, numbers required

## Database Architecture

### Central Database (eos365)
- `tenants`: Main tenant records
- `domains`: Tenant domain mappings
- `plans`: Subscription plans
- `modules`: Available modules (platform scope)
- `plan_module`: Plan-to-module relationships
- `subscriptions`: Active subscriptions

### Tenant Databases (tenant{uuid})
- `users`: Tenant users
- `roles`: Tenant roles
- `model_has_roles`: User-role assignments
- `modules`: Tenant modules (tenant scope)
- `sub_modules`: Sub-module hierarchy
- `module_components`: Components
- `module_component_actions`: Leaf actions
- `+ module-specific tables`: HRM, CRM, Finance, etc.

## Migration Path Resolution

### Production (after composer install)
```
vendor/aero/core/database/migrations
vendor/aero/hrm/database/migrations
vendor/aero/crm/database/migrations
```

### Development (direct package access)
```
packages/aero-core/database/migrations
packages/aero-hrm/database/migrations
packages/aero-crm/database/migrations
```

The provisioning job automatically tries both paths with fallback logic.

## Testing Checklist

- [ ] Test complete registration flow with all steps
- [ ] Test email/phone verification with valid codes
- [ ] Test email/phone verification with invalid codes
- [ ] Test plan selection (pre-built plan)
- [ ] Test module selection (individual modules)
- [ ] Test provisioning success scenario
- [ ] Test provisioning failure and rollback
- [ ] Test retry provisioning after failure
- [ ] Test admin setup on tenant domain
- [ ] Test RedirectIfNoAdmin middleware
- [ ] Test migration path resolution in dev environment
- [ ] Test migration path resolution in production environment
- [ ] Test module hierarchy sync
- [ ] Test role seeding
- [ ] Test provisioning verification step
- [ ] Test concurrent tenant provisioning
- [ ] Test subdomain collision handling
- [ ] Test email collision handling

## Known Issues & TODOs

### High Priority
1. **Tenant Onboarding**: TenantOnboardingController is in _TODO_ directory, needs implementation
2. **Migration Idempotency**: Could be more robust with better error handling
3. **Provisioning Webhooks**: No external monitoring/callback mechanism

### Medium Priority
4. **Module Dependencies**: No validation that module dependencies are installed
5. **Storage Quotas**: Not enforced during provisioning
6. **User Limits**: Not enforced during provisioning
7. **Backup Before Rollback**: No database backup before dropping on failure

### Low Priority
8. **Telemetry**: No metrics tracking for provisioning success/failure rates
9. **Time Estimates**: No estimated time remaining for provisioning steps
10. **Admin Dashboard**: No centralized view for monitoring all tenant provisioning

## Performance Considerations

- **Queue Processing**: Provisioning runs in background queue (don't block registration)
- **Database Creation**: ~1-2 seconds per tenant database
- **Migrations**: ~5-30 seconds depending on number of modules
- **Module Sync**: ~1-3 seconds for hierarchy sync
- **Total Time**: Average 10-45 seconds for complete provisioning
- **Concurrent**: Can provision multiple tenants simultaneously (queue workers)

## Monitoring & Debugging

### Log Files
- `storage/logs/laravel.log`: Main application log
- All provisioning steps logged with tenant_id context
- Error stack traces logged on failure

### Database Queries (for debugging)
```sql
-- Find pending/failed tenants
SELECT id, name, subdomain, status, provisioning_step, created_at
FROM tenants
WHERE status IN ('pending', 'provisioning', 'failed')
ORDER BY created_at DESC;

-- Check tenant's plan and modules
SELECT t.name, t.subdomain, p.name as plan_name, m.code as module_code
FROM tenants t
LEFT JOIN plans p ON t.plan_id = p.id
LEFT JOIN plan_module pm ON p.id = pm.plan_id
LEFT JOIN modules m ON pm.module_id = m.id
WHERE t.id = 'tenant-uuid';

-- Find orphaned databases
SELECT SCHEMA_NAME
FROM INFORMATION_SCHEMA.SCHEMATA
WHERE SCHEMA_NAME LIKE 'tenant%'
AND SCHEMA_NAME NOT IN (SELECT CONCAT('tenant', REPLACE(id, '-', '')) FROM tenants);
```

## API Endpoints

### Registration Flow
- `POST /platform/register/account-type` - Store account type
- `POST /platform/register/details` - Store company details
- `POST /platform/register/verify-email/send` - Send email verification code
- `POST /platform/register/verify-email/verify` - Verify email code
- `POST /platform/register/verify-phone/send` - Send phone verification code
- `POST /platform/register/verify-phone/verify` - Verify phone code
- `POST /platform/register/plan` - Store plan selection
- `POST /platform/register/trial/activate` - Activate trial and dispatch provisioning

### Provisioning Status
- `GET /platform/register/provisioning/{tenant}` - Provisioning waiting room page
- `GET /api/tenants/{tenant}/provisioning-status` - Poll provisioning status (JSON)
- `POST /platform/register/provisioning/{tenant}/retry` - Retry failed provisioning

### Admin Setup (Tenant Domain)
- `GET /admin-setup` - Show admin setup form
- `POST /admin-setup` - Create admin user

## Conclusion

The tenant provisioning flow is a critical part of the SaaS platform. It involves multiple steps across different domains (platform and tenant), background job processing, database creation, migrations, and user setup. With the recent improvements, the flow is now more robust with better validation, verification, and error handling.
