
---

# Audit & Redesign Prompt: HRM Module — Advanced Evolution & Gap Remediation

## Target
- **Package:** `packages/aero-hrm/`
- **Frontend:** `packages/aero-ui/resources/js/Pages/HRM/` + `Forms/HRM/` + `Tables/HRM/`
- **Generated:** 2026-04-21
- **Scan Scope:** Full Backend + Frontend + Cross-Reference + Security + Redesign Recommendations

## Agent Team Assignment
This prompt is designed for **parallel execution** across the four AEOS specialist agents. Each phase is tagged with its owner(s):

| Agent | Abbreviation | Responsibility |
|-------|-------------|----------------|
| **AEOS Lead Architect** | `[ARCH]` | Module hierarchy, route structure, HRMAC policy mapping, service provider design, new submodule scaffolding, cross-cutting architecture decisions |
| **AEOS Backend Engineer** | `[BE]` | Controllers, FormRequests, Eloquent Models, Migrations, Factories, Seeders, Services, Policies — all PHP implementation |
| **AEOS Frontend Engineer** | `[FE]` | React pages, HeroUI components, Forms, Tables, Modals, Hooks — all JSX implementation |
| **AEOS Quality Control Agent** | `[QC]` | PHPUnit feature + unit tests, security code review, N+1 analysis, edge case coverage, DSOP compliance audit |

> **Execution order:** Phase 1 (ARCH+BE) → Phase 1 Tests (QC) → Phase 2 (BE) → Phase 3 (ARCH+BE+FE in parallel) → Phase 4 (FE) → Phase 5 (ARCH+BE+FE) → Final QC pass

## Executive Summary
The HRM module is the **largest module** in the AEOS ecosystem with **20 submodules**, **120+ models**, **34+ services**, **15 policies**, and **60+ frontend pages/directories**. While the `config/module.php` hierarchy is comprehensive (4-level: module → 20 submodules → ~80 components → ~200 actions), there are **significant gaps** between what's defined and what's actually implemented. Only **11 FormRequests** exist for a module with 200+ mutation actions. Only **16 factories** cover 120+ models. **1 feature test** exists for the entire module. Many frontend pages in subdirectories likely lack HRMAC hooks, ThemedCard patterns, and the LeavesAdmin.jsx gold-standard layout. The module needs both **gap closure** and **architectural evolution** to reach enterprise-grade.

---

## PART A: GAP ANALYSIS — Current State Issues

### Critical Findings (Must Fix)

#### C-1: Near-Zero Test Coverage `[QC]`
- **Scope:** Entire `tests/` directory
- **Issue:** Only `tests/Feature/ProfileUpdateRouteTest.php` exists. Zero tests for: Leave CRUD, Attendance, Payroll, Recruitment, Performance, Training, Disciplinary, Assets, Expenses, Grievances, Exit Interviews, Pulse Surveys, Compensation Planning, Workforce Planning, Succession Planning, Career Pathing, 360° Feedback, Overtime, Safety, Analytics.
- **Impact:** Critical — no regression safety net for any HRM functionality.
- **Fix (`[QC]`):** Create feature tests for every controller endpoint (minimum: store, update, destroy, index, show for each resource). Target: ~200 test methods covering happy + failure + edge paths. Run after every BE phase completes.

#### C-2: Severely Missing FormRequests (11 exist for 200+ mutation actions) `[BE]`
- **Existing:** `BulkLeaveRequest`, `ProfileUpdateRequest`, `PunchRequest`, `StoreEmployeeDocumentRequest`, `Store/UpdateOffboardingRequest`, `Store/UpdateOnboardingRequest`, `TaskTemplateFormRequest`, `UpdateAttendanceSettingRequest`, `UpdateEmployeeProfileRequest`
- **Missing for:** All Payroll mutations, all Recruitment mutations, all Performance mutations, all Training mutations, all Disciplinary mutations, all Asset mutations, all Expense mutations, all Grievance mutations, all Exit Interview mutations, all Pulse Survey mutations, all Compensation mutations, all Workforce Planning mutations, all Leave type/balance/policy mutations, all Department/Designation store/update, all Attendance mark/update/delete, all Overtime mutations, all Safety mutations, all Succession Planning mutations, all Career Path mutations, all 360° Feedback mutations.
- **Impact:** Critical — inline validation or no validation in controllers = mass assignment risk + inconsistent error messages.
- **Fix (`[BE]`):** Create one FormRequest per store/update action. Follow `BulkLeaveRequest.php` pattern with rules + custom error messages.

