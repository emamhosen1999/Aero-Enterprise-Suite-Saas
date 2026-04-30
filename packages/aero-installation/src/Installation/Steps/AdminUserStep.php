<?php

namespace Aero\Installation\Installation\Steps;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

/**
 * Admin User Step
 *
 * Creates the initial admin/landlord user if it doesn't exist
 */
class AdminUserStep extends BaseInstallationStep
{
    public function name(): string
    {
        return 'admin';
    }

    public function description(): string
    {
        return 'Create initial admin user account';
    }

    public function order(): int
    {
        return 5;
    }

    public function dependencies(): array
    {
        return ['config', 'database', 'migration'];
    }

    public function execute(): array
    {
        $adminEmail = env('ADMIN_EMAIL', 'admin@aeros.test');
        $adminPassword = env('ADMIN_PASSWORD', 'Admin@12345');
        $adminName = env('ADMIN_NAME', 'Administrator');

        if (empty($adminEmail) || empty($adminPassword)) {
            throw new \Exception('ADMIN_EMAIL and ADMIN_PASSWORD environment variables are required');
        }

        // Check if admin already exists
        $existingAdmin = $this->getUserByEmail($adminEmail);
        if ($existingAdmin) {
            $this->log("Admin user already exists: {$adminEmail}");

            return [
                'admin_created' => false,
                'admin_exists' => true,
                'email' => $adminEmail,
            ];
        }

        // Create admin user
        try {
            $adminId = DB::table('users')->insertGetId([
                'name' => $adminName,
                'email' => $adminEmail,
                'password' => Hash::make($adminPassword),
                'email_verified_at' => now(),
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            $this->log("Admin user created: {$adminEmail} (ID: {$adminId})");

            // Assign admin role (if roles table exists)
            $this->assignAdminRole($adminId);

            return [
                'admin_created' => true,
                'admin_id' => $adminId,
                'email' => $adminEmail,
            ];

        } catch (\Exception $e) {
            throw new \Exception('Failed to create admin user: '.$e->getMessage());
        }
    }

    public function validate(): bool
    {
        $adminEmail = env('ADMIN_EMAIL', 'admin@aeros.test');

        return $this->getUserByEmail($adminEmail) !== null;
    }

    /**
     * Get user by email
     */
    protected function getUserByEmail(string $email): ?array
    {
        try {
            $user = DB::table('users')
                ->where('email', $email)
                ->first();

            return $user ? (array) $user : null;

        } catch (\Exception) {
            return null;
        }
    }

    /**
     * Assign admin role to user
     */
    protected function assignAdminRole(int $userId): void
    {
        try {
            // Check if roles table exists
            if (! DB::table('roles')->exists()) {
                return;
            }

            $adminRole = DB::table('roles')
                ->where('name', 'admin')
                ->first();

            if (! $adminRole) {
                return;
            }

            // Assign role (if model_has_roles table exists)
            try {
                DB::table('model_has_roles')->insert([
                    'role_id' => $adminRole->id,
                    'model_type' => 'App\Models\User',
                    'model_id' => $userId,
                ]);
            } catch (\Exception) {
                // Table might not exist yet
            }

        } catch (\Exception) {
            // Roles not set up yet
        }
    }

    public function canSkip(): bool
    {
        return false;
    }

    public function isRetriable(): bool
    {
        return true;
    }
}
