<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
/**
 * Tenant Database Seeder
 *
 * This seeder runs when a new tenant is created or when seeding a tenant database.
 * It populates tenant-specific tables with initial data.
 *
 * Modules/SubModules/Components/Actions are stored in the LANDLORD database.
 * This seeder creates:
 * 1. Permissions - linked to module hierarchy via ModulePermission
 * 2. Default roles for the tenant
 * 3. Default tenant settings
 */
class TenantDatabaseSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $this->command?->info('🌱 Running Tenant Database Seeder...');

    
        // 2. Create default tenant roles with permissions
        $this->seedDefaultRoles();

        // 3. Seed Finance module sample data (optional - can be skipped in production)
        if ($this->command?->confirm('Seed Finance module with sample data?', false)) {
            $this->call(FinanceSeeder::class);
        }

        // 4. Seed Integrations module sample data (optional - can be skipped in production)
        if ($this->command?->confirm('Seed Integrations module with sample data?', false)) {
            $this->call(IntegrationsSeeder::class);
        }

        $this->command?->info('✅ Tenant database seeded successfully!');
    }

    /**
     * Seed default roles for the tenant.
     */
    protected function seedDefaultRoles(): void
    {
        $this->command?->info('📋 Creating default tenant roles...');

        // Default roles that every tenant should have
        $defaultRoles = [
            [
                'name' => 'Super Administrator',
                'description' => 'Full access to all tenant features',
                'is_protected' => true,
                
            ],
            [
                'name' => 'Administrator',
                'description' => 'Administrative access with most features',
                'is_protected' => false,
               
            ],
            [
                'name' => 'HR Manager',
                'description' => 'Human Resources management access',
                'is_protected' => false,
              
            ],
            [
                'name' => 'Employee',
                'description' => 'Basic employee access - self-service features',
                'is_protected' => false,
               
            ],
        ];

        foreach ($defaultRoles as $roleData) {
            Role::firstOrCreate(
                ['name' => $roleData['name'], 'guard_name' => 'web'],
                ['is_protected' => $roleData['is_protected'] ?? false]
            );
        
        }

        $this->command?->info('   ✓ Default roles created');
    }
}
