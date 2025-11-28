<?php

namespace App\Http\Controllers\ProjectManagement;

use App\Http\Controllers\Controller;
use App\Models\Project;
use App\Models\ProjectMilestone;
use App\Models\ProjectTask;
use App\Models\ProjectTaskDependency;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;

class GanttController extends Controller
{
    public function index(Request $request)
    {
        $projectId = $request->input('project_id');

        if (! $projectId) {
            return Inertia::render('ProjectManagement/Gantt/Index', [
                'projects' => Project::select('id', 'project_name')->get(),
                'ganttData' => null,
                'selectedProject' => null,
            ]);
        }

        $project = Project::with([
            'tasks' => function ($query) {
                $query->with(['assignedUser', 'parentTask', 'subtasks'])
                    ->orderBy('start_date');
            },
            'milestones' => function ($query) {
                $query->orderBy('due_date');
            },
        ])->findOrFail($projectId);

        $ganttData = $this->prepareGanttData($project);

        return Inertia::render('ProjectManagement/Gantt/Index', [
            'projects' => Project::select('id', 'project_name')->get(),
            'ganttData' => $ganttData,
            'selectedProject' => $project,
        ]);
    }

    public function updateTaskDates(Request $request, ProjectTask $task)
    {
        $validated = $request->validate([
            'start_date' => 'required|date',
            'due_date' => 'required|date|after_or_equal:start_date',
        ]);

        $task->update($validated);

        // Update dependent tasks if necessary
        $this->updateDependentTasks($task);

        return response()->json([
            'success' => true,
            'message' => 'Task dates updated successfully.',
            'task' => $task->fresh(),
        ]);
    }

