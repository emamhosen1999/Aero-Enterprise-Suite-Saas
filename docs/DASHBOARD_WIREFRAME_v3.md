# Core Dashboard Wireframe v3.0 - Enhanced Tenant Dashboard

## Overview
This document outlines the enhanced Core Dashboard design with additional widgets that reflect **tenant-specific information** for a multi-tenant ERP system.

---

## Current State (4 Widgets)
| Widget | Position | Category | Data |
|--------|----------|----------|------|
| WelcomeWidget | welcome | DISPLAY | Greeting, user name, date |
| QuickActionsWidget | stats_row | ACTION | Profile, Users, Roles buttons |
| NotificationsWidget | sidebar | ALERT | Unread notifications |
| ActiveModulesWidget | sidebar | DISPLAY | Available modules list |

**Problem:** Too minimal for an ERP dashboard. Lacks tenant data insights.

---

## Enhanced Wireframe Layout

```
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│                              WELCOME HEADER (Full Width)                                  │
│ ┌─────────────────────────────────────────────────────────────────────────────────────┐  │
│ │  👋 Good Morning, Admin!                                       📅 Monday, Dec 23    │  │
│ │  Welcome to your organization dashboard                        🕐 10:45 AM          │  │
│ └─────────────────────────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────────────────┐
│                              STATS ROW (6 Columns - Responsive Grid)                      │
│ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐                  │
│ │ 👥 Users│ │ ✅Active│ │ 🔴Inactive│ │ 🛡️Roles│ │ 🏢Depts │ │ 📋Desigs│                 │
│ │   29    │ │   25    │ │    4    │ │   5    │ │   20    │ │   29    │                  │
│ │ Total   │ │ Online  │ │ Offline │ │ System │ │ Active  │ │ Titles  │                  │
│ └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘                  │
└──────────────────────────────────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────┐ ┌────────────────────────────────────┐
│           MAIN CONTENT (2/3 width)                │ │      SIDEBAR (1/3 width)          │
│                                                   │ │                                    │
│ ┌───────────────────────────────────────────────┐ │ │ ┌────────────────────────────────┐ │
│ │ 🔔 NOTIFICATIONS (Core)                  [5]  │ │ │ │ 🔐 SECURITY OVERVIEW            │ │
│ │ ┌─────────────────────────────────────────┐   │ │ │ │ • Failed logins today: 3        │ │
│ │ │ 📧 New user registered - 2m ago         │   │ │ │ │ • Active sessions: 7            │ │
│ │ │ 🔔 Leave approved - 1h ago              │   │ │ │ │ • Last login: 10:30 AM          │ │
│ │ │ 📢 System maintenance - 3h ago          │   │ │ │ │ • Devices: 12 registered        │ │
│ │ └─────────────────────────────────────────┘   │ │ │ └────────────────────────────────┘ │
│ │ [View All Notifications →]                    │ │ │                                    │
│ └───────────────────────────────────────────────┘ │ │ ┌────────────────────────────────┐ │
│                                                   │ │ │ 📊 SYSTEM HEALTH                │ │
│ ┌───────────────────────────────────────────────┐ │ │ │ • Database: ✅ Connected        │ │
│ │ ⚡ QUICK ACTIONS                               │ │ │ │ • Cache: ✅ Working             │ │
│ │ ┌───────┐ ┌───────┐ ┌───────┐ ┌───────┐       │ │ │ │ • Queue: ✅ 0 pending          │ │
│ │ │👤 My  │ │👥Users│ │🛡️Roles│ │⚙️ Set │       │ │ │ │ • Storage: 25.18 MB used       │ │
│ │ │Profile│ │       │ │       │ │ tings │       │ │ │ └────────────────────────────────┘ │
│ │ └───────┘ └───────┘ └───────┘ └───────┘       │ │ │                                    │
│ └───────────────────────────────────────────────┘ │ │ ┌────────────────────────────────┐ │
│                                                   │ │ │ 📅 UPCOMING HOLIDAYS            │ │
│ ┌───────────────────────────────────────────────┐ │ │ │ • Dec 25 - Christmas Day       │ │
│ │ 📈 RECENT ACTIVITY (Core)                     │ │ │ │ • Jan 1 - New Year's Day       │ │
│ │ ┌─────────────────────────────────────────┐   │ │ │ │ • Jan 26 - Republic Day        │ │
│ │ │ 🔵 Admin updated user settings - 5m     │   │ │ │ └────────────────────────────────┘ │
│ │ │ 🟢 John logged in - 15m                 │   │ │ │                                    │
│ │ │ 🔵 Role permissions updated - 1h        │   │ │ │ ┌────────────────────────────────┐ │
│ │ │ 🟡 New role created - 2h                │   │ │ │ │ 🧩 ACTIVE MODULES              │ │
│ │ │ 🟢 User registration completed - 3h     │   │ │ │ │ ┌─────┐ ┌─────┐ ┌─────┐       │ │
│ │ └─────────────────────────────────────────┘   │ │ │ │ │ Core│ │ HRM │ │ RFI │       │ │
│ │ [View Activity Log →]                         │ │ │ │ └─────┘ └─────┘ └─────┘       │ │
│ └───────────────────────────────────────────────┘ │ │ │ ┌─────┐ ┌─────┐ ┌─────┐       │ │
│                                                   │ │ │ │ DMS │ │ PM  │ │ Fin │       │ │
│ ┌───────────────────────────────────────────────┐ │ │ │ └─────┘ └─────┘ └─────┘       │ │
│ │ 👥 USER DIRECTORY (Overview)                  │ │ │ └────────────────────────────────┘ │
│ │ ┌─────┬───────────────┬─────────┬──────────┐  │ │ │                                    │
│ │ │ Pic │ Name          │ Role    │ Status   │  │ │ │ ┌────────────────────────────────┐ │
│ │ ├─────┼───────────────┼─────────┼──────────┤  │ │ │ │ 🏢 ORGANIZATION INFO            │ │
│ │ │ 👤  │ Admin         │ Admin   │ 🟢 Online│  │ │ │ │ • Departments: 20               │ │
│ │ │ 👤  │ John Doe      │ Manager │ 🟢 Online│  │ │ │ │ • Designations: 29              │ │
│ │ │ 👤  │ Jane Smith    │ User    │ ⚪ Offline│  │ │ │ │ • Skills: 16 defined           │ │
│ │ └─────┴───────────────┴─────────┴──────────┘  │ │ │ │ • Competencies: 8              │ │
│ │ [View All Users →]                            │ │ │ │ • Jurisdictions: 3             │ │
│ └───────────────────────────────────────────────┘ │ │ └────────────────────────────────┘ │
│                                                   │ │                                    │
└───────────────────────────────────────────────────┘ └────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────────────────┐
│                              FULL WIDTH SECTION (Bottom)                                  │
│ ┌─────────────────────────────────────────────────────────────────────────────────────┐  │
│ │ 📊 DATA OVERVIEW CHART                                                               │  │
│ │ ┌───────────────────────────────────────────────────────────────────────────────┐   │  │
│ │ │                       Users by Role Distribution                                │   │  │
│ │ │  Admin ████████████ 3                                                           │   │  │
│ │ │  Manager ██████████████████████ 8                                               │   │  │
│ │ │  Employee ████████████████████████████████████████████████ 15                   │   │  │
│ │ │  Guest ████ 3                                                                   │   │  │
│ │ └───────────────────────────────────────────────────────────────────────────────┘   │  │
│ └─────────────────────────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## New Widgets to Implement (8 Additional Widgets)

### 1. **SystemStatsWidget** (Enhanced Stats Row)
- **Position:** `stats_row`
- **Category:** `SUMMARY`
- **Data Source:** `users`, `roles`, `departments`, `designations` tables
- **Shows:**
  - Total Users / Active / Inactive
  - Total Roles
  - Total Departments
  - Total Designations

### 2. **SecurityOverviewWidget**
- **Position:** `sidebar`
- **Category:** `ALERT`
- **Data Source:** `authentication_events`, `failed_login_attempts`, `sessions`, `user_devices`
- **Shows:**
  - Failed login attempts (today)
  - Active sessions count
  - Last login time
  - Registered devices count

### 3. **SystemHealthWidget**
- **Position:** `sidebar`
- **Category:** `DISPLAY`
- **Data Source:** System checks (DB, Cache, Queue, Storage)
- **Shows:**
  - Database connection status
  - Cache status
  - Queue pending jobs
  - Storage usage

### 4. **RecentActivityWidget**
- **Position:** `main_left`
- **Category:** `FEED`
- **Data Source:** `authentication_events`, `audit_logs`
- **Shows:**
  - Recent login/logout events
  - User actions (CRUD operations)
  - Settings changes
  - Role/permission updates

### 5. **UpcomingHolidaysWidget**
- **Position:** `sidebar`
- **Category:** `DISPLAY`
- **Data Source:** `holidays` table
- **Shows:**
  - Next 3-5 upcoming holidays
  - Holiday name and date
  - Days remaining

### 6. **UserDirectoryWidget**
- **Position:** `main_left`
- **Category:** `SUMMARY`
- **Data Source:** `users`, `roles`
- **Shows:**
  - Top 5 recently active users
  - Avatar, name, role
  - Online/offline status
  - Quick link to user management

### 7. **OrganizationInfoWidget**
- **Position:** `sidebar`
- **Category:** `DISPLAY`
- **Data Source:** `departments`, `designations`, `skills`, `competencies`
- **Shows:**
  - Department count
  - Designation count
  - Skills defined
  - Competencies defined

### 8. **DataOverviewChartWidget**
- **Position:** `full_width`
- **Category:** `SUMMARY`
- **Data Source:** `users`, `roles`, `model_has_roles`
- **Shows:**
  - Bar chart: Users by role
  - Distribution visualization
  - Interactive hover

---

## Widget Categories Explained

| Category | Purpose | UI Style | Examples |
|----------|---------|----------|----------|
| `ACTION` | User needs to take action | Prominent buttons | Quick Actions, Punch Clock |
| `ALERT` | Needs attention | Red/orange accents | Pending Approvals, Overdue Items |
| `SUMMARY` | Informational overview | Stats/numbers | Leave Balance, User Stats |
| `DISPLAY` | Static information | Neutral cards | Active Modules, Organization Info |
| `FEED` | Activity stream | Timeline style | Recent Activity, Audit Log |
| `NAVIGATION` | Quick links | Button grid | Module shortcuts |

---

## Widget Positions

| Position | Grid Area | Widgets |
|----------|-----------|---------|
| `welcome` | Full width top | WelcomeWidget |
| `stats_row` | Full width, 6-col grid | SystemStatsWidget, QuickActionsWidget |
| `main_left` | 2/3 width, left | Notifications, Quick Actions, Activity, User Directory |
| `sidebar` / `main_right` | 1/3 width, right | Security, Health, Holidays, Modules, Org Info |
| `full_width` | Full width bottom | DataOverviewChartWidget |

---

## Implementation Priority

### Phase 1 (Critical - Implement First)
1. ✅ SystemStatsWidget - Enhanced stats with department/designation counts
2. ✅ SecurityOverviewWidget - Login attempts, active sessions
3. ✅ RecentActivityWidget - User activity feed

### Phase 2 (Important)
4. OrganizationInfoWidget - Org structure overview
5. UpcomingHolidaysWidget - Upcoming holidays

### Phase 3 (Nice to Have)
6. UserDirectoryWidget - Quick user view
7. SystemHealthWidget - Database/cache/queue status
8. DataOverviewChartWidget - Visual distribution

---

## Database Tables Available for Widgets

Based on `dbedc_erp` schema:

| Table | Rows | Widget Usage |
|-------|------|--------------|
| `users` | 29 | User stats, directory |
| `roles` | 10 | Role distribution |
| `departments` | 20 | Org structure |
| `designations` | 29 | Org structure |
| `authentication_events` | 2,947 | Security, activity |
| `failed_login_attempts` | 54 | Security alerts |
| `sessions` | 7 | Active users |
| `user_devices` | 49 | Device tracking |
| `holidays` | 18 | Upcoming holidays |
| `skills` | 16 | Org structure |
| `competencies` | 8 | Org structure |
| `notifications` | 0 | Notifications |
| `leaves` | 1,255 | HRM dashboard |
| `attendances` | 6,122 | HRM dashboard |
| `daily_works` | 18,453 | RFI dashboard |

---

## Next Steps

1. Create new widget PHP classes in `packages/aero-core/src/Widgets/`
2. Register widgets in `AeroCoreServiceProvider.php`
3. Create React components in `packages/aero-ui/resources/js/Widgets/Core/`
4. Update widget registry in `packages/aero-ui/resources/js/Widgets/index.js`
5. Test with `npm run build` and refresh dashboard

---

## Color Coding for Stats

```javascript
const statColors = {
  users: 'bg-primary-100 text-primary-600',      // Blue
  active: 'bg-success-100 text-success-600',     // Green
  inactive: 'bg-danger-100 text-danger-600',     // Red
  roles: 'bg-secondary-100 text-secondary-600',  // Purple
  departments: 'bg-warning-100 text-warning-600',// Orange
  designations: 'bg-default-100 text-default-600'// Gray
};
```

---

*Document Version: 3.0*
*Last Updated: December 2024*
*Author: AI Agent*
