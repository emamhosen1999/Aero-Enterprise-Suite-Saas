<?php

namespace Aero\HRM\Services\Leave;

use Aero\HRM\Models\Employee;
use Aero\HRM\Models\LeaveAccrualRule;
use Aero\HRM\Models\LeaveAccrualTransaction;
use Aero\HRM\Models\LeaveSetting;
use Carbon\Carbon;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class LeaveAccrualService
{
    /**
     * Process accruals for all active employees for a given period.
     *
     * @return array{processed: int, skipped: int, errors: array<int, string>}
     */
    public function processAccruals(string $month, ?int $userId = null, bool $dryRun = false): array
    {
        try {
            $accrualDate = Carbon::createFromFormat('Y-m', $month)->startOfMonth();
        } catch (\Exception $e) {
            return [
                'processed' => 0,
                'skipped' => 0,
                'errors' => ['Invalid month format. Use YYYY-MM (e.g., 2025-01)'],
            ];
        }

        $processed = 0;
        $skipped = 0;
        $errors = [];

        $activeRules = LeaveAccrualRule::query()
            ->active()
            ->with('leaveType')
            ->get();

        if ($activeRules->isEmpty()) {
            return [
                'processed' => 0,
                'skipped' => 0,
                'errors' => ['No active accrual rules found.'],
            ];
        }

        $employeeQuery = Employee::query()
            ->where('status', 'active')
            ->whereNotNull('date_of_joining');

        if ($userId !== null) {
            $employeeQuery->where('user_id', $userId);
        }

        $employees = $employeeQuery->get();

        foreach ($employees as $employee) {
            foreach ($activeRules as $rule) {
                try {
                    $result = $this->processEmployeeRuleAccrual(
                        $employee,
                        $rule,
                        $accrualDate,
                        $dryRun
                    );

                    if ($result === 'processed') {
                        $processed++;
                    } else {
                        $skipped++;
                    }
                } catch (\Exception $e) {
                    $errors[] = "Employee #{$employee->user_id}, Rule #{$rule->id}: {$e->getMessage()}";
                    Log::error('Leave accrual processing error', [
                        'employee_id' => $employee->user_id,
                        'rule_id' => $rule->id,
                        'month' => $month,
                        'error' => $e->getMessage(),
                        'trace' => $e->getTraceAsString(),
                    ]);
                }
            }
        }

        Log::info('Leave accrual batch completed', [
            'month' => $month,
            'dry_run' => $dryRun,
            'processed' => $processed,
            'skipped' => $skipped,
            'error_count' => count($errors),
        ]);

        return compact('processed', 'skipped', 'errors');
    }

    /**
     * Process accrual for a single employee against a single rule.
     */
    protected function processEmployeeRuleAccrual(
        Employee $employee,
        LeaveAccrualRule $rule,
        Carbon $accrualDate,
        bool $dryRun
    ): string {
        $joiningDate = Carbon::parse($employee->date_of_joining);

        // Skip if employee joined after the accrual period
        if ($joiningDate->isAfter($accrualDate->copy()->endOfMonth())) {
            return 'skipped';
        }

        // Check minimum service months eligibility
        $serviceMonths = $joiningDate->diffInMonths($accrualDate);
        if ($serviceMonths < $rule->min_service_months) {
            return 'skipped';
        }

        // Check if already accrued for this period
        $alreadyAccrued = LeaveAccrualTransaction::query()
            ->where('user_id', $employee->user_id)
            ->where('leave_type_id', $rule->leave_type_id)
            ->where('accrual_rule_id', $rule->id)
            ->where('transaction_type', 'accrual')
            ->whereYear('period_month', $accrualDate->year)
            ->whereMonth('period_month', $accrualDate->month)
            ->exists();

        if ($alreadyAccrued) {
            return 'skipped';
        }

        $accrualDays = $this->calculateAccrualDays($rule, $employee, $accrualDate);

        if ($accrualDays <= 0) {
            return 'skipped';
        }

        $balanceBefore = $this->getCurrentBalance($employee->user_id, $rule->leave_type_id);
        $balanceAfter = $balanceBefore + $accrualDays;

        // Apply max balance cap
        if ($rule->max_balance !== null && $balanceAfter > (float) $rule->max_balance) {
            $balanceAfter = (float) $rule->max_balance;
            $accrualDays = $balanceAfter - $balanceBefore;
        }

        if ($accrualDays <= 0) {
            return 'skipped';
        }

        if (! $dryRun) {
            LeaveAccrualTransaction::query()->create([
                'user_id' => $employee->user_id,
                'leave_type_id' => $rule->leave_type_id,
                'accrual_rule_id' => $rule->id,
                'transaction_type' => 'accrual',
                'days' => $accrualDays,
                'balance_before' => $balanceBefore,
                'balance_after' => $balanceAfter,
                'period_month' => $accrualDate->format('Y-m-d'),
                'notes' => "Auto-accrual: {$rule->name} for {$accrualDate->format('F Y')}",
                'created_by' => null,
            ]);
        }

        return 'processed';
    }

    /**
     * Calculate the accrual days for a rule, employee, and period.
     */
    protected function calculateAccrualDays(LeaveAccrualRule $rule, Employee $employee, Carbon $accrualDate): float
    {
        $rate = (float) $rule->accrual_rate;

        // Pro-rate for joining month
        $joiningDate = Carbon::parse($employee->date_of_joining);
        $isJoiningMonth = $joiningDate->year === $accrualDate->year
            && $joiningDate->month === $accrualDate->month;

        if ($isJoiningMonth) {
            $daysInMonth = $accrualDate->daysInMonth;
            $daysWorked = $daysInMonth - $joiningDate->day + 1;
            $rate = round(($rate / $daysInMonth) * $daysWorked, 2);
        }

        return max(0, $rate);
    }

    /**
     * Get the current accrual balance for a user and leave type.
     */
    protected function getCurrentBalance(int $userId, int $leaveTypeId): float
    {
        $lastTransaction = LeaveAccrualTransaction::query()
            ->where('user_id', $userId)
            ->where('leave_type_id', $leaveTypeId)
            ->latest('created_at')
            ->first();

        return $lastTransaction ? (float) $lastTransaction->balance_after : 0.0;
    }

    /**
     * Manual adjustment: add or remove days from an employee's leave balance.
     */
    public function manualAdjustment(
        int $userId,
        int $leaveTypeId,
        float $days,
        string $notes,
        int $createdBy
    ): LeaveAccrualTransaction {
        $balanceBefore = $this->getCurrentBalance($userId, $leaveTypeId);
        $balanceAfter = max(0, $balanceBefore + $days);

        return LeaveAccrualTransaction::query()->create([
            'user_id' => $userId,
            'leave_type_id' => $leaveTypeId,
            'accrual_rule_id' => null,
            'transaction_type' => 'adjustment',
            'days' => $days,
            'balance_before' => $balanceBefore,
            'balance_after' => $balanceAfter,
            'period_month' => now()->startOfMonth()->format('Y-m-d'),
            'notes' => $notes,
            'created_by' => $createdBy,
        ]);
    }

    /**
     * Get paginated accrual transaction history.
     *
     * @param  array<string, mixed>  $filters
     */
    public function getHistory(int $userId, array $filters = []): LengthAwarePaginator
    {
        $query = LeaveAccrualTransaction::query()
            ->with(['leaveType', 'accrualRule', 'creator'])
            ->where('user_id', $userId);

        if (! empty($filters['leave_type_id'])) {
            $query->where('leave_type_id', $filters['leave_type_id']);
        }

        if (! empty($filters['from_date'])) {
            $query->whereDate('period_month', '>=', $filters['from_date']);
        }

        if (! empty($filters['to_date'])) {
            $query->whereDate('period_month', '<=', $filters['to_date']);
        }

        $perPage = isset($filters['per_page']) ? (int) $filters['per_page'] : 15;

        return $query->latest('created_at')->paginate($perPage);
    }

    /**
     * Get accrual statistics for the current month.
     *
     * @return array{total_rules: int, active_rules: int, employees_processed_this_month: int, total_days_accrued_this_month: float}
     */
    public function getStats(): array
    {
        $now = now();

        $totalRules = LeaveAccrualRule::query()->count();
        $activeRules = LeaveAccrualRule::query()->active()->count();

        $employeesProcessedThisMonth = LeaveAccrualTransaction::query()
            ->where('transaction_type', 'accrual')
            ->whereYear('period_month', $now->year)
            ->whereMonth('period_month', $now->month)
            ->distinct('user_id')
            ->count('user_id');

        $totalDaysAccruedThisMonth = LeaveAccrualTransaction::query()
            ->where('transaction_type', 'accrual')
            ->whereYear('period_month', $now->year)
            ->whereMonth('period_month', $now->month)
            ->sum('days');

        return [
            'total_rules' => $totalRules,
            'active_rules' => $activeRules,
            'employees_processed_this_month' => $employeesProcessedThisMonth,
            'total_days_accrued_this_month' => (float) $totalDaysAccruedThisMonth,
        ];
    }
}
