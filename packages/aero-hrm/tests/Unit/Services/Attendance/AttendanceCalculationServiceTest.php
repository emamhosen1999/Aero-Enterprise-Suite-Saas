<?php

namespace Aero\HRM\Tests\Unit\Services\Attendance;

use Aero\HRM\Models\Attendance;
use Aero\HRM\Models\AttendanceSetting;
use Aero\HRM\Services\AttendanceCalculationService;
use Aero\HRM\Tests\TestCase;
use Carbon\Carbon;

class AttendanceCalculationServiceTest extends TestCase
{
    private AttendanceCalculationService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = app(AttendanceCalculationService::class);
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function it_calculates_work_hours_correctly()
    {
        $punchin = Carbon::parse('2026-01-09 09:00:00');
        $punchout = Carbon::parse('2026-01-09 18:00:00');

        $attendance = Attendance::factory()->create([
            'punchin' => $punchin,
            'punchout' => $punchout,
        ]);

        $hours = $this->service->calculateWorkHours($attendance);

        $this->assertEquals(9.0, $hours);
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function it_deducts_break_time_from_work_hours()
    {
        AttendanceSetting::create([
            'break_duration_minutes' => 60,
            'shift_start_time' => '09:00:00',
            'shift_end_time' => '18:00:00',
        ]);

        $punchin = Carbon::parse('2026-01-09 09:00:00');
        $punchout = Carbon::parse('2026-01-09 18:00:00');

        $attendance = Attendance::factory()->create([
            'punchin' => $punchin,
            'punchout' => $punchout,
        ]);

        $hours = $this->service->calculateWorkHours($attendance);

        $this->assertEquals(8.0, $hours);
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function it_returns_zero_hours_for_missing_punchout()
    {
        $attendance = Attendance::factory()->noPunchout()->create([
            'punchin' => Carbon::parse('2026-01-09 09:00:00'),
            'punchout' => null,
        ]);

        $hours = $this->service->calculateWorkHours($attendance);

        $this->assertEquals(0, $hours);
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function it_calculates_overtime_correctly()
    {
        $punchin = Carbon::parse('2026-01-09 09:00:00');
        $punchout = Carbon::parse('2026-01-09 19:00:00');

        $attendance = Attendance::factory()->create([
            'punchin' => $punchin,
            'punchout' => $punchout,
        ]);

        $overtime = $this->service->calculateOvertime($attendance, 8);

        $this->assertEquals(2.0, $overtime);
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function it_detects_late_arrival()
    {
        AttendanceSetting::create([
            'shift_start_time' => '09:00:00',
            'shift_end_time' => '18:00:00',
            'late_arrival_threshold_minutes' => 15,
        ]);

        $attendance = Attendance::factory()->create([
            'date' => '2026-01-09',
            'punchin' => Carbon::parse('2026-01-09 09:30:00'),
            'punchout' => Carbon::parse('2026-01-09 18:00:00'),
        ]);

        $isLate = $this->service->isLate($attendance);

        $this->assertTrue($isLate);
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function it_determines_status_as_present()
    {
        AttendanceSetting::create([
            'shift_start_time' => '09:00:00',
            'shift_end_time' => '18:00:00',
            'late_arrival_threshold_minutes' => 15,
            'early_leave_threshold_minutes' => 15,
            'half_day_threshold_hours' => 4,
        ]);

        $attendance = Attendance::factory()->create([
            'date' => '2026-01-09',
            'punchin' => Carbon::parse('2026-01-09 09:00:00'),
            'punchout' => Carbon::parse('2026-01-09 18:00:00'),
        ]);

        $status = $this->service->determineStatus($attendance);

        $this->assertEquals('Present', $status);
    }
}
