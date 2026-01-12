<?php

declare(strict_types=1);

namespace Aero\Project\Http\Controllers;

use Aero\Project\Contracts\UserResolverContract;
use Aero\Project\Http\Requests\StoreProjectRiskRequest;
use Aero\Project\Http\Requests\UpdateProjectRiskRequest;
use Aero\Project\Models\Project;
use Aero\Project\Models\ProjectActivityLog;
use Aero\Project\Models\ProjectRisk;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

/**
 * ProjectRiskController
 *
 * Handles CRUD operations for project risks and issues.
 * Uses service contracts for user resolution (package isolation).
 */
class ProjectRiskController extends Controller
{
    public function __construct(
        protected UserResolverContract $userResolver
    ) {}

    /**
     * Display risks/issues for a project.
     */
    public function index(Request $request, Project $project): Response|JsonResponse
    {
        $query = $project->risksAndIssues()
            ->with(['relatedTask:id,name'])
            ->orderBy('created_at', 'desc');

        // Filter by type (risk/issue)
        if ($request->filled('type')) {
            $query->where('type', $request->type);
        }

        // Filter by status
        if ($request->filled('status')) {
            $statuses = is_array($request->status) ? $request->status : [$request->status];
            $query->whereIn('status', $statuses);
        }

        // Filter by priority (high risk score)
        if ($request->boolean('high_priority')) {
            $query->highPriority();
        }

        // Filter by overdue
        if ($request->boolean('overdue')) {
            $query->overdue();
        }

        // Search
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            });
        }

        $risks = $query->paginate($request->input('per_page', 15));

        // Stats
        $stats = [
            'total_risks' => $project->risksAndIssues()->risks()->count(),
            'total_issues' => $project->risksAndIssues()->issues()->count(),
            'open' => $project->risksAndIssues()->open()->count(),
            'high_priority' => $project->risksAndIssues()->highPriority()->count(),
            'overdue' => $project->risksAndIssues()->overdue()->count(),
        ];

        if ($request->wantsJson()) {
            return response()->json([
                'risks' => $risks,
                'stats' => $stats,
            ]);
        }

        return Inertia::render('Project/Risks/Index', [
            'project' => $project->only(['id', 'project_name', 'code']),
            'risks' => $risks,
            'stats' => $stats,
            'users' => $this->userResolver->getAllActiveUsers(),
            'filters' => $request->only(['type', 'status', 'high_priority', 'overdue', 'search']),
        ]);
    }

    /**
     * Show create form.
     */
    public function create(Project $project): Response
    {
        return Inertia::render('Project/Risks/Create', [
            'project' => $project->only(['id', 'project_name', 'code']),
            'users' => $this->userResolver->getAllActiveUsers(),
            'tasks' => $project->tasks()->select('id', 'name')->get(),
            'typeOptions' => ProjectRisk::getTypeOptions(),
            'statusOptions' => ProjectRisk::getStatusOptions(),
            'probabilityOptions' => ProjectRisk::getProbabilityOptions(),
            'impactOptions' => ProjectRisk::getImpactOptions(),
        ]);
    }

    /**
     * Store a new risk/issue.
     */
    public function store(StoreProjectRiskRequest $request, Project $project): JsonResponse
    {
        $validated = $request->validated();

        $validated['project_id'] = $project->id;
        $validated['reported_by'] = Auth::id();
        $validated['identified_date'] = now();

        $risk = ProjectRisk::create($validated);

        // Log activity
        ProjectActivityLog::logCreated($project->id, $risk);

        return response()->json([
            'message' => ucfirst($validated['type']).' created successfully.',
            'risk' => $risk,
        ]);
    }

    /**
     * Show a specific risk/issue.
     */
    public function show(Project $project, ProjectRisk $risk): Response
    {
        $risk->load(['relatedTask:id,name', 'comments.replies', 'attachments']);

        return Inertia::render('Project/Risks/Show', [
            'project' => $project->only(['id', 'project_name', 'code']),
            'risk' => $risk,
            'users' => $this->userResolver->getAllActiveUsers(),
        ]);
    }

    /**
     * Show edit form.
     */
    public function edit(Project $project, ProjectRisk $risk): Response
    {
        return Inertia::render('Project/Risks/Edit', [
            'project' => $project->only(['id', 'project_name', 'code']),
            'risk' => $risk,
            'users' => $this->userResolver->getAllActiveUsers(),
            'tasks' => $project->tasks()->select('id', 'name')->get(),
            'typeOptions' => ProjectRisk::getTypeOptions(),
            'statusOptions' => ProjectRisk::getStatusOptions(),
            'probabilityOptions' => ProjectRisk::getProbabilityOptions(),
            'impactOptions' => ProjectRisk::getImpactOptions(),
        ]);
    }

    /**
     * Update a risk/issue.
     */
    public function update(UpdateProjectRiskRequest $request, Project $project, ProjectRisk $risk): JsonResponse
    {
        $oldValues = $risk->toArray();
        $validated = $request->validated();

        // Track status change
        $statusChanged = isset($validated['status']) && $validated['status'] !== $risk->status;
        $oldStatus = $risk->status;

        $risk->update($validated);

        // Log activity
        if ($statusChanged) {
            ProjectActivityLog::logStatusChanged($project->id, $risk, $oldStatus, $validated['status']);
        } else {
            ProjectActivityLog::logUpdated($project->id, $risk, $oldValues);
        }

        return response()->json([
            'message' => ucfirst($risk->type).' updated successfully.',
            'risk' => $risk->fresh(),
        ]);
    }

    /**
     * Delete a risk/issue.
     */
    public function destroy(Project $project, ProjectRisk $risk): JsonResponse
    {
        $type = $risk->type;
        $risk->delete();

        return response()->json([
            'message' => ucfirst($type).' deleted successfully.',
        ]);
    }

    /**
     * Convert a risk to an issue (when risk materializes).
     */
    public function convertToIssue(Project $project, ProjectRisk $risk): JsonResponse
    {
        if ($risk->isIssue()) {
            return response()->json([
                'message' => 'This is already an issue.',
            ], 422);
        }

        $oldType = $risk->type;
        $risk->convertToIssue();

        ProjectActivityLog::log($project->id, 'converted', $risk, Auth::id(), [
            'old' => ['type' => $oldType],
            'new' => ['type' => 'issue'],
        ]);

        return response()->json([
            'message' => 'Risk converted to issue successfully.',
            'risk' => $risk->fresh(),
        ]);
    }
}
