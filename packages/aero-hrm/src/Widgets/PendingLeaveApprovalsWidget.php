<?php

declare(strict_types=1);

namespace Aero\HRM\Widgets;

use Aero\Core\Contracts\AbstractDashboardWidget;
use Aero\Core\Contracts\CoreWidgetCategory;
use Illuminate\Support\Facades\DB;

/**
 * Pending Leave Approvals Widget for Core Dashboard
 *
 * Shows count of leaves pending manager/HR approval.
 * This is an ALERT widget - needs attention.
 *
 * Appears on: Core Dashboard (/dashboard) for managers/HR
 * Does NOT appear on: HRM Dashboard (which has full approval queue)
 */
class PendingLeaveApprovalsWidget extends AbstractDashboardWidget
{
    protected string $position = 'sidebar';
    protected int $order = 10;
    protected int|string $span = 1;
    protected CoreWidgetCategory $category = CoreWidgetCategory::ALERT;
    protected array $requiredPermissions = ['leaves.approve'];

    public function getKey(): string
    {
        return 'hrm.pending_leave_approvals';
    }

    public function getComponent(): string
    {
        // Uses existing PendingApprovalsWidget component which is self-contained
        return 'Components/Leave/PendingApprovalsWidget';
    }

    public function getTitle(): string
    {
        return 'Pending Approvals';
    }

    public function getDescription(): string
    {
        return 'Leave requests awaiting your approval';
    }

    public function getModuleCode(): string
    {
        return 'hrm';
    }

    public function getData(): array
    {
        return $this->safeResolve(function () {
            $user = auth()->user();
            if (!$user) {
                return ['count' => 0, 'urgent' => 0, 'items' => []];
            }

            // Count pending leaves that this user can approve
            $query = DB::table('leaves')
                ->join('users', 'leaves.user_id', '=', 'users.id')
                ->where('leaves.status', 'pending');

            // If user is a department manager, only show their department
            if ($user->can('leaves.approve') && !$user->can('leaves.approve.all')) {
                $query->where('users.department_id', $user->department_id);
            }

            $pendingCount = (clone $query)->count();

            // Urgent = starts within 3 days
            $urgentCount = (clone $query)
                ->where('leaves.from_date', '<=', now()->addDays(3))
                ->count();

            // Get top 3 for preview
            $recentPending = (clone $query)
                ->select([
                    'leaves.id',
                    'users.name as employee_name',
                    'leaves.from_date',
                    'leaves.to_date',
                ])
                ->orderBy('leaves.from_date')
                ->limit(3)
                ->get();

            return [
                'count' => $pendingCount,
                'urgent' => $urgentCount,
                'items' => $recentPending->toArray(),
                'link' => route('hrm.leaves.admin'), // Link to full list
            ];
        }, ['count' => 0, 'urgent' => 0, 'items' => []]);
    }
}
