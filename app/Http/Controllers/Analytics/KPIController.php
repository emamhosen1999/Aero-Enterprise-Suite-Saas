<?php

namespace App\Http\Controllers\Analytics;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;

class KPIController extends Controller
{
    public function index()
    {
        // Mock KPIs data - would be fetched from database in real implementation
        $kpis = [
            [
                'id' => 1,
                'name' => 'Employee Retention Rate',
                'category' => 'HR',
                'current_value' => 85,
                'target_value' => 90,
                'unit' => '%',
                'trend' => 'increasing',
                'frequency' => 'monthly',
                'last_updated' => '2023-12-01',
            ],
            [
                'id' => 2,
                'name' => 'Project Completion Rate',
                'category' => 'Projects',
                'current_value' => 78,
                'target_value' => 85,
                'unit' => '%',
                'trend' => 'stable',
                'frequency' => 'quarterly',
                'last_updated' => '2023-12-15',
            ],
            [
                'id' => 3,
                'name' => 'Average Resolution Time',
                'category' => 'Helpdesk',
                'current_value' => 4.5,
                'target_value' => 2,
                'unit' => 'hours',
                'trend' => 'decreasing',
                'frequency' => 'daily',
                'last_updated' => '2024-01-02',
            ],
        ];

        return Inertia::render('Analytics/KPIs/Index', [
            'kpis' => $kpis,
            'status' => session('status'),
        ]);
    }

    public function create()
    {
        return Inertia::render('Analytics/KPIs/Create', [
            'kpiCategories' => [
                ['id' => 'hr', 'name' => 'HR Metrics'],
                ['id' => 'sales', 'name' => 'Sales Performance'],
                ['id' => 'financial', 'name' => 'Financial Metrics'],
                ['id' => 'operational', 'name' => 'Operational Metrics'],
                ['id' => 'project', 'name' => 'Project Metrics'],
                ['id' => 'customer', 'name' => 'Customer Metrics'],
                ['id' => 'quality', 'name' => 'Quality Metrics'],
            ],
            'frequencies' => [
                ['id' => 'daily', 'name' => 'Daily'],
                ['id' => 'weekly', 'name' => 'Weekly'],
                ['id' => 'monthly', 'name' => 'Monthly'],
                ['id' => 'quarterly', 'name' => 'Quarterly'],
                ['id' => 'yearly', 'name' => 'Yearly'],
            ],
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'category' => 'required|string',
            'target_value' => 'required|numeric',
            'unit' => 'required|string|max:20',
            'frequency' => 'required|string',
            'formula' => 'nullable|string',
            'data_source' => 'nullable|string',
            'responsible_persons' => 'nullable|array',
        ]);

        // Create KPI logic here

        return redirect()->route('analytics.kpi.index')->with('status', 'KPI created successfully');
    }

    public function show($id)
    {
        // Fetch KPI data
        $kpi = [
            'id' => $id,
            'name' => 'Employee Retention Rate',
            'description' => 'Measures the percentage of employees who remain with the company over a specified period',
            'category' => 'hr',
            'current_value' => 85,
            'target_value' => 90,
            'unit' => '%',
            'trend' => 'increasing',
            'frequency' => 'monthly',
            'last_updated' => '2023-12-01',
            'historical_data' => [
                ['date' => '2023-01-01', 'value' => 80],
                ['date' => '2023-02-01', 'value' => 82],
                ['date' => '2023-03-01', 'value' => 81],
                ['date' => '2023-04-01', 'value' => 83],
                ['date' => '2023-05-01', 'value' => 82],
                ['date' => '2023-06-01', 'value' => 84],
                ['date' => '2023-07-01', 'value' => 83],
                ['date' => '2023-08-01', 'value' => 85],
                ['date' => '2023-09-01', 'value' => 84],
                ['date' => '2023-10-01', 'value' => 86],
                ['date' => '2023-11-01', 'value' => 85],
                ['date' => '2023-12-01', 'value' => 85],
            ],
        ];

        return Inertia::render('Analytics/KPIs/Show', [
            'kpi' => $kpi,
        ]);
    }

    public function edit($id)
    {
        $kpi = [
            'id' => $id,
            'name' => 'Employee Retention Rate',
            'description' => 'Measures the percentage of employees who remain with the company over a specified period',
            'category' => 'hr',
            'current_value' => 85,
            'target_value' => 90,
            'unit' => '%',
            'trend' => 'increasing',
            'frequency' => 'monthly',
            'last_updated' => '2023-12-01',
        ];

        return Inertia::render('Analytics/KPIs/Edit', [
            'kpi' => $kpi,
            'kpiCategories' => [
                ['id' => 'hr', 'name' => 'HR Metrics'],
                ['id' => 'sales', 'name' => 'Sales Performance'],
                ['id' => 'financial', 'name' => 'Financial Metrics'],
                ['id' => 'operational', 'name' => 'Operational Metrics'],
                ['id' => 'project', 'name' => 'Project Metrics'],
                ['id' => 'customer', 'name' => 'Customer Metrics'],
                ['id' => 'quality', 'name' => 'Quality Metrics'],
            ],
            'frequencies' => [
                ['id' => 'daily', 'name' => 'Daily'],
                ['id' => 'weekly', 'name' => 'Weekly'],
                ['id' => 'monthly', 'name' => 'Monthly'],
                ['id' => 'quarterly', 'name' => 'Quarterly'],
                ['id' => 'yearly', 'name' => 'Yearly'],
            ],
        ]);
    }

    public function update(Request $request, $id)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'category' => 'required|string',
            'target_value' => 'required|numeric',
            'unit' => 'required|string|max:20',
            'frequency' => 'required|string',
            'formula' => 'nullable|string',
            'data_source' => 'nullable|string',
            'responsible_persons' => 'nullable|array',
        ]);

        // Update KPI logic here

        return redirect()->route('analytics.kpi.index')->with('status', 'KPI updated successfully');
    }

    public function destroy($id)
    {
        // Delete KPI logic here

        return redirect()->route('analytics.kpi.index')->with('status', 'KPI deleted successfully');
    }

    public function logValue(Request $request, $id)
    {
        $validated = $request->validate([
            'value' => 'required|numeric',
            'date' => 'required|date',
            'notes' => 'nullable|string',
        ]);

        // Log KPI value logic here

        return redirect()->route('analytics.kpi.show', $id)->with('status', 'KPI value logged successfully');
    }
}
