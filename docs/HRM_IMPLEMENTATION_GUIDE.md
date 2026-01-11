# HRM Package - Implementation Guide for Missing Events

**Date:** January 11, 2026  
**Status:** Phase 1 - Critical Events Implemented  
**Next Steps:** Add event dispatching in controllers, create notifications, register listeners

---

## Phase 1: Implemented Events (16 High-Priority)

### Employee Lifecycle Events (5)
✅ `EmployeeCreated` - `packages/aero-hrm/src/Events/Employee/EmployeeCreated.php`  
✅ `EmployeeUpdated` - `packages/aero-hrm/src/Events/Employee/EmployeeUpdated.php`  
✅ `EmployeePromoted` - `packages/aero-hrm/src/Events/Employee/EmployeePromoted.php`  
✅ `EmployeeResigned` - `packages/aero-hrm/src/Events/Employee/EmployeeResigned.php`  
✅ `EmployeeTerminated` - `packages/aero-hrm/src/Events/Employee/EmployeeTerminated.php`

### Attendance Events (3)
✅ `AttendancePunchedIn` - `packages/aero-hrm/src/Events/Attendance/AttendancePunchedIn.php`  
✅ `AttendancePunchedOut` - `packages/aero-hrm/src/Events/Attendance/AttendancePunchedOut.php`  
✅ `LateArrivalDetected` - `packages/aero-hrm/src/Events/Attendance/LateArrivalDetected.php`

### Onboarding/Offboarding Events (4)
✅ `OnboardingStarted` - `packages/aero-hrm/src/Events/Onboarding/OnboardingStarted.php`  
✅ `OnboardingCompleted` - `packages/aero-hrm/src/Events/Onboarding/OnboardingCompleted.php`  
✅ `OffboardingStarted` - `packages/aero-hrm/src/Events/Offboarding/OffboardingStarted.php`  
✅ `OffboardingCompleted` - `packages/aero-hrm/src/Events/Offboarding/OffboardingCompleted.php`

### Recruitment Events (3)
✅ `ApplicationReceived` - `packages/aero-hrm/src/Events/Recruitment/ApplicationReceived.php`  
✅ `InterviewScheduled` - `packages/aero-hrm/src/Events/Recruitment/InterviewScheduled.php`  
✅ `OfferExtended` - `packages/aero-hrm/src/Events/Recruitment/OfferExtended.php`

### Performance & Training Events (2)
✅ `PerformanceReviewCompleted` - `packages/aero-hrm/src/Events/Performance/PerformanceReviewCompleted.php`  
✅ `TrainingScheduled` - `packages/aero-hrm/src/Events/Training/TrainingScheduled.php`

### Safety Events (1)
✅ `SafetyIncidentReported` - `packages/aero-hrm/src/Events/Safety/SafetyIncidentReported.php`

---

## Database Schema Implemented (3 Tables)

### 1. notification_logs
**Purpose:** Track all notification deliveries, status, and failures

**Columns:**
- `id`, `notifiable_type`, `notifiable_id`
- `notification_type`, `event_type`, `channel`
- `status` (pending, sent, failed, retrying)
- `sent_at`, `failed_at`, `retry_at`
- `failure_reason`, `retry_count`, `max_retries`
- `metadata` (JSON)
- `read_at`, `archived_at`
- Timestamps

**Location:** `packages/aero-core/database/migrations/2026_01_11_000001_create_notification_logs_table.php`

### 2. user_notification_preferences
**Purpose:** Store user-level notification preferences per event/channel

**Columns:**
- `id`, `user_id`, `event_type`, `channel`
- `enabled` (boolean)
- `quiet_hours_start`, `quiet_hours_end`
- `digest_frequency` (realtime, hourly, daily, weekly)
- `options` (JSON for custom settings)
- Unique: (user_id, event_type, channel)

**Location:** `packages/aero-core/database/migrations/2026_01_11_000002_create_user_notification_preferences_table.php`

### 3. notification_settings
**Purpose:** Global admin-level notification system settings

**Columns:**
- `id`, `key` (unique), `value` (JSON), `description`
- Timestamps

**Default Settings:**
- `channels.email.enabled` = true
- `channels.sms.enabled` = false
- `channels.push.enabled` = false
- `channels.database.enabled` = true
- `retry.max_attempts` = 3
- `retry.backoff_minutes` = [5, 15, 60]

**Location:** `packages/aero-core/database/migrations/2026_01_11_000003_create_notification_settings_table.php`

---

