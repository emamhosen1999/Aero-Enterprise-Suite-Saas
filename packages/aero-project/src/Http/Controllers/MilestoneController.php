<?php

declare(strict_types=1);

namespace Aero\Project\Http\Controllers;

use Aero\Project\Models\Project;
use Aero\Project\Models\ProjectMilestone;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Inertia\Inertia;

class MilestoneController extends Controller
{
    public function globalIndex()
    {
        $milestones = ProjectMilestone::with(['project'])
            ->orderBy('due_date')
            ->paginate(15);

        return Inertia::render('Project/Milestones/GlobalIndex', [
            'milestones' => $milestones,
        ]);
    }

    public function index(Project $project)
    {
        $milestones = $project->milestones()
            ->orderBy('due_date')
            ->paginate(10);

        return Inertia::render('Project/Milestones/Index', [
            'project' => $project,
            'milestones' => $milestones,
        ]);
    }

    public function create(Project $project)
    {
        return Inertia::render('Project/Milestones/Create', [
            'project' => $project,
        ]);
    }

    public function store(Request $request, Project $project)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string|max:1000',
            'due_date' => 'required|date',
            'status' => 'required|in:pending,completed,delayed',
        ]);

        $validated['project_id'] = $project->id;

        ProjectMilestone::create($validated);

        return redirect()->route('project-management.milestones.index', $project)
            ->with('success', 'Milestone created successfully.');
    }

    public function edit(Project $project, ProjectMilestone $milestone)
    {
        return Inertia::render('Project/Milestones/Edit', [
            'project' => $project,
            'milestone' => $milestone,
        ]);
    }

    public function update(Request $request, Project $project, ProjectMilestone $milestone)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string|max:1000',
            'due_date' => 'required|date',
            'status' => 'required|in:pending,completed,delayed',
        ]);

        $milestone->update($validated);

        return redirect()->route('project-management.milestones.index', $project)
            ->with('success', 'Milestone updated successfully.');
    }

    public function destroy(Project $project, ProjectMilestone $milestone)
    {
        $milestone->delete();

        return redirect()->route('project-management.milestones.index', $project)
            ->with('success', 'Milestone deleted successfully.');
    }
}
