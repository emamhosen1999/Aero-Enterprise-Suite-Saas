<?php

namespace Aero\HRM\Services;

use Carbon\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * Compensatory Leave Service
 *
 * Manages compensatory leave (comp-off) for employees who work overtime,
 * holidays, or weekends. Tracks accrual, expiry, and usage.
 */
class CompensatoryLeaveService
{
    /**
     * Comp-off types.
     */
    public const TYPE_OVERTIME = 'overtime';
    public const TYPE_HOLIDAY_WORK = 'holiday_work';
    public const TYPE_WEEKEND_WORK = 'weekend_work';
    public const TYPE_ON_CALL = 'on_call';
    public const TYPE_EMERGENCY = 'emergency';

    /**
     * Comp-off statuses.
     */
    public const STATUS_PENDING = 'pending';
    public const STATUS_APPROVED = 'approved';
    public const STATUS_REJECTED = 'rejected';
    public const STATUS_EXPIRED = 'expired';
    public const STATUS_UTILIZED = 'utilized';
    public const STATUS_CANCELLED = 'cancelled';

    /**
     * Default expiry period in days.
     */
    protected int $defaultExpiryDays = 90;

    /**
     * Minimum hours for comp-off eligibility.
     */
    protected float $minimumHours = 4.0;

    /**
     * Grant compensatory leave for extra work.
     */
    public function grantCompOff(array $data): array
    {
        $employeeId = $data['employee_id'];
        $workDate = Carbon::parse($data['work_date']);
        $hoursWorked = $data['hours_worked'];
        $type = $data['type'] ?? self::TYPE_OVERTIME;
        $reason = $data['reason'] ?? '';

        // Validate eligibility
        $eligibility = $this->checkEligibility($employeeId, $workDate, $hoursWorked, $type);
        if (!$eligibility['eligible']) {
            return [
                'success' => false,
                'error' => $eligibility['reason'],
            ];
        }

        // Calculate comp-off entitlement
        $entitlement = $this->calculateEntitlement($hoursWorked, $type, $workDate);

        // Calculate expiry date
        $expiryDays = $data['expiry_days'] ?? $this->getExpiryDaysForType($type);
        $expiryDate = now()->addDays($expiryDays);

        $compOff = [
            'employee_id' => $employeeId,
            'work_date' => $workDate->toDateString(),
            'hours_worked' => $hoursWorked,
            'type' => $type,
            'days_earned' => $entitlement['days'],
            'hours_earned' => $entitlement['hours'],
            'reason' => $reason,
            'status' => self::STATUS_PENDING,
            'expiry_date' => $expiryDate->toDateString(),
            'approved_by' => null,
            'approved_at' => null,
            'created_at' => now(),
            'metadata' => json_encode([
                'calculation' => $entitlement['calculation'],
                'multiplier' => $entitlement['multiplier'],
                'source_type' => $type,
            ]),
        ];

        Log::info('Comp-off granted', [
            'employee_id' => $employeeId,
            'type' => $type,
            'days_earned' => $entitlement['days'],
        ]);

        return [
            'success' => true,
            'data' => $compOff,
            'entitlement' => $entitlement,
            'message' => "Comp-off request created for {$entitlement['days']} day(s)",
        ];
    }

    /**
     * Approve or reject comp-off request.
     */
    public function processRequest(int $compOffId, string $action, int $approverId, ?string $remarks = null): array
    {
        if (!in_array($action, ['approve', 'reject'])) {
            return ['success' => false, 'error' => 'Invalid action'];
        }

        $status = $action === 'approve' ? self::STATUS_APPROVED : self::STATUS_REJECTED;

        $update = [
            'status' => $status,
            'approved_by' => $approverId,
            'approved_at' => now(),
            'remarks' => $remarks,
        ];

        Log::info("Comp-off {$action}d", [
            'comp_off_id' => $compOffId,
            'approver_id' => $approverId,
        ]);

        return [
            'success' => true,
            'status' => $status,
            'update' => $update,
        ];
    }

    /**
     * Utilize comp-off (redeem as leave).
     */
    public function utilizeCompOff(int $employeeId, float $daysToUtilize, Carbon $leaveDate, ?array $compOffIds = null): array
    {
        // Get available comp-offs
        $available = $this->getAvailableBalance($employeeId);

        if ($available['total_days'] < $daysToUtilize) {
            return [
                'success' => false,
                'error' => "Insufficient comp-off balance. Available: {$available['total_days']} days",
            ];
        }

        // Use FIFO (First In, First Out) - oldest comp-offs first
        $utilization = [];
        $remainingDays = $daysToUtilize;

        foreach ($available['comp_offs'] as $compOff) {
            if ($remainingDays <= 0) {
                break;
            }

            $toUse = min($compOff['remaining_days'], $remainingDays);
            $utilization[] = [
                'comp_off_id' => $compOff['id'],
                'days_used' => $toUse,
                'remaining_after' => $compOff['remaining_days'] - $toUse,
            ];
            $remainingDays -= $toUse;
        }

        Log::info('Comp-off utilized', [
            'employee_id' => $employeeId,
            'days_utilized' => $daysToUtilize,
            'leave_date' => $leaveDate->toDateString(),
        ]);

        return [
            'success' => true,
            'utilization' => $utilization,
            'days_utilized' => $daysToUtilize,
            'leave_date' => $leaveDate->toDateString(),
            'remaining_balance' => $available['total_days'] - $daysToUtilize,
        ];
    }

