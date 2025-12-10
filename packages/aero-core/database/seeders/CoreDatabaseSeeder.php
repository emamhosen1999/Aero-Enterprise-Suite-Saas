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
        $this->command->info('🌱 Seeding Core database...');
        
        $this->seedDefaultRole();
        $this->seedDefaultUser();
        $this->seedSystemSettings();
        
        $this->command->info('✅ Core database seeding completed!');
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

        // Check if Super Administrator role exists
        $superAdminRole = DB::table('roles')
            ->where('name', 'Super Administrator')
            ->where('guard_name', 'web')
            ->first();

        if ($superAdminRole) {
            $this->command->info("✓ Super Administrator role already exists (ID: {$superAdminRole->id})");
            return;
        }

        // Create Super Administrator role
        $roleData = [
            'name' => 'Super Administrator',
            'guard_name' => 'web',
            'created_at' => now(),
            'updated_at' => now(),
        ];

        // Add optional columns if they exist
        $columns = $this->getTableColumns('roles');
        
        if (in_array('description', $columns)) {
            $roleData['description'] = 'Full system access with all privileges';
        }
        
        if (in_array('is_protected', $columns)) {
            $roleData['is_protected'] = true;
        }
        
        if (in_array('scope', $columns)) {
            $roleData['scope'] = 'platform';
        }

        DB::table('roles')->insert($roleData);

        $this->command->info('✓ Super Administrator role created');
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
        $existingUser = DB::table('users')->where('email', 'admin@example.com')->first();
        
        if ($existingUser) {
            $this->command->info("✓ Admin user already exists (ID: {$existingUser->id})");
            
            // Ensure role is assigned
            $this->assignSuperAdminRole($existingUser->id);
            return;
        }

        // Build user data with only columns that exist
        $userData = [
            'name' => 'Super Admin',
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
        
        if (in_array('is_super_admin', $columns)) {
            $userData['is_super_admin'] = true;
        }
        
        if (in_array('status', $columns)) {
            $userData['status'] = 'active';
        }

        $userId = DB::table('users')->insertGetId($userData);

        $this->command->info("✓ Admin user created (ID: {$userId})");
        $this->command->info("  📧 Email: admin@example.com");
        $this->command->info("  🔑 Password: password");

        // Assign Super Administrator role
        $this->assignSuperAdminRole($userId);
    }

    /**
     * Assign Super Administrator role to user
     */
    protected function assignSuperAdminRole(int $userId): void
    {
        if (!$this->tableExists('roles') || !$this->tableExists('model_has_roles')) {
            $this->command->warn('Roles or model_has_roles table not found. Skipping role assignment.');
            return;
        }

        // Find Super Administrator role
        $superAdminRole = DB::table('roles')
            ->where('name', 'Super Administrator')
            ->where('guard_name', 'web')
            ->first();
        
        if (!$superAdminRole) {
            $this->command->warn('Super Administrator role not found. Cannot assign role.');
            return;
        }

        // Check if role assignment already exists
        $exists = DB::table('model_has_roles')
            ->where('role_id', $superAdminRole->id)
            ->where('model_type', 'Aero\Core\Models\User')
            ->where('model_id', $userId)
            ->exists();
        
        if ($exists) {
            $this->command->info('✓ Super Administrator role already assigned');
            return;
        }

        // Assign role
        DB::table('model_has_roles')->insert([
            'role_id' => $superAdminRole->id,
            'model_type' => 'Aero\Core\Models\User',
            'model_id' => $userId,
        ]);
        
        $this->command->info('✓ Super Administrator role assigned to user');
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