#### C-3: Missing Factories (16 exist for 120+ models) `[BE]`
- **Existing factories:** Asset, AssetAllocation, AssetCategory, Attendance, Department, Designation, DisciplinaryActionType, DisciplinaryCase, Employee, EmployeePersonalDocument, ExpenseCategory, ExpenseClaim, Holiday, Leave, LeaveType, Warning
- **Missing for:** All Payroll-related models (Payroll, Payslip, PayrollAllowance, PayrollDeduction, SalaryComponent, TaxSlab), all Recruitment models (Job, JobApplication, JobOffer, JobInterview, etc.), all Performance models (PerformanceReview, KPI, KPIValue, Competency), all Training models (Training, TrainingSession, TrainingEnrollment, etc.), Benefit, CareerPath, CareerPathMilestone, CompensationAdjustment, CompensationReview, EngagementSurvey, ExitInterview, Feedback360, Grievance, Onboarding, Offboarding, OvertimeRecord, OvertimeRequest, PulseSurvey, Recognition, SafetyIncident, ShiftSchedule, Skill, SuccessionPlan, WorkforcePlan, and 50+ more.
- **Impact:** Critical — cannot seed test data or write meaningful tests without factories.
- **Fix (`[BE]`):** Create factories with useful states (e.g., `EmployeeFactory::active()`, `LeaveFactory::approved()`, `PayrollFactory::locked()`). `[QC]` depends on these before test writing begins.

#### C-4: Missing Policies for Many Authorizable Models `[BE]` + `[ARCH]`
- **Existing (15):** Attendance, Benefit, Competency, Department, Designation, Leave, Offboarding, OffboardingStep, Onboarding, OnboardingStep, Payroll, Recruitment, SafetyInspection, Skill, TaskTemplate
- **Missing:** Asset, AssetAllocation, DisciplinaryCase, Employee (core model!), ExpenseClaim, ExitInterview, Feedback360, Grievance, Job, JobApplication, OvertimeRecord, OvertimeRequest, PerformanceReview, PulseSurvey, Training, TrainingSession, CompensationReview, SuccessionPlan, CareerPath, WorkforcePlan, Warning, Holiday, ShiftSchedule, etc.
- **Impact:** Critical — controllers mutating these models have no policy authorization checks.
- **Fix (`[BE]`):** Create policy classes using HRMAC (not legacy `ChecksModuleAccess` trait). `[ARCH]` to confirm HRMAC binding pattern. `[QC]` to write denial tests for each policy.

### High Findings

#### H-1: Routes File Structure — Single `web.php` for 20 Submodules `[ARCH]`
- **File:** `routes/web.php`
- **Issue:** All routes in a single file. No `tenant.php`, `api.php`, or `admin.php` as the package structure convention expects.
- **Impact:** High — difficult to maintain, no API versioning, no separation of tenant vs admin routes.
- **Fix (`[ARCH]`):** Design the split strategy and new file names. `[BE]` executes the migration.

#### H-2: No Seeders Directory `[BE]`
- **Path:** `packages/aero-hrm/database/seeders/` — directory doesn't exist
- **Impact:** High — no way to seed HRM demo data for new tenants.
- **Fix (`[BE]`):** Create `HrmDemoSeeder`, `HrmPermissionSeeder`, `HrmModuleSeeder`. Factories (C-3) must be created first.

