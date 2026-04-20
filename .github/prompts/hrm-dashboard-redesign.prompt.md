---
description: "Redesign the HRM admin/manager dashboard with comprehensive backend service, enriched controller, and full frontend rewrite covering all 20+ HRM submodules"
name: "HRM Dashboard Redesign"
agent: "AEOS Lead Architect"
---

# HRM Dashboard Redesign — Full Implementation Prompt

## Objective
Redesign the **HRM Dashboard** (`/hrm/dashboard`) as a comprehensive HR command center for HR Managers and Admins. This requires changes to both the **backend** (`packages/aero-hrm`) and **frontend** (`packages/aero-ui`). The dashboard must surface actionable data from ALL 20+ HRM submodules — replacing the current widget-only shell with a rich, hardcoded-section + dynamic-widget hybrid design that matches the LeavesAdmin.jsx page pattern.

---

## Current State Analysis

### What Exists Today

**Backend**: `packages/aero-hrm/src/Http/Controllers/HRMDashboardController.php`
- `index()` — Passes: `stats` (12 counts: totalEmployees, activeEmployees, onLeaveToday, pendingLeaves, approvedLeaves, presentToday, absentToday, lateToday, averageAttendance, openPositions=0, pendingExpenses=0, newHiresThisMonth), `pendingLeaves` (10 recent pending leave requests), `departmentStats` (top 10 departments with attendance rates), `upcomingReviews` (empty — disabled due to missing column), `dynamicWidgets`
- `stats()` — Returns same stats + departments + empty recentActivities
- **Problems**: Controller has all business logic inline (no service layer), N+1 queries in department stats loop, performance reviews disabled, no caching, hardcoded limits
- Renders: `Inertia::render('HRM/Dashboard', [...])`

**Frontend**: `packages/aero-ui/resources/js/Pages/HRM/Dashboard.jsx` (194 lines)
- **Pure dynamic widget renderer** — shows NOTHING if no widgets are registered
- Does NOT use ANY of the backend props (stats, pendingLeaves, departmentStats, upcomingReviews are all IGNORED)
- Only renders `dynamicWidgets` grouped by position
- Missing: ThemedCard, useHRMAC, useThemeRadius, StatsCards, filters, no hardcoded sections
- Empty state shows generic "HR widgets will appear here" message

**HRM Widgets** (9 total, targeting `['hrm']` or `['hrm.employee']`):
| Widget | Target | Position | Data |
|--------|--------|----------|------|
| TeamAttendanceWidget | `hrm` | stats_row | presentToday, absentToday, onLeave, lateArrivals, attendanceRate |
| PayrollSummaryWidget | `hrm` | stats_row | totalPayroll, processed, pending, deductions (monthly) |
| OrganizationInfoWidget | `hrm` | sidebar | departments, designations, skills, competencies, work_locations counts |
| PendingLeaveApprovalsWidget | `hrm` | sidebar | pending leave list with employee info |
| PendingReviewsWidget | `hrm` | sidebar | pending performance reviews list |
| PunchStatusWidget | `hrm.employee` | main_left | employee punch in/out status |
| MyLeaveBalanceWidget | `hrm.employee` | main_right | personal leave balances |
| UpcomingHolidaysWidget | `hrm.employee` | main_left | upcoming holidays list |
| MyGoalsWidget | `hrm.employee` | main_right | personal goals progress |

**Routes** (2 dashboard routes):
- `GET /hrm/dashboard` → `hrm.dashboard` (middleware: `hrmac:hrm.dashboard`)
- `GET /hrm/dashboard/stats` → `hrm.dashboard.stats`

**Config gap**: `config/module.php` has NO `dashboard` submodule entry — the route uses `hrmac:hrm.dashboard` but there's no matching 4-level hierarchy for it.

### What's Wrong
1. **Frontend ignores ALL Inertia props** — stats, pendingLeaves, departmentStats, upcomingReviews are passed from backend but never rendered
2. **No hardcoded dashboard sections** — relies entirely on 5 dynamic widgets (only those targeting `['hrm']`)
3. **Controller has all logic inline** — no HrmDashboardService, no caching, N+1 queries
4. **Performance reviews disabled** — commented out due to missing column
5. **Missing data from 15+ submodules**: recruitment pipeline, training progress, expense approvals, asset allocations, disciplinary cases, grievances, overtime requests, compensation reviews, workforce planning, pulse surveys, feedback 360, succession planning, career pathing, safety incidents, onboarding/offboarding progress
6. **No charts/visualizations** — no attendance trends, no headcount trends, no leave distribution, no department comparison, no payroll trends
7. **No quick actions panel** — no permission-gated action buttons for common HR tasks
8. **No alerts/notifications section** — no contract expirations, probation endings, birthday reminders, work anniversary alerts
9. **No recruitment funnel overview** — despite full recruitment module with Job, JobApplication, JobInterview, JobOffer models
10. **No training compliance tracker** — Training, TrainingAssignment, Certification models exist but not surfaced
11. **No workforce analytics summary** — WorkforcePlan, WorkforcePlanPosition models exist but not surfaced
12. **openPositions and pendingExpenses hardcoded to 0** — never integrated with actual data
13. **No config/module.php dashboard submodule** — HRMAC entry missing

---

## Implementation Scope

### PHASE 1: Backend — New HrmDashboardService

**Create**: `packages/aero-hrm/src/Services/HrmDashboardService.php`

This service replaces ALL inline logic from the controller. Each method is independently try/catch wrapped. All queries use caching (2-5 min TTL).

