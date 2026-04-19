# Employee Dashboard Redesign — Full Implementation Prompt

## Objective
Redesign the **Employee Dashboard** (`/hrm/employee/dashboard`) as a comprehensive, production-ready "My Workspace" hub for regular employees. This requires changes to both the **backend** (`packages/aero-hrm`) and **frontend** (`packages/aero-ui`). The dashboard must surface data from every HRM submodule the employee has access to, replacing the current empty widget-only shell with a rich, hardcoded-section + dynamic-widget hybrid design.

---

## Current State Analysis

### What Exists Today
- **Backend**: `packages/aero-hrm/src/Http/Controllers/Employee/EmployeeDashboardController.php`
  - Passes: `employee` profile summary, `leaveBalances`, `pendingLeaves`, `recentLeaves`, `todayAttendance`, `attendanceStats` (month), `quickActions` (4 items), `dynamicWidgets`
  - Renders: `HRM/AIAnalytics/Dashboard` (wrong Inertia page — should render `HRM/Employee/Dashboard`)
- **Frontend**: `packages/aero-ui/resources/js/Pages/HRM/Employee/Dashboard.jsx`
  - Pure dynamic widget renderer — shows nothing if no widgets are registered
  - Does NOT use any of the backend data (`leaveBalances`, `attendanceStats`, etc.)
  - Missing: ThemedCard, useHRMAC, useThemeRadius, StatsCards, responsive patterns, quick actions UI
- **Widgets registered** (backend): `PunchStatusWidget`, `MyLeaveBalanceWidget`, `UpcomingHolidaysWidget`, `OrganizationInfoWidget`, `MyGoalsWidget`, `PendingReviewsWidget`, `PayrollSummaryWidget`, `TeamAttendanceWidget`, `PendingLeaveApprovalsWidget`
- **Self-Service pages exist** but are shallow stubs: Benefits, CareerPath, Documents, MyExpenses, Payslips, Performance, TimeOff, Trainings

### What's Wrong
1. Renders the wrong Inertia page (`HRM/AIAnalytics/Dashboard` instead of `HRM/Employee/Dashboard`)
2. Frontend ignores all Inertia props — leaveBalances, attendance, quick actions are never rendered
3. No hardcoded dashboard sections — relies entirely on dynamic widgets which may not be registered
4. Missing data from 15+ HRM submodules: training, performance, expenses, assets, documents, career path, feedback, grievances, onboarding tasks, overtime, benefits, pulse surveys, disciplinary, announcements, team info
5. No employee profile card / welcome banner
6. No notification/alert section
7. No quick actions grid
8. No upcoming events/calendar view
9. Self-service controller methods return empty arrays — no actual data

---

## Implementation Scope

### PHASE 1: Backend — Enrich EmployeeDashboardController

**File**: `packages/aero-hrm/src/Http/Controllers/Employee/EmployeeDashboardController.php`

#### 1.1 Fix Inertia Render Target
```php
// CHANGE FROM:
return Inertia::render('HRM/AIAnalytics/Dashboard', [...]);
// CHANGE TO:
return Inertia::render('HRM/Employee/Dashboard', [...]);
```

#### 1.2 Add Missing Data — Full Props List
The controller must pass ALL of the following to the frontend. Use eager loading and query optimization. Each section should be wrapped in a try/catch so one failure doesn't break the entire dashboard.

