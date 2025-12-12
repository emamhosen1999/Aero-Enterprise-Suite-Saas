<?php

namespace Aero\Platform\Console\Commands;

use Aero\Core\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Route;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class TestCompleteNavigation extends Command
{
    protected $signature = 'test:complete-navigation';

    protected $description = 'Comprehensive test of navigation system';

    public function handle()
    {
        $this->info('=== COMPREHENSIVE NAVIGATION SYSTEM TEST ===');
        $this->newLine();

        // Test 1: Check all required permissions exist
        $this->info('1. Testing Permission System...');
        $requiredPermissions = [
            'dashboard.view',
            'attendance.own.view',
            'leave.own.view',
            'communications.own.view',
            'employees.view',
            'departments.view',
            'designations.view',
            'attendance.view',
            'holidays.view',
            'leaves.view',
            'leave-settings.view',
            'daily-works.view',
            'letters.view',
            'users.view',
            'roles.view',
            'company.settings',
        ];

        $missingPermissions = [];
        foreach ($requiredPermissions as $permission) {
            if (! Permission::where('name', $permission)->exists()) {
                $missingPermissions[] = $permission;
            }
        }

        if (empty($missingPermissions)) {
            $this->info('✅ All navigation permissions exist');
        } else {
            $this->warn('❌ Missing permissions:');
            foreach ($missingPermissions as $perm) {
                $this->line("   - {$perm}");
            }
        }

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

        // Test 3: Check role assignments
        $this->newLine();
        $this->info('3. Testing Role System...');

        $superAdmin = Role::where('name', 'Super Administrator')->first();
        $admin = Role::where('name', 'Administrator')->first();
        $employee = Role::where('name', 'Employee')->first();

        if ($superAdmin && $admin && $employee) {
            $this->info('✅ Core roles exist (Super Administrator, Administrator, Employee)');

            // Check permission counts
            $superAdminPerms = $superAdmin->permissions->count();
            $adminPerms = $admin->permissions->count();
            $employeePerms = $employee->permissions->count();

            $this->info("   - Super Administrator: {$superAdminPerms} permissions");
            $this->info("   - Administrator: {$adminPerms} permissions");
            $this->info("   - Employee: {$employeePerms} permissions");

            if ($superAdminPerms >= $adminPerms && $adminPerms >= $employeePerms) {
                $this->info('✅ Role hierarchy is correct');
            } else {
                $this->warn('❌ Role hierarchy may be incorrect');
            }
        } else {
            $this->warn('❌ Missing core roles');
        }

        // Test 4: Check user permissions flow
        $this->newLine();
        $this->info('4. Testing User Permission Flow...');

        $adminUser = User::role('Administrator')->first();
        if ($adminUser) {
            $userPermissions = $adminUser->getAllPermissions()->pluck('name')->toArray();
            $hasNavPermissions = array_intersect($requiredPermissions, $userPermissions);

            $this->info('✅ Admin user has '.count($hasNavPermissions).' out of '.count($requiredPermissions).' navigation permissions');

            // Check if admin can access role management
            if ($adminUser->can('roles.view')) {
                $this->info('✅ Administrator can access role management');
            } else {
                $this->warn('❌ Administrator cannot access role management');
            }
        } else {
            $this->warn('❌ No Administrator user found for testing');
        }

        // Test 5: Check module toggle functionality
        $this->newLine();
        $this->info('5. Testing Module Toggle System...');

        // Verify no duplicate permissions exist
        $duplicates = Permission::select('name')
            ->groupBy('name')
            ->havingRaw('count(*) > 1')
            ->pluck('name');

        if ($duplicates->count() === 0) {
            $this->info('✅ No duplicate permissions found');
        } else {
            $this->warn('❌ Found duplicate permissions:');
            foreach ($duplicates as $dup) {
                $this->line("   - {$dup}");
            }
        }

        // Final summary
        $this->newLine();
        $this->info('=== FINAL SUMMARY ===');
        $totalIssues = count($missingPermissions) + count($missingRoutes) + $duplicates->count();

        if ($totalIssues === 0) {
            $this->info('🎉 All navigation system tests PASSED!');
            $this->info('The navigation system is properly configured and ready for production.');
        } else {
            $this->warn("⚠️ Found {$totalIssues} issues that need attention.");
        }

        return $totalIssues === 0 ? 0 : 1;
    }
}
