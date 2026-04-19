
---

# Tenant Admin Dashboard Redesign — Full Implementation Prompt

## Objective
Redesign the **Tenant Admin Dashboard** (`/dashboard`) as a comprehensive, production-ready command center for tenant administrators. This requires changes to both the **backend** (aero-core) and **frontend** (aero-ui). The dashboard must aggregate cross-module insights, surface system health, subscription status, user activity, security alerts, and actionable summaries from every active module — replacing the current thin stats-only shell with a rich, hardcoded-section + dynamic-widget hybrid design.

---

## Current State Analysis

### What Exists Today

**Backend**: DashboardController.php
- `index()` — Passes only: `stats` (5 simple counts: totalUsers, activeUsers, inactiveUsers, totalRoles, usersThisMonth), `dynamicWidgets` (filtered to `'core'` key), `title`
- `stats()` — API endpoint returning same 5 counts (no chart data, no cross-module stats)
- `widgetData($widgetKey)` — Lazy-loads individual widget data via DashboardWidgetRegistry
- Renders: `Inertia::render('Core/Dashboard', [...])`

**Frontend**: Core/Dashboard.jsx
- Uses: `useThemeRadius`, `useHRMAC`, responsive state, `DynamicWidgetRenderer`
- Layout: Welcome header → dynamic welcome widgets → stats row widgets → 2/3+1/3 grid (BusinessSummaryWidget left, PlanOverviewWidget right) → ModuleSummaryWidget → full-width widgets → empty state
- 3 hardcoded components:
  - PlanOverviewWidget.jsx — Subscription quota bars (users, storage, projects, documents, employees)
  - BusinessSummaryWidget.jsx — 4 basic KPIs + AreaChart (totalUsers, activeUsers, usersThisMonth, totalRoles)
  - ModuleSummaryWidget.jsx — Grid of 13 modules with lock/access states

**7 Core Widgets** (all target `['core']`):
| Widget | Key | Position | Data |
|--------|-----|----------|------|
| WelcomeWidget | `core.welcome` | welcome | greeting, userName, date, time |
| SystemStatsWidget | `core.system_stats` | stats_row | 8 counts (users, roles, departments, etc.) |
| SecurityOverviewWidget | `core.security_overview` | sidebar | failedLogins, activeSessions, lastLogin, registeredDevices |
| RecentActivityWidget | `core.recent_activity` | main_left | Timeline of logins, settings changes, role updates |
| QuickActionsWidget | `core.quick_actions` | stats_row | Permission-gated action buttons |
| NotificationsWidget | `core.notifications` | main_left | 5 unread notifications |
| ActiveModulesWidget | `core.active_modules` | sidebar | List of accessible modules |

**Routes** (3 total):
- `GET /dashboard` → `core.dashboard`
- `GET /dashboard/stats` → `core.dashboard.stats`
- `GET /dashboard/widget/{widgetKey}` → `core.dashboard.widget`

### What's Wrong
1. **Only 5 stat counts** — no meaningful KPIs (revenue, pending approvals, active projects, open tickets, etc.)
2. **No cross-module aggregation** — NO module widgets target `'core'` dashboard; each module only targets its own dashboard key
3. **No system health monitoring** — no disk/storage usage, queue status, error rates, API latency
4. **No subscription/billing dashboard** — PlanOverviewWidget exists but fetches from a quota route that may not be available; no billing history, payment status, upcoming renewal
5. **No user growth/activity charts** — BusinessSummaryWidget shows only flat KPIs; chart data is empty (controller returns no `chart` key)
6. **No security dashboard** — SecurityOverviewWidget exists as widget but no dedicated security section with login heatmaps, device tracking, IP analysis
7. **No audit log summary** — no recent changes feed beyond the basic RecentActivityWidget
8. **No storage analytics** — no breakdown by module, no trending, no cleanup recommendations
9. **No pending approvals aggregator** — admin can't see cross-module pending items (leave requests, expense approvals, document reviews, purchase orders)
10. **No quick navigation to module dashboards** — ModuleSummaryWidget exists but lacks contextual summaries per module
11. **No announcement/broadcast system** — no way to post tenant-wide announcements
12. **No scheduled reports overview** — ScheduledReport model exists in platform but no UI
13. **No API usage/webhook monitoring** — ApiKey, Webhook, WebhookLog models exist but no dashboard surface
14. **No onboarding progress** — no setup wizard completion tracking for new tenants
15. **No error/exception monitoring** — ErrorLog model exists but no dashboard widget

