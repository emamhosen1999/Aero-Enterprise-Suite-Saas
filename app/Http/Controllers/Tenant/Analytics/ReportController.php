<?php

namespace App\Http\Controllers\Analytics;

use App\Http\Controllers\Controller;
use App\Models\Report;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class ReportController extends Controller
{
    public function index()
    {
        return Inertia::render('Analytics/Reports/Index', [
            'reports' => Report::with(['user', 'category'])
                ->latest()
                ->paginate(10),
            'status' => session('status'),
        ]);
    }

    public function create()
    {
        return Inertia::render('Analytics/Reports/Create', [
            'reportTypes' => [
                ['id' => 'hr', 'name' => 'HR Analytics'],
                ['id' => 'sales', 'name' => 'Sales Performance'],
                ['id' => 'financial', 'name' => 'Financial Metrics'],
                ['id' => 'operational', 'name' => 'Operational KPIs'],
                ['id' => 'project', 'name' => 'Project Analytics'],
                ['id' => 'inventory', 'name' => 'Inventory Analytics'],
                ['id' => 'custom', 'name' => 'Custom Report'],
            ],
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'report_type' => 'required|string',
            'filters' => 'nullable|array',
            'visualization_type' => 'required|string|in:table,bar,line,pie,scatter,heatmap,mixed',
            'is_scheduled' => 'boolean',
            'schedule_frequency' => 'nullable|string|in:daily,weekly,monthly,quarterly',
            'recipients' => 'nullable|array',
            'recipients.*' => 'email',
            'is_public' => 'boolean',
            'status' => 'required|string|in:draft,published,archived',
        ]);

        $report = Report::create([
            'title' => $validated['title'],
            'description' => $validated['description'],
            'report_type' => $validated['report_type'],
            'filters' => $validated['filters'] ?? [],
            'visualization_type' => $validated['visualization_type'],
            'is_scheduled' => $validated['is_scheduled'] ?? false,
            'schedule_frequency' => $validated['schedule_frequency'],
            'recipients' => $validated['recipients'] ?? [],
            'is_public' => $validated['is_public'] ?? false,
            'status' => $validated['status'],
            'user_id' => Auth::id(),
        ]);

        return redirect()->route('analytics.reports.index')->with('status', 'Report created successfully');
    }

    public function show(Report $report)
    {
        // Generate report data based on type and filters
        $reportData = $this->generateReportData($report);

        return Inertia::render('Analytics/Reports/Show', [
            'report' => $report->load(['user', 'category']),
            'reportData' => $reportData,
        ]);
    }

    public function edit(Report $report)
    {
        return Inertia::render('Analytics/Reports/Edit', [
            'report' => $report,
            'reportTypes' => [
                ['id' => 'hr', 'name' => 'HR Analytics'],
                ['id' => 'sales', 'name' => 'Sales Performance'],
                ['id' => 'financial', 'name' => 'Financial Metrics'],
                ['id' => 'operational', 'name' => 'Operational KPIs'],
                ['id' => 'project', 'name' => 'Project Analytics'],
                ['id' => 'inventory', 'name' => 'Inventory Analytics'],
                ['id' => 'custom', 'name' => 'Custom Report'],
            ],
        ]);
    }

    public function update(Request $request, Report $report)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'report_type' => 'required|string',
            'filters' => 'nullable|array',
            'visualization_type' => 'required|string|in:table,bar,line,pie,scatter,heatmap,mixed',
            'is_scheduled' => 'boolean',
            'schedule_frequency' => 'nullable|string|in:daily,weekly,monthly,quarterly',
            'recipients' => 'nullable|array',
            'recipients.*' => 'email',
            'is_public' => 'boolean',
            'status' => 'required|string|in:draft,published,archived',
        ]);

        $report->update([
            'title' => $validated['title'],
            'description' => $validated['description'],
            'report_type' => $validated['report_type'],
            'filters' => $validated['filters'] ?? [],
            'visualization_type' => $validated['visualization_type'],
            'is_scheduled' => $validated['is_scheduled'] ?? false,
            'schedule_frequency' => $validated['schedule_frequency'],
            'recipients' => $validated['recipients'] ?? [],
            'is_public' => $validated['is_public'] ?? false,
            'status' => $validated['status'],
        ]);

        return redirect()->route('analytics.reports.index')->with('status', 'Report updated successfully');
    }

    public function destroy(Report $report)
    {
        $report->delete();

        return redirect()->route('analytics.reports.index')->with('status', 'Report deleted successfully');
    }

    public function export(Report $report)
    {
        // Generate report data
        $reportData = $this->generateReportData($report);

        // Export logic based on report type
        // ...

        return redirect()->route('analytics.reports.show', $report)->with('status', 'Report exported successfully');
    }

    public function schedule(Report $report)
    {
        return Inertia::render('Analytics/Reports/Schedule', [
            'report' => $report,
        ]);
    }

    private function generateReportData(Report $report)
    {
        // Switch based on report type
        switch ($report->report_type) {
            case 'hr':
                return $this->generateHRReport($report);
            case 'sales':
                return $this->generateSalesReport($report);
            case 'financial':
                return $this->generateFinancialReport($report);
            case 'operational':
                return $this->generateOperationalReport($report);
            case 'project':
                return $this->generateProjectReport($report);
            case 'inventory':
                return $this->generateInventoryReport($report);
            case 'custom':
                return $this->generateCustomReport($report);
            default:
                return [
                    'labels' => [],
                    'datasets' => [],
                    'summary' => [],
                ];
        }
    }

    private function generateHRReport(Report $report)
    {
        // Example HR metrics - can be expanded
        $filters = $report->filters ?? [];
        $startDate = $filters['start_date'] ?? now()->subMonths(3)->format('Y-m-d');
        $endDate = $filters['end_date'] ?? now()->format('Y-m-d');

        // Example: Employee headcount by department
        $departmentHeadcount = DB::table('users')
            ->join('model_has_roles', 'users.id', '=', 'model_has_roles.model_id')
            ->join('departments', 'users.department_id', '=', 'departments.id')
            ->select('departments.name', DB::raw('count(*) as count'))
            ->where('model_has_roles.model_type', 'App\\Models\\User')
            ->where('users.created_at', '>=', $startDate)
            ->where('users.created_at', '<=', $endDate)
            ->groupBy('departments.name')
            ->get();

        // Example: Attendance statistics
        $attendanceStats = DB::table('attendances')
            ->select(
                DB::raw('DATE_FORMAT(punch_in_time, "%Y-%m") as month'),
                DB::raw('AVG(TIMESTAMPDIFF(HOUR, punch_in_time, punch_out_time)) as avg_hours'),
                DB::raw('COUNT(DISTINCT user_id) as employee_count')
            )
            ->where('punch_in_time', '>=', $startDate)
            ->where('punch_in_time', '<=', $endDate)
            ->whereNotNull('punch_out_time')
            ->groupBy('month')
            ->orderBy('month')
            ->get();

        return [
            'departmentHeadcount' => $departmentHeadcount,
            'attendanceStats' => $attendanceStats,
            'summary' => [
                'totalEmployees' => DB::table('users')->count(),
                'newHires' => DB::table('users')
                    ->where('created_at', '>=', $startDate)
                    ->where('created_at', '<=', $endDate)
                    ->count(),
                'averageAttendance' => DB::table('attendances')
                    ->where('punch_in_time', '>=', $startDate)
                    ->where('punch_in_time', '<=', $endDate)
                    ->count() / DB::table('users')->count(),
            ],
        ];
    }

    private function generateSalesReport(Report $report)
    {
        // Placeholder for sales report
        return [
            'labels' => ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
            'datasets' => [
                [
                    'label' => 'Sales',
                    'data' => [12, 19, 3, 5, 2, 3],
                ],
            ],
            'summary' => [
                'totalSales' => '$500,000',
                'growth' => '12%',
                'topProduct' => 'Product X',
            ],
        ];
    }

    private function generateFinancialReport(Report $report)
    {
        // Placeholder for financial report
        return [
            'labels' => ['Q1', 'Q2', 'Q3', 'Q4'],
            'datasets' => [
                [
                    'label' => 'Revenue',
                    'data' => [540000, 620000, 580000, 700000],
                ],
                [
                    'label' => 'Expenses',
                    'data' => [430000, 510000, 490000, 580000],
                ],
                [
                    'label' => 'Profit',
                    'data' => [110000, 110000, 90000, 120000],
                ],
            ],
            'summary' => [
                'totalRevenue' => '$2,440,000',
                'totalExpenses' => '$2,010,000',
                'netProfit' => '$430,000',
                'profitMargin' => '17.6%',
            ],
        ];
    }

    private function generateOperationalReport(Report $report)
    {
        // Placeholder for operational report
        return [
            'kpis' => [
                ['name' => 'Efficiency', 'value' => '87%', 'trend' => 'up'],
                ['name' => 'Productivity', 'value' => '92%', 'trend' => 'up'],
                ['name' => 'Quality', 'value' => '98.5%', 'trend' => 'stable'],
                ['name' => 'Downtime', 'value' => '3.2%', 'trend' => 'down'],
            ],
            'summary' => [
                'operationalEfficiency' => 'Good',
                'areasForImprovement' => ['Reduce downtime', 'Optimize inventory management'],
            ],
        ];
    }

    private function generateProjectReport(Report $report)
    {
        // Placeholder for project report
        return [
            'projects' => [
                ['name' => 'Project A', 'progress' => 75, 'status' => 'on-track'],
                ['name' => 'Project B', 'progress' => 40, 'status' => 'delayed'],
                ['name' => 'Project C', 'progress' => 90, 'status' => 'on-track'],
                ['name' => 'Project D', 'progress' => 60, 'status' => 'at-risk'],
            ],
            'summary' => [
                'totalProjects' => 4,
                'onTrack' => 2,
                'delayed' => 1,
                'atRisk' => 1,
            ],
        ];
    }

    private function generateInventoryReport(Report $report)
    {
        // Placeholder for inventory report
        return [
            'inventoryLevels' => [
                ['category' => 'Raw Materials', 'value' => 120000, 'units' => 5000],
                ['category' => 'Work in Progress', 'value' => 80000, 'units' => 2000],
                ['category' => 'Finished Goods', 'value' => 200000, 'units' => 3000],
            ],
            'summary' => [
                'totalInventoryValue' => '$400,000',
                'lowStockItems' => 12,
                'overStockItems' => 8,
            ],
        ];
    }

    private function generateCustomReport(Report $report)
    {
        // Custom report implementation
        $filters = $report->filters ?? [];
        $query = $filters['query'] ?? '';

        // This would be replaced with a safe query builder in production
        // For demo purposes only
        $results = [];

        return [
            'results' => $results,
            'summary' => [
                'queryTime' => '0.5s',
                'resultCount' => count($results),
            ],
        ];
    }
}
