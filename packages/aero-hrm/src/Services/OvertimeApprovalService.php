<?php

namespace Aero\HRM\Services;

use Aero\HRM\Models\Employee;
use Aero\HRM\Models\OvertimeRecord;
use Aero\HRM\Models\OvertimeRequest;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class OvertimeApprovalService
{
    public const STATUS_PENDING = 'pending';

    public const STATUS_MANAGER_APPROVED = 'manager_approved';

    public const STATUS_HR_APPROVED = 'approved';

    public const STATUS_REJECTED = 'rejected';

    public const STATUS_PROCESSED = 'processed';

    /**
     * Submit an overtime request.
     */
    public function submitRequest(array $data): OvertimeRequest
    {
        $request = OvertimeRequest::create([
            'employee_id' => $data['employee_id'],
            'date' => $data['date'],
            'start_time' => $data['start_time'],
            'end_time' => $data['end_time'],
            'hours' => $data['hours'] ?? $this->calculateHours($data['start_time'], $data['end_time']),
            'reason' => $data['reason'],
            'type' => $data['type'] ?? 'regular',
            'status' => self::STATUS_PENDING,
            'submitted_at' => now(),
        ]);

        Log::info('Overtime request submitted', [
            'request_id' => $request->id,
            'employee_id' => $data['employee_id'],
            'hours' => $request->hours,
        ]);

        return $request;
    }

    /**
     * Manager approval of overtime request.
     */
    public function managerApprove(OvertimeRequest $request, int $approverId, ?string $notes = null): OvertimeRequest
    {
        if ($request->status !== self::STATUS_PENDING) {
            throw new \RuntimeException("Request cannot be approved at current status: {$request->status}");
        }

        $request->update([
            'status' => self::STATUS_MANAGER_APPROVED,
            'manager_approved_by' => $approverId,
            'manager_approved_at' => now(),
            'manager_notes' => $notes,
        ]);

        Log::info('Overtime request manager approved', [
            'request_id' => $request->id,
            'approved_by' => $approverId,
        ]);

        return $request->fresh();
    }

    /**
     * HR final approval of overtime request.
     */
    public function hrApprove(OvertimeRequest $request, int $approverId, ?string $notes = null): OvertimeRequest
    {
        if ($request->status !== self::STATUS_MANAGER_APPROVED) {
            throw new \RuntimeException("Request requires manager approval first. Current status: {$request->status}");
        }

        return DB::transaction(function () use ($request, $approverId, $notes) {
            $request->update([
                'status' => self::STATUS_HR_APPROVED,
                'hr_approved_by' => $approverId,
                'hr_approved_at' => now(),
                'hr_notes' => $notes,
            ]);

            $this->createOvertimeRecord($request);

            Log::info('Overtime request HR approved', [
                'request_id' => $request->id,
                'approved_by' => $approverId,
            ]);

            return $request->fresh();
        });
    }

    /**
     * Reject an overtime request.
     */
    public function reject(OvertimeRequest $request, int $rejectedBy, string $reason): OvertimeRequest
    {
        $request->update([
            'status' => self::STATUS_REJECTED,
            'rejected_by' => $rejectedBy,
            'rejection_reason' => $reason,
            'rejected_at' => now(),
        ]);

        Log::info('Overtime request rejected', [
            'request_id' => $request->id,
            'rejected_by' => $rejectedBy,
            'reason' => $reason,
        ]);

        return $request->fresh();
    }

    /**
     * Get pending requests for approval.
     */
    public function getPendingForManager(int $managerId): Collection
    {
        return OvertimeRequest::where('status', self::STATUS_PENDING)
            ->whereHas('employee', function ($q) use ($managerId) {
                $q->where('reporting_manager_id', $managerId);
            })
            ->with('employee')
            ->orderBy('submitted_at')
            ->get();
    }

    /**
     * Get pending HR approval queue.
     */
    public function getPendingForHR(): Collection
    {
        return OvertimeRequest::where('status', self::STATUS_MANAGER_APPROVED)
            ->with('employee')
            ->orderBy('submitted_at')
            ->get();
    }

    /**
     * Calculate overtime cost for payroll integration.
     */
    public function calculateOvertimeCost(Employee $employee, string $month): array
    {
        $records = OvertimeRecord::where('employee_id', $employee->id)
            ->whereMonth('date', Carbon::parse($month)->month)
            ->whereYear('date', Carbon::parse($month)->year)
            ->get();

        $hourlyRate = $this->getHourlyRate($employee);
        $multipliers = config('aero-hrm.overtime_multipliers', [
            'regular' => 1.5,
            'weekend' => 2.0,
            'holiday' => 2.5,
        ]);

        $totalHours = 0;
        $totalCost = 0;
        $breakdown = [];

        foreach ($records as $record) {
            $multiplier = $multipliers[$record->type] ?? 1.5;
            $cost = $record->hours * $hourlyRate * $multiplier;
            $totalHours += $record->hours;
            $totalCost += $cost;

            $type = $record->type ?? 'regular';
            $breakdown[$type] = [
                'hours' => ($breakdown[$type]['hours'] ?? 0) + $record->hours,
                'cost' => ($breakdown[$type]['cost'] ?? 0) + $cost,
                'multiplier' => $multiplier,
            ];
        }

        return [
            'employee_id' => $employee->id,
            'month' => $month,
            'total_hours' => round($totalHours, 2),
            'total_cost' => round($totalCost, 2),
            'hourly_rate' => $hourlyRate,
            'breakdown' => $breakdown,
            'records_count' => $records->count(),
        ];
    }

    /**
     * Check if employee exceeds monthly overtime limit.
     */
    public function checkOvertimeLimit(int $employeeId, float $requestedHours): array
    {
        $monthlyLimit = config('aero-hrm.overtime_monthly_limit', 40);

        $currentMonthHours = OvertimeRecord::where('employee_id', $employeeId)
            ->whereMonth('date', now()->month)
            ->whereYear('date', now()->year)
            ->sum('hours');

        $pendingHours = OvertimeRequest::where('employee_id', $employeeId)
            ->whereIn('status', [self::STATUS_PENDING, self::STATUS_MANAGER_APPROVED])
            ->whereMonth('date', now()->month)
            ->whereYear('date', now()->year)
            ->sum('hours');

        $totalProjected = $currentMonthHours + $pendingHours + $requestedHours;

        return [
            'monthly_limit' => $monthlyLimit,
            'current_hours' => $currentMonthHours,
            'pending_hours' => $pendingHours,
            'requested_hours' => $requestedHours,
            'total_projected' => $totalProjected,
            'exceeds_limit' => $totalProjected > $monthlyLimit,
            'remaining_hours' => max($monthlyLimit - $currentMonthHours - $pendingHours, 0),
        ];
    }

    private function createOvertimeRecord(OvertimeRequest $request): OvertimeRecord
    {
        return OvertimeRecord::create([
            'employee_id' => $request->employee_id,
            'overtime_request_id' => $request->id,
            'date' => $request->date,
            'start_time' => $request->start_time,
            'end_time' => $request->end_time,
            'hours' => $request->hours,
            'type' => $request->type,
            'status' => 'approved',
        ]);
    }

    private function calculateHours(string $startTime, string $endTime): float
    {
        $start = Carbon::parse($startTime);
        $end = Carbon::parse($endTime);

        return round($start->diffInMinutes($end) / 60, 2);
    }

    private function getHourlyRate(Employee $employee): float
    {
        $monthlySalary = $employee->current_salary ?? 0;
        $workingHoursPerMonth = config('aero-hrm.working_hours_per_month', 176);

        return $workingHoursPerMonth > 0 ? round($monthlySalary / $workingHoursPerMonth, 2) : 0;
    }
}