---

## Implementation Scope

### PHASE 1: Backend — New DashboardService + Controller Rewrite

**Create**: `packages/aero-core/src/Services/Dashboard/AdminDashboardService.php`

This service aggregates data from all accessible modules. Each method is independently try/catch wrapped so one module failure doesn't break the dashboard. All queries use caching (2-5 min TTL).

```php
class AdminDashboardService
{
    // ── Core Stats ──
    public function getCoreStats(): array
    // Returns: totalUsers, activeUsers, inactiveUsers, onlineUsers, totalRoles,
    // totalDepartments, totalDesignations, newUsersThisMonth, newUsersThisWeek,
    // userGrowthRate (% vs last month), averageSessionDuration
    // Cache: 5 min

    // ── User Activity ──
    public function getUserActivity(string $period = 'week'): array
    // Returns: chartData[] (date, activeUsers, newUsers, logins), 
    // peakHours[] (hour, count), topActiveUsers[] (name, loginCount)
    // Cache: 5 min

    // ── Security Overview ──
    public function getSecurityOverview(): array
    // Returns: failedLoginsToday, failedLoginsWeek, activeSessions,
    // suspiciousActivities[] (from AuditLog where action = 'suspicious'),
    // recentDevices[] (from UserDevice), mfaAdoptionRate,
    // passwordExpiringUsers (count), lastSecurityEvent
    // Cache: 2 min

    // ── Storage Analytics ──
    public function getStorageAnalytics(): array
    // Returns: totalUsed, totalLimit (from plan), usagePercentage,
    // byModule[] (module => size), recentUploads (count this week),
    // largestFiles[] (top 5), growthTrend[] (last 6 months)
    // Cache: 10 min

    // ── Subscription & Billing ──
    public function getSubscriptionInfo(): array
    // Returns: plan (name, slug, features), status, expiresAt,
    // daysRemaining, isOnTrial, trialEndsAt, quotaUsage (users, storage, etc.),
    // billingCycle, nextBillingDate, paymentMethod (last4 if available)
    // Sources: Subscription, Plan models via tenant relationship
    // Cache: 15 min

    // ── Cross-Module Pending Approvals ──
    public function getPendingApprovals(): array
    // Returns aggregated counts from all active modules:
    // hrm: { pendingLeaves, pendingTimesheets, pendingExpenses }
    // finance: { pendingInvoices, pendingExpenseReports }
    // dms: { pendingDocumentApprovals }
    // project: { overdueTasksCount }
    // scm: { pendingPurchaseRequisitions }
    // quality: { pendingNCRs, overdueCAPAs }
    // compliance: { pendingActions }
    // Each key only present if module is accessible to current user
    // Uses ModuleRegistry::isAccessible() check
    // Cache: 3 min

    // ── Cross-Module Summary Cards ──
    public function getModuleSummaries(): array
    // Returns one summary per accessible module:
    // hrm: { totalEmployees, presentToday, onLeave, pendingApprovals }
    // finance: { revenue (mtd), expenses (mtd), pendingInvoices, cashFlow }
    // project: { activeProjects, completedThisMonth, overdueTasks, teamUtilization }
    // ims: { totalProducts, lowStockItems, pendingPOs, stockValue }
    // pos: { todaysSales, transactionCount, avgOrderValue, openRegisters }
    // scm: { activeSuppliers, inTransitShipments, pendingRequisitions }
    // dms: { totalDocuments, recentUploads, pendingApprovals, storageUsed }
    // quality: { overallScore, openNCRs, upcomingAudits, overdueCAPAs }
    // compliance: { complianceScore, pendingActions, upcomingAudits }
    // Each module summary fetched via that module's Service if available
    // Cache: 5 min

    // ── Recent Audit Log ──
    public function getRecentAuditLog(int $limit = 15): array
    // Returns: items[] (user, action, description, auditable_type, created_at, metadata)
    // Grouped by date for timeline display
    // Cache: 2 min

    // ── System Health ──
    public function getSystemHealth(): array
    // Returns: queueSize (if queue driver != sync), 
    // failedJobs (count), cacheHitRate (if available),
    // lastBackup (timestamp if backup model exists),
    // errorCount (today from ErrorLog if platform package active),
    // apiRequestsToday (from ApiKey usage if available),
    // uptime (from SystemSetting if tracked)
    // Cache: 2 min

    // ── Announcements ──
    public function getAnnouncements(): array
    // Returns: active announcements for the tenant
    // Requires new Announcement model (see Phase 3)
    // Cache: 5 min

    // ── Quick Actions ──
    public function getQuickActions(): array
    // Returns: permission-gated action list with routes
    // Groups: User Management, Module Access, Settings, Reports
    // Each action: { label, icon, route, permission, badge? }

    // ── Onboarding Progress ──
    public function getOnboardingProgress(): array
    // Returns: steps[] (label, completed, route)
    // e.g., "Set company logo", "Add departments", "Invite first user",
    // "Configure leave types", "Set up payroll", "Enable modules"
    // Only shown if tenant created < 30 days ago
    // Cache: 10 min

    // ── Upcoming Events ──
    public function getUpcomingEvents(int $days = 7): array
    // Aggregates: upcoming holidays (HRM), task deadlines (Project),
    // audit dates (Quality/Compliance), subscription renewal, scheduled reports
    // Cache: 10 min
}
```