    /**
     * Get available comp-off balance.
     */
    public function getAvailableBalance(int $employeeId): array
    {
        // In production, this would query the database
        // Simulating available comp-offs for the service contract
        $compOffs = $this->fetchEmployeeCompOffs($employeeId);

        $totalDays = 0;
        $totalHours = 0;
        $expiringSoon = [];

        foreach ($compOffs as $compOff) {
            if ($compOff['status'] === self::STATUS_APPROVED) {
                $remaining = $compOff['days_earned'] - ($compOff['days_used'] ?? 0);
                if ($remaining > 0) {
                    $totalDays += $remaining;
                    $totalHours += $remaining * 8;

                    // Check if expiring within 14 days
                    $expiryDate = Carbon::parse($compOff['expiry_date']);
                    if ($expiryDate->diffInDays(now()) <= 14) {
                        $expiringSoon[] = [
                            'id' => $compOff['id'],
                            'days' => $remaining,
                            'expiry_date' => $expiryDate->toDateString(),
                        ];
                    }
                }
            }
        }

        return [
            'employee_id' => $employeeId,
            'total_days' => $totalDays,
            'total_hours' => $totalHours,
            'comp_offs' => $compOffs,
            'expiring_soon' => $expiringSoon,
            'has_expiring' => count($expiringSoon) > 0,
        ];
    }

    /**
     * Get comp-off history for an employee.
     */
    public function getHistory(int $employeeId, array $filters = []): array
    {
        $compOffs = $this->fetchEmployeeCompOffs($employeeId);

        // Apply filters
        if (!empty($filters['status'])) {
            $compOffs = array_filter($compOffs, fn($c) => $c['status'] === $filters['status']);
        }

        if (!empty($filters['type'])) {
            $compOffs = array_filter($compOffs, fn($c) => $c['type'] === $filters['type']);
        }

        if (!empty($filters['from_date'])) {
            $fromDate = Carbon::parse($filters['from_date']);
            $compOffs = array_filter($compOffs, fn($c) => Carbon::parse($c['work_date'])->gte($fromDate));
        }

        if (!empty($filters['to_date'])) {
            $toDate = Carbon::parse($filters['to_date']);
            $compOffs = array_filter($compOffs, fn($c) => Carbon::parse($c['work_date'])->lte($toDate));
        }

        return [
            'employee_id' => $employeeId,
            'records' => array_values($compOffs),
            'total' => count($compOffs),
            'summary' => $this->calculateSummary($compOffs),
        ];
    }

    /**
     * Process expired comp-offs.
     */
    public function processExpiredCompOffs(): array
    {
        // This would typically run as a scheduled command
        $expired = [];
        $notified = [];

        Log::info('Processing expired comp-offs');

        // In production, query for comp-offs past expiry date
        // For now, return the structure

        return [
            'expired_count' => count($expired),
            'notified_count' => count($notified),
            'processed_at' => now()->toIso8601String(),
        ];
    }

    /**
     * Send expiry reminders.
     */
    public function sendExpiryReminders(int $daysBeforeExpiry = 7): array
    {
        $reminders = [];

        // Query for comp-offs expiring within the specified days
        // Send notifications to employees

        Log::info('Sending comp-off expiry reminders', [
            'days_before' => $daysBeforeExpiry,
        ]);

        return [
            'reminders_sent' => count($reminders),
            'days_threshold' => $daysBeforeExpiry,
        ];
    }

    /**
     * Get department comp-off summary.
     */
    public function getDepartmentSummary(int $departmentId, ?Carbon $fromDate = null, ?Carbon $toDate = null): array
    {
        $fromDate = $fromDate ?? now()->startOfMonth();
        $toDate = $toDate ?? now()->endOfMonth();

        // In production, aggregate from database
        return [
            'department_id' => $departmentId,
            'period' => [
                'from' => $fromDate->toDateString(),
                'to' => $toDate->toDateString(),
            ],
            'statistics' => [
                'total_granted' => 0,
                'total_approved' => 0,
                'total_utilized' => 0,
                'total_expired' => 0,
                'pending_requests' => 0,
            ],
            'by_type' => [
                self::TYPE_OVERTIME => ['granted' => 0, 'utilized' => 0],
                self::TYPE_HOLIDAY_WORK => ['granted' => 0, 'utilized' => 0],
                self::TYPE_WEEKEND_WORK => ['granted' => 0, 'utilized' => 0],
            ],
        ];
    }

