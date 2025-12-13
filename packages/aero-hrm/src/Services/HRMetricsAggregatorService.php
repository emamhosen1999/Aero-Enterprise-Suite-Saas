<?php

namespace Aero\HRM\Services;

use Aero\HRM\Models\Attendance;
use Aero\HRM\Models\Payroll;
use Aero\Core\Models\User;
use App\Models\Tenant\HRM\Job;
use App\Models\Tenant\HRM\JobApplication;
use Illuminate\Support\Facades\DB;

class HRMetricsAggregatorService
{
    /**
     * Get headcount metrics
     */
    public function getHeadcountMetrics(array $filters = []): array
    {
        $startDate = $filters['start_date'] ?? now()->subMonths(6)->startOfMonth();
        $endDate = $filters['end_date'] ?? now()->endOfMonth();
        $departmentId = $filters['department_id'] ?? null;

        // Base query
        $query = User::whereNotNull('date_of_joining');

        if ($departmentId) {
            $query->where('department_id', $departmentId);
        }

        // Total headcount
        $totalHeadcount = (clone $query)->where('active', true)->count();

        // By department
        $byDepartment = (clone $query)
            ->select('department_id', DB::raw('count(*) as count'))
            ->where('active', true)
            ->with('department:id,name')
            ->groupBy('department_id')
            ->get()
            ->map(fn ($item) => [
                'department' => $item->department?->name ?? 'Unassigned',
                'count' => $item->count,
            ]);

        // By designation
        $byDesignation = (clone $query)
            ->select('designation_id', DB::raw('count(*) as count'))
            ->where('active', true)
            ->with('designation:id,name')
            ->groupBy('designation_id')
            ->get()
            ->map(fn ($item) => [
                'designation' => $item->designation?->name ?? 'Unassigned',
                'count' => $item->count,
            ]);

        // Growth trend (monthly)
        $growthTrend = User::selectRaw('DATE_FORMAT(date_of_joining, "%Y-%m") as month, count(*) as hires')
            ->whereBetween('date_of_joining', [$startDate, $endDate])
            ->groupBy('month')
            ->orderBy('month')
            ->get()
            ->map(fn ($item) => [
                'month' => $item->month,
                'hires' => $item->hires,
            ]);

        // Calculate growth rate
        $previousPeriodStart = now()->subMonths(12)->startOfMonth();
        $previousPeriodEnd = now()->subMonths(6)->endOfMonth();

        $currentPeriodCount = User::where('active', true)
            ->whereBetween('date_of_joining', [$startDate, $endDate])
            ->count();

        $previousPeriodCount = User::where('active', true)
            ->whereBetween('date_of_joining', [$previousPeriodStart, $previousPeriodEnd])
            ->count();

        $growthRate = $previousPeriodCount > 0
            ? round((($currentPeriodCount - $previousPeriodCount) / $previousPeriodCount) * 100, 2)
            : 0;

        return [
            'total_headcount' => $totalHeadcount,
            'by_department' => $byDepartment,
            'by_designation' => $byDesignation,
            'growth_trend' => $growthTrend,
            'growth_rate' => $growthRate,
            'new_hires' => $currentPeriodCount,
        ];
    }

