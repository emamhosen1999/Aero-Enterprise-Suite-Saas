# HRM Notifications & Events - User Acceptance Testing (UAT) Plan

## Document Information
- **Module:** HRM Notifications & Events System
- **Version:** 1.0
- **Date:** January 11, 2026
- **Application:** Aero Enterprise Suite SaaS
- **Test Environment:** dbedc-erp.test / aeos365.test

---

## 1. Test Objectives

### Primary Goals
1. Verify all notification types are sent correctly
2. Validate multi-channel delivery (Email, Push, SMS, In-App)
3. Confirm user preference settings are respected
4. Test scheduled job execution for automated notifications
5. Verify event-listener chain works correctly
6. Validate notification content accuracy
7. Test notification routing to correct recipients

---

## 2. Test Scope

### Notification Categories
| Category | Notifications |
|----------|--------------|
| **Leave Management** | Leave Requested, Approved, Rejected, Cancelled |
| **Attendance** | Late Arrival, Punch Reminder |
| **Payroll** | Payslip Ready, Salary Credited |
| **Onboarding** | Welcome Employee, Onboarding Reminder, Manager Reminder |
| **Recruitment** | New Application Received |
| **Employee Lifecycle** | Birthday Wish, Work Anniversary, Probation Ending, Contract Expiring |
| **Documents** | Document Expiry Alerts |

### Scheduled Jobs
| Job | Schedule | Purpose |
|-----|----------|---------|
| `CheckBirthdaysJob` | Daily 08:00 | Send birthday notifications |
| `CheckWorkAnniversariesJob` | Daily 08:00 | Send anniversary notifications |
| `CheckExpiringDocumentsJob` | Daily 09:00 | Alert on expiring documents |
| `CheckProbationEndingJob` | Daily 09:00 | Alert on probation endings |
| `CheckExpiringContractsJob` | Daily 09:00 | Alert on expiring contracts |

---

## 3. Test Scenarios

### 3.1 Leave Notifications

| ID | Scenario | Preconditions | Steps | Expected Result | Priority |
|----|----------|---------------|-------|-----------------|----------|
| NOTIF-LV-01 | Leave Request Notification to Manager | Employee exists with manager assigned | 1. Employee submits leave request<br>2. Check manager's notifications | Manager receives email + in-app notification with leave details | Critical |
| NOTIF-LV-02 | Leave Approved Notification | Pending leave request exists | 1. Manager approves leave<br>2. Check employee's notifications | Employee receives approval notification via email + push + in-app | Critical |
| NOTIF-LV-03 | Leave Rejected Notification | Pending leave request exists | 1. Manager rejects leave with reason<br>2. Check employee's notifications | Employee receives rejection notification with reason | Critical |
| NOTIF-LV-04 | Leave Cancelled Notification | Approved leave exists | 1. Employee cancels approved leave<br>2. Check manager's notifications | Manager + HR receive cancellation notification | High |
| NOTIF-LV-05 | Leave Cancelled by Manager | Approved leave exists | 1. Manager cancels employee leave<br>2. Check employee's notifications | Employee receives cancellation notification with reason | High |
| NOTIF-LV-06 | HR Notification on Leave Request | Leave type requires HR approval | 1. Employee requests special leave<br>2. Check HR notifications | HR admin receives notification for review | Medium |

### 3.2 Attendance Notifications

| ID | Scenario | Preconditions | Steps | Expected Result | Priority |
|----|----------|---------------|-------|-----------------|----------|
| NOTIF-AT-01 | Late Arrival Alert | Employee punches in after shift start | 1. Employee punches in 30 mins late<br>2. Check notifications | Employee receives in-app + push notification about late arrival | High |
| NOTIF-AT-02 | Late Arrival Manager Alert | Manager notification enabled | 1. Employee arrives late<br>2. Check manager notifications | Manager receives alert about employee late arrival | Medium |
| NOTIF-AT-03 | Missing Punch Reminder | Employee has incomplete attendance | 1. End of day without punch out<br>2. Check notifications | Employee receives reminder to complete attendance | Medium |

### 3.3 Payroll Notifications

