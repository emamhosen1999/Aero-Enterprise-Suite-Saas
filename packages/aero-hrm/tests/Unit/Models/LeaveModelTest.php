<?php

declare(strict_types=1);

namespace Aero\HRM\Tests\Unit\Models;

use Aero\HRM\Models\Employee;
use Aero\HRM\Models\Leave;
use Aero\HRM\Models\LeaveType;
use Aero\HRM\Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;

class LeaveModelTest extends TestCase
{
    use RefreshDatabase;

    #[\PHPUnit\Framework\Attributes\Test]
    public function it_creates_leave_via_factory(): void
    {
        $leave = Leave::factory()->create();

        $this->assertInstanceOf(Leave::class, $leave);
        $this->assertNotNull($leave->id);
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function it_belongs_to_employee(): void
    {
        $employee = Employee::factory()->create();
        $leave = Leave::factory()->create(['employee_id' => $employee->id]);

        $this->assertEquals($employee->id, $leave->employee->id);
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function it_tracks_all_status_values(): void
    {
        $statuses = ['pending', 'approved', 'rejected', 'cancelled'];

        foreach ($statuses as $status) {
            $leave = Leave::factory()->create(['status' => $status]);
            $this->assertEquals($status, $leave->status);
        }
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function it_filters_pending_leaves(): void
    {
        Leave::factory()->count(3)->create(['status' => 'pending']);
        Leave::factory()->count(2)->create(['status' => 'approved']);

        $this->assertEquals(3, Leave::where('status', 'pending')->count());
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function it_filters_approved_leaves(): void
    {
        Leave::factory()->count(2)->create(['status' => 'approved']);
        Leave::factory()->count(4)->create(['status' => 'pending']);

        $this->assertEquals(2, Leave::where('status', 'approved')->count());
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function it_belongs_to_approver_when_approved(): void
    {
        $employee = Employee::factory()->create();
        $approver = Employee::factory()->create();

        $leave = Leave::factory()->create([
            'employee_id' => $employee->id,
            'approved_by' => $approver->id,
            'status' => 'approved',
        ]);

        $this->assertEquals($approver->id, $leave->approved_by);
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function it_stores_rejection_reason(): void
    {
        $leave = Leave::factory()->create([
            'status' => 'rejected',
            'rejection_reason' => 'Insufficient leave balance.',
        ]);

        $this->assertEquals('Insufficient leave balance.', $leave->rejection_reason);
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function it_has_from_and_to_dates(): void
    {
        $leave = Leave::factory()->create([
            'from_date' => '2026-05-01',
            'to_date' => '2026-05-03',
        ]);

        $this->assertNotNull($leave->from_date);
        $this->assertNotNull($leave->to_date);
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function it_counts_leaves_per_employee_correctly(): void
    {
        $employee = Employee::factory()->create();
        Leave::factory()->count(5)->create(['employee_id' => $employee->id]);

        $this->assertEquals(5, Leave::where('employee_id', $employee->id)->count());
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function it_can_be_soft_deleted(): void
    {
        $leave = Leave::factory()->create();
        $leaveId = $leave->id;

        $leave->delete();

        $this->assertNull(Leave::find($leaveId));
    }
}
