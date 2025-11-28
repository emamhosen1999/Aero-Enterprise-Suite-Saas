<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class EventPermissionsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create event permissions
        $permissions = [
            'event.view' => 'View events',
            'event.create' => 'Create events',
            'event.update' => 'Update events',
            'event.delete' => 'Delete events',
            'event.registration.manage' => 'Manage event registrations',
        ];

        foreach ($permissions as $name => $description) {
            Permission::firstOrCreate(
                ['name' => $name],
                ['guard_name' => 'web']
            );
        }

        // Assign permissions to Super Administrator role
        $superAdmin = Role::where('name', 'Super Administrator')->first();
        if ($superAdmin) {
            $superAdmin->givePermissionTo(array_keys($permissions));
        }

        // Assign permissions to Administrator role
        $admin = Role::where('name', 'Administrator')->first();
        if ($admin) {
            $admin->givePermissionTo(array_keys($permissions));
        }

        // Assign view and registration management to HR Manager
        $hrManager = Role::where('name', 'HR Manager')->first();
        if ($hrManager) {
            $hrManager->givePermissionTo([
                'event.view',
                'event.registration.manage',
            ]);
        }

        $this->command->info('Event management permissions seeded successfully!');
    }
}