#### H-3: Many Frontend Pages Likely Missing HRMAC/ThemedCard/Layout Patterns `[FE]`
- **Scope:** 60+ page files/directories in `Pages/HRM/`
- **Issue:** Subdirectories like `AIAnalytics/`, `Analytics/`, `Assets/`, `Attendance/`, `Benefits/`, `CareerPath/`, `Compensation/`, `Disciplinary/`, `Employee/`, `Employees/`, `EmployeeHistory/`, `Evaluation.jsx`, `ExitInterviews/`, `Expenses/`, `Feedback360/`, `Goals/`, `Grievances/`, `Leaves/`, `Offboarding/`, `Onboarding/`, `Overtime/`, `Payroll/`, `Performance/`, `PulseSurveys/`, `Recruitment/`, `Safety/`, `SelfService/`, `Skills/`, `SuccessionPlanning/`, `TimeOff/`, `TimeSheet/`, `Training/`, `WorkforcePlanning/` need individual audit for HRMAC hooks, ThemedCard, `motion.div`, App layout wrapper, responsive breakpoints, `showToast.promise`, Skeleton loading.
- **Fix (`[FE]`):** Systematically audit and upgrade every page directory. `[QC]` to do a final visual/code review pass.

#### H-4: MUI Legacy Imports Still Present in HRM Forms `[FE]`
- **Files:** `Forms/HRM/AddEditTrainingForm.jsx`, `Forms/HRM/AddEditJobForm.jsx`, `Forms/HRM/AddUserForm.jsx`
- **Issue:** These use Material UI components instead of HeroUI (per `/memories/repo/ui-standards.md` P2-5 finding).
- **Fix (`[FE]`):** Fully migrate all three forms to HeroUI Input/Select/Modal components with `showToast.promise()` and theme radius helper.

### Medium Findings

#### M-1: Controller Method Coverage vs Module.php Actions `[ARCH]` + `[BE]`
- **Issue:** Many `config/module.php` actions (approve, reject, lock, rollback, generate, export, etc.) may not have corresponding controller methods. Example: Payroll has `execute`, `lock`, `rollback` actions but PayrollController is inside Employee/ directory.
- **Impact:** Medium — module hierarchy promises features that may not exist.
- **Fix (`[ARCH]`):** Audit `config/module.php` against existing controllers and produce a gap matrix. `[BE]` implements missing controller methods with proper FormRequest injection.

#### M-2: Service Layer Gaps `[BE]`
- **Existing services (34):** Cover attendance, leave, payroll, employee, HR metrics, AI analytics.
- **Missing:** No dedicated services for Recruitment, Training, Disciplinary, Assets, Expenses, Grievances, Exit Interviews, Pulse Surveys, Compensation Planning, Career Pathing, Succession Planning, Workforce Planning, 360° Feedback, Safety, Benefits, Overtime approval workflow, Onboarding orchestration.
- **Fix (`[BE]`):** Create 15 new service classes (see Phase 2 for full list). Follow thin-controller pattern — controllers should only call service methods.

#### M-3: No Events/Listeners for Workflow Actions `[BE]`
- **Path:** `src/Events/`, `src/Listeners/`
- **Issue:** Module has Events/Listeners directories but coverage for approval workflows (leave, expense, overtime, grievance, disciplinary) needs verification. Missing listeners mean no email notifications, no audit trail writes, no webhook triggers on state changes.
- **Fix (`[BE]`):** Audit existing Events/Listeners, add missing events for all approval workflow state transitions. `[QC]` to verify event firing in tests.

---

## PART B: REDESIGN & EVOLUTION PROMPT

### Objective
Redesign the HRM module from a **basic CRUD HR system** into an **enterprise-grade, AI-enhanced, workflow-driven Human Capital Management (HCM) platform** while maintaining backward compatibility with existing data and routes.

---

### Phase 1: Foundation Hardening `[ARCH]` + `[BE]`

**`[ARCH]`** owns architecture decisions, route file design, `config/module.php` completeness, HRMAC mapping, and service provider registration.  
**`[BE]`** owns all implementation: FormRequests, Factories, Policies, Seeders, Migrations.

