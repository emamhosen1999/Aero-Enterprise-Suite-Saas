<?php

namespace Aero\Platform\Database\Seeders;

use Aero\Platform\Models\LandlordUser;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;

/**
 * Seeds the platform admin users (LandlordUsers).
 *
 * These users manage the multi-tenant SaaS platform from the admin dashboard.
 */
class LandlordUserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create or update Super Admin role for landlord guard
        $superAdminRole = Role::firstOrCreate(
            ['name' => 'Super Admin', 'guard_name' => 'landlord'],
            ['name' => 'Super Admin', 'guard_name' => 'landlord']
        );

        // Create default platform admin
        $admin = LandlordUser::firstOrCreate(
            ['email' => 'admin@platform.com'],
            [
                'user_name' => 'admin',
                'name' => 'Platform Administrator',
                'email' => 'admin@platform.com',
                'phone' => null,
                'password' => Hash::make('password'),
                'active' => true,
                'timezone' => 'UTC',
                'email_verified_at' => now(),
            ]
        );

        // Manually insert the role relationship with correct model_type
        // This avoids issues with Spatie's assignRole when using custom connections
        $existingRole = DB::connection('central')
            ->table('model_has_roles')
            ->where('role_id', $superAdminRole->id)
            ->where('model_id', $admin->id)
            ->where('model_type', LandlordUser::class)
            ->exists();

        if (! $existingRole) {
            DB::connection('central')->table('model_has_roles')->insert([
                'role_id' => $superAdminRole->id,
                'model_id' => $admin->id,
                'model_type' => LandlordUser::class,
            ]);
        }

        $this->command->info('✓ Created platform admin: admin@platform.com');
    }
}
