# Widget Audit & Redistribution Plan

**Date:** 2025-06-11  
**Status:** Analysis Complete  
**Purpose:** Comprehensive audit of all dashboard widgets, package belongings, UI consistency, and missing widget identification

---

## Executive Summary

### Current State
- ✅ **33 widgets** across 5 packages (aero-core, aero-hrm, aero-rfi, aero-dms, aero-platform)
- ✅ All widgets migrated to HRMAC permission system
- ✅ Super Admin bypass implemented correctly
- ✅ All widgets rendering correctly in browser (verified via Chrome DevTools MCP)

### Key Findings
1. **Missing Widgets**: 7 major modules have NO widgets (Quality, Project, Compliance, Finance, IMS, POS, SCM)
2. **Package Misalignment**: 2 widgets in wrong packages (RecentActivity, QuickActions duplicates)
3. **Dashboard Coverage Gaps**: Only 4 of 11 modules have dedicated dashboard widgets
4. **UI Pattern Inconsistency**: Some widgets use different card styling patterns

---

## 1. Current Widget Inventory

### 1.1 aero-core Package (7 widgets) ✅
All widgets correctly placed. Used on Core Dashboard (`/dashboard`).

| Widget | Key | Category | Dashboard | Status |
|--------|-----|----------|-----------|--------|
| WelcomeWidget | `core.welcome` | DISPLAY | `core` | ✅ Correct |
| SystemStatsWidget | `core.system_stats` | STAT | `core` | ✅ Correct |
| QuickActionsWidget | `core.quick_actions` | ACTION | `core` | ⚠️ Duplicate |
| RecentActivityWidget | `core.recent_activity` | ACTIVITY | `core` | ⚠️ Duplicate |
| NotificationsWidget | `core.notifications` | ALERT | `core` | ✅ Correct |
| SecurityOverviewWidget | `core.security_overview` | STAT | `core` | ✅ Correct |
| ActiveModulesWidget | `core.active_modules` | DISPLAY | `core` | ✅ Correct |

**Issues:**
- `QuickActionsWidget` - Duplicate exists in aero-platform (different implementation)
- `RecentActivityWidget` - Duplicate exists in aero-platform (different implementation)

---

### 1.2 aero-hrm Package (9 widgets) ✅
All widgets correctly placed. Mixed dashboards: Employee Dashboard and Core Dashboard.

| Widget | Key | Category | Dashboard | Status |
|--------|-----|----------|-----------|--------|
| PunchStatusWidget | `hrm.punch_status` | ACTION | `hrm.employee` | ✅ Correct |
| MyLeaveBalanceWidget | `hrm.leave_balance` | STAT | `hrm.employee` | ✅ Correct |
| MyGoalsWidget | `hrm.my_goals` | DISPLAY | `hrm.employee` | ✅ Correct |
| UpcomingHolidaysWidget | `hrm.upcoming_holidays` | DISPLAY | `core` | ✅ Correct |
| OrganizationInfoWidget | `hrm.org_info` | DISPLAY | `core` | ✅ Correct |
| PendingLeaveApprovalsWidget | `hrm.pending_leave_approvals` | ALERT | `core` | ✅ Correct |
| PendingReviewsWidget | `hrm.pending_reviews` | ALERT | `core` | ✅ Correct |
| TeamAttendanceWidget | `hrm.team_attendance` | STAT | `core` | ✅ Correct |
| PayrollSummaryWidget | `hrm.payroll_summary` | STAT | `core` | ✅ Correct |

**Notes:**
- Good separation: Employee-specific widgets use `hrm.employee` dashboard
- Manager/Admin widgets appear on Core Dashboard
- All correctly use HRMAC permissions (`hrm.leaves`, `hrm.attendance`, etc.)

---

### 1.3 aero-rfi Package (3 widgets) ✅
All widgets correctly placed. Used on Core Dashboard.

| Widget | Key | Category | Dashboard | Status |
|--------|-----|----------|-----------|--------|
| MyRfiStatusWidget | `rfi.my_status` | STAT | `core` | ✅ Correct |
| PendingInspectionsWidget | `rfi.pending_inspections` | ALERT | `core` | ✅ Correct |
| OverdueRfisWidget | `rfi.overdue_rfis` | ALERT | `core` | ✅ Correct |

