<?php

namespace Aero\HRM\Listeners\Attendance;

use Aero\HRM\Events\Attendance\AttendancePunchedOut;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * Calculates and records overtime when employee punches out.
 */
class CalculateOvertimeIfAny implements ShouldQueue
{
    public function handle(AttendancePunchedOut $event): void
    {
        $attendance = $event->attendance;

        if (! $event->hasOvertime) {
            return;
        }

        try {
            // Calculate overtime details
            $overtimeData = $this->calculateOvertime($attendance, $event);

            if ($overtimeData['overtime_minutes'] > 0) {
                // Update attendance record with overtime
                $attendance->update([
                    'overtime_minutes' => $overtimeData['overtime_minutes'],
                    'overtime_type' => $overtimeData['overtime_type'],
                    'overtime_rate' => $overtimeData['overtime_rate'],
                ]);

                // Create overtime record if table exists
                $this->createOvertimeRecord($attendance, $overtimeData);

                Log::info('Overtime calculated and recorded', [
                    'attendance_id' => $attendance->id,
                    'overtime_minutes' => $overtimeData['overtime_minutes'],
                    'overtime_type' => $overtimeData['overtime_type'],
                ]);
            }
        } catch (\Exception $e) {
            Log::error('Failed to calculate overtime', [
                'attendance_id' => $attendance->id,
                'error' => $e->getMessage(),
            ]);

            throw $e;
        }
    }

    protected function calculateOvertime($attendance, AttendancePunchedOut $event): array
    {
        $totalMinutes = $event->totalMinutes ?? 0;

        // Get employee's standard work hours (default 8 hours)
        $standardMinutes = $this->getStandardWorkMinutes($attendance);

        $overtimeMinutes = max(0, $totalMinutes - $standardMinutes);

        // Determine overtime type based on day and hours
        $overtimeType = $this->determineOvertimeType($attendance, $overtimeMinutes);

        // Get overtime rate based on type
        $overtimeRate = $this->getOvertimeRate($overtimeType);

        return [
            'total_minutes' => $totalMinutes,
            'standard_minutes' => $standardMinutes,
            'overtime_minutes' => $overtimeMinutes,
            'overtime_type' => $overtimeType,
            'overtime_rate' => $overtimeRate,
        ];
    }

    protected function getStandardWorkMinutes($attendance): int
    {
        // Try to get from employee's shift schedule
        $employee = $attendance->employee ?? $attendance->user?->employee;

        if ($employee && $employee->shift_id) {
            try {
                $shift = \Aero\HRM\Models\ShiftSchedule::find($employee->shift_id);
                if ($shift && $shift->work_hours) {
                    return $shift->work_hours * 60;
                }
            } catch (\Exception $e) {
                // Use default
            }
        }

        // Default: 8 hours
        return 480;
    }

    protected function determineOvertimeType($attendance, int $overtimeMinutes): string
    {
        $date = $attendance->punchout ?? $attendance->punchin ?? now();

        if ($date instanceof \Carbon\Carbon) {
            $carbonDate = $date;
        } else {
            $carbonDate = \Carbon\Carbon::parse($date);
        }

        // Check if it's a holiday
        $isHoliday = \Aero\HRM\Models\Holiday::whereDate('date', $carbonDate->toDateString())->exists();

        if ($isHoliday) {
            return 'holiday';
        }

        // Check if it's a weekend
        if ($carbonDate->isWeekend()) {
            return 'weekend';
        }

        // Check hours for weekday overtime classification
        if ($overtimeMinutes > 120) { // More than 2 hours
            return 'extended';
        }

        return 'regular';
    }

    protected function getOvertimeRate(string $overtimeType): float
    {
        // Get rates from settings or use defaults
        $rates = [
            'regular' => 1.5,
            'extended' => 2.0,
            'weekend' => 2.0,
            'holiday' => 2.5,
        ];

        return $rates[$overtimeType] ?? 1.5;
    }

    protected function createOvertimeRecord($attendance, array $overtimeData): void
    {
        try {
            DB::table('employee_overtime')->insert([
                'attendance_id' => $attendance->id,
                'employee_id' => $attendance->employee_id ?? $attendance->user?->employee?->id,
                'date' => $attendance->punchout?->toDateString() ?? now()->toDateString(),
                'overtime_minutes' => $overtimeData['overtime_minutes'],
                'overtime_type' => $overtimeData['overtime_type'],
                'overtime_rate' => $overtimeData['overtime_rate'],
                'status' => 'pending_approval',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        } catch (\Exception $e) {
            // Table might not exist
            Log::warning('Could not create overtime record', ['error' => $e->getMessage()]);
        }
    }

    public function failed(AttendancePunchedOut $event, \Throwable $exception): void
    {
        Log::error('Failed to calculate overtime', [
            'attendance_id' => $event->attendance->id,
            'error' => $exception->getMessage(),
        ]);
    }
}