| ID | Scenario | Preconditions | Steps | Expected Result | Priority |
|----|----------|---------------|-------|-----------------|----------|
| NOTIF-PR-01 | Payslip Ready Notification | Payroll processed for month | 1. Admin generates payslips<br>2. Check employee notifications | All employees receive "Payslip Ready" notification with download link | Critical |
| NOTIF-PR-02 | Salary Credited Notification | Bank integration active | 1. Salary transfer completed<br>2. Check notifications | Employee receives email + SMS confirming salary credit | High |
| NOTIF-PR-03 | Payslip Ready - Bulk | Multiple employees in payroll | 1. Process payroll for 50 employees<br>2. Verify all notified | All 50 employees receive individual notifications | High |

### 3.4 Onboarding Notifications

| ID | Scenario | Preconditions | Steps | Expected Result | Priority |
|----|----------|---------------|-------|-----------------|----------|
| NOTIF-OB-01 | Welcome Employee | New employee created | 1. Admin creates new employee<br>2. Check employee email | Employee receives welcome email with login instructions | Critical |
| NOTIF-OB-02 | Onboarding Reminder | Employee with incomplete onboarding | 1. Trigger onboarding reminder job<br>2. Check employee notifications | Employee receives reminder to complete onboarding tasks | High |
| NOTIF-OB-03 | Manager Onboarding Reminder | New hire assigned to manager | 1. Trigger manager reminder job<br>2. Check manager notifications | Manager receives reminder about new team member's onboarding | High |
| NOTIF-OB-04 | HR Onboarding Alert | New employee pending documents | 1. Onboarding deadline approaching<br>2. Check HR notifications | HR receives alert about incomplete onboarding | Medium |

### 3.5 Recruitment Notifications

| ID | Scenario | Preconditions | Steps | Expected Result | Priority |
|----|----------|---------------|-------|-----------------|----------|
| NOTIF-RC-01 | New Application Received | Active job posting exists | 1. Candidate submits application<br>2. Check HR notifications | Recruiter/HR receives notification with applicant details | High |
| NOTIF-RC-02 | Application Status Update | Application under review | 1. HR updates application status<br>2. Check applicant email | Applicant receives status update email | Medium |

### 3.6 Birthday & Anniversary Notifications

| ID | Scenario | Preconditions | Steps | Expected Result | Priority |
|----|----------|---------------|-------|-----------------|----------|
| NOTIF-BD-01 | Birthday Wish to Employee | Employee with birthday today | 1. Run CheckBirthdaysJob<br>2. Check employee notifications | Employee receives birthday wish email + in-app notification | High |
| NOTIF-BD-02 | Birthday Alert to Manager | Employee has birthday, manager assigned | 1. Run CheckBirthdaysJob<br>2. Check manager notifications | Manager receives alert about team member's birthday | Medium |
| NOTIF-BD-03 | Birthday Alert to Team | Team notification enabled | 1. Run CheckBirthdaysJob<br>2. Check team notifications | Department members receive birthday notification | Low |
| NOTIF-AN-01 | Work Anniversary Notification | Employee with anniversary today | 1. Run CheckWorkAnniversariesJob<br>2. Check employee notifications | Employee receives congratulatory notification with years of service | High |
| NOTIF-AN-02 | Milestone Anniversary (5, 10 years) | Employee completing 5/10 years | 1. Run anniversary job<br>2. Check HR notifications | HR receives special milestone alert for recognition | Medium |
| NOTIF-AN-03 | Anniversary Alert to Manager | Employee has work anniversary | 1. Run CheckWorkAnniversariesJob<br>2. Check manager notifications | Manager notified of team member's anniversary | Medium |

### 3.7 Document Expiry Notifications

| ID | Scenario | Preconditions | Steps | Expected Result | Priority |
|----|----------|---------------|-------|-----------------|----------|
| NOTIF-DOC-01 | Document Expiring in 30 Days | Employee document expires in 30 days | 1. Run CheckExpiringDocumentsJob<br>2. Check employee notifications | Employee receives first warning notification | High |
| NOTIF-DOC-02 | Document Expiring in 7 Days | Document expires in 7 days | 1. Run document check job<br>2. Check employee + HR notifications | Employee + HR receive urgent reminder | Critical |
| NOTIF-DOC-03 | Document Expired Today | Document expires today | 1. Run document check job<br>2. Check all notifications | Employee + HR + Manager receive final alert | Critical |
| NOTIF-DOC-04 | Multiple Documents Expiring | Employee has 3 expiring documents | 1. Run document check job<br>2. Check notifications | Consolidated notification listing all expiring documents | Medium |
| NOTIF-DOC-05 | HR Escalation on Expired | Document already expired, no action taken | 1. Run document check job<br>2. Check HR admin notifications | HR Admin receives escalation for compliance action | High |

