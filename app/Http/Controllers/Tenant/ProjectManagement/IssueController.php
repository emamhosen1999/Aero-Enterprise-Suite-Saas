<?php

namespace App\Http\Controllers\ProjectManagement;

use App\Http\Controllers\Controller;
use App\Models\Project;
use App\Models\ProjectIssue;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class IssueController extends Controller
{
    public function globalIndex()
    {
        $issues = ProjectIssue::with(['project', 'assignedUser', 'reportedBy'])
            ->orderBy('created_at', 'desc')
            ->paginate(15);

        return Inertia::render('ProjectManagement/Issues/GlobalIndex', [
            'issues' => $issues,
        ]);
    }

    public function index(Project $project)
    {
        $issues = $project->issues()
            ->with(['assignedUser', 'reportedBy'])
            ->orderBy('created_at', 'desc')
            ->paginate(15);

        return Inertia::render('ProjectManagement/Issues/Index', [
            'project' => $project,
            'issues' => $issues,
        ]);
    }

    public function create(Project $project)
    {
        return Inertia::render('ProjectManagement/Issues/Create', [
            'project' => $project,
            'users' => User::select('id', 'name')->get(),
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

        return Inertia::render('ProjectManagement/Issues/Show', [
            'project' => $project,
            'issue' => $issue,
        ]);
    }

    public function edit(Project $project, ProjectIssue $issue)
    {
        return Inertia::render('ProjectManagement/Issues/Edit', [
            'project' => $project,
            'issue' => $issue,
            'users' => User::select('id', 'name')->get(),
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
