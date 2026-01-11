# HRM Package Architectural & Functional Audit Report

**Date:** January 11, 2026  
**Scope:** HRM Package Event Handling, Notifications, and Package Boundaries  
**Status:** CRITICAL VIOLATIONS DETECTED

---

## Executive Summary

This audit identified **critical architectural violations** in the HRM package related to package boundaries, missing domain events, incomplete notification coverage, and lack of UI configurability for notification preferences.

### Key Findings

1. **Package Boundary Violations:** 20+ direct imports of `Aero\Core\Models\User` in HRM package
2. **Missing Events:** 15+ HRM features lack domain events
3. **Incomplete Notification Coverage:** Limited channel support (missing SMS, push notifications)
4. **No UI Configurability:** No user/admin controls for notification preferences
5. **Limited Delivery Tracking:** No systematic logging or failure handling

---

## 1. Package Boundary Audit

### 🔴 CRITICAL VIOLATIONS DETECTED

#### Rule Violations

**Rule:** HRM package MUST NOT directly import or depend on Core package models.  
**Status:** ❌ VIOLATED

**Direct User Model Imports Found:** 20+ occurrences

```
Files with Direct User Imports:
├── src/Models/Employee.php                          (line 5: use Aero\Core\Models\User;)
├── src/Policies/*.php                              (7 files)
├── src/Services/LeaveApprovalService.php
├── src/Services/LeaveBalanceService.php
├── src/Services/HRMetricsAggregatorService.php
├── src/Services/BulkLeaveService.php
├── src/Services/AttendanceCalculationService.php
├── src/Models/EmergencyContact.php
├── database/factories/EmployeeFactory.php
├── database/factories/EmployeePersonalDocumentFactory.php
└── tests/Feature/**/*.php                          (3 files)
```

#### Impact Analysis

1. **Tight Coupling:** HRM is tightly coupled to Core User model
2. **No Independent Evolution:** Changes to User model require HRM updates
3. **Testing Complexity:** Cannot test HRM in isolation
4. **Violates DDD Principles:** Breaks bounded context integrity

### Required Fixes

1. **Create User Contract/Interface** in Core package
   ```php
   // packages/aero-core/src/Contracts/UserContract.php
   interface UserContract {
       public function getId(): int;
       public function getName(): string;
       public function getEmail(): string;
       public function notify($notification): void;
       // ... other required methods
   }
   ```

2. **Create HRM User DTO** for data transfer
   ```php
   // packages/aero-hrm/src/DTOs/UserDTO.php
   class UserDTO {
       public function __construct(
           public int $id,
           public string $name,
           public string $email,
           // ... other properties
       ) {}
   }
   ```

3. **Refactor All Direct Dependencies** to use interface/DTO
4. **Use Events for Cross-Package Communication**

---

## 2. HRM Event Coverage Audit

### Current Events (10)

| Event | Status | Trigger Location | Listeners |
|-------|--------|------------------|-----------|
| `LeaveRequested` | ✅ Implemented | LeaveController::store | UpdateBalanceOnLeaveRequest, NotifyManagerOfLeaveRequest |
| `LeaveApproved` | ✅ Implemented | LeaveController::updateStatus | UpdateBalanceOnLeaveApproval |
| `LeaveRejected` | ✅ Implemented | LeaveController::updateStatus | UpdateBalanceOnLeaveRejection |
| `LeaveCancelled` | ✅ Implemented | LeaveController::destroy | UpdateBalanceOnLeaveCancellation, NotifyOnLeaveCancellation |
| `PayrollGenerated` | ✅ Implemented | PayrollController | SendPayslipNotificationsNew |
| `EmployeeBirthday` | ✅ Implemented | CheckBirthdaysJob | SendBirthdayNotifications |
| `WorkAnniversary` | ✅ Implemented | CheckWorkAnniversariesJob | SendWorkAnniversaryNotifications |
| `DocumentExpiring` | ✅ Implemented | CheckExpiringDocumentsJob | SendDocumentExpiryNotifications |
| `ProbationEnding` | ✅ Implemented | CheckProbationEndingJob | SendProbationEndingNotifications |
| `ContractExpiring` | ✅ Implemented | CheckExpiringContractsJob | SendContractExpiryNotifications |

### 🔴 MISSING EVENTS (15+)

#### Employee Lifecycle Events