```php
return Inertia::render('HRM/Employee/Dashboard', [
    'title' => 'My Dashboard',

    // ── 1. Employee Profile Card ──
    'employee' => [
        'id', 'name', 'full_name', 'email', 'phone',
        'employee_code', 'avatar' (profile_image_url),
        'department' => name, 'designation' => name,
        'manager' => ['name', 'avatar', 'designation'],
        'date_of_joining', 'employment_type', 'status',
        'tenure_formatted', 'probation_end_date', 'is_on_probation',
        'work_location', 'shift',
    ],

    // ── 2. Attendance Section ──
    'todayAttendance' => [
        'clock_in', 'clock_out', 'status', 'worked_hours',
        'is_late', 'expected_hours',
    ],
    'attendanceStats' => [  // current month
        'present_days', 'absent_days', 'late_days',
        'total_hours', 'average_hours_per_day',
        'working_days_in_month', 'attendance_percentage',
    ],
    'weeklyAttendance' => [  // NEW — last 7 days for mini chart
        ['date', 'status', 'worked_hours', 'clock_in', 'clock_out'],
    ],

    // ── 3. Leave Section ──
    'leaveBalances' => [  // already exists — keep
        ['leave_type', 'total', 'used', 'remaining', 'pending'],
    ],
    'pendingLeaves' => [...],  // already exists — keep
    'recentLeaves' => [...],   // already exists — keep
    'upcomingApprovedLeaves' => [  // NEW — next approved leaves
        ['id', 'type', 'start_date', 'end_date', 'days', 'status'],
    ],

    // ── 4. Payroll Section ── (NEW)
    'latestPayslip' => [
        'id', 'month', 'year', 'net_pay', 'gross_pay',
        'total_deductions', 'total_allowances',
        'payment_date', 'status', 'download_url',
    ],
    'payrollHistory' => [  // last 6 months summary for chart
        ['month', 'year', 'net_pay', 'gross_pay'],
    ],

    // ── 5. Performance Section ── (NEW)
    'currentReview' => [
        'id', 'cycle_name', 'status', 'overall_score',
        'reviewer_name', 'due_date', 'self_assessment_status',
    ],
    'myKPIs' => [
        ['id', 'name', 'target', 'actual', 'percentage', 'status'],
    ],
    'myGoals' => [
        ['id', 'title', 'status', 'progress_percentage', 'due_date', 'priority'],
    ],

    // ── 6. Training Section ── (NEW)
    'myTrainings' => [
        ['id', 'name', 'category', 'status', 'start_date', 'end_date',
         'progress_percentage', 'is_mandatory'],
    ],
    'upcomingTrainingSessions' => [
        ['id', 'training_name', 'session_date', 'location', 'trainer_name'],
    ],
    'certifications' => [
        ['id', 'name', 'issued_date', 'expiry_date', 'is_expired', 'is_expiring_soon'],
    ],

    // ── 7. Expenses Section ── (NEW)
    'expenseSummary' => [
        'pending_count', 'pending_amount',
        'approved_this_month', 'rejected_this_month',
        'total_claimed_ytd',
    ],
    'recentExpenses' => [
        ['id', 'title', 'amount', 'category', 'status', 'submitted_date'],
    ],

    // ── 8. Assets Section ── (NEW)
    'myAssets' => [
        ['id', 'name', 'category', 'serial_number', 'allocated_date',
         'condition', 'return_date'],
    ],

    // ── 9. Documents Section ── (NEW)
    'myDocuments' => [
        ['id', 'name', 'type', 'uploaded_date', 'expiry_date',
         'is_expired', 'is_expiring_soon', 'download_url'],
    ],
    'documentAlerts' => [  // documents expiring within 30 days
        ['id', 'name', 'expiry_date', 'days_until_expiry'],
    ],

    // ── 10. Career & Development Section ── (NEW)
    'careerPath' => [
        'current_position', 'next_position', 'progress_percentage',
        'milestones' => [['name', 'status', 'completed_date']],
    ],
    'skills' => [
        ['id', 'name', 'proficiency_level', 'verified'],
    ],

    // ── 11. 360° Feedback Section ── (NEW)
    'pendingFeedbackRequests' => [
        ['id', 'subject_name', 'cycle_name', 'due_date', 'status'],
    ],
    'myFeedbackSummary' => [
        'average_score', 'total_reviews', 'last_review_date',
    ],

    // ── 12. Onboarding Section ── (NEW — show if employee is still onboarding)
    'onboardingProgress' => [
        'is_onboarding', 'total_tasks', 'completed_tasks',
        'progress_percentage',
        'pending_tasks' => [['id', 'name', 'due_date', 'status', 'category']],
    ],

    // ── 13. Team Section ── (NEW)
    'teamInfo' => [
        'department_name', 'team_size', 'manager' => ['name', 'avatar'],
        'teammates' => [['id', 'name', 'avatar', 'designation', 'status']],
        'team_birthdays_this_month' => [['name', 'birthday', 'avatar']],
        'team_work_anniversaries' => [['name', 'anniversary_date', 'years', 'avatar']],
    ],

    // ── 14. Overtime Section ── (NEW)
    'overtimeSummary' => [
        'pending_requests', 'approved_this_month_hours',
        'total_overtime_ytd_hours',
    ],

    // ── 15. Grievances & Disciplinary ── (NEW — limited employee view)
    'myGrievances' => [
        ['id', 'subject', 'status', 'submitted_date', 'last_update'],
    ],
    'activeWarnings' => [  // only show count, not details for sensitivity
        'count', 'latest_date',
    ],

    // ── 16. Holidays & Events ── (NEW)
    'upcomingHolidays' => [
        ['id', 'name', 'date', 'type', 'is_optional'],
    ],
    'companyEvents' => [
        ['id', 'title', 'date', 'location', 'type', 'is_registered'],
    ],

    // ── 17. Notifications & Alerts ── (NEW)
    'alerts' => [
        // Aggregated from: document expiry, certification expiry, pending approvals,
        // probation ending, birthday wishes, contract expiry, etc.
        ['type', 'title', 'message', 'severity', 'action_url', 'created_at'],
    ],

    // ── 18. Pulse Surveys ── (NEW)
    'activeSurveys' => [
        ['id', 'title', 'description', 'due_date', 'is_completed'],
    ],

    // ── 19. Quick Actions ── (ENHANCED)
    'quickActions' => [
        ['id', 'label', 'icon', 'route', 'color', 'badge_count'],
        // Include: Apply Leave, View Payslip, My Profile, Attendance History,
        // Submit Expense, View Documents, My Trainings, My Performance,
        // Submit Grievance, Request Overtime, Clock In/Out
    ],

    // ── 20. Benefits Section ── (NEW)
    'myBenefits' => [
        ['id', 'name', 'type', 'status', 'start_date', 'end_date', 'value'],
    ],

    // ── 21. Dynamic Widgets ── (keep existing)
    'dynamicWidgets' => $widgets,
]);
```

