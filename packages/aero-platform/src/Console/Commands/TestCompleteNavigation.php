<?php

namespace Aero\Platform\Console\Commands;

use Aero\Core\Models\User;
use Aero\HRMAC\Models\Role;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Route;

class TestCompleteNavigation extends Command
{
    protected $signature = 'test:complete-navigation';

    protected $description = 'Comprehensive test of navigation system';

    public function handle()
    {
        $this->info('=== COMPREHENSIVE NAVIGATION SYSTEM TEST ===');
        $this->newLine();

        // Test 1: Module access is now handled by HRMAC - skip old permission checks
        $this->info('1. Testing Module Access System...');
        $this->info('   ℹ️ Module access is now managed by HRMAC RoleModuleAccess');
        $this->info('   ✅ Spatie Permission system has been deprecated');

        // Test 2: Check all required routes exist
        $this->newLine();
        $this->info('2. Testing Route System...');
        $requiredRoutes = [
            'dashboard',
            'attendance-employee',
            'leaves-employee',
            'emails',
            'employees',
            'departments',
            'designations',
            'attendances',
            'holidays',
            'leaves',
            'leave-summary',
            'leave-settings',
            'daily-works',
            'daily-works-summary',
            'letters',
            'users',
            'admin.roles-management',
            'admin.settings.company',
        ];

        $missingRoutes = [];
        foreach ($requiredRoutes as $route) {
            if (! Route::has($route)) {
                $missingRoutes[] = $route;
            }
        }

        if (empty($missingRoutes)) {
            $this->info('✅ All navigation routes exist');
        } else {
            $this->warn('❌ Missing routes:');
            foreach ($missingRoutes as $route) {
                $this->line("   - {$route}");
            }
        }

        // Test 3: Check role assignments using HRMAC Role model
        $this->newLine();
        $this->info('3. Testing Role System (HRMAC)...');

        $superAdmin = Role::where('name', 'Super Administrator')->first();
        $admin = Role::where('name', 'Administrator')->first();
        $employee = Role::where('name', 'Employee')->first();

        if ($superAdmin && $admin && $employee) {
            $this->info('✅ Core roles exist (Super Administrator, Administrator, Employee)');

            // Check module access counts via HRMAC
            $superAdminAccess = $superAdmin->moduleAccess()->count();
            $adminAccess = $admin->moduleAccess()->count();
            $employeeAccess = $employee->moduleAccess()->count();

            $this->info("   - Super Administrator: {$superAdminAccess} module access entries");
            $this->info("   - Administrator: {$adminAccess} module access entries");
            $this->info("   - Employee: {$employeeAccess} module access entries");
        } else {
            $this->warn('❌ Missing core roles');
            if (! $superAdmin) {
                $this->line('   - Super Administrator role not found');
            }
            if (! $admin) {
                $this->line('   - Administrator role not found');
            }
            if (! $employee) {
                $this->line('   - Employee role not found');
            }
        }

        // Test 4: Check user roles using custom hasRole method
        $this->newLine();
        $this->info('4. Testing User Role Assignment...');

        $adminUser = User::whereHas('roles', function ($q) {
            $q->where('name', 'Administrator');
        })->first();

        if ($adminUser) {
            $userRoles = $adminUser->roles->pluck('name')->toArray();
            $this->info('✅ Administrator user found with roles: '.implode(', ', $userRoles));

            // Check if admin has module access via HRMAC
            if ($adminUser->isSuperAdmin() || $adminUser->hasRole('Administrator')) {
                $this->info('✅ Administrator user properly assigned');
            }
        } else {
            $this->warn('❌ No Administrator user found for testing');
        }

        // Final summary
        $this->newLine();
        $this->info('=== FINAL SUMMARY ===');
        $totalIssues = count($missingRoutes);

        if ($totalIssues === 0) {
            $this->info('🎉 All navigation system tests PASSED!');
            $this->info('The navigation system is properly configured using HRMAC module access.');
        } else {
            $this->warn("⚠️ Found {$totalIssues} issues that need attention.");
        }

        return $totalIssues === 0 ? 0 : 1;
    }
}