| Missing Event | Feature | Trigger Point | Priority |
|---------------|---------|---------------|----------|
| `EmployeeCreated` | Employee Management | EmployeeController::store | 🔴 HIGH |
| `EmployeeUpdated` | Employee Management | EmployeeController::update | 🟡 MEDIUM |
| `EmployeeDeleted` | Employee Management | EmployeeController::destroy | 🟡 MEDIUM |
| `EmployeePromoted` | Employee Management | Designation/Department change | 🟡 MEDIUM |
| `EmployeeResigned` | Offboarding | OffboardingController::store | 🔴 HIGH |
| `EmployeeTerminated` | Offboarding | OffboardingController::store | 🔴 HIGH |

#### Attendance Events

| Missing Event | Feature | Trigger Point | Priority |
|---------------|---------|---------------|----------|
| `AttendancePunchedIn` | Attendance | AttendanceController::punchIn | 🔴 HIGH |
| `AttendancePunchedOut` | Attendance | AttendanceController::punchOut | 🔴 HIGH |
| `LateArrivalDetected` | Attendance | Attendance validation | 🟡 MEDIUM |
| `EarlyDepartureDetected` | Attendance | Attendance validation | 🟡 MEDIUM |
| `AttendanceMarkedAbsent` | Attendance | Automatic marking | 🟡 MEDIUM |

#### Onboarding/Offboarding Events

| Missing Event | Feature | Trigger Point | Priority |
|---------------|---------|---------------|----------|
| `OnboardingStarted` | Onboarding | OnboardingController::store | 🔴 HIGH |
| `OnboardingTaskCompleted` | Onboarding | Task completion | 🟡 MEDIUM |
| `OnboardingCompleted` | Onboarding | All tasks done | 🔴 HIGH |
| `OffboardingStarted` | Offboarding | OffboardingController::storeOffboarding | 🔴 HIGH |
| `OffboardingTaskCompleted` | Offboarding | Task completion | 🟡 MEDIUM |
| `OffboardingCompleted` | Offboarding | All tasks done | 🔴 HIGH |

#### Performance Management Events

| Missing Event | Feature | Trigger Point | Priority |
|---------------|---------|---------------|----------|
| `PerformanceReviewCreated` | Performance Review | PerformanceReviewController::store | 🟡 MEDIUM |
| `PerformanceReviewCompleted` | Performance Review | Review submission | 🔴 HIGH |
| `GoalCreated` | Goal Management | GoalController::store | 🟡 MEDIUM |
| `GoalCompleted` | Goal Management | Goal achievement | 🟡 MEDIUM |
| `KPIDue` | KPI Management | Scheduled check | 🟡 MEDIUM |

#### Recruitment Events

| Missing Event | Feature | Trigger Point | Priority |
|---------------|---------|---------------|----------|
| `JobPosted` | Recruitment | RecruitmentController::store | 🟡 MEDIUM |
| `ApplicationReceived` | Recruitment | Application submit | 🔴 HIGH |
| `ApplicationShortlisted` | Recruitment | Stage change | 🟡 MEDIUM |
| `ApplicationRejected` | Recruitment | Stage change | 🟡 MEDIUM |
| `InterviewScheduled` | Recruitment | Interview creation | 🔴 HIGH |
| `OfferExtended` | Recruitment | Offer generation | 🔴 HIGH |
| `OfferAccepted` | Recruitment | Offer acceptance | 🔴 HIGH |

#### Training Events

| Missing Event | Feature | Trigger Point | Priority |
|---------------|---------|---------------|----------|
| `TrainingScheduled` | Training | TrainingController::store | 🟡 MEDIUM |
| `TrainingEnrollmentCreated` | Training | Enrollment | 🟡 MEDIUM |
| `TrainingCompleted` | Training | Training completion | 🟡 MEDIUM |
| `CertificationExpiring` | Training | Scheduled check | 🟡 MEDIUM |

#### Asset Management Events

| Missing Event | Feature | Trigger Point | Priority |
|---------------|---------|---------------|----------|
| `AssetAllocated` | Asset Management | Asset allocation | 🟡 MEDIUM |
| `AssetReturned` | Asset Management | Asset return | 🟡 MEDIUM |
| `AssetMaintenanceDue` | Asset Management | Scheduled check | 🟡 MEDIUM |

#### Expense & Payroll Events

| Missing Event | Feature | Trigger Point | Priority |
|---------------|---------|---------------|----------|
| `ExpenseClaimSubmitted` | Expense Management | ExpenseClaimController::store | 🟡 MEDIUM |
| `ExpenseClaimApproved` | Expense Management | ExpenseClaimController::approve | 🟡 MEDIUM |
| `ExpenseClaimRejected` | Expense Management | ExpenseClaimController::reject | 🟡 MEDIUM |
| `PayrollProcessed` | Payroll | Payroll generation | 🔴 HIGH |
| `SalaryRevised` | Payroll | Salary structure update | 🟡 MEDIUM |