    /**
     * Generate comp-off policy configuration.
     */
    public function getPolicyConfiguration(): array
    {
        return [
            'minimum_hours' => $this->minimumHours,
            'default_expiry_days' => $this->defaultExpiryDays,
            'types' => [
                self::TYPE_OVERTIME => [
                    'label' => 'Overtime Work',
                    'multiplier' => 1.0,
                    'expiry_days' => 90,
                    'requires_approval' => true,
                ],
                self::TYPE_HOLIDAY_WORK => [
                    'label' => 'Holiday Work',
                    'multiplier' => 1.5,
                    'expiry_days' => 60,
                    'requires_approval' => true,
                ],
                self::TYPE_WEEKEND_WORK => [
                    'label' => 'Weekend Work',
                    'multiplier' => 1.25,
                    'expiry_days' => 60,
                    'requires_approval' => true,
                ],
                self::TYPE_ON_CALL => [
                    'label' => 'On-Call Duty',
                    'multiplier' => 0.5,
                    'expiry_days' => 30,
                    'requires_approval' => true,
                ],
                self::TYPE_EMERGENCY => [
                    'label' => 'Emergency Work',
                    'multiplier' => 2.0,
                    'expiry_days' => 120,
                    'requires_approval' => true,
                ],
            ],
            'utilization_rules' => [
                'min_days_advance_notice' => 1,
                'max_consecutive_days' => 5,
                'can_combine_with_regular_leave' => true,
                'fifo_utilization' => true,
            ],
        ];
    }

    /**
     * Check if employee is eligible for comp-off.
     */
    protected function checkEligibility(int $employeeId, Carbon $workDate, float $hoursWorked, string $type): array
    {
        $issues = [];

        // Check minimum hours
        if ($hoursWorked < $this->minimumHours) {
            $issues[] = "Minimum {$this->minimumHours} hours required for comp-off";
        }

        // Check if work date is in the future
        if ($workDate->isFuture()) {
            $issues[] = 'Work date cannot be in the future';
        }

        // Check if too old (e.g., more than 30 days ago)
        if ($workDate->diffInDays(now()) > 30) {
            $issues[] = 'Comp-off request must be submitted within 30 days of work date';
        }

        // Check for duplicate requests
        // In production, query database for existing comp-off on same date

        return [
            'eligible' => empty($issues),
            'reason' => empty($issues) ? null : implode('; ', $issues),
            'issues' => $issues,
        ];
    }

    /**
     * Calculate comp-off entitlement based on hours and type.
     */
    protected function calculateEntitlement(float $hoursWorked, string $type, Carbon $workDate): array
    {
        $config = $this->getPolicyConfiguration()['types'][$type] ?? [
            'multiplier' => 1.0,
        ];

        $multiplier = $config['multiplier'];

        // Check if it's a public holiday for bonus
        $isHoliday = $this->isPublicHoliday($workDate);
        if ($isHoliday && $type !== self::TYPE_HOLIDAY_WORK) {
            $multiplier += 0.5;
        }

        $effectiveHours = $hoursWorked * $multiplier;
        $days = $effectiveHours / 8; // 8-hour workday

        return [
            'hours' => round($effectiveHours, 2),
            'days' => round($days, 2),
            'multiplier' => $multiplier,
            'calculation' => [
                'base_hours' => $hoursWorked,
                'multiplier' => $multiplier,
                'effective_hours' => $effectiveHours,
                'is_holiday_bonus' => $isHoliday,
            ],
        ];
    }

    /**
     * Get expiry days for comp-off type.
     */
    protected function getExpiryDaysForType(string $type): int
    {
        $config = $this->getPolicyConfiguration()['types'][$type] ?? [];
        return $config['expiry_days'] ?? $this->defaultExpiryDays;
    }

    /**
     * Check if date is a public holiday.
     */
    protected function isPublicHoliday(Carbon $date): bool
    {
        // In production, query Holiday model
        return false;
    }

    /**
     * Fetch employee comp-offs (placeholder for database query).
     */
    protected function fetchEmployeeCompOffs(int $employeeId): array
    {
        // In production, this queries the database
        // Return empty array as placeholder
        return [];
    }

    /**
     * Calculate summary statistics for comp-offs.
     */
    protected function calculateSummary(array $compOffs): array
    {
        $summary = [
            'total_earned' => 0,
            'total_utilized' => 0,
            'total_expired' => 0,
            'pending_approval' => 0,
            'by_type' => [],
        ];

        foreach ($compOffs as $compOff) {
            $summary['total_earned'] += $compOff['days_earned'] ?? 0;
            $summary['total_utilized'] += $compOff['days_used'] ?? 0;

            if ($compOff['status'] === self::STATUS_EXPIRED) {
                $summary['total_expired'] += $compOff['days_earned'] - ($compOff['days_used'] ?? 0);
            }

            if ($compOff['status'] === self::STATUS_PENDING) {
                $summary['pending_approval']++;
            }

            $type = $compOff['type'];
            if (!isset($summary['by_type'][$type])) {
                $summary['by_type'][$type] = ['earned' => 0, 'utilized' => 0];
            }
            $summary['by_type'][$type]['earned'] += $compOff['days_earned'] ?? 0;
            $summary['by_type'][$type]['utilized'] += $compOff['days_used'] ?? 0;
        }

        return $summary;
    }
}
