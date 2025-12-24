# Tenant, Plan, Subscription & Quota Management - Comprehensive Analysis

**Date:** December 24, 2025  
**Status:** Analysis Complete  
**Project:** Aero Enterprise Suite SaaS

---

## Executive Summary

The Aero Enterprise Suite has a **solid foundation** for multi-tenant SaaS management with well-structured models, controllers, and services. However, several areas need enhancement to provide a complete, production-ready tenant management system.

**Overall Assessment:** 70% Complete - Core infrastructure exists, needs UI/UX polish and workflow automation.

---

## 1. Current Implementation Review

### 1.1 Database Schema & Models ✅ EXCELLENT

#### **Tenant Model** (`packages/aero-platform/src/Models/Tenant.php`)
- **Status:** ✅ Well Implemented (623 lines)
- **Features:**
  - UUID-based primary key for security
  - Soft deletes with retention period support
  - Multi-status lifecycle: pending, provisioning, active, failed, suspended, archived
  - Trial period management (`trial_ends_at`)
  - Plan relationship (`plan_id`)
  - Stripe Cashier integration (Billable trait)
  - Domain management (HasDomains trait)
  - Maintenance mode toggle
  - Admin & company verification columns
  - Registration step tracking for incomplete registrations
  - Provisioning step tracking (creating_db, migrating, seeding, creating_admin)

**Relationships:**
```php
- belongsTo(Plan::class)
- hasMany(Subscription::class)
- hasOne(Subscription::class) as currentSubscription
- hasMany(Domain::class)
- hasOne(TenantBillingAddress::class)
```

**Key Methods:**
- `isActive()`, `isOnTrial()`, `hasTrialExpired()`
- `activate()`, `suspend()`, `enableMaintenance()`
- `hasActiveSubscription($moduleName)` - Core access control
- `startProvisioning()`, `markProvisioningFailed()`
- Stripe integration: `stripeEmail()`, `stripeName()`, `stripeAddress()`

#### **Plan Model** (`packages/aero-platform/src/Models/Plan.php`)
- **Status:** ✅ Well Implemented (220 lines)
- **Features:**
  - UUID primary key
  - Dual pricing: `monthly_price` + `yearly_price` (DECIMAL for precision)
  - Trial days configuration
  - Soft deletes
  - Feature list (JSON)
  - Limits (JSON): max_users, max_storage_gb, etc.
  - Sort order for UI display
  - Active/Featured flags
  - Stripe integration: `stripe_monthly_price_id`, `stripe_yearly_price_id`, `stripe_product_id`
  - Module codes array for plan-module mapping

**Relationships:**
```php
- hasMany(Subscription::class)
- hasManyThrough(Tenant::class, Subscription::class)
- belongsToMany(Module::class, 'plan_module') with pivot limits & is_enabled
```

**Key Methods:**
- `hasUnlimitedUsers()`
- `getEffectivePrice()` - Returns price based on duration
- `getMonthlyEquivalent()` - Calculates monthly rate for yearly plans
- Scopes: `active()`, `featured()`, `monthly()`, `yearly()`, `ordered()`

#### **Subscription Model** (`packages/aero-platform/src/Models/Subscription.php`)
- **Status:** ✅ Well Implemented (253 lines)
- **Features:**
  - UUID primary key
  - Tenant & Plan relationships
  - Status tracking: active, cancelled, past_due, trialing, expired
  - Billing cycle: monthly, yearly
  - Amount & discount tracking (DECIMAL)
  - Trial period: `trial_starts_at`, `trial_ends_at`
  - Subscription period: `starts_at`, `ends_at`
  - Cancellation tracking with reason
  - Payment method & external reference ID
  - Metadata (JSON) for extensibility
  - Soft deletes

**Key Methods:**
- `isActive()`, `isTrialing()`, `isExpired()`, `isCancelled()`, `isPastDue()`
- `daysRemaining()` - Calculates days left
- `cancel($reason)` - Cancel subscription
- `renew()` - Renew for another billing cycle
- Scopes: `active()`, `trialing()`, `cancelled()`, `expired()`, `billingCycle()`

#### **UsageRecord Model** (`packages/aero-platform/src/Models/UsageRecord.php`)
- **Status:** ✅ Implemented (113 lines)
- **Features:**
  - Tracks metered usage per tenant/subscription
  - Metric tracking: metric_name, metric_type, quantity, unit
  - Billing period tracking
  - Stripe reporting integration
  - Polymorphic attributable relationship (track what generated usage)
  - Metadata for additional context