#### 1.3 Create a Dedicated Service Class
Create `packages/aero-hrm/src/Services/EmployeeDashboardService.php` to encapsulate all the data-fetching logic. The controller should be thin — just call the service and pass results to Inertia.

```php
class EmployeeDashboardService
{
    public function getAttendanceData(Employee $employee): array { ... }
    public function getLeaveData(Employee $employee): array { ... }
    public function getPayrollData(Employee $employee): array { ... }
    public function getPerformanceData(Employee $employee): array { ... }
    public function getTrainingData(Employee $employee): array { ... }
    public function getExpenseData(Employee $employee): array { ... }
    public function getAssetData(Employee $employee): array { ... }
    public function getDocumentData(Employee $employee): array { ... }
    public function getCareerData(Employee $employee): array { ... }
    public function getFeedbackData(Employee $employee): array { ... }
    public function getOnboardingData(Employee $employee): array { ... }
    public function getTeamData(Employee $employee): array { ... }
    public function getOvertimeData(Employee $employee): array { ... }
    public function getGrievanceData(Employee $employee): array { ... }
    public function getHolidayData(): array { ... }
    public function getAlerts(Employee $employee): array { ... }
    public function getSurveyData(Employee $employee): array { ... }
    public function getQuickActions(Employee $employee): array { ... }
    public function getBenefitData(Employee $employee): array { ... }
}
```