    public function updateMilestoneDates(Request $request, ProjectMilestone $milestone)
    {
        $validated = $request->validate([
            'due_date' => 'required|date',
        ]);

        $milestone->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Milestone date updated successfully.',
            'milestone' => $milestone->fresh(),
        ]);
    }

    public function createDependency(Request $request)
    {
        $validated = $request->validate([
            'predecessor_id' => 'required|exists:project_tasks,id',
            'successor_id' => 'required|exists:project_tasks,id',
            'dependency_type' => 'required|in:finish_to_start,start_to_start,finish_to_finish,start_to_finish',
            'lag_days' => 'integer|min:0',
        ]);

        // Check for circular dependencies
        if ($this->wouldCreateCircularDependency($validated['predecessor_id'], $validated['successor_id'])) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot create dependency: would create circular dependency.',
            ], 422);
        }

        // Create or update dependency
        $dependency = ProjectTaskDependency::updateOrCreate([
            'predecessor_id' => $validated['predecessor_id'],
            'successor_id' => $validated['successor_id'],
        ], [
            'dependency_type' => $validated['dependency_type'],
            'lag_days' => $validated['lag_days'] ?? 0,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Dependency created successfully.',
            'dependency' => $dependency,
        ]);
    }

    public function deleteDependency(Request $request)
    {
        $validated = $request->validate([
            'predecessor_id' => 'required|exists:project_tasks,id',
            'successor_id' => 'required|exists:project_tasks,id',
        ]);

        ProjectTaskDependency::where([
            'predecessor_id' => $validated['predecessor_id'],
            'successor_id' => $validated['successor_id'],
        ])->delete();

        return response()->json([
            'success' => true,
            'message' => 'Dependency deleted successfully.',
        ]);
    }

    public function getCriticalPath(Project $project)
    {
        $tasks = $project->tasks()->with(['dependencies'])->get();
        $criticalPath = $this->calculateCriticalPath($tasks);

        return response()->json([
            'success' => true,
            'criticalPath' => $criticalPath,
        ]);
    }

    public function getProjectTimeline(Project $project)
    {
        $timeline = [
            'project_start' => $project->start_date,
            'project_end' => $project->end_date,
            'total_duration' => Carbon::parse($project->start_date)->diffInDays(Carbon::parse($project->end_date)),
            'tasks_count' => $project->tasks()->count(),
            'completed_tasks' => $project->tasks()->where('status', 'completed')->count(),
            'milestones_count' => $project->milestones()->count(),
            'progress' => $project->calculateProgress(),
        ];

        return response()->json([
            'success' => true,
            'timeline' => $timeline,
        ]);
    }

    private function prepareGanttData(Project $project)
    {
        $tasks = $project->tasks->map(function ($task) {
            return [
                'id' => $task->id,
                'name' => $task->name,
                'start_date' => $task->start_date->format('Y-m-d'),
                'end_date' => $task->due_date->format('Y-m-d'),
                'duration' => $task->start_date->diffInDays($task->due_date),
                'progress' => $task->progress,
                'status' => $task->status,
                'priority' => $task->priority,
                'assigned_to' => $task->assignedUser ? $task->assignedUser->name : null,
                'parent_id' => $task->parent_task_id,
                'dependencies' => $task->dependencies->pluck('predecessor_id')->toArray(),
                'color' => $this->getTaskColor($task),
            ];
        });

        $milestones = $project->milestones->map(function ($milestone) {
            return [
                'id' => 'milestone_'.$milestone->id,
                'name' => $milestone->name,
                'date' => $milestone->due_date->format('Y-m-d'),
                'status' => $milestone->status,
                'type' => 'milestone',
                'color' => $this->getMilestoneColor($milestone),
            ];
        });

        return [
            'tasks' => $tasks,
            'milestones' => $milestones,
            'project_start' => $project->start_date->format('Y-m-d'),
            'project_end' => $project->end_date->format('Y-m-d'),
        ];
    }

    private function getTaskColor(ProjectTask $task)
    {
        $colorMap = [
            'todo' => '#6B7280',
            'in_progress' => '#3B82F6',
            'in_review' => '#F59E0B',
            'completed' => '#10B981',
            'blocked' => '#EF4444',
        ];

        return $colorMap[$task->status] ?? '#6B7280';
    }

    private function getMilestoneColor(ProjectMilestone $milestone)
    {
        $colorMap = [
            'pending' => '#F59E0B',
            'completed' => '#10B981',
            'delayed' => '#EF4444',
        ];

        return $colorMap[$milestone->status] ?? '#F59E0B';
    }

    private function updateDependentTasks(ProjectTask $task)
    {
        $dependentTasks = ProjectTask::whereHas('dependencies', function ($query) use ($task) {
            $query->where('predecessor_id', $task->id);
        })->get();

        foreach ($dependentTasks as $dependentTask) {
            $dependency = $dependentTask->dependencies()
                ->where('predecessor_id', $task->id)
                ->first();

            $newStartDate = $this->calculateDependentStartDate($task, $dependency);

            if ($newStartDate->greaterThan($dependentTask->start_date)) {
                $duration = $dependentTask->start_date->diffInDays($dependentTask->due_date);
                $dependentTask->update([
                    'start_date' => $newStartDate,
                    'due_date' => $newStartDate->addDays($duration),
                ]);

                // Recursively update dependent tasks
                $this->updateDependentTasks($dependentTask);
            }
        }
    }

    private function calculateDependentStartDate(ProjectTask $predecessorTask, $dependency)
    {
        $baseDate = $predecessorTask->due_date;
        $lagDays = $dependency->lag_days ?? 0;

        switch ($dependency->dependency_type) {
            case 'finish_to_start':
                return $baseDate->addDays($lagDays);
            case 'start_to_start':
                return $predecessorTask->start_date->addDays($lagDays);
            case 'finish_to_finish':
                return $baseDate->addDays($lagDays);
            case 'start_to_finish':
                return $predecessorTask->start_date->addDays($lagDays);
            default:
                return $baseDate->addDays($lagDays);
        }
    }

    private function wouldCreateCircularDependency($predecessorId, $successorId)
    {
        // Simple check for circular dependencies
        $visited = [];

        return $this->hasCircularDependency($successorId, $predecessorId, $visited);
    }

    private function hasCircularDependency($currentId, $targetId, &$visited)
    {
        if ($currentId == $targetId) {
            return true;
        }

        if (in_array($currentId, $visited)) {
            return false;
        }

        $visited[] = $currentId;

        $dependencies = ProjectTaskDependency::where('predecessor_id', $currentId)
            ->pluck('successor_id')
            ->toArray();

        foreach ($dependencies as $dependentId) {
            if ($this->hasCircularDependency($dependentId, $targetId, $visited)) {
                return true;
            }
        }

        return false;
    }

    private function calculateCriticalPath($tasks)
    {
        // This is a simplified critical path calculation
        // In a real implementation, you would use algorithms like PERT or CPM
        $criticalTasks = $tasks->filter(function ($task) {
            return $task->priority === 'high' || $task->priority === 'urgent';
        });

        return $criticalTasks->pluck('id')->toArray();
    }
}
