<?php

namespace Database\Seeders;

use App\Models\HRM\Department;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class DepartmentSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
        $this->command->info('Starting Department seeding...');

        try {
            // Check if departments table exists and has the correct structure
            if (! Schema::hasTable('departments')) {
                $this->command->error('Departments table does not exist. Please run migrations first.');

                return;
            }

            // Check if the table has all required columns
            $columns = Schema::getColumnListing('departments');
            $requiredColumns = ['name', 'code', 'description', 'parent_id', 'manager_id', 'location', 'is_active', 'established_date'];
            $missingColumns = array_diff($requiredColumns, $columns);

            if (! empty($missingColumns)) {
                $this->command->error('Departments table is missing required columns: '.implode(', ', $missingColumns));
                $this->command->info('Available columns: '.implode(', ', $columns));
                $this->command->info('Please update your migration to include all required columns.');

                return;
            }

            // Instead of truncating, we'll use a safer approach
            // Disable foreign key checks temporarily
            $this->command->info('Disabling foreign key checks...');
            DB::statement('SET FOREIGN_KEY_CHECKS=0');

            // Clear existing departments safely
            $this->command->info('Clearing existing departments...');
            $deletedCount = Department::query()->delete();
            $this->command->info("Deleted {$deletedCount} existing departments.");

            // Re-enable foreign key checks
            $this->command->info('Re-enabling foreign key checks...');
            DB::statement('SET FOREIGN_KEY_CHECKS=1');

            // Create parent departments
            $departments = [
                [
                    'name' => 'Executive Management',
                    'code' => 'EXEC',
                    'description' => 'Executive leadership and management team',
                    'location' => 'Headquarters',
                    'is_active' => true,
                    'established_date' => '2020-01-01',
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
                [
                    'name' => 'Human Resources',
                    'code' => 'HR',
                    'description' => 'HR department handling employee management and development',
                    'location' => 'Headquarters',
                    'is_active' => true,
                    'established_date' => '2020-01-15',
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
                [
                    'name' => 'Finance',
                    'code' => 'FIN',
                    'description' => 'Financial management and accounting',
                    'location' => 'Headquarters',
                    'is_active' => true,
                    'established_date' => '2020-01-15',
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
                [
                    'name' => 'Information Technology',
                    'code' => 'IT',
                    'description' => 'Technology services and support',
                    'location' => 'Tech Center',
                    'is_active' => true,
                    'established_date' => '2020-02-01',
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
                [
                    'name' => 'Marketing',
                    'code' => 'MKT',
                    'description' => 'Marketing, branding, and communications',
                    'location' => 'Marketing Building',
                    'is_active' => true,
                    'established_date' => '2020-02-15',
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
                [
                    'name' => 'Operations',
                    'code' => 'OPS',
                    'description' => 'Operational management and logistics',
                    'location' => 'Operations Center',
                    'is_active' => true,
                    'established_date' => '2020-03-01',
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
                [
                    'name' => 'Research & Development',
                    'code' => 'R&D',
                    'description' => 'Product research and development',
                    'location' => 'R&D Lab',
                    'is_active' => true,
                    'established_date' => '2020-04-01',
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
                [
                    'name' => 'Sales',
                    'code' => 'SALES',
                    'description' => 'Sales and business development',
                    'location' => 'Sales Office',
                    'is_active' => true,
                    'established_date' => '2020-05-01',
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
                [
                    'name' => 'Customer Support',
                    'code' => 'CS',
                    'description' => 'Customer service and support',
                    'location' => 'Support Center',
                    'is_active' => true,
                    'established_date' => '2020-06-01',
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
                [
                    'name' => 'Legal',
                    'code' => 'LEGAL',
                    'description' => 'Legal affairs and compliance',
                    'location' => 'Headquarters',
                    'is_active' => true,
                    'established_date' => '2020-07-01',
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
                [
                    'name' => 'Quality Assurance',
                    'code' => 'QA',
                    'description' => 'Quality management and assurance',
                    'location' => 'QA Center',
                    'is_active' => true,
                    'established_date' => '2021-01-15',
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
                [
                    'name' => 'Facilities Management',
                    'code' => 'FAC',
                    'description' => 'Facilities and building management',
                    'location' => 'Headquarters',
                    'is_active' => false, // Example of inactive department
                    'established_date' => '2021-02-01',
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
            ];

            // Insert parent departments
            $this->command->info('Inserting '.count($departments).' parent departments...');
            try {
                Department::insert($departments);
                $this->command->info('Parent departments inserted successfully.');
            } catch (\Exception $e) {
                $this->command->error('Error inserting parent departments: '.$e->getMessage());
                // Re-enable foreign key checks before exiting
                DB::statement('SET FOREIGN_KEY_CHECKS=1');

                return;
            }

            // Get parent department IDs
            $hr = Department::where('code', 'HR')->first();
            $it = Department::where('code', 'IT')->first();
            $fin = Department::where('code', 'FIN')->first();
            $ops = Department::where('code', 'OPS')->first();

            // If parent departments don't exist, exit early
            if (! $hr || ! $it || ! $fin || ! $ops) {
                $this->command->error('Parent departments were not properly created. Cannot create child departments.');

                return;
            }

            // Create child departments
            $childDepartments = [
                // HR sub-departments
                [
                    'name' => 'Recruitment',
                    'code' => 'HR-REC',
                    'description' => 'Talent acquisition and recruitment',
                    'parent_id' => $hr->id,
                    'location' => 'Headquarters',
                    'is_active' => true,
                    'established_date' => '2020-03-15',
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
                [
                    'name' => 'Training & Development',
                    'code' => 'HR-T&D',
                    'description' => 'Employee training and professional development',
                    'parent_id' => $hr->id,
                    'location' => 'Headquarters',
                    'is_active' => true,
                    'established_date' => '2020-04-15',
                    'created_at' => now(),
                    'updated_at' => now(),
                ],

                // IT sub-departments
                [
                    'name' => 'IT Support',
                    'code' => 'IT-SUP',
                    'description' => 'Technical support and helpdesk',
                    'parent_id' => $it->id,
                    'location' => 'Tech Center',
                    'is_active' => true,
                    'established_date' => '2020-05-15',
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
                [
                    'name' => 'IT Infrastructure',
                    'code' => 'IT-INF',
                    'description' => 'Network and server management',
                    'parent_id' => $it->id,
                    'location' => 'Tech Center',
                    'is_active' => true,
                    'established_date' => '2020-06-15',
                    'created_at' => now(),
                    'updated_at' => now(),
                ],

                // Finance sub-departments
                [
                    'name' => 'Accounting',
                    'code' => 'FIN-ACC',
                    'description' => 'Accounting and financial reporting',
                    'parent_id' => $fin->id,
                    'location' => 'Headquarters',
                    'is_active' => true,
                    'established_date' => '2020-07-15',
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
                [
                    'name' => 'Payroll',
                    'code' => 'FIN-PAY',
                    'description' => 'Employee payroll management',
                    'parent_id' => $fin->id,
                    'location' => 'Headquarters',
                    'is_active' => true,
                    'established_date' => '2020-08-15',
                    'created_at' => now(),
                    'updated_at' => now(),
                ],

                // Operations sub-departments
                [
                    'name' => 'Logistics',
                    'code' => 'OPS-LOG',
                    'description' => 'Supply chain and logistics management',
                    'parent_id' => $ops->id,
                    'location' => 'Operations Center',
                    'is_active' => true,
                    'established_date' => '2020-09-15',
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
                [
                    'name' => 'Warehouse',
                    'code' => 'OPS-WH',
                    'description' => 'Warehouse operations and inventory management',
                    'parent_id' => $ops->id,
                    'location' => 'Warehouse',
                    'is_active' => true,
                    'established_date' => '2020-10-15',
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
            ];

            // Insert child departments
            $this->command->info('Inserting '.count($childDepartments).' child departments...');
            try {
                Department::insert($childDepartments);
                $this->command->info('Child departments inserted successfully.');
            } catch (\Exception $e) {
                $this->command->error('Error inserting child departments: '.$e->getMessage());
                // Continue execution since parent departments were already inserted
            }

            $this->command->info('Department seeding completed successfully.');
            $this->command->info('Total departments created: '.Department::count());
        } catch (\Exception $e) {
            $this->command->error('An unexpected error occurred: '.$e->getMessage());
            // Make sure foreign key checks are re-enabled
            DB::statement('SET FOREIGN_KEY_CHECKS=1');
        }
    }
}
