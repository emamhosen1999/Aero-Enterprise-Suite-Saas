<?php

namespace Aero\HRM\Tests\Unit\Notifications;

use Aero\HRM\Models\Leave;
use Aero\HRM\Notifications\LeaveApprovalNotification;
use Aero\HRM\Notifications\LeaveApprovedNotification;
use Aero\HRM\Notifications\LeaveCancelledNotification;
use Aero\HRM\Notifications\LeaveRejectedNotification;
use Aero\HRM\Notifications\LeaveRequestNotification;
use Illuminate\Foundation\Testing\WithFaker;
use Illuminate\Notifications\Messages\MailMessage;
use Mockery;
use PHPUnit\Framework\TestCase;

class LeaveNotificationsTest extends TestCase
{
    use WithFaker;

    protected function tearDown(): void
    {
        parent::tearDown();
        Mockery::close();
    }

    /**
     * Create a mock Leave object with default values.
     */
    protected function createMockLeave(array $attributes = []): Leave
    {
        $leave = Mockery::mock(Leave::class);

        $defaults = [
            'id' => 1,
            'user_id' => 1,
            'from_date' => now(),
            'to_date' => now()->addDays(2),
            'start_date' => now(),
            'end_date' => now()->addDays(2),
            'no_of_days' => 2,
            'days' => 2,
            'reason' => 'Personal',
            'status' => 'pending',
            'leave_type' => 'Annual Leave',
        ];

        $data = array_merge($defaults, $attributes);

        // Mock user relationship
        $user = Mockery::mock();
        $user->shouldReceive('getAttribute')->with('name')->andReturn('John Doe');
        $user->name = 'John Doe';

        // Mock leaveSetting relationship
        $leaveSetting = Mockery::mock();
        $leaveSetting->shouldReceive('getAttribute')->with('leave_type')->andReturn($data['leave_type']);
        $leaveSetting->leave_type = $data['leave_type'];

        // Mock leaveType relationship
        $leaveType = Mockery::mock();
        $leaveType->shouldReceive('getAttribute')->with('name')->andReturn($data['leave_type']);
        $leaveType->name = $data['leave_type'];

        $leave->shouldReceive('getAttribute')->with('id')->andReturn($data['id']);
        $leave->shouldReceive('getAttribute')->with('user_id')->andReturn($data['user_id']);
        $leave->shouldReceive('getAttribute')->with('from_date')->andReturn($data['from_date']);
        $leave->shouldReceive('getAttribute')->with('to_date')->andReturn($data['to_date']);
        $leave->shouldReceive('getAttribute')->with('start_date')->andReturn($data['start_date']);
        $leave->shouldReceive('getAttribute')->with('end_date')->andReturn($data['end_date']);
        $leave->shouldReceive('getAttribute')->with('no_of_days')->andReturn($data['no_of_days']);
        $leave->shouldReceive('getAttribute')->with('days')->andReturn($data['days']);
        $leave->shouldReceive('getAttribute')->with('reason')->andReturn($data['reason']);
        $leave->shouldReceive('getAttribute')->with('status')->andReturn($data['status']);
        $leave->shouldReceive('getAttribute')->with('leave_type')->andReturn($data['leave_type']);
        $leave->shouldReceive('getAttribute')->with('user')->andReturn($user);
        $leave->shouldReceive('getAttribute')->with('leaveSetting')->andReturn($leaveSetting);
        $leave->shouldReceive('getAttribute')->with('leaveType')->andReturn($leaveType);
        $leave->shouldReceive('getAttribute')->with('approved_at')->andReturn(now());
        $leave->shouldReceive('getAttribute')->with('approvedBy')->andReturn($user);
        $leave->shouldReceive('getAttribute')->with('rejected_at')->andReturn(null);
        $leave->shouldReceive('getAttribute')->with('rejectedBy')->andReturn(null);
        $leave->shouldReceive('getAttribute')->with('rejection_reason')->andReturn(null);
        $leave->shouldReceive('getAttribute')->with('cancelled_at')->andReturn(null);
        $leave->shouldReceive('getAttribute')->with('cancelledBy')->andReturn(null);
        $leave->shouldReceive('getAttribute')->with('cancellation_reason')->andReturn(null);

        // Add magic properties for direct access
        $leave->id = $data['id'];
        $leave->user_id = $data['user_id'];
        $leave->user = $user;
        $leave->leaveSetting = $leaveSetting;
        $leave->leaveType = $leaveType;
        $leave->from_date = $data['from_date'];
        $leave->to_date = $data['to_date'];
        $leave->start_date = $data['start_date'];
        $leave->end_date = $data['end_date'];
        $leave->no_of_days = $data['no_of_days'];
        $leave->days = $data['days'];
        $leave->reason = $data['reason'];
        $leave->leave_type = $data['leave_type'];
        $leave->approved_at = now();
        $leave->approvedBy = $user;

        return $leave;
    }