#### 1.1 Rewrite DashboardController

**File**: DashboardController.php

```php
public function __construct(private AdminDashboardService $dashboardService) {}

public function index(): Response
{
    $user = auth()->user();
    
    return Inertia::render('Core/Dashboard', [
        'title' => 'Dashboard',
        
        // Immediate props (small, fast)
        'coreStats' => $this->dashboardService->getCoreStats(),
        'subscriptionInfo' => $this->dashboardService->getSubscriptionInfo(),
        'quickActions' => $this->dashboardService->getQuickActions(),
        'announcements' => $this->dashboardService->getAnnouncements(),
        
        // Deferred props (loaded async after page render)
        'pendingApprovals' => Inertia::defer(fn () => 
            $this->dashboardService->getPendingApprovals()
        ),
        'moduleSummaries' => Inertia::defer(fn () => 
            $this->dashboardService->getModuleSummaries()
        ),
        'securityOverview' => Inertia::defer(fn () => 
            $this->dashboardService->getSecurityOverview()
        ),
        'recentAuditLog' => Inertia::defer(fn () => 
            $this->dashboardService->getRecentAuditLog()
        ),
        'storageAnalytics' => Inertia::defer(fn () => 
            $this->dashboardService->getStorageAnalytics()
        ),
        'systemHealth' => Inertia::defer(fn () => 
            $this->dashboardService->getSystemHealth()
        ),
        'onboardingProgress' => Inertia::defer(fn () => 
            $this->dashboardService->getOnboardingProgress()
        ),
        'upcomingEvents' => Inertia::defer(fn () => 
            $this->dashboardService->getUpcomingEvents()
        ),
        
        // Dynamic widgets (existing system)
        'dynamicWidgets' => DashboardWidgetRegistry::getWidgetsForDashboard('core'),
    ]);
}

// NEW: User activity chart endpoint
public function userActivity(Request $request): JsonResponse
{
    $period = $request->input('period', 'week');
    return response()->json(
        $this->dashboardService->getUserActivity($period)
    );
}

// KEEP: Existing stats() and widgetData() methods
```

#### 1.2 Add New Routes

**File**: web.php (inside the dashboard middleware group)

```php
Route::get('dashboard/user-activity', [DashboardController::class, 'userActivity'])
    ->name('core.dashboard.user-activity');
Route::post('dashboard/announcements', [DashboardController::class, 'storeAnnouncement'])
    ->name('core.dashboard.announcements.store');
Route::delete('dashboard/announcements/{announcement}', [DashboardController::class, 'destroyAnnouncement'])
    ->name('core.dashboard.announcements.destroy');
```

---

### PHASE 2: Backend — New Models for Evolving Features

#### 2.1 Announcement Model
**Create**: `packages/aero-core/src/Models/Announcement.php`

```php
// Fields: id (uuid), tenant_id, author_id, title, body, type (info|warning|success|danger),
// priority (low|normal|high|urgent), starts_at, expires_at, is_pinned, is_dismissible,
// target_roles (json array — null = all), target_departments (json array — null = all),
// dismissed_by (json array of user_ids), created_at, updated_at, deleted_at
// Relationships: author() → User, scopeActive(), scopeForUser($user)
```

**Migration**: `create_announcements_table`

**FormRequest**: `StoreAnnouncementRequest` — validates title, body, type, priority, dates, targets

#### 2.2 DashboardPreference Model
**Create**: `packages/aero-core/src/Models/DashboardPreference.php`