```php
class HrmDashboardService
{
    // ── Employee Stats ──
    public function getEmployeeStats(): array
    // Returns: totalEmployees, activeEmployees, inactiveEmployees, 
    // onProbation, contractExpiringSoon (30 days), newHiresThisMonth,
    // newHiresLastMonth, growthRate (% change), terminationsThisMonth,
    // averageTenure, headcountByType (permanent/contract/intern/part-time),
    // genderDistribution (male/female/other/undisclosed)
    // Cache: 5 min

    // ── Attendance Overview ──
    public function getAttendanceOverview(): array
    // Returns: presentToday, absentToday, onLeaveToday, lateToday,
    // averageAttendanceRate (month), attendanceTrend[] (last 30 days chart data),
    // lateArrivalTrend[] (last 30 days), topLateArrivals[] (top 5 employees),
    // shiftDistribution (morning/afternoon/night counts)
    // Cache: 2 min

    // ── Leave Overview ──
    public function getLeaveOverview(): array
    // Returns: pendingLeaves (count), approvedThisMonth, rejectedThisMonth,
    // leaveDistribution (by type — sick/casual/annual/etc.),
    // pendingLeaveRequests[] (top 10 with employee info),
    // upcomingLeaves[] (next 7 days approved leaves),
    // leaveUtilizationRate (used vs total allocated),
    // highAbsenteeism[] (employees with > X leaves this quarter)
    // Cache: 3 min

    // ── Payroll Overview ──
    public function getPayrollOverview(): array
    // Returns: lastPayrollDate, lastPayrollTotal, pendingPayrolls,
    // totalPayrollCostMTD, totalPayrollCostYTD,
    // payrollTrend[] (last 6 months chart data),
    // pendingExpenseClaims (count + total amount),
    // outstandingLoans (count + total amount),
    // upcomingIncrements (count — CompensationAdjustment due soon)
    // Cache: 10 min

    // ── Department Analytics ──
    public function getDepartmentAnalytics(): array
    // Returns: departments[] with {name, headcount, attendanceRate, leaveRate,
    // avgPerformanceScore, openPositions, budgetUtilization}
    // Sorted by headcount desc, top 15
    // Cache: 10 min

    // ── Recruitment Pipeline ──
    public function getRecruitmentPipeline(): array
    // Returns: openPositions (Job count where status=open),
    // totalApplications, applicationsThisMonth,
    // pipelineStages[] (stage => count from JobApplication),
    // upcomingInterviews[] (next 7 days from JobInterview),
    // recentOffers[] (last 5 JobOffer), timeToHire (average days),
    // offerAcceptanceRate
    // Sources: Job, JobApplication, JobInterview, JobOffer models
    // Cache: 5 min

    // ── Performance Overview ──
    public function getPerformanceOverview(): array
    // Returns: activeReviewCycles (PerformanceReview where status=in_progress),
    // pendingReviews (count), completedThisQuarter,
    // averageScore (company-wide), scoreDistribution (1-5 buckets),
    // topPerformers[] (top 5), underperformers[] (bottom 5),
    // upcomingReviewDeadlines[], kpiCompletionRate
    // Sources: PerformanceReview, KPI, KPIValue models
    // Cache: 10 min

    // ── Training & Development ──
    public function getTrainingOverview(): array
    // Returns: activeTrainings (Training where status=active),
    // upcomingTrainings[] (next 30 days), enrollmentCount (this month),
    // completionRate (completed/total assignments),
    // certificationsExpiring[] (next 60 days from EmployeeCertification),
    // trainingBudgetUsed, mandatoryTrainingCompliance (% employees completed),
    // topTrainingCategories[] (by enrollment count)
    // Sources: Training, TrainingAssignment, TrainingEnrollment, 
    //          EmployeeCertification, TrainingCategory models
    // Cache: 10 min

    // ── Expense Claims ──  
    public function getExpenseOverview(): array
    // Returns: pendingClaims (count + total amount),
    // approvedThisMonth (count + total), rejectedThisMonth,
    // topCategories[] (by amount), recentClaims[] (last 10),
    // claimsTrend[] (last 6 months chart data)
    // Sources: ExpenseClaim, ExpenseCategory models
    // Cache: 5 min

    // ── Asset Management ──
    public function getAssetOverview(): array
    // Returns: totalAssets, allocatedAssets, availableAssets,
    // maintenanceDue (count), recentAllocations[] (last 5),
    // assetsByCategory[] (category => count),
    // pendingReturns (count from AssetAllocation where return pending)
    // Sources: Asset, AssetAllocation, AssetCategory models
    // Cache: 10 min

    // ── Disciplinary & Grievances ──
    public function getDisciplinaryOverview(): array
    // Returns: openCases (DisciplinaryCase where status != closed),
    // pendingInvestigations, recentCases[] (last 5),
    // warningsIssuedThisMonth, openGrievances (Grievance count),
    // grievancesByCategory[], avgResolutionTime
    // Sources: DisciplinaryCase, Warning, Grievance, GrievanceCategory models
    // Cache: 10 min

    // ── Onboarding/Offboarding ──
    public function getOnOffboardingOverview(): array
    // Returns: activeOnboardings (Onboarding where status=in_progress),
    // completedOnboardingsThisMonth, onboardingCompletionRate,
    // pendingOnboardingTasks (OnboardingTask count),
    // activeOffboardings, upcomingExitDates[] (next 30 days),
    // pendingExitInterviews (ExitInterview where status=pending)
    // Sources: Onboarding, OnboardingTask, Offboarding, ExitInterview models
    // Cache: 5 min

    // ── HR Alerts & Reminders ──
    public function getAlerts(): array
    // Returns: contractExpiring[] (Employee where contract ends in 30 days),
    // probationEnding[] (Employee where probation_end_date in 14 days),
    // birthdaysThisWeek[] (Employee by date_of_birth),
    // workAnniversaries[] (Employee by joining_date, this week),
    // documentExpiring[] (EmployeePersonalDocument expiring in 30 days),
    // certificationExpiring[] (EmployeeCertification in 60 days),
    // pendingPolicyAcknowledgements (PolicyAcknowledgement count)
    // Cache: 10 min

    // ── Quick Actions ──
    public function getQuickActions(): array
    // Returns: permission-gated action list with routes
    // Groups: Employees, Leave, Attendance, Payroll, Recruitment, Settings
    // Each action: { label, icon, route, permission, badge? (pending count) }

    // ── Overtime Overview ──
    public function getOvertimeOverview(): array
    // Returns: pendingRequests (OvertimeRequest count), approvedThisMonth,
    // totalOvertimeHoursThisMonth, topOvertimeEmployees[] (top 5),
    // overtimeCostThisMonth
    // Sources: OvertimeRequest, OvertimeRecord models
    // Cache: 5 min

    // ── Pulse Survey & Engagement ──
    public function getEngagementOverview(): array
    // Returns: activeSurveys (PulseSurvey where status=active),
    // latestSurveyScore (average from PulseSurveyResponse),
    // responseRate (last survey), engagementTrend[] (last 6 surveys),
    // recognitionCount (Recognition this month),
    // pendingFeedback360 (Feedback360 where status=pending count)
    // Sources: PulseSurvey, PulseSurveyResponse, Recognition, 
    //          Feedback360, EngagementSurvey models
    // Cache: 10 min

    // ── Succession & Workforce Planning ──
    public function getSuccessionOverview(): array
    // Returns: activePlans (SuccessionPlan count),
    // criticalRolesWithoutSuccessors, readyNowCandidates,
    // workforcePlans (WorkforcePlan count), plannedPositions,
    // filledVsPlanned (percentage)
    // Sources: SuccessionPlan, SuccessionCandidate, WorkforcePlan, 
    //          WorkforcePlanPosition models
    // Cache: 15 min

    // ── Safety Incidents ──
    public function getSafetyOverview(): array
    // Returns: incidentsThisMonth (SafetyIncident count),
    // openInvestigations, daysSinceLastIncident,
    // incidentsByType[], upcomingInspections (SafetyInspection),
    // trainingCompliance (SafetyTraining completion rate)
    // Sources: SafetyIncident, SafetyInspection, SafetyTraining models
    // Cache: 10 min

    // ── Compensation Planning ──
    public function getCompensationOverview(): array
    // Returns: pendingAdjustments (CompensationAdjustment count),
    // adjustmentsThisYear, averageSalaryIncrease (%),
    // compensationReviewsDue, budgetUtilization
    // Sources: CompensationAdjustment, CompensationReview, 
    //          CompensationHistory models
    // Cache: 15 min
}
```

