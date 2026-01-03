<?php

namespace Aero\Project\Services\Task;

use Aero\Project\Models\Task;
use Illuminate\Support\Collection;

class TaskCrudService
{
    /**
     * Get all tasks with optional filters.
     */
    public function getTasks(array $filters = []): Collection
    {
        $query = Task::query();

        if (isset($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (isset($filters['assignee_id'])) {
            $query->where('assignee_id', $filters['assignee_id']);
        }

        if (isset($filters['project_id'])) {
            $query->where('project_id', $filters['project_id']);
        }

        return $query->get();
    }

    /**
     * Create a new task.
     */
    public function create(array $data): Task
    {
        return Task::create($data);
    }

    /**
     * Update an existing task.
     */
    public function update(Task $task, array $data): Task
    {
        $task->update($data);

        return $task->fresh();
    }

    /**
     * Delete a task.
     */
    public function delete(Task $task): bool
    {
        return $task->delete();
    }

    /**
     * Find a task by ID.
     */
    public function find(int $id): ?Task
    {
        return Task::find($id);
    }
}
