<?php

namespace Aero\Core\Widgets;

use Aero\Core\Contracts\AbstractDashboardWidget;
use Aero\Core\Models\User;
use Illuminate\Support\Facades\Cache;
use Spatie\Permission\Models\Role;

/**
 * User Stats Widget
 *
 * Displays quick stats about users in the system.
 * Uses caching to avoid hitting the database on every request.
 */
class UserStatsWidget extends AbstractDashboardWidget
{
    protected string $position = 'stats_row';

    protected int $order = 10;

    protected bool $lazy = false;

    public function getKey(): string
    {
        return 'core_user_stats';
    }

    public function getComponent(): string
    {
        return 'Core/StatsRow';
    }

    public function getTitle(): string
    {
        return 'User Statistics';
    }

    public function getDescription(): string
    {
        return 'Overview of user accounts';
    }

    public function getData(): array
    {
        return $this->safeResolve(function () {
            // Cache stats for 5 minutes to reduce DB load
            return Cache::remember('dashboard.user_stats', 300, function () {
                $totalUsers = User::count();
                $activeUsers = User::where('is_active', true)->orWhere('active', true)->count();
                $usersThisMonth = User::whereMonth('created_at', now()->month)
                    ->whereYear('created_at', now()->year)
                    ->count();
                $usersLastMonth = User::whereMonth('created_at', now()->subMonth()->month)
                    ->whereYear('created_at', now()->subMonth()->year)
                    ->count();

                $userGrowth = $usersLastMonth > 0
                    ? round((($usersThisMonth - $usersLastMonth) / $usersLastMonth) * 100, 1)
                    : ($usersThisMonth > 0 ? 100 : 0);

                return [
                    'stats' => [
                        [
                            'key' => 'total_users',
                            'label' => 'Total Users',
                            'value' => $totalUsers,
                            'icon' => 'UsersIcon',
                            'color' => 'primary',
                            'trend' => $userGrowth,
                        ],
                        [
                            'key' => 'active_users',
                            'label' => 'Active Users',
                            'value' => $activeUsers,
                            'icon' => 'CheckCircleIcon',
                            'color' => 'success',
                            'percentage' => $totalUsers > 0 ? round(($activeUsers / $totalUsers) * 100, 1) : 0,
                        ],
                        [
                            'key' => 'total_roles',
                            'label' => 'Total Roles',
                            'value' => Role::count(),
                            'icon' => 'ShieldCheckIcon',
                            'color' => 'secondary',
                        ],
                        [
                            'key' => 'new_this_month',
                            'label' => 'New This Month',
                            'value' => $usersThisMonth,
                            'icon' => 'UserPlusIcon',
                            'color' => 'warning',
                        ],
                    ],
                ];
            });
        }, ['stats' => []]);
    }
}