### 3.8 Probation & Contract Notifications

| ID | Scenario | Preconditions | Steps | Expected Result | Priority |
|----|----------|---------------|-------|-----------------|----------|
| NOTIF-PB-01 | Probation Ending in 14 Days | Employee probation ends in 14 days | 1. Run CheckProbationEndingJob<br>2. Check HR + Manager notifications | HR + Manager receive reminder for performance review | High |
| NOTIF-PB-02 | Probation Ending Tomorrow | Probation ends tomorrow | 1. Run probation check job<br>2. Check urgent notifications | Urgent notification to HR/Manager for immediate action | Critical |
| NOTIF-PB-03 | Probation Confirmation Due | Probation period ended | 1. Run probation check job<br>2. Check HR notifications | HR receives alert to confirm/extend probation | High |
| NOTIF-CT-01 | Contract Expiring in 30 Days | Employee contract expires in 30 days | 1. Run CheckExpiringContractsJob<br>2. Check HR + Employee notifications | Both parties receive contract renewal reminder | High |
| NOTIF-CT-02 | Contract Expiring in 7 Days | Contract expires in 7 days | 1. Run contract check job<br>2. Check urgent notifications | Urgent notifications sent to all stakeholders | Critical |
| NOTIF-CT-03 | Contract Renewal Pending | Contract ended, no renewal processed | 1. Run contract check job<br>2. Check HR Admin notifications | HR Admin receives escalation notification | Critical |

### 3.9 Notification Preferences

| ID | Scenario | Preconditions | Steps | Expected Result | Priority |
|----|----------|---------------|-------|-----------------|----------|
| PREF-01 | Disable Email for Leave | User preference: leave email = off | 1. User disables leave emails<br>2. Submit leave request | Manager receives only in-app, not email | High |
| PREF-02 | Disable Push Notifications | User preference: push = off | 1. User disables push globally<br>2. Trigger any notification | No push sent, only email + in-app | High |
| PREF-03 | Enable SMS for Urgent Only | User preference: SMS = urgent only | 1. Non-urgent notification triggered<br>2. Urgent notification triggered | SMS only for urgent, not regular notifications | Medium |
| PREF-04 | All Channels Disabled | User disables all channels | 1. Trigger notification<br>2. Check channels | Only database (in-app) notification stored | High |
| PREF-05 | Default Preferences | New user, no preferences set | 1. Trigger notification<br>2. Check channels | Uses system defaults (email + in-app) | Medium |

### 3.10 Multi-Channel Delivery

| ID | Scenario | Preconditions | Steps | Expected Result | Priority |
|----|----------|---------------|-------|-----------------|----------|
| CHAN-01 | Email Delivery | User has valid email | 1. Trigger email notification<br>2. Check email inbox | Email received with correct content and formatting | Critical |
| CHAN-02 | Push Notification (FCM) | User has FCM token registered | 1. Trigger push notification<br>2. Check device | Push notification appears on device | High |
| CHAN-03 | SMS Notification | User has phone number, SMS enabled | 1. Trigger SMS notification<br>2. Check SMS logs | SMS sent to user's phone | High |
| CHAN-04 | In-App Notification | Any user | 1. Trigger notification<br>2. Check notification bell | Notification appears in app notification center | Critical |
| CHAN-05 | Simultaneous Multi-Channel | User has all channels enabled | 1. Trigger critical notification<br>2. Check all channels | Same notification delivered via all active channels | High |

### 3.11 Scheduled Job Execution

| ID | Scenario | Preconditions | Steps | Expected Result | Priority |
|----|----------|---------------|-------|-----------------|----------|
| JOB-01 | Birthday Job Runs at 8 AM | Employees with today's birthday | 1. Check schedule at 08:00<br>2. Verify job executed | Job runs, birthday notifications sent | High |
| JOB-02 | Anniversary Job Runs at 8 AM | Employees with today's anniversary | 1. Check schedule at 08:00<br>2. Verify job executed | Job runs, anniversary notifications sent | High |
| JOB-03 | Document Job Runs at 9 AM | Employees with expiring documents | 1. Check schedule at 09:00<br>2. Verify job executed | Job runs, expiry notifications sent | High |
| JOB-04 | Job Failure Handling | Job encounters error | 1. Simulate job failure<br>2. Check retry behavior | Job retries with backoff (60s, 300s, 600s) | Medium |
| JOB-05 | No Overlapping Execution | Previous job still running | 1. Trigger job while running<br>2. Check execution | Second instance skipped, no overlap | Medium |
| JOB-06 | Single Server Execution | Multi-server environment | 1. Check job on server cluster<br>2. Verify execution | Job runs on only one server | Medium |

