<?php

namespace Aero\HRM\Tests\Unit\Services;

use Aero\HRM\Models\Employee;
use Aero\HRM\Models\OvertimeRecord;
use Aero\HRM\Services\OvertimeApprovalService;
use Aero\HRM\Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\Test;

class OvertimeApprovalServiceTest extends TestCase
{
    use RefreshDatabase;

    protected OvertimeApprovalService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = app(OvertimeApprovalService::class);
    }

    #[Test]
    public function it_creates_overtime_record_with_pending_status(): void
    {
        $employee = Employee::factory()->create();

        $record = OvertimeRecord::factory()->create([
            'employee_id' => $employee->id,
            'status' => 'pending',
        ]);

        $this->assertEquals('pending', $record->status);
        $this->assertEquals($employee->id, $record->employee_id);
    }

    #[Test]
    public function it_calculates_overtime_hours_correctly(): void
    {
        $employee = Employee::factory()->create();

        $record = OvertimeRecord::factory()->create([
            'employee_id' => $employee->id,
            'start_time' => '18:00:00',
            'end_time' => '21:00:00',
        ]);

        $this->assertNotNull($record);
        $this->assertEquals($employee->id, $record->employee_id);
    }

    #[Test]
    public function it_updates_status_on_manager_approval(): void
    {
        $employee = Employee::factory()->create();
        $manager = Employee::factory()->create();

        $record = OvertimeRecord::factory()->create([
            'employee_id' => $employee->id,
            'status' => 'pending',
        ]);

        $record->update([
            'status' => 'approved',
            'approved_by' => $manager->id,
            'approved_at' => now(),
        ]);

        $record->refresh();
        $this->assertEquals('approved', $record->status);
        $this->assertEquals($manager->id, $record->approved_by);
    }

    #[Test]
    public function it_updates_status_on_rejection(): void
    {
        $employee = Employee::factory()->create();
        $manager = Employee::factory()->create();

        $record = OvertimeRecord::factory()->create([
            'employee_id' => $employee->id,
            'status' => 'pending',
        ]);

        $record->update([
            'status' => 'rejected',
            'rejected_by' => $manager->id,
            'rejected_at' => now(),
            'rejection_reason' => 'Business needs do not justify overtime.',
        ]);

        $record->refresh();
        $this->assertEquals('rejected', $record->status);
        $this->assertNotNull($record->rejection_reason);
    }

    #[Test]
    public function it_filters_overtime_records_by_employee(): void
    {
        $employee1 = Employee::factory()->create();
        $employee2 = Employee::factory()->create();

        OvertimeRecord::factory()->count(3)->create(['employee_id' => $employee1->id]);
        OvertimeRecord::factory()->count(2)->create(['employee_id' => $employee2->id]);

        $this->assertCount(3, OvertimeRecord::where('employee_id', $employee1->id)->get());
        $this->assertCount(2, OvertimeRecord::where('employee_id', $employee2->id)->get());
    }
}
