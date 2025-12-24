<?php

declare(strict_types=1);

namespace Aero\HRM\Widgets;

use Aero\Core\Contracts\AbstractDashboardWidget;
use Aero\Core\Contracts\CoreWidgetCategory;
use Aero\HRM\Models\Attendance;
use Illuminate\Support\Facades\Auth;

/**
 * Punch Status Widget for Core Dashboard
 *
 * Shows clock in/out button and current status for employees.
 * This is an ACTION widget - user needs to take action.
 *
 * Appears on: Core Dashboard (/dashboard)
 * Does NOT appear on: HRM Dashboard (which has full attendance charts)
 */
class PunchStatusWidget extends AbstractDashboardWidget
{
    protected string $position = 'main_left';
    protected int $order = 5; // High priority - show first
    protected int|string $span = 1;
    protected CoreWidgetCategory $category = CoreWidgetCategory::ACTION;
    protected array $requiredPermissions = ['attendance.own.punch', 'attendance.own.view'];

    public function getKey(): string
    {
        return 'hrm.punch_status';
    }

    public function getComponent(): string
    {
        // Uses existing PunchStatusCard component which is self-contained
        return 'Components/PunchStatusCard';
    }

    public function getTitle(): string
    {
        return 'Clock In/Out';
    }

    public function getDescription(): string
    {
        return 'Your attendance status';
    }

    public function getModuleCode(): string
    {
        return 'hrm';
    }

    /**
     * Override isEnabled to check specific permission combination.
     */
    public function isEnabled(): bool
    {
        if (!$this->isModuleActive()) {
            return false;
        }

        // User must have BOTH punch and view permissions
        return $this->userHasAllPermissions(['attendance.own.punch', 'attendance.own.view']);
    }

    public function getData(): array
    {
        return $this->safeResolve(function () {
            $user = Auth::user();
            if (!$user) {
                return $this->getEmptyState();
            }

            $today = now()->toDateString();

            // Get today's attendance record
            $attendance = Attendance::where('user_id', $user->id)
                ->whereDate('date', $today)
                ->first();

            if (!$attendance) {
                return [
                    'status' => 'not_punched',
                    'message' => 'Not clocked in yet',
                    'canPunchIn' => true,
                    'canPunchOut' => false,
                    'punchInTime' => null,
                    'punchOutTime' => null,
                    'workingHours' => null,
                ];
            }

            $isPunchedIn = $attendance->punch_in_time && !$attendance->punch_out_time;
            $isPunchedOut = $attendance->punch_in_time && $attendance->punch_out_time;

            return [
                'status' => $isPunchedOut ? 'completed' : ($isPunchedIn ? 'working' : 'not_punched'),
                'message' => $isPunchedOut 
                    ? 'Day completed' 
                    : ($isPunchedIn ? 'Currently working' : 'Not clocked in'),
                'canPunchIn' => !$attendance->punch_in_time,
                'canPunchOut' => $isPunchedIn,
                'punchInTime' => $attendance->punch_in_time?->format('h:i A'),
                'punchOutTime' => $attendance->punch_out_time?->format('h:i A'),
                'workingHours' => $attendance->working_hours,
            ];
        }, $this->getEmptyState());
    }

    private function getEmptyState(): array
    {
        return [
            'status' => 'unavailable',
            'message' => 'Attendance unavailable',
            'canPunchIn' => false,
            'canPunchOut' => false,
            'punchInTime' => null,
            'punchOutTime' => null,
            'workingHours' => null,
        ];
    }
}
