<?php

declare(strict_types=1);

namespace Aero\HRM\Http\Controllers\Employee;

use Aero\HRM\Http\Controllers\Controller;
use Aero\HRM\Models\Attendance;
use Aero\HRM\Models\Department;
use Aero\HRM\Models\Employee;
use Aero\HRM\Models\Leave;
use Aero\HRM\Services\LeaveBalanceService;
use Aero\Core\Services\DashboardWidgetRegistry;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

/**
 * Employee Dashboard Controller
 *
 * Provides a personalized dashboard for regular employees showing:
 * - Their leave balances and recent requests
 * - Attendance summary and clock-in status
 * - Upcoming holidays
 * - Pending tasks and notifications
 *
 * This dashboard is designed for employees who don't have HR management access.
 * HR Managers and Admins would typically be redirected to the HRM Dashboard instead.
 */
class EmployeeDashboardController extends Controller
{
    public function __construct(
        protected LeaveBalanceService $leaveBalanceService,
        protected DashboardWidgetRegistry $widgetRegistry
    ) {}

    /**
     * Display the employee dashboard.
     */
    public function index(Request $request)
    {
        $user = Auth::user();
        $employee = Employee::where('user_id', $user->id)->first();

        // Leave balances (personal)
        $leaveBalances = [];
        $pendingLeaves = [];
        $recentLeaves = [];
        
        if ($employee) {
            try {
                $leaveBalances = $this->leaveBalanceService->getAllBalances($employee);
            } catch (\Exception $e) {
                $leaveBalances = [];
            }

            // Pending leave requests
            $pendingLeaves = Leave::where('user_id', $employee->user_id)
                ->whereIn('status', ['pending', 'submitted'])
                ->with('leaveSetting')
                ->orderBy('created_at', 'desc')
                ->take(5)
                ->get()
                ->map(function ($leave) {
                    return [
                        'id' => $leave->id,
                        'type' => $leave->leaveSetting?->name ?? 'Unknown',
                        'start_date' => $leave->from_date ? Carbon::parse($leave->from_date)->format('Y-m-d') : null,
                        'end_date' => $leave->to_date ? Carbon::parse($leave->to_date)->format('Y-m-d') : null,
                        'days' => $leave->no_of_days ?? 1,
                        'status' => $leave->status,
                        'reason' => $leave->reason,
                        'created_at' => $leave->created_at?->format('Y-m-d'),
                    ];
                });

            // Recent leave history
            $recentLeaves = Leave::where('user_id', $employee->user_id)
                ->with('leaveSetting')
                ->orderBy('created_at', 'desc')
                ->take(10)
                ->get()
                ->map(function ($leave) {
                    return [
                        'id' => $leave->id,
                        'type' => $leave->leaveSetting?->name ?? 'Unknown',
                        'start_date' => $leave->from_date ? Carbon::parse($leave->from_date)->format('Y-m-d') : null,
                        'end_date' => $leave->to_date ? Carbon::parse($leave->to_date)->format('Y-m-d') : null,
                        'days' => $leave->no_of_days ?? 1,
                        'status' => $leave->status,
                    ];
                });
        }

        // Attendance today
        $todayAttendance = null;
        if ($employee) {
            $todayAttendance = Attendance::where('user_id', $employee->user_id)
                ->whereDate('date', today())
                ->first();
        }

        // Calculate attendance stats for the current month
        $attendanceStats = [
            'present_days' => 0,
            'absent_days' => 0,
            'late_days' => 0,
            'total_hours' => 0,
        ];

        if ($employee) {
            $monthStart = now()->startOfMonth();
            $monthEnd = now()->endOfMonth();

            $monthAttendance = Attendance::where('user_id', $employee->user_id)
                ->whereBetween('date', [$monthStart, $monthEnd])
                ->get();

            $attendanceStats['present_days'] = $monthAttendance->where('status', 'present')->count();
            $attendanceStats['absent_days'] = $monthAttendance->where('status', 'absent')->count();
            $attendanceStats['late_days'] = $monthAttendance->where('is_late', true)->count();
            $attendanceStats['total_hours'] = $monthAttendance->sum('worked_hours') ?? 0;
        }

        // Quick actions available to employee
        $quickActions = [
            [
                'id' => 'apply_leave',
                'label' => 'Apply for Leave',
                'icon' => 'CalendarIcon',
                'route' => 'hrm.leave.create',
                'color' => 'primary',
            ],
            [
                'id' => 'view_payslip',
                'label' => 'View Payslip',
                'icon' => 'CurrencyDollarIcon',
                'route' => 'hrm.payroll.my-payslips',
                'color' => 'success',
            ],
            [
                'id' => 'my_profile',
                'label' => 'My Profile',
                'icon' => 'UserIcon',
                'route' => 'hrm.employee.profile',
                'color' => 'secondary',
            ],
            [
                'id' => 'attendance_history',
                'label' => 'Attendance History',
                'icon' => 'ClockIcon',
                'route' => 'hrm.attendance.my-history',
                'color' => 'warning',
            ],
        ];

        // Get widgets for Employee Dashboard
        $widgets = $this->widgetRegistry->getWidgetsForFrontend('hrm.employee');

        return Inertia::render('HRM/Employee/Dashboard', [
            'title' => 'My Dashboard',
            'dynamicWidgets' => $widgets,
            'employee' => $employee ? [
                'id' => $employee->id,
                'name' => $employee->full_name ?? $user->name,
                'department' => $employee->department?->name ?? 'N/A',
                'designation' => $employee->designation?->name ?? 'N/A',
                'employee_id' => $employee->employee_id,
                'avatar' => $employee->profile_image_url ?? null,
            ] : null,
            'leaveBalances' => $leaveBalances,
            'pendingLeaves' => $pendingLeaves,
            'recentLeaves' => $recentLeaves,
            'todayAttendance' => $todayAttendance ? [
                'clock_in' => $todayAttendance->punchin?->format('H:i'),
                'clock_out' => $todayAttendance->punchout?->format('H:i'),
                'status' => $todayAttendance->status,
                'worked_hours' => $todayAttendance->worked_hours ?? 0,
            ] : null,
            'attendanceStats' => $attendanceStats,
            'quickActions' => $quickActions,
        ]);
    }
}