## UserContract Interface Implementation

### Created Interface
✅ `packages/aero-core/src/Contracts/UserContract.php`

**Methods Defined:**
- `getId()`, `getName()`, `getEmail()`, `getPhone()`
- `isActive()`, `hasVerifiedEmail()`, `getProfileImageUrl()`
- `getLocale()`, `getTimezone()`
- `notify($notification)`
- `hasPermission()`, `hasAnyPermission()`, `hasAllPermissions()`, `hasRole()`
- `getRoles()`, `getPermissions()`
- `getCreatedAt()`, `getUpdatedAt()`
- `prefersNotificationChannel($channel)`
- `getRelationship($name)`, `hasRelationship($name)`
- `getAttribute($key, $default)`
- `toArray()`

### Updated User Model
✅ `packages/aero-core/src/Models/User.php`

- Implements `UserContract` interface
- Added all interface methods at end of class
- Maintains backward compatibility with existing code

---

## Next Steps (Priority Order)

### Step 1: Dispatch Events in Controllers (CRITICAL)

For each implemented event, update the corresponding controller to dispatch it:

#### Employee Events

**EmployeeController::store()** - Dispatch `EmployeeCreated`
```php
use Aero\HRM\Events\Employee\EmployeeCreated;

// After successful employee creation
event(new EmployeeCreated($employee, auth()->id(), [
    'onboarding_enabled' => $request->boolean('start_onboarding'),
    'send_welcome_email' => true,
]));
```

**EmployeeController::update()** - Dispatch `EmployeeUpdated` / `EmployeePromoted`
```php
use Aero\HRM\Events\Employee\EmployeeUpdated;
use Aero\HRM\Events\Employee\EmployeePromoted;

// Capture changes before update
$originalEmployee = $employee->replicate();
$changes = [];

// After update
$employee->update($request->validated());

// Build changes array
if ($originalEmployee->designation_id !== $employee->designation_id) {
    $changes['designation_id'] = [
        'old' => $originalEmployee->designation_id,
        'new' => $employee->designation_id,
    ];
}

// Dispatch EmployeeUpdated
event(new EmployeeUpdated($employee, $changes, auth()->id()));

// If promotion occurred
if ($changes['designation_id'] ?? false) {
    event(new EmployeePromoted(
        $employee,
        $originalEmployee->designation_id,
        $employee->designation_id,
        $originalEmployee->department_id,
        $employee->department_id,
        $originalEmployee->basic_salary,
        $employee->basic_salary,
        $request->input('promotion_reason')
    ));
}
```

**OnboardingController::storeOffboarding()** - Dispatch `EmployeeResigned` / `OffboardingStarted`
```php
use Aero\HRM\Events\Employee\EmployeeResigned;
use Aero\HRM\Events\Offboarding\OffboardingStarted;

// If reason is resignation
if ($request->reason === 'resignation') {
    event(new EmployeeResigned(
        $employee,
        now(),
        $request->input('last_working_date'),
        $request->input('resignation_reason'),
        $request->input('notice_period_days')
    ));
}

// After offboarding created
event(new OffboardingStarted($offboarding, $request->reason, auth()->id()));
```

#### Attendance Events

**AttendanceController::punchIn()** - Dispatch `AttendancePunchedIn` / `LateArrivalDetected`
```php
use Aero\HRM\Events\Attendance\AttendancePunchedIn;
use Aero\HRM\Events\Attendance\LateArrivalDetected;

// After punch-in created
$isLate = /* check if late based on schedule */;
$location = $request->only(['latitude', 'longitude', 'address']);

event(new AttendancePunchedIn($attendance, $isLate, $location));

if ($isLate) {
    $lateMinutes = /* calculate late minutes */;
    event(new LateArrivalDetected(
        $attendance,
        $lateMinutes,
        $scheduledTime,
        $attendance->check_in
    ));
}
```

**AttendanceController::punchOut()** - Dispatch `AttendancePunchedOut`
```php
use Aero\HRM\Events\Attendance\AttendancePunchedOut;

// After punch-out
$isEarly = /* check if early departure */;
$hasOvertime = /* check if overtime */;
$totalMinutes = /* calculate total work minutes */;
$location = $request->only(['latitude', 'longitude', 'address']);

event(new AttendancePunchedOut(
    $attendance,
    $isEarly,
    $hasOvertime,
    $totalMinutes,
    $location
));
```

#### Onboarding Events

