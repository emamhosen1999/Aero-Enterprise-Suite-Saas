
---

# Audit & Redesign Prompt: HRM Module — Advanced Evolution & Gap Remediation

## Target
- **Package:** aero-hrm
- **Frontend:** HRM
- **Generated:** 2026-04-20
- **Scan Scope:** Full Backend + Frontend + Cross-Reference + Security + Redesign Recommendations

## Executive Summary
The HRM module is the **largest module** in the AEOS ecosystem with **20 submodules**, **120+ models**, **34+ services**, **15 policies**, and **60+ frontend pages/directories**. While the config/module.php hierarchy is comprehensive (4-level: module → 20 submodules → ~80 components → ~200 actions), there are **significant gaps** between what's defined and what's actually implemented. Only **11 FormRequests** exist for a module with 200+ mutation actions. Only **16 factories** cover 120+ models. **1 feature test** exists for the entire module. Many frontend pages in subdirectories likely lack HRMAC hooks, ThemedCard patterns, and the LeavesAdmin.jsx gold-standard layout. The module needs both **gap closure** and **architectural evolution** to reach enterprise-grade.

---

## PART A: GAP ANALYSIS — Current State Issues

### Critical Findings (Must Fix)

#### C-1: Near-Zero Test Coverage
- **Scope:** Entire tests
- **Issue:** Only `tests/Feature/ProfileUpdateRouteTest.php` exists. Zero tests for: Leave CRUD, Attendance, Payroll, Recruitment, Performance, Training, Disciplinary, Assets, Expenses, Grievances, Exit Interviews, Pulse Surveys, Compensation Planning, Workforce Planning, Succession Planning, Career Pathing, 360° Feedback, Overtime, Safety, Analytics.
- **Impact:** Critical — no regression safety net for any HRM functionality.
- **Fix:** Create feature tests for every controller endpoint (minimum: store, update, destroy, index, show for each resource). Target: ~200 test methods covering happy + failure + edge paths.

#### C-2: Severely Missing FormRequests (11 exist for 200+ mutation actions)
- **Existing:** `BulkLeaveRequest`, `ProfileUpdateRequest`, `PunchRequest`, `StoreEmployeeDocumentRequest`, `Store/UpdateOffboardingRequest`, `Store/UpdateOnboardingRequest`, `TaskTemplateFormRequest`, `UpdateAttendanceSettingRequest`, `UpdateEmployeeProfileRequest`
- **Missing for:** All Payroll mutations, all Recruitment mutations, all Performance mutations, all Training mutations, all Disciplinary mutations, all Asset mutations, all Expense mutations, all Grievance mutations, all Exit Interview mutations, all Pulse Survey mutations, all Compensation mutations, all Workforce Planning mutations, all Leave type/balance/policy mutations, all Department/Designation store/update, all Attendance mark/update/delete, all Overtime mutations, all Safety mutations, all Succession Planning mutations, all Career Path mutations, all 360° Feedback mutations.
- **Impact:** Critical — inline validation or no validation in controllers = mass assignment risk + inconsistent error messages.

#### C-3: Missing Factories (16 exist for 120+ models)
- **Existing factories:** Asset, AssetAllocation, AssetCategory, Attendance, Department, Designation, DisciplinaryActionType, DisciplinaryCase, Employee, EmployeePersonalDocument, ExpenseCategory, ExpenseClaim, Holiday, Leave, LeaveType, Warning
- **Missing for:** All Payroll-related models (Payroll, Payslip, PayrollAllowance, PayrollDeduction, SalaryComponent, TaxSlab), all Recruitment models (Job, JobApplication, JobOffer, JobInterview, etc.), all Performance models (PerformanceReview, KPI, KPIValue, Competency), all Training models (Training, TrainingSession, TrainingEnrollment, etc.), Benefit, CareerPath, CareerPathMilestone, CompensationAdjustment, CompensationReview, EngagementSurvey, ExitInterview, Feedback360, Grievance, Onboarding, Offboarding, OvertimeRecord, OvertimeRequest, PulseSurvey, Recognition, SafetyIncident, ShiftSchedule, Skill, SuccessionPlan, WorkforcePlan, and 50+ more.
- **Impact:** Critical — cannot seed test data or write meaningful tests without factories.

#### C-4: Missing Policies for Many Authorizable Models
- **Existing (15):** Attendance, Benefit, Competency, Department, Designation, Leave, Offboarding, OffboardingStep, Onboarding, OnboardingStep, Payroll, Recruitment, SafetyInspection, Skill, TaskTemplate
- **Missing:** Asset, AssetAllocation, DisciplinaryCase, Employee (core model!), ExpenseClaim, ExitInterview, Feedback360, Grievance, Job, JobApplication, OvertimeRecord, OvertimeRequest, PerformanceReview, PulseSurvey, Training, TrainingSession, CompensationReview, SuccessionPlan, CareerPath, WorkforcePlan, Warning, Holiday, ShiftSchedule, etc.
- **Impact:** Critical — controllers mutating these models have no policy authorization checks.