**`[ARCH]` tasks:**
1. **Audit `config/module.php`** — produce a gap matrix: which actions have no matching route, which routes have no matching HRMAC middleware path.
2. **Design route file split** — define the structure of `tenant.php`, `api.php`, and `admin.php` before `[BE]` migrates.
3. **Verify service provider** — ensure `HrmServiceProvider` extends `AbstractModuleProvider` from `aero-core` and correctly registers all three route files.
4. **Verify every `hrmac:` middleware path** matches a `config/module.php` entry. Add missing entries and run `php artisan hrmac:sync-modules`.

**`[BE]` tasks:**
1. **Create 60+ FormRequest classes** for all mutation endpoints — one per store/update action across all 20 submodules. Follow existing `BulkLeaveRequest.php` pattern with rules + custom error messages.
2. **Create 100+ Model Factories** — follow `EmployeeFactory.php` pattern. Each factory must have useful states (e.g., `EmployeeFactory::active()`, `LeaveFactory::approved()`, `PayrollFactory::locked()`).
3. **Create 20+ missing Policies** — using HRMAC (not legacy `ChecksModuleAccess`). Minimum: Employee, Asset, DisciplinaryCase, ExpenseClaim, ExitInterview, Feedback360, Grievance, Job, JobApplication, OvertimeRecord, PerformanceReview, PulseSurvey, Training, CompensationReview, SuccessionPlan, CareerPath, WorkforcePlan, Warning, Holiday, ShiftSchedule.
4. **Execute route file split** per `[ARCH]` design into `tenant.php`, `api.php`, `admin.php`.
5. **Create seeders:** `HrmDemoSeeder`, `HrmPermissionSeeder`, `HrmModuleSeeder`.

---

### Phase 1 QC Gate `[QC]`

> **Do not start Phase 2 until this gate passes.**

`[QC]` tasks after Phase 1:
1. **Create 200+ feature test methods** across all 20 submodules. Minimum per controller: `store`, `update`, `destroy`, `index`, `show`.
2. For each policy created in Phase 1: **write denial tests** (unauthorized user cannot access) and **authorization tests** (correct role can access).
3. For each FormRequest created: **write validation failure tests** (invalid data rejected with correct error messages).
4. **Write workflow tests** (leave approval flow, expense approval flow, payroll lock/rollback).
5. **Security audit** — check all new controllers for: missing policy calls, mass assignment gaps, N+1 queries, unparameterized raw queries.
6. Run `php artisan test --filter=Hrm` — all passing before proceeding.

---

7. **Verify every `hrmac:` middleware path** in routes matches a `config/modules.php` entry. Add missing entries.

### Phase 2: Service Layer Evolution `[BE]`

**`[ARCH]`** approves service interface contracts before `[BE]` implements.

Create dedicated service classes following existing patterns (`LeaveApprovalService.php`, `PayrollCalculationService.php`). All services must have explicit PHP return type hints, constructor property promotion, and PHPDoc blocks with array shape definitions:

| New Service | Purpose |
|-------------|---------|
| `RecruitmentPipelineService` | Manage candidate progression through hiring stages, scoring, offer generation |
| `TrainingOrchestrationService` | Session scheduling, enrollment management, certificate generation, LMS integration hooks |
| `DisciplinaryWorkflowService` | Case lifecycle: report → investigate → hearing → action → appeal → close |
| `AssetLifecycleService` | Procurement → allocation → maintenance → depreciation → disposal |
| `ExpenseApprovalService` | Multi-level expense approval with budget checks and receipt OCR hooks |
| `GrievanceResolutionService` | Intake → assign investigator → resolution → follow-up |
| `PerformanceCalibrationService` | Bell curve calibration, 9-box grid placement, forced ranking |
| `CompensationBenchmarkService` | Market data comparison, pay equity analysis, budget allocation |
| `SuccessionReadinessService` | Readiness scoring, development gap analysis, bench strength metrics |
| `WorkforceForecastingService` | Attrition prediction, headcount modeling, scenario planning |
| `OnboardingOrchestratorService` | Task sequence management, checklist automation, buddy assignment |
| `OffboardingOrchestratorService` | Asset return, access revocation, knowledge transfer, exit clearance |
| `OvertimeApprovalService` | Request → manager approval → HR review → payroll integration |
| `SafetyComplianceService` | Incident reporting, inspection scheduling, OSHA compliance tracking |
| `PulseSurveyAnalyticsService` | Sentiment analysis, eNPS calculation, trend detection |

