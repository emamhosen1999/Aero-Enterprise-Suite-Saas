<?php

namespace Aero\Core\Widgets;

use Aero\Core\Contracts\AbstractDashboardWidget;
use Illuminate\Support\Facades\Cache;
use Spatie\Permission\Models\Role;

/**
 * Users By Role Widget
 *
 * Shows distribution of users across roles.
 */
class UsersByRoleWidget extends AbstractDashboardWidget
{
    protected string $position = 'main_left';

    protected int $order = 30;

    protected bool $lazy = false;

    public function getKey(): string
    {
        return 'core_users_by_role';
    }

    public function getComponent(): string
    {
        return 'Core/UsersByRole';
    }

    public function getTitle(): string
    {
        return 'Users by Role';
    }

    public function getDescription(): string
    {
        return 'Role distribution';
    }

    public function getData(): array
    {
        return $this->safeResolve(function () {
            return Cache::remember('dashboard.users_by_role', 300, function () {
                $roles = Role::withCount('users')
                    ->orderBy('users_count', 'desc')
                    ->get()
                    ->map(function ($role) {
                        return [
                            'name' => $role->name,
                            'count' => $role->users_count,
                            'color' => $this->getRoleColor($role->name),
                        ];
                    })
                    ->toArray();

                return ['roles' => $roles];
            });
        }, ['roles' => []]);
    }

    protected function getRoleColor(string $roleName): string
    {
        $colorMap = [
            'super administrator' => '#ef4444',
            'super admin' => '#ef4444',
            'administrator' => '#f97316',
            'admin' => '#f97316',
            'manager' => '#eab308',
            'employee' => '#22c55e',
            'user' => '#3b82f6',
            'guest' => '#6b7280',
        ];

        return $colorMap[strtolower($roleName)] ?? '#8b5cf6';
    }
}