### High Findings

#### H-1: Routes File Structure — Single `web.php` for 20 Submodules
- **File:** web.php
- **Issue:** All routes in a single file. No `tenant.php`, `api.php`, or `admin.php` as the package structure convention expects.
- **Impact:** High — difficult to maintain, no API versioning, no separation of tenant vs admin routes.

#### H-2: No Seeders Directory
- **Path:** `packages/aero-hrm/database/seeders/` — directory doesn't exist
- **Impact:** High — no way to seed HRM demo data for new tenants.

#### H-3: Many Frontend Pages Likely Missing HRMAC/ThemedCard/Layout Patterns
- **Scope:** 60+ page files/directories in `Pages/HRM/`
- **Issue:** Subdirectories like `AIAnalytics/`, `Analytics/`, `Assets/`, `Attendance/`, `Benefits/`, `CareerPath/`, `Compensation/`, `Disciplinary/`, `Employee/`, `Employees/`, `EmployeeHistory/`, `Evaluation.jsx`, `ExitInterviews/`, `Expenses/`, `Feedback360/`, `Goals/`, `Grievances/`, `Leaves/`, `Offboarding/`, `Onboarding/`, `Overtime/`, `Payroll/`, `Performance/`, `PulseSurveys/`, `Recruitment/`, `Safety/`, `SelfService/`, `Skills/`, `SuccessionPlanning/`, `TimeOff/`, `TimeSheet/`, `Training/`, `WorkforcePlanning/` need individual audit for HRMAC, ThemedCard, motion.div, App layout wrapper, responsive breakpoints, showToast.promise, Skeleton loading.

#### H-4: MUI Legacy Imports Still Present in HRM Forms
- **Files:** `Forms/HRM/AddEditTrainingForm.jsx`, `Forms/HRM/AddEditJobForm.jsx`, `Forms/HRM/AddUserForm.jsx`
- **Issue:** These use Material UI components instead of HeroUI (per `/memories/repo/ui-standards.md` P2-5 finding).

### Medium Findings

#### M-1: Controller Method Coverage vs Module.php Actions
- **Issue:** Many `config/module.php` actions (approve, reject, lock, rollback, generate, export, etc.) may not have corresponding controller methods. Example: Payroll has `execute`, `lock`, `rollback` actions but PayrollController is inside Employee/ directory.
- **Impact:** Medium — module hierarchy promises features that may not exist.

#### M-2: Service Layer Gaps
- **Existing services (34):** Cover attendance, leave, payroll, employee, HR metrics, AI analytics.
- **Missing:** No dedicated services for Recruitment, Training, Disciplinary, Assets, Expenses, Grievances, Exit Interviews, Pulse Surveys, Compensation Planning, Career Pathing, Succession Planning, Workforce Planning, 360° Feedback, Safety, Benefits, Overtime approval workflow, Onboarding orchestration.

#### M-3: No Events/Listeners for Many Workflow Actions
- **Path:** `src/Events/`, `src/Listeners/`
- **Issue:** Module has Events/Listeners directories but coverage for approval workflows (leave, expense, overtime, grievance, disciplinary) needs verification.

---

## PART B: REDESIGN & EVOLUTION PROMPT

### Objective
Redesign the HRM module from a **basic CRUD HR system** into an **enterprise-grade, AI-enhanced, workflow-driven Human Capital Management (HCM) platform** while maintaining backward compatibility with existing data and routes.

### Phase 1: Foundation Hardening (Execute First)

**Hand to: AEOS Lead Architect**

1. **Create FormRequests for ALL mutation endpoints** — one per store/update action across all 20 submodules. Follow existing `BulkLeaveRequest.php` pattern. Minimum 60 new FormRequests.

2. **Create Factories for ALL 120+ models** — follow existing `EmployeeFactory.php` pattern. Each factory must have useful states (e.g., `EmployeeFactory::active()`, `LeaveFactory::approved()`, `PayrollFactory::locked()`).

3. **Create missing Policies** — at minimum for: Employee, Asset, DisciplinaryCase, ExpenseClaim, ExitInterview, Feedback360, Grievance, Job, JobApplication, OvertimeRecord, PerformanceReview, PulseSurvey, Training, CompensationReview, SuccessionPlan, CareerPath, WorkforcePlan, Warning, Holiday, ShiftSchedule.

