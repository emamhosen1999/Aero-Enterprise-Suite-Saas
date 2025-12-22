<?php

namespace Aero\HRM\Http\Controllers\Employee;

use Aero\HRM\Models\Holiday;
use Aero\HRM\Models\Leave;
use Aero\HRM\Models\LeaveSetting;
use Aero\HRM\Http\Controllers\Controller;
use Carbon\Carbon;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class TimeOffManagementController extends Controller
{
    /**
     * Display the time-off management dashboard
     */
    public function index()
    {
        $user = Auth::user();
        $currentYear = Carbon::now()->year;

        // Get company holidays
        $holidays = Holiday::active()
            ->currentYear()
            ->orderBy('from_date', 'asc')
            ->get();

        // Get leave settings/types
        $leaveTypes = LeaveSetting::all();

        // Get user's leave requests
        $userLeaves = Leave::where('user_id', $user->id)
            ->whereYear('from_date', $currentYear)
            ->with(['leave_setting'])
            ->orderBy('from_date', 'desc')
            ->get();

        // Calculate leave statistics
        $stats = $this->calculateLeaveStats($user->id, $currentYear);

        return Inertia::render('Pages/HRM/TimeOff/Dashboard', [
            'title' => 'Time Off Management',
            'holidays' => $holidays,
            'leaveTypes' => $leaveTypes,
            'userLeaves' => $userLeaves,
            'stats' => $stats,
            'currentYear' => $currentYear,
        ]);
    }

    /**
     * Display company holidays management
     */
    public function holidays()
    {
        // Redirect to the existing holidays page
        return redirect()->route('holidays');
    }

    /**
     * Display leave requests management
     */
    public function leaveRequests()
    {
        // Redirect to the existing leave admin page
        return redirect()->route('leaves');
    }

    /**
     * Display leave calendar
     */
    public function calendar()
    {
        $holidays = Holiday::all()->map(function ($holiday) {
            return [
                'id' => 'holiday-'.$holiday->id,
                'title' => $holiday->title,
                'start' => $holiday->from_date,
                'end' => $holiday->to_date ? Carbon::parse($holiday->to_date)->addDay() : Carbon::parse($holiday->from_date)->addDay(),
                'type' => 'holiday',
                'color' => '#ef4444',
                'extendedProps' => [
                    'type' => 'company_holiday',
                    'description' => $holiday->title,
                ],
            ];
        });

        $leaves = Leave::where('status', 'approved')
            ->with(['user', 'leaveSetting'])
            ->whereHas('user') // Ensure user exists
            ->whereHas('leaveSetting') // Ensure leave setting exists
            ->get()
            ->map(function ($leave) {
                // Additional safety checks
                if (! $leave->user || ! $leave->leaveSetting) {
                    return null;
                }

                return [
                    'id' => 'leave-'.$leave->id,
                    'title' => $leave->user->name.' - '.$leave->leaveSetting->type,
                    'start' => $leave->from_date,
                    'end' => Carbon::parse($leave->to_date)->addDay(),
                    'type' => 'leave',
                    'color' => $this->getLeaveTypeColor($leave->leaveSetting->type),
                    'extendedProps' => [
                        'type' => 'employee_leave',
                        'employee' => $leave->user->name,
                        'leaveType' => $leave->leaveSetting->type,
                        'reason' => $leave->reason,
                    ],
                ];
            })
            ->filter(); // Remove null entries

        $events = $holidays->merge($leaves);

        return Inertia::render('Pages/HRM/TimeOff/Calendar', [
            'title' => 'Time Off Calendar',
            'events' => $events,
        ]);
    }

    /**
     * Display leave balances
     */
    public function balances()
    {
        // Redirect to the existing leave summary page
        return redirect()->route('leave-summary');
    }

    /**
     * Display time-off reports
     */
    public function reports()
    {
        $currentYear = Carbon::now()->year;

        // Department-wise leave statistics
        $departmentStats = DB::table('leaves')
            ->join('users', 'leaves.user_id', '=', 'users.id')
            ->join('departments', 'users.department_id', '=', 'departments.id')
            ->join('leave_settings', 'leaves.leave_setting_id', '=', 'leave_settings.id')
            ->where('leaves.status', 'approved')
            ->whereYear('leaves.from_date', $currentYear)
            ->select(
                'departments.name as department',
                'leave_settings.type as leave_type',
                DB::raw('COUNT(*) as total_requests'),
                DB::raw('SUM(DATEDIFF(leaves.to_date, leaves.from_date) + 1) as total_days')
            )
            ->groupBy('departments.name', 'leave_settings.type')
            ->get();

        // Monthly trends
        $monthlyTrends = DB::table('leaves')
            ->where('status', 'approved')
            ->whereYear('from_date', $currentYear)
            ->select(
                DB::raw('MONTH(from_date) as month'),
                DB::raw('COUNT(*) as requests'),
                DB::raw('SUM(DATEDIFF(to_date, from_date) + 1) as days')
            )
            ->groupBy(DB::raw('MONTH(from_date)'))
            ->orderBy('month')
            ->get();

        // Leave type distribution
        $leaveTypeStats = DB::table('leaves')
            ->join('leave_settings', 'leaves.leave_setting_id', '=', 'leave_settings.id')
            ->where('leaves.status', 'approved')
            ->whereYear('leaves.from_date', $currentYear)
            ->select(
                'leave_settings.type',
                DB::raw('COUNT(*) as total_requests'),
                DB::raw('SUM(DATEDIFF(leaves.to_date, leaves.from_date) + 1) as total_days')
            )
            ->groupBy('leave_settings.type')
            ->get();

        return Inertia::render('Pages/HRM/TimeOff/Reports', [
            'title' => 'Time Off Reports',
            'departmentStats' => $departmentStats,
            'monthlyTrends' => $monthlyTrends,
            'leaveTypeStats' => $leaveTypeStats,
            'currentYear' => $currentYear,
        ]);
    }

    /**
     * Employee self-service time-off requests
     */
    public function employeeRequests()
    {
        // Redirect to the existing employee leaves page
        return redirect()->route('leaves-employee');
    }

    /**
     * Calculate leave statistics for a user
     */
    private function calculateLeaveStats($userId, $year)
    {
        $leaveTypes = LeaveSetting::all();
        $stats = [];

        foreach ($leaveTypes as $leaveType) {
            $used = Leave::where('user_id', $userId)
                ->where('leave_setting_id', $leaveType->id)
                ->where('status', 'approved')
                ->whereYear('from_date', $year)
                ->sum(DB::raw('DATEDIFF(to_date, from_date) + 1'));

            $pending = Leave::where('user_id', $userId)
                ->where('leave_setting_id', $leaveType->id)
                ->where('status', 'pending')
                ->whereYear('from_date', $year)
                ->sum(DB::raw('DATEDIFF(to_date, from_date) + 1'));

            $stats[$leaveType->type] = [
                'allocated' => $leaveType->days,
                'used' => $used,
                'pending' => $pending,
                'available' => max(0, $leaveType->days - $used - $pending),
            ];
        }

        return $stats;
    }

    /**
     * Get color for leave type
     */
    private function getLeaveTypeColor($leaveType)
    {
        $colors = [
            'Annual Leave' => '#3b82f6',
            'Sick Leave' => '#ef4444',
            'Personal Leave' => '#8b5cf6',
            'Maternity Leave' => '#ec4899',
            'Paternity Leave' => '#06b6d4',
            'Emergency Leave' => '#f59e0b',
            'Bereavement Leave' => '#6b7280',
        ];

        return $colors[$leaveType] ?? '#6b7280';
    }
}