After each service is created, `[QC]` writes unit tests for the service class in isolation (mocking repositories/models).

### Phase 3: Advanced Feature Additions `[ARCH]` + `[BE]` + `[FE]`

> **`[ARCH]`** designs data models and API contracts. **`[BE]`** implements backend. **`[FE]`** implements UI. **`[QC]`** writes tests for each feature before it is merged.

#### 3.1 AI-Powered HR Intelligence (Enhance existing `AIAnalytics/`) `[BE]` + `[FE]`
| Feature | Backend `[BE]` | Frontend `[FE]` |
|---------|---------|----------|
| **Attrition Risk Predictor** | `Services/AIAnalytics/AttritionPredictionService.php` (exists) — enhance with ML model integration, risk scoring per employee | `Pages/HRM/AIAnalytics/AttritionDashboard.jsx` — risk heatmap, department drill-down, retention action recommendations |
| **Smart Recruiter** | New `Services/AIAnalytics/ResumeScreeningService.php` — NLP-based resume parsing, skill matching, candidate scoring | `Pages/HRM/Recruitment/AIScreening.jsx` — candidate match scores, skill gap visualization, auto-ranking |
| **Workforce Sentiment Engine** | Enhance `EmployeeSentimentRecord` model — real-time pulse analysis, Slack/Teams integration | `Pages/HRM/AIAnalytics/SentimentDashboard.jsx` — mood trend charts, department comparison, alert thresholds |
| **Compensation Intelligence** | New `Services/AIAnalytics/CompensationAnalysisService.php` — pay equity detection, market rate comparison | `Pages/HRM/Compensation/PayEquityAnalysis.jsx` — gender/role/tenure pay gap visualization |
| **Skill Gap Analyzer** | Enhance `SkillMatrixController` — map current skills vs role requirements, suggest training | `Pages/HRM/Skills/SkillGapAnalysis.jsx` — spider charts per employee, team heat maps |

#### 3.2 Advanced Workflow Engine `[ARCH]` + `[BE]`
| Feature | Description |
|---------|-------------|
| **Configurable Approval Chains** | `[ARCH]` design + `[BE]` implement: Replace hardcoded approve/reject with `ApprovalWorkflowTemplate` model (exists!) — support multi-level, parallel, conditional approval for leaves, expenses, overtime, payroll, disciplinary, recruitment offers |
| **Automated Escalation** | `[BE]`: If approval pending > N days, auto-escalate to next level via scheduled job |
| **Bulk Operations** | `[BE]`: Extend existing `BulkLeaveController` pattern to: bulk attendance marking, bulk payroll processing, bulk training enrollment, bulk asset allocation |
| **Scheduled Actions** | `[BE]`: Leave accrual engine (exists in config but `route: null`), automatic probation completion, contract renewal reminders |

#### 3.3 Employee Experience & Self-Service Enhancement `[FE]` + `[BE]`
| Feature | Page | Backend `[BE]` | Frontend `[FE]` |
|---------|------|---------|----------|
| **Employee Dashboard 2.0** | `Pages/HRM/SelfService/Dashboard.jsx` | API endpoint returning live KPIs: attendance, leave balance, pending approvals, upcoming training, payslip preview | Unified widget dashboard with real-time refresh, team calendar, announcements |
| **Mobile-First Punch** | `Pages/HRM/SelfService/MobilePunch.jsx` | GPS validation endpoint, QR token generation, offline queue | GPS + QR + biometric clock-in with offline support |
| **Document Vault** | `Pages/HRM/SelfService/DocumentVault.jsx` | Encrypted document storage service, expiry notification jobs | Encrypted personal document storage with expiry reminders (passport, visa, certifications) |
| **Team Calendar** | `Pages/HRM/SelfService/TeamCalendar.jsx` | Paginated who's-in/who's-out API endpoint | Visual who's-in/who's-out calendar for the employee's team |
| **Recognition Wall** | `Pages/HRM/SelfService/RecognitionWall.jsx` | Recognition model (exists) — points tally endpoint | Peer-to-peer kudos, badges, points system |
| **Learning Hub** | `Pages/HRM/SelfService/LearningHub.jsx` | Training history + recommendations endpoint | My training history, recommended courses, certification tracker, skill assessments |