4. **Create Feature Tests** — target 200+ test methods:
   - Every controller endpoint: store, update, destroy, index, show
   - Permission denial tests (unauthorized user cannot access)
   - Validation failure tests (invalid data rejected)
   - Workflow tests (leave approval flow, expense approval flow, payroll lock/rollback)

5. **Split web.php** into `tenant.php` (tenant-scoped), `api.php` (JSON endpoints), and `admin.php` (platform admin).

6. **Create seeders** with: `HrmDemoSeeder`, `HrmPermissionSeeder`, `HrmModuleSeeder`.

7. **Verify every `hrmac:` middleware path** in routes matches a `config/module.php` entry. Add missing entries.

### Phase 2: Service Layer Evolution

**Hand to: AEOS Lead Architect**

Create dedicated service classes following existing patterns (`LeaveApprovalService.php`, `PayrollCalculationService.php`):

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

### Phase 3: Advanced Feature Additions

**Hand to: AEOS Lead Architect (backend) + AEOS Frontend Engineer (UI)**

#### 3.1 AI-Powered HR Intelligence (Enhance existing `AIAnalytics/`)
| Feature | Backend | Frontend |
|---------|---------|----------|
| **Attrition Risk Predictor** | `Services/AIAnalytics/AttritionPredictionService.php` (exists) — enhance with ML model integration, risk scoring per employee | `Pages/HRM/AIAnalytics/AttritionDashboard.jsx` — risk heatmap, department drill-down, retention action recommendations |
| **Smart Recruiter** | New `Services/AIAnalytics/ResumeScreeningService.php` — NLP-based resume parsing, skill matching, candidate scoring | `Pages/HRM/Recruitment/AIScreening.jsx` — candidate match scores, skill gap visualization, auto-ranking |
| **Workforce Sentiment Engine** | Enhance `EmployeeSentimentRecord` model — real-time pulse analysis, Slack/Teams integration | `Pages/HRM/AIAnalytics/SentimentDashboard.jsx` — mood trend charts, department comparison, alert thresholds |
| **Compensation Intelligence** | New `Services/AIAnalytics/CompensationAnalysisService.php` — pay equity detection, market rate comparison | `Pages/HRM/Compensation/PayEquityAnalysis.jsx` — gender/role/tenure pay gap visualization |
| **Skill Gap Analyzer** | Enhance `SkillMatrixController` — map current skills vs role requirements, suggest training | `Pages/HRM/Skills/SkillGapAnalysis.jsx` — spider charts per employee, team heat maps |

#### 3.2 Advanced Workflow Engine
| Feature | Description |
|---------|-------------|
| **Configurable Approval Chains** | Replace hardcoded approve/reject with `ApprovalWorkflowTemplate` model (exists!) — support multi-level, parallel, conditional approval for leaves, expenses, overtime, payroll, disciplinary, recruitment offers |
| **Automated Escalation** | If approval pending > N days, auto-escalate to next level |
| **Bulk Operations** | Extend existing `BulkLeaveController` pattern to: bulk attendance marking, bulk payroll processing, bulk training enrollment, bulk asset allocation |
| **Scheduled Actions** | Leave accrual engine (exists in config but `route: null`), automatic probation completion, contract renewal reminders |

#### 3.3 Employee Experience & Self-Service Enhancement
| Feature | Page | Description |
|---------|------|-------------|
| **Employee Dashboard 2.0** | `Pages/HRM/SelfService/Dashboard.jsx` | Unified widget dashboard: attendance status, leave balance, pending approvals, upcoming training, payslip preview, team calendar, announcements |
| **Mobile-First Punch** | `Pages/HRM/SelfService/MobilePunch.jsx` | GPS + QR + biometric clock-in with offline support |
| **Document Vault** | `Pages/HRM/SelfService/DocumentVault.jsx` | Encrypted personal document storage with expiry reminders (passport, visa, certifications) |
| **Team Calendar** | `Pages/HRM/SelfService/TeamCalendar.jsx` | Visual who's-in/who's-out calendar for the employee's team |
| **Recognition Wall** | `Pages/HRM/SelfService/RecognitionWall.jsx` | Peer-to-peer kudos, badges, points system (Recognition model exists) |
| **Learning Hub** | `Pages/HRM/SelfService/LearningHub.jsx` | My training history, recommended courses, certification tracker, skill assessments |

