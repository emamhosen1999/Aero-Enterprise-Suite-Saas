<?php

namespace Aero\Core\Http\Controllers;

use Aero\Core\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Role;

/**
 * Dashboard Controller
 *
 * Main dashboard for the core tenant system with comprehensive analytics.
 */
class DashboardController extends Controller
{
    /**
     * Display the main dashboard.
     */
    public function index(Request $request): Response
    {
        $user = $request->user();

        return Inertia::render('Core/Dashboard/Index', [
            'title' => 'Dashboard',
            'welcomeData' => $this->getWelcomeData($user),
            'stats' => $this->getQuickStats(),
            'recentActivity' => $this->getRecentActivity(5),
            'pendingActions' => $this->getPendingActions(),
            'usersByRole' => $this->getUsersByRole(),
            'activeModules' => $this->getActiveModules(),
            'securityOverview' => $this->getSecurityOverview(),
            'systemHealth' => $this->getSystemHealth(),
            'announcements' => $this->getAnnouncements(),
            'activityChart' => $this->getActivityChartData(),
        ]);
    }

    /**
     * Get welcome header data.
     */
    protected function getWelcomeData($user): array
    {
        $lastLogin = null;
        $lastLoginIp = null;

        if ($user) {
            $lastLogin = $user->last_login_at;
            $lastLoginIp = $user->last_login_ip;
        }

        return [
            'userName' => $user?->name ?? 'User',
            'currentDate' => now()->format('F j, Y'),
            'currentTime' => now()->format('g:i A'),
            'lastLogin' => $lastLogin ? Carbon::parse($lastLogin)->diffForHumans() : null,
            'lastLoginIp' => $lastLoginIp,
            'greeting' => $this->getGreeting(),
        ];
    }

    /**
     * Get time-based greeting.
     */
    protected function getGreeting(): string
    {
        $hour = now()->hour;
        if ($hour < 12) {
            return 'Good morning';
        } elseif ($hour < 17) {
            return 'Good afternoon';
        } else {
            return 'Good evening';
        }
    }

    /**
     * Get quick stats for the dashboard.
     */
    protected function getQuickStats(): array
    {
        $totalUsers = User::count();
        $activeUsers = User::where('is_active', true)->orWhere('active', true)->count();
        $inactiveUsers = $totalUsers - $activeUsers;
        $usersThisMonth = User::whereMonth('created_at', now()->month)
            ->whereYear('created_at', now()->year)
            ->count();
        $usersLastMonth = User::whereMonth('created_at', now()->subMonth()->month)
            ->whereYear('created_at', now()->subMonth()->year)
            ->count();

        // Calculate growth percentage
        $userGrowth = $usersLastMonth > 0
            ? round((($usersThisMonth - $usersLastMonth) / $usersLastMonth) * 100, 1)
            : ($usersThisMonth > 0 ? 100 : 0);

        // Storage usage
        $storageUsed = $this->getStorageUsage();
        $storageLimit = 10 * 1024 * 1024 * 1024; // 10 GB default
        $storagePercentage = $storageLimit > 0 ? round(($storageUsed / $storageLimit) * 100, 1) : 0;

        // Active sessions
        $activeSessions = 0;
        if (Schema::hasTable('sessions')) {
            $activeSessions = DB::table('sessions')
                ->where('last_activity', '>', now()->subMinutes(15)->timestamp)
                ->count();
        }

        // Total permissions
        $totalPermissions = 0;
        if (Schema::hasTable('permissions')) {
            $totalPermissions = DB::table('permissions')->count();
        }

        return [
            'totalUsers' => $totalUsers,
            'activeUsers' => $activeUsers,
            'inactiveUsers' => $inactiveUsers,
            'totalRoles' => Role::count(),
            'totalPermissions' => $totalPermissions,
            'usersThisMonth' => $usersThisMonth,
            'userGrowth' => $userGrowth,
            'activePercentage' => $totalUsers > 0 ? round(($activeUsers / $totalUsers) * 100, 1) : 0,
            'activeSessions' => $activeSessions,
            'storageUsed' => $storageUsed,
            'storageLimit' => $storageLimit,
            'storagePercentage' => min($storagePercentage, 100),
            'storageUsedFormatted' => $this->formatBytes($storageUsed),
            'storageLimitFormatted' => $this->formatBytes($storageLimit),
        ];
    }