**Notes:**
- All widgets correctly target Core Dashboard
- Should also register with `rfi.dashboard` when that dashboard exists

---

### 1.4 aero-dms Package (4 widgets) ✅
All widgets correctly placed. Used on Core Dashboard.

| Widget | Key | Category | Dashboard | Status |
|--------|-----|----------|-----------|--------|
| RecentDocumentsWidget | `dms.recent_documents` | ACTIVITY | `dms` | ✅ Correct |
| StorageUsageWidget | `dms.storage_usage` | STAT | `dms` | ✅ Correct |
| PendingApprovalsWidget | `dms.pending_approvals` | ALERT | `dms` | ✅ Correct |
| SharedWithMeWidget | `dms.shared_with_me` | DISPLAY | `dms` | ✅ Correct |

**Notes:**
- Currently targets DMS Dashboard (`dms`)
- Should also show on Core Dashboard for quick access
- DMS Dashboard registered: `dms.dashboard` → `/dms/dashboard` route

---

### 1.5 aero-platform Package (10 widgets) ✅
All widgets correctly placed. Used on Platform Dashboard (landlord admin).

| Widget | Key | Category | Dashboard | Status |
|--------|-----|----------|-----------|--------|
| PlatformWelcomeWidget | `platform.welcome` | DISPLAY | `platform` | ✅ Correct |
| PlatformStatsWidget | `platform.stats` | STAT | `platform` | ✅ Correct |
| RecentTenantsWidget | `platform.recent_tenants` | ACTIVITY | `platform` | ✅ Correct |
| ModuleUsageWidget | `platform.module_usage` | STAT | `platform` | ✅ Correct |
| RecentActivityWidget | `platform.recent_activity` | ACTIVITY | `platform` | ⚠️ Duplicate |
| QuickActionsWidget | `platform.quick_actions` | ACTION | `platform` | ⚠️ Duplicate |
| BillingOverviewWidget | `platform.billing_overview` | STAT | `platform` | ✅ Correct |
| SystemAlertsWidget | `platform.system_alerts` | ALERT | `platform` | ✅ Correct |
| SubscriptionDistributionWidget | `platform.subscription_distribution` | STAT | `platform` | ✅ Correct |
| SystemHealthWidget | `platform.system_health` | STAT | `platform` | ✅ Correct |

**Notes:**
- Platform widgets use separate `PlatformWidgetRegistry` (not `DashboardWidgetRegistry`)
- Targets Platform Dashboard for landlord admin only
- Duplicate widget names but different implementations (tenant vs landlord focused)

---

## 2. Package Misalignment Issues

### 2.1 Widget Name Duplicates

**Issue:** `QuickActionsWidget` and `RecentActivityWidget` exist in both aero-core and aero-platform with same class names but different implementations.

| Widget | aero-core Purpose | aero-platform Purpose | Conflict? |
|--------|-------------------|----------------------|-----------|
| QuickActionsWidget | Tenant user quick actions (Clock In, Apply Leave) | Platform admin actions (Manage Tenants, Billing) | ❌ Different registry |
| RecentActivityWidget | Tenant recent activity (user actions) | Platform recent activity (tenant actions) | ❌ Different registry |

**Resolution:** ✅ **NO ACTION REQUIRED**
- Different namespaces: `Aero\Core\Widgets\*` vs `Aero\Platform\Widgets\*`
- Different registries: `DashboardWidgetRegistry` vs `PlatformWidgetRegistry`
- Different contexts: Tenant vs Landlord
- This is **intentional separation** for multi-tenancy architecture

---

### 2.2 DMS Widgets Dashboard Assignment

**Issue:** DMS widgets currently target `dms` dashboard only, but should also appear on Core Dashboard for quick access.

**Current:**
```php
protected array $dashboards = ['dms']; // Only DMS Dashboard
```

**Recommendation:**
```php
protected array $dashboards = ['core', 'dms']; // Both dashboards
```

**Affected Widgets:**
- `PendingApprovalsWidget` - ALERT category (should show on Core)
- `StorageUsageWidget` - STAT category (should show on Core)