#### 3.4 Analytics & Reporting Evolution
| Feature | Description |
|---------|-------------|
| **Real-Time HR Dashboard** | Replace static `Dashboard.jsx` with live-updating KPI cards: headcount, attrition rate, avg tenure, open positions, pending approvals, payroll cost, training hours, safety incidents |
| **Custom Report Builder** | Drag-and-drop field selector, filter builder, chart type picker, schedule email delivery |
| **Compliance Reports** | EEO-1, OSHA 300, labor law compliance, audit trail exports |
| **Predictive Analytics** | Turnover prediction (enhance existing `AttritionPrediction` model), hiring demand forecasting, budget variance analysis |
| **Executive Dashboards** | Board-level HR metrics: cost per hire, revenue per employee, HR-to-employee ratio, engagement index |

#### 3.5 Recruitment ATS Evolution
| Feature | Description |
|---------|-------------|
| **Career Portal** | Public-facing job board with company branding, application form builder |
| **Pipeline Kanban** | Visual drag-and-drop candidate pipeline (Kanban.jsx exists — extend for recruitment) |
| **Video Interview** | Async video interview scheduling with rating system |
| **Offer Management** | Template-based offer letters with e-signature integration |
| **Recruitment Analytics** | Time-to-hire, cost-per-hire, source effectiveness, pipeline conversion rates |
| **Referral Program** | Employee referral tracking with bonus automation |

#### 3.6 Payroll Evolution
| Feature | Description |
|---------|-------------|
| **Multi-Currency Payroll** | Support international employees with currency conversion |
| **Statutory Compliance** | Country-specific tax calculations, social security, pension schemes |
| **Payroll Approval Workflow** | Draft → Review → Approve → Lock → Process → Bank File |
| **Payroll Analytics** | Cost center analysis, YoY comparison, department budgets, headcount cost |
| **Loan Management** | EMI calculations, automatic payroll deductions, loan balance tracking (model exists) |
| **Bank Integration** | SEPA, ACH, SWIFT file generation (BankIntegrationService exists — enhance) |

### Phase 4: Frontend Redesign (All Pages)

**Hand to: AEOS Frontend Engineer**

Audit and upgrade ALL 60+ HRM pages to follow the gold-standard pattern. For each page:

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

### Phase 5: New Submodules to Add to `config/module.php`

Add these missing submodules that modern HCM platforms require:

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

### Foundation (Week 1-2)
- [ ] Create 60+ FormRequest classes for all mutation endpoints
- [ ] Create 100+ Model Factories for all HRM models  
- [ ] Create 20+ missing Policy classes
- [ ] Create `database/seeders/HrmDemoSeeder.php`
- [ ] Split web.php → `tenant.php` + `api.php` + `admin.php`
- [ ] Verify all `hrmac:` routes match `config/module.php` entries
- [ ] Run `php artisan hrmac:sync-modules`

### Tests (Week 2-3)
- [ ] Create 200+ feature test methods across all 20 submodules
- [ ] Run `php artisan test --filter=Hrm` — all passing

### Service Layer (Week 3-4)
- [ ] Create 15 new service classes (listed in Phase 2)
- [ ] Refactor controllers to delegate to services (thin controller pattern)

### Frontend Redesign (Week 4-6)
- [ ] Audit all 60+ pages for gold-standard compliance
- [ ] Migrate MUI forms to HeroUI (`AddEditTrainingForm`, `AddEditJobForm`, `AddUserForm`)
- [ ] Redesign `Dashboard.jsx` with real-time KPIs
- [ ] Add section-level Skeleton loading to all pages
- [ ] Verify dark mode support on all pages

### Advanced Features (Week 6-10)
- [ ] Implement configurable approval workflow engine
- [ ] Build AI analytics dashboards (attrition, sentiment, pay equity)
- [ ] Create Employee Experience self-service pages
- [ ] Build custom report builder
- [ ] Enhance recruitment ATS features
- [ ] Evolve payroll with multi-currency + compliance

### New Submodules (Week 10-12)
- [ ] Add 8 new submodule entries to `config/module.php`
- [ ] Create backend scaffolding (controllers, models, migrations, services)
- [ ] Create frontend pages following gold-standard pattern
- [ ] Create tests for new submodules
- [ ] Run `php artisan hrmac:sync-modules`
- [ ] Run full test suite: `php artisan test`

---

## Execution Recommendation
1. **Phase 1 (Foundation)** → Hand to **AEOS Lead Architect** — FormRequests, Factories, Policies, Tests, Route splitting
2. **Phase 4 (Frontend Redesign)** → Hand to **AEOS Frontend Engineer** — page-by-page audit and upgrade
3. **Phase 2-3 (Services + Features)** → Hand to **AEOS Lead Architect** (backend) + **AEOS Frontend Engineer** (UI) in parallel
4. **Phase 5 (New Submodules)** → Hand to **AEOS Lead Architect** for scaffolding, then **AEOS Frontend Engineer** for pages 