```php
// Fields: id, user_id, dashboard_key, layout (json — widget positions/sizes),
// hidden_widgets (json array), collapsed_sections (json array), theme_overrides (json)
// Allows admins to customize their dashboard layout
```

**Migration**: `create_dashboard_preferences_table`

#### 2.3 OnboardingStep Model (optional — or use SystemSetting)
Track tenant setup progress. Can be a JSON column in `CompanySetting` instead of a separate model:
```php
// CompanySetting key: 'onboarding_progress'
// Value: { steps: { company_logo: true, departments: true, first_user: false, ... }, completed_at: null }
```

---

### PHASE 3: Frontend — Full Dashboard Rewrite

**File**: Dashboard.jsx

The dashboard should be a **hardcoded section layout** with dynamic widgets interspersed. Every section has its own loading skeleton (deferred props).

#### 3.1 Page Component Structure

```jsx
const Dashboard = ({ title }) => {
    const { auth, coreStats, subscriptionInfo, quickActions, announcements,
            dynamicWidgets } = usePage().props;
    
    // Deferred props — will show skeletons until loaded
    const pendingApprovals = usePage().props.pendingApprovals;      // deferred
    const moduleSummaries = usePage().props.moduleSummaries;        // deferred
    const securityOverview = usePage().props.securityOverview;      // deferred
    const recentAuditLog = usePage().props.recentAuditLog;         // deferred
    const storageAnalytics = usePage().props.storageAnalytics;     // deferred
    const systemHealth = usePage().props.systemHealth;             // deferred
    const onboardingProgress = usePage().props.onboardingProgress; // deferred
    const upcomingEvents = usePage().props.upcomingEvents;         // deferred
    
    // Hooks (REQUIRED)
    const themeRadius = useThemeRadius();
    const { can } = useHRMAC();
    const [isMobile, setIsMobile] = useState(false);
    // ... standard responsive setup

    return (
        <>
            <Head title={title} />
            <div className="flex flex-col w-full h-full p-4" role="main">
                <div className="space-y-6">
                
                    {/* ── 1. ONBOARDING BANNER (new tenants only) ── */}
                    {onboardingProgress && !onboardingProgress.completed && (
                        <OnboardingBanner steps={onboardingProgress.steps} />
                    )}
                    
                    {/* ── 2. ANNOUNCEMENTS BANNER ── */}
                    {announcements?.length > 0 && (
                        <AnnouncementsBanner announcements={announcements} />
                    )}
                    
                    {/* ── 3. WELCOME + QUICK STATS ROW ── */}
                    <WelcomeHeader user={auth.user} stats={coreStats} />
                    
                    {/* ── 4. DYNAMIC WELCOME WIDGETS ── */}
                    <DynamicWidgetRenderer widgets={dynamicWidgets} position="welcome" />
                    
                    {/* ── 5. KEY METRICS STATS CARDS ── */}
                    <AdminStatsCards stats={coreStats} />
                    
                    {/* ── 6. DYNAMIC STATS ROW WIDGETS ── */}
                    <DynamicWidgetRenderer widgets={dynamicWidgets} position="stats_row" />
                    
                    {/* ── 7. MAIN CONTENT GRID (2/3 + 1/3) ── */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Left Column (2/3) */}
                        <div className="lg:col-span-2 space-y-6">
                        
                            {/* 7a. Pending Approvals Aggregator */}
                            <PendingApprovalsCard 
                                approvals={pendingApprovals} 
                                loading={!pendingApprovals} 
                            />
                            
                            {/* 7b. User Activity Chart */}
                            <UserActivityChart />
                            
                            {/* 7c. Cross-Module Summary Grid */}
                            <ModuleSummaryGrid 
                                summaries={moduleSummaries} 
                                loading={!moduleSummaries} 
                            />
                            
                            {/* 7d. Recent Audit Log Timeline */}
                            <AuditLogTimeline 
                                logs={recentAuditLog} 
                                loading={!recentAuditLog} 
                            />
                            
                            {/* 7e. Dynamic main_left widgets */}
                            <DynamicWidgetRenderer widgets={dynamicWidgets} position="main_left" />
                        </div>
                        
                        {/* Right Column (1/3) */}
                        <div className="space-y-6">
                        
                            {/* 7f. Subscription & Plan Overview */}
                            <SubscriptionCard info={subscriptionInfo} />
                            
                            {/* 7g. Quick Actions Panel */}
                            <QuickActionsPanel actions={quickActions} can={can} />
                            
                            {/* 7h. Security Overview */}
                            <SecurityOverviewCard 
                                security={securityOverview} 
                                loading={!securityOverview} 
                            />
                            
                            {/* 7i. Storage Analytics */}
                            <StorageAnalyticsCard 
                                storage={storageAnalytics} 
                                loading={!storageAnalytics} 
                            />
                            
                            {/* 7j. System Health */}
                            <SystemHealthCard 
                                health={systemHealth} 
                                loading={!systemHealth} 
                            />
                            
                            {/* 7k. Upcoming Events */}
                            <UpcomingEventsCard 
                                events={upcomingEvents} 
                                loading={!upcomingEvents} 
                            />
                            
                            {/* 7l. Dynamic sidebar widgets */}
                            <DynamicWidgetRenderer widgets={dynamicWidgets} position="sidebar" />
                        </div>
                    </div>
                    
                    {/* ── 8. MODULE SUMMARY (existing, enhanced) ── */}
                    <ModuleSummaryWidget />
                    
                    {/* ── 9. FULL-WIDTH DYNAMIC WIDGETS ── */}
                    <DynamicWidgetRenderer widgets={dynamicWidgets} position="full_width" />
                    
                </div>
            </div>
        </>
    );
};

Dashboard.layout = (page) => <App children={page} />;
export default Dashboard;
```

