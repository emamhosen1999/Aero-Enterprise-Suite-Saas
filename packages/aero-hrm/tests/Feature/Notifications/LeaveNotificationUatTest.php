<?php

declare(strict_types=1);

namespace Tests\Feature\HRM\Notifications;

use Aero\HRM\Events\Leave\LeaveApproved;
use Aero\HRM\Events\Leave\LeaveCancelled;
use Aero\HRM\Events\Leave\LeaveRejected;
use Aero\HRM\Events\Leave\LeaveRequested;
use Aero\HRM\Models\Employee;
use Aero\HRM\Models\Leave;
use Aero\HRM\Notifications\LeaveApprovedNotification;
use Aero\HRM\Notifications\LeaveCancelledNotification;
use Aero\HRM\Notifications\LeaveRejectedNotification;
use Aero\HRM\Notifications\LeaveRequestNotification;
use Aero\Core\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

/**
 * UAT Tests for Leave Notification System
 *
 * Test IDs: NOTIF-LV-01 to NOTIF-LV-06
 */
class LeaveNotificationUatTest extends TestCase
{
    use RefreshDatabase;

    protected User $employee;
    protected User $manager;
    protected User $hrAdmin;
    protected Employee $employeeRecord;
    protected Employee $managerRecord;

    protected function setUp(): void
    {
        parent::setUp();

        // Create HR Admin
        $this->hrAdmin = User::factory()->create([
            'name' => 'HR Admin',
            'email' => 'hr@test.com',
            'notification_preferences' => [
                'leave_requested' => ['mail' => true, 'database' => true, 'fcm' => true],
                'leave_cancelled' => ['mail' => true, 'database' => true, 'fcm' => true],
            ],
        ]);

        // Create Manager
        $this->manager = User::factory()->create([
            'name' => 'Manager',
            'email' => 'manager@test.com',
            'notification_preferences' => [
                'leave_requested' => ['mail' => true, 'database' => true, 'fcm' => true],
                'leave_approved' => ['mail' => true, 'database' => true],
                'leave_cancelled' => ['mail' => true, 'database' => true],
            ],
        ]);

        $this->managerRecord = Employee::factory()->create([
            'user_id' => $this->manager->id,
            'status' => 'active',
        ]);

        // Create Employee
        $this->employee = User::factory()->create([
            'name' => 'Test Employee',
            'email' => 'emp1@test.com',
            'fcm_token' => 'test-fcm-token-123',
            'notification_preferences' => [
                'leave_approved' => ['mail' => true, 'database' => true, 'fcm' => true],
                'leave_rejected' => ['mail' => true, 'database' => true, 'fcm' => true],
                'leave_cancelled' => ['mail' => true, 'database' => true],
            ],
        ]);

        $this->employeeRecord = Employee::factory()->create([
            'user_id' => $this->employee->id,
            'manager_id' => $this->manager->id,  // manager_id references users.id, not employees.id
            'status' => 'active',
        ]);
    }

    /**
     * @test
     * Test ID: NOTIF-LV-01
     * Leave Request Notification to Manager
     */
    public function it_sends_leave_request_notification_to_manager(): void
    {
        Notification::fake();

        // Create leave request
        $leave = Leave::factory()->create([
            'user_id' => $this->employee->id,
            'employee_id' => $this->employeeRecord->id,
            'status' => 'pending',
            'start_date' => now()->addDays(7),
            'end_date' => now()->addDays(9),
            'total_days' => 3,
        ]);

        // Trigger event
        event(new LeaveRequested($leave));

        // Assert manager was notified
        Notification::assertSentTo(
            $this->manager,
            LeaveRequestNotification::class,
            function ($notification, $channels) use ($leave) {
                return $notification->leave->id === $leave->id
                    && in_array('mail', $channels)
                    && in_array('database', $channels)
                    && in_array('fcm', $channels);
            }
        );

        $this->assertTrue(true, 'NOTIF-LV-01: PASSED - Manager receives leave request notification');
    }

    /**
     * @test
     * Test ID: NOTIF-LV-02
     * Leave Approved Notification to Employee
     */
    public function it_sends_leave_approved_notification_to_employee(): void
    {
        Notification::fake();

        $leave = Leave::factory()->create([
            'user_id' => $this->employee->id,
            'employee_id' => $this->employeeRecord->id,
            'status' => 'pending',
        ]);

        // Approve leave
        $leave->update(['status' => 'approved', 'approved_by' => $this->manager->id]);

        // Trigger event
        event(new LeaveApproved($leave));

        // Assert employee was notified
        Notification::assertSentTo(
            $this->employee,
            LeaveApprovedNotification::class,
            function ($notification, $channels) use ($leave) {
                return $notification->leave->id === $leave->id
                    && in_array('mail', $channels)
                    && in_array('database', $channels)
                    && in_array('fcm', $channels);
            }
        );

        $this->assertTrue(true, 'NOTIF-LV-02: PASSED - Employee receives leave approval notification');
    }

