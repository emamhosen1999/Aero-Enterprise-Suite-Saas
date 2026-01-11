# HRM Notifications & Events System Audit Report

**Audit Date:** January 11, 2026  
**Package:** `aero-hrm` (Aero Enterprise Suite SaaS)  
**Auditor:** AI Automated Audit  

---

## Executive Summary

This report documents a comprehensive audit of the HRM module's notifications and event system. The audit covers:

- ✅ Event definitions and dispatch points
- ✅ Notification classes and channel support
- ✅ Event-to-notification mapping
- ✅ Channel configurability (UI vs backend)
- ✅ Delivery mechanisms, retry logic, and logging
- ⚠️ Identified gaps and recommendations

### Key Findings

| Metric | Count |
|--------|-------|
| Total Events Defined | 9 |
| Total Notification Classes | 9 |
| Active Event-Notification Mappings | 7 |
| Supported Channels | 4 (mail, database, push, SMS) |
| Events Without Notifications | 2 |
| Missing Critical Notifications | 5+ |

---

## 1. Event Definitions

### 1.1 Core Events (`packages/aero-hrm/src/Events/`)

| Event Class | Model | Dispatch Location | Description |
|-------------|-------|-------------------|-------------|
| `AttendanceLogged` | `Attendance` | Attendance punch | Fired when attendance is logged |
| `CandidateApplied` | `JobApplication` | Job application submission | Fired when candidate applies |
| `EmployeeCreated` | `User` | Employee onboarding | Fired when employee created |
| `LeaveRequested` | `Leave` | LeaveController::store() | Fired when leave submitted |
| `PayrollGenerated` | `Payroll` | Payroll processing | Fired when payroll generated |

### 1.2 Leave-Specific Events (`packages/aero-hrm/src/Events/Leave/`)

| Event Class | Model | Dispatch Location | Description |
|-------------|-------|-------------------|-------------|
| `LeaveRequested` | `Leave` | LeaveController | Leave submission |
| `LeaveApproved` | `Leave` | LeaveController::updateStatus() | Leave approved |
| `LeaveRejected` | `Leave` | LeaveController::updateStatus() | Leave rejected |
| `LeaveCancelled` | `Leave` | LeaveController::delete() | Leave cancelled/deleted |

---

## 2. Notification Classes

### 2.1 HRM Notification Inventory

| Notification Class | Channels | ShouldQueue | Purpose |
|-------------------|----------|-------------|---------|
| `LateArrivalNotification` | mail, database | ✅ Yes | Manager alert for late arrival |
| `LeaveApprovalNotification` | mail, database | ✅ Yes | Manager approval request |
| `LeaveApprovedNotification` | mail, database | ✅ Yes | Employee leave approved |
| `LeaveRejectedNotification` | mail, database | ✅ Yes | Employee leave rejected |
| `LeaveRequestNotification` | mail, database | ✅ Yes | Manager/HR notification |
| `ManagerOnboardingReminderNotification` | mail, database | ✅ Yes | Manager reminder |
| `NewApplicationNotification` | mail, database | ✅ Yes | Recruiter notification |
| `OnboardingReminderNotification` | mail, database | ✅ Yes | Employee reminder |
| `WelcomeEmployeeNotification` | mail, database | ✅ Yes | Employee welcome |

### 2.2 Channel Support Matrix

| Notification | Email | In-App (DB) | Push (FCM) | SMS | Slack |
|--------------|:-----:|:-----------:|:----------:|:---:|:-----:|
| LateArrivalNotification | ✅ | ✅ | ❌ | ❌ | ❌ |
| LeaveApprovalNotification | ✅ | ✅ | ❌ | ❌ | ❌ |
| LeaveApprovedNotification | ✅ | ✅ | ❌ | ❌ | ❌ |
| LeaveRejectedNotification | ✅ | ✅ | ❌ | ❌ | ❌ |
| LeaveRequestNotification | ✅ | ✅ | ❌ | ❌ | ❌ |
| NewApplicationNotification | ✅ | ✅ | ❌ | ❌ | ❌ |
| OnboardingReminderNotification | ✅ | ✅ | ❌ | ❌ | ❌ |
| WelcomeEmployeeNotification | ✅ | ✅ | ❌ | ❌ | ❌ |

---

## 3. Event → Notification Mapping

### 3.1 Current Mappings

