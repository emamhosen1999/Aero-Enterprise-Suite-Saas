<?php

namespace Database\Seeders;

use App\Models\Platform\LandlordUser;
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
            ['email' => 'admin@aeos365.com'],
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
        $role = Role::where('name', 'Super Administrator')
            ->where('guard_name', 'landlord')
            ->first();

        if ($role && ! $user->hasRole('Super Administrator', 'landlord')) {
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
            'Super Administrator' => [
                'description' => 'Has unrestricted access to the entire platform. Can manage all modules, tenants, users, permissions, billing, and system configuration.',
                'is_protected' => true,
            ],
            'Administrator' => [
                'description' => 'Manages high-level administrative tasks including tenant setup, user management, and module configuration.',
                'is_protected' => false,
            ],
            'Support' => [
                'description' => 'Handles support operations, assists users, and resolves system issues within permitted modules.',
                'is_protected' => false,
            ],
            'Viewer' => [
                'description' => 'Read-only access to permitted modules and data without the ability to modify anything.',
                'is_protected' => false,
            ],
            'Auditor' => [
                'description' => 'Reviews system changes, audits logs, and ensures compliance visibility.',
                'is_protected' => false,
            ],
            'Billing Manager' => [
                'description' => 'Manages billing, invoices, payments, and subscription plans.',
                'is_protected' => false,
            ],
            'User Manager' => [
                'description' => 'Responsible for managing users, roles, and permissions.',
                'is_protected' => false,
            ],
            'Module Manager' => [
                'description' => 'Controls activation, configuration, and visibility of modules.',
                'is_protected' => false,
            ],
            'System Manager' => [
                'description' => 'Manages system-level configurations, integrations, and platform-wide settings.',
                'is_protected' => false,
            ],
            'Security Manager' => [
                'description' => 'Oversees security configurations, access control, and risk management.',
                'is_protected' => false,
            ],
            'Compliance Officer' => [
                'description' => 'Ensures compliance with internal policies and regulatory requirements.',
                'is_protected' => false,
            ],
            'Developer' => [
                'description' => 'Technical role for development, debugging, and system enhancements.',
                'is_protected' => false,
            ],
            'Operator' => [
                'description' => 'Handles routine operational workflows and maintenance tasks.',
                'is_protected' => false,
            ],
            'Read-Only User' => [
                'description' => 'Read-only access across allowable modules without modification rights.',
                'is_protected' => false,
            ],
            'Guest User' => [
                'description' => 'Temporary user with minimal access for viewing basic data.',
                'is_protected' => false,
            ],
        ];

        foreach ($roles as $roleName => $meta) {
            Role::firstOrCreate(
                ['name' => $roleName, 'guard_name' => 'landlord'],
                [
                    'description' => $meta['description'],
                    'is_protected' => $meta['is_protected'],
                    'scope' => 'platform',    // ← added for ALL platform roles
                ]
            );
        }

        $this->command->info('✅ Platform roles created/verified with descriptions, protection flags, and platform scope.');
    }
}