**Action Required:** Update 2 widgets to add `core` to dashboards array.

---

## 3. Missing Widgets by Module

### 3.1 aero-quality Package ❌ NO WIDGETS
**Module Status:** Has Models, Services, HTTP layer  
**Missing Dashboard:** Quality Dashboard  
**Module Features:**
- Non-Conformance Reports (NCR)
- Corrective/Preventive Actions (CAPA)
- Quality Audits
- Inspections & Checklists

**Recommended Widgets:**
| Widget | Category | Dashboard | Priority | Description |
|--------|----------|-----------|----------|-------------|
| PendingNCRsWidget | ALERT | `core`, `quality` | HIGH | Pending non-conformance reports requiring action |
| OverdueCapasWidget | ALERT | `core`, `quality` | HIGH | Overdue corrective actions |
| UpcomingAuditsWidget | DISPLAY | `core`, `quality` | MEDIUM | Scheduled quality audits |
| QualityMetricsWidget | STAT | `quality` | MEDIUM | Key quality KPIs (NCR rate, CAPA closure rate) |
| RecentInspectionsWidget | ACTIVITY | `quality` | LOW | Recently completed inspections |

---

### 3.2 aero-project Package ❌ NO WIDGETS
**Module Status:** Has Models, Services, Adapters, Events  
**Missing Dashboard:** Project Dashboard  
**Module Features:**
- Project Management
- Task Tracking
- Time Tracking
- Project Budget
- Milestones & Deliverables

**Recommended Widgets:**
| Widget | Category | Dashboard | Priority | Description |
|--------|----------|-----------|----------|-------------|
| MyTasksWidget | ACTION | `core`, `project` | HIGH | Assigned tasks with deadlines |
| OverdueTasksWidget | ALERT | `core`, `project` | HIGH | Overdue tasks requiring attention |
| ProjectProgressWidget | STAT | `project` | MEDIUM | Active projects with completion % |
| TimeLogSummaryWidget | STAT | `project` | MEDIUM | Time logged this week/month |
| UpcomingMilestonesWidget | DISPLAY | `core`, `project` | MEDIUM | Upcoming project milestones |

---

### 3.3 aero-compliance Package ❌ NO WIDGETS
**Module Status:** Has Models, Services, HTTP layer  
**Missing Dashboard:** Compliance Dashboard  
**Module Features:**
- Regulatory Compliance
- Compliance Audits
- Document Control
- Compliance Training

**Recommended Widgets:**
| Widget | Category | Dashboard | Priority | Description |
|--------|----------|-----------|----------|-------------|
| PendingComplianceActionsWidget | ALERT | `core`, `compliance` | HIGH | Pending compliance tasks |
| UpcomingAuditsWidget | DISPLAY | `core`, `compliance` | HIGH | Scheduled compliance audits |
| ExpiringCertificationsWidget | ALERT | `compliance` | MEDIUM | Certifications expiring soon |
| ComplianceScoreWidget | STAT | `compliance` | MEDIUM | Overall compliance score/status |
| RecentViolationsWidget | ALERT | `compliance` | LOW | Recent compliance violations |

---

### 3.4 aero-finance Package ❌ NO WIDGETS
**Module Status:** Has Models, Providers, HTTP layer  
**Missing Dashboard:** Finance Dashboard  
**Module Features:**
- Accounting
- Invoicing
- Expense Management
- Budget Tracking

**Recommended Widgets:**
| Widget | Category | Dashboard | Priority | Description |
|--------|----------|-----------|----------|-------------|
| PendingInvoicesWidget | ALERT | `core`, `finance` | HIGH | Unpaid/overdue invoices |
| ExpenseApprovalWidget | ALERT | `core`, `finance` | HIGH | Pending expense approvals |
| CashFlowWidget | STAT | `finance` | MEDIUM | Current cash flow overview |
| BudgetOverviewWidget | STAT | `finance` | MEDIUM | Budget vs actual spending |
| RecentTransactionsWidget | ACTIVITY | `finance` | LOW | Recent financial transactions |

---