    /**
     * Get storage usage in bytes.
     */
    protected function getStorageUsage(): int
    {
        try {
            $storagePath = storage_path('app');
            if (! is_dir($storagePath)) {
                return 0;
            }

            return $this->getDirectorySize($storagePath);
        } catch (\Exception $e) {
            return 0;
        }
    }

    /**
     * Get directory size recursively.
     */
    protected function getDirectorySize(string $path): int
    {
        $size = 0;
        foreach (new \RecursiveIteratorIterator(new \RecursiveDirectoryIterator($path, \RecursiveDirectoryIterator::SKIP_DOTS)) as $file) {
            if ($file->isFile()) {
                $size += $file->getSize();
            }
        }

        return $size;
    }

    /**
     * Format bytes to human readable.
     */
    protected function formatBytes(int $bytes, int $precision = 2): string
    {
        $units = ['B', 'KB', 'MB', 'GB', 'TB'];
        $bytes = max($bytes, 0);
        $pow = floor(($bytes ? log($bytes) : 0) / log(1024));
        $pow = min($pow, count($units) - 1);
        $bytes /= pow(1024, $pow);

        return round($bytes, $precision).' '.$units[$pow];
    }

    /**
     * Get recent activity from audit logs.
     */
    protected function getRecentActivity(int $limit = 5): array
    {
        if (! Schema::hasTable('audit_logs')) {
            return [];
        }

        try {
            $activities = DB::table('audit_logs')
                ->leftJoin('users', 'audit_logs.user_id', '=', 'users.id')
                ->select([
                    'audit_logs.id',
                    'audit_logs.action',
                    'audit_logs.model_type',
                    'audit_logs.description',
                    'audit_logs.created_at',
                    'users.name as user_name',
                ])
                ->orderBy('audit_logs.created_at', 'desc')
                ->limit($limit)
                ->get()
                ->map(function ($activity) {
                    return [
                        'id' => $activity->id,
                        'action' => $activity->action,
                        'modelType' => class_basename($activity->model_type ?? ''),
                        'description' => $activity->description ?? $this->formatActivityDescription($activity),
                        'userName' => $activity->user_name ?? 'System',
                        'timeAgo' => Carbon::parse($activity->created_at)->diffForHumans(),
                        'timestamp' => $activity->created_at,
                    ];
                })
                ->toArray();

            return $activities;
        } catch (\Exception $e) {
            return [];
        }
    }

    /**
     * Format activity description.
     */
    protected function formatActivityDescription($activity): string
    {
        $action = ucfirst($activity->action ?? 'performed action');
        $model = class_basename($activity->model_type ?? 'record');

        return "{$action} {$model}";
    }

    /**
     * Get pending actions that require attention.
     */
    protected function getPendingActions(): array
    {
        $pendingActions = [];

        // Pending user invitations
        if (Schema::hasTable('user_invitations')) {
            $pendingInvitations = DB::table('user_invitations')
                ->whereNull('accepted_at')
                ->where('expires_at', '>', now())
                ->count();
            if ($pendingInvitations > 0) {
                $pendingActions[] = [
                    'type' => 'invitation',
                    'icon' => 'EnvelopeIcon',
                    'count' => $pendingInvitations,
                    'label' => $pendingInvitations === 1 ? 'pending invitation' : 'pending invitations',
                    'route' => 'core.users.invitations',
                    'priority' => 'info',
                ];
            }
        }

        // Users pending approval (if applicable)
        $pendingApproval = User::where('is_active', false)
            ->whereNull('email_verified_at')
            ->count();
        if ($pendingApproval > 0) {
            $pendingActions[] = [
                'type' => 'approval',
                'icon' => 'UserPlusIcon',
                'count' => $pendingApproval,
                'label' => $pendingApproval === 1 ? 'user pending approval' : 'users pending approval',
                'route' => 'core.users.index',
                'priority' => 'warning',
            ];
        }

        // Failed login attempts (last 24 hours)
        if (Schema::hasTable('failed_login_attempts')) {
            $failedLogins = DB::table('failed_login_attempts')
                ->where('created_at', '>', now()->subHours(24))
                ->count();
            if ($failedLogins > 5) {
                $pendingActions[] = [
                    'type' => 'security',
                    'icon' => 'ShieldExclamationIcon',
                    'count' => $failedLogins,
                    'label' => 'failed login attempts (24h)',
                    'route' => 'core.audit-logs.index',
                    'priority' => 'danger',
                ];
            }
        }

        return $pendingActions;
    }