#### 1.1 Rewrite HRMDashboardController

**File**: `packages/aero-hrm/src/Http/Controllers/HRMDashboardController.php`

```php
public function __construct(private HrmDashboardService $dashboardService) {}

public function index(): Response
{
    return Inertia::render('HRM/Dashboard', [
        'title' => 'HRM Dashboard',
        
        // Immediate props (fast, small data)
        'employeeStats' => $this->dashboardService->getEmployeeStats(),
        'quickActions' => $this->dashboardService->getQuickActions(),
        'alerts' => $this->dashboardService->getAlerts(),
        
        // Deferred props (loaded async after page shell renders)
        'attendanceOverview' => Inertia::defer(fn () => 
            $this->dashboardService->getAttendanceOverview()
        ),
        'leaveOverview' => Inertia::defer(fn () => 
            $this->dashboardService->getLeaveOverview()
        ),
        'payrollOverview' => Inertia::defer(fn () => 
            $this->dashboardService->getPayrollOverview()
        ),
        'departmentAnalytics' => Inertia::defer(fn () => 
            $this->dashboardService->getDepartmentAnalytics()
        ),
        'recruitmentPipeline' => Inertia::defer(fn () => 
            $this->dashboardService->getRecruitmentPipeline()
        ),
        'performanceOverview' => Inertia::defer(fn () => 
            $this->dashboardService->getPerformanceOverview()
        ),
        'trainingOverview' => Inertia::defer(fn () => 
            $this->dashboardService->getTrainingOverview()
        ),
        'expenseOverview' => Inertia::defer(fn () => 
            $this->dashboardService->getExpenseOverview()
        ),
        'assetOverview' => Inertia::defer(fn () => 
            $this->dashboardService->getAssetOverview()
        ),
        'disciplinaryOverview' => Inertia::defer(fn () => 
            $this->dashboardService->getDisciplinaryOverview()
        ),
        'onOffboardingOverview' => Inertia::defer(fn () => 
            $this->dashboardService->getOnOffboardingOverview()
        ),
        'overtimeOverview' => Inertia::defer(fn () => 
            $this->dashboardService->getOvertimeOverview()
        ),
        'engagementOverview' => Inertia::defer(fn () => 
            $this->dashboardService->getEngagementOverview()
        ),
        'successionOverview' => Inertia::defer(fn () => 
            $this->dashboardService->getSuccessionOverview()
        ),
        'safetyOverview' => Inertia::defer(fn () => 
            $this->dashboardService->getSafetyOverview()
        ),
        'compensationOverview' => Inertia::defer(fn () => 
            $this->dashboardService->getCompensationOverview()
        ),
        
        // Dynamic widgets (existing system)
        'dynamicWidgets' => $this->widgetRegistry->getWidgetsForFrontend('hrm'),
    ]);
}

// NEW: Attendance chart endpoint (for period switching)
public function attendanceChart(Request $request): JsonResponse
{
    $period = $request->input('period', 'month'); // week|month|quarter
    return response()->json(
        $this->dashboardService->getAttendanceChart($period)
    );
}

// NEW: Headcount trend endpoint
public function headcountTrend(Request $request): JsonResponse
{
    $months = $request->input('months', 12);
    return response()->json(
        $this->dashboardService->getHeadcountTrend($months)
    );
}
```