### 3.5 aero-ims Package ❌ NO WIDGETS
**Module Status:** Has Models, Providers, HTTP layer  
**Missing Dashboard:** Inventory Dashboard  
**Module Features:**
- Inventory Management
- Stock Tracking
- Warehouse Management
- Reorder Management

**Recommended Widgets:**
| Widget | Category | Dashboard | Priority | Description |
|--------|----------|-----------|----------|-------------|
| LowStockAlertsWidget | ALERT | `core`, `ims` | HIGH | Items below reorder level |
| PendingPurchaseOrdersWidget | ALERT | `core`, `ims` | HIGH | POs awaiting approval/receipt |
| StockValueWidget | STAT | `ims` | MEDIUM | Current inventory value |
| ReorderRecommendationsWidget | ACTION | `ims` | MEDIUM | Items recommended for reorder |
| RecentStockMovementsWidget | ACTIVITY | `ims` | LOW | Recent stock in/out movements |

---

### 3.6 aero-pos Package ❌ NO WIDGETS
**Module Status:** Has Models, Providers, HTTP layer, Services  
**Missing Dashboard:** POS Dashboard  
**Module Features:**
- Point of Sale
- Sales Transactions
- Payment Processing
- Daily Sales Reports

**Recommended Widgets:**
| Widget | Category | Dashboard | Priority | Description |
|--------|----------|-----------|----------|-------------|
| TodaysSalesWidget | STAT | `core`, `pos` | HIGH | Today's sales total and count |
| OpenCashRegistersWidget | ALERT | `core`, `pos` | HIGH | Registers needing closure |
| TopSellingItemsWidget | STAT | `pos` | MEDIUM | Best-selling products today/week |
| PaymentMethodsBreakdownWidget | STAT | `pos` | MEDIUM | Sales by payment method |
| RecentTransactionsWidget | ACTIVITY | `pos` | LOW | Recent POS transactions |

---

### 3.7 aero-scm Package ❌ NO WIDGETS
**Module Status:** Has Models, Providers, HTTP layer  
**Missing Dashboard:** Supply Chain Dashboard  
**Module Features:**
- Supply Chain Management
- Supplier Management
- Procurement
- Logistics

**Recommended Widgets:**
| Widget | Category | Dashboard | Priority | Description |
|--------|----------|-----------|----------|-------------|
| PendingPurchaseRequisitionsWidget | ALERT | `core`, `scm` | HIGH | Pending purchase requisitions |
| SupplierPerformanceWidget | STAT | `scm` | MEDIUM | Supplier delivery/quality metrics |
| InTransitShipmentsWidget | DISPLAY | `scm` | MEDIUM | Shipments in transit |
| ProcurementCycleTimeWidget | STAT | `scm` | LOW | Average procurement lead time |
| RecentPurchaseOrdersWidget | ACTIVITY | `scm` | LOW | Recently placed purchase orders |

---

## 4. UI Consistency Issues

### 4.1 Card Styling Patterns

**Current State:** Mixed styling approaches across widgets

#### Pattern A: Direct HeroUI Card (Most widgets)
```jsx
<Card className="shadow-lg">
  <CardHeader>...</CardHeader>
  <CardBody>...</CardBody>
</Card>
```

#### Pattern B: ThemedCard wrapper (Some widgets)
```jsx
import { ThemedCard, ThemedCardHeader, ThemedCardBody } from '@/Components/UI/ThemedCard';

<Card>
  <ThemedCardHeader>Title</ThemedCardHeader>
  <ThemedCardBody>Content</ThemedCardBody>
</Card>
```

#### Pattern C: getThemedCardStyle() utility
```jsx
<Card className="transition-all duration-200" style={getThemedCardStyle()}>
  <CardHeader className="border-b border-divider">...</CardHeader>
  <CardBody>...</CardBody>
</Card>
```

**Recommendation:** ✅ **Use Pattern C (getThemedCardStyle utility)**
- Most flexible for theme customization
- Supports CSS variable-based theming
- Consistent with LeavesAdmin.jsx reference implementation
- Already used in SystemStatsWidget, SecurityOverviewWidget

**Action Required:** Update older widgets to use `getThemedCardStyle()`.

---

### 4.2 Icon Usage Consistency