    /**
     * @test
     * Test ID: NOTIF-LV-03
     * Leave Rejected Notification to Employee
     */
    public function it_sends_leave_rejected_notification_to_employee(): void
    {
        Notification::fake();

        $leave = Leave::factory()->create([
            'user_id' => $this->employee->id,
            'employee_id' => $this->employeeRecord->id,
            'status' => 'pending',
        ]);

        // Reject leave
        $leave->update([
            'status' => 'rejected',
            'approved_by' => $this->manager->id,
            'remarks' => 'Not enough staff coverage',
        ]);

        // Trigger event
        event(new LeaveRejected($leave));

        // Assert employee was notified
        Notification::assertSentTo(
            $this->employee,
            LeaveRejectedNotification::class,
            function ($notification, $channels) use ($leave) {
                return $notification->leave->id === $leave->id
                    && in_array('mail', $channels)
                    && in_array('database', $channels);
            }
        );

        $this->assertTrue(true, 'NOTIF-LV-03: PASSED - Employee receives leave rejection notification');
    }

    /**
     * @test
     * Test ID: NOTIF-LV-04
     * Leave Cancelled by Employee - Manager Notified
     */
    public function it_sends_leave_cancelled_notification_to_manager(): void
    {
        Notification::fake();

        $leave = Leave::factory()->create([
            'user_id' => $this->employee->id,
            'employee_id' => $this->employeeRecord->id,
            'status' => 'approved',
        ]);

        // Cancel leave
        $leave->update(['status' => 'cancelled']);

        // Trigger event
        event(new LeaveCancelled($leave, $this->employee));

        // Assert manager and HR were notified
        Notification::assertSentTo(
            [$this->manager, $this->hrAdmin],
            LeaveCancelledNotification::class
        );

        $this->assertTrue(true, 'NOTIF-LV-04: PASSED - Manager + HR receive cancellation notification');
    }

    /**
     * @test
     * Test ID: NOTIF-LV-05
     * Leave Cancelled by Manager - Employee Notified
     */
    public function it_sends_leave_cancelled_notification_to_employee(): void
    {
        Notification::fake();

        $leave = Leave::factory()->create([
            'user_id' => $this->employee->id,
            'employee_id' => $this->employeeRecord->id,
            'status' => 'approved',
        ]);

        // Manager cancels leave
        $leave->update([
            'status' => 'cancelled',
            'remarks' => 'Project deadline requires your presence',
        ]);

        // Trigger event
        event(new LeaveCancelled($leave, $this->manager));

        // Assert employee was notified
        Notification::assertSentTo(
            $this->employee,
            LeaveCancelledNotification::class,
            function ($notification, $channels) use ($leave) {
                return $notification->leave->id === $leave->id
                    && in_array('mail', $channels)
                    && in_array('database', $channels);
            }
        );

        $this->assertTrue(true, 'NOTIF-LV-05: PASSED - Employee receives manager cancellation notification');
    }

    /**
     * @test
     * Test ID: PREF-01
     * Respect User Notification Preferences - Email Disabled
     */
    public function it_respects_user_preference_when_email_disabled(): void
    {
        Notification::fake();

        // Update employee preferences - disable email for leave approval
        $this->employee->update([
            'notification_preferences' => [
                'leave_approved' => ['mail' => false, 'database' => true, 'fcm' => true],
            ],
        ]);

        $leave = Leave::factory()->create([
            'user_id' => $this->employee->id,
            'employee_id' => $this->employeeRecord->id,
            'status' => 'approved',
        ]);

        event(new LeaveApproved($leave));

        // Assert notification sent but email channel not included
        Notification::assertSentTo(
            $this->employee,
            LeaveApprovedNotification::class,
            function ($notification, $channels) {
                return ! in_array('mail', $channels)
                    && in_array('database', $channels)
                    && in_array('fcm', $channels);
            }
        );

        $this->assertTrue(true, 'PREF-01: PASSED - Email channel disabled per user preference');
    }

    /**
     * @test
     * Test ID: ERR-04
     * Employee Without User Account
     */
    public function it_handles_employee_without_user_gracefully(): void
    {
        $employeeWithoutUser = Employee::factory()->create([
            'user_id' => null,
            'status' => 'active',
        ]);

        $leave = Leave::factory()->create([
            'user_id' => null,
            'employee_id' => $employeeWithoutUser->id,
            'status' => 'approved',
        ]);

        // Should not throw exception
        try {
            event(new LeaveApproved($leave));
            $this->assertTrue(true, 'ERR-04: PASSED - Handles missing user gracefully');
        } catch (\Exception $e) {
            $this->fail('ERR-04: FAILED - Exception thrown: '.$e->getMessage());
        }
    }

    /**
     * @test
     * Test ID: ERR-05
     * Manager Not Assigned - Falls Back to HR
     */
    public function it_falls_back_to_hr_when_manager_not_assigned(): void
    {
        Notification::fake();

        // Create employee without manager
        $employeeNoManager = Employee::factory()->create([
            'user_id' => User::factory()->create()->id,
            'manager_id' => null,
            'status' => 'active',
        ]);

        $leave = Leave::factory()->create([
            'user_id' => $employeeNoManager->user_id,
            'employee_id' => $employeeNoManager->id,
            'status' => 'pending',
        ]);

        event(new LeaveRequested($leave));

        // Should notify HR instead
        Notification::assertSentTo(
            $this->hrAdmin,
            LeaveRequestNotification::class
        );

        $this->assertTrue(true, 'ERR-05: PASSED - Falls back to HR when no manager');
    }
}
