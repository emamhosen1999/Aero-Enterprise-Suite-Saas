<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class CheckRolesPermissions extends Command
{
    protected $signature = 'roles:check';

    protected $description = 'Check roles and permissions in the database';

    public function handle()
    {
        $this->info('=== ROLES AND PERMISSIONS ANALYSIS ===');
        $this->newLine();

        // Total counts
        $totalRoles = Role::count();
        $totalPermissions = Permission::count();

        $this->info("Total Roles: {$totalRoles}");
        $this->info("Total Permissions: {$totalPermissions}");
        $this->newLine();

        // List all roles
        $this->info('=== ROLES ===');
        $roles = Role::with('permissions')->get();
        foreach ($roles as $role) {
            $permissionCount = $role->permissions->count();
            $this->line("- {$role->name} (ID: {$role->id}) - {$permissionCount} permissions");
        }
        $this->newLine();

        // Group permissions by module
        $this->info('=== PERMISSIONS BY MODULE ===');
        $permissions = Permission::all();
        $grouped = $permissions->groupBy(function ($permission) {
            // Extract module from permission name (e.g., "read users" -> "users")
            $parts = explode(' ', $permission->name);

            return $parts[1] ?? 'ungrouped';
        });

        foreach ($grouped as $module => $modulePermissions) {
            $count = $modulePermissions->count();
            $this->line("{$module}: {$count} permissions");

            // Show the actual permissions for debugging
            foreach ($modulePermissions as $perm) {
                $this->line("  - {$perm->name}");
            }
        }
        $this->newLine();

        // Check for duplicate permissions
        $this->info('=== CHECKING FOR DUPLICATES ===');
        $duplicates = Permission::select('name')
            ->groupBy('name')
            ->havingRaw('count(*) > 1')
            ->pluck('name');

        if ($duplicates->count() > 0) {
            $this->warn('Found duplicate permissions:');
            foreach ($duplicates as $duplicate) {
                $count = Permission::where('name', $duplicate)->count();
                $this->line("- {$duplicate} ({$count} copies)");
            }
        } else {
            $this->info('No duplicate permissions found.');
        }

        return 0;
    }
}
