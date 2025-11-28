<?php

namespace App\Http\Controllers\ProjectManagement;

use App\Http\Controllers\Controller;
use App\Models\Project;
use App\Models\ProjectTask;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class TaskController extends Controller
{
    public function globalIndex()
    {
        $tasks = ProjectTask::with(['project', 'assignedUser', 'milestone', 'parentTask'])
            ->orderBy('created_at', 'desc')
            ->paginate(15);

        return Inertia::render('ProjectManagement/Tasks/GlobalIndex', [
            'tasks' => $tasks,
        ]);
    }

    public function index(Project $project)
    {
        $tasks = $project->tasks()
            ->with(['assignedUser', 'milestone', 'parentTask'])
            ->orderBy('created_at', 'desc')
            ->paginate(15);

        return Inertia::render('ProjectManagement/Tasks/Index', [
            'project' => $project,
            'tasks' => $tasks,
        ]);
    }

    public function create(Project $project)
    {
        return Inertia::render('ProjectManagement/Tasks/Create', [
            'project' => $project,
            'milestones' => $project->milestones,
            'users' => User::select('id', 'name')->get(),
            'parentTasks' => $project->tasks()->whereNull('parent_task_id')->get(),
        ]);
    }

    public function store(Request $request, Project $project)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string|max:1000',
            'milestone_id' => 'nullable|exists:project_milestones,id',
            'parent_task_id' => 'nullable|exists:project_tasks,id',
            'status' => 'required|in:todo,in_progress,in_review,completed,blocked',
            'priority' => 'required|in:low,medium,high,urgent',
            'start_date' => 'required|date',
            'due_date' => 'required|date|after_or_equal:start_date',
            'estimated_hours' => 'nullable|numeric|min:0',
            'assigned_to' => 'nullable|exists:users,id',
        ]);

        $validated['project_id'] = $project->id;
        $validated['progress'] = 0;

        ProjectTask::create($validated);

        return redirect()->route('project-management.tasks.index', $project)
            ->with('success', 'Task created successfully.');
    }

    public function show(Project $project, ProjectTask $task)
    {
        $task->load(['assignedUser', 'milestone', 'parentTask', 'subtasks', 'timeEntries']);

        return Inertia::render('ProjectManagement/Tasks/Show', [
            'project' => $project,
            'task' => $task,
        ]);
    }

    public function edit(Project $project, ProjectTask $task)
    {
        return Inertia::render('ProjectManagement/Tasks/Edit', [
            'project' => $project,
            'task' => $task,
            'milestones' => $project->milestones,
            'users' => User::select('id', 'name')->get(),
            'parentTasks' => $project->tasks()->whereNull('parent_task_id')->where('id', '!=', $task->id)->get(),
        ]);
    }

    public function update(Request $request, Project $project, ProjectTask $task)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string|max:1000',
            'milestone_id' => 'nullable|exists:project_milestones,id',
            'parent_task_id' => 'nullable|exists:project_tasks,id',
            'status' => 'required|in:todo,in_progress,in_review,completed,blocked',
            'priority' => 'required|in:low,medium,high,urgent',
            'start_date' => 'required|date',
            'due_date' => 'required|date|after_or_equal:start_date',
            'estimated_hours' => 'nullable|numeric|min:0',
            'actual_hours' => 'nullable|numeric|min:0',
            'assigned_to' => 'nullable|exists:users,id',
            'progress' => 'required|integer|min:0|max:100',
        ]);

        $task->update($validated);

        return redirect()->route('project-management.tasks.index', $project)
            ->with('success', 'Task updated successfully.');
    }

    public function destroy(Project $project, ProjectTask $task)
    {
        $task->delete();

        return redirect()->route('project-management.tasks.index', $project)
            ->with('success', 'Task deleted successfully.');
    }

    public function assign(Request $request, Project $project, ProjectTask $task)
    {
        $validated = $request->validate([
            'assigned_to' => 'required|exists:users,id',
        ]);

        $task->update($validated);

        return redirect()->back()
            ->with('success', 'Task assigned successfully.');
    }
}
