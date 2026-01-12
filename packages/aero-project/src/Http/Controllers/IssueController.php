<?php

declare(strict_types=1);

namespace Aero\Project\Http\Controllers;

use Aero\Project\Contracts\UserResolverContract;
use Aero\Project\Models\Project;
use Aero\Project\Models\ProjectIssue;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

/**
 * IssueController
 *
 * Handles CRUD operations for project issues.
 * Uses service contracts for user resolution (package isolation).
 */
class IssueController extends Controller
{
    public function __construct(
        protected UserResolverContract $userResolver
    ) {}

    public function globalIndex(): Response
    {
        $issues = ProjectIssue::with(['project', 'assignedUser', 'reportedBy'])
            ->orderBy('created_at', 'desc')
            ->paginate(15);

        return Inertia::render('Project/Issues/GlobalIndex', [
            'issues' => $issues,
        ]);
    }

    public function index(Project $project): Response
    {
        $issues = $project->issues()
            ->with(['assignedUser', 'reportedBy'])
            ->orderBy('created_at', 'desc')
            ->paginate(15);

        return Inertia::render('Project/Issues/Index', [
            'project' => $project,
            'issues' => $issues,
        ]);
    }

    public function create(Project $project): Response
    {
        return Inertia::render('Project/Issues/Create', [
            'project' => $project,
            'users' => $this->userResolver->getAllActiveUsers(['id', 'name']),
            'tasks' => $project->tasks()->select('id', 'name')->get(),
        ]);
    }

    public function store(Request $request, Project $project)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'required|string|max:2000',
            'priority' => 'required|in:low,medium,high,critical',
            'status' => 'required|in:open,in_progress,resolved,closed',
            'issue_type' => 'required|in:bug,feature,improvement,task',
            'assigned_to' => 'nullable|exists:users,id',
            'due_date' => 'nullable|date',
        ]);

        $validated['project_id'] = $project->id;
        $validated['reported_by'] = Auth::id();

        ProjectIssue::create($validated);

        return redirect()->route('project-management.issues.index', $project)
            ->with('success', 'Issue created successfully.');
    }

    public function show(Project $project, ProjectIssue $issue)
    {
        $issue->load(['assignedUser', 'reportedBy', 'tasks']);

        return Inertia::render('Project/Issues/Show', [
            'project' => $project,
            'issue' => $issue,
        ]);
    }

    public function edit(Project $project, ProjectIssue $issue): Response
    {
        return Inertia::render('Project/Issues/Edit', [
            'project' => $project,
            'issue' => $issue,
            'users' => $this->userResolver->getAllActiveUsers(['id', 'name']),
            'tasks' => $project->tasks()->select('id', 'name')->get(),
        ]);
    }

    public function update(Request $request, Project $project, ProjectIssue $issue)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'required|string|max:2000',
            'priority' => 'required|in:low,medium,high,critical',
            'status' => 'required|in:open,in_progress,resolved,closed',
            'issue_type' => 'required|in:bug,feature,improvement,task',
            'assigned_to' => 'nullable|exists:users,id',
            'due_date' => 'nullable|date',
        ]);

        $issue->update($validated);

        return redirect()->route('project-management.issues.index', $project)
            ->with('success', 'Issue updated successfully.');
    }

    public function destroy(Project $project, ProjectIssue $issue)
    {
        $issue->delete();

        return redirect()->route('project-management.issues.index', $project)
            ->with('success', 'Issue deleted successfully.');
    }
}