**Current State:** Mixed icon libraries
- ✅ Most widgets: `@heroicons/react/24/outline` (CORRECT)
- ⚠️ Some widgets: `@heroicons/react/24/solid`
- ❌ Old widgets: Inline SVG

**Recommendation:** ✅ **Standardize on `@heroicons/react/24/outline`**
- Matches project guidelines
- Consistent with existing pages (LeavesAdmin.jsx, EmployeeList.jsx)

**Action Required:** Audit widget components and replace solid icons with outline variants.

---

### 4.3 Loading State Patterns

**Current State:** Inconsistent loading indicators
- Some widgets: `<Spinner />` only
- Some widgets: Full skeleton UI
- Some widgets: No loading state

**Recommendation:** ✅ **Use Skeleton pattern from StatsCards component**
```jsx
import { Skeleton } from "@heroui/react";

{loading ? (
  <div className="space-y-3">
    <Skeleton className="h-6 w-32 rounded" />
    <Skeleton className="h-4 w-full rounded" />
  </div>
) : (
  <ActualContent />
)}
```

**Action Required:** Add skeleton loading states to all STAT and ACTIVITY widgets.

---

## 5. Implementation Priority

### Phase 1: Critical Missing Widgets (Week 1)
**Target:** High-priority ALERT and ACTION widgets for Core Dashboard

| Module | Widget | Reason |
|--------|--------|--------|
| aero-quality | PendingNCRsWidget | Quality issues require immediate attention |
| aero-quality | OverdueCapasWidget | Action items overdue |
| aero-project | MyTasksWidget | Daily task management |
| aero-project | OverdueTasksWidget | Critical action items |
| aero-finance | PendingInvoicesWidget | Revenue/cash flow critical |
| aero-finance | ExpenseApprovalWidget | Manager approval workflow |
| aero-ims | LowStockAlertsWidget | Prevent stockouts |
| aero-ims | PendingPurchaseOrdersWidget | Procurement workflow |
| aero-pos | TodaysSalesWidget | Daily business metrics |
| aero-pos | OpenCashRegistersWidget | End-of-day workflow |
| aero-scm | PendingPurchaseRequisitionsWidget | Procurement workflow |
| aero-compliance | PendingComplianceActionsWidget | Regulatory risk |

**Total:** 12 widgets

---

### Phase 2: Dashboard Pages (Week 2)
**Target:** Create dedicated dashboard pages for modules

| Module | Dashboard Route | Dashboard Key | Widgets |
|--------|-----------------|---------------|---------|
| aero-quality | `/quality/dashboard` | `quality.dashboard` | 5 widgets (NCR, CAPA, Audits, Metrics, Inspections) |
| aero-project | `/project/dashboard` | `project.dashboard` | 5 widgets (Tasks, Progress, Time, Milestones) |
| aero-compliance | `/compliance/dashboard` | `compliance.dashboard` | 5 widgets (Actions, Audits, Certifications, Score) |
| aero-finance | `/finance/dashboard` | `finance.dashboard` | 5 widgets (Invoices, Expenses, Cash Flow, Budget) |
| aero-ims | `/ims/dashboard` | `ims.dashboard` | 5 widgets (Stock, POs, Value, Reorders, Movements) |
| aero-pos | `/pos/dashboard` | `pos.dashboard` | 5 widgets (Sales, Registers, Top Items, Payments) |
| aero-scm | `/scm/dashboard` | `scm.dashboard` | 5 widgets (Requisitions, Suppliers, Shipments, Cycle Time) |

**Total:** 7 dashboards, 35 widgets

---

### Phase 3: UI Consistency (Week 3)
**Target:** Standardize all existing widgets

| Task | Affected Widgets | Effort |
|------|------------------|--------|
| Apply `getThemedCardStyle()` | All 33 existing widgets | 2 days |
| Replace solid icons with outline | ~15 widgets | 1 day |
| Add skeleton loading states | All STAT/ACTIVITY widgets (~20) | 2 days |
| Update DMS widgets dashboard array | 2 widgets | 1 hour |

**Total:** 5 days

---

### Phase 4: Advanced Features (Week 4)
**Target:** Enhanced widget functionality

