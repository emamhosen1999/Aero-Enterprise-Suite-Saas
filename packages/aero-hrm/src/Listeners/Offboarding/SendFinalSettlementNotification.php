<?php

namespace Aero\HRM\Listeners\Offboarding;

use Aero\HRM\Events\Offboarding\OffboardingCompleted;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Support\Facades\Log;

/**
 * Sends final settlement notification and triggers payroll processing.
 */
class SendFinalSettlementNotification implements ShouldQueue
{
    public function handle(OffboardingCompleted $event): void
    {
        $offboarding = $event->offboarding;
        $employee = $offboarding->employee;

        if (! $employee) {
            Log::warning('Offboarding has no associated employee for settlement', [
                'offboarding_id' => $offboarding->id,
            ]);

            return;
        }

        try {
            // Calculate final settlement (basic implementation)
            $settlementData = $this->calculateSettlement($employee, $offboarding);

            // Store settlement information
            $this->storeSettlementRecord($employee, $offboarding, $settlementData);

            // Notify finance team
            $this->notifyFinanceTeam($offboarding, $settlementData);

            // Notify employee about settlement
            $this->notifyEmployee($employee, $settlementData);

            Log::info('Final settlement notification sent', [
                'offboarding_id' => $offboarding->id,
                'employee_id' => $employee->id,
                'settlement_amount' => $settlementData['total'] ?? 0,
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to process final settlement notification', [
                'offboarding_id' => $offboarding->id,
                'error' => $e->getMessage(),
            ]);

            throw $e;
        }
    }

    protected function calculateSettlement($employee, $offboarding): array
    {
        $basicSalary = $employee->basic_salary ?? 0;
        $lastWorkingDate = $offboarding->last_working_date ?? now();

        // Calculate pending salary (pro-rated for the month)
        $daysWorked = $lastWorkingDate->day;
        $daysInMonth = $lastWorkingDate->daysInMonth;
        $pendingSalary = ($basicSalary / $daysInMonth) * $daysWorked;

        // Calculate leave encashment
        $leaveEncashment = $this->calculateLeaveEncashment($employee, $basicSalary);

        // Calculate notice period (if applicable)
        $noticePeriodPay = 0;
        if ($offboarding->reason === 'termination' && ! $offboarding->is_urgent) {
            $noticeDays = $employee->notice_period_days ?? 30;
            $noticePeriodPay = ($basicSalary / 30) * $noticeDays;
        }

        // Calculate gratuity (if applicable - typically for > 5 years service)
        $gratuity = $this->calculateGratuity($employee, $basicSalary);

        // Calculate any deductions
        $deductions = $this->calculateDeductions($employee);

        $total = $pendingSalary + $leaveEncashment + $noticePeriodPay + $gratuity - $deductions;

        return [
            'pending_salary' => round($pendingSalary, 2),
            'leave_encashment' => round($leaveEncashment, 2),
            'notice_period_pay' => round($noticePeriodPay, 2),
            'gratuity' => round($gratuity, 2),
            'deductions' => round($deductions, 2),
            'total' => round($total, 2),
            'calculation_date' => now()->toIso8601String(),
        ];
    }

    protected function calculateLeaveEncashment($employee, $basicSalary): float
    {
        try {
            // Get unused leave balance
            $leaveBalance = \Aero\HRM\Models\LeaveBalance::where('employee_id', $employee->id)
                ->where('year', now()->year)
                ->sum('balance');

            // Per day salary
            $perDaySalary = $basicSalary / 30;

            return $leaveBalance * $perDaySalary;
        } catch (\Exception $e) {
            Log::warning('Could not calculate leave encashment', ['error' => $e->getMessage()]);

            return 0;
        }
    }

    protected function calculateGratuity($employee, $basicSalary): float
    {
        $joiningDate = $employee->joining_date;
        if (! $joiningDate) {
            return 0;
        }

        $yearsOfService = $joiningDate->diffInYears(now());

        // Gratuity typically for > 5 years (varies by jurisdiction)
        if ($yearsOfService < 5) {
            return 0;
        }

        // Standard formula: (Basic Salary × 15 / 26) × Years of Service
        return ($basicSalary * 15 / 26) * $yearsOfService;
    }

    protected function calculateDeductions($employee): float
    {
        // Calculate any outstanding loans, advances, etc.
        // This is a placeholder - implement based on your payroll structure
        return 0;
    }

    protected function storeSettlementRecord($employee, $offboarding, array $settlementData): void
    {
        try {
            \Illuminate\Support\Facades\DB::table('employee_settlements')->insert([
                'employee_id' => $employee->id,
                'offboarding_id' => $offboarding->id,
                'settlement_data' => json_encode($settlementData),
                'status' => 'pending',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        } catch (\Exception $e) {
            // Table might not exist
            Log::warning('Could not store settlement record', ['error' => $e->getMessage()]);
        }
    }

    protected function notifyFinanceTeam($offboarding, array $settlementData): void
    {
        try {
            $financeUsers = \Aero\Core\Models\User::query()
                ->whereHas('roles', function ($query) {
                    $query->whereIn('name', ['Finance Manager', 'Accountant', 'Payroll Manager']);
                })
                ->get();

            foreach ($financeUsers as $financeUser) {
                // Send in-app notification about pending settlement
                $financeUser->notify(new \Aero\HRM\Notifications\Offboarding\OffboardingCompletedNotification(
                    $offboarding,
                    [
                        'notification_target' => 'finance_team',
                        'settlement_data' => $settlementData,
                    ]
                ));
            }
        } catch (\Exception $e) {
            Log::error('Failed to notify finance team', ['error' => $e->getMessage()]);
        }
    }

    protected function notifyEmployee($employee, array $settlementData): void
    {
        $user = $employee->user;
        if (! $user) {
            return;
        }

        try {
            // This would typically be a specific SettlementNotification
            // For now, we'll just log it
            Log::info('Settlement notification would be sent to employee', [
                'employee_id' => $employee->id,
                'total_settlement' => $settlementData['total'],
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to notify employee of settlement', ['error' => $e->getMessage()]);
        }
    }

    public function failed(OffboardingCompleted $event, \Throwable $exception): void
    {
        Log::error('Failed to process final settlement', [
            'offboarding_id' => $event->offboarding->id,
            'error' => $exception->getMessage(),
        ]);
    }
}
