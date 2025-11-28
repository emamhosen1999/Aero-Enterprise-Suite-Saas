<?php

namespace App\Console\Commands;

use App\Services\Role\RolePermissionService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Route;

class TestNavigationRoutes extends Command
{
    protected $signature = 'test:navigation';

    protected $description = 'Test all navigation routes and permissions';

    public function handle()
    {
        $this->info('=== TESTING NAVIGATION ROUTES AND PERMISSIONS ===');
        $this->newLine();

        // Get all available permissions
        $service = new RolePermissionService;
        $permissionsGrouped = $service->getPermissionsGroupedByModule();

        // List of expected routes from navigation
        $expectedRoutes = [
            'dashboard' => 'dashboard.view',
            'attendance-employee' => 'attendance.own.view',
            'leaves-employee' => 'leave.own.view',
            'emails' => 'communications.own.view',
            'employees' => 'employees.view',
            'departments' => 'departments.view',
            'designations' => 'designations.view',
            'attendances' => 'attendance.view',
            'holidays' => 'holidays.view',
            'leaves' => 'leaves.view',
            'leave-summary' => 'leaves.view',
            'leave-settings' => 'leave-settings.view',
            'daily-works' => 'daily-works.view',
            'daily-works-summary' => 'daily-works.view',
            'letters' => 'letters.view',
            'users' => 'users.view',
            'admin.roles-management' => 'roles.view',
            'admin.settings.company' => 'company.settings',
        ];

        $this->info('Testing route definitions...');
        $this->newLine();

        $missingRoutes = [];
        $workingRoutes = [];

        foreach ($expectedRoutes as $routeName => $permission) {
            try {
                if (Route::has($routeName)) {
                    $workingRoutes[] = $routeName;
                    $this->line("✅ {$routeName} - Route exists (requires: {$permission})");
                } else {
                    $missingRoutes[] = $routeName;
                    $this->line("❌ {$routeName} - Route MISSING (requires: {$permission})");
                }
            } catch (\Exception $e) {
                $missingRoutes[] = $routeName;
                $this->line("❌ {$routeName} - Error: ".$e->getMessage());
            }
        }

        $this->newLine();
        $this->info('=== SUMMARY ===');
        $this->info('Working routes: '.count($workingRoutes));
        $this->info('Missing routes: '.count($missingRoutes));

        if (! empty($missingRoutes)) {
            $this->newLine();
            $this->warn('Missing routes that need to be defined:');
            foreach ($missingRoutes as $route) {
                $this->line("- {$route}");
            }
        }

        $this->newLine();
        $this->info('Testing module permissions alignment...');

        // Check if all navigation permissions exist in the system
        $allPermissionNames = [];
        foreach ($permissionsGrouped as $module => $moduleData) {
            foreach ($moduleData['permissions'] as $perm) {
                $allPermissionNames[] = $perm['name'];
            }
        }

        $missingPermissions = [];
        foreach ($expectedRoutes as $routeName => $permission) {
            if (! in_array($permission, $allPermissionNames)) {
                $missingPermissions[] = $permission;
            }
        }

        if (! empty($missingPermissions)) {
            $this->newLine();
            $this->warn("Navigation references permissions that don't exist:");
            foreach ($missingPermissions as $perm) {
                $this->line("- {$perm}");
            }
        } else {
            $this->info('✅ All navigation permissions are properly defined');
        }

        return count($missingRoutes) === 0 && count($missingPermissions) === 0 ? 0 : 1;
    }
}
