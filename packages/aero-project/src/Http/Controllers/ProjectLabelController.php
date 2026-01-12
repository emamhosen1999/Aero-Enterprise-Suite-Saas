<?php

declare(strict_types=1);

namespace Aero\Project\Http\Controllers;

use Aero\Project\Http\Requests\StoreProjectLabelRequest;
use Aero\Project\Models\Project;
use Aero\Project\Models\ProjectLabel;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Inertia\Inertia;
use Inertia\Response;

/**
 * ProjectLabelController
 *
 * Handles CRUD operations for project labels/tags.
 */
class ProjectLabelController extends Controller
{
    /**
     * Display labels for a project.
     */
    public function index(Request $request, Project $project): Response|JsonResponse
    {
        $labels = $project->labels()
            ->withCount('tasks')
            ->orderBy('name')
            ->get();

        if ($request->wantsJson()) {
            return response()->json(['labels' => $labels]);
        }

        return Inertia::render('Project/Labels/Index', [
            'project' => $project->only(['id', 'project_name', 'code']),
            'labels' => $labels,
            'colorOptions' => ProjectLabel::getColorOptions(),
        ]);
    }

    /**
     * Store a new label.
     */
    public function store(StoreProjectLabelRequest $request, Project $project): JsonResponse
    {
        $validated = $request->validated();

        // Check for duplicate name in project
        $exists = $project->labels()->named($validated['name'])->exists();
        if ($exists) {
            return response()->json([
                'message' => 'A label with this name already exists.',
            ], 422);
        }

        $validated['project_id'] = $project->id;
        $label = ProjectLabel::create($validated);

        return response()->json([
            'message' => 'Label created successfully.',
            'label' => $label,
        ]);
    }

    /**
     * Update a label.
     */
    public function update(Request $request, Project $project, ProjectLabel $label): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'sometimes|string|max:50',
            'color' => 'sometimes|string|max:20',
            'description' => 'nullable|string|max:255',
        ]);

        // Check for duplicate name (excluding current)
        if (isset($validated['name'])) {
            $exists = $project->labels()
                ->named($validated['name'])
                ->where('id', '!=', $label->id)
                ->exists();

            if ($exists) {
                return response()->json([
                    'message' => 'A label with this name already exists.',
                ], 422);
            }
        }

        $label->update($validated);

        return response()->json([
            'message' => 'Label updated successfully.',
            'label' => $label->fresh(),
        ]);
    }

    /**
     * Delete a label.
     */
    public function destroy(Project $project, ProjectLabel $label): JsonResponse
    {
        // Detach from all tasks first
        $label->tasks()->detach();
        $label->delete();

        return response()->json([
            'message' => 'Label deleted successfully.',
        ]);
    }

    /**
     * Assign label to a task.
     */
    public function assignToTask(Request $request, Project $project, ProjectLabel $label): JsonResponse
    {
        $validated = $request->validate([
            'task_id' => 'required|exists:project_tasks,id',
        ]);

        $label->tasks()->syncWithoutDetaching([$validated['task_id']]);

        return response()->json([
            'message' => 'Label assigned to task.',
        ]);
    }

    /**
     * Remove label from a task.
     */
    public function removeFromTask(Request $request, Project $project, ProjectLabel $label): JsonResponse
    {
        $validated = $request->validate([
            'task_id' => 'required|exists:project_tasks,id',
        ]);

        $label->tasks()->detach($validated['task_id']);

        return response()->json([
            'message' => 'Label removed from task.',
        ]);
    }
}
