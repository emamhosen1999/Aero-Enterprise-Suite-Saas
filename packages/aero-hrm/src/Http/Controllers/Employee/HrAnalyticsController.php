<?php

namespace Aero\HRM\Http\Controllers\Employee;

use Aero\HRM\Models\Department;
use Aero\HRM\Http\Controllers\Controller;
use Aero\HRM\Services\HRMetricsAggregatorService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class HrAnalyticsController extends Controller
{
    public function __construct(
        public HRMetricsAggregatorService $metricsService
    ) {}

    public function index(Request $request)
    {
        $filters = [
            'start_date' => $request->input('start_date', now()->subMonths(6)->startOfMonth()),
            'end_date' => $request->input('end_date', now()->endOfMonth()),
            'department_id' => $request->input('department_id'),
        ];

        $metrics = $this->metricsService->getAllMetrics($filters);

        $departments = Department::select('id', 'name')->orderBy('name')->get();

        return Inertia::render('Pages/HRM/Analytics/Index', [
            'title' => 'HR Analytics Dashboard',
            'metrics' => $metrics,
            'departments' => $departments,
            'filters' => $filters,
        ]);
    }

    public function attendanceAnalytics(Request $request)
    {
        $filters = [
            'start_date' => $request->input('start_date', now()->subMonths(1)->startOfMonth()),
            'end_date' => $request->input('end_date', now()->endOfMonth()),
            'department_id' => $request->input('department_id'),
        ];

        $metrics = $this->metricsService->getAttendanceMetrics($filters);
        $departments = Department::select('id', 'name')->orderBy('name')->get();

        return Inertia::render('Pages/HRM/Analytics/Attendance', [
            'title' => 'Attendance Analytics',
            'data' => $metrics,
            'departments' => $departments,
            'filters' => $filters,
        ]);
    }

    public function performanceAnalytics()
    {
        return Inertia::render('Pages/HRM/Analytics/Performance', [
            'title' => 'Performance Analytics',
            'data' => [],
        ]);
    }

    public function recruitmentAnalytics(Request $request)
    {
        $filters = [
            'start_date' => $request->input('start_date', now()->subMonths(6)->startOfMonth()),
            'end_date' => $request->input('end_date', now()->endOfMonth()),
        ];

        $metrics = $this->metricsService->getRecruitmentMetrics($filters);

        return Inertia::render('Pages/HRM/Analytics/Recruitment', [
            'title' => 'Recruitment Analytics',
            'data' => $metrics,
            'filters' => $filters,
        ]);
    }

    public function turnoverAnalytics(Request $request)
    {
        $filters = [
            'start_date' => $request->input('start_date', now()->subMonths(6)->startOfMonth()),
            'end_date' => $request->input('end_date', now()->endOfMonth()),
        ];

        $metrics = $this->metricsService->getTurnoverMetrics($filters);

        return Inertia::render('Pages/HRM/Analytics/Turnover', [
            'title' => 'Turnover Analytics',
            'data' => $metrics,
            'filters' => $filters,
        ]);
    }

    public function trainingAnalytics()
    {
        return Inertia::render('Pages/HRM/Analytics/Training', [
            'title' => 'Training Analytics',
            'data' => [],
        ]);
    }

    public function reports()
    {
        return Inertia::render('Pages/HRM/Analytics/Reports', [
            'title' => 'HR Reports',
            'reports' => [],
        ]);
    }

    public function generateReport(Request $request)
    {
        // Implementation for generating reports
        return response()->json(['message' => 'Report generated successfully']);
    }
}