#### 3.4 Analytics & Reporting Evolution `[BE]` + `[FE]`
| Feature | Owner | Description |
|---------|-------|-------------|
| **Real-Time HR Dashboard** | `[BE]` + `[FE]` | Replace static `Dashboard.jsx` with live-updating KPI cards: headcount, attrition rate, avg tenure, open positions, pending approvals, payroll cost, training hours, safety incidents |
| **Custom Report Builder** | `[BE]` + `[FE]` | Drag-and-drop field selector, filter builder, chart type picker, schedule email delivery |
| **Compliance Reports** | `[BE]` | EEO-1, OSHA 300, labor law compliance, audit trail exports |
| **Predictive Analytics** | `[BE]` | Turnover prediction (enhance existing `AttritionPrediction` model), hiring demand forecasting, budget variance analysis |
| **Executive Dashboards** | `[FE]` | Board-level HR metrics: cost per hire, revenue per employee, HR-to-employee ratio, engagement index |

#### 3.5 Recruitment ATS Evolution `[BE]` + `[FE]`
| Feature | Owner | Description |
|---------|-------|-------------|
| **Career Portal** | `[BE]` + `[FE]` | Public-facing job board with company branding, application form builder |
| **Pipeline Kanban** | `[FE]` | Visual drag-and-drop candidate pipeline (Kanban.jsx exists — extend for recruitment) |
| **Video Interview** | `[BE]` + `[FE]` | Async video interview scheduling with rating system |
| **Offer Management** | `[BE]` + `[FE]` | Template-based offer letters with e-signature integration |
| **Recruitment Analytics** | `[BE]` + `[FE]` | Time-to-hire, cost-per-hire, source effectiveness, pipeline conversion rates |
| **Referral Program** | `[BE]` + `[FE]` | Employee referral tracking with bonus automation |

#### 3.6 Payroll Evolution `[BE]` + `[FE]`
| Feature | Owner | Description |
|---------|-------|-------------|
| **Multi-Currency Payroll** | `[BE]` | Support international employees with currency conversion |
| **Statutory Compliance** | `[BE]` | Country-specific tax calculations, social security, pension schemes |
| **Payroll Approval Workflow** | `[ARCH]` + `[BE]` | Draft → Review → Approve → Lock → Process → Bank File |
| **Payroll Analytics** | `[BE]` + `[FE]` | Cost center analysis, YoY comparison, department budgets, headcount cost |
| **Loan Management** | `[BE]` | EMI calculations, automatic payroll deductions, loan balance tracking (model exists) |
| **Bank Integration** | `[BE]` | SEPA, ACH, SWIFT file generation (BankIntegrationService exists — enhance) |

### Phase 4: Frontend Redesign (All Pages) `[FE]`

> `[QC]` does a final code review pass on every page `[FE]` completes — checking HRMAC usage, Tailwind v4 compliance, and dark mode coverage.

Audit and upgrade ALL 60+ HRM pages to follow the gold-standard `LeavesAdmin.jsx` pattern. For each page:

1. ✅ `useHRMAC()` hook for all permission checks (replace any `auth.permissions?.includes`)
2. ✅ `useThemeRadius()` hook (replace any inline `getThemeRadius()`)
3. ✅ `ThemedCard` or `.aero-card` class on all Cards
4. ✅ `motion.div` entry animation on main Card
5. ✅ `.layout = (page) => <App children={page} />` at bottom
6. ✅ `showToast.promise()` for all async operations
7. ✅ `StatsCards` component at top of CardBody
8. ✅ Section-level `<Skeleton>` loading (never full-page spinner)
9. ✅ Responsive `isMobile`/`isTablet` breakpoints
10. ✅ Dark mode `dark:` variants on all custom styling
11. ✅ HeroUI components exclusively (migrate any MUI remnants in `Forms/HRM/`)
12. ✅ `@heroicons/react/24/outline` icons only