---

### PHASE 4: Frontend — New Components (20+ components)

All components go in `packages/aero-ui/resources/js/Components/Dashboard/Admin/`.

#### 4.1 OnboardingBanner.jsx
- Horizontal progress bar showing setup completion (0-100%)
- Checklist of steps with checkmarks/links: Set company logo, Add departments, Invite first user, Configure leave types, Enable modules, Set up payroll
- Dismissible after all steps complete or after 30 days
- Uses ThemedCard, HeroUI Progress, Chip

#### 4.2 AnnouncementsBanner.jsx
- Scrollable announcement cards with type-based color coding (info=primary, warning=warning, danger=danger, success=success)
- Pinned announcements shown first
- Dismiss button per announcement (calls API to add user to dismissed_by)
- "Create Announcement" button for users with `core.dashboard.create` permission
- Modal form for creating announcements (title, body, type, priority, dates, target roles/departments)

#### 4.3 WelcomeHeader.jsx
- Greeting based on time of day + user name
- Current date/time display
- Mini stat badges inline: "X users online", "Y pending approvals"
- Uses motion.div for entry animation

#### 4.4 AdminStatsCards.jsx
- Enhanced version of StatsCards with 6-8 metric cards:
  - Total Users (with growth %)
  - Active Users (with online count badge)
  - New This Month (with trend arrow)
  - Total Departments
  - Active Modules (count)
  - Pending Approvals (cross-module total)
  - Storage Used (% of quota)
  - Security Score (based on MFA adoption + failed logins)
- Each card: icon (themed bg), title, value, trend indicator, click navigates to relevant page
- Grid: 4 columns desktop, 2 tablet, 1 mobile

#### 4.5 PendingApprovalsCard.jsx
- Aggregated view of all cross-module pending items
- Tabs or segmented control per module: HRM | Finance | Documents | Projects | SCM | Quality | Compliance
- Each tab shows count + "View All" link to that module's approval page
- Total badge in card header
- Skeleton loading for deferred prop
- Uses ThemedCard, HeroUI Tabs, Chip with counts

#### 4.6 UserActivityChart.jsx
- recharts AreaChart showing user login/activity trends
- Period selector tabs: Week | Month | Quarter | Year
- Fetches from `core.dashboard.user-activity` API endpoint
- Overlays: active users line + new users line
- Peak hours indicator below chart
- Uses ThemedCard, recharts (AreaChart, BarChart for peak hours)

#### 4.7 ModuleSummaryGrid.jsx
- Replaces flat ModuleSummaryWidget with contextual summary cards per active module
- Each card shows: module icon + name, 3-4 KPI stats, mini sparkline, "Open" button
- Only shows accessible modules (uses useHRMAC)
- Expandable cards on click for more detail
- Grid: 3 columns desktop, 2 tablet, 1 mobile
- Skeleton grid for deferred loading

#### 4.8 AuditLogTimeline.jsx
- Vertical timeline of recent system changes
- Grouped by date with relative timestamps
- Action icons per type (login, settings change, user created, role updated, etc.)
- Filter dropdown: All | Users | Settings | Security | Data
- "View Full Log" link to audit log page
- Max 15 items, paginated via API if needed

