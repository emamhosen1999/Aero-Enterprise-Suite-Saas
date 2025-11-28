<?php

namespace App\Console\Commands;

use App\Models\User;
use App\Services\Role\RolePermissionService;
use Illuminate\Console\Command;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class TestRoleSystem extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'test:roles {--user=1}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Test the Spatie role and permission system';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('🚀 Testing Spatie Role and Permission System');
        $this->newLine();

        // Test 1: Check basic setup
        $this->info('📋 Test 1: Basic System Check');
        $userCount = User::count();
        $roleCount = Role::count();
        $permissionCount = Permission::count();

        $this->table(
            ['Component', 'Count'],
            [
                ['Users', $userCount],
                ['Roles', $roleCount],
                ['Permissions', $permissionCount],
            ]
        );

        // Test 2: Check specific user
        $userId = $this->option('user');
        $user = User::find($userId);

        if (! $user) {
            $this->error("User with ID {$userId} not found");

            return 1;
        }

        $this->info("👤 Test 2: User Analysis - {$user->name}");
        $userRoles = $user->roles->pluck('name')->toArray();
        $userPermissions = $user->getAllPermissions()->pluck('name')->take(10)->toArray();

        $this->table(
            ['Property', 'Value'],
            [
                ['User ID', $user->id],
                ['Name', $user->name],
                ['Email', $user->email],
                ['Roles', implode(', ', $userRoles)],
                ['Permissions (first 10)', implode(', ', $userPermissions)],
            ]
        );

        // Test 3: Test role checks
        $this->info('🔐 Test 3: Role and Permission Checks');
        $checks = [
            'Has Super Administrator role' => $user->hasRole('Super Administrator'),
            'Has Administrator role' => $user->hasRole('Administrator'),
            'Can read roles' => $user->can('read roles'),
            'Can create roles' => $user->can('create roles'),
            'Can delete roles' => $user->can('delete roles'),
        ];

        foreach ($checks as $check => $result) {
            $status = $result ? '✅ PASS' : '❌ FAIL';
            $this->line("{$check}: {$status}");
        }

        // Test 4: Test RolePermissionService
        $this->newLine();
        $this->info('🛠️ Test 4: RolePermissionService Test');

        try {
            $roleService = new RolePermissionService;
            $modules = $roleService->getEnterpriseModules();
            $this->info('✅ RolePermissionService loaded successfully');
            $this->info('📦 Enterprise modules available: '.count($modules));
        } catch (\Exception $e) {
            $this->error('❌ RolePermissionService failed: '.$e->getMessage());
        }

        // Test 5: Test database relationships
        $this->newLine();
        $this->info('🔗 Test 5: Database Relationships');

        try {
            $sampleRole = Role::with('permissions')->first();
            if ($sampleRole) {
                $this->info('✅ Role-Permission relationship working');
                $this->info("🎯 Sample role '{$sampleRole->name}' has {$sampleRole->permissions->count()} permissions");
            }

            $roleUsers = $user->roles()->with('users')->get();
            $this->info('✅ User-Role relationship working');

        } catch (\Exception $e) {
            $this->error('❌ Database relationship test failed: '.$e->getMessage());
        }

        $this->newLine();
        $this->info('🎉 Role system test completed!');

        return 0;
    }
}
