<?php

declare(strict_types=1);

namespace Aero\Project\Http\Controllers;

use Aero\Project\Http\Requests\StoreProjectSprintRequest;
use Aero\Project\Http\Requests\UpdateProjectSprintRequest;
use Aero\Project\Models\Project;
use Aero\Project\Models\ProjectActivityLog;
use Aero\Project\Models\ProjectSprint;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

/**
 * ProjectSprintController
 *
 * Handles CRUD operations for project sprints (Agile methodology).
 */
class ProjectSprintController extends Controller
{
    /**
     * Display sprints for a project.
     */
    public function index(Request $request, Project $project): Response|JsonResponse
    {
        $query = $project->sprints()
            ->withCount('tasks')
            ->orderBy('start_date', 'desc');

        // Filter by status
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $sprints = $query->paginate($request->input('per_page', 10));

        // Stats
        $stats = [
            'total' => $project->sprints()->count(),
            'active' => $project->sprints()->active()->count(),
            'completed' => $project->sprints()->completed()->count(),
            'average_velocity' => $project->sprints()
                ->completed()
                ->avg('velocity') ?? 0,
        ];

        if ($request->wantsJson()) {
            return response()->json([
                'sprints' => $sprints,
                'stats' => $stats,
            ]);
        }

        return Inertia::render('Project/Sprints/Index', [
            'project' => $project->only(['id', 'project_name', 'code', 'methodology']),
            'sprints' => $sprints,
            'stats' => $stats,
            'activeSprint' => $project->activeSprint,
            'filters' => $request->only(['status']),
        ]);
    }

    /**
     * Show create form.
     */
    public function create(Project $project): Response
    {
        return Inertia::render('Project/Sprints/Create', [
            'project' => $project->only(['id', 'project_name', 'code', 'sprint_duration']),
            'statusOptions' => ProjectSprint::getStatusOptions(),
        ]);
    }

    /**
     * Store a new sprint.
     */
    public function store(StoreProjectSprintRequest $request, Project $project): JsonResponse
    {
        $validated = $request->validated();

        $validated['project_id'] = $project->id;
        $validated['status'] = ProjectSprint::STATUS_PLANNED;

        $sprint = ProjectSprint::create($validated);

        ProjectActivityLog::logCreated($project->id, $sprint);

        return response()->json([
            'message' => 'Sprint created successfully.',
            'sprint' => $sprint,
        ]);
    }

    /**
     * Show a specific sprint with its tasks.
     */
    public function show(Project $project, ProjectSprint $sprint): Response
    {
        $sprint->load(['tasks' => function ($query) {
            $query->orderBy('position')->with('labels');
        }]);

        // Group tasks by status for board view
        $tasksByStatus = $sprint->tasks->groupBy('status');

        return Inertia::render('Project/Sprints/Show', [
            'project' => $project->only(['id', 'project_name', 'code']),
            'sprint' => $sprint,
            'tasksByStatus' => $tasksByStatus,
            'backlogTasks' => $project->tasks()
                ->whereNull('sprint_id')
                ->orderBy('position')
                ->get(['id', 'name', 'status', 'story_points', 'priority']),
        ]);
    }

    /**
     * Show edit form.
     */
    public function edit(Project $project, ProjectSprint $sprint): Response
    {
        return Inertia::render('Project/Sprints/Edit', [
            'project' => $project->only(['id', 'project_name', 'code']),
            'sprint' => $sprint,
            'statusOptions' => ProjectSprint::getStatusOptions(),
        ]);
    }

    /**
     * Update a sprint.
     */
    public function update(UpdateProjectSprintRequest $request, Project $project, ProjectSprint $sprint): JsonResponse
    {
        $validated = $request->validated();

        $sprint->update($validated);

        return response()->json([
            'message' => 'Sprint updated successfully.',
            'sprint' => $sprint->fresh(),
        ]);
    }

    /**
     * Delete a sprint.
     */
    public function destroy(Project $project, ProjectSprint $sprint): JsonResponse
    {
        // Move tasks back to backlog
        $sprint->tasks()->update(['sprint_id' => null]);

        $sprint->delete();

        return response()->json([
            'message' => 'Sprint deleted. Tasks moved to backlog.',
        ]);
    }

