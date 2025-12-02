<?php

namespace Database\Seeders;

use App\Models\LandlordUser;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;

class LandlordUserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create platform roles if they don't exist (for landlord guard)
        $this->createPlatformRoles();

        // Create the default super admin user if it doesn't exist
        $user = LandlordUser::firstOrCreate(
            ['email' => 'admin@aero-enterprise-suite-saas.com'],
            [
                'user_name' => 'platform-super-admin',
                'name' => 'Platform Super Admin',
                'password' => Hash::make('password'),
                'phone' => null,
                'active' => true,
                'timezone' => 'UTC',
                'email_verified_at' => now(),
            ]
        );

        // Assign the Platform Super Admin role
        // For landlord users, we manually insert into model_has_roles with tenant_id = NULL
        $role = Role::where('name', 'Platform Super Admin')
            ->where('guard_name', 'landlord')
            ->first();

        if ($role && ! $user->hasRole('Platform Super Admin', 'landlord')) {
            // Manually insert into pivot table to avoid tenant_id issues
            \DB::table('model_has_roles')->insertOrIgnore([
                'role_id' => $role->id,
                'model_type' => get_class($user),
                'model_id' => $user->id,
                'tenant_id' => null, // Landlord users don't have tenant_id
            ]);

            // Clear cached roles
            $user->forgetCachedPermissions();
        }

        $this->command->info('✅ Landlord super admin user created/verified.');
    }

    /**
     * Create platform-specific roles for landlord guard.
     */
    protected function createPlatformRoles(): void
    {
        $roles = [
            'Platform Super Admin',
            'Platform Admin',
            'Platform Support',
        ];

        foreach ($roles as $roleName) {
            Role::firstOrCreate(
                ['name' => $roleName, 'guard_name' => 'landlord']
            );
        }

        $this->command->info('✅ Platform roles created/verified.');
    }
}