    /**
     * Create a mock notifiable object.
     */
    protected function createMockNotifiable(array $attributes = []): object
    {
        $notifiable = Mockery::mock();

        $defaults = [
            'id' => 1,
            'name' => 'Test User',
            'email' => 'test@example.com',
        ];

        $data = array_merge($defaults, $attributes);

        $notifiable->shouldReceive('getAttribute')->with('id')->andReturn($data['id']);
        $notifiable->shouldReceive('getAttribute')->with('name')->andReturn($data['name']);
        $notifiable->shouldReceive('getAttribute')->with('email')->andReturn($data['email']);

        $notifiable->id = $data['id'];
        $notifiable->name = $data['name'];
        $notifiable->email = $data['email'];

        return $notifiable;
    }

    /**
     * Test LeaveRequestNotification creates correct mail message.
     */
    public function test_leave_request_notification_creates_mail(): void
    {
        $leave = $this->createMockLeave();
        $notification = new LeaveRequestNotification($leave);
        $notifiable = $this->createMockNotifiable();

        $mail = $notification->toMail($notifiable);

        $this->assertInstanceOf(MailMessage::class, $mail);
    }

    /**
     * Test LeaveRequestNotification returns correct array data.
     */
    public function test_leave_request_notification_to_array(): void
    {
        $leave = $this->createMockLeave();
        $notification = new LeaveRequestNotification($leave);
        $notifiable = $this->createMockNotifiable();

        $array = $notification->toArray($notifiable);

        $this->assertArrayHasKey('type', $array);
        $this->assertArrayHasKey('leave_id', $array);
        $this->assertArrayHasKey('employee_name', $array);
        $this->assertEquals('leave_requested', $array['type']);
    }

    /**
     * Test LeaveApprovedNotification creates correct mail message.
     */
    public function test_leave_approved_notification_creates_mail(): void
    {
        $leave = $this->createMockLeave();
        $notification = new LeaveApprovedNotification($leave);
        $notifiable = $this->createMockNotifiable();

        $mail = $notification->toMail($notifiable);

        $this->assertInstanceOf(MailMessage::class, $mail);
    }

    /**
     * Test LeaveApprovedNotification returns correct array data.
     */
    public function test_leave_approved_notification_to_array(): void
    {
        $leave = $this->createMockLeave();
        $notification = new LeaveApprovedNotification($leave);
        $notifiable = $this->createMockNotifiable();

        $array = $notification->toArray($notifiable);

        $this->assertArrayHasKey('type', $array);
        $this->assertEquals('leave_approved', $array['type']);
        $this->assertArrayHasKey('status', $array);
        $this->assertEquals('approved', $array['status']);
    }

    /**
     * Test LeaveRejectedNotification creates correct mail message.
     */
    public function test_leave_rejected_notification_creates_mail(): void
    {
        $leave = $this->createMockLeave();
        $notification = new LeaveRejectedNotification($leave, 'Insufficient leave balance');
        $notifiable = $this->createMockNotifiable();

        $mail = $notification->toMail($notifiable);

        $this->assertInstanceOf(MailMessage::class, $mail);
    }

    /**
     * Test LeaveRejectedNotification returns correct array data.
     */
    public function test_leave_rejected_notification_to_array(): void
    {
        $leave = $this->createMockLeave();
        $notification = new LeaveRejectedNotification($leave, 'Insufficient leave balance');
        $notifiable = $this->createMockNotifiable();

        $array = $notification->toArray($notifiable);

        $this->assertArrayHasKey('type', $array);
        $this->assertEquals('leave_rejected', $array['type']);
        $this->assertArrayHasKey('rejection_reason', $array);
    }

    /**
     * Test LeaveCancelledNotification creates correct mail message.
     */
    public function test_leave_cancelled_notification_creates_mail(): void
    {
        $leave = $this->createMockLeave();
        $notification = new LeaveCancelledNotification($leave, 'Plans changed');
        $notifiable = $this->createMockNotifiable();

        $mail = $notification->toMail($notifiable);

        $this->assertInstanceOf(MailMessage::class, $mail);
    }

    /**
     * Test LeaveCancelledNotification returns correct array data.
     */
    public function test_leave_cancelled_notification_to_array(): void
    {
        $leave = $this->createMockLeave();
        $notification = new LeaveCancelledNotification($leave, 'Plans changed');
        $notifiable = $this->createMockNotifiable();

        $array = $notification->toArray($notifiable);

        $this->assertArrayHasKey('type', $array);
        $this->assertEquals('leave_cancelled', $array['type']);
    }

    /**
     * Test LeaveApprovalNotification creates correct mail message.
     */
    public function test_leave_approval_notification_creates_mail(): void
    {
        $leave = $this->createMockLeave();
        $notification = new LeaveApprovalNotification($leave);
        $notifiable = $this->createMockNotifiable();

        $mail = $notification->toMail($notifiable);

        $this->assertInstanceOf(MailMessage::class, $mail);
    }

    /**
     * Test LeaveApprovalNotification returns correct array data.
     */
    public function test_leave_approval_notification_to_array(): void
    {
        $leave = $this->createMockLeave();
        $notification = new LeaveApprovalNotification($leave);
        $notifiable = $this->createMockNotifiable();

        $array = $notification->toArray($notifiable);

        $this->assertArrayHasKey('type', $array);
        $this->assertEquals('leave_approval_required', $array['type']);
        $this->assertArrayHasKey('action_required', $array);
        $this->assertTrue($array['action_required']);
    }
}