#### 1.2 Add New Routes

**File**: `packages/aero-hrm/routes/web.php` (inside the dashboard middleware group)

```php
Route::middleware(['hrmac:hrm.dashboard'])->group(function () {
    Route::get('/dashboard', [HRMDashboardController::class, 'index'])->name('dashboard');
    Route::get('/dashboard/stats', [HRMDashboardController::class, 'stats'])->name('dashboard.stats');
    // NEW endpoints
    Route::get('/dashboard/attendance-chart', [HRMDashboardController::class, 'attendanceChart'])
        ->name('dashboard.attendance-chart');
    Route::get('/dashboard/headcount-trend', [HRMDashboardController::class, 'headcountTrend'])
        ->name('dashboard.headcount-trend');
    Route::get('/dashboard/widget/{widgetKey}', [HRMDashboardController::class, 'widgetData'])
        ->name('dashboard.widget');
});
```

#### 1.3 Fix config/module.php — Add Dashboard Submodule

**File**: `packages/aero-hrm/config/module.php`

Add a `dashboard` submodule entry before `employee-self-service`:

```php
[
    'code' => 'dashboard',
    'name' => 'HRM Dashboard',
    'description' => 'HR Manager dashboard with analytics and overview',
    'icon' => 'HomeIcon',
    'route' => '/hrm/dashboard',
    'priority' => -1, // Before self-service
    'show_in_nav' => false, // Accessed via module dashboard link
    'components' => [
        [
            'code' => 'overview',
            'name' => 'Dashboard Overview',
            'type' => 'page',
            'route' => '/hrm/dashboard',
            'actions' => [
                ['code' => 'view', 'name' => 'View Dashboard'],
                ['code' => 'export', 'name' => 'Export Dashboard Data'],
            ],
        ],
    ],
],
```

---

### PHASE 2: Frontend — Full Dashboard Rewrite

**File**: `packages/aero-ui/resources/js/Pages/HRM/Dashboard.jsx`

Replace the current 194-line widget-only shell with a comprehensive hardcoded layout following the LeavesAdmin.jsx pattern.

#### 2.1 Page Component Structure

