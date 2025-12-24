<?php

namespace Aero\HRM\Services;

use Aero\HRM\Models\Attendance;
use Aero\HRM\Models\AttendanceSetting;
use Aero\Core\Models\User;
use Carbon\Carbon;

class AttendanceCalculationService
{
    /**
     * Calculate work hours for an attendance record
     */
    public function calculateWorkHours(Attendance $attendance): float
    {
        if (! $attendance->punchin || ! $attendance->punchout) {
            return 0;
        }

        $punchin = Carbon::parse($attendance->punchin);
        $punchout = Carbon::parse($attendance->punchout);

        $totalMinutes = $punchin->diffInMinutes($punchout);

        // Deduct break time if configured
        $settings = AttendanceSetting::first();
        if ($settings && $settings->break_duration_minutes) {
            $totalMinutes -= $settings->break_duration_minutes;
        }

        return round($totalMinutes / 60, 2);
    }

    /**
     * Calculate overtime hours
     */
    public function calculateOvertime(Attendance $attendance, float $standardHours = 8): float
    {
        $workHours = $this->calculateWorkHours($attendance);

        if ($workHours <= $standardHours) {
            return 0;
        }

        return round($workHours - $standardHours, 2);
    }

    /**
     * Check if employee is late
     */
    public function isLate(Attendance $attendance): bool
    {
        if (! $attendance->punchin) {
            return false;
        }

        $settings = AttendanceSetting::first();
        if (! $settings || ! $settings->late_arrival_threshold_minutes) {
            return false;
        }

        $punchin = Carbon::parse($attendance->punchin);
        $expectedTime = Carbon::parse($attendance->date.' '.$settings->shift_start_time);

        $minutesLate = $expectedTime->diffInMinutes($punchin, false);

        return $minutesLate > $settings->late_arrival_threshold_minutes;
    }

    /**
     * Check if employee left early
     */
    public function isEarlyLeave(Attendance $attendance): bool
    {
        if (! $attendance->punchout) {
            return false;
        }

        $settings = AttendanceSetting::first();
        if (! $settings || ! $settings->early_leave_threshold_minutes) {
            return false;
        }

        $punchout = Carbon::parse($attendance->punchout);
        $expectedTime = Carbon::parse($attendance->date.' '.$settings->shift_end_time);

        $minutesEarly = $punchout->diffInMinutes($expectedTime, false);

        return $minutesEarly > $settings->early_leave_threshold_minutes;
    }

    /**
     * Process attendance status (Present, Late, Half Day, etc.)
     */
    public function determineStatus(Attendance $attendance): string
    {
        if (! $attendance->punchin) {
            return 'Absent';
        }

        if (! $attendance->punchout) {
            return 'Incomplete';
        }

        $workHours = $this->calculateWorkHours($attendance);
        $isLate = $this->isLate($attendance);
        $isEarlyLeave = $this->isEarlyLeave($attendance);

        $settings = AttendanceSetting::first();
        $halfDayThreshold = $settings->half_day_threshold_hours ?? 4;

        if ($workHours < $halfDayThreshold) {
            return 'Half Day';
        }

        if ($isLate && $isEarlyLeave) {
            return 'Late + Early Leave';
        }

        if ($isLate) {
            return 'Late';
        }

        if ($isEarlyLeave) {
            return 'Early Leave';
        }

        return 'Present';
    }

    /**
     * Calculate monthly work hours summary
     */
    public function getMonthlyWorkHours(User $user, int $month, int $year): array
    {
        $attendances = Attendance::where('user_id', $user->id)
            ->whereYear('date', $year)
            ->whereMonth('date', $month)
            ->whereNotNull('punchout')
            ->get();

        $totalHours = 0;
        $totalOvertime = 0;
        $presentDays = 0;
        $lateDays = 0;
        $halfDays = 0;

        foreach ($attendances as $attendance) {
            $workHours = $this->calculateWorkHours($attendance);
            $overtime = $this->calculateOvertime($attendance);

            $totalHours += $workHours;
            $totalOvertime += $overtime;

            $status = $this->determineStatus($attendance);

            if (str_contains($status, 'Present') || str_contains($status, 'Late') || str_contains($status, 'Early')) {
                $presentDays++;
            }

            if (str_contains($status, 'Late')) {
                $lateDays++;
            }

            if ($status === 'Half Day') {
                $halfDays++;
            }
        }

        return [
            'total_hours' => round($totalHours, 2),
            'total_overtime' => round($totalOvertime, 2),
            'present_days' => $presentDays,
            'late_days' => $lateDays,
            'half_days' => $halfDays,
            'absent_days' => $this->getWorkingDaysInMonth($month, $year) - $presentDays,
        ];
    }

    /**
     * Get working days in a month (excluding weekends)
     */
    private function getWorkingDaysInMonth(int $month, int $year): int
    {
        $startDate = Carbon::create($year, $month, 1);
        $endDate = $startDate->copy()->endOfMonth();

        $workingDays = 0;

        for ($date = $startDate; $date->lte($endDate); $date->addDay()) {
            if (! $date->isWeekend()) {
                $workingDays++;
            }
        }

        return $workingDays;
    }

    /**
     * Update attendance record with calculated fields
     */
    public function updateCalculatedFields(Attendance $attendance): void
    {
        $attendance->work_hours = $this->calculateWorkHours($attendance);
        $attendance->overtime_hours = $this->calculateOvertime($attendance);
        $attendance->is_late = $this->isLate($attendance);
        $attendance->is_early_leave = $this->isEarlyLeave($attendance);
        $attendance->status = $this->determineStatus($attendance);
        $attendance->save();
    }

    /**
     * Recalculate all attendance records for a user in a date range
     */
    public function recalculateForUser(User $user, Carbon $startDate, Carbon $endDate): int
    {
        $attendances = Attendance::where('user_id', $user->id)
            ->whereBetween('date', [$startDate, $endDate])
            ->get();

        $updated = 0;

        foreach ($attendances as $attendance) {
            $this->updateCalculatedFields($attendance);
            $updated++;
        }

        return $updated;
    }
}
