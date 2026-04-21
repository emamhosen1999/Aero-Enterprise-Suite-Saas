<?php

declare(strict_types=1);

namespace Aero\HRM\Tests\Unit\Models;

use Aero\HRM\Models\Employee;
use Aero\HRM\Models\OvertimeRecord;
use Aero\HRM\Models\OvertimeRequest;
use Aero\HRM\Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;

class OvertimeModelTest extends TestCase
{
    use RefreshDatabase;

    #[\PHPUnit\Framework\Attributes\Test]
    public function it_creates_overtime_record_via_factory(): void
    {
        $record = OvertimeRecord::factory()->create();

        $this->assertInstanceOf(OvertimeRecord::class, $record);
        $this->assertNotNull($record->id);
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function it_belongs_to_employee(): void
    {
        $employee = Employee::factory()->create();
        $record = OvertimeRecord::factory()->create(['employee_id' => $employee->id]);

        $this->assertEquals($employee->id, $record->employee_id);
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function it_creates_overtime_request_via_factory(): void
    {
        $request = OvertimeRequest::factory()->create();

        $this->assertInstanceOf(OvertimeRequest::class, $request);
        $this->assertNotNull($request->id);
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function it_tracks_all_overtime_record_statuses(): void
    {
        $statuses = ['pending', 'approved', 'rejected', 'cancelled'];

        foreach ($statuses as $status) {
            $record = OvertimeRecord::factory()->create(['status' => $status]);
            $this->assertEquals($status, $record->status);
        }
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function it_filters_pending_overtime_records(): void
    {
        OvertimeRecord::factory()->count(4)->create(['status' => 'pending']);
        OvertimeRecord::factory()->count(2)->create(['status' => 'approved']);

        $this->assertEquals(4, OvertimeRecord::where('status', 'pending')->count());
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function it_stores_start_and_end_times(): void
    {
        $record = OvertimeRecord::factory()->create([
            'start_time' => '18:00:00',
            'end_time' => '21:00:00',
        ]);

        $this->assertNotNull($record->start_time);
        $this->assertNotNull($record->end_time);
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function it_counts_overtime_records_per_employee(): void
    {
        $employee = Employee::factory()->create();
        OvertimeRecord::factory()->count(6)->create(['employee_id' => $employee->id]);

        $this->assertEquals(6, OvertimeRecord::where('employee_id', $employee->id)->count());
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function it_stores_approval_details_when_approved(): void
    {
        $employee = Employee::factory()->create();
        $approver = Employee::factory()->create();

        $record = OvertimeRecord::factory()->create([
            'employee_id' => $employee->id,
            'status' => 'approved',
            'approved_by' => $approver->id,
            'approved_at' => now(),
        ]);

        $this->assertEquals('approved', $record->status);
        $this->assertEquals($approver->id, $record->approved_by);
        $this->assertNotNull($record->approved_at);
    }
}
