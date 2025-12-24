<?php

namespace Aero\HRM\Services;

use Aero\HRM\Models\Leave;
use Aero\HRM\Models\LeaveBalance;
use Aero\HRM\Models\LeaveSetting;
use Aero\Core\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class LeaveBalanceService
{
    /**
     * Initialize leave balances for a user for a specific year
     */
    public function initializeBalancesForUser(User $user, ?int $year = null): void
    {
        $year = $year ?? now()->year;

        // Get all active leave types
        $leaveTypes = LeaveSetting::where('is_active', true)->get();

        foreach ($leaveTypes as $leaveType) {
            LeaveBalance::firstOrCreate(
                [
                    'user_id' => $user->id,
                    'leave_setting_id' => $leaveType->id,
                    'year' => $year,
                ],
                [
                    'allocated' => $leaveType->annual_quota ?? 0,
                    'used' => 0,
                    'pending' => 0,
                    'carried_forward' => 0,
                    'encashed' => 0,
                    'available' => $leaveType->annual_quota ?? 0,
                ]
            );
        }

        Log::info("Leave balances initialized for user {$user->id} for year {$year}");
    }

    /**
     * Initialize balances for all active users
     */
    public function initializeBalancesForAllUsers(?int $year = null): void
    {
        $year = $year ?? now()->year;

        $users = User::where('is_active', true)->get();

        foreach ($users as $user) {
            $this->initializeBalancesForUser($user, $year);
        }

        Log::info("Leave balances initialized for all users for year {$year}");
    }

    /**
     * Get leave balance for a user and leave type
     */
    public function getBalance(User $user, int $leaveSettingId, ?int $year = null): ?LeaveBalance
    {
        $year = $year ?? now()->year;

        return LeaveBalance::where('user_id', $user->id)
            ->where('leave_setting_id', $leaveSettingId)
            ->where('year', $year)
            ->first();
    }

    /**
     * Get all balances for a user
     */
    public function getAllBalances(User $user, ?int $year = null): \Illuminate\Database\Eloquent\Collection
    {
        $year = $year ?? now()->year;

        return LeaveBalance::with('leaveSetting')
            ->where('user_id', $user->id)
            ->where('year', $year)
            ->get();
    }

    /**
     * Update balance when leave is requested
     */
    public function handleLeaveRequest(Leave $leave): void
    {
        $leaveDays = $leave->number_of_days ?? $this->calculateLeaveDays($leave);

        $balance = $this->getBalance(
            $leave->employee,
            $leave->leave_setting_id,
            Carbon::parse($leave->from_date)->year
        );

        if ($balance) {
            $balance->addPending($leaveDays);
        } else {
            Log::warning("Leave balance not found for user {$leave->user_id}, leave setting {$leave->leave_setting_id}");
        }
    }

    /**
     * Update balance when leave is approved
     */
    public function handleLeaveApproval(Leave $leave): void
    {
        $leaveDays = $leave->number_of_days ?? $this->calculateLeaveDays($leave);

        $balance = $this->getBalance(
            $leave->employee,
            $leave->leave_setting_id,
            Carbon::parse($leave->from_date)->year
        );

        if ($balance) {
            $balance->approvePending($leaveDays);
        }
    }

    /**
     * Update balance when leave is rejected
     */
    public function handleLeaveRejection(Leave $leave): void
    {
        $leaveDays = $leave->number_of_days ?? $this->calculateLeaveDays($leave);

        $balance = $this->getBalance(
            $leave->employee,
            $leave->leave_setting_id,
            Carbon::parse($leave->from_date)->year
        );

        if ($balance) {
            $balance->removePending($leaveDays);
        }
    }

    /**
     * Update balance when leave is cancelled
     */
    public function handleLeaveCancellation(Leave $leave): void
    {
        $leaveDays = $leave->number_of_days ?? $this->calculateLeaveDays($leave);

        $balance = $this->getBalance(
            $leave->employee,
            $leave->leave_setting_id,
            Carbon::parse($leave->from_date)->year
        );

        if ($balance && $leave->status === 'Approved') {
            // If leave was approved, refund the used days
            $balance->used -= $leaveDays;
            $balance->available = $balance->calculateAvailable();
            $balance->save();
        } elseif ($balance && $leave->status === 'Pending') {
            // If leave was pending, remove from pending
            $balance->removePending($leaveDays);
        }
    }

    /**
     * Check if user has sufficient balance
     */
    public function hasSufficientBalance(User $user, int $leaveSettingId, float $days, ?int $year = null): bool
    {
        $balance = $this->getBalance($user, $leaveSettingId, $year);

        if (! $balance) {
            return false;
        }

        return $balance->hasSufficientBalance($days);
    }

    /**
     * Process carry forward for year-end
     */
    public function processCarryForward(int $fromYear, int $toYear): void
    {
        DB::transaction(function () use ($fromYear, $toYear) {
            $leaveTypes = LeaveSetting::where('is_active', true)
                ->where('carry_forward_allowed', true)
                ->get();

            foreach ($leaveTypes as $leaveType) {
                $oldBalances = LeaveBalance::where('year', $fromYear)
                    ->where('leave_setting_id', $leaveType->id)
                    ->get();

                foreach ($oldBalances as $oldBalance) {
                    $availableToCarry = $oldBalance->available;

                    // Apply max carry forward limit if configured
                    if ($leaveType->max_carry_forward_days > 0) {
                        $availableToCarry = min($availableToCarry, $leaveType->max_carry_forward_days);
                    }

                    // Create or update next year's balance
                    $newBalance = LeaveBalance::firstOrCreate(
                        [
                            'user_id' => $oldBalance->user_id,
                            'leave_setting_id' => $leaveType->id,
                            'year' => $toYear,
                        ],
                        [
                            'allocated' => $leaveType->annual_quota ?? 0,
                            'used' => 0,
                            'pending' => 0,
                            'encashed' => 0,
                        ]
                    );

                    $newBalance->carried_forward = $availableToCarry;
                    $newBalance->available = $newBalance->calculateAvailable();
                    $newBalance->save();
                }
            }
        });

        Log::info("Carry forward processed from {$fromYear} to {$toYear}");
    }

    /**
     * Process monthly accrual
     */
    public function processMonthlyAccrual(): void
    {
        $year = now()->year;
        $month = now()->month;

        $leaveTypes = LeaveSetting::where('is_active', true)
            ->where('accrual_type', 'monthly')
            ->get();

        foreach ($leaveTypes as $leaveType) {
            $monthlyAccrual = ($leaveType->annual_quota ?? 0) / 12;

            $balances = LeaveBalance::where('year', $year)
                ->where('leave_setting_id', $leaveType->id)
                ->get();

            foreach ($balances as $balance) {
                $balance->allocated += $monthlyAccrual;
                $balance->available = $balance->calculateAvailable();
                $balance->save();
            }
        }

        Log::info("Monthly accrual processed for month {$month}, year {$year}");
    }

    /**
     * Calculate number of leave days between dates
     */
    private function calculateLeaveDays(Leave $leave): float
    {
        $fromDate = Carbon::parse($leave->from_date);
        $toDate = Carbon::parse($leave->to_date);

        // Basic calculation - can be enhanced to exclude weekends/holidays
        $days = $fromDate->diffInDays($toDate) + 1;

        // Handle half-day leaves
        if ($leave->is_half_day) {
            $days = 0.5;
        }

        return $days;
    }

    /**
     * Generate balance summary for reporting
     */
    public function getBalanceSummary(?int $year = null): array
    {
        $year = $year ?? now()->year;

        $summary = LeaveBalance::with(['user', 'leaveSetting'])
            ->where('year', $year)
            ->get()
            ->groupBy('leave_setting_id')
            ->map(function ($balances, $leaveSettingId) {
                return [
                    'leave_type' => $balances->first()->leaveSetting->name,
                    'total_allocated' => $balances->sum('allocated'),
                    'total_used' => $balances->sum('used'),
                    'total_pending' => $balances->sum('pending'),
                    'total_available' => $balances->sum('available'),
                    'total_employees' => $balances->count(),
                ];
            })
            ->values()
            ->toArray();

        return $summary;
    }
}