**Use Cases:**
- API call metering
- Storage usage tracking
- Per-seat billing
- Feature usage analytics
- Billing automation

---

### 1.2 Backend Controllers ✅ GOOD

#### **TenantController** (`packages/aero-platform/src/Http/Controllers/TenantController.php`)
- **Status:** ✅ Well Implemented (397 lines)
- **Endpoints:**
  - `GET /api/v1/tenants` - Paginated list with search & filters
  - `GET /api/v1/tenants/stats` - Dashboard statistics
  - `GET /api/v1/tenants/{tenant}` - Single tenant details
  - `POST /api/v1/tenants` - Create tenant (admin-initiated)
  - `PUT /api/v1/tenants/{tenant}` - Update tenant
  - `DELETE /api/v1/tenants/{tenant}` - Archive tenant (soft delete with retention)
  - `POST /api/v1/tenants/{tenant}/restore` - Restore archived tenant
  - `POST /api/v1/tenants/{tenant}/purge` - Permanently delete (after retention)
  - `POST /api/v1/tenants/{tenant}/suspend` - Suspend tenant
  - `POST /api/v1/tenants/{tenant}/activate` - Activate tenant
  - `GET /api/v1/tenants/check-subdomain` - Check subdomain availability

**Features:**
- Integration with `TenantProvisioner` for async provisioning
- Retention period management with `TenantRetentionService`
- Soft delete with restoration window
- Status lifecycle management
- Subdomain validation and reservation checks

#### **PlanController** (`packages/aero-platform/src/Http/Controllers/PlanController.php`)
- **Status:** ✅ Implemented (196 lines)
- **Endpoints:**
  - `GET /api/plans` - Admin: All plans with modules
  - `GET /api/plans/public` - Public: Active plans for registration
  - `GET /api/plans/{plan}` - Single plan details
  - `POST /api/plans` - Create plan
  - `PUT /api/plans/{plan}` - Update plan
  - `DELETE /api/plans/{plan}` - Delete plan (checks for active tenants)

**Features:**
- JSON feature & limit serialization
- Module relationship loading
- Active tenant validation before deletion
- Public vs admin endpoints

#### **BillingController** (`packages/aero-platform/src/Http/Controllers/Billing/BillingController.php`)
- **Status:** ✅ Well Implemented (partial view, estimated 400+ lines)
- **Endpoints:**
  - `GET /admin/billing/tenants/{tenant}` - Tenant billing dashboard
  - `POST /admin/checkout/{plan}` - Stripe Checkout session
  - `POST /admin/billing/tenants/{tenant}/subscribe/{plan}` - Direct subscription
  - `POST /admin/billing/tenants/{tenant}/change-plan` - Plan upgrade/downgrade
  - `POST /admin/billing/tenants/{tenant}/cancel` - Cancel subscription
  - `POST /admin/billing/tenants/{tenant}/resume` - Resume subscription
  - `POST /admin/billing/tenants/{tenant}/portal` - Stripe Customer Portal
  - `GET /admin/billing/tenants/{tenant}/invoices` - Invoice list
  - `GET /admin/billing/tenants/{tenant}/invoices/{invoice}` - Download invoice
  - `PUT /admin/billing/tenants/{tenant}/billing-address` - Update billing address

**Features:**
- Laravel Cashier integration
- Stripe Checkout flow
- Invoice management
- Payment method handling
- Trial period management
- Metadata tracking

---

### 1.3 Services Layer ✅ EXCELLENT

