<?php

declare(strict_types=1);

namespace Aero\Project\Http\Controllers;

use Aero\Project\Models\Project;
use Aero\Project\Models\ProjectMilestone;
use Aero\Project\Models\ProjectRisk;
use Aero\Project\Models\ProjectTask;
use Aero\Project\Models\ProjectWatcher;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Auth;

/**
 * ProjectWatcherController
 *
 * Handles watch/unwatch operations for project entities.
 */
class ProjectWatcherController extends Controller
{
    /**
     * Get watching status for current user on an entity.
     */
    public function status(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'watchable_type' => 'required|string',
            'watchable_id' => 'required|integer',
        ]);

        $watchable = $this->resolveWatchable($validated['watchable_type'], $validated['watchable_id']);

        if (! $watchable) {
            return response()->json(['error' => 'Entity not found.'], 404);
        }

        $isWatching = ProjectWatcher::isWatching($watchable, Auth::id());

        return response()->json([
            'is_watching' => $isWatching,
            'watcher_count' => $watchable->watchers()->count(),
        ]);
    }

    /**
     * Toggle watch status for current user.
     */
    public function toggle(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'watchable_type' => 'required|string',
            'watchable_id' => 'required|integer',
        ]);

        $watchable = $this->resolveWatchable($validated['watchable_type'], $validated['watchable_id']);

        if (! $watchable) {
            return response()->json(['error' => 'Entity not found.'], 404);
        }

        $isNowWatching = ProjectWatcher::toggle($watchable, Auth::id());

        return response()->json([
            'is_watching' => $isNowWatching,
            'message' => $isNowWatching ? 'Now watching.' : 'Stopped watching.',
            'watcher_count' => $watchable->watchers()->count(),
        ]);
    }

    /**
     * Start watching an entity.
     */
    public function watch(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'watchable_type' => 'required|string',
            'watchable_id' => 'required|integer',
        ]);

        $watchable = $this->resolveWatchable($validated['watchable_type'], $validated['watchable_id']);

        if (! $watchable) {
            return response()->json(['error' => 'Entity not found.'], 404);
        }

        ProjectWatcher::watch($watchable, Auth::id());

        return response()->json([
            'is_watching' => true,
            'message' => 'Now watching.',
            'watcher_count' => $watchable->watchers()->count(),
        ]);
    }

    /**
     * Stop watching an entity.
     */
    public function unwatch(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'watchable_type' => 'required|string',
            'watchable_id' => 'required|integer',
        ]);

        $watchable = $this->resolveWatchable($validated['watchable_type'], $validated['watchable_id']);

        if (! $watchable) {
            return response()->json(['error' => 'Entity not found.'], 404);
        }

        ProjectWatcher::unwatch($watchable, Auth::id());

        return response()->json([
            'is_watching' => false,
            'message' => 'Stopped watching.',
            'watcher_count' => $watchable->watchers()->count(),
        ]);
    }

    /**
     * Get all watchers for an entity.
     */
    public function watchers(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'watchable_type' => 'required|string',
            'watchable_id' => 'required|integer',
        ]);

        $watchable = $this->resolveWatchable($validated['watchable_type'], $validated['watchable_id']);

        if (! $watchable) {
            return response()->json(['error' => 'Entity not found.'], 404);
        }

        $watcherIds = ProjectWatcher::getWatcherIds($watchable);

        return response()->json([
            'watcher_ids' => $watcherIds,
            'watcher_count' => count($watcherIds),
        ]);
    }

    /**
     * Get all entities watched by current user in a project.
     */
    public function myWatches(Project $project): JsonResponse
    {
        $userId = Auth::id();

        $watchedProjects = ProjectWatcher::forUser($userId)
            ->ofType(Project::class)
            ->where('watchable_id', $project->id)
            ->exists();

        $watchedTasks = ProjectWatcher::forUser($userId)
            ->ofType(ProjectTask::class)
            ->whereIn('watchable_id', $project->tasks()->pluck('id'))
            ->pluck('watchable_id');

        $watchedRisks = ProjectWatcher::forUser($userId)
            ->ofType(ProjectRisk::class)
            ->whereIn('watchable_id', $project->risksAndIssues()->pluck('id'))
            ->pluck('watchable_id');

        $watchedMilestones = ProjectWatcher::forUser($userId)
            ->ofType(ProjectMilestone::class)
            ->whereIn('watchable_id', $project->milestones()->pluck('id'))
            ->pluck('watchable_id');

        return response()->json([
            'watching_project' => $watchedProjects,
            'watched_tasks' => $watchedTasks,
            'watched_risks' => $watchedRisks,
            'watched_milestones' => $watchedMilestones,
        ]);
    }

    /**
     * Resolve watchable model from type and ID.
     */
    protected function resolveWatchable(string $type, int $id)
    {
        $modelMap = [
            'project' => Project::class,
            'task' => ProjectTask::class,
            'risk' => ProjectRisk::class,
            'milestone' => ProjectMilestone::class,
            Project::class => Project::class,
            ProjectTask::class => ProjectTask::class,
            ProjectRisk::class => ProjectRisk::class,
            ProjectMilestone::class => ProjectMilestone::class,
        ];

        $modelClass = $modelMap[$type] ?? null;

        if (! $modelClass) {
            return null;
        }

        return $modelClass::find($id);
    }
}