#### Safety & Compliance Events

| Missing Event | Feature | Trigger Point | Priority |
|---------------|---------|---------------|----------|
| `SafetyIncidentReported` | Safety | SafetyIncidentController::store | 🔴 HIGH |
| `SafetyInspectionScheduled` | Safety | Inspection creation | 🟡 MEDIUM |
| `SafetyTrainingDue` | Safety | Scheduled check | 🟡 MEDIUM |

**Total Missing Events:** 40+

---

## 3. Notification Coverage Audit

### Current Notification Structure

#### Base Notification Class
```php
// packages/aero-hrm/src/Notifications/BaseHrmNotification.php
abstract class BaseHrmNotification extends Notification
{
    // Uses HrmNotificationChannelResolver for channel selection
    // Currently supports: database (in-app)
}
```

#### Existing Notifications (18)

| Notification | Event | Channels | Status |
|--------------|-------|----------|--------|
| LeaveRequestNotification | LeaveRequested | database | ✅ Partial |
| LeaveApprovedNotification | LeaveApproved | database | ✅ Partial |
| LeaveRejectedNotification | LeaveRejected | database | ✅ Partial |
| LeaveCancelledNotification | LeaveCancelled | database | ✅ Partial |
| BirthdayWishNotification | EmployeeBirthday | database | ✅ Partial |
| WorkAnniversaryNotification | WorkAnniversary | database | ✅ Partial |
| DocumentExpiryNotification | DocumentExpiring | database | ✅ Partial |
| ContractExpiryNotification | ContractExpiring | database | ✅ Partial |
| ProbationEndingNotification | ProbationEnding | database | ✅ Partial |
| PayslipReadyNotification | PayrollGenerated | database | ✅ Partial |
| WelcomeEmployeeNotification | EmployeeCreated | database | ❌ Missing Event |
| OnboardingReminderNotification | Scheduled | database | ✅ Partial |
| ManagerOnboardingReminderNotification | Scheduled | database | ✅ Partial |
| LateArrivalNotification | AttendanceLogged | database | ❌ Missing Event |
| NewApplicationNotification | CandidateApplied | database | ✅ Partial |
| TeamBirthdayAlertNotification | EmployeeBirthday | database | ✅ Partial |

### 🔴 CRITICAL GAPS

#### 1. Limited Channel Support

**Current:** Database (in-app) only  
**Missing:**
- ❌ Email notifications
- ❌ SMS notifications
- ❌ Push notifications (mobile/web)
- ❌ Slack/Teams integrations

#### 2. No Channel Configuration

**Problem:** Channels are hardcoded in notification classes  
**Required:**
- Admin-level channel enable/disable
- User-level channel preferences
- Per-event channel configuration

#### 3. Missing Notifications for New Events

All 40+ missing events need corresponding notifications across all channels.

---

## 4. UI Configurability Audit

### 🔴 NO UI CONFIGURATION EXISTS

#### Required Admin Settings (NOT IMPLEMENTED)

1. **Global Notification Settings**
   ```
   ❌ Enable/disable notification channels globally
   ❌ Default channel preferences for new users
   ❌ Email template customization
   ❌ SMS template customization
   ❌ Push notification configuration
   ```

2. **Event-Level Configuration**
   ```
   ❌ Enable/disable specific events
   ❌ Configure notification recipients (user, manager, HR, admin)
   ❌ Set notification timing (immediate, batched, scheduled)
   ❌ Configure notification content templates
   ```

3. **Department/Role Overrides**
   ```
   ❌ Department-specific notification rules
   ❌ Role-based notification preferences
   ❌ Manager notification escalation rules
   ```

#### Required User Settings (NOT IMPLEMENTED)

1. **Channel Preferences**
   ```
   ❌ Opt-in/out per channel (email, SMS, push, in-app)
   ❌ Per-event channel selection
   ❌ Quiet hours configuration
   ❌ Digest/batch preferences
   ```

2. **Content Preferences**
   ```
   ❌ Notification language selection
   ❌ Notification detail level (summary vs detailed)
   ❌ Frequency limits (max notifications per hour/day)
   ```

### Required UI Pages

1. **Admin: Notification Settings** (`/hrm/settings/notifications`)
   - Global channel configuration
   - Event management (enable/disable)
   - Template editor
   - Default preferences

2. **User: Notification Preferences** (`/profile/notifications`)
   - Channel opt-in/out
   - Per-event preferences
   - Quiet hours
   - Digest settings

---