Each method must:
- Use try/catch so failures return empty defaults instead of breaking the whole dashboard
- Use eager loading to prevent N+1 queries
- Limit result sets (e.g., `->take(5)` for recent items, `->take(10)` for lists)
- Filter by the authenticated employee only (never expose other employees' data)
- Respect HRMAC permissions — only return data the employee is authorized to see

#### 1.4 Add API Endpoints for Lazy-Loaded Sections
Some sections (full attendance history, full expense list, full training catalog) should NOT be loaded on initial page load. Create API endpoints for on-demand loading:

```php
// routes/web.php additions under employee routes:
Route::prefix('employee/dashboard')->group(function () {
    Route::get('/attendance-chart', [EmployeeDashboardController::class, 'attendanceChart'])
        ->name('hrm.employee.dashboard.attendance-chart');
    Route::get('/payroll-chart', [EmployeeDashboardController::class, 'payrollChart'])
        ->name('hrm.employee.dashboard.payroll-chart');
    Route::get('/training-progress', [EmployeeDashboardController::class, 'trainingProgress'])
        ->name('hrm.employee.dashboard.training-progress');
    Route::get('/team-details', [EmployeeDashboardController::class, 'teamDetails'])
        ->name('hrm.employee.dashboard.team-details');
});
```

#### 1.5 Also Update EmployeeSelfServiceController
The self-service controller (`EmployeeSelfServiceController.php`) currently returns empty arrays for ALL methods. Update each method to query real data from the relevant models. For each:
- `documents()` → Query `EmployeePersonalDocument`, `HrDocument` for the employee
- `benefits()` → Query `Benefit` records linked to the employee
- `trainings()` → Query `TrainingEnrollment`, `TrainingAssignment` with training details
- `payslips()` → Query `Payslip` records for the employee
- `performance()` → Query `PerformanceReview`, `KPI`, `KPIValue` for the employee
- `careerPath()` → Query `EmployeeCareerProgression`, `CareerPath`, `CareerPathMilestone`
- `timeOff()` → Query `Leave` records for the employee

---

### PHASE 2: Frontend — Redesign Dashboard Page

**File**: `packages/aero-ui/resources/js/Pages/HRM/Employee/Dashboard.jsx`

#### 2.1 Page Structure (Follow LeavesAdmin.jsx Gold Standard)
The page must follow the exact AEOS page layout pattern:

```
<Head title={title} />
<div className="flex flex-col w-full h-full p-4">
  <div className="space-y-6">

    {/* Section 1: Welcome Banner + Employee Profile Card */}
    <WelcomeBanner employee={employee} todayAttendance={todayAttendance} />

    {/* Section 2: Alerts & Notifications Bar */}
    {alerts.length > 0 && <AlertsBar alerts={alerts} />}

    {/* Section 3: Onboarding Progress (if still onboarding) */}
    {onboardingProgress?.is_onboarding && <OnboardingProgressCard data={onboardingProgress} />}

    {/* Section 4: Quick Actions Grid */}
    <QuickActionsGrid actions={quickActions} isMobile={isMobile} />

    {/* Section 5: Stats Row — Key Metrics */}
    <StatsCards stats={statsData} />

    {/* Section 6: Main Content — 2/3 + 1/3 Grid */}
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

      {/* Left Column (2/3) */}
      <div className="lg:col-span-2 space-y-6">
        <AttendanceCard todayAttendance={todayAttendance} weeklyAttendance={weeklyAttendance} stats={attendanceStats} />
        <LeaveCard balances={leaveBalances} pending={pendingLeaves} upcoming={upcomingApprovedLeaves} />
        <PerformanceCard review={currentReview} kpis={myKPIs} goals={myGoals} />
        <TrainingCard trainings={myTrainings} sessions={upcomingTrainingSessions} certs={certifications} />
        <PayrollCard latestPayslip={latestPayslip} history={payrollHistory} />
        <ExpensesCard summary={expenseSummary} recent={recentExpenses} />
      </div>

      {/* Right Column (1/3) */}
      <div className="space-y-6">
        <PunchClockWidget todayAttendance={todayAttendance} />
        <UpcomingHolidaysCard holidays={upcomingHolidays} />
        <TeamCard teamInfo={teamInfo} />
        <MyAssetsCard assets={myAssets} />
        <DocumentsCard documents={myDocuments} alerts={documentAlerts} />
        <CareerPathCard careerPath={careerPath} skills={skills} />
        <FeedbackCard pending={pendingFeedbackRequests} summary={myFeedbackSummary} />
        <SurveysCard surveys={activeSurveys} />
        <BenefitsCard benefits={myBenefits} />
      </div>
    </div>

    {/* Section 7: Full-Width Sections */}
    <EventsCalendar events={companyEvents} holidays={upcomingHolidays} />

    {/* Section 8: Dynamic Widgets (from widget registry) */}
    {dynamicWidgets.length > 0 && <DynamicWidgetRenderer widgets={dynamicWidgets} />}
  </div>
</div>
```

#### 2.2 Required Imports & Hooks
```jsx
import { Head, usePage, Link } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { useThemeRadius } from '@/Hooks/useThemeRadius';
import { useHRMAC } from '@/Hooks/useHRMAC';
import { useMediaQuery } from '@/Hooks/useMediaQuery'; // or isMobile/isTablet pattern
import { ThemedCard, ThemedCardHeader, ThemedCardBody } from '@/Components/UI/ThemedCard';
import StatsCards from '@/Components/StatsCards';
import { showToast } from '@/utils/toastUtils';
import App from '@/Layouts/App';
```

#### 2.3 Component Details for Each Section

##### Welcome Banner
- Employee avatar, name, designation, department
- Greeting based on time of day ("Good morning, John!")
- Quick status: "You clocked in at 9:00 AM" or "You haven't clocked in yet"
- Today's date, day of week
- Tenure badge: "3 years, 2 months"
- Probation indicator if applicable

##### Alerts Bar
- Horizontal scrollable alert chips using HeroUI `Chip` components
- Color-coded by severity: `danger` (expired docs), `warning` (expiring soon), `primary` (info), `success` (celebrations)
- Dismissible alerts
- Types: document expiry, certification expiry, probation ending, birthday wish, work anniversary, pending approvals, upcoming training

##### Quick Actions Grid
- Grid of action cards (2 cols mobile, 4 cols tablet, 6 cols desktop)
- Each card: icon, label, optional badge count (e.g., "3 pending" on Leave)
- Use HeroUI `Card` with `isPressable`
- Navigate via `router.visit()` to respective self-service pages
- Include ALL: Apply Leave, Clock In/Out, View Payslip, My Profile, Submit Expense, My Documents, My Trainings, My Performance, Request Overtime, Submit Grievance, My Goals

##### Stats Row
- Use existing `StatsCards` component
- Cards: Attendance % this month, Leave Balance (total remaining), Pending Requests (leaves+expenses+overtime), Training Progress %, Performance Score, Overtime Hours

##### Attendance Card (ThemedCard)
- Today's punch status with clock-in/out times
- Mini bar chart: last 7 days worked hours (use simple CSS bars or a small chart)
- Monthly stats: present/absent/late with progress ring
- "View Full History" link → `/hrm/attendance-employee`

##### Leave Card (ThemedCard)
- Leave balance bars (horizontal progress bars per leave type)
- Pending leave requests table (compact, max 5 rows)
- Upcoming approved leaves highlighted
- "Apply Leave" button, "View All" link

##### Performance Card (ThemedCard)
- Current review cycle status with progress indicator
- KPI progress bars (top 5 KPIs)
- Goals list with status chips and progress %
- "View My Performance" link

##### Training Card (ThemedCard)
- Active training enrollments with progress bars
- Upcoming sessions with date/time
- Certifications with expiry status (Chip color: success=valid, warning=expiring, danger=expired)
- "View My Trainings" link

##### Payroll Card (ThemedCard)
- Latest payslip summary: gross, deductions, net pay
- Mini line chart: net pay trend last 6 months
- "Download Payslip" button, "View All Payslips" link

##### Expenses Card (ThemedCard)
- Summary: pending count/amount, approved this month, YTD total
- Recent expenses table (compact, max 5)
- "Submit Expense" button, "View All" link

##### Punch Clock Widget (Sidebar)
- Large clock-in/out button (like the existing PunchStatusWidget)
- Current status display
- Today's timeline: clock-in → breaks → clock-out

##### Upcoming Holidays Card (Sidebar)
- Next 5 holidays with date and type
- Calendar icon per holiday

##### Team Card (Sidebar)
- Manager info card
- Team members list (avatars + names, max 8)
- This month's birthdays and work anniversaries
- "View Org Chart" link

##### My Assets Card (Sidebar)
- List of allocated assets with category icons
- Return date if applicable

##### Documents Card (Sidebar)
- Expiring soon documents highlighted
- Quick upload button
- Document count by type

##### Career Path Card (Sidebar)
- Visual progress from current → next position
- Milestone checklist
- Skills radar or simple skill bars

##### Feedback Card (Sidebar)
- Pending feedback count with "Submit" action
- Average feedback score

##### Surveys Card (Sidebar)
- Active surveys with "Take Survey" button
- Due date display

##### Benefits Card (Sidebar)
- Active benefits list
- Enrollment status

#### 2.4 Sub-Components to Create
Create these as separate files in `packages/aero-ui/resources/js/Components/EmployeeDashboard/`:

```
Components/EmployeeDashboard/
├── WelcomeBanner.jsx
├── AlertsBar.jsx
├── QuickActionsGrid.jsx
├── AttendanceCard.jsx
├── LeaveCard.jsx
├── PerformanceCard.jsx
├── TrainingCard.jsx
├── PayrollCard.jsx
├── ExpensesCard.jsx
├── PunchClockWidget.jsx
├── TeamCard.jsx
├── MyAssetsCard.jsx
├── DocumentsCard.jsx
├── CareerPathCard.jsx
├── FeedbackCard.jsx
├── SurveysCard.jsx
├── BenefitsCard.jsx
├── OnboardingProgressCard.jsx
├── EventsCalendar.jsx
└── MiniChart.jsx  (reusable simple bar/line chart using CSS or HeroUI Progress)
```

#### 2.5 Mandatory Frontend Patterns

Every sub-component MUST:
- Use `ThemedCard` or `className="aero-card"` for card wrappers
- Use `useThemeRadius()` for all HeroUI component `radius` props
- Use HeroUI components (Button, Chip, Progress, Table, Skeleton, Avatar, Badge)
- Include `dark:` Tailwind variants for all color-dependent classes
- Use `motion.div` for section entry animations
- Use `<Link href={route('...')}>` for all internal navigation
- Show `<Skeleton>` while data is loading (section-level, NOT full-page)
- Gate actions behind `useHRMAC()` permissions where applicable
- Be responsive: use `isMobile` checks for layout adjustments

#### 2.6 Responsive Design Requirements
- **Mobile (<640px)**: Single column, collapsible cards, compact stats row
- **Tablet (640-1024px)**: 2-column grid for main content
- **Desktop (>1024px)**: Full 2/3 + 1/3 layout with all sections visible

---

### PHASE 3: New Widgets to Register

Create new backend widgets in `packages/aero-hrm/src/Widgets/` and frontend widgets in `packages/aero-ui/resources/js/Widgets/HRM/`:

| Widget | Backend | Frontend | Position |
|--------|---------|----------|----------|
| MyExpenseSummaryWidget | ✅ NEW | ✅ NEW | stats_row |
| MyAssetsWidget | ✅ NEW | ✅ NEW | sidebar |
| MyDocumentAlertsWidget | ✅ NEW | ✅ NEW | sidebar |
| MyTrainingProgressWidget | ✅ NEW | ✅ NEW | main_left |
| MyCareerPathWidget | ✅ NEW | ✅ NEW | sidebar |
| PendingFeedbackWidget | ✅ NEW | ✅ NEW | sidebar |
| ActiveSurveysWidget | ✅ NEW | ✅ NEW | sidebar |
| MyOvertimeWidget | ✅ NEW | ✅ NEW | stats_row |
| TeamBirthdaysWidget | ✅ NEW | ✅ NEW | sidebar |
| OnboardingChecklist Widget | ✅ NEW | ✅ NEW | welcome |
| MyBenefitsWidget | ✅ NEW | ✅ NEW | sidebar |
| CertificationExpiryWidget | ✅ NEW | ✅ NEW | sidebar |

Register all new widgets in `AeroHrmServiceProvider.php` under the `hrm.employee` dashboard scope.

Update `packages/aero-ui/resources/js/Widgets/HRM/index.js` to export all new widgets.

---

### PHASE 4: Evolving HRM Features (Missing from Package)

These features have models/migrations but **incomplete or missing** implementations. Add them as part of this dashboard redesign:

#### 4.1 Employee Announcements / Company News Feed
- **Missing Model**: No `Announcement` model exists
- **Create**: `Announcement` model, migration (`announcements` table: `id`, `title`, `content`, `type`, `priority`, `published_at`, `expires_at`, `created_by`, `department_id` nullable, `is_pinned`)
- **Controller**: `AnnouncementController` with `latest()` endpoint
- **Dashboard Integration**: Show latest 5 announcements in a "News & Announcements" card
- **Widget**: `CompanyAnnouncementsWidget`

#### 4.2 Employee Recognition / Kudos
- **Missing Model**: No recognition/kudos system exists
- **Create**: `Recognition` model, migration (`recognitions` table: `id`, `sender_id`, `recipient_id`, `message`, `badge_type`, `is_public`, `created_at`)
- **Controller**: `RecognitionController` with `give()`, `myRecognitions()` methods
- **Dashboard Integration**: "Recognition Wall" card showing recent kudos, ability to give kudos from dashboard
- **Widget**: `RecognitionWallWidget`

#### 4.3 Employee Mood / Daily Check-In
- **Missing**: No daily mood/wellness tracking
- **Create**: `DailyCheckIn` model, migration (`daily_check_ins` table: `id`, `employee_id`, `date`, `mood` enum(great,good,okay,bad,terrible), `note`, `is_anonymous`)
- **Dashboard Integration**: Quick mood selector at top of dashboard (emoji picker), anonymous aggregate mood chart for team
- **Widget**: `DailyMoodWidget`

#### 4.4 Time Tracker / Timesheet Quick Entry
- **Existing**: `TimeSheet` model and page exist
- **Missing on Dashboard**: No quick timesheet entry from dashboard
- **Dashboard Integration**: "Log Today's Work" mini form — project selector, hours, description, submit
- **Widget**: `QuickTimeEntryWidget`

#### 4.5 Pending Approvals (for employees who are also managers)
- **Missing on Dashboard**: Managers see nothing about their approval queue
- **Dashboard Integration**: If employee is a manager, show "Pending Approvals" card with counts for: leave requests, expense claims, overtime requests, timesheet approvals
- **Widget**: `ManagerApprovalsWidget`

#### 4.6 Compliance & Policy Acknowledgements
- **Missing**: No policy acknowledgement tracking
- **Create**: `PolicyAcknowledgement` model, migration (`policy_acknowledgements` table: `id`, `employee_id`, `document_id`, `acknowledged_at`, `version`)
- **Dashboard Integration**: "Action Required" banner for unacknowledged policies
- **Widget**: `PolicyAcknowledgementWidget`

#### 4.7 Employee Bookmarks / Favorites
- **Missing**: No way to bookmark/pin frequently used pages
- **Create**: `EmployeeBookmark` model, migration (`employee_bookmarks` table: `id`, `employee_id`, `label`, `route`, `icon`, `order`)
- **Dashboard Integration**: Customizable quick links section on dashboard
- **Widget**: Part of QuickActionsGrid

#### 4.8 Work-From-Home / Remote Status
- **Missing**: No WFH tracking
- **Create**: `WorkLocationLog` model, migration (`work_location_logs` table: `id`, `employee_id`, `date`, `location_type` enum(office,home,hybrid,field), `notes`)
- **Dashboard Integration**: Status indicator in Welcome Banner, quick toggle for WFH

---

### PHASE 5: Tests

Create PHPUnit feature tests in `packages/aero-hrm/tests/Feature/`:

```
tests/Feature/
├── EmployeeDashboardTest.php
│   ├── testEmployeeDashboardLoadsSuccessfully()
│   ├── testDashboardReturnsAllRequiredProps()
│   ├── testDashboardShowsOnlyOwnData()
│   ├── testDashboardHandlesEmployeeWithoutData()
│   ├── testDashboardApiEndpointsReturnCorrectData()
│   ├── testUnauthorizedUserCannotAccessDashboard()
│   ├── testManagerSeesApprovalCounts()
│   └── testOnboardingProgressShowsForNewEmployees()
```

---

### PHASE 6: Performance Optimization

1. **Use Inertia Deferred Props** for heavy sections: payroll history, training details, team details, career path
2. **Cache** employee dashboard stats for 5 minutes (per employee) using Laravel Cache
3. **Eager load** all relationships in a single query where possible
4. **Paginate** items that could grow large (expenses, leaves, trainings) — only show last 5 on dashboard
5. **Queue** data aggregation for stats that require complex calculations (performance scores, attendance percentages)

### Inertia Deferred Props Example:
```php
use Inertia\Inertia;

return Inertia::render('HRM/Employee/Dashboard', [
    // Immediate props (critical for initial render):
    'employee' => $employeeData,
    'todayAttendance' => $todayAttendance,
    'quickActions' => $quickActions,
    'alerts' => $alerts,

    // Deferred props (loaded after initial render):
    Inertia::defer(fn () => $this->dashboardService->getPayrollData($employee), 'payrollData'),
    Inertia::defer(fn () => $this->dashboardService->getTrainingData($employee), 'trainingData'),
    Inertia::defer(fn () => $this->dashboardService->getTeamData($employee), 'teamData'),
    Inertia::defer(fn () => $this->dashboardService->getCareerData($employee), 'careerData'),
    Inertia::defer(fn () => $this->dashboardService->getFeedbackData($employee), 'feedbackData'),
]);
```

On the frontend, use Inertia's `usePage()` and show Skeleton while deferred props are loading:
```jsx
const { payrollData } = usePage().props;
// payrollData will be undefined initially, then populated when deferred prop resolves
```

---

## Summary Checklist

### Backend Files to Create/Modify:
- [ ] `packages/aero-hrm/src/Services/EmployeeDashboardService.php` — NEW service class
- [ ] `packages/aero-hrm/src/Http/Controllers/Employee/EmployeeDashboardController.php` — REWRITE
- [ ] `packages/aero-hrm/src/Http/Controllers/Employee/EmployeeSelfServiceController.php` — FILL with real data
- [ ] `packages/aero-hrm/routes/web.php` — Add dashboard API endpoints
- [ ] `packages/aero-hrm/src/Widgets/` — 12 new widget classes
- [ ] `packages/aero-hrm/src/AeroHrmServiceProvider.php` — Register new widgets
- [ ] `packages/aero-hrm/src/Models/Announcement.php` — NEW model
- [ ] `packages/aero-hrm/src/Models/Recognition.php` — NEW model
- [ ] `packages/aero-hrm/src/Models/DailyCheckIn.php` — NEW model
- [ ] `packages/aero-hrm/src/Models/PolicyAcknowledgement.php` — NEW model
- [ ] `packages/aero-hrm/src/Models/EmployeeBookmark.php` — NEW model
- [ ] `packages/aero-hrm/src/Models/WorkLocationLog.php` — NEW model
- [ ] `packages/aero-hrm/database/migrations/` — Migrations for new models
- [ ] `packages/aero-hrm/database/factories/` — Factories for new models
- [ ] `packages/aero-hrm/tests/Feature/EmployeeDashboardTest.php` — NEW tests

### Frontend Files to Create/Modify:
- [ ] `packages/aero-ui/resources/js/Pages/HRM/Employee/Dashboard.jsx` — COMPLETE REWRITE
- [ ] `packages/aero-ui/resources/js/Components/EmployeeDashboard/WelcomeBanner.jsx` — NEW
- [ ] `packages/aero-ui/resources/js/Components/EmployeeDashboard/AlertsBar.jsx` — NEW
- [ ] `packages/aero-ui/resources/js/Components/EmployeeDashboard/QuickActionsGrid.jsx` — NEW
- [ ] `packages/aero-ui/resources/js/Components/EmployeeDashboard/AttendanceCard.jsx` — NEW
- [ ] `packages/aero-ui/resources/js/Components/EmployeeDashboard/LeaveCard.jsx` — NEW
- [ ] `packages/aero-ui/resources/js/Components/EmployeeDashboard/PerformanceCard.jsx` — NEW
- [ ] `packages/aero-ui/resources/js/Components/EmployeeDashboard/TrainingCard.jsx` — NEW
- [ ] `packages/aero-ui/resources/js/Components/EmployeeDashboard/PayrollCard.jsx` — NEW
- [ ] `packages/aero-ui/resources/js/Components/EmployeeDashboard/ExpensesCard.jsx` — NEW
- [ ] `packages/aero-ui/resources/js/Components/EmployeeDashboard/PunchClockWidget.jsx` — NEW
- [ ] `packages/aero-ui/resources/js/Components/EmployeeDashboard/TeamCard.jsx` — NEW
- [ ] `packages/aero-ui/resources/js/Components/EmployeeDashboard/MyAssetsCard.jsx` — NEW
- [ ] `packages/aero-ui/resources/js/Components/EmployeeDashboard/DocumentsCard.jsx` — NEW
- [ ] `packages/aero-ui/resources/js/Components/EmployeeDashboard/CareerPathCard.jsx` — NEW
- [ ] `packages/aero-ui/resources/js/Components/EmployeeDashboard/FeedbackCard.jsx` — NEW
- [ ] `packages/aero-ui/resources/js/Components/EmployeeDashboard/SurveysCard.jsx` — NEW
- [ ] `packages/aero-ui/resources/js/Components/EmployeeDashboard/BenefitsCard.jsx` — NEW
- [ ] `packages/aero-ui/resources/js/Components/EmployeeDashboard/OnboardingProgressCard.jsx` — NEW
- [ ] `packages/aero-ui/resources/js/Components/EmployeeDashboard/EventsCalendar.jsx` — NEW
- [ ] `packages/aero-ui/resources/js/Components/EmployeeDashboard/MiniChart.jsx` — NEW
- [ ] `packages/aero-ui/resources/js/Widgets/HRM/` — 12 new widget frontend components
- [ ] `packages/aero-ui/resources/js/Widgets/HRM/index.js` — UPDATE registry

### Constraints (Non-Negotiable):
- ALL code goes in `packages/aero-hrm/` and `packages/aero-ui/` — NEVER in `aeos365/`
- Use HeroUI components exclusively — no vanilla HTML buttons/inputs/tables
- Use `useHRMAC()` for all permission checks — never `auth.permissions?.includes()`
- Use `useThemeRadius()` — never inline `getThemeRadius()`
- Use `ThemedCard` or `.aero-card` for all card wrappers
- Use `showToast.promise()` for all async operations
- Use `<Link>` or `router.visit()` for all navigation — never `window.location`
- Support dark mode with `dark:` Tailwind variants
- Use Tailwind CSS v4 — no deprecated v3 utilities
- Skeleton loading per-section, never full-page spinners
- PHPUnit tests (not Pest)
- Run `vendor/bin/pint --dirty` before finalizing PHP changes
- Run `npm run build` from `aeos365/` to verify frontend compiles

### Existing Models Available (Use These, Don't Recreate):
`Employee`, `Attendance`, `AttendanceSetting`, `Leave`, `LeaveBalance`, `LeaveSetting`, `Payroll`, `Payslip`, `PayrollAllowance`, `PayrollDeduction`, `SalaryComponent`, `EmployeeSalaryStructure`, `PerformanceReview`, `PerformanceReviewTemplate`, `KPI`, `KPIValue`, `Training`, `TrainingEnrollment`, `TrainingSession`, `TrainingAssignment`, `TrainingFeedback`, `TrainingMaterial`, `ExpenseClaim`, `ExpenseCategory`, `Asset`, `AssetAllocation`, `AssetCategory`, `HrDocument`, `EmployeePersonalDocument`, `CareerPath`, `CareerPathMilestone`, `EmployeeCareerProgression`, `Competency`, `Skill`, `Feedback360`, `Feedback360Response`, `Onboarding`, `OnboardingTask`, `Offboarding`, `OffboardingTask`, `OvertimeRecord`, `OvertimeRequest`, `Grievance`, `GrievanceCategory`, `DisciplinaryCase`, `Warning`, `Holiday`, `Event`, `EventRegistration`, `PulseSurvey`, `PulseSurveyResponse`, `EngagementSurvey`, `EngagementSurveyResponse`, `SuccessionPlan`, `SuccessionCandidate`, `WorkforcePlan`, `Benefit`, `EmployeeCertification`, `CompensationAdjustment`, `CompensationHistory`, `CompensationReview`, `TransferHistory`, `PromotionHistory`, `ExitInterview`, `ShiftSchedule`, `Grade`, `Department`, `Designation`

### Existing Services Available (Reuse Where Possible):
`LeaveBalanceService`, `LeaveQueryService`, `LeaveSummaryService`, `AttendanceCalculationService`, `AttendancePunchService`, `PayrollCalculationService`, `PayslipService`, `PayrollReportService`, `EmployeeOnboardingService`, `EmployeeService`, `HRMAuthorizationService`, `HRMetricsAggregatorService`, `CompensatoryLeaveService`, `PerformanceReviewService`, `GoalSettingService`, `CompetencyMatrixService`, `AttritionPredictionService`, `BurnoutRiskService`, `SentimentAnalyticsService`, `TalentMobilityService`, `AnomalyDetectionService`

### Existing Widgets to Keep (Backend):
`PunchStatusWidget`, `MyLeaveBalanceWidget`, `UpcomingHolidaysWidget`, `OrganizationInfoWidget`, `MyGoalsWidget`, `PendingReviewsWidget`, `PayrollSummaryWidget`, `TeamAttendanceWidget`, `PendingLeaveApprovalsWidget`

### Existing Frontend Widgets to Keep:
`PunchStatusWidget.jsx`, `MyLeaveBalanceWidget.jsx`, `UpcomingHolidaysWidget.jsx`, `OrganizationInfoWidget.jsx`, `MyGoalsWidget.jsx`, `PendingReviewsWidget.jsx`, `PayrollSummaryWidget.jsx`, `TeamAttendanceWidget.jsx`, `PendingLeaveApprovalsWidget.jsx`