#### **QuotaEnforcementService** (`packages/aero-platform/src/Services/Quotas/QuotaEnforcementService.php`)
- **Status:** ✅ Comprehensive (458 lines)
- **Features:**
  - **Default Quotas per Plan Tier:**
    - Free: 5 users, 1GB storage, 10K API calls/month
    - Starter: 25 users, 10GB storage, 100K API calls/month
    - Professional: 100 users, 50GB storage, 500K API calls/month
    - Enterprise: Unlimited (-1)
  
  - **Quota Types Tracked:**
    - `users`, `employees`, `projects`, `customers`, `rfis`
    - `storage_gb` - File storage tracking
    - `api_calls_monthly` - API rate limiting
  
  - **Key Methods:**
    - `canCreate($tenant, $quotaType)` - Check before creation
    - `canUseStorage($tenant, $additionalBytes)` - Storage validation
    - `canMakeApiCall($tenant)` - API quota check
    - `incrementApiCalls($tenant)` - Track API usage
    - `getQuotaLimit($tenant, $quotaType)` - Get effective limit
    - `getCurrentUsage($tenant, $quotaType)` - Get current usage
    - `getQuotaSummary($tenant)` - Full quota overview
    - `isApproachingLimit($tenant, $quotaType)` - 80% threshold alert
    - `getTenantsNearingQuotas()` - Platform-wide quota monitoring
    - `setCustomQuota($tenant, $quotaType, $limit)` - Override plan limits
    - `recordUsage($tenant, $quotaType, $action, $amount)` - Audit logging
  
  - **Caching:**
    - 5-minute TTL on usage checks
    - Uses `TenantCache` for isolation
    - Cache invalidation on updates

**Hierarchy of Quota Resolution:**
1. Tenant custom quota (metadata override)
2. Plan metadata custom quota
3. Default quotas by plan code
4. Fallback to 'free' tier defaults

---

### 1.4 Frontend UI ⚠️ PARTIAL

#### **Admin - Tenants List** (`packages/aero-ui/resources/js/Pages/Platform/Admin/Tenants/Index.jsx`)
- **Status:** ✅ Well Implemented (estimated 400+ lines)
- **Features:**
  - Paginated tenant list with search
  - Stats cards (total, active, pending, suspended, archived, on_trial, new_this_month)
  - Action dropdowns (view, edit, suspend, activate, archive)
  - Mobile responsive
  - Skeleton loading states
  - Toast notifications with promise pattern

#### **Admin - Plans List** (`packages/aero-ui/resources/js/Pages/Platform/Admin/Plans/Index.jsx`)
- **Status:** ✅ Implemented (400+ lines)
- **Features:**
  - Plan catalog display
  - Stats cards (catalog plans, avg contract value, expansion rate, trial conversion)
  - Add-on module catalog (partial mockup)
  - Mobile responsive
  - Transforms database plans to display format

#### **Admin - Plans Create** (`packages/aero-ui/resources/js/Pages/Platform/Admin/Plans/Create.jsx`)
- **Status:** ⚠️ Stub (2704 bytes)
- **Needs:** Full plan creation form with:
  - Basic details (name, slug, description)
  - Pricing (monthly/yearly)
  - Trial configuration
  - Feature list editor
  - Limits configuration
  - Module selection
  - Stripe price ID configuration

#### **Admin - Billing Dashboard** (`packages/aero-ui/resources/js/Pages/Platform/Admin/Billing/Index.jsx`)
- **Status:** ✅ Implemented (11809 bytes)
- **Features:**
  - Billing overview
  - Revenue metrics
  - Subscription analytics

#### **Admin - Billing Subscriptions** (`packages/aero-ui/resources/js/Pages/Platform/Admin/Billing/Subscriptions.jsx`)
- **Status:** ✅ Implemented (6973 bytes)
- **Features:**
  - Subscription list with status
  - Tenant subscription management

#### **Admin - Billing Invoices** (`packages/aero-ui/resources/js/Pages/Platform/Admin/Billing/Invoices.jsx`)
- **Status:** ✅ Implemented (8724 bytes)
- **Features:**
  - Invoice list
  - Download functionality

---

### 1.5 Routes Configuration ✅ COMPREHENSIVE

**Admin Routes** (`packages/aero-platform/routes/admin.php`)
- **Status:** ✅ Well Organized (911 lines)

**Key Route Groups:**
```php
// 2. Tenant Management (tenants)
/admin/tenants - List, create, show, edit, domains, databases, impersonate

// 5. Subscriptions & Billing (subscriptions)
/admin/plans - List, create, modules management
/admin/billing - Subscriptions, invoices, tenant billing
/admin/billing/tenants/{tenant} - Per-tenant billing management

// API Routes
/api/v1/tenants - Full CRUD + stats + actions
/api/v1/plans - Full CRUD
```

**Module Access Control:**
- All routes protected by `module:` middleware
- Granular permissions: `module:subscriptions,plans,plan-list,create`
- Matches `config/modules.php` hierarchy

---

## 2. Gap Analysis & Recommendations

### 2.1 Missing Features 🔴

#### **1. Quota Dashboard (Admin & Tenant Views)**
**Status:** ❌ Missing Frontend UI  
**Backend:** ✅ Complete (`QuotaEnforcementService`)