    /**
     * Start a sprint.
     */
    public function start(Project $project, ProjectSprint $sprint): JsonResponse
    {
        // Check if another sprint is active
        $activeSprint = $project->sprints()->active()->first();
        if ($activeSprint && $activeSprint->id !== $sprint->id) {
            return response()->json([
                'message' => 'Another sprint is already active. Please complete it first.',
            ], 422);
        }

        $sprint->start();

        ProjectActivityLog::log($project->id, ProjectActivityLog::EVENT_SPRINT_STARTED, $sprint, Auth::id());

        return response()->json([
            'message' => 'Sprint started successfully.',
            'sprint' => $sprint->fresh(),
        ]);
    }

    /**
     * Complete a sprint.
     */
    public function complete(Request $request, Project $project, ProjectSprint $sprint): JsonResponse
    {
        $validated = $request->validate([
            'retrospective' => 'nullable|array',
            'retrospective.went_well' => 'nullable|array',
            'retrospective.improvements' => 'nullable|array',
            'retrospective.actions' => 'nullable|array',
        ]);

        // Recalculate velocity before completing
        $sprint->recalculateVelocity();
        $sprint->complete($validated['retrospective'] ?? []);

        // Move incomplete tasks to backlog or next sprint
        $incompleteTasks = $sprint->tasks()->where('status', '!=', 'completed')->count();

        ProjectActivityLog::log($project->id, ProjectActivityLog::EVENT_SPRINT_COMPLETED, $sprint, Auth::id(), [
            'velocity' => $sprint->velocity,
            'completed_points' => $sprint->completed_points,
            'incomplete_tasks' => $incompleteTasks,
        ]);

        return response()->json([
            'message' => 'Sprint completed successfully.',
            'sprint' => $sprint->fresh(),
            'incomplete_tasks' => $incompleteTasks,
        ]);
    }

    /**
     * Add tasks to sprint.
     */
    public function addTasks(Request $request, Project $project, ProjectSprint $sprint): JsonResponse
    {
        $validated = $request->validate([
            'task_ids' => 'required|array',
            'task_ids.*' => 'exists:project_tasks,id',
        ]);

        $project->tasks()
            ->whereIn('id', $validated['task_ids'])
            ->update(['sprint_id' => $sprint->id]);

        $sprint->recalculateVelocity();

        return response()->json([
            'message' => 'Tasks added to sprint.',
            'sprint' => $sprint->fresh()->loadCount('tasks'),
        ]);
    }

    /**
     * Remove task from sprint (back to backlog).
     */
    public function removeTask(Project $project, ProjectSprint $sprint, int $taskId): JsonResponse
    {
        $project->tasks()
            ->where('id', $taskId)
            ->where('sprint_id', $sprint->id)
            ->update(['sprint_id' => null]);

        $sprint->recalculateVelocity();

        return response()->json([
            'message' => 'Task moved to backlog.',
        ]);
    }

    /**
     * Get burndown chart data.
     */
    public function burndown(Project $project, ProjectSprint $sprint): JsonResponse
    {
        $startDate = $sprint->start_date;
        $endDate = $sprint->end_date;
        $totalPoints = $sprint->capacity_points;

        // Calculate ideal burndown
        $days = $startDate->diffInDays($endDate);
        $idealBurndown = [];
        $pointsPerDay = $days > 0 ? $totalPoints / $days : 0;

        for ($i = 0; $i <= $days; $i++) {
            $date = $startDate->copy()->addDays($i)->format('Y-m-d');
            $idealBurndown[$date] = max(0, $totalPoints - ($pointsPerDay * $i));
        }

        // Calculate actual burndown (based on task completions)
        // This is a simplified version - real implementation would track daily progress
        $actualBurndown = [];
        $remainingPoints = $totalPoints;

        // Get completed tasks with their completion dates
        $completedTasks = $sprint->tasks()
            ->where('status', 'completed')
            ->whereNotNull('updated_at')
            ->orderBy('updated_at')
            ->get(['story_points', 'updated_at']);

        $currentDate = $startDate->copy();
        while ($currentDate <= min($endDate, now())) {
            $dateKey = $currentDate->format('Y-m-d');

            // Sum points completed on this day
            $completedToday = $completedTasks
                ->filter(fn ($task) => $task->updated_at->format('Y-m-d') === $dateKey)
                ->sum('story_points');

            $remainingPoints -= $completedToday;
            $actualBurndown[$dateKey] = max(0, $remainingPoints);

            $currentDate->addDay();
        }

        return response()->json([
            'ideal' => $idealBurndown,
            'actual' => $actualBurndown,
            'total_points' => $totalPoints,
            'completed_points' => $sprint->completed_points,
        ]);
    }
}