#### 4.9 SubscriptionCard.jsx
- Enhanced PlanOverviewWidget with:
  - Plan name + badge (Free/Starter/Professional/Enterprise)
  - Quota progress bars (users, storage, projects, documents, employees)
  - Days until renewal/expiry with color coding
  - Trial banner if on trial
  - "Upgrade Plan" CTA button
  - Billing cycle info
  - "Manage Subscription" link

#### 4.10 QuickActionsPanel.jsx
- Grid of permission-gated action buttons grouped by category:
  - **Users**: Add User, Invite User, Manage Roles
  - **Modules**: Module Settings, Enable/Disable Modules
  - **Settings**: Company Settings, Security Settings, Mail Settings, Branding
  - **Reports**: Export Users, Activity Report, Scheduled Reports
- Each action: icon, label, badge (optional count), onClick navigates or opens modal
- Collapsed categories on mobile

#### 4.11 SecurityOverviewCard.jsx
- Failed login attempts (today + trend)
- Active sessions count
- MFA adoption rate (progress bar)
- Recent devices list (top 3)
- Password expiry warnings
- "View Security Settings" link
- Alert banner if suspicious activity detected

#### 4.12 StorageAnalyticsCard.jsx
- Total used / total limit with large Progress bar
- Breakdown by module (mini bar chart or stacked bar)
- Recent upload count (this week)
- Growth trend (mini sparkline last 6 months)
- "Manage Storage" link
- Warning chip if > 80% used

#### 4.13 SystemHealthCard.jsx
- Status indicators: Queue (green/yellow/red), Cache, Database, API
- Failed jobs count (if any, with "Retry All" action)
- Error count today (from ErrorLog)
- API requests today
- Last backup timestamp
- Overall health score (composite)
- Green/yellow/red overall indicator

#### 4.14 UpcomingEventsCard.jsx
- Combined calendar of events from all modules:
  - Holidays (HRM), Task deadlines (Project), Audit dates (Quality/Compliance), Subscription renewal, Scheduled reports
- Mini calendar view or list view toggle
- Date badges with module-colored indicators
- "View Calendar" link (if calendar page exists)

#### 4.15 CreateAnnouncementModal.jsx
- HeroUI Modal (size="2xl", scrollBehavior="inside")
- Form fields: title, body (textarea), type (Select: info/warning/success/danger), priority (Select: low/normal/high/urgent), starts_at (date), expires_at (date), is_pinned (Switch), target_roles (multi-select), target_departments (multi-select)
- Submit via showToast.promise + axios POST

#### 4.16 DashboardPreferencesModal.jsx (Future Enhancement)
- Drag-and-drop widget reordering
- Show/hide widgets toggle
- Section collapse preferences
- Save to DashboardPreference model

---

### PHASE 5: Evolving Features — Missing from aero-core

These features don't exist yet and should be added to the core package:

#### 5.1 Tenant Announcement System
**Backend** (in aero-core):
- Model: `Announcement` (see Phase 2.1)
- Controller: `AnnouncementController` with CRUD + dismiss endpoint
- Routes: CRUD under `core.announcements.*`
- HRMAC: `core.dashboard.create` permission for creating announcements
- Service: `AnnouncementService` with scope-based queries

#### 5.2 Cross-Module Summary Aggregation
**Backend** (in aero-core):
- New `CrossModuleAggregatorService` that uses `ModuleRegistry` to discover active modules, then calls each module's summary service method (if it exists)
- Interface: `ModuleSummaryProvider` — each package can implement to provide dashboard summary data
- Registration: modules register their summary provider in their ServiceProvider boot()

**New Interface** (in Contracts):
```php
interface ModuleSummaryProvider
{
    public function getDashboardSummary(): array;
    // Returns: ['key' => 'hrm', 'stats' => [...], 'alerts' => [...], 'pendingCount' => int]
}
```

**Each module implements** this interface in their main Service:
- `packages/aero-hrm/src/Services/HrmSummaryProvider.php`
- `packages/aero-finance/src/Services/FinanceSummaryProvider.php`
- etc.

#### 5.3 System Health Monitoring
**Backend** (in aero-core):
- Service: `SystemHealthService`
- Checks: Queue size (`Queue::size()`), failed jobs count, cache connectivity, database connectivity, disk usage, last backup
- Stored in cache with 2-min TTL
- No new models needed — uses existing infrastructure