```jsx
const HRMDashboard = ({ title }) => {
    const { auth, employeeStats, quickActions, alerts, dynamicWidgets } = usePage().props;
    
    // Deferred props (show skeletons until loaded)
    const attendanceOverview = usePage().props.attendanceOverview;
    const leaveOverview = usePage().props.leaveOverview;
    const payrollOverview = usePage().props.payrollOverview;
    const departmentAnalytics = usePage().props.departmentAnalytics;
    const recruitmentPipeline = usePage().props.recruitmentPipeline;
    const performanceOverview = usePage().props.performanceOverview;
    const trainingOverview = usePage().props.trainingOverview;
    const expenseOverview = usePage().props.expenseOverview;
    const assetOverview = usePage().props.assetOverview;
    const disciplinaryOverview = usePage().props.disciplinaryOverview;
    const onOffboardingOverview = usePage().props.onOffboardingOverview;
    const overtimeOverview = usePage().props.overtimeOverview;
    const engagementOverview = usePage().props.engagementOverview;
    const successionOverview = usePage().props.successionOverview;
    const safetyOverview = usePage().props.safetyOverview;
    const compensationOverview = usePage().props.compensationOverview;
    
    // Hooks (REQUIRED)
    const themeRadius = useThemeRadius();
    const { can } = useHRMAC();
    const [isMobile, setIsMobile] = useState(false);
    // ... standard responsive setup

    return (
        <>
            <Head title={title} />
            <div className="flex flex-col w-full h-full p-4" role="main">
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }} className="space-y-6">
                
                    {/* ── 1. ALERTS BANNER (contract expiry, probation ending, birthdays) ── */}
                    {alerts && Object.values(alerts).some(a => a?.length > 0) && (
                        <HrAlertsBanner alerts={alerts} />
                    )}
                    
                    {/* ── 2. DYNAMIC WELCOME WIDGETS ── */}
                    <DynamicWidgetRenderer widgets={dynamicWidgets} position="welcome" />
                    
                    {/* ── 3. KEY METRICS STATS CARDS (8 cards) ── */}
                    <HrStatsCards stats={employeeStats} />
                    
                    {/* ── 4. DYNAMIC STATS ROW WIDGETS ── */}
                    <DynamicWidgetRenderer widgets={dynamicWidgets} position="stats_row" />
                    
                    {/* ── 5. ATTENDANCE + LEAVE ROW (2 cards side by side) ── */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <AttendanceOverviewCard 
                            data={attendanceOverview} 
                            loading={!attendanceOverview} 
                        />
                        <LeaveOverviewCard 
                            data={leaveOverview} 
                            loading={!leaveOverview} 
                        />
                    </div>
                    
                    {/* ── 6. MAIN CONTENT GRID (2/3 + 1/3) ── */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Left Column (2/3) */}
                        <div className="lg:col-span-2 space-y-6">
                            
                            {/* 6a. Department Analytics (bar chart + table) */}
                            <DepartmentAnalyticsCard 
                                data={departmentAnalytics} 
                                loading={!departmentAnalytics} 
                            />
                            
                            {/* 6b. Recruitment Pipeline (funnel/kanban view) */}
                            {can('hrm.recruitment') && (
                                <RecruitmentPipelineCard 
                                    data={recruitmentPipeline} 
                                    loading={!recruitmentPipeline} 
                                />
                            )}
                            
                            {/* 6c. Headcount Trend Chart */}
                            <HeadcountTrendChart />
                            
                            {/* 6d. Payroll Overview */}
                            {can('hrm.payroll') && (
                                <PayrollOverviewCard 
                                    data={payrollOverview} 
                                    loading={!payrollOverview} 
                                />
                            )}
                            
                            {/* 6e. Performance Overview */}
                            {can('hrm.performance') && (
                                <PerformanceOverviewCard 
                                    data={performanceOverview} 
                                    loading={!performanceOverview} 
                                />
                            )}
                            
                            {/* 6f. Dynamic main_left widgets */}
                            <DynamicWidgetRenderer widgets={dynamicWidgets} position="main_left" />
                        </div>
                        
                        {/* Right Column (1/3) */}
                        <div className="space-y-6">
                            
                            {/* 6g. Quick Actions Panel */}
                            <QuickActionsPanel actions={quickActions} can={can} />
                            
                            {/* 6h. Pending Approvals Aggregator */}
                            <PendingApprovalsCard 
                                leaveData={leaveOverview}
                                expenseData={expenseOverview}
                                overtimeData={overtimeOverview}
                                loading={!leaveOverview && !expenseOverview}
                            />
                            
                            {/* 6i. Training & Compliance */}
                            {can('hrm.training') && (
                                <TrainingOverviewCard 
                                    data={trainingOverview} 
                                    loading={!trainingOverview} 
                                />
                            )}
                            
                            {/* 6j. Onboarding/Offboarding Status */}
                            <OnOffboardingCard 
                                data={onOffboardingOverview} 
                                loading={!onOffboardingOverview} 
                            />
                            
                            {/* 6k. Engagement & Pulse */}
                            <EngagementCard 
                                data={engagementOverview} 
                                loading={!engagementOverview} 
                            />
                            
                            {/* 6l. Dynamic sidebar widgets */}
                            <DynamicWidgetRenderer widgets={dynamicWidgets} position="sidebar" />
                        </div>
                    </div>
                    
                    {/* ── 7. SECONDARY MODULES ROW (collapsible) ── */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        
                        {/* 7a. Expense Claims */}
                        {can('hrm.expenses') && (
                            <ExpenseOverviewCard 
                                data={expenseOverview} 
                                loading={!expenseOverview} 
                            />
                        )}
                        
                        {/* 7b. Asset Management */}
                        {can('hrm.assets') && (
                            <AssetOverviewCard 
                                data={assetOverview} 
                                loading={!assetOverview} 
                            />
                        )}
                        
                        {/* 7c. Overtime */}
                        {can('hrm.overtime') && (
                            <OvertimeOverviewCard 
                                data={overtimeOverview} 
                                loading={!overtimeOverview} 
                            />
                        )}
                        
                        {/* 7d. Disciplinary & Grievances */}
                        {can('hrm.disciplinary') && (
                            <DisciplinaryOverviewCard 
                                data={disciplinaryOverview} 
                                loading={!disciplinaryOverview} 
                            />
                        )}
                        
                        {/* 7e. Succession Planning */}
                        {can('hrm.succession-planning') && (
                            <SuccessionOverviewCard 
                                data={successionOverview} 
                                loading={!successionOverview} 
                            />
                        )}
                        
                        {/* 7f. Safety */}
                        <SafetyOverviewCard 
                            data={safetyOverview} 
                            loading={!safetyOverview} 
                        />
                        
                        {/* 7g. Compensation */}
                        {can('hrm.compensation-planning') && (
                            <CompensationOverviewCard 
                                data={compensationOverview} 
                                loading={!compensationOverview} 
                            />
                        )}
                    </div>
                    
                    {/* ── 8. FULL-WIDTH DYNAMIC WIDGETS ── */}
                    <DynamicWidgetRenderer widgets={dynamicWidgets} position="full_width" />
                    
                </motion.div>
            </div>
        </>
    );
};

HRMDashboard.layout = (page) => <App>{page}</App>;
export default HRMDashboard;
```

---

### PHASE 3: Frontend — New Components (25+ components)

All components go in `packages/aero-ui/resources/js/Components/Dashboard/HRM/`.

Every component uses: ThemedCard (`.aero-card`), `useThemeRadius()`, Skeleton loading, dark mode support, responsive sizing.

#### 3.1 HrAlertsBanner.jsx
- Horizontal scrollable alert cards with color coding:
  - 🔴 Contract expiring (danger), Probation ending (warning)
  - 🟡 Document expiring, Certification expiring (warning)
  - 🟢 Birthdays this week, Work anniversaries (success)
  - 🔵 Pending policy acknowledgements (primary)