### 3.12 Error Handling & Edge Cases

| ID | Scenario | Preconditions | Steps | Expected Result | Priority |
|----|----------|---------------|-------|-----------------|----------|
| ERR-01 | Invalid Email Address | User has malformed email | 1. Trigger email notification<br>2. Check error logs | Graceful failure, error logged, other channels work | High |
| ERR-02 | No FCM Token | User has no device registered | 1. Trigger push notification<br>2. Check behavior | Push skipped, other channels work | Medium |
| ERR-03 | No Phone Number for SMS | SMS enabled but no phone | 1. Trigger SMS notification<br>2. Check behavior | SMS skipped, other channels work | Medium |
| ERR-04 | Employee Without User | Employee record missing user link | 1. Trigger employee notification<br>2. Check error handling | Warning logged, no crash | High |
| ERR-05 | Manager Not Assigned | Leave request, no manager | 1. Submit leave request<br>2. Check notification routing | Falls back to HR/Admin notification | Medium |
| ERR-06 | Notification Queue Failure | Queue worker down | 1. Stop queue worker<br>2. Trigger notifications<br>3. Restart worker | Queued notifications process after restart | High |
| ERR-07 | Duplicate Prevention | Same notification triggered twice | 1. Trigger same event twice rapidly<br>2. Check notifications | Only one notification sent | Medium |

---

## 4. Test Data Requirements

### Users
| Role | Email | Purpose |
|------|-------|---------|
| HR Admin | hr@test.com | Receive HR notifications |
| Manager | manager@test.com | Receive team notifications |
| Employee 1 | emp1@test.com | General employee testing |
| Employee 2 | emp2@test.com | Birthday today |
| Employee 3 | emp3@test.com | Work anniversary today |
| Employee 4 | emp4@test.com | Document expiring in 7 days |
| Employee 5 | emp5@test.com | Probation ending in 14 days |
| Employee 6 | emp6@test.com | Contract expiring in 30 days |

### Documents
- Create personal documents with various expiry dates (0, 1, 3, 7, 14, 30 days)

### Leaves
- Pending leave requests for approval testing
- Approved leaves for cancellation testing

---

## 5. Test Execution Priority

### Phase 1 - Critical (Must Pass)
- NOTIF-LV-01, 02, 03 (Leave notifications)
- NOTIF-PR-01 (Payslip ready)
- NOTIF-OB-01 (Welcome employee)
- CHAN-01, 04 (Email + In-app delivery)
- All error handling scenarios

### Phase 2 - High Priority
- Birthday & Anniversary notifications
- Document expiry notifications
- Probation & Contract notifications
- Preference-based delivery
- Scheduled job execution

### Phase 3 - Medium Priority
- Team notifications
- SMS channel testing
- Multi-channel simultaneous delivery
- Edge cases

---

## 6. Acceptance Criteria

### Pass Criteria
- All Critical tests pass: 100%
- High Priority tests pass: ≥ 95%
- Medium Priority tests pass: ≥ 90%
- No blocking/critical bugs

### Notification Delivery SLA
- Email: Delivered within 5 minutes of trigger
- Push: Delivered within 30 seconds
- SMS: Delivered within 2 minutes
- In-App: Immediate (real-time)

---

## 7. Test Environment Setup

### Required Configuration
```php
// .env settings
MAIL_MAILER=smtp
QUEUE_CONNECTION=redis  // or database
FCM_SERVER_KEY=your-fcm-key
SMS_PROVIDER=twilio  // or nexmo
```

### Queue Worker
```bash
php artisan queue:work --queue=notifications,default
```

### Schedule Worker
```bash
php artisan schedule:work
```

---

## 8. Reporting Template

| Test ID | Status | Actual Result | Notes | Tested By | Date |
|---------|--------|---------------|-------|-----------|------|
| NOTIF-LV-01 | | | | | |
| NOTIF-LV-02 | | | | | |
| ... | | | | | |
