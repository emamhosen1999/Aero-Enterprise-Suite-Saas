<?php

namespace AeroHRM\Policies;

use AeroCore\Models\User;
use AeroHRM\Models\TaskTemplate;

class TaskTemplatePolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        return $user->hasPermissionTo('task_templates.view');
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, TaskTemplate $taskTemplate): bool
    {
        return $user->hasPermissionTo('task_templates.view');
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        return $user->hasPermissionTo('task_templates.create');
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, TaskTemplate $taskTemplate): bool
    {
        return $user->hasPermissionTo('task_templates.update');
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, TaskTemplate $taskTemplate): bool
    {
        return $user->hasPermissionTo('task_templates.delete');
    }
}