**Priority order for redesign:**
1. `Dashboard.jsx` — most visible page
2. `EmployeeList.jsx` + `Employee/` directory — core CRUD
3. `LeavesAdmin.jsx` (already gold standard — verify)
4. `Attendance/` pages
5. `Payroll/` pages
6. `Recruitment/` pages
7. `Performance/` + `Goals/` + `Feedback360/`
8. `Training/` pages
9. `Expenses/` + `Assets/`
10. All remaining subdirectories

### Phase 5: New Submodules to Add to `config/modules.php` `[ARCH]` + `[BE]` + `[FE]`

**`[ARCH]`** adds submodule entries and designs the HRMAC permission tree.  
**`[BE]`** creates controllers, models, migrations, services, FormRequests, factories for each.  
**`[FE]`** creates the corresponding pages following the LeavesAdmin.jsx gold-standard pattern.  
**`[QC]`** writes tests for each new submodule before it ships.

| Submodule Code | Name | Components |
|---------------|------|------------|
| `employee-engagement` | Employee Engagement | Recognition wall, rewards program, engagement surveys, eNPS tracking, team pulse |
| `learning-development` | Learning & Development | LMS integration, skill assessments, learning paths, certification management, mandatory compliance training |
| `talent-management` | Talent Management | 9-box grid, high-potential identification, talent pools, development plans, mentor matching |
| `hr-compliance` | HR Compliance | Policy management, acknowledgement tracking, audit logs, regulatory reporting, data retention |
| `employee-relations` | Employee Relations | Case management, mediation tracking, union relations, collective agreements |
| `hr-settings` | HR Settings | Global HR config, approval workflow builder, notification templates, custom field builder, import/export settings |
| `employee-wellness` | Employee Wellness | Wellness programs, mental health resources, fitness challenges, health assessments |
| `time-project-tracking` | Time & Project Tracking | Extend existing TimeSheet — project-based time logging, billable hours, client allocation |

---

## Implementation Checklist (Ordered by Dependency)

### Foundation — Week 1-2 `[ARCH]` + `[BE]`
- [ ] `[ARCH]` Audit `config/modules.php` — produce route ↔ HRMAC gap matrix
- [ ] `[ARCH]` Design `tenant.php` / `api.php` / `admin.php` route split
- [ ] `[BE]` Create 60+ FormRequest classes for all mutation endpoints
- [ ] `[BE]` Create 100+ Model Factories for all HRM models
- [ ] `[BE]` Create 20+ missing Policy classes (HRMAC-based)
- [ ] `[BE]` Execute route file split per `[ARCH]` design
- [ ] `[BE]` Create `database/seeders/HrmDemoSeeder.php`, `HrmPermissionSeeder.php`, `HrmModuleSeeder.php`
- [ ] `[ARCH]` Verify all `hrmac:` routes match `config/modules.php` entries
- [ ] `[ARCH]` Run `php artisan hrmac:sync-modules`

### Foundation QC Gate — Week 2-3 `[QC]`
- [ ] `[QC]` Create 200+ feature test methods across all 20 submodules
- [ ] `[QC]` Write policy denial tests for every new policy
- [ ] `[QC]` Write validation failure tests for every new FormRequest
- [ ] `[QC]` Write workflow tests (leave approval, expense approval, payroll lock/rollback)
- [ ] `[QC]` Security audit: missing policy calls, mass assignment, N+1, raw queries
- [ ] `[QC]` Run `php artisan test --filter=Hrm` — all passing ✅

### Service Layer — Week 3-4 `[BE]`
- [ ] `[BE]` Create 15 new service classes (listed in Phase 2)
- [ ] `[BE]` Refactor controllers to delegate to services (thin controller pattern)
- [ ] `[QC]` Write unit tests for each new service class in isolation