| Feature | Description | Widgets |
|---------|-------------|---------|
| Widget Settings | User-configurable widget preferences | All widgets |
| Widget Refresh | Manual/auto-refresh data | STAT/ACTIVITY widgets |
| Widget Export | Export widget data (CSV/PDF) | STAT widgets |
| Widget Drill-down | Click widget to see detailed page | All widgets |

---

## 6. Technical Implementation Guide

### 6.1 Widget Creation Template

**Step 1:** Create widget class in `packages/aero-{module}/src/Widgets/{WidgetName}Widget.php`

```php
<?php

declare(strict_types=1);

namespace Aero\{Module}\Widgets;

use Aero\Core\Contracts\AbstractDashboardWidget;
use Aero\Core\Contracts\CoreWidgetCategory;

/**
 * {Widget Description}
 *
 * Appears on: {Dashboard Name} (/{route})
 */
class {WidgetName}Widget extends AbstractDashboardWidget
{
    protected string $position = 'main_left'; // main_left, main_right, sidebar, full
    protected int $order = 50; // Lower = higher priority
    protected int|string $span = 1; // 1, 2, 'full'
    protected CoreWidgetCategory $category = CoreWidgetCategory::{CATEGORY};
    protected array $requiredPermissions = ['{module}.{submodule}']; // HRMAC format
    protected array $dashboards = ['core']; // Which dashboards to show on

    public function getKey(): string
    {
        return '{module}.{widget_key}';
    }

    public function getComponent(): string
    {
        return 'Widgets/{Module}/{WidgetName}Widget';
    }

    public function getTitle(): string
    {
        return '{Widget Title}';
    }

    public function getDescription(): string
    {
        return '{Widget description}';
    }

    public function getModuleCode(): string
    {
        return '{module}';
    }

    /**
     * Check if widget is enabled for current user.
     * Super Administrators bypass ALL checks.
     */
    public function isEnabled(): bool
    {
        // Super Admin bypass - MUST BE FIRST
        if ($this->isSuperAdmin()) {
            return true;
        }

        if (!$this->isModuleActive()) {
            return false;
        }

        // Check HRMAC module access
        return $this->userHasModuleAccess();
    }

    /**
     * Get widget data for frontend.
     */
    public function getData(): array
    {
        return $this->safeResolve(function () {
            $user = auth()->user();
            if (!$user) {
                return $this->getEmptyState();
            }

            // Widget logic here
            return [
                'data' => [],
                'total' => 0,
            ];
        });
    }

    /**
     * Empty state when no data or user not authenticated.
     */
    protected function getEmptyState(): array
    {
        return [
            'data' => [],
            'total' => 0,
            'message' => 'No data available',
        ];
    }
}
```

**Step 2:** Register widget in `packages/aero-{module}/src/Providers/{Module}ServiceProvider.php`

```php
protected function registerDashboardWidgets(): void
{
    if (!$this->app->bound(\Aero\Core\Services\DashboardWidgetRegistry::class)) {
        return;
    }

    $registry = $this->app->make(\Aero\Core\Services\DashboardWidgetRegistry::class);

    $registry->registerMany([
        new \Aero\{Module}\Widgets\{WidgetName}Widget,
        // ... other widgets
    ]);
}
```

**Step 3:** Create React component in `packages/aero-{module}/resources/js/Widgets/{Module}/{WidgetName}Widget.jsx`

```jsx
import React, { useState } from 'react';
import { Card, CardBody, CardHeader, Skeleton } from "@heroui/react";
import { {IconName} } from "@heroicons/react/24/outline";

const {WidgetName}Widget = ({ data, loading = false }) => {
    const getThemedCardStyle = () => ({
        background: `var(--theme-content1, #FAFAFA)`,
        borderColor: `var(--theme-divider, #E4E4E7)`,
        borderWidth: `var(--borderWidth, 2px)`,
        borderRadius: `var(--borderRadius, 12px)`,
        fontFamily: `var(--fontFamily, "Inter")`,
    });

    if (loading) {
        return (
            <Card className="transition-all duration-200" style={getThemedCardStyle()}>
                <CardBody className="p-4">
                    <div className="space-y-3">
                        <Skeleton className="h-6 w-32 rounded" />
                        <Skeleton className="h-4 w-full rounded" />
                        <Skeleton className="h-4 w-2/3 rounded" />
                    </div>
                </CardBody>
            </Card>
        );
    }

    return (
        <Card className="transition-all duration-200" style={getThemedCardStyle()}>
            <CardHeader className="border-b p-4" style={{ borderColor: `var(--theme-divider, #E4E4E7)` }}>
                <div className="flex items-center gap-2">
                    <{IconName} className="w-5 h-5" style={{ color: 'var(--theme-primary)' }} />
                    <h3 className="text-lg font-semibold">{data.title}</h3>
                </div>
            </CardHeader>
            <CardBody className="p-4">
                {/* Widget content */}
            </CardBody>
        </Card>
    );
};