    /**
     * Get turnover metrics
     */
    public function getTurnoverMetrics(array $filters = []): array
    {
        $startDate = $filters['start_date'] ?? now()->subMonths(6)->startOfMonth();
        $endDate = $filters['end_date'] ?? now()->endOfMonth();

        // Total employees at start of period
        $totalAtStart = User::where('date_of_joining', '<', $startDate)->count();

        // Employees who left (soft deleted)
        $employeesLeft = User::onlyTrashed()
            ->whereBetween('deleted_at', [$startDate, $endDate])
            ->count();

        // New hires
        $newHires = User::whereBetween('date_of_joining', [$startDate, $endDate])->count();

        // Average headcount
        $totalAtEnd = User::where('active', true)->count();
        $averageHeadcount = ($totalAtStart + $totalAtEnd) / 2;

        // Turnover rate
        $turnoverRate = $averageHeadcount > 0
            ? round(($employeesLeft / $averageHeadcount) * 100, 2)
            : 0;

        // Retention rate
        $retentionRate = round(100 - $turnoverRate, 2);

        // Turnover by department
        $turnoverByDepartment = User::onlyTrashed()
            ->whereBetween('deleted_at', [$startDate, $endDate])
            ->select('department_id', DB::raw('count(*) as count'))
            ->with('department:id,name')
            ->groupBy('department_id')
            ->get()
            ->map(fn ($item) => [
                'department' => $item->department?->name ?? 'Unassigned',
                'count' => $item->count,
            ]);

        // Monthly turnover trend
        $turnoverTrend = User::onlyTrashed()
            ->selectRaw('DATE_FORMAT(deleted_at, "%Y-%m") as month, count(*) as count')
            ->whereBetween('deleted_at', [$startDate, $endDate])
            ->groupBy('month')
            ->orderBy('month')
            ->get()
            ->map(fn ($item) => [
                'month' => $item->month,
                'turnover' => $item->count,
            ]);

        return [
            'turnover_rate' => $turnoverRate,
            'retention_rate' => $retentionRate,
            'employees_left' => $employeesLeft,
            'new_hires' => $newHires,
            'turnover_by_department' => $turnoverByDepartment,
            'turnover_trend' => $turnoverTrend,
        ];
    }