## 5. Delivery & Reliability Audit

### Current State

#### ✅ Implemented

1. **Event-Listener Pattern:** Using Laravel EventServiceProvider
2. **Queued Notifications:** Listeners implement `ShouldQueue`
3. **Basic Error Handling:** `failed()` method in some listeners
4. **Activity Logging:** Using `activity()` helper in some places

#### ❌ Missing

1. **Systematic Delivery Tracking**
   ```
   ❌ No notification_logs table
   ❌ No delivery status tracking (sent, failed, retried)
   ❌ No delivery timestamps
   ❌ No failure reason logging
   ```

2. **Retry Mechanism**
   ```
   ❌ No automatic retries for failed notifications
   ❌ No exponential backoff
   ❌ No dead letter queue
   ```

3. **Delivery Confirmation**
   ```
   ❌ No email delivery webhooks
   ❌ No SMS delivery reports
   ❌ No push notification acknowledgment
   ```

4. **Performance Monitoring**
   ```
   ❌ No delivery metrics (rate, latency)
   ❌ No failure analytics
   ❌ No channel health monitoring
   ```

5. **User Feedback**
   ```
   ❌ No notification read/unread tracking
   ❌ No notification archiving
   ❌ No bulk mark as read
   ```

### Required Database Schema

```sql
-- Notification delivery tracking
CREATE TABLE notification_logs (
    id BIGINT PRIMARY KEY,
    notifiable_type VARCHAR(255),
    notifiable_id BIGINT,
    notification_type VARCHAR(255),
    channel VARCHAR(50),
    status ENUM('pending', 'sent', 'failed', 'retrying'),
    sent_at TIMESTAMP NULL,
    failed_at TIMESTAMP NULL,
    failure_reason TEXT NULL,
    retry_count INT DEFAULT 0,
    metadata JSON,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

-- User notification preferences
CREATE TABLE user_notification_preferences (
    id BIGINT PRIMARY KEY,
    user_id BIGINT,
    event_type VARCHAR(255),
    channel VARCHAR(50),
    enabled BOOLEAN DEFAULT true,
    quiet_hours_start TIME NULL,
    quiet_hours_end TIME NULL,
    digest_frequency ENUM('realtime', 'hourly', 'daily', 'weekly') DEFAULT 'realtime',
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    UNIQUE KEY (user_id, event_type, channel)
);

-- Admin notification settings
CREATE TABLE notification_settings (
    id BIGINT PRIMARY KEY,
    key VARCHAR(255) UNIQUE,
    value JSON,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

---

## 6. Implementation Priority

### Phase 1: Critical Fixes (Week 1-2)

1. **Package Boundary Refactoring** 🔴 CRITICAL
   - Create `UserContract` interface
   - Create `UserDTO` for data transfer
   - Refactor all direct User model dependencies
   - Use events for cross-package communication

2. **High-Priority Missing Events** 🔴 CRITICAL
   - EmployeeCreated, EmployeeResigned, EmployeeTerminated
   - OnboardingStarted, OnboardingCompleted
   - OffboardingStarted, OffboardingCompleted
   - AttendancePunchedIn, AttendancePunchedOut
   - PerformanceReviewCompleted
   - ApplicationReceived, InterviewScheduled, OfferExtended
   - SafetyIncidentReported

3. **Notification Database Schema** 🔴 CRITICAL
   - Create `notification_logs` table
   - Create `user_notification_preferences` table
   - Create `notification_settings` table

### Phase 2: Channel Expansion (Week 3-4)

1. **Email Notifications**
   - Implement email channel for all notifications
   - Create email templates
   - Configure email service

2. **SMS Notifications**
   - Integrate SMS provider (Twilio, AWS SNS, etc.)
   - Implement SMS channel
   - Create SMS templates

3. **Push Notifications**
   - Implement web push (Laravel WebPush)
   - Implement mobile push (FCM/APNS)
   - Create push notification templates

### Phase 3: UI Configuration (Week 5-6)

1. **Admin Settings UI**
   - Global notification settings page
   - Event management interface
   - Template editor
   - Channel configuration

2. **User Preferences UI**
   - Personal notification preferences page
   - Channel opt-in/out controls
   - Quiet hours configuration
   - Per-event preferences

### Phase 4: Delivery & Monitoring (Week 7-8)

1. **Delivery Tracking**
   - Implement notification logging service
   - Track delivery status
   - Implement retry mechanism

2. **Monitoring & Analytics**
   - Delivery metrics dashboard
   - Failure analytics
   - Performance monitoring

3. **User Features**
   - Notification read/unread tracking
   - Notification archiving
   - Bulk operations

---

## 7. Summary Statistics

| Category | Total | Implemented | Missing | Compliance |
|----------|-------|-------------|---------|------------|
| **Events** | 50+ | 10 | 40+ | 20% |
| **Notifications** | 58+ | 18 | 40+ | 31% |
| **Channels** | 4 | 1 | 3 | 25% |
| **UI Configuration** | 2 pages | 0 | 2 | 0% |
| **Delivery Tracking** | 1 system | 0 | 1 | 0% |
| **Package Boundaries** | Clean | Violated | - | ❌ FAIL |

### Overall Assessment: 🔴 CRITICAL

**Major Issues:**
1. Package boundary violations (tight coupling)
2. 80% of domain events missing
3. Single channel support (database only)
4. Zero UI configurability
5. No delivery tracking or monitoring

**Recommendation:** Immediate refactoring required before adding new features.

---

## Appendix A: Complete Event Mapping

### Implemented Events

```
HRM Feature → Event → Notification → Channels
├── Leave Management
│   ├── LeaveRequested → LeaveRequestNotification → [database]
│   ├── LeaveApproved → LeaveApprovedNotification → [database]
│   ├── LeaveRejected → LeaveRejectedNotification → [database]
│   └── LeaveCancelled → LeaveCancelledNotification → [database]
├── Payroll
│   └── PayrollGenerated → PayslipReadyNotification → [database]
├── Employee Lifecycle
│   ├── EmployeeBirthday → BirthdayWishNotification → [database]
│   ├── WorkAnniversary → WorkAnniversaryNotification → [database]
│   ├── DocumentExpiring → DocumentExpiryNotification → [database]
│   ├── ProbationEnding → ProbationEndingNotification → [database]
│   └── ContractExpiring → ContractExpiryNotification → [database]
└── Recruitment
    └── CandidateApplied → NewApplicationNotification → [database]