#### 5.4 Onboarding Wizard Tracking
**Backend** (in aero-core):
- Service: `OnboardingService`
- Checks: company logo exists, departments count > 0, users count > 1, leave types configured, modules enabled > 1, etc.
- Stores progress in `CompanySetting` (key: `onboarding_progress`)
- Auto-completes steps as conditions are met

#### 5.5 Dashboard Preferences/Customization
**Backend** (in aero-core):
- Model: `DashboardPreference` (see Phase 2.2)
- API endpoints to save/load layout preferences
- Per-user customization of widget visibility and order

#### 5.6 Scheduled Report Dashboard
**Backend**: ScheduledReport and ReportExecution models already exist in aero-platform
- Surface upcoming/recent reports on admin dashboard
- "Run Now" action for immediate execution
- Status indicators (success/failed/pending)

#### 5.7 API Usage & Webhook Monitoring
**Backend**: ApiKey, Webhook, WebhookLog models exist in aero-platform
- Surface API request counts on dashboard
- Webhook delivery success/failure rates
- Recent webhook logs timeline

#### 5.8 Error Monitoring Dashboard
**Backend**: ErrorLog model exists in aero-platform
- Surface today's error count on dashboard
- Top error types (grouped)
- Error trend (last 7 days mini chart)
- Link to full error log page

---

### PHASE 6: Testing

**File**: `packages/aero-core/tests/Feature/Dashboard/`

#### Required Tests:

```
AdminDashboardControllerTest.php
├── test_dashboard_index_returns_correct_props()
├── test_dashboard_index_requires_authentication()
├── test_dashboard_index_requires_dashboard_permission()
├── test_dashboard_stats_endpoint_returns_json()
├── test_dashboard_user_activity_endpoint_week_period()
├── test_dashboard_user_activity_endpoint_month_period()
├── test_dashboard_widget_data_returns_widget()
├── test_dashboard_widget_data_returns_404_for_invalid_key()

AdminDashboardServiceTest.php
├── test_get_core_stats_returns_all_expected_keys()
├── test_get_core_stats_caches_results()
├── test_get_user_activity_returns_chart_data()
├── test_get_security_overview_counts_failed_logins()
├── test_get_storage_analytics_respects_plan_limits()
├── test_get_subscription_info_handles_no_subscription()
├── test_get_subscription_info_handles_trial()
├── test_get_pending_approvals_only_includes_accessible_modules()
├── test_get_module_summaries_only_includes_accessible_modules()
├── test_get_recent_audit_log_respects_limit()
├── test_get_system_health_returns_all_indicators()
├── test_get_quick_actions_filters_by_permissions()
├── test_get_onboarding_progress_for_new_tenant()
├── test_get_onboarding_progress_for_established_tenant()
├── test_get_upcoming_events_aggregates_across_modules()

AnnouncementTest.php
├── test_create_announcement_with_valid_data()
├── test_create_announcement_requires_permission()
├── test_dismiss_announcement_adds_user_to_dismissed()
├── test_expired_announcements_not_returned()
├── test_targeted_announcements_filter_by_role()
├── test_targeted_announcements_filter_by_department()
├── test_pinned_announcements_sorted_first()

CrossModuleAggregatorTest.php
├── test_aggregator_only_queries_accessible_modules()
├── test_aggregator_handles_module_service_failure_gracefully()
├── test_pending_approvals_sums_correctly()
```

---

### PHASE 7: Performance Optimization

1. **Inertia Deferred Props** — Heavy data (module summaries, audit log, security, storage) loaded async after page shell renders
2. **Redis Caching** — All service methods cache with 2-15 min TTL (configured per method)
3. **Eager Loading** — All queries use `with()` to prevent N+1
4. **Skeleton Loading** — Each section shows animated skeleton while deferred props load
5. **Lazy Widget Data** — Dynamic widgets use `core.dashboard.widget` endpoint for on-demand loading
6. **Query Optimization** — Cross-module aggregation uses COUNT queries, not full model hydration
7. **Module Isolation** — Each module summary provider runs independently; failure in one doesn't affect others
8. **Frontend Code Splitting** — recharts and heavy components loaded via React.lazy()

---

## Files to Create/Modify Summary

