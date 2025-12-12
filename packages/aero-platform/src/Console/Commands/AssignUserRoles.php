<?php

namespace Aero\Platform\Console\Commands;

use Aero\Core\Models\User;
use Illuminate\Console\Command;
use Spatie\Permission\Models\Role;

class AssignUserRoles extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'assign:user-roles {super-admin-id?} {--force : Force clear and reassign all roles}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Assign Super Administrator role to specific user and Employee role to all others';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $superAdminId = $this->argument('super-admin-id') ?? 18;

        // Check if roles exist
        $superAdminRole = Role::where('name', 'Super Administrator')->first();
        $employeeRole = Role::where('name', 'Employee')->first();

        if (! $superAdminRole || ! $employeeRole) {
            $this->error('Required roles not found. Please run the seeder first.');

            return 1;
        }

        // Force clear all roles if option is set
        if ($this->option('force')) {
            $this->warn('Force option detected. Clearing all existing role assignments...');
            \DB::table('model_has_roles')->truncate();
            $this->info('Cleared all role assignments from model_has_roles table.');
            // Reset permissions cache
            app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();
        }

        // Get all users
        $users = User::all();

        if ($users->isEmpty()) {
            $this->error('No users found in the database.');

            return 1;
        }

        $superAdminUser = null;
        $employeeCount = 0;

        foreach ($users as $user) {
            // Clear existing roles first
            $user->syncRoles([]);

            if ($user->id == $superAdminId) {
                $user->assignRole('Super Administrator');
                $superAdminUser = $user;
                $this->info("✅ Super Administrator role assigned to: {$user->name} (ID: {$user->id}, Email: {$user->email})");
            } else {
                $user->assignRole('Employee');
                $employeeCount++;
            }
        }

        if (! $superAdminUser) {
            $this->warn("⚠️  User with ID {$superAdminId} not found. No Super Administrator assigned.");
        }

        $this->info("✅ Employee role assigned to {$employeeCount} users.");
        $this->info('🎉 Role assignment completed successfully!');

        // Verify the assignments
        $this->info('Verifying role assignments...');

        // Check if user with provided ID has Super Administrator role
        $verificationSuperAdmin = User::find($superAdminId);
        if ($verificationSuperAdmin && $verificationSuperAdmin->hasRole('Super Administrator')) {
            $this->info("✅ Verified: User {$superAdminId} has Super Administrator role");
        } elseif ($verificationSuperAdmin) {
            $this->error("❌ Verification failed: User {$superAdminId} does NOT have Super Administrator role");
        }

        // Reset permissions cache again
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        $this->info('Done! Please clear all application caches for changes to take effect:');
        $this->info('php artisan cache:clear');
        $this->info('php artisan config:clear');
        $this->info('php artisan route:clear');
        $this->info('php artisan permission:cache-reset');

        return 0;
    }
}
