<?php

namespace Aero\Core\Widgets;

use Aero\Core\Contracts\AbstractDashboardWidget;

/**
 * Quick Actions Widget
 *
 * Displays quick action buttons for common tasks.
 */
class QuickActionsWidget extends AbstractDashboardWidget
{
    protected string $position = 'main_left';

    protected int $order = 40;

    protected bool $lazy = false;

    public function getKey(): string
    {
        return 'core_quick_actions';
    }

    public function getComponent(): string
    {
        return 'Core/QuickActions';
    }

    public function getTitle(): string
    {
        return 'Quick Actions';
    }

    public function getDescription(): string
    {
        return 'Common tasks';
    }

    public function getData(): array
    {
        return [
            'actions' => [
                [
                    'key' => 'manage_users',
                    'title' => 'Manage Users',
                    'route' => 'core.users.index',
                    'icon' => 'UsersIcon',
                    'color' => 'primary',
                ],
                [
                    'key' => 'roles_permissions',
                    'title' => 'Roles & Permissions',
                    'route' => 'core.roles.index',
                    'icon' => 'ShieldCheckIcon',
                    'color' => 'secondary',
                ],
                [
                    'key' => 'audit_logs',
                    'title' => 'View Audit Logs',
                    'route' => 'core.audit-logs.index',
                    'icon' => 'DocumentTextIcon',
                    'color' => 'success',
                ],
                [
                    'key' => 'settings',
                    'title' => 'System Settings',
                    'route' => 'core.settings.system.index',
                    'icon' => 'CogIcon',
                    'color' => 'warning',
                ],
            ],
        ];
    }
}
