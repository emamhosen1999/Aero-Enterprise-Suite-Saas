<?php

namespace Aero\HRM\Services;

use Aero\HRM\Models\Leave;
use Aero\HRM\Models\LeaveSetting;
use Aero\Core\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class BulkLeaveService
{
    public function __construct(
        private LeaveValidationService $validationService,
        private LeaveOverlapService $overlapService,
        private LeaveCrudService $crudService
    ) {}

    /**
     * Validate multiple dates for bulk leave creation
     */
    public function validateDates(array $payload): array
    {
        $results = [];
        $dates = $payload['dates'] ?? [];
        $userId = $payload['user_id'];
        $leaveTypeId = $payload['leave_type_id'];

        // Get leave type info for balance calculation
        $leaveSetting = LeaveSetting::find($leaveTypeId);
        $user = User::find($userId);

        foreach ($dates as $date) {
            $dateResult = [
                'date' => $date,
                'status' => 'valid',
                'errors' => [],
                'warnings' => [],
            ];

            try {
                $carbonDate = Carbon::parse($date);

                // Check for overlapping leaves
                $overlapError = $this->overlapService->getOverlapErrorMessage(
                    $userId,
                    $carbonDate,
                    $carbonDate
                );

                if ($overlapError) {
                    $dateResult['status'] = 'conflict';
                    $dateResult['errors'][] = $overlapError;
                }

                // Check if it's a weekend
                if ($carbonDate->isWeekend()) {
                    $dateResult['warnings'][] = 'Weekend date - may require special approval';
                }

                // Check if it's too far in the future (more than 1 year)
                if ($carbonDate->isAfter(now()->addYear())) {
                    $dateResult['status'] = 'conflict';
                    $dateResult['errors'][] = 'Cannot apply leave more than one year in advance';
                }

            } catch (\Exception $e) {
                $dateResult['status'] = 'conflict';
                $dateResult['errors'][] = 'Invalid date format';
            }

            $results[] = $dateResult;
        }

        // Calculate estimated balance impact
        $validDatesCount = collect($results)->where('status', '!=', 'conflict')->count();
        $estimatedBalanceImpact = $this->calculateBalanceImpact($userId, $leaveTypeId, $validDatesCount);

        return [
            'validation_results' => $results,
            'estimated_balance_impact' => $estimatedBalanceImpact,
        ];
    }

    /**
     * Process bulk leave creation
     */
    public function processBulkLeave(array $payload): array
    {
        $allowPartialSuccess = $payload['allow_partial_success'] ?? false;
        $dates = $payload['dates'] ?? [];
        $userId = $payload['user_id'];
        $leaveTypeId = $payload['leave_type_id'];
        $reason = $payload['reason'];

        $createdLeaves = [];
        $failedDates = [];
        $totalRequested = count($dates);

        return DB::transaction(function () use ($dates, $userId, $leaveTypeId, $reason, $allowPartialSuccess, &$createdLeaves, &$failedDates, $totalRequested) {
            foreach ($dates as $date) {
                try {
                    $carbonDate = Carbon::parse($date);

                    // Validate individual date
                    $validation = $this->validateSingleDate($userId, $carbonDate, $leaveTypeId);

                    if (! empty($validation['errors'])) {
                        $failedDates[] = [
                            'date' => $date,
                            'errors' => $validation['errors'],
                        ];

                        if (! $allowPartialSuccess) {
                            throw new \Exception('Validation failed for date: '.$date);
                        }

                        continue;
                    }

                    // Create leave record
                    $leaveData = [
                        'user_id' => $userId,
                        'leaveType' => LeaveSetting::find($leaveTypeId)->type,
                        'fromDate' => $date,
                        'toDate' => $date,
                        'daysCount' => 1,
                        'leaveReason' => $reason,
                    ];

                    $leave = $this->crudService->createLeave($leaveData);
                    $createdLeaves[] = $leave;

                } catch (\Exception $e) {
                    $failedDates[] = [
                        'date' => $date,
                        'errors' => [$e->getMessage()],
                    ];

                    if (! $allowPartialSuccess) {
                        throw $e;
                    }
                }
            }

            $successful = count($createdLeaves);
            $failed = count($failedDates);

            // Log the bulk operation
            Log::info('Bulk leave operation completed', [
                'user_id' => $userId,
                'total_requested' => $totalRequested,
                'successful' => $successful,
                'failed' => $failed,
                'partial_success_mode' => $allowPartialSuccess,
            ]);

            return [
                'success' => $successful > 0,
                'message' => $this->generateSuccessMessage($successful, $failed, $totalRequested),
                'created_leaves' => $createdLeaves,
                'failed_dates' => $failedDates,
                'summary' => [
                    'total_requested' => $totalRequested,
                    'successful' => $successful,
                    'failed' => $failed,
                ],
            ];
        });
    }

    /**
     * Validate a single date for leave creation
     */
    private function validateSingleDate(int $userId, Carbon $date, int $leaveTypeId): array
    {
        $errors = [];

        // Check for overlapping leaves
        $overlapError = $this->overlapService->getOverlapErrorMessage($userId, $date, $date);
        if ($overlapError) {
            $errors[] = $overlapError;
        }

        // Check if it's too far in the future
        if ($date->isAfter(now()->addYear())) {
            $errors[] = 'Cannot apply leave more than one year in advance';
        }

        return ['errors' => $errors];
    }

    /**
     * Calculate balance impact for the leave type
     */
    private function calculateBalanceImpact(int $userId, int $leaveTypeId, int $requestedDays): array
    {
        $leaveSetting = LeaveSetting::find($leaveTypeId);

        if (! $leaveSetting) {
            return [
                'leave_type' => 'Unknown',
                'current_balance' => 0,
                'requested_days' => $requestedDays,
                'remaining_balance' => 0,
            ];
        }

        // Get current year's used leave days for this type - using the same query pattern as single leave form
        $usedDays = Leave::where('user_id', $userId)
            ->where('leave_type', $leaveTypeId)
            ->whereYear('from_date', now()->year)
            ->whereIn('status', ['Approved', 'Pending'])
            ->sum('no_of_days');

        $totalAllowedDays = (float) $leaveSetting->days;
        $currentBalance = max(0, $totalAllowedDays - $usedDays);
        $remainingBalance = max(0, $currentBalance - $requestedDays);

        return [
            'leave_type' => $leaveSetting->type,
            'current_balance' => $currentBalance,
            'requested_days' => $requestedDays,
            'remaining_balance' => $remainingBalance,
            'total_allowed' => $totalAllowedDays,
            'used_days' => $usedDays,
        ];
    }

    /**
     * Generate appropriate success message
     */
    private function generateSuccessMessage(int $successful, int $failed, int $total): string
    {
        if ($failed === 0) {
            return "All {$successful} leave requests created successfully";
        } elseif ($successful === 0) {
            return 'Failed to create any leave requests';
        } else {
            return "{$successful} leave requests created successfully, {$failed} failed";
        }
    }
}