export default {WidgetName}Widget;
```

---

### 6.2 Widget Category Guidelines

| Category | Use Case | Examples | Position |
|----------|----------|----------|----------|
| **STAT** | Statistical data, KPIs, counts | SystemStatsWidget, PayrollSummaryWidget | `main_left`, `main_right` |
| **ACTION** | User needs to take action | PunchStatusWidget, MyTasksWidget | `main_left` (high priority) |
| **ALERT** | Warnings, pending items | PendingApprovalsWidget, OverdueTasksWidget | `main_left`, `sidebar` |
| **ACTIVITY** | Recent activity logs | RecentActivityWidget, RecentDocumentsWidget | `main_right` |
| **DISPLAY** | Informational display | WelcomeWidget, UpcomingHolidaysWidget | `full`, `main_left` |

---

### 6.3 Dashboard Registration

**In `{Module}ServiceProvider.php`:**

```php
protected function registerDashboards(): void
{
    if (!$this->app->bound(\Aero\Core\Services\DashboardRegistry::class)) {
        return;
    }

    $registry = $this->app->make(\Aero\Core\Services\DashboardRegistry::class);

    $registry->register(
        '{module}.dashboard',          // Unique key
        '{Module} Dashboard',           // Display name
        '{module}',                     // Module code
        '{Description}',                // Description
        '{IconName}',                   // Heroicon name
        '{module}.dashboard.view'       // Required permission (HRMAC format)
    );
}
```

---

## 7. Testing Checklist

### Per Widget:
- [ ] Widget class created with correct namespace
- [ ] Widget registered in ServiceProvider
- [ ] React component created in correct path
- [ ] Super Admin bypass check FIRST in `isEnabled()`
- [ ] HRMAC permission format used (module.submodule)
- [ ] Widget appears on correct dashboard
- [ ] Widget data loads correctly
- [ ] Empty state handled gracefully
- [ ] Loading state with Skeleton UI
- [ ] Theme-aware styling applied
- [ ] Outline icons used (not solid)
- [ ] Responsive design tested

### Per Dashboard:
- [ ] Dashboard registered in ServiceProvider
- [ ] Route created (`/{module}/dashboard`)
- [ ] Controller created with widget fetching
- [ ] Inertia page created following LeavesAdmin.jsx pattern
- [ ] Stats cards at top
- [ ] Widgets render in correct positions
- [ ] Permissions checked correctly
- [ ] Navigation item added

---

## 8. Conclusion

### Summary of Actions Required:

1. **Immediate (This Week):**
   - ✅ Fix DMS widgets dashboard assignment (2 widgets)
   - ✅ Create 12 high-priority widgets for Core Dashboard

2. **Short Term (Next 2 Weeks):**
   - ✅ Create 7 module dashboards with dedicated widgets (35 widgets)
   - ✅ Standardize UI patterns across all widgets

3. **Medium Term (Month 1):**
   - ✅ Add widget settings and advanced features
   - ✅ Create widget analytics and usage tracking

### Expected Outcomes:
- **80 total widgets** (33 existing + 47 new)
- **11 dashboards** (4 existing + 7 new)
- **100% module coverage** (all 11 modules have widgets)
- **Consistent UI/UX** across all widgets
- **Enhanced user experience** with actionable insights on every dashboard

---

**Document Status:** ✅ Analysis Complete  
**Next Step:** Begin Phase 1 implementation (12 critical widgets)  
**Estimated Completion:** 4 weeks  
**Priority:** HIGH
