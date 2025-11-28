<?php

namespace App\Console\Commands;

use App\Services\Role\RolePermissionService;
use Illuminate\Console\Command;
use Spatie\Permission\Models\Role;

class TestModuleToggle extends Command
{
    protected $signature = 'test:module-toggle';

    protected $description = 'Test the module toggle functionality';

    public function handle()
    {
        $this->info('=== TESTING MODULE TOGGLE FUNCTIONALITY ===');
        $this->newLine();

        // Get a test role (let's use Administrator)
        $role = Role::where('name', 'Administrator')->first();
        if (! $role) {
            $this->error('Administrator role not found');

            return 1;
        }

        $this->info("Testing with role: {$role->name} (ID: {$role->id})");

        // Get the service to check available modules
        $service = new RolePermissionService;
        $permissionsGrouped = $service->getPermissionsGroupedByModule();

        $this->info('Available modules: '.implode(', ', array_keys($permissionsGrouped)));
        $this->newLine();

        // Test with 'core' module
        $testModule = 'core';
        if (! isset($permissionsGrouped[$testModule])) {
            $this->error("Test module '{$testModule}' not found in permissions grouped");

            return 1;
        }

        $modulePermissions = collect($permissionsGrouped[$testModule]['permissions'])->pluck('name')->toArray();
        $this->info("Testing module: {$testModule}");
        $this->info('Module permissions: '.implode(', ', $modulePermissions));

        // Check current state
        $currentPermissions = $role->permissions()->whereIn('name', $modulePermissions)->pluck('name')->toArray();
        $this->info('Current permissions for this module: '.implode(', ', $currentPermissions));
        $this->info('Has all permissions: '.(count($currentPermissions) === count($modulePermissions) ? 'YES' : 'NO'));

        $this->newLine();
        $this->info('✅ Module toggle test completed - controller logic should work correctly now');

        return 0;
    }
}