**Needed:**
- Admin quota monitoring page
- Tenant-facing quota widget
- Visual indicators for tenants near limits
- Alert configuration interface

#### **2. Subscription Lifecycle Management**
**Status:** ⚠️ Partial (Create exists, upgrade/downgrade needs enhancement)

**Gaps:**
- No UI for plan comparison during upgrade
- Missing proration calculation display
- No downgrade impact preview
- No cancellation flow with retention offers

#### **3. Usage Tracking Integration**
**Status:** ⚠️ Models exist, need active tracking

**Gaps:**
- No automatic API call tracking middleware
- Storage usage not actively monitored
- No usage event hooks in resource creation

#### **4. Plan-Module Configuration UI**
**Status:** ⚠️ Backend routes exist, frontend stub needed

**Needed:**
- Module catalog with checkboxes
- Per-module limits configuration
- Bulk enable/disable

#### **5. Tenant Onboarding Flow**
**Status:** ⚠️ Registration step tracking exists, needs orchestration

**Needed:**
- Resume registration functionality
- Onboarding progress indicator
- Admin panel for pending registrations

---

### 2.2 Improvements Needed 🟡

1. **Quota Enforcement Hooks** - Automatic enforcement via model observers
2. **Plan Migration Tool** - Wizard for plan changes with impact analysis
3. **Custom Plan Builder** - Allow custom plans for enterprise clients
4. **Automated Dunning Management** - Payment failure retry logic
5. **Multi-Currency Support** - Currently USD only

---

## 3. Recommended Solution Architecture

### Phase 1: Complete Core Management UI (Priority: HIGH)

**Deliverables:**
1. Quota Management Dashboard
2. Enhanced Plan Management
3. Subscription Lifecycle Wizards

**New Pages:**
```
packages/aero-ui/resources/js/Pages/Platform/Admin/
├── Quotas/
│   ├── Index.jsx              # Admin quota monitoring
│   ├── TenantQuotaDetails.jsx # Per-tenant quota view
│   └── QuotaAlerts.jsx        # Alert configuration
├── Plans/
│   ├── Create.jsx             # ENHANCE: Full form
│   ├── ModuleAssignment.jsx   # Plan-module config
│   └── Compare.jsx            # Plan comparison
└── Subscriptions/
    ├── UpgradeWizard.jsx      # Upgrade flow
    ├── DowngradeWizard.jsx    # Downgrade flow
    └── CancellationFlow.jsx   # Cancellation with retention
```

### Phase 2: Automation & Monitoring (Priority: MEDIUM)

**Deliverables:**
1. Usage Tracking Automation
2. Onboarding Dashboard
3. Notification System

### Phase 3: Analytics & Reporting (Priority: LOW)

**Deliverables:**
1. Revenue Analytics
2. Usage Analytics
3. Tenant Health Scores

---

## 4. Wireframe Specifications

### 4.1 Admin Quota Monitoring Dashboard

**Route:** `/admin/quotas`

```
┌─────────────────────────────────────────────────────────────────┐
│ 📊 Quota Monitoring                                  [Export] [⚙]│
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐                │
│ │ 🟢 78%  │ │ 🟡 12%  │ │ 🔴 8%   │ │ ⚪ 2%   │                │
│ │ Healthy │ │ Warning │ │ Critical│ │ Over    │                │
│ │ Tenants │ │         │ │         │ │ Limit   │                │
│ └─────────┘ └─────────┘ └─────────┘ └─────────┘                │
│                                                                   │
│ [Search tenants...] [Filter: All Plans ▾] [Type: All Quotas ▾]│
│                                                                   │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Tenant          Plan    Users   Storage  API Calls  Status  │ │
│ ├─────────────────────────────────────────────────────────────┤ │
│ │ Acme Corp      Pro     █████░   45/50   ████████   🟢      │ │
│ │                         90%      9.2GB/  890K/1M   Healthy  │ │
│ │                                  10GB                        │ │
│ │                                                    [View]    │ │
│ └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### 4.2 Tenant Quota Widget (Dashboard)

```
┌───────────────────────────────────┐
│ 💼 Your Plan: Professional        │
│                      [Upgrade]    │
├───────────────────────────────────┤
│ Users                  90/100     │
│ ████████████████████░  90%        │
│                                   │
│ Storage             9.2GB/10GB    │
│ ████████████████████░  92%  ⚠️    │
│                                   │
│ API Calls         890K/1M         │
│ ████████████████████░  89%        │
│                                   │
│ [View Usage History]              │
└───────────────────────────────────┘
```

### 4.3 Plan Comparison Modal

```
┌─────────────────────────────────────────────────────────────────┐
│ Compare Plans                                           [✕ Close]│
├─────────────────────────────────────────────────────────────────┤
│         Current        →       Professional    →    Enterprise   │
│ ┌──────────────┐    ┌──────────────┐    ┌──────────────┐       │
│ │ ⭐ STARTER   │    │ 💎 PRO       │    │ 🏆 ENTERPRISE│       │
│ │ $29/month    │    │ $99/month    │    │ $299/month   │       │
│ │ ✓ 25 users   │    │ ✓ 100 users  │    │ ✓ Unlimited  │       │
│ │ ✓ 10GB       │    │ ✓ 50GB       │    │ ✓ Unlimited  │       │
│ │ [Current]    │    │ [Upgrade]    │    │ [Contact Us] │       │
│ └──────────────┘    └──────────────┘    └──────────────┘       │
└─────────────────────────────────────────────────────────────────┘
```

### 4.4 Subscription Cancellation Flow

```
Step 1: Tell us why
○ Too expensive
● Switching to another provider
○ Not using enough features

