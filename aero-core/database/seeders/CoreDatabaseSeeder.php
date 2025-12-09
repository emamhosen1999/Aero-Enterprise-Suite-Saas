<?php

namespace Aero\Core\Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;

/**
 * Core Database Seeder
 * 
 * Seeds essential data for aero-core package
 */
class CoreDatabaseSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $this->seedDefaultRole();
        $this->seedDefaultUser();
        $this->seedSystemSettings();
    }

    /**
     * Seed default admin role
     */
    protected function seedDefaultRole(): void
    {
        // Check if roles table exists
        if (!$this->tableExists('roles')) {
            $this->command->warn('Roles table does not exist. Skipping role seeding.');
            return;
        }

        // Check if any admin-type role exists
        $existingAdminRole = DB::table('roles')
            ->whereIn('name', ['admin', 'Admin', 'administrator', 'Administrator', 'Super Administrator'])
            ->where('guard_name', 'web')
            ->first();

        if ($existingAdminRole) {
            $this->command->info("Admin role already exists: {$existingAdminRole->name}");
            return;
        }

        // Create admin role if none exists
        DB::table('roles')->insert([
            'name' => 'Admin',
            'guard_name' => 'web',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $this->command->info('Admin role created.');
    }

    /**
     * Seed a default admin user
     */
    protected function seedDefaultUser(): void
    {
        // Check if users table exists
        if (!$this->tableExists('users')) {
            $this->command->warn('Users table does not exist. Skipping user seeding.');
            return;
        }

        // Check if user already exists
        if (DB::table('users')->where('email', 'admin@example.com')->exists()) {
            $this->command->info('Admin user already exists. Skipping.');
            return;
        }

        // Build user data with only columns that exist
        $userData = [
            'name' => 'Admin User',
            'email' => 'admin@example.com',
            'password' => Hash::make('password'),
            'email_verified_at' => now(),
            'created_at' => now(),
            'updated_at' => now(),
        ];

        // Add optional columns if they exist
        $columns = $this->getTableColumns('users');
        
        if (in_array('is_active', $columns)) {
            $userData['is_active'] = true;
        }
        
        if (in_array('active', $columns)) {
            $userData['active'] = true;
        }

        if (in_array('user_name', $columns)) {
            $userData['user_name'] = 'admin';
        }

        $userId = DB::table('users')->insertGetId($userData);

        // Assign admin role if role exists and model_has_roles table exists
        if ($this->tableExists('roles') && $this->tableExists('model_has_roles')) {
            // Find any admin-type role
            $adminRole = DB::table('roles')
                ->whereIn('name', ['Super Administrator'])
                ->where('guard_name', 'web')
                ->first();
            
            if ($adminRole) {
                // Check if role assignment already exists
                $exists = DB::table('model_has_roles')
                    ->where('role_id', $adminRole->id)
                    ->where('model_type', 'Aero\Core\Models\User')
                    ->where('model_id', $userId)
                    ->exists();
                
                if (!$exists) {
                    DB::table('model_has_roles')->insert([
                        'role_id' => $adminRole->id,
                        'model_type' => 'Aero\Core\Models\User',
                        'model_id' => $userId,
                    ]);
                    $this->command->info('Admin role assigned to user.');
                } else {
                    $this->command->info('Admin role already assigned.');
                }
            } else {
                $this->command->warn('Admin role not found for assignment.');
            }
        } else {
            $this->command->warn('Roles or model_has_roles table not found for role assignment.');
        }

        $this->command->info('Admin user created: admin@example.com / password');
    }

    /**
     * Seed default system settings
     */
    protected function seedSystemSettings(): void
    {
        // Check if system_settings table exists
        if (!$this->tableExists('system_settings')) {
            $this->command->warn('System settings table does not exist. Skipping settings seeding.');
            return;
        }

        // Check if settings already exist
        if (DB::table('system_settings')->exists()) {
            $this->command->info('System settings already exist. Skipping.');
            return;
        }

        $columns = $this->getTableColumns('system_settings');

        // Check if using key-value structure or company structure
        if (in_array('key', $columns)) {
            // Old key-value structure
            DB::table('system_settings')->insert([
                'key' => 'app_name',
                'value' => json_encode('Aero Core'),
                'type' => 'string',
                'group' => 'general',
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            DB::table('system_settings')->insert([
                'key' => 'app_description',
                'value' => json_encode('Enterprise Application Framework'),
                'type' => 'string',
                'group' => 'general',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        } elseif (in_array('company_name', $columns)) {
            // New company-based structure
            DB::table('system_settings')->insert([
                'slug' => 'default',
                'company_name' => 'Aero Core',
                'legal_name' => 'Aero Enterprise Suite',
                'tagline' => 'Enterprise Resource Planning System',
                'support_email' => 'support@example.com',
                'timezone' => 'UTC',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        $this->command->info('System settings seeded.');
    }

    /**
     * Check if a table exists
     */
    protected function tableExists(string $table): bool
    {
        try {
            return DB::getSchemaBuilder()->hasTable($table);
        } catch (\Throwable $e) {
            return false;
        }
    }

    /**
     * Get table columns
     */
    protected function getTableColumns(string $table): array
    {
        try {
            return DB::getSchemaBuilder()->getColumnListing($table);
        } catch (\Throwable $e) {
            return [];
        }
    }
}
