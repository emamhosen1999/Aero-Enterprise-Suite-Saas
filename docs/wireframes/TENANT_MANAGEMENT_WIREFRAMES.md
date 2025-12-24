# Wireframe Specifications for Tenant Management Enhancement

**Project:** Aero Enterprise Suite SaaS  
**Date:** December 24, 2025  
**Status:** Ready for Design Review

---

## Overview

This document provides detailed ASCII wireframe specifications for the tenant, plan, subscription, and quota management enhancements. These wireframes are based on the comprehensive analysis in `../analysis/TENANT_PLAN_SUBSCRIPTION_MANAGEMENT_ANALYSIS.md`.

All wireframes follow existing UI patterns from:
- `packages/aero-ui/resources/js/Pages/Platform/Admin/Tenants/Index.jsx`
- `packages/aero-ui/resources/js/Pages/Platform/Admin/Plans/Index.jsx`
- `packages/aero-ui/resources/js/Components/StatsCards.jsx`
- `packages/aero-ui/resources/js/Components/PageHeader.jsx`

---

## Table of Contents

1. [Admin Quota Monitoring Dashboard](#1-admin-quota-monitoring-dashboard)
2. [Tenant Quota Details Page](#2-tenant-quota-details-page)
3. [Tenant Quota Widget](#3-tenant-quota-widget-for-tenant-dashboard)
4. [Plan Comparison Modal](#4-plan-comparison-modal-upgrade-flow)
5. [Subscription Cancellation Flow](#5-subscription-cancellation-flow-3-step-wizard)
6. [Plan Creation Form](#6-plan-creation-form-admin)
7. [Set Custom Quota Modal](#7-set-custom-quota-modal-admin)
8. [Quota Alert Configuration](#8-quota-alert-configuration)

---

## 1. Admin Quota Monitoring Dashboard

**Route:** `/admin/quotas`  
**Access:** Admin users with `module:quotas` permission  
**Component:** Full page with App layout

### 1.1 Complete Layout

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Sidebar │ 📊 Quota Monitoring                        [Export CSV] [⚙ Settings]│
│         ├─────────────────────────────────────────────────────────────────────┤
│ Nav     │                                                                      │
│ Menu    │ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────┐  │
│         │ │  🟢 78%     │ │  🟡 12%     │ │  🔴 8%      │ │  ⚪ 2%   │  │
│ - Dashboard│ │  Healthy    │ │  Warning    │ │  Critical   │ │  Over    │  │
│ - Tenants  │ │  Tenants    │ │  (80-90%)   │ │  (>90%)     │ │  Limit   │  │
│ - Users    │ │  156 total  │ │  24 total   │ │  16 total   │ │  4 total │  │
│ - Plans    │ └──────────────┘ └──────────────┘ └──────────────┘ └──────────┘  │
│ - Billing  │                                                                    │
│ ▶ Quotas   │ ┌──────────────────────────────────────────────────────────────┐│
│ - Settings │ │ [🔍 Search tenants by name, subdomain, email...]           ││
│            │ │ [Filter: All Plans ▾] [Type: All Quotas ▾] [Status: All ▾] ││
│            │ │ [Date: Last 30 days ▾]                    [Clear Filters]   ││
│            │ └──────────────────────────────────────────────────────────────┘│
│            │                                                                    │
│            │ ┌──────────────────────────────────────────────────────────────┐│
│            │ │ Tenant │ Plan    │ Users    │ Storage │ API Calls│Status│  ││
│            │ ├──────────────────────────────────────────────────────────────┤│
│            │ │ Acme   │ Pro     │ █████░   │ █████░  │ ████████│ 🟢   │  ││
│            │ │ Corp   │         │ 45/50    │ 9.2GB/  │ 890K/1M │Health│  ││
│            │ │        │         │ 90%      │ 10GB    │ 89%     │[View]│  ││
│            │ │        │         │          │ 92%     │         │      │  ││
│            │ ├──────────────────────────────────────────────────────────────┤│
│            │ │ Tech   │ Starter │ ████░░░░ │ ███████░│ ████░░░░│ 🟡   │  ││
│            │ │ Start  │         │ 18/25    │ 7.8GB/  │ 82K/100K│Warn  │  ││
│            │ │        │         │ 72%      │ 10GB    │ 82%     │[View]│  ││
│            │ │        │         │          │ 78%     │         │      │  ││
│            │ └──────────────────────────────────────────────────────────────┘│
│            │                                                                    │
│            │ [< Previous]  Page 1 of 8 (200 tenants)  [Next >]                │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Features & Interactions

**Stats Cards:**
- Click to filter table by status
- Hover shows breakdown by plan tier
- Auto-refresh every 5 minutes
- Color scheme: 🟢 Green (<80%), 🟡 Yellow (80-90%), 🔴 Red (>90%), ⚪ Gray (≥100%)

**Filter Bar:**
- Plan Filter: Free, Starter, Professional, Enterprise, Custom
- Quota Type: Users, Storage, API Calls, Employees, Projects, All
- Status: Healthy, Warning, Critical, Over Limit
- Date Range: Today, Last 7/30/90 days, Custom
- Search: Real-time with 300ms debounce

**Table:**
- Progress bars for visual usage indication
- Sortable columns (click header)
- Row hover highlights entire row
- Click "View" opens tenant quota details modal
- Export visible rows to CSV

---

## 2. Tenant Quota Details Page

**Route:** `/admin/quotas/tenants/{tenant}`  
**Trigger:** Click "View" from quota table

```
┌─────────────────────────────────────────────────────────────────┐
│ ← Back to Quota Monitoring                                      │
│                                                                  │
│ 📊 Quota Details: Acme Corp                  [Set Custom Quota] │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│ ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│ │ Current Plan    │  │ Billing Cycle   │  │ Next Renewal    │ │
│ │ Professional    │  │ Monthly         │  │ Feb 1, 2026     │ │
│ │ $99/month       │  │ Since Jan 2024  │  │ (7 days)        │ │
│ └─────────────────┘  └─────────────────┘  └─────────────────┘ │
│                                                                  │
│ Current Usage                                                    │
│ ┌──────────────────────────────────────────────────────────────┐│
│ │ Users                                            45 / 50      ││
│ │ █████████████████████████████████████████████░░░░░  90%      ││
│ │ ⚠️ Approaching limit (80%+ usage)                            ││
│ │ Breakdown: 30 active, 10 invited, 5 inactive                 ││
│ │                                      [Add User] [View All]   ││
│ ├──────────────────────────────────────────────────────────────┤│
│ │ Storage                                      9.2GB / 10GB    ││
│ │ ███████████████████████████████████████████████░  92%        ││
│ │ ⚠️ Critical: Consider upgrading                              ││
│ │ Top consumers: Documents (4.2GB), Images (3.1GB)             ││
│ │                                [Analyze] [Clean Up]          ││
│ └──────────────────────────────────────────────────────────────┘│
│                                                                  │
│ Usage Trends (Last 30 Days)                                     │
│ ┌──────────────────────────────────────────────────────────────┐│
│ │ [Users] [Storage] [API Calls]                                ││
│ │     │                                                    ▲    ││
│ │ 50  │                                              ▲ ▲  █    ││
│ │ 40  │                                        ▲ █  █ █  █    ││
│ │ 30  │                          ▲ ▲ █  █ █  █ █  █ █  █    ││
│ │ 20  │               ▲ █  █ █  █ █ █  █ █  █ █  █ █  █    ││
│ │ 10  │  █ █  █ █ █  █ █  █ █  █ █ █  █ █  █ █  █ █  █    ││
│ │  0  └──────────────────────────────────────────────────────  ││
│ │     Jan 1         Jan 15                 Jan 30              ││
│ └──────────────────────────────────────────────────────────────┘│
│                                                                  │
│ Recommendations                                                  │
│ ┌──────────────────────────────────────────────────────────────┐│
│ │ 💡 This tenant is approaching multiple limits:               ││
│ │ 1. Users at 90% - Consider upgrading to Enterprise           ││
│ │ 2. Storage at 92% - Upgrade saves $18/month vs overage       ││
│ │         [Suggest Upgrade] [Configure Alerts] [Contact]       ││
│ └──────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

**Features:**
- Real-time usage display with color-coded progress bars
- 30-day trend line chart (users, storage, API calls)
- Intelligent recommendations based on usage patterns
- Quick actions: Add User, Analyze Storage, Clean Up
- Export usage report to PDF/CSV

---

## 3. Tenant Quota Widget (For Tenant Dashboard)

**Location:** Tenant Dashboard - Top Right Corner  
**Component:** Card widget

### Normal View (When quota warnings present)

```
┌───────────────────────────────────┐
│ 💼 Your Plan                      │
│ Professional                      │
│                      [Upgrade ↗]  │
├───────────────────────────────────┤
│                                   │
│ Users                  45 / 50    │
│ ████████████████████░░  90% ⚠️    │
│                                   │
│ Storage             9.2GB / 10GB  │
│ ████████████████████░  92% 🔴     │
│                                   │
│ API Calls         890K / 1M       │
│ ████████████████████░  89%        │
│                                   │
│ Resets in: 7 days (Feb 1)         │
│                                   │
│ [View Detailed Usage]             │
└───────────────────────────────────┘
```

### Collapsed View (When < 70% on all quotas)

```
┌───────────────────────────────────┐
│ 💼 Professional Plan              │
│ 🟢 All quotas healthy             │
│                      [Details ▾]  │
└───────────────────────────────────┘
```

**Features:**
- Auto-collapse when all quotas healthy (<70%)
- Visual alerts: ⚠️ yellow (80-90%), 🔴 red (>90%)
- Click "View Detailed Usage" opens modal with full details
- Direct "Upgrade" link to plan comparison
- Shows days until quota reset for API calls

---

## 4. Plan Comparison Modal (Upgrade Flow)

**Trigger:** Click "Upgrade" from quota widget or admin panel  
**Component:** Large modal (2xl size)

```
┌──────────────────────────────────────────────────────────────────────┐
│ Choose Your Plan                                           [✕ Close] │
├──────────────────────────────────────────────────────────────────────┤
│                                                                        │
│    CURRENT          RECOMMENDED         PREMIUM                       │
│ ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                  │
│ │ ⭐ STARTER  │  │ 💎 PRO      │  │ 🏆 ENTERPRISE│                 │
│ │             │  │  ⭐ Most    │  │              │                  │
│ │             │  │   Popular   │  │              │                  │
│ ├─────────────┤  ├─────────────┤  ├─────────────┤                  │
│ │  $29/month  │  │  $99/month  │  │  $299/month │                  │
│ │  $290/year  │  │  $990/year  │  │  $2,990/yr  │                  │
│ │  Save $58   │  │  Save $198  │  │  Save $598  │                  │
│ ├─────────────┤  ├─────────────┤  ├─────────────┤                  │
│ │ ✓ 25 users  │  │ ✓ 100 users │  │ ✓ Unlimited │                  │
│ │ ✓ 10GB      │  │ ✓ 50GB      │  │ ✓ Unlimited │                  │
│ │ ✓ 100K API  │  │ ✓ 500K API  │  │ ✓ Unlimited │                  │
│ │ ✓ HRM       │  │ ✓ HRM       │  │ ✓ All Modules│                 │
│ │ ✓ CRM       │  │ ✓ CRM       │  │ ✓ Priority   │                  │
│ │             │  │ ✓ Finance   │  │   Support   │                  │
│ │             │  │ ✓ Projects  │  │ ✓ Custom SLA│                  │
│ │             │  │ ✓ Analytics │  │ ✓ Training  │                  │
│ ├─────────────┤  ├─────────────┤  ├─────────────┤                  │
│ │  [Current]  │  │  [Upgrade]  │  │ [Contact]   │                  │
│ └─────────────┘  └─────────────┘  └─────────────┘                  │
│                                                                        │
│ ┌────────────────────────────────────────────────────────────────┐  │
│ │ 💡 Upgrade Now & Save!                                         │  │
│ │ Proration Credit:              -$18.50                          │  │
│ │ New Plan (Monthly):             $99.00                          │  │
│ │ First Invoice (Feb 1):          $80.50                          │  │
│ │ ✅ Immediate access to Finance & Projects                       │  │
│ └────────────────────────────────────────────────────────────────┘  │
│                                                                        │
│ Billing Frequency:  ○ Monthly (+$0)   ● Yearly (Save $198)           │
│                                                                        │
│                              [Cancel] [Proceed to Payment]            │
└──────────────────────────────────────────────────────────────────────┘
```

**Features:**
- Side-by-side comparison of 3 plans
- Current plan highlighted with border
- Recommended plan badge
- Real-time proration calculation
- Benefits clearly listed
- Monthly/Yearly toggle with savings indication
- Direct payment flow integration

---

## 5. Subscription Cancellation Flow (3-Step Wizard)

### Step 1: Reason Collection

```
┌──────────────────────────────────────────────────────────────────┐
│ We're Sorry to See You Go                              [✕ Close] │
├──────────────────────────────────────────────────────────────────┤
│ Step 1 of 3: Tell us why you're leaving                          │
│ ●──────○──────○                                                   │
│                                                                    │
│ ○ Too expensive                                                   │
│ ● Switching to another provider                                   │
│ ○ Not using enough features                                       │
│ ○ Technical issues                                                │
│ ○ Missing features I need                                         │
│ ○ Other (please specify)                                          │
│                                                                    │
│ Additional feedback (optional)                                    │
│ ┌────────────────────────────────────────────────────────────┐  │
│ │ We found a competitor with better pricing...               │  │
│ └────────────────────────────────────────────────────────────┘  │
│                                                                    │
│                                       [Cancel]  [Continue →]      │
└──────────────────────────────────────────────────────────────────┘
```

### Step 2: Retention Offers

```
┌──────────────────────────────────────────────────────────────────┐
│ Before You Go...                                        [✕ Close] │
├──────────────────────────────────────────────────────────────────┤
│ Step 2 of 3: Special offers just for you                         │
│ ○──────●──────○                                                   │
│                                                                    │
│ 💡 We'd love to keep you as a customer!                          │
│                                                                    │
│ ┌───────────────────────────────────────────────────────────┐   │
│ │ 🎁 OPTION 1: Stay & Save 25%                             │   │
│ │ Get 25% off your next 3 months                           │   │
│ │ Professional Plan: $99 → $74.25/month                    │   │
│ │ [Accept This Offer]                                      │   │
│ └───────────────────────────────────────────────────────────┘   │
│                                                                    │
│ ┌───────────────────────────────────────────────────────────┐   │
│ │ ⏸️  OPTION 2: Pause Subscription                          │   │
│ │ Take a break without losing your data                     │   │
│ │ [Pause 1 Month] [Pause 3 Months] [Pause 6 Months]        │   │
│ └───────────────────────────────────────────────────────────┘   │
│                                                                    │
│                    [No thanks, continue cancelling]               │
│                       [← Back]  [Continue →]                      │
└──────────────────────────────────────────────────────────────────┘
```

### Step 3: Confirmation

```
┌──────────────────────────────────────────────────────────────────┐
│ Confirm Cancellation                                    [✕ Close] │
├──────────────────────────────────────────────────────────────────┤
│ Step 3 of 3: Final confirmation                                  │
│ ○──────○──────●                                                   │
│                                                                    │
│ ⚠️ Warning: Your subscription will be cancelled                   │
│                                                                    │
│ ┌────────────────────────────────────────────────────────────┐  │
│ │ Access ends:    February 28, 2026 (end of billing period)  │  │
│ │ Data retention: 30 days (delete March 30, 2026)            │  │
│ │ Final invoice:  $0.00 (already paid)                       │  │
│ └────────────────────────────────────────────────────────────┘  │
│                                                                    │
│ You will lose access to:                                          │
│ ❌ All modules (HRM, CRM, Finance, Projects)                     │
│ ❌ 45 user accounts                                               │
│ ❌ 9.2 GB stored files                                            │
│                                                                    │
│ Before you go:                                                    │
│ [📥 Download All Data] [📄 Export Reports] [💾 Backup]           │
│                                                                    │
│ ☑ I understand I will lose access                                │
│ ☑ I have exported my data or don't need it                       │
│ ☐ I confirm cancellation                                         │
│                                                                    │
│                       [← Back]  [🗑️ Cancel Subscription]         │
└──────────────────────────────────────────────────────────────────┘
```

**Features:**
- 3-step wizard with progress indicator
- Retention offers: 25% discount, pause options
- Clear impact preview with data loss warnings
- Export data buttons
- Required confirmation checkboxes
- Can go back to previous steps

---

## 6. Plan Creation Form (Admin)

**Route:** `/admin/plans/create`  
**Scroll:** Long form with sections

```
┌──────────────────────────────────────────────────────────────────┐
│ Create New Plan                        [Save Draft] [✕ Cancel]   │
├──────────────────────────────────────────────────────────────────┤
│ Basic Information                                                 │
│ ┌────────────────────────────────────────────────────────────┐  │
│ │ Plan Name*         [Professional Plan___________________]  │  │
│ │ Slug*              [professional_______________________]   │  │
│ │                    Auto-generated [Edit]                   │  │
│ │ Description        [Complete business solution...______]   │  │
│ │ Sort Order         [3___]  ☑ Active  ☐ Featured          │  │
│ └────────────────────────────────────────────────────────────┘  │
│                                                                    │
│ Pricing                                                           │
│ ┌────────────────────────────────────────────────────────────┐  │
│ │ Currency           [USD ▾]                                 │  │
│ │ Monthly Price*     [$__99.00___]                          │  │
│ │ Yearly Price       [$_990.00___]  💡 20% savings          │  │
│ │ Setup Fee          [$___0.00___]                          │  │
│ │ Trial Period       [14___] days  ☐ No trial               │  │
│ └────────────────────────────────────────────────────────────┘  │
│                                                                    │
│ Stripe Integration                                                │
│ ┌────────────────────────────────────────────────────────────┐  │
│ │ Stripe Product ID    [prod_XXXX______]  [Sync ↻]         │  │
│ │ Monthly Price ID     [price_XXXX_____]                    │  │
│ │ Yearly Price ID      [price_XXXX_____]                    │  │
│ └────────────────────────────────────────────────────────────┘  │
│                                                                    │
│ Quotas & Limits                                                   │
│ ┌────────────────────────────────────────────────────────────┐  │
│ │ Max Users          [100__]  ☐ Unlimited                   │  │
│ │ Max Storage        [50___] GB  ☐ Unlimited                │  │
│ │ Max API Calls      [500000_] /month  ☐ Unlimited          │  │
│ │ [+ Add Custom Quota]                                       │  │
│ └────────────────────────────────────────────────────────────┘  │
│                                                                    │
│ Included Modules                                                  │
│ ┌────────────────────────────────────────────────────────────┐  │
│ │ ☑ HRM  ☑ CRM  ☑ Finance  ☑ Projects  ☐ IMS  ☐ POS        │  │
│ │ [✓ Select All] [✗ Deselect All]                           │  │
│ └────────────────────────────────────────────────────────────┘  │
│                                                                    │
│ Marketing Features                                                │
│ ┌────────────────────────────────────────────────────────────┐  │
│ │ 1. [Advanced reporting__________________________] [🗑️]     │  │
│ │ 2. [Priority support____________________________] [🗑️]     │  │
│ │ [+ Add Feature]                                            │  │
│ └────────────────────────────────────────────────────────────┘  │
│                                                                    │
│              [Cancel] [Save as Draft] [Save & Publish]            │
└──────────────────────────────────────────────────────────────────┘
```

**Validation:**
- Name, slug, monthly price required
- Slug must be unique
- Quotas > 0 or -1 (unlimited)
- At least one module selected

**Auto-save:**
- Draft saved every 30 seconds
- Can resume from drafts

---

## 7. Set Custom Quota Modal (Admin)

```
┌──────────────────────────────────────────────────────────────────┐
│ Set Custom Quota: Acme Corp                             [✕ Close]│
├──────────────────────────────────────────────────────────────────┤
│ ┌────────────────────────────────────────────────────────────┐  │
│ │ Quota           Plan Limit    Custom Limit                 │  │
│ ├────────────────────────────────────────────────────────────┤  │
│ │ Users           100           [150__] ☐ Unlimited          │  │
│ │ Storage (GB)    50            [75___] ☐ Unlimited          │  │
│ │ API Calls       500,000       [750000] ☐ Unlimited         │  │
│ └────────────────────────────────────────────────────────────┘  │
│                                                                    │
│ Reason: [Custom enterprise agreement________________]             │
│                                                                    │
│ ☐ Notify tenant of quota changes                                 │
│                              [Cancel] [Apply Custom Quotas]       │
└──────────────────────────────────────────────────────────────────┘
```

---

## 8. Quota Alert Configuration

```
┌──────────────────────────────────────────────────────────────────┐
│ Quota Alert Configuration                     [+ New Alert Rule]  │
├──────────────────────────────────────────────────────────────────┤
│ Active Rules                                                      │
│ ┌────────────────────────────────────────────────────────────┐  │
│ │ Rule             Trigger        Notification    Actions    │  │
│ ├────────────────────────────────────────────────────────────┤  │
│ │ Storage Warning  ≥ 80% storage  Email tenant    [Edit]     │  │
│ │ Users Critical   ≥ 90% users    Email+Slack     [Edit]     │  │
│ └────────────────────────────────────────────────────────────┘  │
│                                                                    │
│ Create New Rule                                                   │
│ Rule Name     [_________________________]                         │
│ Quota Type    [Storage ▾]                                         │
│ Threshold     [85___] %                                           │
│ Notifications ☑ Email tenant  ☐ Slack  ☐ SMS                     │
│                              [Cancel] [Create Alert]              │
└──────────────────────────────────────────────────────────────────┘
```

---

## Implementation Priority

### Phase 1 (High Priority)
1. Quota Monitoring Dashboard
2. Tenant Quota Widget
3. Plan Creation Form enhancement

### Phase 2 (Medium Priority)
4. Plan Comparison Modal
5. Subscription Cancellation Flow
6. Custom Quota Settings

### Phase 3 (Low Priority)
7. Alert Configuration
8. Detailed Analytics

---

## Technical Notes

**Frontend:**
- Use HeroUI components
- Follow ThemedCard pattern
- Mobile-responsive
- Toast notifications with promise pattern
- Skeleton loading states

**Backend:**
- Reuse QuotaEnforcementService
- Add quota API endpoints
- Cache for 5 minutes
- Pagination (max 100/page)

**Performance:**
- Debounce search (300ms)
- Lazy-load graphs
- Progressive loading

---

**Status:** Ready for Design Review  
**Next:** Get high-fidelity mockups from design team