### Frontend Redesign — Week 4-6 `[FE]`
- [ ] `[FE]` Audit all 60+ pages for gold-standard compliance
- [ ] `[FE]` Migrate MUI forms to HeroUI (`AddEditTrainingForm`, `AddEditJobForm`, `AddUserForm`)
- [ ] `[FE]` Replace all `auth.permissions?.includes()` with `useHRMAC()` hook
- [ ] `[FE]` Redesign `Dashboard.jsx` with real-time KPIs
- [ ] `[FE]` Add section-level Skeleton loading to all pages
- [ ] `[FE]` Verify dark mode support (`dark:` variants) on all pages
- [ ] `[QC]` Code review all FE changes for pattern compliance and security (no XSS, correct `useHRMAC` guards)

### Advanced Features — Week 6-10 `[BE]` + `[FE]`
- [ ] `[BE]` Implement configurable approval workflow engine (`ApprovalWorkflowTemplate`)
- [ ] `[BE]` + `[FE]` Build AI analytics dashboards (attrition, sentiment, pay equity)
- [ ] `[FE]` Create Employee Experience self-service pages (Dashboard 2.0, Document Vault, Recognition Wall, Learning Hub)
- [ ] `[BE]` + `[FE]` Build custom report builder
- [ ] `[BE]` + `[FE]` Enhance recruitment ATS features (Kanban, video interview, offer management)
- [ ] `[BE]` Evolve payroll with multi-currency + statutory compliance
- [ ] `[QC]` Test all advanced features (happy + failure + edge paths)

### New Submodules — Week 10-12 `[ARCH]` + `[BE]` + `[FE]`
- [ ] `[ARCH]` Add 8 new submodule entries to `config/modules.php` with full HRMAC tree
- [ ] `[BE]` Create backend scaffolding (controllers, models, migrations, services, factories)
- [ ] `[FE]` Create frontend pages following gold-standard pattern
- [ ] `[QC]` Write tests for all new submodules
- [ ] `[ARCH]` Run `php artisan hrmac:sync-modules`
- [ ] `[QC]` Run full test suite: `php artisan test` — all passing ✅

---

## Execution Recommendation

Hand off phases to agents in this order, with explicit handoff messages:

| Phase | Primary Agent | Supporting Agents | Gate |
|-------|--------------|-------------------|------|
| Phase 1 Foundation | `[ARCH]` (design) + `[BE]` (implement) | — | `[QC]` gate before Phase 2 |
| Phase 1 QC Gate | `[QC]` | — | All tests passing |
| Phase 2 Services | `[BE]` | `[ARCH]` approves interfaces | `[QC]` unit tests per service |
| Phase 3 Features | `[BE]` + `[FE]` (parallel) | `[ARCH]` designs data contracts | `[QC]` feature tests per item |
| Phase 4 Frontend | `[FE]` | — | `[QC]` code review per directory |
| Phase 5 Submodules | `[ARCH]` + `[BE]` + `[FE]` | — | `[QC]` full regression run |

**Suggested agent prompt prefix when handing off:**
```
@AEOS Backend Engineer — Execute Phase 1 [BE] tasks from the HRM upgrade prompt.
Start with FormRequests (C-2), then Factories (C-3), then Policies (C-4), then route split (H-1), then Seeders (H-2).
Follow BulkLeaveRequest.php pattern for FormRequests and EmployeeFactory.php for Factories.
Tag @AEOS Quality Control Agent when each batch is complete for test writing.
```
```
@AEOS Quality Control Agent — Execute the Phase 1 QC Gate from the HRM upgrade prompt.
Factories and FormRequests from Phase 1 are complete. Write 200+ feature tests.
Run php artisan test --filter=Hrm and confirm all passing before signalling Phase 2 start.
```
```
@AEOS Frontend Engineer — Execute Phase 4 from the HRM upgrade prompt.
Audit and upgrade all 60+ HRM pages to the LeavesAdmin.jsx gold standard.
Priority order: Dashboard → Employee/ → Attendance/ → Payroll/ → Recruitment/ → remaining directories.
Tag @AEOS Quality Control Agent after each directory for review.
```


