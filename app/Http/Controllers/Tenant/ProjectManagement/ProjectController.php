<?php

namespace App\Http\Controllers\ProjectManagement;

use App\Http\Controllers\Controller;
use App\Models\HRM\Department;
use App\Models\Project;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class ProjectController extends Controller
{
    public function index(Request $request)
    {
        $query = Project::with(['projectLeader', 'teamLeader', 'department', 'tasks', 'milestones']);

        // Apply filters
        if ($request->filled('status')) {
            $query->whereIn('status', $request->status);
        }

        if ($request->filled('priority')) {
            $query->whereIn('priority', $request->priority);
        }

        if ($request->filled('health_status')) {
            $query->whereIn('health_status', $request->health_status);
        }

        if ($request->filled('risk_level')) {
            $query->whereIn('risk_level', $request->risk_level);
        }

        if ($request->filled('department_id')) {
            $query->whereIn('department_id', $request->department_id);
        }

        if ($request->filled('project_leader_id')) {
            $query->whereIn('project_leader_id', $request->project_leader_id);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('project_name', 'like', "%{$search}%")
                    ->orWhere('project_code', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            });
        }

        if ($request->filled('date_range')) {
            $dateRange = $request->date_range;
            if (isset($dateRange['start']) && isset($dateRange['end'])) {
                $query->where(function ($q) use ($dateRange) {
                    $q->whereBetween('start_date', [$dateRange['start'], $dateRange['end']])
                        ->orWhereBetween('end_date', [$dateRange['start'], $dateRange['end']])
                        ->orWhere(function ($q2) use ($dateRange) {
                            $q2->where('start_date', '<=', $dateRange['start'])
                                ->where('end_date', '>=', $dateRange['end']);
                        });
                });
            }
        }

        // Apply sorting
        $sortField = $request->get('sort_by', 'created_at');
        $sortDirection = $request->get('sort_direction', 'desc');

        $allowedSortFields = [
            'project_name',
            'status',
            'priority',
            'start_date',
            'end_date',
            'budget_allocated',
            'progress',
            'created_at',
            'updated_at',
            'health_status',
            'risk_level',
        ];

        if (in_array($sortField, $allowedSortFields)) {
            $query->orderBy($sortField, $sortDirection);
        }

        $perPage = $request->get('per_page', 12);
        $projects = $query->paginate($perPage);

        // Calculate KPIs
        $totalProjects = Project::count();
        $activeProjects = Project::where('status', 'in_progress')->count();
        $completedProjects = Project::where('status', 'completed')->count();
        $overdueTasks = Project::whereHas('tasks', function ($q) {
            $q->where('due_date', '<', now())->where('status', '!=', 'completed');
        })->count();

        $totalBudget = Project::sum('budget_allocated') ?? 0;
        $spentBudget = Project::sum('budget_spent') ?? 0;
        $avgSPI = Project::avg('spi') ?? 1.0;
        $avgCPI = Project::avg('cpi') ?? 1.0;

        $resourceUtilization = 85; // This would be calculated based on actual resource allocation
        $onTimeDeliveryRate = $totalProjects > 0 ?
            (Project::where('status', 'completed')->where('end_date', '<=', now())->count() / $totalProjects) * 100 : 0;

        return Inertia::render('ProjectManagement/Projects/Index', [
            'projects' => $projects,
            'filters' => $request->all(),
            'kpis' => [
                'totalProjects' => $totalProjects,
                'activeProjects' => $activeProjects,
                'completedProjects' => $completedProjects,
                'overdueTasks' => $overdueTasks,
                'totalBudget' => $totalBudget,
                'spentBudget' => $spentBudget,
                'avgSPI' => round($avgSPI, 2),
                'avgCPI' => round($avgCPI, 2),
                'resourceUtilization' => $resourceUtilization,
                'onTimeDeliveryRate' => round($onTimeDeliveryRate, 1),
            ],
            'departments' => \App\Models\HRM\Department::all(['id', 'name']),
            'users' => \App\Models\User::all(['id', 'name']),
            'statusOptions' => [
                ['id' => 'not_started', 'name' => 'Not Started'],
                ['id' => 'in_progress', 'name' => 'In Progress'],
                ['id' => 'on_hold', 'name' => 'On Hold'],
                ['id' => 'completed', 'name' => 'Completed'],
                ['id' => 'cancelled', 'name' => 'Cancelled'],
            ],
            'priorityOptions' => [
                ['id' => 'low', 'name' => 'Low'],
                ['id' => 'medium', 'name' => 'Medium'],
                ['id' => 'high', 'name' => 'High'],
                ['id' => 'critical', 'name' => 'Critical'],
            ],
            'healthOptions' => [
                ['id' => 'good', 'name' => 'Good'],
                ['id' => 'at_risk', 'name' => 'At Risk'],
                ['id' => 'critical', 'name' => 'Critical'],
            ],
            'riskOptions' => [
                ['id' => 'low', 'name' => 'Low'],
                ['id' => 'medium', 'name' => 'Medium'],
                ['id' => 'high', 'name' => 'High'],
                ['id' => 'critical', 'name' => 'Critical'],
            ],
            'status' => session('status'),
        ]);
    }

    public function create()
    {
        return Inertia::render('ProjectManagement/Projects/Create', [
            'departments' => Department::all(),
            'users' => User::all(['id', 'name']),
            'statusOptions' => [
                ['id' => 'not_started', 'name' => 'Not Started'],
                ['id' => 'in_progress', 'name' => 'In Progress'],
                ['id' => 'on_hold', 'name' => 'On Hold'],
                ['id' => 'completed', 'name' => 'Completed'],
                ['id' => 'cancelled', 'name' => 'Cancelled'],
            ],
            'priorityOptions' => [
                ['id' => 'low', 'name' => 'Low'],
                ['id' => 'medium', 'name' => 'Medium'],
                ['id' => 'high', 'name' => 'High'],
                ['id' => 'critical', 'name' => 'Critical'],
            ],
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'project_name' => 'required|string|max:255',
            'client_id' => 'nullable|exists:users,id',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'rate' => 'nullable|numeric',
            'rate_type' => 'nullable|string',
            'priority' => 'required|string',
            'project_leader_id' => 'required|exists:users,id',
            'team_leader_id' => 'nullable|exists:users,id',
            'department_id' => 'nullable|exists:departments,id',
            'description' => 'nullable|string',
            'budget' => 'nullable|numeric',
            'status' => 'required|string',
            'files' => 'nullable|array',
            'color' => 'nullable|string',
        ]);

        $project = Project::create($validated);

        // Handle file uploads
        if ($request->hasFile('files')) {
            foreach ($request->file('files') as $file) {
                $project->addMedia($file)->toMediaCollection('project-files');
            }
        }

        return redirect()->route('project-management.projects.index')->with('status', 'Project created successfully');
    }

    public function show(Project $project)
    {
        $project->load(['projectLeader', 'teamLeader', 'department', 'milestones', 'resources.user']);

        return Inertia::render('ProjectManagement/Projects/Show', [
            'project' => $project,
            'statusOptions' => [
                ['id' => 'not_started', 'name' => 'Not Started'],
                ['id' => 'in_progress', 'name' => 'In Progress'],
                ['id' => 'on_hold', 'name' => 'On Hold'],
                ['id' => 'completed', 'name' => 'Completed'],
                ['id' => 'cancelled', 'name' => 'Cancelled'],
            ],
            'priorityOptions' => [
                ['id' => 'low', 'name' => 'Low'],
                ['id' => 'medium', 'name' => 'Medium'],
                ['id' => 'high', 'name' => 'High'],
                ['id' => 'critical', 'name' => 'Critical'],
            ],
        ]);
    }

    public function edit(Project $project)
    {
        return Inertia::render('ProjectManagement/Projects/Edit', [
            'project' => $project,
            'departments' => Department::all(),
            'users' => User::all(['id', 'name']),
            'statusOptions' => [
                ['id' => 'not_started', 'name' => 'Not Started'],
                ['id' => 'in_progress', 'name' => 'In Progress'],
                ['id' => 'on_hold', 'name' => 'On Hold'],
                ['id' => 'completed', 'name' => 'Completed'],
                ['id' => 'cancelled', 'name' => 'Cancelled'],
            ],
            'priorityOptions' => [
                ['id' => 'low', 'name' => 'Low'],
                ['id' => 'medium', 'name' => 'Medium'],
                ['id' => 'high', 'name' => 'High'],
                ['id' => 'critical', 'name' => 'Critical'],
            ],
        ]);
    }

    public function update(Request $request, Project $project)
    {
        $validated = $request->validate([
            'project_name' => 'required|string|max:255',
            'client_id' => 'nullable|exists:users,id',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'rate' => 'nullable|numeric',
            'rate_type' => 'nullable|string',
            'priority' => 'required|string',
            'project_leader_id' => 'required|exists:users,id',
            'team_leader_id' => 'nullable|exists:users,id',
            'department_id' => 'nullable|exists:departments,id',
            'description' => 'nullable|string',
            'budget' => 'nullable|numeric',
            'status' => 'required|string',
            'color' => 'nullable|string',
        ]);

        $project->update($validated);

        // Handle file uploads
        if ($request->hasFile('files')) {
            foreach ($request->file('files') as $file) {
                $project->addMedia($file)->toMediaCollection('project-files');
            }
        }

        return redirect()->route('project-management.projects.index')->with('status', 'Project updated successfully');
    }

    public function destroy(Project $project)
    {
        $project->delete();

        return redirect()->route('project-management.projects.index')->with('status', 'Project deleted successfully');
    }

    public function dashboard()
    {
        $projects = Project::with(['projectLeader', 'teamLeader'])
            ->latest()
            ->get();

        $projectsByStatus = $projects->groupBy('status')->map->count();
        $projectsByPriority = $projects->groupBy('priority')->map->count();

        return Inertia::render('ProjectManagement/Dashboard', [
            'projects' => $projects->take(5),
            'projectStats' => [
                'total' => $projects->count(),
                'in_progress' => $projects->where('status', 'in_progress')->count(),
                'completed' => $projects->where('status', 'completed')->count(),
                'overdue' => $projects->where('end_date', '<', now())->where('status', '!=', 'completed')->count(),
            ],
            'projectsByStatus' => $projectsByStatus,
            'projectsByPriority' => $projectsByPriority,
        ]);
    }

    /**
     * Get portfolio analytics data
     */
    public function portfolioAnalytics(Request $request)
    {
        $projects = Project::with(['projectLeader', 'teamLeader', 'department', 'tasks', 'milestones'])->get();

        // Status distribution
        $statusDistribution = $projects->groupBy('status')->map->count();

        // Priority distribution
        $priorityDistribution = $projects->groupBy('priority')->map->count();

        // Health distribution
        $healthDistribution = $projects->groupBy('health_status')->map->count();

        // Risk distribution
        $riskDistribution = $projects->groupBy('risk_level')->map->count();

        // Budget analysis
        $budgetAnalysis = [
            'total_allocated' => $projects->sum('budget_allocated'),
            'total_spent' => $projects->sum('budget_spent'),
            'avg_utilization' => $projects->avg('budget_spent') / max($projects->avg('budget_allocated'), 1) * 100,
            'over_budget_count' => $projects->where('budget_spent', '>', 'budget_allocated')->count(),
        ];

        // Timeline analysis
        $timelineAnalysis = [
            'avg_duration' => $projects->map(function ($project) {
                return \Carbon\Carbon::parse($project->start_date)->diffInDays($project->end_date);
            })->avg(),
            'overdue_count' => $projects->where('end_date', '<', now())->where('status', '!=', 'completed')->count(),
            'completed_on_time' => $projects->where('status', 'completed')->where('end_date', '<=', now())->count(),
        ];

        // Performance metrics
        $performanceMetrics = [
            'avg_spi' => $projects->avg('spi') ?? 1.0,
            'avg_cpi' => $projects->avg('cpi') ?? 1.0,
            'projects_on_track' => $projects->where('health_status', 'good')->count(),
            'projects_at_risk' => $projects->where('health_status', 'at_risk')->count(),
            'projects_critical' => $projects->where('health_status', 'critical')->count(),
        ];

        return response()->json([
            'status_distribution' => $statusDistribution,
            'priority_distribution' => $priorityDistribution,
            'health_distribution' => $healthDistribution,
            'risk_distribution' => $riskDistribution,
            'budget_analysis' => $budgetAnalysis,
            'timeline_analysis' => $timelineAnalysis,
            'performance_metrics' => $performanceMetrics,
        ]);
    }

    /**
     * Bulk update projects
     */
    public function bulkUpdate(Request $request)
    {
        $validated = $request->validate([
            'project_ids' => 'required|array|min:1',
            'project_ids.*' => 'exists:projects,id',
            'action' => 'required|string|in:update_status,update_priority,update_health,update_risk,assign_leader,update_department,archive,delete',
            'data' => 'required|array',
        ]);

        $projects = Project::whereIn('id', $validated['project_ids']);

        $updatedCount = 0;

        switch ($validated['action']) {
            case 'update_status':
                $updatedCount = $projects->update(['status' => $validated['data']['status']]);
                break;

            case 'update_priority':
                $updatedCount = $projects->update(['priority' => $validated['data']['priority']]);
                break;

            case 'update_health':
                $updatedCount = $projects->update(['health_status' => $validated['data']['health_status']]);
                break;

            case 'update_risk':
                $updatedCount = $projects->update(['risk_level' => $validated['data']['risk_level']]);
                break;

            case 'assign_leader':
                $updatedCount = $projects->update(['project_leader_id' => $validated['data']['project_leader_id']]);
                break;

            case 'update_department':
                $updatedCount = $projects->update(['department_id' => $validated['data']['department_id']]);
                break;

            case 'archive':
                $updatedCount = $projects->update(['status' => 'archived']);
                break;

            case 'delete':
                $updatedCount = $projects->count();
                $projects->delete();
                break;
        }

        // Log audit trail
        foreach ($validated['project_ids'] as $projectId) {
            Log::info('Bulk action performed', [
                'project_id' => $projectId,
                'action' => $validated['action'],
                'user_id' => Auth::id(),
                'data' => $validated['data'],
            ]);
        }

        return response()->json([
            'success' => true,
            'updated_count' => $updatedCount,
            'message' => "Successfully {$validated['action']} {$updatedCount} projects",
        ]);
    }

    /**
     * Export projects data
     */
    public function export(Request $request)
    {
        $validated = $request->validate([
            'format' => 'required|string|in:csv,xlsx,pdf',
            'project_ids' => 'array',
            'project_ids.*' => 'exists:projects,id',
            'columns' => 'array',
            'filters' => 'array',
        ]);

        $query = Project::with(['projectLeader', 'teamLeader', 'department', 'tasks', 'milestones']);

        // Apply filters if provided
        if (isset($validated['filters'])) {
            $filters = $validated['filters'];

            if (isset($filters['status'])) {
                $query->whereIn('status', $filters['status']);
            }

            if (isset($filters['priority'])) {
                $query->whereIn('priority', $filters['priority']);
            }

            if (isset($filters['department_id'])) {
                $query->whereIn('department_id', $filters['department_id']);
            }
        }

        // Apply project IDs filter if provided
        if (isset($validated['project_ids'])) {
            $query->whereIn('id', $validated['project_ids']);
        }

        $projects = $query->get();

        // Select columns
        $columns = $validated['columns'] ?? [
            'project_name',
            'project_code',
            'status',
            'priority',
            'health_status',
            'risk_level',
            'start_date',
            'end_date',
            'budget_allocated',
            'budget_spent',
            'progress',
            'spi',
            'cpi',
            'methodology',
        ];

        // Generate export based on format
        switch ($validated['format']) {
            case 'csv':
                return $this->exportToCsv($projects, $columns);

            case 'xlsx':
                return $this->exportToExcel($projects, $columns);

            case 'pdf':
                return $this->exportToPdf($projects, $columns);
        }
    }

    /**
     * Get project timeline data for Gantt view
     */
    public function timeline(Request $request)
    {
        $projects = Project::with(['projectLeader', 'teamLeader', 'milestones'])
            ->where('status', '!=', 'cancelled')
            ->orderBy('start_date')
            ->get();

        $timelineData = $projects->map(function ($project) {
            return [
                'id' => $project->id,
                'name' => $project->project_name,
                'start' => $project->start_date,
                'end' => $project->end_date,
                'progress' => $project->progress ?? 0,
                'status' => $project->status,
                'priority' => $project->priority,
                'health' => $project->health_status,
                'leader' => $project->projectLeader->name ?? 'Unassigned',
                'milestones' => $project->milestones->map(function ($milestone) {
                    return [
                        'id' => $milestone->id,
                        'name' => $milestone->name,
                        'date' => $milestone->due_date,
                        'status' => $milestone->status,
                    ];
                }),
            ];
        });

        return response()->json([
            'projects' => $timelineData,
            'date_range' => [
                'start' => $projects->min('start_date'),
                'end' => $projects->max('end_date'),
            ],
        ]);
    }

    /**
     * Get portfolio matrix data (BCG analysis)
     */
    public function portfolioMatrix(Request $request)
    {
        $projects = Project::with(['projectLeader', 'teamLeader', 'department'])->get();

        $matrixData = $projects->map(function ($project) {
            // Calculate value score (0-100) based on budget, strategic importance, etc.
            $valueScore = $this->calculateValueScore($project);

            // Calculate risk score (0-100) based on complexity, timeline, resources
            $riskScore = $this->calculateRiskScore($project);

            return [
                'id' => $project->id,
                'name' => $project->project_name,
                'value_score' => $valueScore,
                'risk_score' => $riskScore,
                'status' => $project->status,
                'priority' => $project->priority,
                'budget' => $project->budget_allocated,
                'health' => $project->health_status,
                'quadrant' => $this->getQuadrant($valueScore, $riskScore),
            ];
        });

        return response()->json([
            'projects' => $matrixData,
            'quadrants' => [
                'stars' => $matrixData->where('quadrant', 'stars')->count(),
                'question_marks' => $matrixData->where('quadrant', 'question_marks')->count(),
                'cash_cows' => $matrixData->where('quadrant', 'cash_cows')->count(),
                'dogs' => $matrixData->where('quadrant', 'dogs')->count(),
            ],
        ]);
    }

    /**
     * Save user preferences
     */
    public function savePreferences(Request $request)
    {
        $validated = $request->validate([
            'view_mode' => 'string|in:grid,list,timeline,matrix',
            'per_page' => 'integer|min:6|max:100',
            'sort_by' => 'string',
            'sort_direction' => 'string|in:asc,desc',
            'filters' => 'array',
        ]);

        // TODO: Implement user preferences storage
        // For now, just return success
        return response()->json(['success' => true]);
    }

    /**
     * Get user preferences
     */
    public function getPreferences()
    {
        // TODO: Implement user preferences retrieval
        // For now, return default preferences
        return response()->json([
            'view_mode' => 'grid',
            'per_page' => 12,
            'sort_by' => 'created_at',
            'sort_direction' => 'desc',
            'filters' => [],
        ]);
    }

    // Helper methods
    private function calculateValueScore($project)
    {
        $score = 0;

        // Budget weight (40%)
        $budgetScore = min(($project->budget_allocated / 1000000) * 40, 40);
        $score += $budgetScore;

        // Strategic importance based on priority (30%)
        $priorityScores = ['low' => 5, 'medium' => 15, 'high' => 25, 'critical' => 30];
        $score += $priorityScores[$project->priority] ?? 15;

        // Business value based on department (20%)
        $deptScores = ['IT' => 20, 'Operations' => 18, 'Finance' => 16, 'HR' => 14];
        $score += $deptScores[$project->department->name ?? 'Other'] ?? 10;

        // ROI potential (10%)
        $score += 10; // This would be calculated based on actual ROI data

        return min($score, 100);
    }

    private function calculateRiskScore($project)
    {
        $score = 0;

        // Complexity based on timeline (30%)
        $duration = \Carbon\Carbon::parse($project->start_date)->diffInDays($project->end_date);
        $complexityScore = min(($duration / 365) * 30, 30);
        $score += $complexityScore;

        // Resource availability (25%)
        $resourceScore = 15; // This would be calculated based on actual resource allocation
        $score += $resourceScore;

        // Technology risk (25%)
        $technologyScore = 15; // This would be based on technology complexity
        $score += $technologyScore;

        // Market/External risk (20%)
        $marketScore = 10; // This would be based on external factors
        $score += $marketScore;

        return min($score, 100);
    }

    private function getQuadrant($valueScore, $riskScore)
    {
        if ($valueScore >= 50 && $riskScore < 50) {
            return 'stars'; // High value, low risk
        } elseif ($valueScore >= 50 && $riskScore >= 50) {
            return 'question_marks'; // High value, high risk
        } elseif ($valueScore < 50 && $riskScore < 50) {
            return 'cash_cows'; // Low value, low risk
        } else {
            return 'dogs'; // Low value, high risk
        }
    }

    private function exportToCsv($projects, $columns)
    {
        $filename = 'projects_export_'.now()->format('Y_m_d_H_i_s').'.csv';

        return response()->stream(function () use ($projects, $columns) {
            $handle = fopen('php://output', 'w');

            // Write header
            fputcsv($handle, $columns);

            // Write data
            foreach ($projects as $project) {
                $row = [];
                foreach ($columns as $column) {
                    $row[] = $this->getColumnValue($project, $column);
                }
                fputcsv($handle, $row);
            }

            fclose($handle);
        }, 200, [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => "attachment; filename=\"$filename\"",
        ]);
    }

    private function exportToExcel($projects, $columns)
    {
        // This would use Laravel Excel package
        // For now, return CSV format
        return $this->exportToCsv($projects, $columns);
    }

    private function exportToPdf($projects, $columns)
    {
        // This would use DomPDF or similar package
        // For now, return CSV format
        return $this->exportToCsv($projects, $columns);
    }

    private function getColumnValue($project, $column)
    {
        switch ($column) {
            case 'project_name':
                return $project->project_name;
            case 'project_code':
                return $project->project_code;
            case 'status':
                return $project->status;
            case 'priority':
                return $project->priority;
            case 'health_status':
                return $project->health_status;
            case 'risk_level':
                return $project->risk_level;
            case 'start_date':
                return $project->start_date;
            case 'end_date':
                return $project->end_date;
            case 'budget_allocated':
                return $project->budget_allocated;
            case 'budget_spent':
                return $project->budget_spent;
            case 'progress':
                return $project->progress.'%';
            case 'spi':
                return $project->spi;
            case 'cpi':
                return $project->cpi;
            case 'methodology':
                return $project->methodology;
            case 'department':
                return $project->department->name ?? 'N/A';
            case 'project_leader':
                return $project->projectLeader->name ?? 'N/A';
            default:
                return '';
        }
    }
}
