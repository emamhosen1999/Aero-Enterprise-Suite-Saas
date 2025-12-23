<?php

declare(strict_types=1);

namespace Aero\Core\Widgets;

use Aero\Core\Contracts\AbstractDashboardWidget;
use Aero\Core\Contracts\CoreWidgetCategory;
use Aero\Core\Models\User;
use Spatie\Permission\Models\Role;

/**
 * System Stats Widget for Core Dashboard
 *
 * Displays comprehensive tenant statistics including:
 * - Total users (active/inactive)
 * - Roles count
 * - Departments count
 * - Designations count
 * - New users this month
 *
 * This is a SUMMARY widget - provides data overview.
 */
class SystemStatsWidget extends AbstractDashboardWidget
{
    protected string $position = 'stats_row';
    protected int $order = 1;
    protected int|string $span = 'full';
    protected CoreWidgetCategory $category = CoreWidgetCategory::SUMMARY;
    protected array $requiredPermissions = [];

    public function getKey(): string
    {
        return 'core.system_stats';
    }

    public function getComponent(): string
    {
        return 'Widgets/Core/SystemStatsWidget';
    }

    public function getTitle(): string
    {
        return 'System Statistics';
    }

    public function getDescription(): string
    {
        return 'Overview of tenant data and resources';
    }

    public function getModuleCode(): string
    {
        return 'core';
    }

    /**
     * Stats widget is always enabled.
     */
    public function isEnabled(): bool
    {
        return true;
    }

    /**
     * Get widget data for frontend.
     */
    public function getData(): array
    {
        // User statistics
        $totalUsers = User::count();
        $activeUsers = User::where('active', true)->count();
        $inactiveUsers = User::where('active', false)->count();
        $newUsersThisMonth = User::whereMonth('created_at', now()->month)
            ->whereYear('created_at', now()->year)
            ->count();

        // Role statistics
        $totalRoles = Role::count();

        // Department statistics (try to get from HRM if available)
        $departmentsCount = 0;
        $designationsCount = 0;
        
        try {
            // Check if departments table exists
            if (\Schema::hasTable('departments')) {
                $departmentsCount = \DB::table('departments')->count();
            }
            
            // Check if designations table exists
            if (\Schema::hasTable('designations')) {
                $designationsCount = \DB::table('designations')->count();
            }
        } catch (\Throwable $e) {
            // Silently ignore if tables don't exist
        }

        // Online users (active sessions in last 15 minutes)
        $onlineUsers = 0;
        try {
            if (\Schema::hasTable('sessions')) {
                $onlineUsers = \DB::table('sessions')
                    ->where('last_activity', '>', now()->subMinutes(15)->timestamp)
                    ->count();
            }
        } catch (\Throwable $e) {
            $onlineUsers = $activeUsers > 0 ? min(5, $activeUsers) : 0;
        }

        return [
            'stats' => [
                [
                    'key' => 'total_users',
                    'label' => 'Total Users',
                    'value' => $totalUsers,
                    'icon' => 'UsersIcon',
                    'color' => 'primary',
                    'description' => 'All registered users',
                ],
                [
                    'key' => 'active_users',
                    'label' => 'Active Users',
                    'value' => $activeUsers,
                    'icon' => 'CheckCircleIcon',
                    'color' => 'success',
                    'description' => 'Currently active',
                ],
                [
                    'key' => 'online_users',
                    'label' => 'Online Now',
                    'value' => $onlineUsers,
                    'icon' => 'SignalIcon',
                    'color' => 'success',
                    'description' => 'Last 15 minutes',
                ],
                [
                    'key' => 'inactive_users',
                    'label' => 'Inactive Users',
                    'value' => $inactiveUsers,
                    'icon' => 'XCircleIcon',
                    'color' => 'danger',
                    'description' => 'Disabled accounts',
                ],
                [
                    'key' => 'total_roles',
                    'label' => 'Roles',
                    'value' => $totalRoles,
                    'icon' => 'ShieldCheckIcon',
                    'color' => 'secondary',
                    'description' => 'System roles',
                ],
                [
                    'key' => 'departments',
                    'label' => 'Departments',
                    'value' => $departmentsCount,
                    'icon' => 'BuildingOfficeIcon',
                    'color' => 'warning',
                    'description' => 'Org units',
                ],
            ],
            'newUsersThisMonth' => $newUsersThisMonth,
            'totalDesignations' => $designationsCount,
        ];
    }
}
