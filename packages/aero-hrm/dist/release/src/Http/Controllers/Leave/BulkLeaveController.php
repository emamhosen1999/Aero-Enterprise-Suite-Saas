<?php

namespace Aero\HRM\Http\Controllers\Leave;

use Aero\HRM\Http\Requests\BulkLeaveRequest;
use Aero\HRM\Http\Resources\LeaveResource;
use Aero\HRM\Models\Department;
use Aero\HRM\Http\Controllers\Controller;
use Aero\HRM\Services\BulkLeaveService;
use Aero\HRM\Services\LeaveQueryService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class BulkLeaveController extends Controller
{
    public function __construct(
        private BulkLeaveService $bulkLeaveService,
        private LeaveQueryService $queryService
    ) {}

    /**
     * Validate bulk leave dates before submission
     */
    public function validateDates(BulkLeaveRequest $request): JsonResponse
    {
        try {
            $results = $this->bulkLeaveService->validateDates($request->validated());

            return response()->json([
                'success' => true,
                'validation_results' => $results['validation_results'],
                'estimated_balance_impact' => $results['estimated_balance_impact'],
            ]);
        } catch (\Throwable $e) {
            report($e);

            return response()->json([
                'success' => false,
                'error' => 'An error occurred during validation.',
                'details' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }

    /**
     * Create bulk leave records
     */
    public function store(BulkLeaveRequest $request): JsonResponse
    {
        try {
            $result = $this->bulkLeaveService->processBulkLeave($request->validated());

            // Follow exact same response structure as single leave form but optimized for bulk
            if ($result['success'] && count($result['created_leaves']) > 0) {
                // Create bulk success message similar to single leave
                $totalCreated = count($result['created_leaves']);
                $totalFailed = count($result['failed_dates'] ?? []);

                if ($totalFailed > 0) {
                    $message = "{$totalCreated} leave requests created successfully, {$totalFailed} failed";
                } else {
                    $message = "All {$totalCreated} leave requests created successfully";
                }

                // Get only updated leave statistics without full pagination data
                $userId = $request->input('user_id');
                $year = now()->year;

                // Get updated leave types and counts
                $leaveTypes = \Aero\HRM\Models\LeaveSetting::all();
                $leaveCounts = \Aero\HRM\Models\Leave::where('user_id', $userId)
                    ->whereYear('from_date', $year)
                    ->whereIn('status', ['Approved', 'Pending'])
                    ->selectRaw('leave_type, SUM(no_of_days) as days_used')
                    ->groupBy('leave_type')
                    ->get()
                    ->map(function ($leave) use ($leaveTypes) {
                        $leaveType = $leaveTypes->find($leave->leave_type);

                        return [
                            'leave_type' => $leaveType ? $leaveType->type : 'Unknown',
                            'days_used' => $leave->days_used,
                            'remaining_days' => $leaveType ? max(0, $leaveType->days - $leave->days_used) : 0,
                        ];
                    });

                $response = [
                    'success' => true,
                    'message' => $message,
                    // Return only the created leaves, not all paginated data
                    'created_leaves' => collect($result['created_leaves'])->map(function ($leave) use ($request) {
                        return array_merge(
                            (new LeaveResource($leave->load('employee')))->toArray($request),
                            [
                                'month' => is_string($leave->from_date)
                                    ? date('F', strtotime($leave->from_date))
                                    : $leave->from_date->format('F'),
                                'year' => is_string($leave->from_date)
                                    ? date('Y', strtotime($leave->from_date))
                                    : $leave->from_date->year,
                                'leave_type' => \Aero\HRM\Models\LeaveSetting::find($leave->leave_type)?->type,
                            ]
                        );
                    }),
                    // Updated leave data for balance updates
                    'leavesData' => [
                        'leaveTypes' => $leaveTypes,
                        'leaveCountsByUser' => [$userId => $leaveCounts],
                        'publicHolidays' => \Aero\HRM\Models\Holiday::active()
                            ->whereYear('from_date', $year)
                            ->get()
                            ->flatMap(function ($holiday) {
                                $dates = [];
                                $startDate = \Carbon\Carbon::parse($holiday->from_date);
                                $endDate = \Carbon\Carbon::parse($holiday->to_date);

                                while ($startDate->lte($endDate)) {
                                    $dates[] = [
                                        'date' => $startDate->format('Y-m-d'),
                                        'name' => $holiday->name,
                                    ];
                                    $startDate->addDay();
                                }

                                return $dates;
                            })->toArray(),
                    ],
                    'departments' => Department::all('id', 'name'),
                    // Bulk-specific summary data
                    'summary' => $result['summary'],
                    'failed_dates' => $result['failed_dates'] ?? [],
                ];

                return response()->json($response, 201);
            } else {
                // Handle case where no leaves were created
                return response()->json([
                    'success' => false,
                    'error' => $result['message'] ?? 'No leave requests could be created',
                    'message' => 'Failed to create bulk leave requests',
                ], 422);
            }
        } catch (\Throwable $e) {
            report($e);

            return response()->json([
                'success' => false,
                'error' => 'An error occurred while processing bulk leave request.',
                'details' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }

    /**
     * Get available leave types for the user with remaining balances
     */
    public function getLeaveTypes(Request $request): JsonResponse
    {
        try {
            $userId = $request->get('user_id', \Illuminate\Support\Facades\Auth::id());
            $year = $request->get('year', now()->year);

            // Get leave types
            $leaveTypes = \Aero\HRM\Models\LeaveSetting::all();

            // Calculate remaining balances for the specific user
            $usedLeaves = \Aero\HRM\Models\Leave::where('user_id', $userId)
                ->whereYear('from_date', $year)
                ->whereIn('status', ['Approved', 'Pending'])
                ->selectRaw('leave_type, SUM(no_of_days) as total_used')
                ->groupBy('leave_type')
                ->pluck('total_used', 'leave_type');

            // Add remaining balance information to leave types
            $leaveTypesWithBalance = $leaveTypes->map(function ($type) use ($usedLeaves) {
                $used = $usedLeaves->get($type->id, 0);
                $remaining = max(0, $type->days - $used);

                return [
                    'id' => $type->id,
                    'type' => $type->type,
                    'days' => $type->days,
                    'used' => $used,
                    'remaining' => $remaining,
                ];
            });

            return response()->json([
                'success' => true,
                'leave_types' => $leaveTypesWithBalance,
                'user_id' => $userId,
                'year' => $year,
            ]);
        } catch (\Throwable $e) {
            report($e);

            return response()->json([
                'success' => false,
                'error' => 'Failed to retrieve leave types.',
                'details' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }

    /**
     * Get calendar data including existing leaves and holidays for the entire year
     */
    public function getCalendarData(Request $request): JsonResponse
    {
        try {
            $userId = $request->get('user_id', \Illuminate\Support\Facades\Auth::id());
            $year = $request->get('year', now()->year);

            // Get existing leaves for the user for the entire year (removed month filtering)
            $existingLeaves = \Aero\HRM\Models\Leave::where('user_id', $userId)
                ->whereYear('from_date', $year)
                ->get(['from_date', 'to_date', 'status'])
                ->map(function ($leave) {
                    return [
                        'from_date' => \Carbon\Carbon::parse($leave->from_date)->format('Y-m-d'),
                        'to_date' => \Carbon\Carbon::parse($leave->to_date)->format('Y-m-d'),
                        'status' => $leave->status,
                    ];
                });

            // Get public holidays for the entire year
            $publicHolidays = \Aero\HRM\Models\Holiday::active()
                ->whereYear('from_date', $year)
                ->get()
                ->flatMap(function ($holiday) {
                    $dates = [];
                    $startDate = \Carbon\Carbon::parse($holiday->from_date);
                    $endDate = \Carbon\Carbon::parse($holiday->to_date);

                    while ($startDate->lte($endDate)) {
                        $dates[] = $startDate->format('Y-m-d');
                        $startDate->addDay();
                    }

                    return $dates;
                })->toArray();

            return response()->json([
                'success' => true,
                'data' => [
                    'existingLeaves' => $existingLeaves,
                    'publicHolidays' => $publicHolidays,
                    'year' => $year,
                    'loadedAt' => now()->toISOString(),
                ],
            ]);
        } catch (\Throwable $e) {
            report($e);

            return response()->json([
                'success' => false,
                'error' => 'Failed to retrieve calendar data.',
                'details' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }

    /**
     * Bulk delete leave records
     */
    public function bulkDelete(Request $request): JsonResponse
    {
        try {
            // Validate the request
            $request->validate([
                'leave_ids' => 'required|array|min:1',
                'leave_ids.*' => 'required|integer|exists:leaves,id',
            ]);

            $leaveIds = $request->input('leave_ids');
            $currentUserId = Auth::id();

            // Get the leaves to be deleted with their user info for authorization
            $leavesToDelete = \Aero\HRM\Models\Leave::whereIn('id', $leaveIds)
                ->with('employee:id,name')
                ->get();

            if ($leavesToDelete->isEmpty()) {
                return response()->json([
                    'success' => false,
                    'error' => 'No valid leave records found for deletion',
                    'message' => 'Failed to delete leave requests',
                ], 404);
            }

            // Check permissions for deletion
            $user = Auth::user();
            $canDeleteAnyLeaves = $user->hasPermissionTo('leaves.delete');

            // If user doesn't have admin permissions, they can only delete their own leaves
            if (! $canDeleteAnyLeaves) {
                $unauthorizedLeaves = $leavesToDelete->filter(function ($leave) use ($currentUserId) {
                    return $leave->user_id !== $currentUserId;
                });

                if ($unauthorizedLeaves->isNotEmpty()) {
                    return response()->json([
                        'success' => false,
                        'error' => 'You are not authorized to delete some of the selected leave records',
                        'message' => 'Authorization failed',
                    ], 403);
                }
            }

            // Check if any leaves are already approved (cannot be deleted)
            $approvedLeaves = $leavesToDelete->filter(function ($leave) {
                return strtolower($leave->status) === 'approved';
            });

            if ($approvedLeaves->isNotEmpty()) {
                $approvedCount = $approvedLeaves->count();

                return response()->json([
                    'success' => false,
                    'error' => "Cannot delete {$approvedCount} approved leave request(s). Only pending or rejected leaves can be deleted.",
                    'message' => 'Cannot delete approved leaves',
                ], 422);
            }

            // Perform bulk deletion
            $deletedCount = \Aero\HRM\Models\Leave::whereIn('id', $leaveIds)->delete();

            // Get updated leave statistics for affected users
            $affectedUserIds = $leavesToDelete->pluck('user_id')->unique();
            $updatedLeavesData = [];

            foreach ($affectedUserIds as $userId) {
                $year = now()->year;

                // Get updated leave types and counts for this user
                $leaveTypes = \Aero\HRM\Models\LeaveSetting::all();
                $leaveCounts = \Aero\HRM\Models\Leave::where('user_id', $userId)
                    ->whereYear('from_date', $year)
                    ->whereIn('status', ['Approved', 'Pending'])
                    ->selectRaw('leave_type, SUM(no_of_days) as days_used')
                    ->groupBy('leave_type')
                    ->get()
                    ->map(function ($leave) use ($leaveTypes) {
                        $leaveType = $leaveTypes->find($leave->leave_type);

                        return [
                            'leave_type' => $leaveType ? $leaveType->type : 'Unknown',
                            'days_used' => $leave->days_used,
                            'remaining_days' => $leaveType ? max(0, $leaveType->days - $leave->days_used) : 0,
                        ];
                    });

                $updatedLeavesData[$userId] = $leaveCounts;
            }

            // Prepare success message
            $message = $deletedCount === 1
                ? '1 leave request deleted successfully'
                : "{$deletedCount} leave requests deleted successfully";

            $response = [
                'success' => true,
                'message' => $message,
                'deleted_count' => $deletedCount,
                'deleted_leaves' => $leavesToDelete->map(function ($leave) {
                    return [
                        'id' => $leave->id,
                        'user_id' => $leave->user_id,
                        'employee_name' => $leave->employee->name ?? 'Unknown',
                        'from_date' => $leave->from_date,
                        'to_date' => $leave->to_date,
                        'leave_type' => $leave->leave_type,
                    ];
                }),
                // Updated leave data for balance updates
                'leavesData' => [
                    'leaveTypes' => \Aero\HRM\Models\LeaveSetting::all(),
                    'leaveCountsByUser' => $updatedLeavesData,
                    'publicHolidays' => \Aero\HRM\Models\Holiday::active()
                        ->whereYear('from_date', now()->year)
                        ->get()
                        ->flatMap(function ($holiday) {
                            $dates = [];
                            $startDate = \Carbon\Carbon::parse($holiday->from_date);
                            $endDate = \Carbon\Carbon::parse($holiday->to_date);

                            while ($startDate->lte($endDate)) {
                                $dates[] = [
                                    'date' => $startDate->format('Y-m-d'),
                                    'name' => $holiday->name,
                                ];
                                $startDate->addDay();
                            }

                            return $dates;
                        })->toArray(),
                ],
                'departments' => Department::all('id', 'name'),
            ];

            return response()->json($response, 200);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'error' => 'Validation failed',
                'details' => $e->errors(),
                'message' => 'Invalid request data',
            ], 422);
        } catch (\Throwable $e) {
            report($e);

            return response()->json([
                'success' => false,
                'error' => 'An error occurred while deleting leave requests.',
                'details' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }
}