**OnboardingController::store()** - Dispatch `OnboardingStarted`
```php
use Aero\HRM\Events\Onboarding\OnboardingStarted;

event(new OnboardingStarted($onboarding, auth()->id()));
```

**OnboardingController::completeOnboarding()** - Dispatch `OnboardingCompleted`
```php
use Aero\HRM\Events\Onboarding\OnboardingCompleted;

$daysTaken = $onboarding->created_at->diffInDays(now());
event(new OnboardingCompleted($onboarding, now(), $daysTaken));
```

#### Recruitment Events

**RecruitmentController::storeApplication()** - Dispatch `ApplicationReceived`
```php
use Aero\HRM\Events\Recruitment\ApplicationReceived;

event(new ApplicationReceived($application));
```

**RecruitmentController::storeInterview()** - Dispatch `InterviewScheduled`
```php
use Aero\HRM\Events\Recruitment\InterviewScheduled;

event(new InterviewScheduled($interview));
```

#### Performance Events

**PerformanceReviewController::complete()** - Dispatch `PerformanceReviewCompleted`
```php
use Aero\HRM\Events\Performance\PerformanceReviewCompleted;

event(new PerformanceReviewCompleted(
    $review,
    $review->overall_rating,
    $request->input('summary')
));
```

---

### Step 2: Create Notification Classes (HIGH PRIORITY)

For each event, create a corresponding notification class:

**Example:** `EmployeeCreatedNotification.php`

```php
<?php

namespace Aero\HRM\Notifications;

use Aero\HRM\Models\Employee;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class EmployeeCreatedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public Employee $employee
    ) {}

    /**
     * Get the notification's delivery channels.
     */
    public function via($notifiable): array
    {
        // Check global settings and user preferences
        $channels = ['database']; // Always in-app

        if ($this->isChannelEnabled('mail', $notifiable)) {
            $channels[] = 'mail';
        }

        if ($this->isChannelEnabled('sms', $notifiable)) {
            $channels[] = 'sms';
        }

        return $channels;
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail($notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('Welcome to ' . config('app.name'))
            ->greeting('Welcome, ' . $this->employee->user->name . '!')
            ->line('Your employee account has been created successfully.')
            ->line('Employee ID: ' . $this->employee->employee_code)
            ->action('View Your Profile', route('hrm.employee.profile'))
            ->line('We look forward to working with you!');
    }

    /**
     * Get the array representation of the notification.
     */
    public function toArray($notifiable): array
    {
        return [
            'type' => 'employee.created',
            'employee_id' => $this->employee->id,
            'employee_name' => $this->employee->user->name,
            'employee_code' => $this->employee->employee_code,
            'message' => 'Welcome! Your employee account has been created.',
        ];
    }

    /**
     * Check if a channel is enabled for this notification.
     */
    protected function isChannelEnabled(string $channel, $notifiable): bool
    {
        // Check global setting
        $globalEnabled = \DB::table('notification_settings')
            ->where('key', "channels.{$channel}.enabled")
            ->value('value');

        if (! json_decode($globalEnabled)) {
            return false;
        }

        // Check user preference
        if (method_exists($notifiable, 'prefersNotificationChannel')) {
            return $notifiable->prefersNotificationChannel($channel);
        }

        return true;
    }
}
```

**Required Notifications:**
- `EmployeeCreatedNotification`
- `EmployeePromotedNotification`
- `EmployeeResignedNotification`
- `EmployeeTerminatedNotification`
- `AttendancePunchedInNotification`
- `AttendancePunchedOutNotification`
- `LateArrivalNotification`
- `OnboardingStartedNotification`
- `OnboardingCompletedNotification`
- `OffboardingStartedNotification`
- `OffboardingCompletedNotification`
- `ApplicationReceivedNotification`
- `InterviewScheduledNotification`
- `OfferExtendedNotification`
- `PerformanceReviewCompletedNotification`
- `TrainingScheduledNotification`
- `SafetyIncidentReportedNotification`

---

### Step 3: Create Listeners

For each event, create listeners to handle notifications and side effects:

**Example:** `SendEmployeeWelcomeNotification.php`