- Dismissible per category, count badges

#### 3.2 HrStatsCards.jsx
- 8 metric cards in responsive grid (4 cols desktop, 2 tablet, 1 mobile):
  - Total Employees (+ growth % badge)
  - Active / On Leave Today / Absent Today
  - New Hires This Month (trend arrow)
  - Pending Leave Requests (badge count)
  - Attendance Rate (% with color coding)
  - Open Positions (recruitment count)
- Each card: themed icon bg, value, subtitle, trend indicator
- Click navigates to relevant page

#### 3.3 AttendanceOverviewCard.jsx
- Today's live attendance: present/absent/late/on-leave as donut chart
- 30-day attendance trend (recharts AreaChart)
- Late arrivals trend line overlay
- "View Attendance" link
- Skeleton loading for deferred prop

#### 3.4 LeaveOverviewCard.jsx
- Leave distribution by type (recharts PieChart)
- Pending requests count with "View All" CTA
- Upcoming approved leaves (next 7 days list)
- Leave utilization rate Progress bar
- "High absenteeism" warning if applicable

#### 3.5 DepartmentAnalyticsCard.jsx
- Horizontal bar chart: departments by headcount
- Table below: department, headcount, attendance rate, avg performance
- Sortable columns
- "View All Departments" link

#### 3.6 RecruitmentPipelineCard.jsx
- Visual funnel or stacked bar: Application → Screening → Interview → Offer → Hired
- Open positions count, applications this month
- Upcoming interviews list (next 7 days)
- Time-to-hire metric, offer acceptance rate
- "Go to Recruitment" link

#### 3.7 HeadcountTrendChart.jsx
- recharts AreaChart showing employee count over 12 months
- Overlays: hires vs terminations lines
- Period selector: 6M | 12M | 24M
- Fetches from `hrm.dashboard.headcount-trend` endpoint

#### 3.8 PayrollOverviewCard.jsx
- Last payroll summary: date, total, status
- Monthly payroll cost trend (6 months bar chart)
- Pending expense claims badge
- Outstanding loans count
- "Run Payroll" action button (if permitted)

#### 3.9 PerformanceOverviewCard.jsx
- Active review cycles count
- Score distribution (1-5 star buckets as bar chart)
- Top 5 performers list with avatars
- KPI completion rate Progress bar
- Upcoming review deadlines

#### 3.10 QuickActionsPanel.jsx
- Permission-gated grid of action buttons grouped:
  - **Employees**: Add Employee, Invite User, Org Chart
  - **Leave**: Approve Leaves, Bulk Leave, Holidays
  - **Attendance**: View Attendance, Shift Schedule
  - **Payroll**: Run Payroll, Generate Payslips, Bank File
  - **Recruitment**: Post Job, View Applicants
  - **Settings**: Leave Settings, Attendance Rules, Payroll Config
- Each: icon, label, optional count badge, navigates on click

#### 3.11 PendingApprovalsCard.jsx
- Aggregated pending counts: Leaves, Expenses, Overtime, Timesheets
- Each row: icon, label, count, "View" link
- Total pending badge in card header
- Click on count navigates to approval page

#### 3.12 TrainingOverviewCard.jsx
- Active trainings count, enrollment this month
- Mandatory training compliance (Progress bar with %)
- Certifications expiring soon (alert list)
- Upcoming training sessions (next 30 days)
- "View Trainings" link

#### 3.13 OnOffboardingCard.jsx
- Active onboardings (list with progress bars per employee)
- Pending onboarding tasks count
- Active offboardings, upcoming exit dates
- Pending exit interviews count
- Compact timeline view

#### 3.14 EngagementCard.jsx
- Latest pulse survey score (large number with trend)
- Response rate Progress bar
- Recognition count this month
- Pending 360 feedback count
- Engagement trend mini sparkline (last 6 surveys)

#### 3.15 ExpenseOverviewCard.jsx
- Pending claims: count + total amount
- Approved this month chart
- Top expense categories (mini bar chart)
- Recent claims list (last 5)

#### 3.16 AssetOverviewCard.jsx
- Total / Allocated / Available counts
- Assets by category (mini donut chart)
- Maintenance due alerts
- Recent allocations list

#### 3.17 OvertimeOverviewCard.jsx
- Pending requests count
- Total overtime hours this month
- Top overtime employees (list)
- Monthly overtime cost

#### 3.18 DisciplinaryOverviewCard.jsx
- Open cases count with severity badges
- Pending investigations
- Warnings issued this month
- Open grievances count
- Average resolution time

#### 3.19 SuccessionOverviewCard.jsx
- Active succession plans count
- Critical roles without successors (warning)
- Ready-now candidates
- Workforce plan fill rate

#### 3.20 SafetyOverviewCard.jsx
- Days since last incident (large counter)
- Incidents this month
- Open investigations
- Upcoming inspections
- Training compliance rate

#### 3.21 CompensationOverviewCard.jsx
- Pending adjustments count
- Average salary increase %
- Budget utilization Progress bar
- Upcoming compensation reviews

---

### PHASE 4: Evolving Features — Missing from aero-hrm

These features have models but are not surfaced or need new models:

#### 4.1 HR Calendar/Events Integration
- Model exists: `Event`, `SubEvent`, `EventRegistration`
- Surface upcoming events on dashboard
- Create a unified HRM calendar view showing: holidays, leave, training, reviews, interviews, events

