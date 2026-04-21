<?php

declare(strict_types=1);

namespace Aero\HRM\Tests\Unit\Models;

use Aero\HRM\Models\Attendance;
use Aero\HRM\Models\Employee;
use Aero\HRM\Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;

class AttendanceModelTest extends TestCase
{
    use RefreshDatabase;

    #[\PHPUnit\Framework\Attributes\Test]
    public function it_creates_attendance_via_factory(): void
    {
        $attendance = Attendance::factory()->create();

        $this->assertInstanceOf(Attendance::class, $attendance);
        $this->assertNotNull($attendance->id);
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function it_belongs_to_employee(): void
    {
        $employee = Employee::factory()->create();
        $attendance = Attendance::factory()->create(['employee_id' => $employee->id]);

        $this->assertInstanceOf(Employee::class, $attendance->employee);
        $this->assertEquals($employee->id, $attendance->employee->id);
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function it_tracks_present_status(): void
    {
        $attendance = Attendance::factory()->create(['status' => 'present']);
        $this->assertEquals('present', $attendance->status);
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function it_tracks_absent_status(): void
    {
        $attendance = Attendance::factory()->create(['status' => 'absent']);
        $this->assertEquals('absent', $attendance->status);
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function it_tracks_all_valid_status_values(): void
    {
        $statuses = ['present', 'absent', 'late', 'half_day', 'on_leave', 'holiday', 'weekend'];

        foreach ($statuses as $status) {
            $attendance = Attendance::factory()->create(['status' => $status]);
            $this->assertEquals($status, $attendance->status);
        }
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function it_stores_check_in_and_check_out_times(): void
    {
        $attendance = Attendance::factory()->create([
            'check_in' => '09:00:00',
            'check_out' => '17:00:00',
        ]);

        $this->assertNotNull($attendance->check_in);
        $this->assertNotNull($attendance->check_out);
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function it_stores_attendance_date(): void
    {
        $attendance = Attendance::factory()->create([
            'date' => '2026-04-21',
        ]);

        $this->assertNotNull($attendance->date);
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function it_filters_attendance_by_employee(): void
    {
        $employee1 = Employee::factory()->create();
        $employee2 = Employee::factory()->create();

        Attendance::factory()->count(5)->create(['employee_id' => $employee1->id]);
        Attendance::factory()->count(3)->create(['employee_id' => $employee2->id]);

        $this->assertEquals(5, Attendance::where('employee_id', $employee1->id)->count());
        $this->assertEquals(3, Attendance::where('employee_id', $employee2->id)->count());
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function it_filters_attendance_by_date(): void
    {
        $employee = Employee::factory()->create();

        Attendance::factory()->create(['employee_id' => $employee->id, 'date' => '2026-04-01']);
        Attendance::factory()->create(['employee_id' => $employee->id, 'date' => '2026-04-02']);
        Attendance::factory()->create(['employee_id' => $employee->id, 'date' => '2026-04-03']);

        $this->assertEquals(3, Attendance::where('employee_id', $employee->id)
            ->whereBetween('date', ['2026-04-01', '2026-04-30'])
            ->count());
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function it_counts_late_entries_per_employee(): void
    {
        $employee = Employee::factory()->create();
        Attendance::factory()->count(3)->create([
            'employee_id' => $employee->id,
            'status' => 'late',
        ]);
        Attendance::factory()->count(10)->create([
            'employee_id' => $employee->id,
            'status' => 'present',
        ]);

        $lateCount = Attendance::where('employee_id', $employee->id)->where('status', 'late')->count();
        $this->assertEquals(3, $lateCount);
    }
}