Step 2: Before you go...
💡 Stay and get 25% off next 3 months
[Accept Offer] or [Pause Subscription]

Step 3: Confirm Cancellation
⚠️ Access ends: Feb 28, 2026
☐ I understand data will be deleted
☐ I have exported my data
[Cancel Subscription]
```

### 4.5 Plan Creation Form

```
┌─────────────────────────────────────────────────────────────────┐
│ Create Plan                                    [Save Draft] [✕] │
├─────────────────────────────────────────────────────────────────┤
│ Basic Information                                                │
│ Name*            [Professional Plan_____________]                │
│ Slug*            [professional_________________]  Auto-gen      │
│                                                                   │
│ Pricing                                                          │
│ Monthly Price*   [$_99.00____]                                   │
│ Yearly Price     [$_990.00___]  (Save $198)                     │
│                                                                   │
│ Quotas & Limits                                                  │
│ Max Users        [100__]  ☐ Unlimited                           │
│ Max Storage      [50___] GB  ☐ Unlimited                        │
│                                                                   │
│ Included Modules                                                 │
│ ☑ HRM    ☑ CRM    ☑ Finance    ☑ Projects                      │
│                                                                   │
│                              [Cancel] [Save & Publish]          │
└─────────────────────────────────────────────────────────────────┘
```

---

## 5. Implementation Checklist

### Backend API Endpoints

```
✅ Already Implemented:
- GET/POST/PUT/DELETE /api/v1/tenants
- GET/POST/PUT/DELETE /api/plans
- POST /admin/billing/tenants/{tenant}/subscribe

❌ Need to Implement:
- GET    /api/v1/quotas/tenants
- GET    /api/v1/quotas/tenants/{tenant}
- POST   /api/v1/quotas/alerts
- GET    /api/v1/usage/records
- POST   /api/v1/subscriptions/{id}/pause
- GET    /api/v1/analytics/revenue
```

### Middleware & Observers

```
❌ Need to Implement:
- TrackApiUsage (middleware)
- UserObserver (quota enforcement)
- EmployeeObserver
- ProjectObserver
```

### Scheduled Jobs

```
❌ Need to Implement:
- MonitorStorageUsage (hourly)
- CheckQuotaLimits (daily)
- SendTrialExpiryReminders (daily)
- ProcessFailedPayments (daily)
```

---

## 6. Next Steps

1. **Review wireframes** with stakeholders
2. **Prioritize features** (Phase 1, 2, or 3 first?)
3. **Set timeline** (2-week sprints vs 6-week project)
4. **Assign resources** (developers needed)
5. **Define success metrics**

---

## Questions for Stakeholders

1. Which phase should we tackle first?
2. Do we need revenue analytics immediately?
3. Should quota enforcement block operations or just warn?
4. Email only notifications, or also Slack/SMS?
5. Should we offer retention discounts to prevent cancellations?
6. Do we need custom enterprise plans?
7. Multi-currency support needed beyond USD?

---

**End of Analysis**

**Prepared by:** AI Development Assistant  
**Date:** December 24, 2025  
**Version:** 1.0