```

### Required Event Mapping (Sample - 10 of 40+)

```
HRM Feature → Event → Notification → Channels (All Required)
├── Employee Management
│   ├── EmployeeCreated → WelcomeEmployeeNotification → [database, email, SMS]
│   ├── EmployeePromoted → PromotionNotification → [database, email]
│   └── EmployeeTerminated → TerminationNotification → [database, email]
├── Attendance
│   ├── AttendancePunchedIn → AttendanceConfirmationNotification → [database, push]
│   ├── AttendancePunchedOut → AttendanceConfirmationNotification → [database, push]
│   └── LateArrivalDetected → LateArrivalNotification → [database, email, SMS]
├── Onboarding
│   ├── OnboardingStarted → OnboardingWelcomeNotification → [database, email]
│   ├── OnboardingTaskCompleted → OnboardingProgressNotification → [database]
│   └── OnboardingCompleted → OnboardingCompletionNotification → [database, email]
└── Performance
    └── PerformanceReviewCompleted → ReviewFeedbackNotification → [database, email]
```

---

## Appendix B: Violation Details

### Direct User Model Imports (Complete List)

```
packages/aero-hrm/src/Models/Employee.php:5
packages/aero-hrm/src/Models/EmergencyContact.php:5
packages/aero-hrm/src/Policies/AttendancePolicy.php:7
packages/aero-hrm/src/Policies/BenefitPolicy.php:7
packages/aero-hrm/src/Policies/CompetencyPolicy.php:7
packages/aero-hrm/src/Policies/DepartmentPolicy.php:7
packages/aero-hrm/src/Policies/DesignationPolicy.php:7
packages/aero-hrm/src/Policies/LeavePolicy.php:7
packages/aero-hrm/src/Policies/OffboardingPolicy.php:7
packages/aero-hrm/src/Policies/OffboardingStepPolicy.php:7
packages/aero-hrm/src/Policies/OnboardingPolicy.php:7
packages/aero-hrm/src/Policies/OnboardingStepPolicy.php:7
packages/aero-hrm/src/Policies/PayrollPolicy.php:7
packages/aero-hrm/src/Policies/RecruitmentPolicy.php:6
packages/aero-hrm/src/Policies/SkillPolicy.php:7
packages/aero-hrm/src/Services/AttendanceCalculationService.php:7
packages/aero-hrm/src/Services/BulkLeaveService.php:7
packages/aero-hrm/src/Services/HRMetricsAggregatorService.php:7
packages/aero-hrm/src/Services/LeaveApprovalService.php:7
packages/aero-hrm/src/Services/LeaveBalanceService.php:8
```

**Action Required:** All must be refactored to use `UserContract` interface.

---

**End of Audit Report**