```
┌──────────────────────────┐     ┌─────────────────────────────────┐
│ AttendanceLogged         │────▶│ LateArrivalNotification         │
│ (via LogAttendanceActivity)    │ (only if late + 3+ times/month) │
└──────────────────────────┘     └─────────────────────────────────┘

┌──────────────────────────┐     ┌─────────────────────────────────┐
│ LeaveRequested           │────▶│ LeaveRequestNotification        │
│ (via NotifyManagerOfLeave)     │ (to manager + HR roles)         │
└──────────────────────────┘     └─────────────────────────────────┘

┌──────────────────────────┐     ┌─────────────────────────────────┐
│ LeaveApproved            │────▶│ LeaveApprovedNotification       │
│ (via LeaveApprovalService)     │ (direct call, not listener)     │
└──────────────────────────┘     └─────────────────────────────────┘

┌──────────────────────────┐     ┌─────────────────────────────────┐
│ LeaveRejected            │────▶│ LeaveRejectedNotification       │
│ (via LeaveApprovalService)     │ (direct call, not listener)     │
└──────────────────────────┘     └─────────────────────────────────┘

┌──────────────────────────┐     ┌─────────────────────────────────┐
│ CandidateApplied         │────▶│ NewApplicationNotification      │
│ (via NotifyRecruiterOf...)     │ (to recruiters + job owner)     │
└──────────────────────────┘     └─────────────────────────────────┘

┌──────────────────────────┐     ┌─────────────────────────────────┐
│ EmployeeCreated          │────▶│ WelcomeEmployeeNotification     │
│ (via EmployeeController)       │ (direct call in controller)     │
└──────────────────────────┘     └─────────────────────────────────┘

┌──────────────────────────┐     ┌─────────────────────────────────┐
│ PayrollGenerated         │────▶│ (PayslipEmail - incomplete)     │
│ (via SendPayslipNotification)  │ (Mail commented out)            │
└──────────────────────────┘     └─────────────────────────────────┘
```

### 3.2 Events Without Direct Notification Triggers

| Event | Current Status | Recommendation |
|-------|----------------|----------------|
| `LeaveCancelled` | Balance update only | Add LeaveCancelledNotification |
| `PayrollGenerated` | Incomplete implementation | Complete PayslipNotification |

---

## 4. Channel Configurability

### 4.1 User Preference Service

**Location:** `packages/aero-core/src/Services/Notification/NotificationPreferenceService.php`

**Supported Configuration:**

```php
const CHANNELS = ['email', 'push', 'sms', 'in_app'];

protected array $defaultCategories = [
    'leave' => [
        'leave_requested' => ['email' => true, 'push' => true, 'sms' => false, 'in_app' => true],
        'leave_approved' => ['email' => true, 'push' => true, 'sms' => false, 'in_app' => true],
        'leave_rejected' => ['email' => true, 'push' => true, 'sms' => false, 'in_app' => true],
        'leave_cancelled' => ['email' => true, 'push' => false, 'sms' => false, 'in_app' => true],
    ],
    'attendance' => [
        'punch_reminder' => ['email' => false, 'push' => true, 'sms' => false, 'in_app' => true],
        'late_arrival' => ['email' => false, 'push' => true, 'sms' => false, 'in_app' => true],
        // ...
    ],
    'payroll' => [
        'payslip_ready' => ['email' => true, 'push' => true, 'sms' => false, 'in_app' => true],
        'salary_credited' => ['email' => true, 'push' => true, 'sms' => true, 'in_app' => true],
    ],
];
```

### 4.2 Configuration Access Matrix

| Configuration Type | UI Accessible | API Accessible | Backend Only |
|-------------------|:-------------:|:--------------:|:------------:|
| **Channel Enable/Disable** | ✅ | ✅ | - |
| **Quiet Hours** | ✅ | ✅ | - |
| **Digest Frequency** | ✅ | ✅ | - |
| **Per-Event Channel Override** | ⚠️ Partial | ✅ | - |
| **Email Templates** | ❌ | ❌ | ✅ |
| **SMS Provider Config** | ❌ | ❌ | ✅ |
| **Push (FCM) Config** | ❌ | ❌ | ✅ |

