<?php

namespace Aero\Project\Http\Controllers;

use Aero\Core\Services\DashboardWidgetRegistry;
use Aero\Project\Models\Project;
use Aero\Project\Models\Task;
use Illuminate\Routing\Controller;
use Inertia\Inertia;

class ProjectDashboardController extends Controller
{
    public function __construct(
        protected DashboardWidgetRegistry $widgetRegistry
    ) {}

    public function index()
    {
        $stats = [
            'total_projects' => Project::count(),
            'active_projects' => Project::where('status', 'in_progress')->count(),
            'completed_projects' => Project::where('status', 'completed')->count(),
            'pending_tasks' => Task::where('status', 'pending')->count(),
        ];

        // Get dynamic widgets for Project dashboard
        $dynamicWidgets = $this->widgetRegistry->getWidgetsForFrontend('project');

        return Inertia::render('Project/Dashboard', [
            'title' => 'Project Dashboard',
            'stats' => $stats,
            'dynamicWidgets' => $dynamicWidgets,
        ]);
    }
}