#### 4.2 Employee Wellness/Daily Check-In Dashboard View
- Model exists: `DailyCheckIn`
- Surface today's check-in stats on dashboard: mood distribution, check-in rate
- Alert if morale score drops below threshold

#### 4.3 Talent Mobility
- Model exists: `TalentMobilityRecommendation`
- Surface active mobility recommendations on dashboard
- Link to detailed talent mobility page

#### 4.4 Behavioral Anomaly Alerts
- Model exists: `BehavioralAnomaly`
- Surface flagged anomalies on dashboard as security/HR alerts
- Requires AI Analytics module integration

#### 4.5 Approval Workflow Engine Dashboard
- Models exist: `ApprovalWorkflowTemplate`, `ApprovalWorkflowInstance`, `ApprovalAction`
- Show active approval workflows, bottlenecks, SLA violations

#### 4.6 Attrition Risk Dashboard
- Models exist: `AttritionPrediction`, `EmployeeRiskScore`
- Show high-risk employees, attrition prediction chart, recommended interventions

#### 4.7 Employee Sentiment Analysis
- Model exists: `EmployeeSentimentRecord`
- Surface sentiment trends, department mood heatmap

#### 4.8 Workload Metrics
- Model exists: `EmployeeWorkloadMetric`
- Show overworked/underutilized employees, workload distribution

#### 4.9 Announcements on HRM Dashboard
- Model exists: `Announcement` (in aero-hrm)
- Surface HR-specific announcements on the HRM dashboard
- Create/manage announcements from dashboard

#### 4.10 Recognition Board
- Model exists: `Recognition`
- Surface recent recognitions, top recognized employees this month
- "Give Recognition" quick action

---

### PHASE 5: Testing

**Directory**: `packages/aero-hrm/tests/Feature/Dashboard/`

```
HrmDashboardControllerTest.php
├── test_dashboard_index_returns_all_props()
├── test_dashboard_index_requires_authentication()
├── test_dashboard_index_requires_hrm_dashboard_permission()
├── test_dashboard_stats_endpoint_returns_json()
├── test_dashboard_attendance_chart_week_period()
├── test_dashboard_attendance_chart_month_period()
├── test_dashboard_headcount_trend_endpoint()
├── test_dashboard_widget_data_returns_widget()
├── test_dashboard_widget_data_returns_404_for_invalid_key()

HrmDashboardServiceTest.php
├── test_get_employee_stats_returns_all_keys()
├── test_get_employee_stats_caches_results()
├── test_get_attendance_overview_includes_trend_data()
├── test_get_leave_overview_includes_pending_requests()
├── test_get_payroll_overview_handles_no_payroll_runs()
├── test_get_department_analytics_limits_to_15()
├── test_get_recruitment_pipeline_counts_by_stage()
├── test_get_recruitment_pipeline_handles_no_jobs()
├── test_get_performance_overview_handles_disabled_reviews()
├── test_get_training_overview_includes_expiring_certs()
├── test_get_expense_overview_sums_amounts_correctly()
├── test_get_asset_overview_counts_available()
├── test_get_disciplinary_overview_excludes_closed()
├── test_get_onboarding_overview_includes_completion_rate()
├── test_get_alerts_finds_expiring_contracts()
├── test_get_alerts_finds_upcoming_birthdays()
├── test_get_quick_actions_filters_by_permissions()
├── test_get_overtime_overview_sums_hours()
├── test_get_engagement_overview_calculates_response_rate()
├── test_get_succession_overview_finds_critical_gaps()
├── test_get_safety_overview_calculates_days_since_incident()
├── test_get_compensation_overview_counts_pending()
```

---

### PHASE 6: Performance Optimization

1. **Inertia Deferred Props** — Only `employeeStats`, `quickActions`, `alerts` load immediately. All 16 other sections load async via `Inertia::defer()`
2. **Redis Caching** — All service methods cache with 2-15 min TTL
3. **Eager Loading** — All relationship queries use `with()` to prevent N+1
4. **Skeleton Loading** — Each card shows animated skeleton while deferred props load (section-level, never full-page)
5. **Permission Gating** — Skip data fetching entirely for submodules the user can't access (check in service before querying)
6. **Query Optimization** — Use COUNT/SUM aggregate queries, not full model hydration for stats
7. **Frontend Code Splitting** — recharts components loaded via React.lazy()
8. **Conditional Sections** — Cards for modules user can't access don't render at all (`can('hrm.recruitment')` checks)

---

## Files to Create/Modify Summary

### New Files (Backend — `packages/aero-hrm/`)
| File | Purpose |
|------|---------|
| `src/Services/HrmDashboardService.php` | All dashboard business logic (20 methods) |
| `tests/Feature/Dashboard/HrmDashboardControllerTest.php` | Controller tests |
| `tests/Feature/Dashboard/HrmDashboardServiceTest.php` | Service tests |