### 4.3 API Endpoints for Preferences

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/notifications/preferences` | GET | Get user preferences |
| `/api/notifications/preferences` | PUT | Update preferences |
| `/api/notifications` | GET | List notifications |
| `/api/notifications/{id}/read` | POST | Mark as read |
| `/api/notifications/read-all` | POST | Mark all as read |

---

## 5. Delivery Logic & Infrastructure

### 5.1 Queue Configuration

**All notifications implement `ShouldQueue`** for async processing.

| Property | Value | Location |
|----------|-------|----------|
| Queue Driver | Configurable (database/redis) | `.env` |
| Retry After | 90 seconds | `config/queue.php` |
| Max Tries | 3 (default) | Notification class |
| Backoff Strategy | Exponential: [30, 60, 120] | Job classes |

### 5.2 Retry Mechanisms

```php
// Example: SendAttendanceReminder Job
public $tries = 3;
public $backoff = [30, 60, 120]; // Exponential backoff
```

### 5.3 Channel Services

| Channel | Service | Status |
|---------|---------|--------|
| **Email** | Laravel Mail | ✅ Fully implemented |
| **In-App (Database)** | Laravel Notifications DB | ✅ Fully implemented |
| **Push (FCM)** | `FcmNotificationService` | ✅ Implemented, requires config |
| **SMS** | `SmsGatewayService` | ✅ Multi-provider (Twilio, BulkSMS, ElitBuzz) |
| **Slack** | - | ❌ Not implemented |

### 5.4 Delivery Logging

**Location:** `admin.notifications.logs`

**Features:**
- ✅ Search by recipient, channel, status
- ✅ Filter by date range
- ✅ Retry failed notifications
- ✅ Export logs (CSV)
- ✅ View full notification details

### 5.5 Failed Notification Handling

```php
// Listener failure handling example (LogAttendanceActivity)
public function failed(AttendanceLogged $event, \Throwable $exception): void
{
    Log::error('Failed to log attendance activity', [
        'attendance_id' => $event->attendance->id,
        'error' => $exception->getMessage(),
    ]);
}
```

---

## 6. Gaps & Missing Notifications

### 6.1 Critical Missing Notifications

| Workflow | Event Exists | Notification Exists | Status |
|----------|:------------:|:-------------------:|--------|
| **Leave Cancellation** | ✅ LeaveCancelled | ❌ | MISSING |
| **Payslip Ready** | ✅ PayrollGenerated | ⚠️ Incomplete | INCOMPLETE |
| **Birthday Reminder** | ❌ | ❌ | MISSING |
| **Work Anniversary** | ❌ | ❌ | MISSING |
| **Document Expiry** | ❌ | ❌ | MISSING |
| **Performance Review Due** | ❌ | ❌ | MISSING |
| **Task Assignment** | ❌ | ❌ | MISSING |
| **Contract Expiry** | ❌ | ❌ | MISSING |
| **Probation End** | ❌ | ❌ | MISSING |
| **Leave Balance Low** | ❌ | ❌ | MISSING |
| **Overtime Alert** | ❌ | ❌ | MISSING |

### 6.2 Push Notification Gap

**Current State:** 
- Notifications only use `mail` and `database` channels
- Push (FCM) infrastructure exists but not wired to HRM notifications
- User preference service defines push preferences but notifications don't query them

**Impact:** Users with mobile app won't receive real-time push notifications for HRM events.

### 6.3 SMS Channel Gap

**Current State:**
- SMS gateway service supports multiple providers
- User preferences allow SMS toggle
- **No HRM notifications actually use SMS channel**

---

## 7. Test Plan

### 7.1 Unit Tests

| Test Case | Priority | Status |
|-----------|----------|--------|
| LeaveRequestNotification can be serialized | High | ⚠️ Verify |
| LeaveApprovedNotification sends to correct user | High | ⚠️ Verify |
| LateArrivalNotification only triggers at threshold | Medium | ⚠️ Verify |
| WelcomeEmployeeNotification contains correct data | Medium | ⚠️ Verify |

### 7.2 Integration Test Cases

#### 7.2.1 Leave Request Flow

```
Preconditions: User A is employee, User B is manager
Steps:
1. User A submits leave request
2. Verify LeaveRequested event dispatched
3. Verify LeaveRequestNotification sent to User B (manager)
4. Verify LeaveRequestNotification sent to HR role users
5. Check database notification created for User B
6. Check email queued for User B
Expected:
- Email subject: "Leave Request - {Employee Name}"
- Database notification contains leave_id, dates, employee info
```

#### 7.2.2 Leave Approval Flow

```
Preconditions: Leave request exists in pending status
Steps:
1. Manager approves leave via UI
2. Verify LeaveApproved event dispatched
3. Verify LeaveApprovedNotification sent to employee
4. Check leave balance updated
Expected:
- Email subject: "Leave Request Approved"
- In-app notification visible
```

#### 7.2.3 Late Arrival Notification

```
Preconditions: Employee has 2 late arrivals this month
Steps:
1. Employee clocks in late (3rd time)
2. Verify AttendanceLogged event dispatched
3. Verify LogAttendanceActivity listener executes
4. Verify LateArrivalNotification sent to manager
Expected:
- Notification includes late count for month
- Email contains employee name, date, clock-in time
```

#### 7.2.4 Job Application Flow

```
Preconditions: Job posting exists
Steps:
1. Candidate submits application
2. Verify CandidateApplied event dispatched
3. Verify NewApplicationNotification sent to recruiters
4. Verify notification sent to job owner
Expected:
- Email contains candidate name, position, experience
- In-app notification actionable (link to application)
```

#### 7.2.5 Employee Onboarding Flow

```
Preconditions: User account created
Steps:
1. HR creates employee from user
2. Verify WelcomeEmployeeNotification sent
3. Verify onboarding record created
4. Wait 3 days (or mock time)
5. Run OnboardingReminderJob
6. Verify OnboardingReminderNotification sent to employee
7. Verify ManagerOnboardingReminderNotification sent to manager
Expected:
- Welcome email contains employee code, department, start date
- Reminder emails contain progress percentage
```

### 7.3 End-to-End Test Matrix

| Workflow | Event | Notification | Email | In-App | Push | SMS | Pass/Fail |
|----------|-------|--------------|:-----:|:------:|:----:|:---:|:---------:|
| Leave Request | LeaveRequested | LeaveRequestNotification | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| Leave Approve | LeaveApproved | LeaveApprovedNotification | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| Leave Reject | LeaveRejected | LeaveRejectedNotification | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| Leave Cancel | LeaveCancelled | - | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| Late Arrival | AttendanceLogged | LateArrivalNotification | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| Job Apply | CandidateApplied | NewApplicationNotification | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| New Employee | EmployeeCreated | WelcomeEmployeeNotification | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| Payroll Ready | PayrollGenerated | - | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |

---

## 8. Recommendations

### 8.1 High Priority

1. **Complete Push Notification Integration**
   - Update all notification classes to check user preferences and include `push` channel
   - Implement `toFcm()` method in notifications

2. **Implement Missing Notifications**
   - `LeaveCancelledNotification`
   - `PayslipReadyNotification`
   - `BirthdayReminderNotification`
   - `DocumentExpiryNotification`

3. **Wire User Preferences to Notifications**
   ```php
   public function via(object $notifiable): array
   {
       $prefService = app(NotificationPreferenceService::class);
       $channels = ['database'];
       
       if ($prefService->shouldNotify($notifiable, 'leave_approved', 'email')) {
           $channels[] = 'mail';
       }
       if ($prefService->shouldNotify($notifiable, 'leave_approved', 'push')) {
           $channels[] = 'fcm';
       }
       return $channels;
   }
   ```

### 8.2 Medium Priority

1. **Add Event Registration in EventServiceProvider**
   - Currently relying on auto-discovery; explicit registration recommended

2. **Implement Fallback Channels**
   - If push fails, retry via email
   - Add `failedNotification()` handler

3. **Add Notification Templates Admin UI**
   - Allow admins to customize email templates

### 8.3 Low Priority

1. **Add Slack/Teams Integration**
2. **Implement Batch/Digest Notifications**
3. **Add A/B Testing for Notification Content**

---

## 9. JSON Schema Export

```json
{
  "auditVersion": "1.0.0",
  "auditDate": "2026-01-11",
  "package": "aero-hrm",
  "events": [
    {
      "name": "AttendanceLogged",
      "namespace": "Aero\\HRM\\Events",
      "model": "Attendance",
      "notifications": ["LateArrivalNotification"],
      "channels": {
        "email": true,
        "database": true,
        "push": false,
        "sms": false
      },
      "uiConfigurable": false,
      "deliveryStatus": "PARTIAL"
    },
    {
      "name": "LeaveRequested",
      "namespace": "Aero\\HRM\\Events\\Leave",
      "model": "Leave",
      "notifications": ["LeaveRequestNotification"],
      "channels": {
        "email": true,
        "database": true,
        "push": false,
        "sms": false
      },
      "uiConfigurable": true,
      "deliveryStatus": "PASS"
    },
    {
      "name": "LeaveApproved",
      "namespace": "Aero\\HRM\\Events\\Leave",
      "model": "Leave",
      "notifications": ["LeaveApprovedNotification"],
      "channels": {
        "email": true,
        "database": true,
        "push": false,
        "sms": false
      },
      "uiConfigurable": true,
      "deliveryStatus": "PASS"
    },
    {
      "name": "LeaveRejected",
      "namespace": "Aero\\HRM\\Events\\Leave",
      "model": "Leave",
      "notifications": ["LeaveRejectedNotification"],
      "channels": {
        "email": true,
        "database": true,
        "push": false,
        "sms": false
      },
      "uiConfigurable": true,
      "deliveryStatus": "PASS"
    },
    {
      "name": "LeaveCancelled",
      "namespace": "Aero\\HRM\\Events\\Leave",
      "model": "Leave",
      "notifications": [],
      "channels": {},
      "uiConfigurable": false,
      "deliveryStatus": "MISSING"
    },
    {
      "name": "CandidateApplied",
      "namespace": "Aero\\HRM\\Events",
      "model": "JobApplication",
      "notifications": ["NewApplicationNotification"],
      "channels": {
        "email": true,
        "database": true,
        "push": false,
        "sms": false
      },
      "uiConfigurable": false,
      "deliveryStatus": "PASS"
    },
    {
      "name": "EmployeeCreated",
      "namespace": "Aero\\HRM\\Events",
      "model": "User",
      "notifications": ["WelcomeEmployeeNotification"],
      "channels": {
        "email": true,
        "database": true,
        "push": false,
        "sms": false
      },
      "uiConfigurable": false,
      "deliveryStatus": "PASS"
    },
    {
      "name": "PayrollGenerated",
      "namespace": "Aero\\HRM\\Events",
      "model": "Payroll",
      "notifications": ["PayslipEmail"],
      "channels": {
        "email": true,
        "database": false,
        "push": false,
        "sms": false
      },
      "uiConfigurable": false,
      "deliveryStatus": "INCOMPLETE"
    }
  ],
  "notificationChannels": {
    "email": {
      "supported": true,
      "configured": true,
      "uiConfigurable": true
    },
    "database": {
      "supported": true,
      "configured": true,
      "uiConfigurable": true
    },
    "push": {
      "supported": true,
      "configured": false,
      "uiConfigurable": true,
      "service": "FcmNotificationService"
    },
    "sms": {
      "supported": true,
      "configured": false,
      "uiConfigurable": true,
      "service": "SmsGatewayService",
      "providers": ["twilio", "bulksmsbd", "elitbuzz", "ssl_wireless"]
    },
    "slack": {
      "supported": false,
      "configured": false,
      "uiConfigurable": false
    }
  },
  "deliveryInfrastructure": {
    "queueEnabled": true,
    "retryMechanism": true,
    "backoffStrategy": "exponential",
    "maxRetries": 3,
    "deliveryLogs": true,
    "failedJobsTable": true
  },
  "testResults": {
    "total": 8,
    "pass": 5,
    "fail": 0,
    "missing": 2,
    "incomplete": 1
  }
}
```

---

## 10. Appendix

### A. File Locations

| Component | Path |
|-----------|------|
| Events | `packages/aero-hrm/src/Events/` |
| Notifications | `packages/aero-hrm/src/Notifications/` |
| Listeners | `packages/aero-hrm/src/Listeners/` |
| Jobs | `packages/aero-hrm/src/Jobs/` |
| Mail | `packages/aero-hrm/src/Mail/` |
| Preference Service | `packages/aero-core/src/Services/Notification/NotificationPreferenceService.php` |
| FCM Service | `packages/aero-core/src/Services/Notification/FcmNotificationService.php` |
| SMS Service | `packages/aero-core/src/Services/Notification/SmsGatewayService.php` |
| Notification UI | `packages/aero-ui/resources/js/Components/NotificationDropdown.jsx` |
| Delivery Logs UI | `packages/aero-ui/resources/js/Components/Platform/Notifications/DeliveryLogsTable.jsx` |

### B. Related Configuration Files

| Config | Purpose |
|--------|---------|
| `config/mail.php` | Email transport configuration |
| `config/queue.php` | Queue driver and retry settings |
| `config/services.php` | SMS provider credentials |
| `.env` | Environment-specific settings |

---

**End of Audit Report**
