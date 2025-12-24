<?php

namespace Aero\HRM\Services;

use Aero\HRM\Models\Department;
use Aero\HRM\Models\Leave;
use Aero\HRM\Models\LeaveSetting;
use Aero\Core\Models\User;
use Carbon\Carbon;

class LeaveSummaryService
{
    /**
     * Generate comprehensive leave summary data
     */
    public function generateLeaveSummary(array $filters = []): array
    {
        $year = $filters['year'] ?? now()->year;
        $departmentId = $filters['department_id'] ?? null;
        $employeeId = $filters['employee_id'] ?? null;
        $statusFilter = $filters['status'] ?? null;
        $leaveTypeFilter = $filters['leave_type'] ?? null;

        // Get filtered users with department and designation info
        $usersQuery = User::with(['department', 'designation'])
            ->whereHas('department') // Only users with departments
            ->when($departmentId, fn ($q) => $q->where('department_id', $departmentId))
            ->when($employeeId, fn ($q) => $q->where('id', $employeeId))
            ->orderBy('name');

        $users = $usersQuery->get();

        // Get leave types (exclude Weekend)
        $leaveTypes = LeaveSetting::where('type', '!=', 'Weekend')
            ->when($leaveTypeFilter, fn ($q) => $q->where('id', $leaveTypeFilter))
            ->orderBy('type')
            ->get();

        // Get leaves with optimized query
        $leavesQuery = Leave::with(['leaveSetting', 'employee.department'])
            ->whereYear('from_date', $year)
            ->whereHas('leaveSetting', fn ($q) => $q->where('type', '!=', 'Weekend'))
            ->when($departmentId, fn ($q) => $q->whereHas('employee', fn ($eq) => $eq->where('department_id', $departmentId)))
            ->when($employeeId, fn ($q) => $q->where('user_id', $employeeId))
            ->when($statusFilter, fn ($q) => $q->where('status', $statusFilter))
            ->when($leaveTypeFilter, fn ($q) => $q->where('leave_type', $leaveTypeFilter));

        $leaves = $leavesQuery->get();

        // Generate month labels
        $months = [
            1 => 'JAN', 2 => 'FEB', 3 => 'MAR', 4 => 'APR',
            5 => 'MAY', 6 => 'JUN', 7 => 'JUL', 8 => 'AUG',
            9 => 'SEP', 10 => 'OCT', 11 => 'NOV', 12 => 'DEC',
        ];

        $leaveTypeColumns = $leaveTypes->pluck('type')->toArray();
        $result = [];
        $sl_no = 1;

        // Calculate statistics
        $totalStats = [
            'total_employees' => $users->count(),
            'total_leaves_taken' => 0,
            'total_approved_leaves' => 0,
            'total_pending_leaves' => 0,
            'total_rejected_leaves' => 0,
            'departments_count' => $users->pluck('department_id')->unique()->count(),
            'leave_types_count' => $leaveTypes->count(),
        ];

        foreach ($users as $user) {
            $userLeaves = $leaves->where('user_id', $user->id);

            $row = [
                'id' => $user->id,
                'SL NO' => $sl_no++,
                'employee_name' => $user->name,
                'department' => $user->department->name ?? 'N/A',
                'designation' => $user->designation->title ?? 'N/A',
            ];

            $total = 0;
            $totalApproved = 0;
            $totalPending = 0;
            $totalRejected = 0;
            $leaveTypeTotals = array_fill_keys($leaveTypeColumns, 0);

            // Calculate monthly leave days (only approved)
            foreach ($months as $num => $label) {
                $monthLeaves = $userLeaves->filter(
                    fn ($leave) => Carbon::parse($leave->from_date)->month == $num
                );

                $approvedDays = $monthLeaves->where('status', 'Approved')->sum('no_of_days');
                $pendingDays = $monthLeaves->where('status', 'Pending')->sum('no_of_days');
                $rejectedDays = $monthLeaves->where('status', 'Declined')->sum('no_of_days');

                $row[$label] = $approvedDays > 0 ? $approvedDays : '';
                $row[$label.'_pending'] = $pendingDays > 0 ? $pendingDays : '';

                $total += $approvedDays;
                $totalApproved += $approvedDays;
                $totalPending += $pendingDays;
                $totalRejected += $rejectedDays;
            }

            // Calculate leave type totals (approved only)
            foreach ($userLeaves->where('status', 'Approved') as $leave) {
                $type = $leave->leaveSetting->type ?? '';
                if (isset($leaveTypeTotals[$type])) {
                    $leaveTypeTotals[$type] += $leave->no_of_days;
                }
            }

            // Calculate detailed leave type information (used and remaining)
            $leaveTypeDetails = $this->calculateLeaveTypeDetails($user, $leaveTypes, $userLeaves);

            // Calculate balance information
            $balanceInfo = $this->calculateLeaveBalance($user, $leaveTypes, $userLeaves);

            $row['total_approved'] = $totalApproved;
            $row['total_pending'] = $totalPending;
            $row['total_rejected'] = $totalRejected;
            $row['total_used'] = $total;
            $row['total_allocated'] = $balanceInfo['total_allocated'];
            $row['total_balance'] = $balanceInfo['total_balance'];

            // Add leave type columns (old format for compatibility)
            foreach ($leaveTypeColumns as $type) {
                $row[$type] = $leaveTypeTotals[$type] ?: '';
            }

            // Add detailed leave type information (used and remaining)
            foreach ($leaveTypeDetails as $typeDetail) {
                $row[$typeDetail['type'].'_used'] = $typeDetail['used'];
                $row[$typeDetail['type'].'_remaining'] = $typeDetail['remaining'];
                $row[$typeDetail['type'].'_allocated'] = $typeDetail['allocated'];
            }

            // Calculate usage percentage
            $row['usage_percentage'] = $balanceInfo['total_allocated'] > 0
                ? round(($total / $balanceInfo['total_allocated']) * 100, 1)
                : 0;

            $result[] = $row;

            // Update global stats
            $totalStats['total_leaves_taken'] += $total;
            $totalStats['total_approved_leaves'] += $totalApproved;
            $totalStats['total_pending_leaves'] += $totalPending;
            $totalStats['total_rejected_leaves'] += $totalRejected;
        }

        // Generate department-wise summary
        $departmentSummary = $this->generateDepartmentSummary($result);

        // Build columns array with detailed leave type information
        $leaveTypeDetailColumns = [];
        foreach ($leaveTypeColumns as $type) {
            $leaveTypeDetailColumns[] = $type.'_used';
            $leaveTypeDetailColumns[] = $type.'_remaining';
        }

        $columns = array_merge(
            ['employee_name', 'department'],
            array_values($months),
            ['total_approved', 'total_pending', 'total_rejected'],
            $leaveTypeDetailColumns,
            ['total_allocated', 'total_balance', 'usage_percentage']
        );

        return [
            'users' => $users,
            'departments' => Department::orderBy('name')->get(['id', 'name']),
            'leave_types' => $leaveTypes,
            'columns' => $columns,
            'data' => $result,
            'department_summary' => $departmentSummary,
            'stats' => $totalStats,
            'year' => $year,
            'filters' => $filters,
        ];
    }