### New Files (Backend)
| File | Package |
|------|---------|
| `src/Services/Dashboard/AdminDashboardService.php` | aero-core |
| `src/Models/Announcement.php` | aero-core |
| `src/Models/DashboardPreference.php` | aero-core |
| `src/Http/Requests/StoreAnnouncementRequest.php` | aero-core |
| `src/Contracts/ModuleSummaryProvider.php` | aero-core |
| `src/Services/SystemHealthService.php` | aero-core |
| `src/Services/OnboardingService.php` | aero-core |
| `database/migrations/xxxx_create_announcements_table.php` | aero-core |
| `database/migrations/xxxx_create_dashboard_preferences_table.php` | aero-core |
| `database/factories/AnnouncementFactory.php` | aero-core |
| `tests/Feature/Dashboard/AdminDashboardControllerTest.php` | aero-core |
| `tests/Feature/Dashboard/AdminDashboardServiceTest.php` | aero-core |
| `tests/Feature/Dashboard/AnnouncementTest.php` | aero-core |
| `tests/Feature/Dashboard/CrossModuleAggregatorTest.php` | aero-core |

### New Files (Frontend)
| File | Package |
|------|---------|
| `Components/Dashboard/Admin/OnboardingBanner.jsx` | aero-ui |
| `Components/Dashboard/Admin/AnnouncementsBanner.jsx` | aero-ui |
| `Components/Dashboard/Admin/WelcomeHeader.jsx` | aero-ui |
| `Components/Dashboard/Admin/AdminStatsCards.jsx` | aero-ui |
| `Components/Dashboard/Admin/PendingApprovalsCard.jsx` | aero-ui |
| `Components/Dashboard/Admin/UserActivityChart.jsx` | aero-ui |
| `Components/Dashboard/Admin/ModuleSummaryGrid.jsx` | aero-ui |
| `Components/Dashboard/Admin/AuditLogTimeline.jsx` | aero-ui |
| `Components/Dashboard/Admin/SubscriptionCard.jsx` | aero-ui |
| `Components/Dashboard/Admin/QuickActionsPanel.jsx` | aero-ui |
| `Components/Dashboard/Admin/SecurityOverviewCard.jsx` | aero-ui |
| `Components/Dashboard/Admin/StorageAnalyticsCard.jsx` | aero-ui |
| `Components/Dashboard/Admin/SystemHealthCard.jsx` | aero-ui |
| `Components/Dashboard/Admin/UpcomingEventsCard.jsx` | aero-ui |
| `Components/Dashboard/Admin/CreateAnnouncementModal.jsx` | aero-ui |
| `Components/Dashboard/Admin/DashboardPreferencesModal.jsx` | aero-ui |

### Modified Files
| File | Package | Changes |
|------|---------|---------|
| `src/Http/Controllers/DashboardController.php` | aero-core | Inject AdminDashboardService, rewrite index() with deferred props, add userActivity() endpoint |
| web.php | aero-core | Add 3 new dashboard routes (user-activity, announcements CRUD) |
| `config/module.php` | aero-core | Add `announcements` component under `dashboard` submodule with create/update/delete actions |
| `Pages/Core/Dashboard.jsx` | aero-ui | Full rewrite with hardcoded sections + dynamic widgets |

### Module Provider Updates (each module adds ModuleSummaryProvider)
| File | Package |
|------|---------|
| `src/Services/HrmSummaryProvider.php` | aero-hrm |
| `src/Services/FinanceSummaryProvider.php` | aero-finance |
| `src/Services/ProjectSummaryProvider.php` | aero-project |
| `src/Services/ImsSummaryProvider.php` | aero-ims |
| `src/Services/PosSummaryProvider.php` | aero-pos |
| `src/Services/ScmSummaryProvider.php` | aero-scm |
| `src/Services/DmsSummaryProvider.php` | aero-dms |
| `src/Services/QualitySummaryProvider.php` | aero-quality |
| `src/Services/ComplianceSummaryProvider.php` | aero-compliance |

---

## Execution Order

1. Create `AdminDashboardService` with all methods (stubbed, then implemented one by one)
2. Create `Announcement` model + migration + factory
3. Create `DashboardPreference` model + migration
4. Create `ModuleSummaryProvider` interface
5. Rewrite `DashboardController` with deferred props
6. Add new routes
7. Update `config/module.php` with announcement actions
8. Create all 16 frontend components (start with AdminStatsCards, PendingApprovalsCard, SubscriptionCard)
9. Rewrite `Core/Dashboard.jsx` with new layout
10. Implement ModuleSummaryProvider in each active module package
11. Write all tests
12. Run `php artisan hrmac:sync-modules`
13. Run `vendor/bin/pint --dirty`
14. Run `php artisan test --filter=Dashboard`