### New Files (Frontend — `packages/aero-ui/resources/js/Components/Dashboard/HRM/`)
| File | Purpose |
|------|---------|
| `HrAlertsBanner.jsx` | Contract/probation/birthday/anniversary alerts |
| `HrStatsCards.jsx` | 8 key metric cards |
| `AttendanceOverviewCard.jsx` | Today's attendance + 30-day trend chart |
| `LeaveOverviewCard.jsx` | Leave distribution + pending requests |
| `DepartmentAnalyticsCard.jsx` | Department headcount bar chart + table |
| `RecruitmentPipelineCard.jsx` | Recruitment funnel visualization |
| `HeadcountTrendChart.jsx` | 12-month headcount area chart |
| `PayrollOverviewCard.jsx` | Payroll cost trend + pending claims |
| `PerformanceOverviewCard.jsx` | Review cycles + score distribution |
| `QuickActionsPanel.jsx` | Permission-gated HR action buttons |
| `PendingApprovalsCard.jsx` | Cross-submodule pending counts |
| `TrainingOverviewCard.jsx` | Training compliance + expiring certs |
| `OnOffboardingCard.jsx` | Active onboarding/offboarding progress |
| `EngagementCard.jsx` | Pulse survey + recognition stats |
| `ExpenseOverviewCard.jsx` | Pending claims + top categories |
| `AssetOverviewCard.jsx` | Asset allocation summary |
| `OvertimeOverviewCard.jsx` | Overtime requests + hours summary |
| `DisciplinaryOverviewCard.jsx` | Open cases + grievances |
| `SuccessionOverviewCard.jsx` | Succession plan gaps |
| `SafetyOverviewCard.jsx` | Safety incident tracker |
| `CompensationOverviewCard.jsx` | Compensation adjustments summary |

### Modified Files
| File | Changes |
|------|---------|
| `packages/aero-hrm/src/Http/Controllers/HRMDashboardController.php` | Inject HrmDashboardService, rewrite index() with deferred props, add attendanceChart() and headcountTrend() endpoints |
| `packages/aero-hrm/routes/web.php` | Add 3 new dashboard routes |
| `packages/aero-hrm/config/module.php` | Add `dashboard` submodule entry |
| `packages/aero-ui/resources/js/Pages/HRM/Dashboard.jsx` | Full rewrite with hardcoded sections + dynamic widgets |

---

## Execution Order

1. Add `dashboard` submodule to `config/module.php`
2. Create `HrmDashboardService` with all 20 methods
3. Rewrite `HRMDashboardController` with deferred props
4. Add new routes to `routes/web.php`
5. Create all 21 frontend components (start with HrStatsCards, AttendanceOverviewCard, LeaveOverviewCard)
6. Rewrite `HRM/Dashboard.jsx` with new layout
7. Write all tests
8. Run `php artisan hrmac:sync-modules`
9. Run `vendor/bin/pint --dirty`
10. Run `php artisan test --filter=HrmDashboard`

---

## HRM Models Available (120+ models)
The following models exist in `packages/aero-hrm/src/Models/` and should be queried by the dashboard service where relevant:

**Core**: Employee, Department, Designation, Grade, Skill, Competency, Education, Experience, EmergencyContact
**Attendance**: Attendance, AttendanceSetting, AttendanceType, ShiftSchedule, WorkLocationLog
**Leave**: Leave, LeaveBalance, LeaveSetting, Holiday
**Payroll**: Payroll, PayrollAllowance, PayrollDeduction, Payslip, SalaryComponent, EmployeeSalaryStructure, TaxSlab
**Recruitment**: Job, JobApplication, JobHiringStage, JobInterview, JobInterviewFeedback, JobOffer, JobType, JobApplicantEducation, JobApplicantExperience, JobApplicationStageHistory
**Performance**: PerformanceReview, PerformanceReviewTemplate, KPI, KPIValue, PromotionHistory
**Training**: Training, TrainingAssignment, TrainingAssignmentSubmission, TrainingCategory, TrainingEnrollment, TrainingFeedback, TrainingMaterial, TrainingSession
**Expenses**: ExpenseClaim, ExpenseCategory
**Assets**: Asset, AssetAllocation, AssetCategory
**Disciplinary**: DisciplinaryCase, DisciplinaryActionType, Warning
**Grievance**: Grievance, GrievanceCategory, GrievanceCommunication, GrievanceNote
**Onboarding**: Onboarding, OnboardingStep, OnboardingTask, Checklist, TaskTemplate
**Offboarding**: Offboarding, OffboardingStep, OffboardingTask, ExitInterview
**Career**: CareerPath, CareerPathMilestone, EmployeeCareerProgression
**Succession**: SuccessionPlan, SuccessionCandidate
**Workforce**: WorkforcePlan, WorkforcePlanPosition
**Compensation**: CompensationAdjustment, CompensationHistory, CompensationReview
**Feedback**: Feedback360, Feedback360Response
**Engagement**: PulseSurvey, PulseSurveyResponse, EngagementSurvey, EngagementSurveyResponse, Recognition, DailyCheckIn
**Overtime**: OvertimeRecord, OvertimeRequest
**Safety**: SafetyIncident, SafetyIncidentParticipant, SafetyInspection, SafetyTraining
**Benefits**: Benefit
**Documents**: HrDocument, EmployeePersonalDocument, EmployeeCertification
**AI/Analytics**: AIInsight, AttritionPrediction, BehavioralAnomaly, EmployeeRiskScore, EmployeeSentimentRecord, EmployeeWorkloadMetric, TalentMobilityRecommendation
**Other**: Announcement, Opportunity, Event, SubEvent, EventRegistration, PolicyAcknowledgement, TransferHistory, ApprovalWorkflowTemplate, ApprovalWorkflowInstance, ApprovalAction, EmployeeBankDetail, EmployeeDependent, EmployeeAddress, EmployeeBookmark, EmployeeEducation, EmployeeWorkExperience, LoanDeductionService (service)

---

## Handoff
Execute this prompt with the **AEOS Lead Architect** agent for backend implementation, then hand frontend work to **AEOS Frontend Engineer**.