    /**
     * Get users grouped by role.
     */
    protected function getUsersByRole(): array
    {
        try {
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

            return $roles;
        } catch (\Exception $e) {
            return [];
        }
    }

    /**
     * Get color for role based on name.
     */
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

        $lowerName = strtolower($roleName);

        return $colorMap[$lowerName] ?? '#8b5cf6';
    }

    /**
     * Get active modules.
     */
    protected function getActiveModules(): array
    {
        $allModules = [
            ['code' => 'core', 'name' => 'Core', 'icon' => 'HomeIcon', 'enabled' => true],
            ['code' => 'hrm', 'name' => 'Human Resources', 'icon' => 'UserGroupIcon', 'enabled' => false],
            ['code' => 'finance', 'name' => 'Finance', 'icon' => 'CurrencyDollarIcon', 'enabled' => false],
            ['code' => 'crm', 'name' => 'CRM', 'icon' => 'UserCircleIcon', 'enabled' => false],
            ['code' => 'project', 'name' => 'Projects', 'icon' => 'FolderIcon', 'enabled' => false],
            ['code' => 'inventory', 'name' => 'Inventory', 'icon' => 'CubeIcon', 'enabled' => false],
            ['code' => 'pos', 'name' => 'POS', 'icon' => 'ShoppingCartIcon', 'enabled' => false],
            ['code' => 'scm', 'name' => 'Supply Chain', 'icon' => 'TruckIcon', 'enabled' => false],
        ];

        // Check which modules are actually enabled
        if (Schema::hasTable('modules')) {
            $enabledModuleCodes = DB::table('modules')
                ->where('is_active', true)
                ->pluck('code')
                ->toArray();

            foreach ($allModules as &$module) {
                $module['enabled'] = in_array($module['code'], $enabledModuleCodes) || $module['code'] === 'core';
            }
        }

        return $allModules;
    }

    /**
     * Get security overview.
     */
    protected function getSecurityOverview(): array
    {
        $totalUsers = User::count();

        // 2FA enabled users
        $twoFactorEnabled = User::whereNotNull('two_factor_secret')->count();

        // Failed logins in last 24 hours
        $failedLogins = 0;
        if (Schema::hasTable('failed_login_attempts')) {
            $failedLogins = DB::table('failed_login_attempts')
                ->where('created_at', '>', now()->subHours(24))
                ->count();
        }

        // Active sessions
        $activeSessions = 0;
        if (Schema::hasTable('sessions')) {
            $activeSessions = DB::table('sessions')
                ->where('last_activity', '>', now()->subMinutes(30)->timestamp)
                ->count();
        }

        // Locked accounts
        $lockedAccounts = 0;
        if (Schema::hasColumn('users', 'account_locked_at')) {
            $lockedAccounts = User::whereNotNull('account_locked_at')->count();
        }

        // Last security event
        $lastSecurityEvent = null;
        if (Schema::hasTable('audit_logs')) {
            $event = DB::table('audit_logs')
                ->whereIn('action', ['login', 'logout', 'password_change', 'role_change'])
                ->orderBy('created_at', 'desc')
                ->first();
            if ($event) {
                $lastSecurityEvent = Carbon::parse($event->created_at)->diffForHumans();
            }
        }

        return [
            'twoFactorEnabled' => $twoFactorEnabled,
            'twoFactorPercentage' => $totalUsers > 0 ? round(($twoFactorEnabled / $totalUsers) * 100, 1) : 0,
            'failedLogins24h' => $failedLogins,
            'activeSessions' => $activeSessions,
            'lockedAccounts' => $lockedAccounts,
            'lastSecurityEvent' => $lastSecurityEvent,
        ];
    }

    /**
     * Get system health metrics.
     */
    protected function getSystemHealth(): array
    {
        // Database health
        $databaseHealthy = true;
        $databaseLatency = 0;
        try {
            $start = microtime(true);
            DB::connection()->getPdo();
            $databaseLatency = round((microtime(true) - $start) * 1000, 2);
        } catch (\Exception $e) {
            $databaseHealthy = false;
        }

        // Queue health (pending jobs)
        $pendingJobs = 0;
        if (Schema::hasTable('jobs')) {
            $pendingJobs = DB::table('jobs')->count();
        }

        // Failed jobs
        $failedJobs = 0;
        if (Schema::hasTable('failed_jobs')) {
            $failedJobs = DB::table('failed_jobs')->count();
        }

        // Cache health
        $cacheHealthy = true;
        try {
            cache()->put('health_check', true, 1);
            cache()->forget('health_check');
        } catch (\Exception $e) {
            $cacheHealthy = false;
        }

        return [
            'serverStatus' => 'online',
            'databaseStatus' => $databaseHealthy ? 'healthy' : 'error',
            'databaseLatency' => $databaseLatency,
            'cacheStatus' => $cacheHealthy ? 'healthy' : 'error',
            'pendingJobs' => $pendingJobs,
            'failedJobs' => $failedJobs,
            'phpVersion' => PHP_VERSION,
            'laravelVersion' => app()->version(),
        ];
    }

    /**
     * Get system announcements.
     */
    protected function getAnnouncements(): array
    {
        $announcements = [];

        // Check for system settings announcements
        if (Schema::hasTable('system_settings')) {
            $setting = DB::table('system_settings')
                ->where('key', 'announcements')
                ->first();

            if ($setting && $setting->value) {
                $decoded = json_decode($setting->value, true);
                if (is_array($decoded)) {
                    $announcements = $decoded;
                }
            }
        }

        // Add default announcements if empty
        if (empty($announcements)) {
            $announcements = [
                [
                    'id' => 1,
                    'type' => 'info',
                    'title' => 'Welcome to Your Dashboard',
                    'message' => 'This is your central hub for managing your organization.',
                    'date' => now()->format('M j, Y'),
                ],
            ];
        }

        return array_slice($announcements, 0, 5);
    }

    /**
     * Get activity chart data for the last 7 days.
     */
    protected function getActivityChartData(): array
    {
        $chartData = [];

        for ($i = 6; $i >= 0; $i--) {
            $date = now()->subDays($i);
            $dayLabel = $date->format('D');

            // User logins/activity
            $activity = 0;
            if (Schema::hasTable('audit_logs')) {
                $activity = DB::table('audit_logs')
                    ->whereDate('created_at', $date->toDateString())
                    ->count();
            } elseif (Schema::hasTable('sessions')) {
                $activity = DB::table('sessions')
                    ->whereDate('last_activity', $date->toDateString())
                    ->count();
            }

            // New users
            $newUsers = User::whereDate('created_at', $date->toDateString())->count();

            $chartData[] = [
                'day' => $dayLabel,
                'date' => $date->format('M j'),
                'activity' => $activity,
                'newUsers' => $newUsers,
            ];
        }

        return $chartData;
    }

    /**
     * Get dashboard stats (for async loading/refresh).
     */
    public function stats(Request $request)
    {
        return response()->json($this->getQuickStats());
    }

    /**
     * Get recent activity (for async loading).
     */
    public function activity(Request $request)
    {
        $limit = $request->input('limit', 10);

        return response()->json($this->getRecentActivity($limit));
    }
}