```php
<?php

namespace Aero\HRM\Listeners\Employee;

use Aero\HRM\Events\Employee\EmployeeCreated;
use Aero\HRM\Notifications\EmployeeCreatedNotification;
use Illuminate\Contracts\Queue\ShouldQueue;

class SendEmployeeWelcomeNotification implements ShouldQueue
{
    public function handle(EmployeeCreated $event): void
    {
        $employee = $event->employee;
        $user = $employee->user;

        // Send notification to employee
        $user->notify(new EmployeeCreatedNotification($employee));

        // Notify manager
        if ($employee->manager) {
            $employee->manager->notify(new NewTeamMemberNotification($employee));
        }

        // Notify HR team
        $hrUsers = \Aero\Core\Models\User::role(['HR Manager', 'HR Admin'])->get();
        foreach ($hrUsers as $hrUser) {
            $hrUser->notify(new NewEmployeeNotification($employee));
        }

        // Log notification
        \DB::table('notification_logs')->insert([
            'notifiable_type' => get_class($user),
            'notifiable_id' => $user->id,
            'notification_type' => EmployeeCreatedNotification::class,
            'event_type' => 'employee.created',
            'channel' => 'database',
            'status' => 'sent',
            'sent_at' => now(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    public function failed(EmployeeCreated $event, \Throwable $exception): void
    {
        \Log::error('Failed to send employee welcome notification', [
            'employee_id' => $event->employee->id,
            'error' => $exception->getMessage(),
        ]);
    }
}
```

---

### Step 4: Register Event Listeners

Update `HrmEventServiceProvider.php`:

```php
protected $listen = [
    // ... existing events ...

    // Employee Events
    EmployeeCreated::class => [
        SendEmployeeWelcomeNotification::class,
        InitiateOnboardingWorkflow::class,
    ],

    EmployeeUpdated::class => [
        LogEmployeeChanges::class,
    ],

    EmployeePromoted::class => [
        SendPromotionNotification::class,
        UpdateOrganizationChart::class,
    ],

    EmployeeResigned::class => [
        SendResignationAcknowledgment::class,
        InitiateOffboardingWorkflow::class,
    ],

    EmployeeTerminated::class => [
        RevokeSystemAccess::class,
        SendTerminationNotification::class,
        InitiateImmediateOffboarding::class,
    ],

    // Attendance Events
    AttendancePunchedIn::class => [
        SendAttendanceConfirmation::class,
    ],

    AttendancePunchedOut::class => [
        SendAttendanceSummary::class,
        CalculateOvertimeIfAny::class,
    ],

    LateArrivalDetected::class => [
        SendLateArrivalNotification::class,
        NotifyManagerOfLateArrival::class,
    ],

    // Onboarding Events
    OnboardingStarted::class => [
        SendOnboardingWelcomeNotification::class,
        AssignOnboardingTasks::class,
    ],

    OnboardingCompleted::class => [
        SendOnboardingCompletionNotification::class,
        GrantFullSystemAccess::class,
    ],

    // Offboarding Events
    OffboardingStarted::class => [
        SendOffboardingNotification::class,
        ScheduleExitInterview::class,
    ],

    OffboardingCompleted::class => [
        SendFinalSettlementNotification::class,
        RevokeSystemAccessCompletely::class,
    ],

    // Recruitment Events
    ApplicationReceived::class => [
        SendApplicationAcknowledgment::class,
        NotifyRecruiterOfApplication::class,
    ],

    InterviewScheduled::class => [
        SendInterviewInvitation::class,
        NotifyInterviewers::class,
    ],

    OfferExtended::class => [
        SendOfferLetter::class,
        TrackOfferAcceptance::class,
    ],

    // Performance Events
    PerformanceReviewCompleted::class => [
        SendReviewFeedbackNotification::class,
        TriggerDevelopmentPlanCreation::class,
    ],

    // Training Events
    TrainingScheduled::class => [
        SendTrainingInvitation::class,
        SendCalendarInvites::class,
    ],

    // Safety Events
    SafetyIncidentReported::class => [
        NotifySafetyTeamImmediately::class,
        InitiateIncidentInvestigation::class,
    ],
];
```

---

### Step 5: Create Notification Service

Create a centralized notification logging service:

```php
<?php

namespace Aero\Core\Services;

use Illuminate\Support\Facades\DB;

class NotificationLoggingService
{
    public function log(
        $notifiable,
        string $notificationClass,
        string $eventType,
        string $channel,
        string $status = 'pending',
        array $metadata = []
    ): int {
        return DB::table('notification_logs')->insertGetId([
            'notifiable_type' => get_class($notifiable),
            'notifiable_id' => $notifiable->id,
            'notification_type' => $notificationClass,
            'event_type' => $eventType,
            'channel' => $channel,
            'status' => $status,
            'metadata' => json_encode($metadata),
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    public function markSent(int $logId): void
    {
        DB::table('notification_logs')
            ->where('id', $logId)
            ->update([
                'status' => 'sent',
                'sent_at' => now(),
                'updated_at' => now(),
            ]);
    }

    public function markFailed(int $logId, string $reason): void
    {
        DB::table('notification_logs')
            ->where('id', $logId)
            ->update([
                'status' => 'failed',
                'failed_at' => now(),
                'failure_reason' => $reason,
                'retry_count' => DB::raw('retry_count + 1'),
                'updated_at' => now(),
            ]);
    }

    public function scheduleRetry(int $logId, \DateTimeInterface $retryAt): void
    {
        DB::table('notification_logs')
            ->where('id', $logId)
            ->update([
                'status' => 'retrying',
                'retry_at' => $retryAt,
                'updated_at' => now(),
            ]);
    }
}
```

---

### Step 6: Run Migrations

```bash
# From host app directory (aeos365)
php artisan migrate
```

---

## Summary of Completed Work

### ✅ Phase 1 Deliverables

1. **Created UserContract Interface** - Enables package boundary enforcement
2. **Updated User Model** - Implements UserContract, maintains backward compatibility
3. **Created 16 High-Priority Events** - Employee, Attendance, Onboarding, Offboarding, Recruitment, Performance, Training, Safety
4. **Created 3 Database Migrations** - notification_logs, user_notification_preferences, notification_settings
5. **Generated Comprehensive Audit Report** - `docs/HRM_ARCHITECTURAL_AUDIT_REPORT.md`

### 🔄 Remaining Work (Phases 2-4)

**Phase 2:** (Next 2-3 days)
- Dispatch events in controllers
- Create 17 notification classes
- Create 20+ listener classes
- Register all listeners in EventServiceProvider
- Create NotificationLoggingService

**Phase 3:** (Next 1 week)
- Add Email channel support
- Add SMS channel support
- Add Push notification support
- Create notification templates

**Phase 4:** (Next 1-2 weeks)
- Create admin notification settings UI
- Create user notification preferences UI
- Implement delivery monitoring dashboard
- Add notification analytics

---

## Testing Checklist

### Unit Tests Required

- [ ] Test UserContract implementation
- [ ] Test each event dispatches correctly
- [ ] Test notification channel selection logic
- [ ] Test notification preferences enforcement
- [ ] Test notification logging service

### Integration Tests Required

- [ ] Test employee creation → EmployeeCreated event → WelcomeNotification
- [ ] Test attendance punch-in → AttendancePunchedIn event → ConfirmationNotification
- [ ] Test late arrival detection → LateArrivalDetected event → LateNotification
- [ ] Test onboarding completion → OnboardingCompleted event → CompletionNotification
- [ ] Test recruitment application → ApplicationReceived event → AcknowledgmentNotification

### Manual Testing Required

- [ ] Verify in-app notifications appear in UI
- [ ] Verify email notifications send correctly
- [ ] Verify SMS notifications send (when implemented)
- [ ] Verify push notifications work (when implemented)
- [ ] Verify user can configure notification preferences
- [ ] Verify admin can manage global notification settings
- [ ] Verify notification logging tracks all deliveries
- [ ] Verify failed notifications retry appropriately

---

## Package Boundary Refactoring (TODO)

The following files still have direct `use Aero\Core\Models\User` imports and need refactoring to use `UserContract`:

**High Priority:**
- `packages/aero-hrm/src/Models/Employee.php` - Needs `user()` relationship refactoring
- `packages/aero-hrm/src/Policies/*.php` (7 files) - Update type hints to UserContract
- `packages/aero-hrm/src/Services/LeaveApprovalService.php`
- `packages/aero-hrm/src/Services/LeaveBalanceService.php`
- `packages/aero-hrm/src/Services/BulkLeaveService.php`
- `packages/aero-hrm/src/Services/AttendanceCalculationService.php`

**Medium Priority:**
- `packages/aero-hrm/src/Models/EmergencyContact.php`
- `packages/aero-hrm/database/factories/*.php` (2 files)

**Low Priority (Tests):**
- `packages/aero-hrm/tests/Feature/**/*.php` (3 files)

**Refactoring Pattern:**

```php
// BEFORE (Direct dependency)
use Aero\Core\Models\User;

public function someMethod(User $user) {
    return $user->name;
}

// AFTER (Interface dependency)
use Aero\Core\Contracts\UserContract;

public function someMethod(UserContract $user) {
    return $user->getName(); // Use interface method
}
```

---

**End of Implementation Guide**