    /**
     * Calculate leave balance for a user
     */
    private function calculateLeaveBalance(User $user, $leaveTypes, $userLeaves): array
    {
        $totalAllocated = 0;
        $totalUsed = 0;

        foreach ($leaveTypes as $leaveType) {
            $used = $userLeaves->where('leave_type', $leaveType->id)
                ->where('status', 'Approved')
                ->sum('no_of_days');
            $allocated = $leaveType->days ?? 0;

            $totalAllocated += $allocated;
            $totalUsed += $used;
        }

        return [
            'total_allocated' => $totalAllocated,
            'total_used' => $totalUsed,
            'total_balance' => max(0, $totalAllocated - $totalUsed),
        ];
    }

    /**
     * Calculate detailed leave type information (used and remaining)
     */
    private function calculateLeaveTypeDetails(User $user, $leaveTypes, $userLeaves): array
    {
        $details = [];

        foreach ($leaveTypes as $leaveType) {
            $used = $userLeaves->where('leave_type', $leaveType->id)
                ->where('status', 'Approved')
                ->sum('no_of_days');
            $allocated = $leaveType->days ?? 0;
            $remaining = max(0, $allocated - $used);

            $details[] = [
                'type' => $leaveType->type,
                'used' => $used,
                'remaining' => $remaining,
                'allocated' => $allocated,
            ];
        }

        return $details;
    }

    /**
     * Generate department-wise summary
     */
    private function generateDepartmentSummary(array $data): array
    {
        $departments = [];

        foreach ($data as $row) {
            $dept = $row['department'];
            if (! isset($departments[$dept])) {
                $departments[$dept] = [
                    'department' => $dept,
                    'employee_count' => 0,
                    'total_leaves' => 0,
                    'total_approved' => 0,
                    'total_pending' => 0,
                    'total_rejected' => 0,
                    'avg_usage_percentage' => 0,
                ];
            }

            $departments[$dept]['employee_count']++;
            $departments[$dept]['total_leaves'] += $row['total_used'];
            $departments[$dept]['total_approved'] += $row['total_approved'];
            $departments[$dept]['total_pending'] += $row['total_pending'];
            $departments[$dept]['total_rejected'] += $row['total_rejected'];
        }

        // Calculate averages
        foreach ($departments as &$dept) {
            if ($dept['employee_count'] > 0) {
                $dept['avg_leaves_per_employee'] = round($dept['total_leaves'] / $dept['employee_count'], 1);
            }
        }

        return array_values($departments);
    }

    /**
     * Export summary data
     */
    public function exportSummary(array $data, string $format = 'csv'): array
    {
        // Implementation for CSV/Excel export
        return [
            'filename' => 'leave_summary_'.now()->format('Y-m-d').".$format",
            'data' => $data,
            'headers' => array_keys($data[0] ?? []),
        ];
    }
}