    /**
     * Get attendance metrics
     */
    public function getAttendanceMetrics(array $filters = []): array
    {
        $startDate = $filters['start_date'] ?? now()->subMonths(1)->startOfMonth();
        $endDate = $filters['end_date'] ?? now()->endOfMonth();
        $departmentId = $filters['department_id'] ?? null;

        // Base query
        $query = Attendance::whereBetween('date', [$startDate, $endDate]);

        if ($departmentId) {
            $query->whereHas('user', fn ($q) => $q->where('department_id', $departmentId));
        }

        // Total records
        $totalRecords = (clone $query)->count();

        // Status breakdown
        $statusBreakdown = (clone $query)
            ->select('status', DB::raw('count(*) as count'))
            ->groupBy('status')
            ->get()
            ->pluck('count', 'status')
            ->toArray();

        $presentCount = $statusBreakdown['present'] ?? 0;
        $absentCount = $statusBreakdown['absent'] ?? 0;
        $lateCount = (clone $query)->where('is_late', true)->count();
        $earlyLeaveCount = (clone $query)->where('is_early_leave', true)->count();

        // Calculate rates
        $presentRate = $totalRecords > 0 ? round(($presentCount / $totalRecords) * 100, 2) : 0;
        $absentRate = $totalRecords > 0 ? round(($absentCount / $totalRecords) * 100, 2) : 0;
        $lateRate = $totalRecords > 0 ? round(($lateCount / $totalRecords) * 100, 2) : 0;

        // Average work hours
        $avgWorkHours = (clone $query)->avg('work_hours') ?? 0;
        $totalOvertimeHours = (clone $query)->sum('overtime_hours') ?? 0;

        // Daily attendance trend
        $dailyTrend = (clone $query)
            ->selectRaw('DATE(date) as date, count(*) as count,
                         sum(case when status = "present" then 1 else 0 end) as present,
                         sum(case when status = "absent" then 1 else 0 end) as absent')
            ->groupBy('date')
            ->orderBy('date')
            ->get()
            ->map(fn ($item) => [
                'date' => $item->date,
                'total' => $item->count,
                'present' => $item->present,
                'absent' => $item->absent,
            ]);

        // Department-wise attendance
        $byDepartment = Attendance::whereBetween('date', [$startDate, $endDate])
            ->join('users', 'attendances.user_id', '=', 'users.id')
            ->join('departments', 'users.department_id', '=', 'departments.id')
            ->select(
                'departments.name as department',
                DB::raw('count(*) as total'),
                DB::raw('sum(case when attendances.status = "present" then 1 else 0 end) as present')
            )
            ->groupBy('departments.id', 'departments.name')
            ->get()
            ->map(fn ($item) => [
                'department' => $item->department,
                'total' => $item->total,
                'present' => $item->present,
                'rate' => $item->total > 0 ? round(($item->present / $item->total) * 100, 2) : 0,
            ]);

        return [
            'present_rate' => $presentRate,
            'absent_rate' => $absentRate,
            'late_rate' => $lateRate,
            'avg_work_hours' => round($avgWorkHours, 2),
            'total_overtime_hours' => round($totalOvertimeHours, 2),
            'present_count' => $presentCount,
            'absent_count' => $absentCount,
            'late_count' => $lateCount,
            'early_leave_count' => $earlyLeaveCount,
            'daily_trend' => $dailyTrend,
            'by_department' => $byDepartment,
        ];
    }

    /**
     * Get payroll metrics
     */
    public function getPayrollMetrics(array $filters = []): array
    {
        $startDate = $filters['start_date'] ?? now()->subMonths(6)->startOfMonth();
        $endDate = $filters['end_date'] ?? now()->endOfMonth();
        $departmentId = $filters['department_id'] ?? null;

        // Base query
        $query = Payroll::whereBetween('pay_period_start', [$startDate, $endDate]);

        if ($departmentId) {
            $query->whereHas('employee', fn ($q) => $q->where('department_id', $departmentId));
        }

        // Total payroll
        $totalPayroll = (clone $query)->sum('net_salary') ?? 0;
        $totalGross = (clone $query)->sum('gross_salary') ?? 0;
        $totalDeductions = (clone $query)->sum('total_deductions') ?? 0;

        // Average salary
        $avgSalary = (clone $query)->avg('net_salary') ?? 0;
        $avgGrossSalary = (clone $query)->avg('gross_salary') ?? 0;

        // Payroll by department
        $byDepartment = Payroll::whereBetween('pay_period_start', [$startDate, $endDate])
            ->join('users', 'payrolls.user_id', '=', 'users.id')
            ->join('departments', 'users.department_id', '=', 'departments.id')
            ->select(
                'departments.name as department',
                DB::raw('sum(payrolls.net_salary) as total_salary'),
                DB::raw('count(*) as employee_count'),
                DB::raw('avg(payrolls.net_salary) as avg_salary')
            )
            ->groupBy('departments.id', 'departments.name')
            ->get()
            ->map(fn ($item) => [
                'department' => $item->department,
                'total_salary' => round($item->total_salary, 2),
                'employee_count' => $item->employee_count,
                'avg_salary' => round($item->avg_salary, 2),
            ]);

        // Monthly payroll trend
        $monthlyTrend = (clone $query)
            ->selectRaw('DATE_FORMAT(pay_period_start, "%Y-%m") as month,
                         sum(net_salary) as total_salary,
                         count(*) as employee_count')
            ->groupBy('month')
            ->orderBy('month')
            ->get()
            ->map(fn ($item) => [
                'month' => $item->month,
                'total_salary' => round($item->total_salary, 2),
                'employee_count' => $item->employee_count,
            ]);

        // Overtime analysis
        $totalOvertimeAmount = (clone $query)->sum('overtime_amount') ?? 0;
        $avgOvertimeHours = (clone $query)->avg('overtime_hours') ?? 0;

        return [
            'total_payroll' => round($totalPayroll, 2),
            'total_gross' => round($totalGross, 2),
            'total_deductions' => round($totalDeductions, 2),
            'avg_salary' => round($avgSalary, 2),
            'avg_gross_salary' => round($avgGrossSalary, 2),
            'by_department' => $byDepartment,
            'monthly_trend' => $monthlyTrend,
            'total_overtime_amount' => round($totalOvertimeAmount, 2),
            'avg_overtime_hours' => round($avgOvertimeHours, 2),
        ];
    }

    /**
     * Get recruitment metrics
     */
    public function getRecruitmentMetrics(array $filters = []): array
    {
        $startDate = $filters['start_date'] ?? now()->subMonths(6)->startOfMonth();
        $endDate = $filters['end_date'] ?? now()->endOfMonth();

        // Active jobs
        $activeJobs = Job::where('status', 'open')->count();
        $totalJobs = Job::whereBetween('created_at', [$startDate, $endDate])->count();

        // Total applications
        $totalApplications = JobApplication::whereBetween('created_at', [$startDate, $endDate])->count();

        // Applications by status
        $applicationsByStatus = JobApplication::whereBetween('created_at', [$startDate, $endDate])
            ->select('status', DB::raw('count(*) as count'))
            ->groupBy('status')
            ->get()
            ->pluck('count', 'status')
            ->toArray();

        $hiredCount = $applicationsByStatus['hired'] ?? 0;
        $rejectedCount = $applicationsByStatus['rejected'] ?? 0;
        $inProgressCount = $totalApplications - $hiredCount - $rejectedCount;

        // Hire rate
        $hireRate = $totalApplications > 0
            ? round(($hiredCount / $totalApplications) * 100, 2)
            : 0;

        // Time to hire (average days from application to hire)
        $avgTimeToHire = JobApplication::whereBetween('created_at', [$startDate, $endDate])
            ->where('status', 'hired')
            ->selectRaw('AVG(DATEDIFF(updated_at, created_at)) as avg_days')
            ->value('avg_days') ?? 0;

        // Applications by source
        $applicationsBySource = JobApplication::whereBetween('created_at', [$startDate, $endDate])
            ->join('job_applicants', 'job_applications.applicant_id', '=', 'job_applicants.id')
            ->select('job_applicants.source', DB::raw('count(*) as count'))
            ->groupBy('job_applicants.source')
            ->get()
            ->map(fn ($item) => [
                'source' => $item->source ?? 'Direct',
                'count' => $item->count,
            ]);

        // Monthly application trend
        $applicationTrend = JobApplication::whereBetween('created_at', [$startDate, $endDate])
            ->selectRaw('DATE_FORMAT(created_at, "%Y-%m") as month,
                         count(*) as applications,
                         sum(case when status = "hired" then 1 else 0 end) as hired')
            ->groupBy('month')
            ->orderBy('month')
            ->get()
            ->map(fn ($item) => [
                'month' => $item->month,
                'applications' => $item->applications,
                'hired' => $item->hired,
            ]);

        // Jobs by department
        $jobsByDepartment = Job::whereBetween('created_at', [$startDate, $endDate])
            ->select('department_id', DB::raw('count(*) as count'))
            ->with('department:id,name')
            ->groupBy('department_id')
            ->get()
            ->map(fn ($item) => [
                'department' => $item->department?->name ?? 'Unassigned',
                'count' => $item->count,
            ]);

        return [
            'active_jobs' => $activeJobs,
            'total_jobs' => $totalJobs,
            'total_applications' => $totalApplications,
            'hired_count' => $hiredCount,
            'rejected_count' => $rejectedCount,
            'in_progress_count' => $inProgressCount,
            'hire_rate' => $hireRate,
            'avg_time_to_hire' => round($avgTimeToHire, 2),
            'applications_by_source' => $applicationsBySource,
            'application_trend' => $applicationTrend,
            'jobs_by_department' => $jobsByDepartment,
        ];
    }

    /**
     * Get all metrics
     */
    public function getAllMetrics(array $filters = []): array
    {
        return [
            'headcount' => $this->getHeadcountMetrics($filters),
            'turnover' => $this->getTurnoverMetrics($filters),
            'attendance' => $this->getAttendanceMetrics($filters),
            'payroll' => $this->getPayrollMetrics($filters),
            'recruitment' => $this->getRecruitmentMetrics($filters),
        ];
    }
}
