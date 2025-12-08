<?php

namespace Aero\Platform\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class CleanupDuplicatePermissions extends Command
{
    protected $signature = 'permissions:cleanup';

    protected $description = 'Clean up duplicate permissions created by faulty module toggle';

    public function handle()
    {
        $this->info('=== CLEANING UP DUPLICATE PERMISSIONS ===');
        $this->newLine();

        DB::beginTransaction();

        try {
            // Find permissions with the new naming convention that shouldn't exist
            $duplicatePermissions = Permission::where('name', 'like', 'read %')
                ->orWhere('name', 'like', 'write %')
                ->orWhere('name', 'like', 'create %')
                ->orWhere('name', 'like', 'delete %')
                ->orWhere('name', 'like', 'import %')
                ->orWhere('name', 'like', 'export %')
                ->get();

            $this->info("Found {$duplicatePermissions->count()} permissions with new naming convention to remove:");

            foreach ($duplicatePermissions as $permission) {
                $this->line("- {$permission->name} (ID: {$permission->id})");

                // Remove permission from all roles first
                $roles = Role::whereHas('permissions', function ($query) use ($permission) {
                    $query->where('permission_id', $permission->id);
                })->get();

                foreach ($roles as $role) {
                    $role->revokePermissionTo($permission);
                    $this->line("  - Removed from role: {$role->name}");
                }

                // Delete the permission
                $permission->delete();
                $this->line('  - Permission deleted');
            }

            DB::commit();

            // Clear permission cache
            app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

            $this->newLine();
            $this->info('✅ Cleanup completed successfully!');
            $this->info("Removed {$duplicatePermissions->count()} duplicate permissions");

            // Show final counts
            $this->newLine();
            $this->info('=== FINAL COUNTS ===');
            $totalRoles = Role::count();
            $totalPermissions = Permission::count();
            $this->info("Total Roles: {$totalRoles}");
            $this->info("Total Permissions: {$totalPermissions}");

        } catch (\Exception $e) {
            DB::rollBack();
            $this->error('Failed to cleanup permissions: '.$e->getMessage());

            return 1;
        }

        return 0;
    }
}
