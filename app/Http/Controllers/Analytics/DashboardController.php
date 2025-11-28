<?php

namespace App\Http\Controllers\Analytics;

use App\Http\Controllers\Controller;
use App\Models\DailyWork;
use App\Models\HRM\Attendance;
use App\Models\HRM\Leave;
use App\Models\Project;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index()
    {
        // Get summary statistics for dashboard
        $userCount = User::count();
        $projectCount = Project::count();
        $taskCount = DailyWork::count();

        // Get attendance statistics
        $attendanceStats = Attendance::selectRaw('date(created_at) as date, count(*) as count')
            ->where('created_at', '>=', now()->subDays(30))
            ->groupBy('date')
            ->get();

        // Get leave statistics
        $leaveStats = Leave::selectRaw('status, count(*) as count')
            ->groupBy('status')
            ->get();

        // Get project completion statistics
        $projectStats = Project::selectRaw('status, count(*) as count')
            ->groupBy('status')
            ->get();

        // Get task completion statistics
        $taskStats = DailyWork::selectRaw('status, count(*) as count')
            ->groupBy('status')
            ->get();

        return Inertia::render('Analytics/Dashboards/Index', [
            'statistics' => [
                'users' => $userCount,
                'projects' => $projectCount,
                'tasks' => $taskCount,
            ],
            'attendanceStats' => $attendanceStats,
            'leaveStats' => $leaveStats,
            'projectStats' => $projectStats,
            'taskStats' => $taskStats,
        ]);
    }

    public function create()
    {
        return Inertia::render('Analytics/Dashboards/Create', [
            'dashboardTypes' => [
                ['id' => 'hr', 'name' => 'HR Dashboard'],
                ['id' => 'sales', 'name' => 'Sales Dashboard'],
                ['id' => 'financial', 'name' => 'Financial Dashboard'],
                ['id' => 'operational', 'name' => 'Operational Dashboard'],
                ['id' => 'project', 'name' => 'Project Dashboard'],
                ['id' => 'executive', 'name' => 'Executive Dashboard'],
            ],
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'dashboard_type' => 'required|string',
            'widgets' => 'nullable|array',
            'is_public' => 'boolean',
            'refresh_interval' => 'nullable|integer|min:0',
        ]);

        // Create dashboard logic here

        return redirect()->route('analytics.dashboards.index')->with('status', 'Dashboard created successfully');
    }

    public function show($id)
    {
        // Fetch dashboard data

        return Inertia::render('Analytics/Dashboards/Show', [
            'dashboard' => [
                'id' => $id,
                'title' => 'Sample Dashboard',
                'description' => 'This is a sample dashboard',
                'dashboard_type' => 'executive',
                'widgets' => $this->getDashboardWidgets($id),
            ],
        ]);
    }

    public function edit($id)
    {
        return Inertia::render('Analytics/Dashboards/Edit', [
            'dashboard' => [
                'id' => $id,
                'title' => 'Sample Dashboard',
                'description' => 'This is a sample dashboard',
                'dashboard_type' => 'executive',
                'widgets' => $this->getDashboardWidgets($id),
            ],
            'dashboardTypes' => [
                ['id' => 'hr', 'name' => 'HR Dashboard'],
                ['id' => 'sales', 'name' => 'Sales Dashboard'],
                ['id' => 'financial', 'name' => 'Financial Dashboard'],
                ['id' => 'operational', 'name' => 'Operational Dashboard'],
                ['id' => 'project', 'name' => 'Project Dashboard'],
                ['id' => 'executive', 'name' => 'Executive Dashboard'],
            ],
        ]);
    }

    public function update(Request $request, $id)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'dashboard_type' => 'required|string',
            'widgets' => 'nullable|array',
            'is_public' => 'boolean',
            'refresh_interval' => 'nullable|integer|min:0',
        ]);

        // Update dashboard logic here

        return redirect()->route('analytics.dashboards.index')->with('status', 'Dashboard updated successfully');
    }

    public function destroy($id)
    {
        // Delete dashboard logic here

        return redirect()->route('analytics.dashboards.index')->with('status', 'Dashboard deleted successfully');
    }

    private function getDashboardWidgets($dashboardId)
    {
        // Mock widget data - would be fetched from database in real implementation
        return [
            [
                'id' => 1,
                'title' => 'Employee Attendance',
                'type' => 'chart',
                'chart_type' => 'line',
                'size' => 'medium',
                'position' => 1,
                'data' => [
                    'labels' => ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
                    'datasets' => [
                        [
                            'label' => 'Present',
                            'data' => [42, 45, 40, 46, 39],
                            'backgroundColor' => 'rgba(75, 192, 192, 0.2)',
                            'borderColor' => 'rgba(75, 192, 192, 1)',
                        ],
                        [
                            'label' => 'Absent',
                            'data' => [8, 5, 10, 4, 11],
                            'backgroundColor' => 'rgba(255, 99, 132, 0.2)',
                            'borderColor' => 'rgba(255, 99, 132, 1)',
                        ],
                    ],
                ],
            ],
            [
                'id' => 2,
                'title' => 'Project Status',
                'type' => 'chart',
                'chart_type' => 'pie',
                'size' => 'small',
                'position' => 2,
                'data' => [
                    'labels' => ['Completed', 'In Progress', 'Planned', 'Delayed'],
                    'datasets' => [
                        [
                            'data' => [12, 19, 8, 5],
                            'backgroundColor' => [
                                'rgba(75, 192, 192, 0.2)',
                                'rgba(54, 162, 235, 0.2)',
                                'rgba(255, 206, 86, 0.2)',
                                'rgba(255, 99, 132, 0.2)',
                            ],
                            'borderColor' => [
                                'rgba(75, 192, 192, 1)',
                                'rgba(54, 162, 235, 1)',
                                'rgba(255, 206, 86, 1)',
                                'rgba(255, 99, 132, 1)',
                            ],
                        ],
                    ],
                ],
            ],
        ];
    }
}
